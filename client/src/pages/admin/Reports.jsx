import { useEffect, useRef, useState } from "react";
import { Download, FileSpreadsheet } from "lucide-react";
import api from "../../api/axios";
import AdminSidebar from "../../components/AdminSidebar";
import Topbar from "../../components/Topbar";

export default function Reports() {
  const [competitions, setCompetitions] = useState([]);
  const [competitionId, setCompetitionId] = useState("");
  const [report, setReport] = useState(null);
  const [violations, setViolations] = useState(null);
  const printRef = useRef(null);

  useEffect(() => {
    api.get("/competitions").then((res) => {
      setCompetitions(res.data.competitions);
      if (res.data.competitions[0]) setCompetitionId(res.data.competitions[0]._id);
    });
    api.get("/admin/security-violations").then((res) => setViolations(res.data));
  }, []);

  useEffect(() => {
    if (!competitionId) return;
    api.get(`/admin/reports/competition/${competitionId}`).then((res) => setReport(res.data));
  }, [competitionId]);

  const total = (violations?.normalSubmissions || 0) + (violations?.autoSubmissions || 0) || 1;
  const normalPct = Math.round(((violations?.normalSubmissions || 0) / total) * 100);
  const donutStyle = {
    background: `conic-gradient(#2563EB 0 ${normalPct * 3.6}deg, #D97706 ${normalPct * 3.6}deg 360deg)`,
  };

  const exportCsv = () => {
    if (!report) return;
    const rows = [
      ["Metric", "Value"],
      ["Total Participants", report.totalParticipants],
      ["Total Attempts", report.totalAttempts],
      ["Average Score", report.averageScore],
      ["Highest Score", report.highestScore],
      ["Lowest Score", report.lowestScore],
      ["Pass Percentage", `${report.passPercentage}%`],
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "quizarena-report.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPdf = () => window.print();

  const competitionName = competitions.find((c) => c._id === competitionId)?.name;

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      <AdminSidebar />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
        <Topbar title="Reports & Analytics" subtitle="Download detailed competition reports" name="Admin" />

        <div className="card p-5 mb-6 flex flex-wrap items-end gap-3">
          <label className="flex-1 min-w-[220px]">
            <span className="label-text">Competition</span>
            <select className="input-field" value={competitionId} onChange={(e) => setCompetitionId(e.target.value)}>
              {competitions.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </label>
          <button onClick={exportCsv} className="btn-secondary"><FileSpreadsheet size={15} /> Export Excel</button>
          <button onClick={downloadPdf} className="btn-primary"><Download size={15} /> Download PDF</button>
        </div>

        <div ref={printRef} className="grid lg:grid-cols-[1.3fr_1fr] gap-6">
          <div className="card p-6">
            <h2 className="font-semibold text-navy-900 mb-4">Competition Summary</h2>
            {competitionName && <p className="text-sm text-slate-500 -mt-3 mb-4">{competitionName}</p>}
            <div className="grid grid-cols-2 gap-4">
              <SummaryStat label="Total Participants" value={report?.totalParticipants ?? "—"} />
              <SummaryStat label="Total Attempts" value={report?.totalAttempts ?? "—"} />
              <SummaryStat label="Average Score" value={report ? `${report.averageScore}/30` : "—"} />
              <SummaryStat label="Highest Score" value={report ? `${report.highestScore}/30` : "—"} />
              <SummaryStat label="Lowest Score" value={report?.lowestScore ?? "—"} />
              <SummaryStat label="Pass Percentage" value={report ? `${report.passPercentage}%` : "—"} accent="text-success" />
            </div>
          </div>

          <div className="card p-6">
            <h2 className="font-semibold text-navy-900 mb-4">Submission Type</h2>
            <div className="flex items-center gap-6">
              <div className="relative w-24 h-24 rounded-full shrink-0" style={donutStyle}>
                <div className="absolute inset-2.5 bg-white rounded-full" />
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-brand inline-block" /> Normal ({violations?.normalSubmissions ?? 0})</div>
                <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-warning inline-block" /> Auto ({violations?.autoSubmissions ?? 0})</div>
              </div>
            </div>

            <h2 className="font-semibold text-navy-900 mt-6 mb-3">Violations Summary</h2>
            <ViolationBar label="Tab Switches" value={violations?.tabSwitchCount ?? 0} max={total} color="bg-warning" />
            <ViolationBar label="Fullscreen Exit" value={violations?.fullscreenExitCount ?? 0} max={total} color="bg-danger" />
          </div>
        </div>
      </main>
    </div>
  );
}

function SummaryStat({ label, value, accent = "" }) {
  return (
    <div className="bg-slate-50 rounded-xl p-4 text-center">
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className={`text-xl font-bold text-navy-900 ${accent}`}>{value}</div>
    </div>
  );
}

function ViolationBar({ label, value, max, color }) {
  const pct = max ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs text-slate-500 mb-1">
        <span>{label}</span>
        <span className="font-medium text-navy-900">{value}</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
