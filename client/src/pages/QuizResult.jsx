import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { Trophy } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { formatTimeTaken } from "../utils/formatDuration";

export default function QuizResult() {
  const { attemptId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [result, setResult] = useState(location.state?.result || null);

  useEffect(() => {
    if (result) return;
    api.get(`/quiz/${attemptId}/result`).then((res) => setResult(res.data.result)).catch(() => {});
  }, [attemptId, result]);

  if (!result) return <div className="min-h-screen flex items-center justify-center text-slate-500">Loading result...</div>;

  const pct = result.percentage ?? Math.round((result.score / result.totalQuestions) * 100);
  const gaugeStyle = {
    background: `conic-gradient(#2563EB ${pct * 3.6}deg, #E2E8F0 0deg)`,
  };

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center px-4 py-10">
      <div className="card w-full max-w-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl bg-warning/15 text-warning flex items-center justify-center">
            <Trophy size={22} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-navy-900">Quiz Result</h1>
            <p className="text-sm text-slate-500">{user?.fullName} · {result.competitionName || "Quiz Competition"}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-7">
          <Stat label="Total Questions" value={result.totalQuestions} />
          <Stat label="Attempted" value={result.attempted} />
          <Stat label="Correct" value={result.correct} accent="text-success" />
          <Stat label="Wrong" value={result.wrong} accent="text-danger" />
          <Stat label="Unattempted" value={result.unattempted} />
        </div>

        <div className="grid sm:grid-cols-[1fr_auto] gap-6 items-center bg-slate-50 rounded-2xl p-6 mb-7">
          <div>
            <div className="text-xs text-slate-500 mb-1">Score</div>
            <div className="text-3xl font-bold text-navy-900 mb-4">{result.score} / {result.totalQuestions}</div>
            <div className="text-sm">
              <span className="text-slate-500">Submission Type: </span>
              {result.submissionType === "AUTO_SUBMITTED" ? (
                <span className="font-semibold text-danger">AUTO SUBMITTED</span>
              ) : (
                <span className="font-semibold text-navy-900">NORMAL</span>
              )}
            </div>
            {result.timeTakenSeconds != null && (
              <div className="text-sm mt-1">
                <span className="text-slate-500">Time Taken: </span>
                <span className="font-semibold text-navy-900">{formatTimeTaken(result.timeTakenSeconds)}</span>
              </div>
            )}
          </div>

          <div className="relative w-28 h-28 rounded-full flex items-center justify-center shrink-0" style={gaugeStyle}>
            <div className="absolute inset-2 bg-white rounded-full flex flex-col items-center justify-center">
              <span className="text-xl font-bold text-navy-900">{pct}%</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            className="btn-primary flex-1 py-3"
            onClick={() => navigate(`/leaderboard/${result.competition?._id || result.competition}`)}
          >
            View Leaderboard
          </button>
          <Link to="/dashboard" className="btn-secondary flex-1 text-center py-3">Back to Dashboard</Link>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, accent = "" }) {
  return (
    <div className="bg-slate-50 rounded-xl p-3 text-center">
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className={`font-semibold text-navy-900 ${accent}`}>{value}</div>
    </div>
  );
}
