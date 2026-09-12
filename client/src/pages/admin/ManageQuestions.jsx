import { useEffect, useMemo, useState } from "react";
import { Search, Trash2, Plus, Pencil, X, Upload } from "lucide-react";
import api from "../../api/axios";
import AdminSidebar from "../../components/AdminSidebar";
import Topbar from "../../components/Topbar";
import { ITECH_QUIZ_2K26_QUESTIONS } from "../../data/itechQuiz2k26Questions";

const emptyForm = {
  questionText: "",
  options: ["", "", "", ""],
  correctOptionIndex: 0,
  category: "",
  marks: 1,
};

const PAGE_SIZE = 6;

export default function ManageQuestions() {
  const [competitions, setCompetitions] = useState([]);
  const [competitionId, setCompetitionId] = useState("");
  const [questions, setQuestions] = useState([]);

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const [error, setError] = useState("");
  const [competitionError, setCompetitionError] = useState("");

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [loadingCompetitions, setLoadingCompetitions] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [addingQuestion, setAddingQuestion] = useState(false);

  // =========================================================
  // BULK IMPORT (paste a JSON array of questions at once)
  // =========================================================

  const [bulkText, setBulkText] = useState(
    JSON.stringify(ITECH_QUIZ_2K26_QUESTIONS, null, 2)
  );
  const [bulkImporting, setBulkImporting] = useState(false);
  const [bulkError, setBulkError] = useState("");
  const [bulkSuccess, setBulkSuccess] = useState("");

  // =========================================================
  // LOAD COMPETITIONS
  // =========================================================

  useEffect(() => {
    const loadCompetitions = async () => {
      try {
        setLoadingCompetitions(true);
        setCompetitionError("");

        const res = await api.get("/competitions");

        console.log("COMPETITIONS RESPONSE:", res.data);

        const competitionList = res.data?.competitions || [];

        setCompetitions(competitionList);

        if (competitionList.length > 0) {
          setCompetitionId(competitionList[0]._id);
        } else {
          setCompetitionError("No competitions found. Please create a competition first.");
        }
      } catch (err) {
        console.error("COMPETITIONS ERROR:", err);
        console.error("STATUS:", err.response?.status);
        console.error("SERVER RESPONSE:", err.response?.data);

        setCompetitionError(
          err.response?.data?.message ||
            "Failed to load competitions"
        );
      } finally {
        setLoadingCompetitions(false);
      }
    };

    loadCompetitions();
  }, []);

  // =========================================================
  // LOAD QUESTIONS
  // =========================================================

  const loadQuestions = async () => {
    if (!competitionId) {
      setQuestions([]);
      return;
    }

    try {
      setLoadingQuestions(true);
      setError("");

      console.log(
        "Loading questions for competition:",
        competitionId
      );

      const res = await api.get(
        `/questions?competition=${competitionId}`
      );

      console.log("QUESTIONS RESPONSE:", res.data);

      setQuestions(res.data?.questions || []);
    } catch (err) {
      console.error("QUESTIONS ERROR:", err);
      console.error("STATUS:", err.response?.status);
      console.error("SERVER RESPONSE:", err.response?.data);

      setError(
        err.response?.data?.message ||
          "Failed to load questions"
      );

      setQuestions([]);
    } finally {
      setLoadingQuestions(false);
    }
  };

  useEffect(() => {
    setPage(1);
    setEditingId(null);
    setForm({ ...emptyForm, options: ["", "", "", ""] });

    if (competitionId) {
      loadQuestions();
    }
  }, [competitionId]);

  // =========================================================
  // SEARCH
  // =========================================================

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return questions.filter(
      (q) =>
        (q.questionText || "").toLowerCase().includes(term) ||
        (q.category || "").toLowerCase().includes(term)
    );
  }, [questions, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filtered.length / PAGE_SIZE)
  );

  const pageItems = filtered.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  // =========================================================
  // UPDATE OPTION
  // =========================================================

  const updateOption = (index, value) => {
    const options = [...form.options];

    options[index] = value;

    setForm({
      ...form,
      options,
    });
  };

  // =========================================================
  // CREATE QUESTION
  // =========================================================

  const handleSave = async (e) => {
    e.preventDefault();

    setError("");

    // -----------------------------------------
    // VALIDATION
    // -----------------------------------------

    if (!competitionId) {
      setError("Please select a competition first.");
      return;
    }

    if (!form.questionText.trim()) {
      setError("Please enter the question.");
      return;
    }

    if (form.options.length < 2) {
      setError("At least 2 options are required.");
      return;
    }

    const cleanedOptions = form.options.map((option) =>
      option.trim()
    );

    if (cleanedOptions.some((option) => option === "")) {
      setError("Please fill all four options.");
      return;
    }

    const correctIndex = Number(form.correctOptionIndex);

    if (
      correctIndex < 0 ||
      correctIndex >= cleanedOptions.length
    ) {
      setError("Please select a correct option.");
      return;
    }

    const marks = Number(form.marks);

    if (!marks || marks <= 0) {
      setError("Marks must be greater than 0.");
      return;
    }

    // -----------------------------------------
    // DATA SENT TO BACKEND
    // -----------------------------------------

    const questionData = {
      competition: competitionId,
      questionText: form.questionText.trim(),
      options: cleanedOptions,
      correctOptionIndex: correctIndex,
      category: form.category.trim() || "General",
      marks: marks,
    };

    try {
      setAddingQuestion(true);

      if (editingId) {
        await api.put(`/questions/${editingId}`, questionData);
      } else {
        await api.post("/questions", questionData);
      }

      // Reset form
      setForm({
        ...emptyForm,
        options: ["", "", "", ""],
      });
      setEditingId(null);

      // Reload questions
      await loadQuestions();

    } catch (err) {
      console.error(
        editingId ? "UPDATE QUESTION ERROR:" : "CREATE QUESTION ERROR:",
        err
      );

      setError(
        err.response?.data?.message ||
          (editingId ? "Failed to update question" : "Failed to add question")
      );
    } finally {
      setAddingQuestion(false);
    }
  };

  // =========================================================
  // EDIT QUESTION
  // =========================================================

  const handleBulkImport = async () => {
    setBulkError("");
    setBulkSuccess("");

    if (!competitionId) {
      setBulkError("Please select a competition first.");
      return;
    }

    let parsed;
    try {
      parsed = JSON.parse(bulkText);
    } catch (err) {
      setBulkError("That's not valid JSON — check for a missing comma or bracket.");
      return;
    }

    if (!Array.isArray(parsed) || parsed.length === 0) {
      setBulkError("Expected a JSON array of question objects.");
      return;
    }

    try {
      setBulkImporting(true);
      const res = await api.post("/questions/bulk", {
        competition: competitionId,
        questions: parsed,
      });
      setBulkSuccess(`Imported ${res.data.count} question(s).`);
      await loadQuestions();
    } catch (err) {
      console.error("BULK IMPORT ERROR:", err);
      setBulkError(err.response?.data?.message || "Bulk import failed");
    } finally {
      setBulkImporting(false);
    }
  };

  const startEdit = (q) => {
    setEditingId(q._id);
    setForm({
      questionText: q.questionText || "",
      options: q.options && q.options.length >= 2 ? [...q.options] : ["", "", "", ""],
      correctOptionIndex: q.correctOptionIndex ?? 0,
      category: q.category || "",
      marks: q.marks || 1,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ ...emptyForm, options: ["", "", "", ""] });
    setError("");
  };

  // =========================================================
  // DELETE QUESTION
  // =========================================================

  const remove = async (id) => {
    const confirmed = window.confirm(
      "Delete this question?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await api.delete(`/questions/${id}`);

      await loadQuestions();

    } catch (err) {
      console.error(
        "DELETE QUESTION ERROR:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to delete question"
      );
    }
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      <AdminSidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">

        <Topbar
          title="Question Management"
          subtitle="Add, edit or remove quiz questions"
          name="Admin"
        />

        {/* =========================================
            COMPETITION ERROR
        ========================================= */}

        {competitionError && (
          <div className="mb-5 bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm">
            {competitionError}
          </div>
        )}

        <div className="grid lg:grid-cols-[1fr_360px] gap-6 items-start">

          {/* =========================================
              QUESTIONS TABLE
          ========================================= */}

          <div className="card overflow-hidden table-shell">

            <div className="p-5 border-b border-slate-100 flex flex-wrap gap-3 items-center justify-between">

              {/* SEARCH */}

              <div className="relative flex-1 min-w-[180px]">

                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  className="input-field pl-9"
                  placeholder="Search question or category..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />

              </div>

              {/* COMPETITION SELECT */}

              <select
                value={competitionId}
                onChange={(e) => {
                  setCompetitionId(e.target.value);
                  setPage(1);
                }}
                className="input-field w-auto text-sm"
                disabled={loadingCompetitions}
              >

                <option value="">
                  {loadingCompetitions
                    ? "Loading competitions..."
                    : "Select Competition"}
                </option>

                {competitions.map((competition) => (
                  <option
                    key={competition._id}
                    value={competition._id}
                  >
                    {competition.name}
                  </option>
                ))}

              </select>

            </div>

            {/* =========================================
                TABLE
            ========================================= */}

            <div className="overflow-x-auto">
            <table className="min-w-[640px]">

              <thead>
                <tr>
                  <th>#</th>
                  <th>Question</th>
                  <th>Category</th>
                  <th>Marks</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>

                {loadingQuestions ? (

                  <tr>
                    <td
                      colSpan={5}
                      className="p-8 text-center text-slate-400"
                    >
                      Loading questions...
                    </td>
                  </tr>

                ) : pageItems.length === 0 ? (

                  <tr>
                    <td
                      colSpan={5}
                      className="p-8 text-center text-slate-400"
                    >
                      No questions found.
                    </td>
                  </tr>

                ) : (

                  pageItems.map((q, i) => (

                    <tr key={q._id}>

                      <td className="text-slate-500">
                        {(page - 1) * PAGE_SIZE + i + 1}
                      </td>

                      <td className="font-medium text-navy-900 max-w-xs truncate">
                        {q.questionText}
                      </td>

                      <td className="whitespace-nowrap">

                        <span className="badge bg-slate-100 text-slate-600">
                          {q.category || "General"}
                        </span>

                      </td>

                      <td>
                        {q.marks}
                      </td>

                      <td>

                        <div className="flex gap-2">
                          <button
                            onClick={() => startEdit(q)}
                            className="btn-ghost"
                          >
                            <Pencil size={13} />
                            Edit
                          </button>

                          <button
                            onClick={() => remove(q._id)}
                            className="btn-danger-ghost"
                          >
                            <Trash2 size={13} />
                            Delete
                          </button>
                        </div>

                      </td>

                    </tr>

                  ))

                )}

              </tbody>

            </table>
            </div>

            {/* =========================================
                PAGINATION
            ========================================= */}

            {filtered.length > PAGE_SIZE && (

              <div className="flex items-center justify-center gap-1.5 p-4 border-t border-slate-100">

                {Array.from(
                  { length: totalPages },
                  (_, i) => i + 1
                ).map((number) => (

                  <button
                    key={number}
                    onClick={() => setPage(number)}
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

          {/* =========================================
              ADD QUESTION FORM
          ========================================= */}

          <form
            onSubmit={handleSave}
            className="card p-6 space-y-3"
          >

            <h2 className="font-semibold text-navy-900 mb-1 flex items-center justify-between">

              <span className="flex items-center gap-1.5">
                <Plus
                  size={16}
                  className="text-brand"
                />
                {editingId ? "Edit Question" : "Add Question"}
              </span>

              {editingId && (
                <button type="button" onClick={cancelEdit} className="text-slate-400 hover:text-slate-600">
                  <X size={16} />
                </button>
              )}

            </h2>

            {/* ERROR */}

            {error && (

              <div className="bg-red-50 border border-red-100 text-red-600 text-xs rounded-lg px-3 py-2">
                {error}
              </div>

            )}

            {/* QUESTION */}

            <textarea
              className="input-field"
              placeholder="Question text"
              rows={2}
              value={form.questionText}
              onChange={(e) =>
                setForm({
                  ...form,
                  questionText: e.target.value,
                })
              }
              required
            />

            {/* OPTIONS */}

            {form.options.map((option, index) => (

              <div
                key={index}
                className="flex items-center gap-2"
              >

                <input
                  type="radio"
                  checked={
                    form.correctOptionIndex === index
                  }
                  onChange={() =>
                    setForm({
                      ...form,
                      correctOptionIndex: index,
                    })
                  }
                  className="accent-brand w-4 h-4 shrink-0"
                />

                <input
                  className="input-field"
                  placeholder={`Option ${String.fromCharCode(
                    65 + index
                  )}`}
                  value={option}
                  onChange={(e) =>
                    updateOption(
                      index,
                      e.target.value
                    )
                  }
                  required
                />

              </div>

            ))}

            {/* CATEGORY + MARKS */}

            <div className="grid grid-cols-2 gap-2">

              <input
                className="input-field"
                placeholder="Category"
                value={form.category}
                onChange={(e) =>
                  setForm({
                    ...form,
                    category: e.target.value,
                  })
                }
              />

              <input
                type="number"
                min="1"
                className="input-field"
                placeholder="Marks"
                value={form.marks}
                onChange={(e) =>
                  setForm({
                    ...form,
                    marks: Number(e.target.value),
                  })
                }
              />

            </div>

            {/* SUBMIT */}

            <button
              type="submit"
              className="btn-primary w-full"
              disabled={
                addingQuestion ||
                loadingCompetitions ||
                !competitionId
              }
            >

              {addingQuestion
                ? (editingId ? "Updating Question..." : "Adding Question...")
                : (editingId ? "Update Question" : "Add Question")}

            </button>

          </form>

          {/* =========================================
              BULK IMPORT
          ========================================= */}

          <div className="card p-6 space-y-3 lg:col-span-2">

            <h2 className="font-semibold text-navy-900 mb-1 flex items-center gap-1.5">
              <Upload size={16} className="text-brand" />
              Bulk Import Questions
            </h2>

            <p className="text-xs text-slate-500">
              Paste a JSON array of questions and import them all at once for the selected competition above.
              The box below is pre-filled with the 40 "ITech Quiz 2K26" questions — just pick the right
              competition and click Import.
            </p>

            {bulkError && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-xs rounded-lg px-3 py-2">
                {bulkError}
              </div>
            )}

            {bulkSuccess && (
              <div className="bg-green-50 border border-green-100 text-green-700 text-xs rounded-lg px-3 py-2">
                {bulkSuccess}
              </div>
            )}

            <textarea
              className="input-field font-mono text-xs"
              rows={8}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              spellCheck={false}
            />

            <button
              type="button"
              onClick={handleBulkImport}
              className="btn-primary w-full sm:w-auto"
              disabled={bulkImporting || loadingCompetitions || !competitionId}
            >
              {bulkImporting ? "Importing..." : "Import Questions"}
            </button>

          </div>

        </div>

      </main>
    </div>
  );
}