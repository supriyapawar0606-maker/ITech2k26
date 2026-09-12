import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, Clock, HelpCircle, Building2 } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import StudentSidebar from "../components/StudentSidebar";
import Topbar from "../components/Topbar";

export default function QuizInfo() {
  const { user } = useAuth();
  const [competitions, setCompetitions] = useState([]);

  useEffect(() => {
    api.get("/competitions").then((res) => setCompetitions(res.data.competitions)).catch(() => {});
  }, []);

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      <StudentSidebar />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-3xl min-w-0">
        <Topbar title="Quiz Information" subtitle="All competitions you can take part in" name={user?.fullName} />

        <div className="space-y-4">
          {competitions.map((c) => (
            <div key={c._id} className="card p-6 flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <h3 className="font-semibold text-navy-900">{c.name}</h3>
                  {c.status === "active" && <span className="badge bg-green-50 text-success">● Registration Open</span>}
                </div>
                <p className="text-sm text-slate-500 mb-1 max-w-md">{c.description || "Test your knowledge across a range of topics."}</p>
                {c.department && (
                  <p className="text-xs text-brand font-medium mb-3 flex items-center gap-1.5">
                    <Building2 size={13} /> Conducted by: {c.department}
                  </p>
                )}
                <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5"><Calendar size={13} /> {new Date(c.startDate).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1.5"><Clock size={13} /> {c.startTime}</span>
                  <span className="flex items-center gap-1.5"><HelpCircle size={13} /> {c.numberOfQuestions} Questions · {c.durationMinutes} Min</span>
                </div>
              </div>
              <Link to={`/quiz/${c._id}/instructions`} className="btn-primary shrink-0">View Instructions</Link>
            </div>
          ))}
          {competitions.length === 0 && (
            <div className="card p-10 text-center text-slate-400">No competitions available right now.</div>
          )}
        </div>
      </main>
    </div>
  );
}
