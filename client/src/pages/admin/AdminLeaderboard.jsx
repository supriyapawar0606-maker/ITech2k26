import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import api from "../../api/axios";
import AdminSidebar from "../../components/AdminSidebar";
import Topbar from "../../components/Topbar";
import { formatTimeTaken } from "../../utils/formatDuration";

export default function AdminLeaderboard() {
  const [competitions, setCompetitions] = useState([]);
  const [competitionId, setCompetitionId] = useState("");
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/competitions").then((res) => {
      setCompetitions(res.data.competitions);
      if (res.data.competitions[0]) setCompetitionId(res.data.competitions[0]._id);
    });
  }, []);

  useEffect(() => {
    if (!competitionId) return;
    api.get(`/leaderboard/${competitionId}`).then((res) => setData(res.data)).catch(() => {});
  }, [competitionId]);

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      <AdminSidebar />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
        <Topbar title="Leaderboard" subtitle="View the top scoring students per competition" name="Admin" />

        <div className="card overflow-hidden table-shell">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy size={18} className="text-warning" />
              <span className="font-semibold text-navy-900">Leaderboard</span>
            </div>
            <select value={competitionId} onChange={(e) => setCompetitionId(e.target.value)} className="input-field w-auto text-sm">
              {competitions.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div className="overflow-x-auto">
          <table className="min-w-[640px]">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Name</th>
                <th>Department</th>
                <th>Score</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {data?.leaderboard.map((row) => (
                <tr key={row.studentId}>
                  <td className="font-semibold text-navy-900">{row.rank}</td>
                  <td className="font-medium text-navy-900">{row.studentName}</td>
                  <td className="text-slate-500">{row.department}</td>
                  <td>{row.score}/{row.totalQuestions}</td>
                  <td className="text-slate-500">{formatTimeTaken(row.timeTakenSeconds)}</td>
                </tr>
              ))}
              {data?.leaderboard.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-slate-400">No results yet for this competition.</td></tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      </main>
    </div>
  );
}
