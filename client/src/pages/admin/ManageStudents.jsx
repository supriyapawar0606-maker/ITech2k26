import { useEffect, useMemo, useState } from "react";
import { Search, Trash2, FileSpreadsheet, FileDown } from "lucide-react";
import api from "../../api/axios";
import AdminSidebar from "../../components/AdminSidebar";
import Topbar from "../../components/Topbar";

const PAGE_SIZE = 8;

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

export default function ManageStudents() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("All");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);

  const handleExport = async (type) => {
    try {
      setExporting(true);
      await downloadFile(
        `/admin/students/export/${type}`,
        `registered-students.${type === "excel" ? "xlsx" : "pdf"}`
      );
    } catch (err) {
      alert(err.response?.data?.message || "Export failed");
    } finally {
      setExporting(false);
    }
  };

  // ==========================================
  // LOAD STUDENTS
  // ==========================================
  const load = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await api.get("/admin/students");

      console.log("STUDENTS RESPONSE:", res.data);

      setStudents(
        Array.isArray(res.data.students)
          ? res.data.students
          : []
      );
    } catch (err) {
      console.error("Failed to load students:", err);

      setError(
        err.response?.data?.message ||
          "Failed to load students"
      );

      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // LOAD ON PAGE OPEN
  // ==========================================
  useEffect(() => {
    load();
  }, []);

  // ==========================================
  // TOGGLE STUDENT STATUS
  // ==========================================
  const toggleStatus = async (student) => {
    try {
      const newStatus =
        student.status === "active"
          ? "disabled"
          : "active";

      await api.patch(
        `/admin/students/${student._id}/status`,
        {
          status: newStatus,
        }
      );

      await load();
    } catch (err) {
      console.error(
        "Failed to update student status:",
        err
      );

      alert(
        err.response?.data?.message ||
          "Failed to update student status"
      );
    }
  };

  // ==========================================
  // DELETE STUDENT
  // ==========================================
  const remove = async (id) => {
    if (!window.confirm("Remove this student?")) {
      return;
    }

    try {
      await api.delete(`/admin/students/${id}`);

      await load();

      setPage((currentPage) => {
        const remainingStudents = students.length - 1;

        const maxPage = Math.max(
          1,
          Math.ceil(
            remainingStudents / PAGE_SIZE
          )
        );

        return Math.min(
          currentPage,
          maxPage
        );
      });
    } catch (err) {
      console.error(
        "Failed to delete student:",
        err
      );

      alert(
        err.response?.data?.message ||
          "Failed to delete student"
      );
    }
  };

  // ==========================================
  // GET DEPARTMENTS
  // ==========================================
  const departments = useMemo(() => {
    const uniqueDepartments = students
      .map(
        (student) =>
          student?.department
      )
      .filter(
        (department) =>
          department &&
          typeof department === "string"
      );

    return [
      "All",
      ...new Set(uniqueDepartments),
    ];
  }, [students]);

  // ==========================================
  // SEARCH + DEPARTMENT FILTER
  // ==========================================
  const filtered = useMemo(() => {
    const searchText = search
      .trim()
      .toLowerCase();

    return students.filter((student) => {
      // Safely handle missing values
      const fullName = String(
        student?.fullName ||
          student?.name ||
          ""
      ).toLowerCase();

      const email = String(
        student?.email || ""
      ).toLowerCase();

      const rollNumber = String(
        student?.rollNumber || ""
      ).toLowerCase();

      const department = String(
        student?.department || ""
      );

      // Department filter
      const matchesDepartment =
        dept === "All" ||
        department === dept;

      // Search filter
      const matchesSearch =
        searchText === "" ||
        fullName.includes(searchText) ||
        email.includes(searchText) ||
        rollNumber.includes(searchText);

      return (
        matchesDepartment &&
        matchesSearch
      );
    });
  }, [students, search, dept]);

  // ==========================================
  // PAGINATION
  // ==========================================
  const totalPages = Math.max(
    1,
    Math.ceil(
      filtered.length / PAGE_SIZE
    )
  );

  const pageItems = filtered.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  // ==========================================
  // PREVENT INVALID PAGE
  // ==========================================
  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  // ==========================================
  // UI
  // ==========================================
  return (
    <div className="flex flex-col lg:flex-row min-h-screen">

      {/* SIDEBAR */}
      <AdminSidebar />

      {/* MAIN CONTENT */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">

        {/* TOPBAR */}
        <Topbar
          title="Registered Students"
          subtitle="View all registered participants"
          name="Admin"
          actions={
            <>
              <button onClick={() => handleExport("excel")} disabled={exporting} className="btn-secondary">
                <FileSpreadsheet size={14} /> Export Excel
              </button>
              <button onClick={() => handleExport("pdf")} disabled={exporting} className="btn-secondary">
                <FileDown size={14} /> Export PDF
              </button>
            </>
          }
        />

        {/* ERROR MESSAGE */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* MAIN CARD */}
        <div className="card overflow-hidden table-shell">

          {/* =================================
              SEARCH + DEPARTMENT FILTER
          ================================= */}
          <div className="p-5 border-b border-slate-100 flex flex-wrap gap-3 items-center justify-between">

            {/* SEARCH */}
            <div className="relative flex-1 min-w-[200px]">

              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                className="input-field pl-9"
                placeholder="Search name, email, roll no..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />

            </div>

            {/* DEPARTMENT */}
            <select
              value={dept}
              onChange={(e) => {
                setDept(e.target.value);
                setPage(1);
              }}
              className="input-field w-auto text-sm"
            >
              {departments.map(
                (department) => (
                  <option
                    key={department}
                    value={department}
                  >
                    {department}
                  </option>
                )
              )}
            </select>

          </div>

          {/* =================================
              STUDENTS TABLE
          ================================= */}
          <div className="overflow-x-auto">

            <table className="min-w-[900px]">

              {/* TABLE HEADER */}
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Roll No.</th>
                  <th>Department</th>
                  <th>Year</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              {/* TABLE BODY */}
              <tbody>

                {/* LOADING */}
                {loading && (
                  <tr>
                    <td
                      colSpan={8}
                      className="p-8 text-center text-slate-400"
                    >
                      Loading students...
                    </td>
                  </tr>
                )}

                {/* STUDENT DATA */}
                {!loading &&
                  pageItems.map(
                    (student, index) => {

                      // Safe values
                      const fullName =
                        student?.fullName ||
                        student?.name ||
                        "Unknown Student";

                      const email =
                        student?.email ||
                        "—";

                      const rollNumber =
                        student?.rollNumber ||
                        "—";

                      const department =
                        student?.department ||
                        "—";

                      const year =
                        student?.yearOrClass ||
                        "—";

                      const status =
                        student?.status ||
                        "active";

                      const initial =
                        fullName
                          .charAt(0)
                          .toUpperCase();

                      return (
                        <tr
                          key={student._id}
                        >

                          {/* NUMBER */}
                          <td className="text-slate-500">
                            {(page - 1) *
                              PAGE_SIZE +
                              index +
                              1}
                          </td>

                          {/* NAME */}
                          <td>
                            <div className="flex items-center gap-2.5">

                              <span className="w-8 h-8 rounded-full bg-brand-50 text-brand flex items-center justify-center text-xs font-semibold shrink-0">
                                {initial}
                              </span>

                              <span className="font-medium text-navy-900">
                                {fullName}
                              </span>

                            </div>
                          </td>

                          {/* EMAIL */}
                          <td className="text-slate-500">
                            {email}
                          </td>

                          {/* ROLL NUMBER */}
                          <td className="text-slate-500">
                            {rollNumber}
                          </td>

                          {/* DEPARTMENT */}
                          <td className="text-slate-500">
                            {department}
                          </td>

                          {/* YEAR */}
                          <td className="text-slate-500">
                            {year}
                          </td>

                          {/* STATUS */}
                          <td>

                            <button
                              onClick={() =>
                                toggleStatus(
                                  student
                                )
                              }
                              className={`badge ${
                                status ===
                                "active"
                                  ? "bg-green-50 text-success"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {status}
                            </button>

                          </td>

                          {/* DELETE */}
                          <td>

                            <button
                              onClick={() =>
                                remove(
                                  student._id
                                )
                              }
                              className="btn-danger-ghost"
                            >
                              <Trash2
                                size={13}
                              />

                              Delete
                            </button>

                          </td>

                        </tr>
                      );
                    }
                  )}

                {/* NO STUDENTS */}
                {!loading &&
                  pageItems.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="p-8 text-center text-slate-400"
                      >
                        No students found.
                      </td>
                    </tr>
                  )}

              </tbody>

            </table>

          </div>

          {/* =================================
              PAGINATION
          ================================= */}
          {!loading &&
            filtered.length > PAGE_SIZE && (
              <div className="flex items-center justify-center gap-1.5 p-4 border-t border-slate-100">

                {Array.from(
                  {
                    length: totalPages,
                  },
                  (_, i) => i + 1
                ).map((number) => (

                  <button
                    key={number}
                    onClick={() =>
                      setPage(number)
                    }
                    className={`w-8 h-8 rounded-lg text-xs font-medium ${
                      number === page
                        ? "bg-brand text-white"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                  >
                    {number}
                  </button>

                ))}

              </div>
            )}

        </div>

      </main>

    </div>
  );
}