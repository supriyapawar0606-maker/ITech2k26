const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const generateToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
  });

const sanitizeUser = (user) => ({
  id: user._id,
  fullName: user.fullName,
  rollNumber: user.rollNumber,
  email: user.email,
  department: user.department,
  yearOrClass: user.yearOrClass,
  role: user.role,
});

// @route POST /api/auth/register
exports.registerStudent = async (req, res) => {
  try {
    const { fullName, rollNumber, email, mobileNumber, department, yearOrClass, password } = req.body;

    if (!fullName || !rollNumber || !email || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const existing = await User.findOne({ $or: [{ email }, { rollNumber }] });
    if (existing) {
      return res.status(409).json({ message: "Email or roll number already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      fullName,
      rollNumber,
      email,
      mobileNumber,
      department,
      yearOrClass,
      password: hashedPassword,
      role: "student",
    });

    const token = generateToken(user);
    res.status(201).json({ token, user: sanitizeUser(user) });
  } catch (err) {
    res.status(500).json({ message: "Registration failed", error: err.message });
  }
};

// @route POST /api/auth/login  (student login by roll number or email)
exports.loginStudent = async (req, res) => {
  try {
    const { identifier, password } = req.body; // roll number or email

    if (!identifier || !password) {
      return res.status(400).json({ message: "Missing credentials" });
    }

    const user = await User.findOne({
      role: "student",
      $or: [{ email: identifier.toLowerCase() }, { rollNumber: identifier }],
    });

    if (!user || user.status === "disabled") {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user);
    res.json({ token, user: sanitizeUser(user) });
  } catch (err) {
    res.status(500).json({ message: "Login failed", error: err.message });
  }
};

// @route POST /api/auth/admin-login
exports.loginAdmin = async (req, res) => {
  try {
    const { adminId, password } = req.body; // adminId = email

    if (!adminId || !password) {
      return res.status(400).json({ message: "Missing credentials" });
    }

    const user = await User.findOne({ role: "admin", email: adminId.toLowerCase() });

    if (!user) {
      return res.status(401).json({ message: "Invalid admin credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid admin credentials" });
    }

    const token = generateToken(user);
    res.json({ token, user: sanitizeUser(user) });
  } catch (err) {
    res.status(500).json({ message: "Login failed", error: err.message });
  }
};

// @route GET /api/auth/me
exports.getMe = async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ user: sanitizeUser(user) });
};
