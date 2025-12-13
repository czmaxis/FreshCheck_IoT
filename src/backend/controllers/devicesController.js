const Device = require('../models/Device');

exports.getDevices = async (req, res) => {
    try {
        const devices = await Device.find({ ownerId: req.user.id });
        res.json(devices);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createDevice = async (req, res) => {
    try {
        const { name, type, location, threshold } = req.body; // přidáno threshold
        if (!name || !type) {
            return res.status(400).json({ message: 'Name and type are required' });
        }

        const device = new Device({
            name,
            type,
            location,
            ownerId: req.user.id,
            threshold // ukládáme limity
        });

        await device.save();
        res.json({ status: 'created', device });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateDevice = async (req, res) => {
    try {
        const { name, type, location, threshold } = req.body;

        const updated = await Device.findOneAndUpdate(
            { _id: req.params.id, ownerId: req.user.id },
            { name, type, location, threshold }, // aktualizujeme i threshold
            { new: true }
        );

        if (!updated)
            return res.status(404).json({ message: 'Device not found' });

        res.json({ status: 'updated', device: updated });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteDevice = async (req, res) => {
    try {
        const result = await Device.findOneAndDelete({
            _id: req.params.id,
            ownerId: req.user.id
        });

        if (!result)
            return res.status(404).json({ message: 'Device not found' });

        res.json({ status: 'deleted', device: result });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
