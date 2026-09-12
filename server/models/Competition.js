const mongoose = require("mongoose");

const competitionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    category: { type: String, trim: true },
    department: { type: String, trim: true }, // organizing/conducting department
    startDate: { type: Date, required: true },
    startTime: { type: String, required: true }, // e.g. "10:00"
    durationMinutes: { type: Number, required: true },
    numberOfQuestions: { type: Number, required: true },
    marksPerQuestion: { type: Number, default: 1 },
    negativeMarking: { type: Boolean, default: false },
    negativeMarksPerWrong: { type: Number, default: 0 },
    status: { type: String, enum: ["draft", "active", "closed"], default: "draft" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Competition", competitionSchema);
