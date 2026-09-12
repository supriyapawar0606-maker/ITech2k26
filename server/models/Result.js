const mongoose = require("mongoose");

const resultSchema = new mongoose.Schema(
  {
    attempt: { type: mongoose.Schema.Types.ObjectId, ref: "QuizAttempt", required: true, unique: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    competition: { type: mongoose.Schema.Types.ObjectId, ref: "Competition", required: true },

    totalQuestions: { type: Number, required: true },
    attempted: { type: Number, required: true },
    correct: { type: Number, required: true },
    wrong: { type: Number, required: true },
    unattempted: { type: Number, required: true },

    score: { type: Number, required: true },
    percentage: { type: Number, required: true },
    timeTakenSeconds: { type: Number, required: true },

    submissionType: { type: String, enum: ["NORMAL", "AUTO_SUBMITTED"], required: true },
    violationReason: { type: String, default: null },
  },
  { timestamps: true }
);

resultSchema.index({ competition: 1, score: -1, timeTakenSeconds: 1 });

module.exports = mongoose.model("Result", resultSchema);
