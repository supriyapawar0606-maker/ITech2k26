import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import StudentSidebar from "../components/StudentSidebar";
import Topbar from "../components/Topbar";
import { formatTimeTaken } from "../utils/formatDuration";

export default function MyResults() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    api.get("/competitions").then(async (res) => {
      const competitions = res.data.competitions;
      const results = await Promise.all(
        competitions.map(async (c) => {
          try {
            const { data } = await api.get(`/leaderboard/${c._id}`);
            const mine = data.leaderboard.find((r) => r.studentId === user?.id);
            if (!mine) return null;
            return { competitionName: c.name, ...mine };
          } catch {
            return null;
          }
        })
      );
      if (mounted) {
        setRows(results.filter(Boolean));
        setLoading(false);
      }
    }).catch(() => setLoading(false));
    return () => { mounted = false; };
  }, [user?.id]);

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      <StudentSidebar />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
        <Topbar title="My Result" subtitle="Your past quiz attempts and scores" name={user?.fullName} />

        <div className="card overflow-hidden table-shell">
          <div className="overflow-x-auto">
          <table className="min-w-[640px]">
            <thead>
              <tr>
                <th>Competition</th>
                <th>Rank</th>
                <th>Score</th>
                <th>Time Taken</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.competitionName}>
                  <td className="font-medium text-navy-900">{r.competitionName}</td>
                  <td>
                    {r.rank <= 3 ? (
                      <span className="inline-flex items-center gap-1 text-warning font-semibold"><Trophy size={14} /> {r.rank}</span>
                    ) : (
                      r.rank
                    )}
                  </td>
                  <td>{r.score}/{r.totalQuestions}</td>
                  <td className="text-slate-500">{formatTimeTaken(r.timeTakenSeconds)}</td>
                </tr>
              ))}
              {!loading && rows.length === 0 && (
                <tr><td colSpan={4} className="p-8 text-center text-slate-400">You haven't completed any quizzes yet.</td></tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      </main>
    </div>
  );
}
