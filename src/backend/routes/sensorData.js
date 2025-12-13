// src/backend/routes/sensorData.js
const express = require("express");
const router = express.Router();

const SensorData = require("../models/SensorData");
const Device = require("../models/Device");
const Alert = require("../models/Alert");
const authMiddleware = require("../middleware/auth");

// --------- middleware for IoT devices using x-device-token ----------
async function deviceAuth(req, res, next) {
  try {
    const token = req.headers["x-device-token"];
    if (!token) {
      return res
        .status(401)
        .json({ message: "DEVICE: Missing x-device-token header" });
    }

    const device = await Device.findOne({ permanentToken: token });
    if (!device) {
      return res.status(403).json({ message: "DEVICE: Invalid device token" });
    }

    req.device = device;
    next();
  } catch (err) {
    console.error("deviceAuth error:", err);
    res.status(500).json({ error: err.message });
  }
}

// =====================  POST /sensordata  =====================
// Called by Node-RED / IoT device with:
//   header: x-device-token: <permanentToken>
//   body:   { temperature?, humidity?, illuminance?, doors? }
router.post("/", deviceAuth, async (req, res) => {
  try {
    const deviceId = req.device._id;

    // Debug: see EXACTLY what Node-RED sends
    console.log("POST /sensordata body:", req.body);

    const { temperature, humidity, illuminance, doors } = req.body;

    const entry = new SensorData({
      deviceId,
      temperature:
        temperature !== undefined ? Number(temperature) : undefined,
      humidity: humidity !== undefined ? Number(humidity) : undefined,
      illuminance:
        illuminance !== undefined ? Number(illuminance) : undefined,
      doors:
        doors === true ||
        doors === "true" ||
        doors === 1 ||
        doors === "1",
    });

    await entry.save();

    // (optional) alert logic, kept simple
    if (req.device.threshold) {
      const t = req.device.threshold;
      const alertsToCreate = [];

      if (
        t.temperature !== undefined &&
        entry.temperature !== undefined &&
        entry.temperature > t.temperature
      ) {
        alertsToCreate.push({
          deviceId,
          userId: req.device.ownerId,
          type: "temperature",
          value: entry.temperature,
        });
      }

      if (
        t.humidity !== undefined &&
        entry.humidity !== undefined &&
        entry.humidity > t.humidity
      ) {
        alertsToCreate.push({
          deviceId,
          userId: req.device.ownerId,
          type: "humidity",
          value: entry.humidity,
        });
      }

      if (t.doorOpenMaxSeconds !== undefined && entry.doors) {
        alertsToCreate.push({
          deviceId,
          userId: req.device.ownerId,
          type: "door",
          value: 1,
        });
      }

      for (const alertData of alertsToCreate) {
        const existing = await Alert.findOne({
          deviceId: alertData.deviceId,
          userId: alertData.userId,
          type: alertData.type,
          active: true,
        });

        if (!existing) {
          const alert = new Alert(alertData);
          await alert.save();
        }
      }
    }

    res.json(entry);
  } catch (err) {
    console.error("Error in POST /sensordata:", err);
    res.status(500).json({ error: err.message });
  }
});

// =====================  GET /sensordata/:deviceId  =====================
// Web app reads data → needs JWT
router.get("/:deviceId", authMiddleware, async (req, res) => {
  try {
    const deviceId = req.params.deviceId;
    if (!deviceId) {
      return res.status(400).json({ message: "Device ID is required" });
    }

    const data = await SensorData.find({ deviceId })
      .sort({ timestamp: -1 })
      .limit(100);

    res.json(data);
  } catch (err) {
    console.error("Error in GET /sensordata/:deviceId:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
