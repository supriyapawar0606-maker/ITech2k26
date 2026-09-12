import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ListChecks, ShieldCheck, Trophy, Award, BookOpen, Calendar, Clock, HelpCircle, Menu, X } from "lucide-react";
import Logo from "../components/Logo";
import { COLLEGE_NAME } from "../config/branding";
import api from "../api/axios";

const features = [
  { icon: ListChecks, title: "MCQ Based Quiz", desc: "Multiple choice questions" },
  { icon: ShieldCheck, title: "Secure & Fair", desc: "Auto submission on rule violation" },
  { icon: Trophy, title: "Leaderboard", desc: "Top performers will be honored" },
  { icon: Award, title: "Certificates", desc: "For all participants" },
];

export default function Home() {
  const [competition, setCompetition] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    api.get("/competitions/public/active").then((res) => setCompetition(res.data.competition)).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-navy-950 text-white">
      <header className="flex items-center justify-between px-5 sm:px-8 py-5 max-w-6xl mx-auto relative">
        <Logo dark showCollege />

        <nav className="hidden md:flex items-center gap-7 text-sm text-slate-300">
          <a href="#" className="hover:text-white transition-colors">Home</a>
          <a href="#about" className="hover:text-white transition-colors">About</a>
          <a href="#rules" className="hover:text-white transition-colors">Rules</a>
          <a href="#contact" className="hover:text-white transition-colors">Contact</a>
          <Link to="/login" className="hover:text-white transition-colors">Login</Link>
          <Link to="/register" className="btn-primary">Register</Link>
        </nav>

        <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-slate-300 hover:text-white p-1">
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {menuOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 mx-5 sm:mx-8 bg-navy-900 border border-white/10 rounded-xl p-4 flex flex-col gap-1 text-sm text-slate-300 md:hidden z-20">
            <a href="#" onClick={() => setMenuOpen(false)} className="px-3 py-2.5 rounded-lg hover:bg-white/5 hover:text-white">Home</a>
            <a href="#about" onClick={() => setMenuOpen(false)} className="px-3 py-2.5 rounded-lg hover:bg-white/5 hover:text-white">About</a>
            <a href="#rules" onClick={() => setMenuOpen(false)} className="px-3 py-2.5 rounded-lg hover:bg-white/5 hover:text-white">Rules</a>
            <a href="#contact" onClick={() => setMenuOpen(false)} className="px-3 py-2.5 rounded-lg hover:bg-white/5 hover:text-white">Contact</a>
            <Link to="/login" onClick={() => setMenuOpen(false)} className="px-3 py-2.5 rounded-lg hover:bg-white/5 hover:text-white">Login</Link>
            <Link to="/register" onClick={() => setMenuOpen(false)} className="btn-primary justify-center mt-1">Register</Link>
          </div>
        )}
      </header>

      <main className="max-w-6xl mx-auto px-5 sm:px-8 pt-6 pb-16">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center">
          <div>
            <span className="badge bg-white/10 text-brand-light mb-5">Diploma Quiz Competition</span>
            <h1 className="text-4xl sm:text-5xl font-bold leading-[1.1] mb-5">
              Think.<br />Answer. Win.
            </h1>
            <p className="text-slate-400 mb-8 max-w-md">
              Showcase your knowledge, compete with your fellow diploma students and be the
              champion of {COLLEGE_NAME}'s quiz competition.
            </p>
            <div className="flex items-center gap-4 mb-10">
              <Link to="/register" className="btn-primary px-6 py-3">Register Now</Link>
              <a href="#rules" className="btn-secondary bg-transparent border-white/20 text-white hover:bg-white/5 px-6 py-3">View Rules</a>
            </div>
            {competition && (
              <div className="flex flex-wrap items-center gap-6 text-sm text-slate-300">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-brand-light" />
                  {new Date(competition.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </div>
                {competition.startTime && (
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-brand-light" />
                    {competition.startTime}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <HelpCircle size={16} className="text-brand-light" />
                  {competition.durationMinutes} Minutes · {competition.numberOfQuestions} Questions
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-navy-800 to-navy-900 border border-white/5 flex items-center justify-center overflow-hidden">
              <BookOpen size={140} strokeWidth={1} className="text-brand-light/40" />
              <Trophy size={64} strokeWidth={1.5} className="absolute top-10 right-14 text-warning/70" />
              <Award size={48} strokeWidth={1.5} className="absolute bottom-12 left-12 text-brand-light/50" />
            </div>
          </div>
        </div>

        <div id="rules" className="grid grid-cols-2 md:grid-cols-4 gap-5 mt-16 pt-12 border-t border-white/5">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="text-center">
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mx-auto mb-3 text-brand-light">
                <Icon size={22} />
              </div>
              <div className="font-medium text-white mb-1 text-sm">{title}</div>
              <div className="text-xs text-slate-500">{desc}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
