require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const competitionRoutes = require("./routes/competitionRoutes");
const questionRoutes = require("./routes/questionRoutes");
const quizRoutes = require("./routes/quizRoutes");
const leaderboardRoutes = require("./routes/leaderboardRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

// =========================================================
// DATABASE
// =========================================================

connectDB();

// =========================================================
// CORS CONFIGURATION
// =========================================================

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "https://itech2k26-1.onrender.com",
];

  // Additional origins from Render environment variable
  ...(process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean)
    : []),
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests from Postman or server-to-server requests
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log("Blocked CORS origin:", origin);

      return callback(new Error("Not allowed by CORS"));
    },

    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

    allowedHeaders: ["Content-Type", "Authorization"],

    credentials: true,
  })
);

// Handle preflight requests
app.options("*", cors());

// =========================================================
// BODY PARSER
// =========================================================

app.use(express.json());

// =========================================================
// HEALTH CHECK
// =========================================================

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "QuizArena backend is running",
  });
});

// =========================================================
// ROUTES
// =========================================================

app.use("/api/auth", authRoutes);

app.use("/api/competitions", competitionRoutes);

app.use("/api/questions", questionRoutes);

app.use("/api/quiz", quizRoutes);

app.use("/api/leaderboard", leaderboardRoutes);

app.use("/api/admin", adminRoutes);

// =========================================================
// 404 HANDLER
// =========================================================

app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
    path: req.originalUrl,
  });
});

// =========================================================
// GLOBAL ERROR HANDLER
// =========================================================

app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);

  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({
      message: "CORS error: frontend origin is not allowed",
    });
  }

  res.status(500).json({
    message: "Internal server error",
    error: err.message,
  });
});

// =========================================================
// START SERVER
// =========================================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`QuizArena backend running on port ${PORT}`);
});