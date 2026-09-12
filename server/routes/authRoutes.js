const express = require("express");
const router = express.Router();
const { registerStudent, loginStudent, loginAdmin, getMe } = require("../controllers/authController");
const { protect } = require("../middleware/auth");

router.post("/register", registerStudent);
router.post("/login", loginStudent);
router.post("/admin-login", loginAdmin);
router.get("/me", protect, getMe);

module.exports = router;
