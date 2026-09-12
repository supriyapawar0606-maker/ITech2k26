import { useEffect, useMemo, useState } from "react";
import { Search, FileSpreadsheet, FileDown } from "lucide-react";
import api from "../../api/axios";
import AdminSidebar from "../../components/AdminSidebar";
import Topbar from "../../components/Topbar";
import { formatTimeTaken } from "../../utils/formatDuration";

const downloadFile = async (url, filename) => {
  const res = await api.get(url, { responseType: "blob" });
  const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
};

export default function AdminResults() {
  const [competitions, setCompetitions] = useState([]);
  const [competitionId, setCompetitionId] = useState("");
  const [data, setData] = useState(null);
  const [search, setSearch] = useState("");
  const [exporting, setExporting] = useState(false);

  const handleExport = async (type) => {
    if (!competitionId) return;
    const competitionName = competitions.find((c) => c._id === competitionId)?.name || "results";
    try {
      setExporting(true);
      await downloadFile(
        `/admin/reports/competition/${competitionId}/export/${type}`,
        `results-${competitionName.replace(/\s+/g, "-")}.${type === "excel" ? "xlsx" : "pdf"}`
      );
    } catch (err) {
      alert(err.response?.data?.message || "Export failed");
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    api.get("/competitions").then((res) => {
      setCompetitions(res.data.competitions);
      if (res.data.competitions[0]) setCompetitionId(res.data.competitions[0]._id);
    });
  }, []);

  useEffect(() => {
    if (!competitionId) return;
    api.get(`/leaderboard/${competitionId}`).then((res) => setData(res.data)).catch(() => {});
  }, [competitionId]);

  const filtered = useMemo(
    () => (data?.leaderboard || []).filter((r) => r.studentName.toLowerCase().includes(search.toLowerCase())),
    [data, search]
  );

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      <AdminSidebar />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
        <Topbar
          title="Results"
          subtitle="All quiz results for a competition"
          name="Admin"
          actions={
            <>
              <button onClick={() => handleExport("excel")} disabled={exporting || !competitionId} className="btn-secondary">
                <FileSpreadsheet size={14} /> Export Excel
              </button>
              <button onClick={() => handleExport("pdf")} disabled={exporting || !competitionId} className="btn-secondary">
                <FileDown size={14} /> Export PDF
              </button>
            </>
          }
        />

        <div className="card overflow-hidden table-shell">
          <div className="p-5 border-b border-slate-100 flex flex-wrap gap-3 items-center justify-between">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="input-field pl-9" placeholder="Search student..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <select value={competitionId} onChange={(e) => setCompetitionId(e.target.value)} className="input-field w-auto text-sm">
              {competitions.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div className="overflow-x-auto">
          <table className="min-w-[640px]">
            <thead>
              <tr>
                <th>Student</th>
                <th>Department</th>
                <th>Score</th>
                <th>Percentage</th>
                <th>Time Taken</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.studentId}>
                  <td className="font-medium text-navy-900">{r.studentName}</td>
                  <td className="text-slate-500">{r.department}</td>
                  <td>{r.score}/{r.totalQuestions}</td>
                  <td>{Math.round((r.score / r.totalQuestions) * 100)}%</td>
                  <td className="text-slate-500">{formatTimeTaken(r.timeTakenSeconds)}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-slate-400">No results found.</td></tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      </main>
    </div>
  );
}
