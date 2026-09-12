import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, Clock, HelpCircle, Play, FileText, Zap, ShieldCheck, Award } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import StudentSidebar from "../components/StudentSidebar";
import Topbar from "../components/Topbar";

export default function Dashboard() {
  const { user } = useAuth();
  const [competitions, setCompetitions] = useState([]);

  useEffect(() => {
    api.get("/competitions").then((res) => setCompetitions(res.data.competitions)).catch(() => {});
  }, []);

  const featured = competitions.find((c) => c.status === "active") || competitions[0];

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      <StudentSidebar />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl min-w-0">
        <Topbar name={user?.fullName || "Student"} />

        {featured ? (
          <div className="rounded-2xl bg-gradient-to-br from-navy-800 to-navy-950 text-white p-7 mb-8 relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-48 h-48 rounded-full bg-brand/10" />
            <div className="flex items-start justify-between relative">
              <div>
                <h2 className="text-xl font-semibold mb-1">{featured.name}</h2>
                <p className="text-slate-400 text-sm max-w-md">{featured.description || "Test your knowledge and compete for the top spot."}</p>
              </div>
              {featured.status === "active" && (
                <span className="badge bg-success/15 text-success shrink-0">● Registration Open</span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-6 text-sm text-slate-300 mt-6 mb-7 relative">
              <div className="flex items-center gap-2"><Calendar size={16} className="text-brand-light" /> {new Date(featured.startDate).toLocaleDateString()}</div>
              <div className="flex items-center gap-2"><Clock size={16} className="text-brand-light" /> {featured.startTime || "TBD"}</div>
              <div className="flex items-center gap-2"><HelpCircle size={16} className="text-brand-light" /> {featured.numberOfQuestions} Questions</div>
              <div className="flex items-center gap-2"><Zap size={16} className="text-brand-light" /> {featured.durationMinutes} Minutes</div>
            </div>

            <div className="flex gap-3 relative">
              <Link to={`/quiz/${featured._id}/instructions`} className="btn-primary py-3 px-6">
                <Play size={16} /> Start Quiz
              </Link>
              <Link to={`/quiz/${featured._id}/instructions`} className="btn-secondary bg-transparent border-white/20 text-white hover:bg-white/5 py-3 px-6">
                <FileText size={16} /> View Instructions
              </Link>
            </div>
          </div>
        ) : (
          <div className="card p-10 text-center text-slate-400 mb-8">No active competitions right now. Check back soon.</div>
        )}

        <h3 className="font-semibold text-navy-900 mb-4">Competition Highlights</h3>
        <div className="grid sm:grid-cols-3 gap-5">
          <Highlight icon={Play} title="Single Quiz" desc="One chance, show your best!" />
          <Highlight icon={ShieldCheck} title="Auto Submission" desc="On rule violation" />
          <Highlight icon={Award} title="Top 3 Winners" desc="Get certificates & rewards" />
        </div>

        {competitions.length > 1 && (
          <div className="mt-8">
            <h3 className="font-semibold text-navy-900 mb-4">All Competitions</h3>
            <div className="space-y-3">
              {competitions.map((c) => (
                <div key={c._id} className="card p-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-slate-500 mt-1">{c.numberOfQuestions} Questions · {c.durationMinutes} Minutes</div>
                  </div>
                  <Link to={`/quiz/${c._id}/instructions`} className="btn-primary text-sm">Start Quiz</Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function Highlight({ icon: Icon, title, desc }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand flex items-center justify-center shrink-0">
        <Icon size={20} />
      </div>
      <div>
        <div className="font-medium text-sm text-navy-900">{title}</div>
        <div className="text-xs text-slate-500 mt-0.5">{desc}</div>
      </div>
    </div>
  );
}
