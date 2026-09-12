const mongoose = require("mongoose");
const Competition = require("../models/Competition");
const Question = require("../models/Question");
const QuizAttempt = require("../models/QuizAttempt");
const Result = require("../models/Result");

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// Combines a competition's startDate (date-only) with its startTime ("HH:MM")
// into one real Date object representing exactly when the quiz becomes available.
function getScheduledStart(competition) {
  const datePart = new Date(competition.startDate).toISOString().slice(0, 10); // "YYYY-MM-DD"
  const [hours, minutes] = (competition.startTime || "00:00").split(":").map(Number);
  const scheduled = new Date(`${datePart}T00:00:00`);
  scheduled.setHours(hours || 0, minutes || 0, 0, 0);
  return scheduled;
}

// @route POST /api/quiz/:competitionId/start  (student)
exports.startAttempt = async (req, res) => {
  try {
    const { competitionId } = req.params;
    const studentId = req.user.id;

    const competition = await Competition.findById(competitionId);
    if (!competition) return res.status(404).json({ message: "Competition not found" });
    if (competition.status !== "active") {
      return res.status(400).json({ message: "This competition is not currently active" });
    }

    const existing = await QuizAttempt.findOne({ student: studentId, competition: competitionId });
    if (existing) {
      if (existing.status === "submitted") {
        return res.status(409).json({ message: "You have already submitted this quiz" });
      }
      // Resume an in-progress attempt (e.g. page reload) instead of creating a duplicate
      const questions = await Question.find({ _id: { $in: existing.questionOrder } });
      return res.json({ attempt: buildAttemptResponse(existing, questions, competition) });
    }

    const scheduledStart = getScheduledStart(competition);
    if (Date.now() < scheduledStart.getTime()) {
      return res.status(403).json({
        message: "This quiz has not started yet.",
        scheduledStart,
      });
    }

    const allQuestions = await Question.find({ competition: competitionId });
    if (allQuestions.length < competition.numberOfQuestions) {
      return res.status(400).json({ message: "Not enough questions configured for this competition" });
    }

    const selected = shuffle(allQuestions).slice(0, competition.numberOfQuestions);
    const questionOrder = selected.map((q) => q._id);

    const attempt = await QuizAttempt.create({
      student: studentId,
      competition: competitionId,
      questionOrder,
      answers: questionOrder.map((qid) => ({ question: qid, selectedOptionIndex: null })),
      startedAt: new Date(),
      status: "in_progress",
    });

    res.status(201).json({ attempt: buildAttemptResponse(attempt, selected, competition) });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Attempt already exists for this competition" });
    }
    res.status(500).json({ message: "Failed to start quiz", error: err.message });
  }
};

function buildAttemptResponse(attempt, questions, competition) {
  const questionsById = new Map(questions.map((q) => [String(q._id), q]));
  const orderedQuestions = attempt.questionOrder.map((qid) => {
    const q = questionsById.get(String(qid));
    return {
      id: q._id,
      questionText: q.questionText,
      options: q.options,
      marks: q.marks,
    };
  });
  const answersByQuestion = new Map(attempt.answers.map((a) => [String(a.question), a.selectedOptionIndex]));

  return {
    attemptId: attempt._id,
    competitionName: competition.name,
    durationMinutes: competition.durationMinutes,
    startedAt: attempt.startedAt,
    questions: orderedQuestions,
    savedAnswers: orderedQuestions.map((q) => ({
      questionId: q.id,
      selectedOptionIndex: answersByQuestion.get(String(q.id)) ?? null,
    })),
  };
}

// @route PATCH /api/quiz/:attemptId/answer  (student) - auto-save one answer
exports.saveAnswer = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { questionId, selectedOptionIndex } = req.body;

    const attempt = await QuizAttempt.findById(attemptId);
    if (!attempt) return res.status(404).json({ message: "Attempt not found" });
    if (String(attempt.student) !== req.user.id) return res.status(403).json({ message: "Forbidden" });
    if (attempt.status === "submitted") return res.status(409).json({ message: "Quiz already submitted" });

    const answerEntry = attempt.answers.find((a) => String(a.question) === String(questionId));
    if (!answerEntry) return res.status(400).json({ message: "Question not part of this attempt" });

    answerEntry.selectedOptionIndex = selectedOptionIndex;
    await attempt.save();

    res.json({ message: "Answer saved" });
  } catch (err) {
    res.status(500).json({ message: "Failed to save answer", error: err.message });
  }
};

