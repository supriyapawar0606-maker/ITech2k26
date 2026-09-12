import { useEffect, useState } from "react";
import { Trash2, Plus, Pencil, X } from "lucide-react";
import api from "../../api/axios";
import AdminSidebar from "../../components/AdminSidebar";
import Topbar from "../../components/Topbar";
import { DEPARTMENTS } from "../../config/branding";

const emptyForm = {
  name: "",
  description: "",
  department: "",
  startDate: "",
  startTime: "",
  durationMinutes: "",
  numberOfQuestions: "",
  marksPerQuestion: 1,
  negativeMarking: false,
  status: "draft",
};

export default function ManageCompetition() {
  const [competitions, setCompetitions] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  const load = () => api.get("/competitions").then((res) => setCompetitions(res.data.competitions));

  useEffect(() => {
    load();
  }, []);

  const update = (field) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm({ ...form, [field]: value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (editingId) {
        await api.put(`/competitions/${editingId}`, form);
      } else {
        await api.post("/competitions", form);
      }
      setForm(emptyForm);
      setEditingId(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save quiz settings");
    }
  };

  const startEdit = (c) => {
    setEditingId(c._id);
    setForm({
      name: c.name || "",
      description: c.description || "",
      department: c.department || "",
      startDate: c.startDate ? c.startDate.slice(0, 10) : "",
      startTime: c.startTime || "",
      durationMinutes: c.durationMinutes || "",
      numberOfQuestions: c.numberOfQuestions || "",
      marksPerQuestion: c.marksPerQuestion ?? 1,
      negativeMarking: !!c.negativeMarking,
      status: c.status || "draft",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
  };

  const setStatus = async (id, status) => {
    await api.patch(`/competitions/${id}/status`, { status });
    load();
  };

  const remove = async (id) => {
    if (!confirm("Delete this competition and all its questions?")) return;
    await api.delete(`/competitions/${id}`);
    load();
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      <AdminSidebar />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
        <Topbar title="Quiz Settings" subtitle="Configure the quiz competition details" name="Admin" />

        <div className="grid lg:grid-cols-[1fr_360px] gap-6 items-start">
          <div className="card overflow-hidden table-shell">
            <div className="p-5 border-b border-slate-100 font-semibold text-navy-900">Competitions</div>
            <div className="overflow-x-auto">
          <table className="min-w-[640px]">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Date</th>
                  <th>Duration</th>
                  <th>Total Questions</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {competitions.map((c) => (
                  <tr key={c._id}>
                    <td className="font-medium text-navy-900">{c.name}</td>
                    <td className="text-slate-500">{c.department || "—"}</td>
                    <td className="text-slate-500">{new Date(c.startDate).toLocaleDateString()}</td>
                    <td className="text-slate-500">{c.durationMinutes}m</td>
                    <td className="text-slate-500">{c.numberOfQuestions}</td>
                    <td>
                      <select
                        value={c.status}
                        onChange={(e) => setStatus(c._id, e.target.value)}
                        className={`text-xs font-medium border-0 rounded-full px-2.5 py-1 ${
                          c.status === "active" ? "bg-green-50 text-success" : c.status === "closed" ? "bg-slate-100 text-slate-500" : "bg-amber-50 text-warning"
                        }`}
                      >
                        <option value="draft">Draft</option>
                        <option value="active">Active</option>
                        <option value="closed">Closed</option>
                      </select>
                    </td>
                    <td className="flex gap-2">
                      <button onClick={() => startEdit(c)} className="btn-ghost">
                        <Pencil size={13} /> Edit
                      </button>
                      <button onClick={() => remove(c._id)} className="btn-danger-ghost">
                        <Trash2 size={13} /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {competitions.length === 0 && (
                  <tr><td colSpan={7} className="p-8 text-center text-slate-400">No competitions yet — create one to get started.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          </div>

          <form onSubmit={handleSave} className="card p-6 space-y-3.5">
            <h2 className="font-semibold text-navy-900 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Plus size={16} className="text-brand" /> {editingId ? "Edit Quiz Settings" : "New Quiz Settings"}
              </span>
              {editingId && (
                <button type="button" onClick={cancelEdit} className="text-slate-400 hover:text-slate-600">
                  <X size={16} />
                </button>
              )}
            </h2>
            {error && <div className="bg-red-50 text-danger text-xs rounded-lg px-3 py-2">{error}</div>}

            <Field label="Quiz Title">
              <input className="input-field" placeholder="e.g. College Quiz Competition" value={form.name} onChange={update("name")} required />
            </Field>
            <Field label="Description">
              <textarea className="input-field" placeholder="Short description" rows={2} value={form.description} onChange={update("description")} />
            </Field>
            <Field label="Conducted By (Department)">
              <select className="input-field" value={form.department} onChange={update("department")}>
                <option value="">Select Department</option>
                {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-2.5">
              <Field label="Date">
                <input type="date" className="input-field" value={form.startDate} onChange={update("startDate")} required />
              </Field>
              <Field label="Start Time">
                <input type="time" className="input-field" value={form.startTime} onChange={update("startTime")} required />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <Field label="Duration (min)">
                <input type="number" className="input-field" placeholder="30" value={form.durationMinutes} onChange={update("durationMinutes")} required />
              </Field>
              <Field label="Total Questions">
                <input type="number" className="input-field" placeholder="30" value={form.numberOfQuestions} onChange={update("numberOfQuestions")} required />
              </Field>
            </div>
            <Field label="Marks per Question">
              <input type="number" className="input-field" value={form.marksPerQuestion} onChange={update("marksPerQuestion")} />
            </Field>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={form.negativeMarking} onChange={update("negativeMarking")} className="accent-brand w-4 h-4" />
              Negative Marking
            </label>
            <button type="submit" className="btn-primary w-full">{editingId ? "Update Settings" : "Save Settings"}</button>
          </form>
        </div>
      </main>
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
