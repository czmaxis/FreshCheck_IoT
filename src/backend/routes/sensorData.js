const express = require('express');
const router = express.Router();
const SensorData = require('../models/SensorData');
const Device = require('../models/Device');
const Alert = require('../models/Alert');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// POST /sensordata
router.post('/', async (req, res) => {
    try {
        // pokud middleware našel device, použijeme jeho _id
        const deviceId = req.device ? req.device._id : req.body.deviceId;
        if (!deviceId) return res.status(400).json({ message: 'Device ID is required' });

        const entry = new SensorData({ ...req.body, deviceId });
        await entry.save();

        // Načteme zařízení s limity
        const device = await Device.findById(deviceId);

        if (device && device.threshold) {
            const alertsToCreate = [];

            // teplota
            if (device.threshold.temperature !== undefined && entry.temperature > device.threshold.temperature) {
                alertsToCreate.push({
                    deviceId,
                    userId: device.ownerId,
                    type: 'temperature',
                    value: entry.temperature
                });
            }

            // vlhkost
            if (device.threshold.humidity !== undefined && entry.humidity > device.threshold.humidity) {
                alertsToCreate.push({
                    deviceId,
                    userId: device.ownerId,
                    type: 'humidity',
                    value: entry.humidity
                });
            }

            // dveře – jednoduchá kontrola, jestli jsou otevřené
            if (device.threshold.doorOpenMaxSeconds !== undefined && entry.doors) {
                alertsToCreate.push({
                    deviceId,
                    userId: device.ownerId,
                    type: 'door',
                    value: 1 // nebo timestamp otevření
                });
            }

            // vytvoření alertů jen pokud neexistuje aktivní alert stejného typu
            for (let alertData of alertsToCreate) {
                const existing = await Alert.findOne({
                    deviceId: alertData.deviceId,
                    userId: alertData.userId,
                    type: alertData.type,
                    active: true
                });

                if (!existing) {
                    const alert = new Alert(alertData);
                    await alert.save();
                }
            }
        }

        res.json(entry);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /sensordata/:deviceId
router.get('/:deviceId', async (req, res) => {
    try {
        const deviceId = req.device ? req.device._id : req.params.deviceId;
        if (!deviceId) return res.status(400).json({ message: 'Device ID is required' });

        const data = await SensorData.find({ deviceId })
            .sort({ timestamp: -1 })
            .limit(100);

        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
