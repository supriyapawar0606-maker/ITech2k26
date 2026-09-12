import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Logo from "../components/Logo";

export default function Login() {
  const { loginStudent } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await loginStudent(identifier, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-4">
      <div className="w-full max-w-3xl grid md:grid-cols-[0.85fr_1fr] rounded-2xl overflow-hidden shadow-card border border-slate-200/70">
        <div className="hidden md:flex flex-col items-center justify-center bg-gradient-to-b from-navy-800 to-navy-950 text-white p-10 text-center relative">
          <Sparkles size={26} className="text-brand-light absolute top-8 left-9" />
          <BookOpen size={100} strokeWidth={1} className="text-brand-light/70 mb-6" />
          <h2 className="text-2xl font-bold mb-2 leading-snug">Knowledge builds a<br />better future</h2>
        </div>

        <div className="bg-white p-6 sm:p-8 md:p-10 flex flex-col justify-center">
          <div className="mb-6">
            <Logo showCollege />
            <h1 className="text-xl font-semibold mt-5">Welcome Back!</h1>
            <p className="text-sm text-slate-500 mt-1">Login to continue your quiz journey</p>
          </div>

          {error && <div className="bg-red-50 text-danger text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <label className="block">
              <span className="label-text">Roll Number / Email</span>
              <input className="input-field" placeholder="Enter roll number or email" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />
            </label>
            <label className="block">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-medium text-slate-600">Password</span>
                <a href="#" className="text-xs text-brand font-medium">Forgot Password?</a>
              </div>
              <input type="password" className="input-field" placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </label>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2 py-3">
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <div className="flex items-center gap-3 my-4 text-xs text-slate-400">
            <div className="h-px bg-slate-200 flex-1" /> OR <div className="h-px bg-slate-200 flex-1" />
          </div>

          <Link to="/admin-login" className="btn-secondary w-full">Login as Admin</Link>

          <p className="text-center text-sm text-slate-500 mt-5">
            Don't have an account? <Link to="/register" className="text-brand font-medium">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
