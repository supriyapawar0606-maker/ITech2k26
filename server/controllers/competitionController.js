const Competition = require("../models/Competition");
const Question = require("../models/Question");

// @route GET /api/competitions/public/active  (no auth - for the public Home page banner)
exports.getPublicActiveCompetition = async (req, res) => {
  try {
    const competition = await Competition.findOne({ status: "active" }).sort({ startDate: 1 });
    if (!competition) return res.json({ competition: null });

    res.json({
      competition: {
        name: competition.name,
        description: competition.description,
        department: competition.department,
        startDate: competition.startDate,
        startTime: competition.startTime,
        durationMinutes: competition.durationMinutes,
        numberOfQuestions: competition.numberOfQuestions,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch competition", error: err.message });
  }
};

// @route POST /api/competitions  (admin)
exports.createCompetition = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      department,
      startDate,
      startTime,
      durationMinutes,
      numberOfQuestions,
      marksPerQuestion,
      negativeMarking,
      negativeMarksPerWrong,
      status,
    } = req.body;

    if (!name || !startDate || !startTime || !durationMinutes || !numberOfQuestions) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const competition = await Competition.create({
      name,
      description,
      category,
      department,
      startDate,
      startTime,
      durationMinutes,
      numberOfQuestions,
      marksPerQuestion,
      negativeMarking,
      negativeMarksPerWrong,
      status: status || "draft",
      createdBy: req.user.id,
    });

    res.status(201).json({ competition });
  } catch (err) {
    res.status(500).json({ message: "Failed to create competition", error: err.message });
  }
};

// @route GET /api/competitions  (admin: all, student: active only)
exports.listCompetitions = async (req, res) => {
  try {
    const filter = req.user.role === "admin" ? {} : { status: "active" };
    const competitions = await Competition.find(filter).sort({ startDate: 1 });
    res.json({ competitions });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch competitions", error: err.message });
  }
};

// @route GET /api/competitions/:id
exports.getCompetition = async (req, res) => {
  try {
    const competition = await Competition.findById(req.params.id);
    if (!competition) return res.status(404).json({ message: "Competition not found" });
    res.json({ competition });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch competition", error: err.message });
  }
};

// @route PUT /api/competitions/:id  (admin)
exports.updateCompetition = async (req, res) => {
  try {
    const competition = await Competition.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!competition) return res.status(404).json({ message: "Competition not found" });
    res.json({ competition });
  } catch (err) {
    res.status(500).json({ message: "Failed to update competition", error: err.message });
  }
};

// @route DELETE /api/competitions/:id  (admin)
exports.deleteCompetition = async (req, res) => {
  try {
    const competition = await Competition.findByIdAndDelete(req.params.id);
    if (!competition) return res.status(404).json({ message: "Competition not found" });
    await Question.deleteMany({ competition: competition._id });
    res.json({ message: "Competition deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete competition", error: err.message });
  }
};

// @route PATCH /api/competitions/:id/status  (admin) - activate/close
exports.setCompetitionStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["draft", "active", "closed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    const competition = await Competition.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!competition) return res.status(404).json({ message: "Competition not found" });
    res.json({ competition });
  } catch (err) {
    res.status(500).json({ message: "Failed to update status", error: err.message });
  }
};
