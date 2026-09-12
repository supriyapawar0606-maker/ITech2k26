import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Logo from "../components/Logo";
import { DEPARTMENTS } from "../config/branding";

export default function Register() {
  const { registerStudent } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    rollNumber: "",
    email: "",
    mobileNumber: "",
    department: "",
    yearOrClass: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await registerStudent(form);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid md:grid-cols-[0.85fr_1.15fr] rounded-2xl overflow-hidden shadow-card border border-slate-200/70">
        <div className="hidden md:flex flex-col items-center justify-center bg-gradient-to-b from-navy-800 to-navy-950 text-white p-10 text-center relative">
          <Sparkles size={26} className="text-brand-light absolute top-8 left-9" />
          <GraduationCap size={110} strokeWidth={1} className="text-brand-light/70 mb-6" />
          <h2 className="text-2xl font-bold mb-2">Great minds compete!</h2>
          <p className="text-slate-400 text-sm max-w-[220px]">
            Join the quiz and prove your skills.
          </p>
        </div>

        <div className="bg-white p-6 sm:p-8 md:p-10">
          <div className="mb-6">
            <Logo showCollege />
            <h1 className="text-xl font-semibold mt-5">Student Registration</h1>
            <p className="text-sm text-slate-500 mt-1">Create your account to participate in the Diploma Quiz Competition</p>
          </div>

          {error && <div className="bg-red-50 text-danger text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}

          <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-3.5">
            <Field label="Full Name">
              <input className="input-field" placeholder="Enter your full name" value={form.fullName} onChange={update("fullName")} required />
            </Field>
            <Field label="Roll Number">
              <input className="input-field" placeholder="Enter roll number" value={form.rollNumber} onChange={update("rollNumber")} required />
            </Field>
            <Field label="Email Address">
              <input type="email" className="input-field" placeholder="Enter your email" value={form.email} onChange={update("email")} required />
            </Field>
            <Field label="Mobile Number">
              <input className="input-field" placeholder="Enter your mobile number" value={form.mobileNumber} onChange={update("mobileNumber")} />
            </Field>
            <Field label="Department">
              <select className="input-field" value={form.department} onChange={update("department")}>
                <option value="">Select Department</option>
                {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
              </select>
            </Field>
            <Field label="Year / Class">
              <select className="input-field" value={form.yearOrClass} onChange={update("yearOrClass")}>
                <option value="">Select Year</option>
                <option>1st Year Diploma</option>
                <option>2nd Year Diploma</option>
                <option>3rd Year Diploma</option>
              </select>
            </Field>
            <Field label="Password">
              <input type="password" className="input-field" placeholder="Enter password" value={form.password} onChange={update("password")} required minLength={6} />
            </Field>
            <Field label="Confirm Password">
              <input type="password" className="input-field" placeholder="Re-enter password" value={form.confirmPassword} onChange={update("confirmPassword")} required minLength={6} />
            </Field>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-1 sm:col-span-2 py-3">
              {loading ? "Registering..." : "Register"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-5">
            Already have an account? <Link to="/login" className="text-brand font-medium">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="label-text">{label}</span>
      {children}
    </label>
  );
}
