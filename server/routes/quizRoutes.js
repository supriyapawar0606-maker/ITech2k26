const express = require("express");
const router = express.Router();
const {
  startAttempt,
  saveAnswer,
  submitAttempt,
  autoSubmitAttempt,
  getResult,
} = require("../controllers/quizController");
const { protect, requireRole } = require("../middleware/auth");

router.use(protect);
router.use(requireRole("student"));

router.post("/:competitionId/start", startAttempt);
router.patch("/:attemptId/answer", saveAnswer);
router.post("/:attemptId/submit", submitAttempt);
router.post("/:attemptId/auto-submit", autoSubmitAttempt);
router.get("/:attemptId/result", getResult);

module.exports = router;
