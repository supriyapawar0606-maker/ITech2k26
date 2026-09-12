import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ClipboardList, CheckCircle2, Clock3 } from "lucide-react";
import api from "../api/axios";

const RULES = [
  "Answers are automatically saved.",
  "Do not switch browser tabs.",
  "Do not leave the quiz window.",
  "Do not exit fullscreen mode.",
  "Leaving the quiz may automatically submit your answers.",
  "Once submitted, the quiz cannot be restarted.",
];

// Combines a competition's startDate (date-only) with its startTime ("HH:MM")
// into one real Date — mirrors the same calculation the backend enforces.
function getScheduledStart(competition) {
  if (!competition) return null;
  const datePart = new Date(competition.startDate).toISOString().slice(0, 10);
  const [hours, minutes] = (competition.startTime || "00:00").split(":").map(Number);
  const scheduled = new Date(`${datePart}T00:00:00`);
  scheduled.setHours(hours || 0, minutes || 0, 0, 0);
  return scheduled;
}

function formatCountdown(ms) {
  if (ms <= 0) return "00:00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const s = String(totalSeconds % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

export default function QuizInstructions() {
  const { competitionId } = useParams();
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);
  const [competition, setCompetition] = useState(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    api.get("/competitions").then((res) => {
      const found = res.data.competitions.find((c) => c._id === competitionId);
      setCompetition(found || null);
    }).catch(() => {});
  }, [competitionId]);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const scheduledStart = getScheduledStart(competition);
  const hasNotStartedYet = scheduledStart && now < scheduledStart.getTime();

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-3xl">
        <button onClick={() => navigate("/dashboard")} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-navy-900 mb-4 transition-colors">
          <ArrowLeft size={15} /> Back to Dashboard
        </button>

        <div className="card p-8">
          <h1 className="text-xl font-semibold text-navy-900 mb-6">Quiz Instructions</h1>

          <div className="grid sm:grid-cols-2 gap-6 mb-7">
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Overview</div>
              <div className="space-y-3 text-sm">
                <Row label="Total Questions" value={competition?.numberOfQuestions ?? "—"} />
                <Row label="Duration" value={competition ? `${competition.durationMinutes} Minutes` : "—"} />
                <Row label="Starts At" value={scheduledStart ? scheduledStart.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"} />
                <Row label="Marks per Question" value={competition?.marksPerQuestion ?? 1} />
                <Row label="Negative Marking" value={competition?.negativeMarking ? "Yes" : "No"} />
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <ClipboardList size={14} /> Important Rules
              </div>
              <ul className="space-y-2.5 text-sm text-slate-600">
                {RULES.map((rule, i) => (
                  <li key={i} className="flex gap-2">
                    <CheckCircle2 size={16} className="text-success shrink-0 mt-0.5" />
                    {rule}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {hasNotStartedYet ? (
            <div className="flex items-center gap-3 bg-amber-50 text-warning rounded-lg px-4 py-3.5 mb-5">
              <Clock3 size={20} className="shrink-0" />
              <div className="text-sm">
                <div className="font-semibold">This quiz hasn't started yet.</div>
                <div>
                  Starts in <span className="font-mono font-semibold">{formatCountdown(scheduledStart.getTime() - now)}</span> — at{" "}
                  {scheduledStart.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          ) : (
            <label className="flex items-center gap-2 text-sm mb-5 bg-slate-50 rounded-lg px-4 py-3">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="accent-brand w-4 h-4" />
              I have read and understood the instructions
            </label>
          )}

          <button
            disabled={!agreed || hasNotStartedYet}
            onClick={() => navigate(`/quiz/${competitionId}/attempt`)}
            className="btn-primary w-full py-3"
          >
            {hasNotStartedYet ? "Not Started Yet" : "Start Quiz"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-navy-900">{value}</span>
    </div>
  );
}
