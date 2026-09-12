const express = require("express");
const router = express.Router();
const {
  getDashboardStats,
  listStudents,
  setStudentStatus,
  deleteStudent,
  getSecurityViolations,
  getCompetitionReport,
  getStudentReport,
  exportStudentsExcel,
  exportStudentsPDF,
  exportResultsExcel,
  exportResultsPDF,
} = require("../controllers/adminController");
const { protect, requireRole } = require("../middleware/auth");

router.use(protect);
router.use(requireRole("admin"));

router.get("/dashboard", getDashboardStats);

router.get("/students/export/excel", exportStudentsExcel);
router.get("/students/export/pdf", exportStudentsPDF);
router.get("/students", listStudents);
router.patch("/students/:id/status", setStudentStatus);
router.delete("/students/:id", deleteStudent);

router.get("/security-violations", getSecurityViolations);

router.get("/reports/competition/:competitionId/export/excel", exportResultsExcel);
router.get("/reports/competition/:competitionId/export/pdf", exportResultsPDF);
router.get("/reports/competition/:competitionId", getCompetitionReport);
router.get("/reports/student/:studentId", getStudentReport);

module.exports = router;