// Shared scoring + Result creation, used by both normal and auto submission
async function finalizeSubmission(attempt, { submissionType, violationReason }) {
  const questions = await Question.find({ _id: { $in: attempt.questionOrder } });
  const correctByQuestion = new Map(questions.map((q) => [String(q._id), q.correctOptionIndex]));
  const marksByQuestion = new Map(questions.map((q) => [String(q._id), q.marks || 1]));

  let attempted = 0;
  let correct = 0;
  let score = 0;

  for (const a of attempt.answers) {
    if (a.selectedOptionIndex === null || a.selectedOptionIndex === undefined) continue;
    attempted += 1;
    const correctIndex = correctByQuestion.get(String(a.question));
    if (a.selectedOptionIndex === correctIndex) {
      correct += 1;
      score += marksByQuestion.get(String(a.question)) || 1;
    }
  }

  const totalQuestions = attempt.questionOrder.length;
  const wrong = attempted - correct;
  const unattempted = totalQuestions - attempted;
  const maxScore = questions.reduce((sum, q) => sum + (q.marks || 1), 0);
  const percentage = maxScore > 0 ? Number(((score / maxScore) * 100).toFixed(2)) : 0;
  const timeTakenSeconds = Math.max(0, Math.round((Date.now() - attempt.startedAt.getTime()) / 1000));

  attempt.status = "submitted";
  attempt.submittedAt = new Date();
  attempt.submissionType = submissionType;
  attempt.violationReason = violationReason || null;
  await attempt.save();

  const result = await Result.create({
    attempt: attempt._id,
    student: attempt.student,
    competition: attempt.competition,
    totalQuestions,
    attempted,
    correct,
    wrong,
    unattempted,
    score,
    percentage,
    timeTakenSeconds,
    submissionType,
    violationReason: violationReason || null,
  });

  return result;
}

// @route POST /api/quiz/:attemptId/submit  (student) - normal submission
exports.submitAttempt = async (req, res) => {
  try {
    const attempt = await QuizAttempt.findById(req.params.attemptId);
    if (!attempt) return res.status(404).json({ message: "Attempt not found" });
    if (String(attempt.student) !== req.user.id) return res.status(403).json({ message: "Forbidden" });
    if (attempt.status === "submitted") return res.status(409).json({ message: "Already submitted" });

    const result = await finalizeSubmission(attempt, { submissionType: "NORMAL", violationReason: null });
    res.json({ message: "Quiz submitted", result });
  } catch (err) {
    res.status(500).json({ message: "Failed to submit quiz", error: err.message });
  }
};

// @route POST /api/quiz/:attemptId/auto-submit  (student) - security engine trigger
// violationReason: TAB_SWITCH | FULLSCREEN_EXIT | WINDOW_BLUR | TIME_EXPIRED
exports.autoSubmitAttempt = async (req, res) => {
  try {
    const { violationReason } = req.body;
    const allowedReasons = ["TAB_SWITCH", "FULLSCREEN_EXIT", "WINDOW_BLUR", "TIME_EXPIRED"];
    if (!allowedReasons.includes(violationReason)) {
      return res.status(400).json({ message: "Invalid violationReason" });
    }

    const attempt = await QuizAttempt.findById(req.params.attemptId);
    if (!attempt) return res.status(404).json({ message: "Attempt not found" });
    if (String(attempt.student) !== req.user.id) return res.status(403).json({ message: "Forbidden" });
    if (attempt.status === "submitted") {
      // Already submitted (e.g. duplicate event fired) - just return existing result, not an error
      return res.json({ message: "Already submitted", alreadySubmitted: true });
    }

    const result = await finalizeSubmission(attempt, { submissionType: "AUTO_SUBMITTED", violationReason });
    res.json({ message: "Quiz automatically submitted", result });
  } catch (err) {
    res.status(500).json({ message: "Failed to auto-submit quiz", error: err.message });
  }
};

// @route GET /api/quiz/:attemptId/result  (student - own result only)
exports.getResult = async (req, res) => {
  try {
    const result = await Result.findOne({ attempt: req.params.attemptId }).populate("competition", "name");
    if (!result) return res.status(404).json({ message: "Result not found" });
    if (String(result.student) !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    res.json({ result });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch result", error: err.message });
  }
};
