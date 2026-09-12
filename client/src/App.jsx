import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import AdminLogin from "./pages/AdminLogin";
import Dashboard from "./pages/Dashboard";
import QuizInstructions from "./pages/QuizInstructions";
import QuizAttempt from "./pages/QuizAttempt";
import QuizResult from "./pages/QuizResult";
import Leaderboard from "./pages/Leaderboard";
import Profile from "./pages/Profile";
import QuizInfo from "./pages/QuizInfo";
import MyResults from "./pages/MyResults";

import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageCompetition from "./pages/admin/ManageCompetition";
import ManageQuestions from "./pages/admin/ManageQuestions";
import ManageStudents from "./pages/admin/ManageStudents";
import AdminResults from "./pages/admin/AdminResults";
import AdminLeaderboard from "./pages/admin/AdminLeaderboard";
import SecurityViolations from "./pages/admin/SecurityViolations";
import Reports from "./pages/admin/Reports";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/admin-login" element={<AdminLogin />} />

      {/* Student */}
      <Route path="/dashboard" element={<ProtectedRoute role="student"><Dashboard /></ProtectedRoute>} />
      <Route path="/quiz/:competitionId/instructions" element={<ProtectedRoute role="student"><QuizInstructions /></ProtectedRoute>} />
      <Route path="/quiz/:competitionId/attempt" element={<ProtectedRoute role="student"><QuizAttempt /></ProtectedRoute>} />
      <Route path="/quiz/:attemptId/result" element={<ProtectedRoute role="student"><QuizResult /></ProtectedRoute>} />
      <Route path="/leaderboard/:competitionId" element={<ProtectedRoute role="student"><Leaderboard /></ProtectedRoute>} />
      <Route path="/leaderboard" element={<ProtectedRoute role="student"><Leaderboard /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute role="student"><Profile /></ProtectedRoute>} />
      <Route path="/quizzes" element={<ProtectedRoute role="student"><QuizInfo /></ProtectedRoute>} />
      <Route path="/instructions" element={<ProtectedRoute role="student"><QuizInfo /></ProtectedRoute>} />
      <Route path="/attempts" element={<ProtectedRoute role="student"><MyResults /></ProtectedRoute>} />

      {/* Admin */}
      <Route path="/admin/dashboard" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/competitions" element={<ProtectedRoute role="admin"><ManageCompetition /></ProtectedRoute>} />
      <Route path="/admin/questions" element={<ProtectedRoute role="admin"><ManageQuestions /></ProtectedRoute>} />
      <Route path="/admin/students" element={<ProtectedRoute role="admin"><ManageStudents /></ProtectedRoute>} />
      <Route path="/admin/results" element={<ProtectedRoute role="admin"><AdminResults /></ProtectedRoute>} />
      <Route path="/admin/leaderboard" element={<ProtectedRoute role="admin"><AdminLeaderboard /></ProtectedRoute>} />
      <Route path="/admin/security-violations" element={<ProtectedRoute role="admin"><SecurityViolations /></ProtectedRoute>} />
      <Route path="/admin/reports" element={<ProtectedRoute role="admin"><Reports /></ProtectedRoute>} />
    </Routes>
  );
}
