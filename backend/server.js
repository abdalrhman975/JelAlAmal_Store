require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const upload = require("./middleware/uploadMiddleware");

const authRoutes = require("./routes/authRoutes");
const studentRoutes = require("./routes/studentRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const uploadRoutes = require("./routes/uploadRoutes"); // إضافة مسار الرفع المستقل

const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// تمرير upload إلى الـ routes
app.use((req, res, next) => {
  req.upload = upload;
  next();
});

// المسارات (Routes)
app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/upload", uploadRoutes); // ربط مسار /api/upload

app.get("/", (req, res) => res.send("Masjid Market API is running"));

const PORT = process.env.PORT || 5000;

const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("❌ DB connection error:", err.message);
    process.exit(1);
  });