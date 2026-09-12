import { useEffect, useState } from "react";
import { RefreshCcw, ShieldAlert } from "lucide-react";
import api from "../../api/axios";
import AdminSidebar from "../../components/AdminSidebar";
import Topbar from "../../components/Topbar";

export default function SecurityViolations() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/admin/security-violations").then((res) => setData(res.data));
  }, []);

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      <AdminSidebar />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
        <Topbar title="Security Violations" subtitle="Track all quiz security incidents" name="Admin" />

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Stat label="Tab Switches" value={data?.tabSwitchCount} color="text-warning" bg="bg-amber-50" icon={RefreshCcw} />
          <Stat label="Fullscreen Exit" value={data?.fullscreenExitCount} color="text-danger" bg="bg-red-50" icon={ShieldAlert} />
          <Stat label="Auto Submits" value={data?.autoSubmissions} color="text-navy-700" bg="bg-slate-100" icon={ShieldAlert} />
        </div>

        <div className="card overflow-hidden table-shell">
          <div className="p-5 border-b border-slate-100 font-semibold text-navy-900">Recent Violations</div>
          <div className="overflow-x-auto">
          <table className="min-w-[640px]">
            <thead>
              <tr>
                <th>Student</th>
                <th>Competition</th>
                <th>Event</th>
                <th>Time</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {data?.recentViolations.map((v, i) => (
                <tr key={i}>
                  <td className="font-medium text-navy-900">{v.studentName}</td>
                  <td className="text-slate-500">{v.competitionName}</td>
                  <td>{v.event.replace(/_/g, " ")}</td>
                  <td className="text-slate-500">{new Date(v.time).toLocaleString()}</td>
                  <td><span className="badge bg-red-50 text-danger">{v.action}</span></td>
                </tr>
              ))}
              {data?.recentViolations.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-slate-400">No violations recorded.</td></tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      </main>
    </div>
  );
}

function Stat({ icon: Icon, label, value, color, bg }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl ${bg} ${color} flex items-center justify-center shrink-0`}>
        <Icon size={20} />
      </div>
      <div>
        <div className="text-xs text-slate-500 mb-0.5">{label}</div>
        <div className="text-2xl font-bold text-navy-900">{value ?? "—"}</div>
      </div>
    </div>
  );
}
