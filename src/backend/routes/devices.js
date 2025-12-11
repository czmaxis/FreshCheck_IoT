const express = require('express');
const router = express.Router();
const Device = require('../models/Device');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware); // všechny endpointy vyžadují přihlášení

// GET /devices - seznam zařízení pro přihlášeného uživatele
router.get('/', async (req, res) => {
    try {
        const devices = await Device.find({ ownerId: req.user.id });
        res.json(devices);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /devices - vytvoření nového zařízení s možností thresholdů
router.post('/', async (req, res) => {
    try {
        const { name, type, location, threshold } = req.body;

        if (!name || !type) {
            return res.status(400).json({ message: 'Name and type are required' });
        }

        const device = new Device({
            ownerId: req.user.id,
            name,
            type,
            location,
            threshold // volitelné pole pro limity
        });

        await device.save();
        res.json({ status: 'created', device });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /devices/:id - aktualizace zařízení a thresholdů
router.put('/:id', async (req, res) => {
    try {
        const { name, type, location, threshold } = req.body;

        const updated = await Device.findOneAndUpdate(
            { _id: req.params.id, ownerId: req.user.id },
            { name, type, location, threshold },
            { new: true }
        );

        if (!updated) return res.status(404).json({ message: 'Device not found' });

        res.json({ status: 'updated', device: updated });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /devices/:id - smazání zařízení
router.delete('/:id', async (req, res) => {
    try {
        const deleted = await Device.findOneAndDelete({
            _id: req.params.id,
            ownerId: req.user.id
        });

        if (!deleted) return res.status(404).json({ message: 'Device not found' });

        res.json({ status: 'deleted', device: deleted });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
