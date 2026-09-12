const Question = require("../models/Question");

// Strip the correct answer before sending to students
const toStudentView = (q) => ({
  id: q._id,
  questionText: q.questionText,
  options: q.options,
  category: q.category,
  marks: q.marks,
});

// @route POST /api/questions  (admin)
exports.createQuestion = async (req, res) => {
  try {
    const { competition, questionText, options, correctOptionIndex, category, marks } = req.body;

    if (!competition || !questionText || !options || correctOptionIndex === undefined) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    if (!Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ message: "At least 2 options required" });
    }
    if (correctOptionIndex < 0 || correctOptionIndex >= options.length) {
      return res.status(400).json({ message: "correctOptionIndex out of range" });
    }

    const question = await Question.create({
      competition,
      questionText,
      options,
      correctOptionIndex,
      category,
      marks: marks || 1,
    });

    res.status(201).json({ question });
  } catch (err) {
    res.status(500).json({ message: "Failed to create question", error: err.message });
  }
};

// @route GET /api/questions?competition=<id>  (admin sees answers, student does not)
exports.listQuestions = async (req, res) => {
  try {
    const { competition, category } = req.query;
    const filter = {};
    if (competition) filter.competition = competition;
    if (category && category !== "All") filter.category = category;

    const questions = await Question.find(filter).sort({ createdAt: 1 });

    if (req.user.role === "admin") {
      return res.json({ questions });
    }
    res.json({ questions: questions.map(toStudentView) });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch questions", error: err.message });
  }
};

// @route PUT /api/questions/:id  (admin)
exports.updateQuestion = async (req, res) => {
  try {
    const question = await Question.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!question) return res.status(404).json({ message: "Question not found" });
    res.json({ question });
  } catch (err) {
    res.status(500).json({ message: "Failed to update question", error: err.message });
  }
};

// @route DELETE /api/questions/:id  (admin)
exports.deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findByIdAndDelete(req.params.id);
    if (!question) return res.status(404).json({ message: "Question not found" });
    res.json({ message: "Question deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete question", error: err.message });
  }
};

// @route POST /api/questions/bulk  (admin) - import multiple questions at once
exports.bulkImportQuestions = async (req, res) => {
  try {
    const { competition, questions } = req.body;
    if (!competition || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: "competition and a non-empty questions array are required" });
    }
    const docs = questions.map((q) => ({ ...q, competition }));
    const created = await Question.insertMany(docs);
    res.status(201).json({ count: created.length, questions: created });
  } catch (err) {
    res.status(500).json({ message: "Bulk import failed", error: err.message });
  }
};
