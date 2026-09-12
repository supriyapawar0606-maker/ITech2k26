const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");

const User = require("../models/User");
const Competition = require("../models/Competition");
const QuizAttempt = require("../models/QuizAttempt");
const Result = require("../models/Result");

const { COLLEGE_NAME, PROGRAM_LABEL } = require("../config/branding");

// ============================================================
// ADMIN DASHBOARD
// @route GET /api/admin/dashboard
// ============================================================
exports.getDashboardStats = async (req, res) => {
  try {
    const [
      totalParticipants,
      totalCompetitions,
      normalSubmissions,
      autoSubmissions,
    ] = await Promise.all([
      User.countDocuments({ role: "student" }),
      Competition.countDocuments(),
      QuizAttempt.countDocuments({ submissionType: "NORMAL" }),
      QuizAttempt.countDocuments({ submissionType: "AUTO_SUBMITTED" }),
    ]);

    const recentActivity = await QuizAttempt.find({
      status: "submitted",
    })
      .sort({ submittedAt: -1 })
      .limit(10)
      .populate("student", "fullName")
      .populate("competition", "name");

    res.json({
      totalParticipants,
      totalCompetitions,
      normalSubmissions,
      autoSubmissions,

      recentActivity: recentActivity.map((a) => ({
        studentName: a.student?.fullName || "Unknown Student",
        competitionName: a.competition?.name || "Unknown Competition",
        event: a.violationReason || "Normal Submit",
        submittedAt: a.submittedAt,
        submissionType: a.submissionType,
      })),
    });
  } catch (err) {
    console.error("Dashboard Error:", err);

    res.status(500).json({
      message: "Failed to fetch dashboard stats",
      error: err.message,
    });
  }
};

// ============================================================
// LIST STUDENTS
// @route GET /api/admin/students
// ============================================================
exports.listStudents = async (req, res) => {
  try {
    const students = await User.find({ role: "student" })
      .select("-password")
      .sort({ createdAt: -1 });

    res.json({ students });
  } catch (err) {
    console.error("List Students Error:", err);

    res.status(500).json({
      message: "Failed to fetch students",
      error: err.message,
    });
  }
};

// ============================================================
// UPDATE STUDENT STATUS
// @route PATCH /api/admin/students/:id/status
// ============================================================
exports.setStudentStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["active", "disabled"].includes(status)) {
      return res.status(400).json({
        message: "Invalid status",
      });
    }

    const student = await User.findOneAndUpdate(
      {
        _id: req.params.id,
        role: "student",
      },
      {
        status,
      },
      {
        new: true,
      }
    ).select("-password");

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    res.json({ student });
  } catch (err) {
    console.error("Set Student Status Error:", err);

    res.status(500).json({
      message: "Failed to update student status",
      error: err.message,
    });
  }
};

// ============================================================
// DELETE STUDENT
// @route DELETE /api/admin/students/:id
// ============================================================
exports.deleteStudent = async (req, res) => {
  try {
    const student = await User.findOneAndDelete({
      _id: req.params.id,
      role: "student",
    });

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    res.json({
      message: "Student removed",
    });
  } catch (err) {
    console.error("Delete Student Error:", err);

    res.status(500).json({
      message: "Failed to delete student",
      error: err.message,
    });
  }
};

// ============================================================
// SECURITY VIOLATIONS
// @route GET /api/admin/security-violations
// ============================================================
exports.getSecurityViolations = async (req, res) => {
  try {
    const [
      totalParticipants,
      normalSubmissions,
      autoSubmissions,
      tabSwitchCount,
      fullscreenExitCount,
    ] = await Promise.all([
      User.countDocuments({ role: "student" }),
      QuizAttempt.countDocuments({
        submissionType: "NORMAL",
      }),
      QuizAttempt.countDocuments({
        submissionType: "AUTO_SUBMITTED",
      }),
      QuizAttempt.countDocuments({
        violationReason: "TAB_SWITCH",
      }),
      QuizAttempt.countDocuments({
        violationReason: "FULLSCREEN_EXIT",
      }),
    ]);

    const recentViolations = await QuizAttempt.find({
      submissionType: "AUTO_SUBMITTED",
    })
      .sort({ submittedAt: -1 })
      .limit(20)
      .populate("student", "fullName")
      .populate("competition", "name");

    res.json({
      totalParticipants,
      normalSubmissions,
      autoSubmissions,
      tabSwitchCount,
      fullscreenExitCount,

      recentViolations: recentViolations.map((a) => ({
        studentName: a.student?.fullName || "Unknown Student",
        competitionName:
          a.competition?.name || "Unknown Competition",
        event: a.violationReason || "Security Violation",
        time: a.submittedAt,
        action: "Auto Submitted",
      })),
    });
  } catch (err) {
    console.error("Security Violations Error:", err);

    res.status(500).json({
      message: "Failed to fetch security violations",
      error: err.message,
    });
  }
};

