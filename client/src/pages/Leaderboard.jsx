import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Trophy, Medal } from "lucide-react";
import api from "../api/axios";
import StudentSidebar from "../components/StudentSidebar";
import Topbar from "../components/Topbar";
import { useAuth } from "../context/AuthContext";
import { formatTimeTaken } from "../utils/formatDuration";

const medalColor = { 1: "text-warning", 2: "text-slate-400", 3: "text-amber-700" };

export default function Leaderboard() {
  const { competitionId: paramId } = useParams();
  const { user } = useAuth();
  const [competitions, setCompetitions] = useState([]);
  const [competitionId, setCompetitionId] = useState(paramId || "");
  const [data, setData] = useState(null);

  useEffect(() => {
    if (paramId) return;
    api.get("/competitions").then((res) => {
      setCompetitions(res.data.competitions);
      const active = res.data.competitions.find((c) => c.status === "active") || res.data.competitions[0];
      if (active) setCompetitionId(active._id);
    }).catch(() => {});
  }, [paramId]);

  useEffect(() => {
    if (!competitionId) return;
    api.get(`/leaderboard/${competitionId}`).then((res) => setData(res.data)).catch(() => {});
  }, [competitionId]);

  const top3 = data?.leaderboard.slice(0, 3) || [];

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      <StudentSidebar />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
        <Topbar name={user?.fullName} />

        <div className="card overflow-hidden table-shell">
          <div className="flex flex-wrap justify-between items-center gap-3 p-5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Trophy size={18} className="text-warning" />
              <h1 className="font-semibold text-lg text-navy-900">Final Leaderboard</h1>
            </div>
            {!paramId && competitions.length > 1 ? (
              <select value={competitionId} onChange={(e) => setCompetitionId(e.target.value)} className="input-field w-auto text-sm">
                {competitions.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            ) : (
              data && <span className="text-sm text-slate-500">{data.competition}</span>
            )}
          </div>
          <div className="overflow-x-auto">
          <table className="min-w-[640px]">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Student Name</th>
                <th>Department</th>
                <th>Score</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {data?.leaderboard.map((row) => (
                <tr key={row.studentId}>
                  <td className="font-semibold">
                    {row.rank <= 3 ? (
                      <span className={`inline-flex items-center gap-1 ${medalColor[row.rank]}`}>
                        <Medal size={16} /> {row.rank}
                      </span>
                    ) : (
                      row.rank
                    )}
                  </td>
                  <td className="font-medium text-navy-900">{row.studentName}</td>
                  <td className="text-slate-500">{row.department}</td>
                  <td>{row.score}/{row.totalQuestions}</td>
                  <td className="text-slate-500">{formatTimeTaken(row.timeTakenSeconds)}</td>
                </tr>
              ))}
              {data?.leaderboard.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-slate-400">No results yet.</td></tr>
              )}
              {!competitionId && (
                <tr><td colSpan={5} className="p-8 text-center text-slate-400">No competitions available yet.</td></tr>
              )}
            </tbody>
          </table>
          </div>
        </div>

        {top3.length > 0 && (
          <div className="card p-6 mt-6 text-center">
            <div className="text-sm font-semibold text-navy-900 mb-4">Top 3 Winners</div>
            <div className="flex justify-center items-end gap-6">
              {top3.map((row) => (
                <div key={row.studentId} className="flex flex-col items-center gap-1.5">
                  <Medal size={28} className={medalColor[row.rank]} />
                  <span className="text-sm font-medium text-navy-900">{row.studentName}</span>
                  <span className="text-xs text-slate-500">{row.score}/{row.totalQuestions}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
