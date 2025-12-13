// src/backend/app.js
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const deviceRoutes = require("./routes/devices");
const sensorDataRoutes = require("./routes/sensorData");
const alertRoutes = require("./routes/alerts");

const authMiddleware = require("./middleware/auth");

const app = express();

// ----- Global middleware -----
app.use(cors());
app.use(express.json());

// Optional debug logger so we see incoming requests
app.use((req, res, next) => {
  console.log(">>> INCOMING REQUEST:", req.method, req.url);
  next();
});

// ----- MongoDB connection -----
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/iot_project";

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ----- Routes -----

// Public auth endpoints (login / register)
app.use("/auth", authRoutes);

// User must be logged in (JWT) to manage devices & alerts
app.use("/devices", authMiddleware, deviceRoutes);
app.use("/alerts", authMiddleware, alertRoutes);

// Sensor data route:
// - POST /sensordata        → device token (handled inside routes/sensorData.js)
// - GET  /sensordata/:id    → JWT (handled inside routes/sensorData.js)
app.use("/sensordata", sensorDataRoutes);

// ----- Error handler -----
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// ----- Start server -----
// HARD-CODE PORT (ignore env for now while debugging)
const PORT = 5001;

app.listen(PORT, () => {
  console.log("### DEBUG SERVER ### running on PORT =", PORT);
});

