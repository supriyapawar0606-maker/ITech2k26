const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    competition: { type: mongoose.Schema.Types.ObjectId, ref: "Competition", required: true },
    questionText: { type: String, required: true },
    options: {
      type: [String],
      validate: (v) => v.length >= 2,
      required: true,
    },
    correctOptionIndex: { type: Number, required: true }, // index into options[]
    category: { type: String, trim: true },
    marks: { type: Number, default: 1 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Question", questionSchema);
