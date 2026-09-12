const express = require("express");
const router = express.Router();
const {
  getPublicActiveCompetition,
  createCompetition,
  listCompetitions,
  getCompetition,
  updateCompetition,
  deleteCompetition,
  setCompetitionStatus,
} = require("../controllers/competitionController");
const { protect, requireRole } = require("../middleware/auth");

// Public - no auth required (used by the Home page banner)
router.get("/public/active", getPublicActiveCompetition);

router.use(protect);

router.get("/", listCompetitions);
router.get("/:id", getCompetition);

router.post("/", requireRole("admin"), createCompetition);
router.put("/:id", requireRole("admin"), updateCompetition);
router.delete("/:id", requireRole("admin"), deleteCompetition);
router.patch("/:id/status", requireRole("admin"), setCompetitionStatus);

module.exports = router;
