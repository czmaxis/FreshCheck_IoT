const SensorData = require('../models/SensorData');

exports.getDataByDevice = async (req, res) => {
    try {
        const data = await SensorData.find({ deviceId: req.params.deviceId })
            .sort({ timestamp: -1 })
            .limit(100);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.addData = async (req, res) => {
    try {
        const entry = new SensorData({
            deviceId: req.body.deviceId,
            temperature: req.body.temperature,
            humidity: req.body.humidity,
            light: req.body.light,
            doorState: req.body.doorState,
            acc: req.body.acc
        });

        await entry.save();
        res.json(entry);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