// ============================================================
// COMPETITION REPORT
// @route GET /api/admin/reports/competition/:competitionId
// ============================================================
exports.getCompetitionReport = async (req, res) => {
  try {
    const { competitionId } = req.params;

    const results = await Result.find({
      competition: competitionId,
    });

    if (results.length === 0) {
      return res.json({
        totalParticipants: 0,
        totalAttempts: 0,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        passPercentage: 0,
      });
    }

    const scores = results.map((r) => r.score);

    const totalAttempts = results.length;

    const averageScore = Number(
      (
        scores.reduce((a, b) => a + b, 0) /
        totalAttempts
      ).toFixed(1)
    );

    const highestScore = Math.max(...scores);
    const lowestScore = Math.min(...scores);

    const passThresholdPercentage = 40;

    const passed = results.filter(
      (r) => r.percentage >= passThresholdPercentage
    ).length;

    const passPercentage = Number(
      ((passed / totalAttempts) * 100).toFixed(2)
    );

    res.json({
      totalParticipants: totalAttempts,
      totalAttempts,
      averageScore,
      highestScore,
      lowestScore,
      passPercentage,
    });
  } catch (err) {
    console.error("Competition Report Error:", err);

    res.status(500).json({
      message: "Failed to generate report",
      error: err.message,
    });
  }
};

// ============================================================
// STUDENT REPORT
// @route GET /api/admin/reports/student/:studentId
// ============================================================
exports.getStudentReport = async (req, res) => {
  try {
    const results = await Result.find({
      student: req.params.studentId,
    })
      .populate("competition", "name")
      .sort({ createdAt: -1 });

    res.json({
      attempts: results.map((r) => ({
        competitionName:
          r.competition?.name || "Unknown Competition",
        score: r.score,
        totalQuestions: r.totalQuestions,
        timeTakenSeconds: r.timeTakenSeconds,
        submissionType: r.submissionType,
        violationReason: r.violationReason,
      })),
    });
  } catch (err) {
    console.error("Student Report Error:", err);

    res.status(500).json({
      message: "Failed to generate student report",
      error: err.message,
    });
  }
};

