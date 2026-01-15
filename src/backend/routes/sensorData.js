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
router.post("/", deviceAuth, async (req, res) => {
  try {
    const device = req.device;
    const deviceId = device._id;

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

    // ================= DOOR LOGIC =================
    if (typeof entry.doors === "boolean") {
      if (entry.doors === true) {
        if (!device.lastDoorOpenAt) {
          device.lastDoorOpenAt = new Date();
          await device.save();
        }
      }

      if (entry.doors === false && device.lastDoorOpenAt) {
        device.lastDoorOpenAt = null;
        await device.save();
      }

      const maxSeconds = device.threshold?.doorOpenMaxSeconds;

      if (
          device.lastDoorOpenAt &&
          maxSeconds &&
          Date.now() - device.lastDoorOpenAt.getTime() >
          maxSeconds * 1000
      ) {
        const existing = await Alert.findOne({
          deviceId,
          userId: device.ownerId,
          type: "door-open-too-long",
          active: true,
        });

        if (!existing) {
          await Alert.create({
            deviceId,
            userId: device.ownerId,
            type: "door-open-too-long",
            value: maxSeconds,
            active: true,
          });
        }
      }
    }

    // ================= TEMP / HUMIDITY LOGIC =================
    if (device.threshold) {
      const t = device.threshold;

      if (
          t.temperature &&
          entry.temperature !== undefined &&
          ((t.temperature.min !== undefined &&
                  entry.temperature < t.temperature.min) ||
              (t.temperature.max !== undefined &&
                  entry.temperature > t.temperature.max))
      ) {
        const existing = await Alert.findOne({
          deviceId,
          userId: device.ownerId,
          type: "temperature",
          active: true,
        });

        if (!existing) {
          await Alert.create({
            deviceId,
            userId: device.ownerId,
            type: "temperature",
            value: entry.temperature,
            active: true,
          });
        }
      }

      // HUMIDITY
      if (
          t.humidity &&
          entry.humidity !== undefined &&
          ((t.humidity.min !== undefined &&
                  entry.humidity < t.humidity.min) ||
              (t.humidity.max !== undefined &&
                  entry.humidity > t.humidity.max))
      ) {
        const existing = await Alert.findOne({
          deviceId,
          userId: device.ownerId,
          type: "humidity",
          active: true,
        });

        if (!existing) {
          await Alert.create({
            deviceId,
            userId: device.ownerId,
            type: "humidity",
            value: entry.humidity,
            active: true,
          });
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
