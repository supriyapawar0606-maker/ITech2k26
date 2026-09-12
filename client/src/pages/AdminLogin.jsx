import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Logo from "../components/Logo";

export default function AdminLogin() {
  const { loginAdmin } = useAuth();
  const navigate = useNavigate();
  const [adminId, setAdminId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await loginAdmin(adminId, password);
      navigate("/admin/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid admin credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl grid md:grid-cols-2 rounded-2xl overflow-hidden shadow-2xl">
        <div className="hidden md:flex flex-col items-center justify-center bg-navy-900 p-10 text-center border-r border-white/5">
          <div className="w-16 h-16 rounded-2xl bg-brand flex items-center justify-center mb-5 shadow-lg shadow-brand/30">
            <ShieldCheck size={30} className="text-white" />
          </div>
          <Logo dark size="lg" showCollege />
          <p className="text-slate-400 text-sm mt-4 max-w-[220px]">Access the admin panel</p>
        </div>

        <div className="bg-navy-900 p-6 sm:p-8 md:p-10 flex flex-col justify-center">
          <h1 className="text-xl font-semibold text-white mb-1">Admin Login</h1>
          <p className="text-sm text-slate-400 mb-6">Manage competitions, questions and results</p>

          {error && <div className="bg-red-950/60 text-red-300 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <label className="block">
              <span className="block text-xs font-medium text-slate-300 mb-1.5">Admin ID</span>
              <input className="input-field bg-navy-800 border-navy-700 text-white placeholder-slate-500" placeholder="Enter admin ID" value={adminId} onChange={(e) => setAdminId(e.target.value)} required />
            </label>
            <label className="block">
              <span className="block text-xs font-medium text-slate-300 mb-1.5">Password</span>
              <input type="password" className="input-field bg-navy-800 border-navy-700 text-white placeholder-slate-500" placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </label>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2 py-3">
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <Link to="/" className="block text-center text-sm text-slate-400 mt-5 hover:text-white transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