// ============================================================
// EXPORT STUDENTS - EXCEL
// @route GET /api/admin/students/export/excel
// ============================================================
exports.exportStudentsExcel = async (req, res) => {
  try {
    const students = await User.find({
      role: "student",
    })
      .select("-password")
      .sort({ createdAt: -1 });

    const workbook = new ExcelJS.Workbook();

    const sheet = workbook.addWorksheet(
      "Registered Students"
    );

    sheet.mergeCells("A1:G1");

    sheet.getCell("A1").value = COLLEGE_NAME;

    sheet.getCell("A1").font = {
      bold: true,
      size: 14,
    };

    sheet.mergeCells("A2:G2");

    sheet.getCell("A2").value =
      `${PROGRAM_LABEL} — Registered Students`;

    sheet.getCell("A2").font = {
      italic: true,
      size: 11,
      color: {
        argb: "FF666666",
      },
    };

    sheet.addRow([]);

    const headerRow = sheet.addRow([
      "#",
      "Full Name",
      "Roll Number",
      "Email",
      "Department",
      "Year",
      "Status",
    ]);

    headerRow.font = {
      bold: true,
    };

    students.forEach((s, i) => {
      sheet.addRow([
        i + 1,
        s.fullName,
        s.rollNumber,
        s.email,
        s.department || "—",
        s.yearOrClass || "—",
        s.status,
      ]);
    });

    sheet.columns.forEach((col) => {
      col.width = 22;
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=registered-students.xlsx"
    );

    await workbook.xlsx.write(res);

    res.end();
  } catch (err) {
    console.error("Export Students Excel Error:", err);

    res.status(500).json({
      message: "Failed to export students",
      error: err.message,
    });
  }
};

// ============================================================
// EXPORT STUDENTS - PDF
// @route GET /api/admin/students/export/pdf
// ============================================================
exports.exportStudentsPDF = async (req, res) => {
  try {
    const students = await User.find({
      role: "student",
    })
      .select("-password")
      .sort({ createdAt: -1 });

    res.setHeader(
      "Content-Type",
      "application/pdf"
    );

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=registered-students.pdf"
    );

    const doc = new PDFDocument({
      margin: 40,
      size: "A4",
      layout: "landscape",
    });

    doc.pipe(res);

    doc
      .fontSize(16)
      .font("Helvetica-Bold")
      .text(COLLEGE_NAME, {
        align: "center",
      });

    doc
      .fontSize(11)
      .font("Helvetica")
      .fillColor("#555555")
      .text(
        `${PROGRAM_LABEL} — Registered Students`,
        {
          align: "center",
        }
      );

    doc.moveDown(1.2);

    doc.fillColor("#000000");

    const colX = [
      40,
      90,
      260,
      400,
      570,
      690,
    ];

    const headers = [
      "#",
      "Name",
      "Email",
      "Roll No.",
      "Dept",
      "Year",
    ];

    let y = doc.y;

    doc
      .font("Helvetica-Bold")
      .fontSize(10);

    headers.forEach((h, i) => {
      doc.text(
        h,
        colX[i],
        y,
        {
          width:
            (colX[i + 1] || 760) -
            colX[i],
        }
      );
    });

    doc
      .moveTo(40, y + 15)
      .lineTo(760, y + 15)
      .strokeColor("#cccccc")
      .stroke();

    doc
      .font("Helvetica")
      .fontSize(9);

    y += 22;

    students.forEach((s, i) => {
      if (y > 500) {
        doc.addPage({
          margin: 40,
          size: "A4",
          layout: "landscape",
        });

        y = 40;
      }

      const row = [
        String(i + 1),
        s.fullName,
        s.email,
        s.rollNumber,
        s.department || "—",
        s.yearOrClass || "—",
      ];

      row.forEach((val, idx) => {
        doc.text(
          val,
          colX[idx],
          y,
          {
            width:
              (colX[idx + 1] || 760) -
              colX[idx],
          }
        );
      });

      y += 18;
    });

    doc.end();
  } catch (err) {
    console.error("Export Students PDF Error:", err);

    res.status(500).json({
      message: "Failed to export students",
      error: err.message,
    });
  }
};

