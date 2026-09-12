const express = require("express");
const router = express.Router();
const {
  createQuestion,
  listQuestions,
  updateQuestion,
  deleteQuestion,
  bulkImportQuestions,
} = require("../controllers/questionController");
const { protect, requireRole } = require("../middleware/auth");

router.use(protect);

router.get("/", listQuestions);

router.post("/", requireRole("admin"), createQuestion);
router.post("/bulk", requireRole("admin"), bulkImportQuestions);
router.put("/:id", requireRole("admin"), updateQuestion);
router.delete("/:id", requireRole("admin"), deleteQuestion);

module.exports = router;
