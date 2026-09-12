import { COLLEGE_NAME } from "../config/branding";
import collegeLogo from "../assets/college-logo.png";

export default function Logo({ dark = false, size = "md", showCollege = false }) {
  const dims = size === "lg" ? "w-12 h-12" : "w-9 h-9";
  const text = size === "lg" ? "text-xl" : "text-lg";
  return (
    <div>
      <div className={`flex items-center gap-2.5 font-semibold ${text} ${dark ? "text-white" : "text-navy-900"}`}>
        <img src={collegeLogo} alt="College Logo" className={`${dims} rounded-full object-contain shrink-0 bg-white p-0.5`} />
        ITechQuiz
      </div>
      {showCollege && (
        <p className={`text-xs mt-1 ${dark ? "text-slate-400" : "text-slate-500"}`}>{COLLEGE_NAME}</p>
      )}
    </div>
  );
}