// ============================================================
// EXPORT RESULTS - EXCEL
// @route GET /api/admin/reports/competition/:competitionId/export/excel
// ============================================================
exports.exportResultsExcel = async (req, res) => {
  try {
    const competition = await Competition.findById(
      req.params.competitionId
    );

    if (!competition) {
      return res.status(404).json({
        message: "Competition not found",
      });
    }

    const results = await Result.find({
      competition: competition._id,
    })
      .populate(
        "student",
        "fullName rollNumber department"
      )
      .sort({
        score: -1,
        timeTakenSeconds: 1,
      });

    const workbook = new ExcelJS.Workbook();

    const sheet = workbook.addWorksheet(
      "Results"
    );

    sheet.mergeCells("A1:H1");

    sheet.getCell("A1").value = COLLEGE_NAME;

    sheet.getCell("A1").font = {
      bold: true,
      size: 14,
    };

    sheet.mergeCells("A2:H2");

    sheet.getCell("A2").value =
      `Results — ${competition.name}`;

    sheet.getCell("A2").font = {
      italic: true,
      size: 11,
      color: {
        argb: "FF666666",
      },
    };

    sheet.addRow([]);

    const headerRow = sheet.addRow([
      "Rank",
      "Name",
      "Roll No.",
      "Department",
      "Score",
      "Percentage",
      "Time Taken (min)",
      "Submission",
    ]);

    headerRow.font = {
      bold: true,
    };

    results.forEach((r, i) => {
      sheet.addRow([
        i + 1,
        r.student?.fullName || "Unknown",
        r.student?.rollNumber || "—",
        r.student?.department || "—",
        `${r.score}/${r.totalQuestions}`,
        `${r.percentage}%`,
        Math.round(
          r.timeTakenSeconds / 60
        ),
        r.submissionType ===
        "AUTO_SUBMITTED"
          ? `Auto (${r.violationReason || "Violation"})`
          : "Normal",
      ]);
    });

    sheet.columns.forEach((col) => {
      col.width = 20;
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=results-${competition.name.replace(
        /\s+/g,
        "-"
      )}.xlsx`
    );

    await workbook.xlsx.write(res);

    res.end();
  } catch (err) {
    console.error("Export Results Excel Error:", err);

    res.status(500).json({
      message: "Failed to export results",
      error: err.message,
    });
  }
};

// ============================================================
// EXPORT RESULTS - PDF
// @route GET /api/admin/reports/competition/:competitionId/export/pdf
// ============================================================
exports.exportResultsPDF = async (req, res) => {
  try {
    const competition = await Competition.findById(
      req.params.competitionId
    );

    if (!competition) {
      return res.status(404).json({
        message: "Competition not found",
      });
    }

    const results = await Result.find({
      competition: competition._id,
    })
      .populate(
        "student",
        "fullName rollNumber department"
      )
      .sort({
        score: -1,
        timeTakenSeconds: 1,
      });

    res.setHeader(
      "Content-Type",
      "application/pdf"
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=results-${competition.name.replace(
        /\s+/g,
        "-"
      )}.pdf`
    );

    const doc = new PDFDocument({
      margin: 40,
      size: "A4",
      layout: "landscape",
    });

    doc.pipe(res);

    doc
      .fontSize(16)
      .font("Helvetica-Bold")
      .text(COLLEGE_NAME, {
        align: "center",
      });

    doc
      .fontSize(11)
      .font("Helvetica")
      .fillColor("#555555")
      .text(
        `Results — ${competition.name}`,
        {
          align: "center",
        }
      );

    if (competition.department) {
      doc
        .fontSize(9)
        .text(
          `Conducted by: ${competition.department}`,
          {
            align: "center",
          }
        );
    }

    doc.moveDown(1.2);

    doc.fillColor("#000000");

    const colX = [
      40,
      90,
      260,
      400,
      520,
      610,
      700,
    ];

    const headers = [
      "Rank",
      "Name",
      "Roll No.",
      "Department",
      "Score",
      "%",
      "Time",
    ];

    let y = doc.y;

    doc
      .font("Helvetica-Bold")
      .fontSize(10);

    headers.forEach((h, i) => {
      doc.text(
        h,
        colX[i],
        y,
        {
          width:
            (colX[i + 1] || 760) -
            colX[i],
        }
      );
    });

    doc
      .moveTo(40, y + 15)
      .lineTo(760, y + 15)
      .strokeColor("#cccccc")
      .stroke();

    doc
      .font("Helvetica")
      .fontSize(9);

    y += 22;

    results.forEach((r, i) => {
      if (y > 500) {
        doc.addPage({
          margin: 40,
          size: "A4",
          layout: "landscape",
        });

        y = 40;
      }

      const row = [
        String(i + 1),
        r.student?.fullName || "Unknown",
        r.student?.rollNumber || "—",
        r.student?.department || "—",
        `${r.score}/${r.totalQuestions}`,
        `${r.percentage}%`,
        `${Math.round(
          r.timeTakenSeconds / 60
        )}m`,
      ];

      row.forEach((val, idx) => {
        doc.text(
          val,
          colX[idx],
          y,
          {
            width:
              (colX[idx + 1] || 760) -
              colX[idx],
          }
        );
      });

      y += 18;
    });

    doc.end();
  } catch (err) {
    console.error("Export Results PDF Error:", err);

    res.status(500).json({
      message: "Failed to export results",
      error: err.message,
    });
  }
};