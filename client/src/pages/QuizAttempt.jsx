import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, Maximize, Clock3 } from "lucide-react";
import api from "../api/axios";
import useSecurityMonitor from "../hooks/useSecurityMonitor";
import useCountdown from "../hooks/useCountdown";
import Logo from "../components/Logo";

const VIOLATION_LABELS = {
  TAB_SWITCH: "You left the quiz window or switched to another browser tab. Your quiz has been automatically submitted according to the competition rules.",
  FULLSCREEN_EXIT: "You exited fullscreen mode during the quiz. Your quiz has been automatically submitted according to the competition rules.",
  WINDOW_BLUR: "The quiz window lost focus. Your quiz has been automatically submitted according to the competition rules.",
  TIME_EXPIRED: "Your allotted time for this quiz has ended and your answers were submitted automatically.",
};

export default function QuizAttempt() {
  const { competitionId } = useParams();
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [violation, setViolation] = useState(null);
  const [resultReady, setResultReady] = useState(null);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { enterFullscreen } = useSecurityMonitor({ active: false, onViolation: () => {} });

  // Guards against firing /start twice for the same competition. This matters because
  // React.StrictMode (see main.jsx) intentionally mounts effects twice in development,
  // which was sending two POST /start requests back-to-back. The backend's unique
  // (student, competition) index correctly rejected the second insert, but whichever
  // response happened to land second would call setError() unconditionally (below) and
  // overwrite a perfectly successful first attempt with "Attempt already exists" — so
  // the very first time a student opened the quiz, it looked like it had failed to start.
  //
  // NOTE: this ref is also what the .then/.catch below check instead of a separate
  // "mounted" flag. A per-effect "mounted" boolean would get set to false by the
  // cleanup that Strict Mode runs on its *first* mount-cleanup-remount pass, even
  // though that first run is the one whose request actually goes out — so the real
  // response would arrive, find "mounted" already false, and silently bail out before
  // ever calling setLoading(false). Checking startedForRef here avoids that: it only
  // changes when the student genuinely navigates to a different competitionId.
  const startedForRef = useRef(null);

  useEffect(() => {
    if (startedForRef.current === competitionId) return;
    startedForRef.current = competitionId;

    api
      .post(`/quiz/${competitionId}/start`)
      .then((res) => {
        if (startedForRef.current !== competitionId) return;
        const data = res.data.attempt;
        setAttempt(data);
        const initial = {};
        data.savedAnswers.forEach((a) => (initial[a.questionId] = a.selectedOptionIndex));
        setAnswers(initial);
        setLoading(false);
        const el = document.documentElement;
        if (el.requestFullscreen) el.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
      })
      .catch((err) => {
        if (startedForRef.current !== competitionId) return;
        setError(err.response?.data?.message || "Could not start quiz");
        setLoading(false);
      });
  }, [competitionId]);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const finalizeSubmission = useCallback(
    async (payload) => {
      if (!attempt) return;
      setSubmitting(true);
      try {
        const { data } = payload.violationReason
          ? await api.post(`/quiz/${attempt.attemptId}/auto-submit`, { violationReason: payload.violationReason })
          : await api.post(`/quiz/${attempt.attemptId}/submit`);
        if (document.fullscreenElement && document.exitFullscreen) {
          await document.exitFullscreen().catch(() => {});
        }
        if (payload.violationReason) {
          setResultReady(data.result);
        } else {
          navigate(`/quiz/${attempt.attemptId}/result`, { state: { result: data.result } });
        }
      } catch (err) {
        setError(err.response?.data?.message || "Submission failed");
        setSubmitting(false);
      }
    },
    [attempt, navigate]
  );

  const handleViolation = useCallback((reason) => {
    setViolation({ reason });
  }, []);

  useSecurityMonitor({ active: !!attempt && !submitting && !violation, onViolation: handleViolation });

  const timer = useCountdown({
    startedAt: attempt?.startedAt,
    durationMinutes: attempt?.durationMinutes,
    onExpire: () => setViolation({ reason: "TIME_EXPIRED" }),
  });

  useEffect(() => {
    if (violation && !submitting && !resultReady) {
      finalizeSubmission({ violationReason: violation.reason });
    }
  }, [violation, submitting, resultReady, finalizeSubmission]);

  const saveAnswer = async (questionId, selectedOptionIndex) => {
    setAnswers((prev) => ({ ...prev, [questionId]: selectedOptionIndex }));
    try {
      await api.patch(`/quiz/${attempt.attemptId}/answer`, { questionId, selectedOptionIndex });
    } catch {
      // Auto-save failure is non-fatal; the selection still shows locally
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500">Loading quiz...</div>;
  if (error && !attempt) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="card p-8 max-w-sm text-center">
          <p className="text-danger font-medium mb-4">{error}</p>
          <button className="btn-primary w-full" onClick={() => navigate("/dashboard")}>Back to Dashboard</button>
        </div>
      </div>
    );
  }
  if (!attempt) return null;

  const question = attempt.questions[currentIndex];
  const answeredCount = Object.values(answers).filter((v) => v !== null && v !== undefined).length;

  return (
    <div className="min-h-screen bg-canvas">
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3.5 flex items-center justify-between sticky top-0 z-10">
        <Logo />
        <div className="text-sm font-medium text-slate-500 hidden sm:block">{attempt.competitionName}</div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 font-mono font-semibold text-base px-3 py-1.5 rounded-lg ${timer.secondsLeft < 60 ? "bg-red-50 text-danger" : "bg-brand-50 text-brand"}`}>
            <Clock3 size={16} /> {timer.display}
          </div>
          <button
            onClick={() => (isFullscreen ? document.exitFullscreen?.() : enterFullscreen())}
            className="btn-secondary text-xs py-1.5 px-3 hidden sm:inline-flex"
          >
            <Maximize size={14} /> Fullscreen
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        <div className="card p-4 sm:p-7">
          <div className="flex justify-between items-center text-sm text-slate-500 mb-4">
            <span className="font-medium text-navy-900">Question {currentIndex + 1} of {attempt.questions.length}</span>
            <span className="text-xs text-success flex items-center gap-1">● Auto-saved</span>
          </div>
          <h2 className="text-lg font-medium text-navy-900 mb-6">{question.questionText}</h2>

          <div className="space-y-2.5 mb-8">
            {question.options.map((opt, i) => (
              <label
                key={i}
                className={`flex items-center gap-3 border rounded-xl px-4 py-3.5 cursor-pointer transition-colors ${
                  answers[question.id] === i ? "border-brand bg-brand-50" : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name={`q-${question.id}`}
                  checked={answers[question.id] === i}
                  onChange={() => saveAnswer(question.id, i)}
                  className="accent-brand w-4 h-4"
                />
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${answers[question.id] === i ? "bg-brand text-white" : "bg-slate-100 text-slate-500"}`}>
                  {String.fromCharCode(65 + i)}
                </span>
                {opt}
              </label>
            ))}
          </div>

          <div className="flex justify-between">
            <button
              className="btn-secondary"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            >
              Previous
            </button>
            {currentIndex === attempt.questions.length - 1 ? (
              <button className="btn-primary" onClick={() => setShowSubmitConfirm(true)}>Submit Quiz</button>
            ) : (
              <button
                className="btn-primary"
                onClick={() => setCurrentIndex((i) => Math.min(attempt.questions.length - 1, i + 1))}
              >
                Next
              </button>
            )}
          </div>
        </div>

        <div className="card p-5 h-fit">
          <div className="text-sm font-semibold text-navy-900 mb-4">Question Navigator</div>
          <div className="grid grid-cols-5 gap-2 mb-5">
            {attempt.questions.map((q, i) => {
              const isAnswered = answers[q.id] !== null && answers[q.id] !== undefined;
              const isCurrent = i === currentIndex;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(i)}
                  className={`w-9 h-9 rounded-lg text-xs font-semibold transition-colors ${
                    isCurrent
                      ? "bg-brand text-white"
                      : isAnswered
                      ? "bg-success/15 text-success"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
          <div className="space-y-1.5 text-xs text-slate-500 mb-5">
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-brand inline-block" /> Current</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-success/15 inline-block" /> Answered</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-slate-100 inline-block" /> Not Answered</div>
          </div>
          <div className="text-xs text-slate-500 mb-4 border-t border-slate-100 pt-4">
            Answered: <span className="font-semibold text-navy-900">{answeredCount} / {attempt.questions.length}</span>
          </div>
          <button className="btn-primary w-full" onClick={() => setShowSubmitConfirm(true)}>
            Submit Quiz
          </button>
        </div>
      </div>

      {showSubmitConfirm && (
        <Modal>
          <h3 className="font-semibold text-lg mb-2 text-navy-900">Submit Quiz?</h3>
          <p className="text-sm text-slate-500 mb-5">Are you sure you want to submit? This cannot be undone.</p>
          <div className="flex gap-3 justify-end">
            <button className="btn-secondary" onClick={() => setShowSubmitConfirm(false)}>Cancel</button>
            <button className="btn-primary" disabled={submitting} onClick={() => finalizeSubmission({})}>
              {submitting ? "Submitting..." : "Yes, Submit"}
            </button>
          </div>
        </Modal>
      )}

      {violation && (
        <Modal>
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-danger/10 text-danger flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={30} />
            </div>
            <h3 className="font-semibold text-lg mb-2 text-navy-900">Quiz Automatically Submitted</h3>
            <p className="text-sm text-slate-500 mb-4">{VIOLATION_LABELS[violation.reason]}</p>
            <div className="bg-slate-50 rounded-lg p-4 text-left text-sm mb-5 space-y-1.5">
              <div><span className="text-slate-500">Submission Type: </span><span className="font-semibold text-navy-900">AUTO SUBMITTED</span></div>
              <div><span className="text-slate-500">Reason: </span><span className="font-semibold text-danger">{violation.reason.replace(/_/g, " ")}</span></div>
            </div>
            <button
              className="btn-primary w-full"
              disabled={!resultReady}
              onClick={() => navigate(`/quiz/${attempt.attemptId}/result`, { state: { result: resultReady } })}
            >
              {resultReady ? "View Result" : "Submitting..."}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ children }) {
  return (
    <div className="fixed inset-0 bg-navy-950/60 backdrop-blur-sm flex items-center justify-center px-4 z-50">
      <div className="card p-7 w-full max-w-sm">{children}</div>
    </div>
  );
}
