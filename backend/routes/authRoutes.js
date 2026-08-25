const express = require("express");
const bcrypt = require("bcryptjs");
const Student = require("../models/Student");

const router = express.Router();

// POST /api/auth/login  { name, password }
router.post("/login", async (req, res) => {
  try {
    const { name, password } = req.body;
    const student = await Student.findOne({ name });
    if (!student) return res.status(404).json({ message: "Student not found" });

    const ok = await bcrypt.compare(password, student.password);
    if (!ok) return res.status(401).json({ message: "Incorrect password" });

    res.json({
      id: student._id,
      name: student.name,
      points: student.points,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/admin-login  { password }
router.post("/admin-login", (req, res) => {
  const { password } = req.body;
  if (password === (process.env.ADMIN_PASSWORD || "change-me")) {
    return res.json({ ok: true });
  }
  res.status(401).json({ ok: false, message: "Wrong admin password" });
});

module.exports = router;
