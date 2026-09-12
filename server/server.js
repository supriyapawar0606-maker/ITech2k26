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
// CORS
// =========================================================
//
// ALLOWED_ORIGINS is a comma-separated list of frontend URLs, e.g.
//   ALLOWED_ORIGINS=https://quizarena.vercel.app,https://www.yourdomain.com
// Set this as an environment variable on your hosting platform (Render/Railway/etc.)
// once your frontend has a real deployed URL. Localhost is always allowed too,
// so local development keeps working without needing this variable set.

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  ...(process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
    : []),
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests without origin
      // such as Postman
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error("Not allowed by CORS")
      );
    },

    credentials: true,
  })
);

// =========================================================
// BODY PARSER
// =========================================================

app.use(express.json());

// =========================================================
// HEALTH CHECK
// =========================================================

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "QuizArena backend is running",
  });
});

// =========================================================
// ROUTES
// =========================================================

app.use("/api/auth", authRoutes);

app.use(
  "/api/competitions",
  competitionRoutes
);

app.use(
  "/api/questions",
  questionRoutes
);

app.use(
  "/api/quiz",
  quizRoutes
);

app.use(
  "/api/leaderboard",
  leaderboardRoutes
);

app.use(
  "/api/admin",
  adminRoutes
);

// =========================================================
// 404
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
  console.log(
    `QuizArena backend running on port ${PORT}`
  );
});