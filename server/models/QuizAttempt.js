const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema(
  {
    question: { type: mongoose.Schema.Types.ObjectId, ref: "Question", required: true },
    selectedOptionIndex: { type: Number, default: null }, // null = not attempted
  },
  { _id: false }
);

const quizAttemptSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    competition: { type: mongoose.Schema.Types.ObjectId, ref: "Competition", required: true },
    questionOrder: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],
    answers: [answerSchema],

    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date },

    status: {
      type: String,
      enum: ["in_progress", "submitted"],
      default: "in_progress",
    },
    submissionType: {
      type: String,
      enum: ["NORMAL", "AUTO_SUBMITTED", null],
      default: null,
    },
    violationReason: {
      type: String,
      enum: ["TAB_SWITCH", "FULLSCREEN_EXIT", "WINDOW_BLUR", "TIME_EXPIRED", null],
      default: null,
    },
  },
  { timestamps: true }
);

quizAttemptSchema.index({ student: 1, competition: 1 }, { unique: true });

module.exports = mongoose.model("QuizAttempt", quizAttemptSchema);
