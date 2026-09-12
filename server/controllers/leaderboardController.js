const Result = require("../models/Result");
const Competition = require("../models/Competition");

// @route GET /api/leaderboard/:competitionId
exports.getLeaderboard = async (req, res) => {
  try {
    const { competitionId } = req.params;

    // Check competition ID
    const competition = await Competition.findById(competitionId);

    if (!competition) {
      return res.status(404).json({
        message: "Competition not found",
      });
    }

    // Get results
    const results = await Result.find({
      competition: competitionId,
    })
      .sort({
        score: -1,
        timeTakenSeconds: 1,
      })
      .populate("student", "fullName department");

    // Create leaderboard safely
    const leaderboard = results.map((r, index) => ({
      rank: index + 1,

      studentId: r.student?._id || null,

      studentName: r.student?.fullName || "Unknown Student",

      department: r.student?.department || "N/A",

      score: r.score ?? 0,

      totalQuestions: r.totalQuestions ?? 0,

      timeTakenSeconds: r.timeTakenSeconds ?? 0,
    }));

    return res.json({
      competition: competition.name,
      leaderboard,
    });
  } catch (err) {
    console.error("❌ Leaderboard Error:", err);

    return res.status(500).json({
      message: "Failed to fetch leaderboard",
      error: err.message,
    });
  }
};