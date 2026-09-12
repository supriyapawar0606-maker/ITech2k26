const express = require("express");
const router = express.Router();
const { getLeaderboard } = require("../controllers/leaderboardController");
const { protect } = require("../middleware/auth");

router.use(protect);
router.get("/:competitionId", getLeaderboard);

module.exports = router;
