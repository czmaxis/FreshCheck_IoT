const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// POST /auth/register
router.post('/register', async (req, res) => {
    const { email, password, name } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ error: 'Email already in use' });

        const passwordHash = await bcrypt.hash(password, 10);

        const user = new User({ email, passwordHash, name });
        await user.save();

        res.json({ status: 'ok', userId: user._id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: 'User not found' });

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) return res.status(400).json({ error: 'Invalid password' });

        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET || 'secret123',
            { expiresIn: '1d' }
        );

        res.json({
            token,
            user: { _id: user._id, email: user.email, name: user.name }
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /auth/:id - aktualizace uživatele
router.put('/:id', async (req, res) => {
    const header = req.headers.authorization;
    if (!header) return res.status(401).json({ message: 'Missing authorization header' });

    const jwtToken = header.split(' ')[1];
    let decoded;

    try {
        decoded = jwt.verify(jwtToken, process.env.JWT_SECRET || 'secret123');
    } catch (err) {
        return res.status(401).json({ message: 'Invalid JWT token' });
    }

    if (decoded.id !== req.params.id) {
        return res.status(403).json({ message: 'Cannot edit other users' });
    }

    try {
        const { email, name, password } = req.body;
        const updateData = {};
        if (email) updateData.email = email;
        if (name) updateData.name = name;
        if (password) updateData.passwordHash = await bcrypt.hash(password, 10);

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        if (!updatedUser) return res.status(404).json({ message: 'User not found' });

        res.json({ status: 'updated', user: { _id: updatedUser._id, email: updatedUser.email, name: updatedUser.name } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /auth/:id - smazání uživatele
router.delete('/:id', async (req, res) => {
    const header = req.headers.authorization;
    if (!header) return res.status(401).json({ message: 'Missing authorization header' });

    const jwtToken = header.split(' ')[1];
    let decoded;

    try {
        decoded = jwt.verify(jwtToken, process.env.JWT_SECRET || 'secret123');
    } catch (err) {
        return res.status(401).json({ message: 'Invalid JWT token' });
    }

    if (decoded.id !== req.params.id) {
        return res.status(403).json({ message: 'Cannot delete other users' });
    }

    try {
        const deletedUser = await User.findByIdAndDelete(req.params.id);
        if (!deletedUser) return res.status(404).json({ message: 'User not found' });

        res.json({ status: 'deleted', message: `User ${deletedUser.email} removed` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
