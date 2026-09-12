import { useEffect, useState } from "react";
import { Users, ListChecks, ShieldAlert, CheckCircle2 } from "lucide-react";
import api from "../../api/axios";
import AdminSidebar from "../../components/AdminSidebar";
import Topbar from "../../components/Topbar";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get("/admin/dashboard").then((res) => setStats(res.data)).catch(() => {});
  }, []);

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      <AdminSidebar />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
        <Topbar title="Dashboard" subtitle="Overview of the quiz competition" name="Admin" />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Users} label="Total Students" value={stats?.totalParticipants} color="text-brand" bg="bg-brand-50" />
          <StatCard
            icon={ListChecks}
            label="Total Attempts"
            value={stats ? stats.normalSubmissions + stats.autoSubmissions : undefined}
            color="text-navy-700"
            bg="bg-slate-100"
          />
          <StatCard icon={ShieldAlert} label="Auto Submissions" value={stats?.autoSubmissions} color="text-danger" bg="bg-red-50" />
          <StatCard icon={CheckCircle2} label="Normal Submissions" value={stats?.normalSubmissions} color="text-success" bg="bg-green-50" />
        </div>

        <div className="card overflow-hidden table-shell">
          <div className="p-5 border-b border-slate-100 font-semibold text-navy-900">Recent Activity</div>
          <div className="overflow-x-auto">
          <table className="min-w-[640px]">
            <thead>
              <tr>
                <th>Student</th>
                <th>Event</th>
                <th>Time</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recentActivity.map((a, i) => (
                <tr key={i}>
                  <td className="font-medium text-navy-900">{a.studentName}</td>
                  <td>{a.event}</td>
                  <td className="text-slate-500">{new Date(a.submittedAt).toLocaleTimeString()}</td>
                  <td>
                    <span className={`badge ${a.submissionType === "AUTO_SUBMITTED" ? "bg-red-50 text-danger" : "bg-green-50 text-success"}`}>
                      {a.submissionType === "AUTO_SUBMITTED" ? "Auto Submit" : "Normal"}
                    </span>
                  </td>
                </tr>
              ))}
              {(!stats?.recentActivity || stats.recentActivity.length === 0) && (
                <tr><td colSpan={4} className="p-8 text-center text-slate-400">No recent activity.</td></tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, bg }) {
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
