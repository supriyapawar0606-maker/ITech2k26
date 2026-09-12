import { UserCircle2, Mail, Hash, Building2, GraduationCap } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import StudentSidebar from "../components/StudentSidebar";
import Topbar from "../components/Topbar";

export default function Profile() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      <StudentSidebar />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-2xl min-w-0">
        <Topbar title="My Profile" name={user?.fullName} />

        <div className="card p-8">
          <div className="flex items-center gap-4 mb-7 pb-7 border-b border-slate-100">
            <div className="w-16 h-16 rounded-full bg-brand-50 text-brand flex items-center justify-center">
              <UserCircle2 size={40} strokeWidth={1.5} />
            </div>
            <div>
              <div className="text-lg font-semibold text-navy-900">{user?.fullName}</div>
              <div className="text-sm text-slate-500">{user?.rollNumber}</div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <InfoRow icon={Mail} label="Email Address" value={user?.email} />
            <InfoRow icon={Hash} label="Roll Number" value={user?.rollNumber} />
            <InfoRow icon={Building2} label="Department" value={user?.department} />
            <InfoRow icon={GraduationCap} label="Year / Class" value={user?.yearOrClass} />
          </div>
        </div>
      </main>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-4">
      <div className="w-9 h-9 rounded-lg bg-white text-brand flex items-center justify-center shrink-0">
        <Icon size={16} />
      </div>
      <div>
        <div className="text-xs text-slate-500">{label}</div>
        <div className="text-sm font-medium text-navy-900">{value || "—"}</div>
      </div>
    </div>
  );
}
