const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const deviceRoutes = require('./routes/devices');
const sensorDataRoutes = require('./routes/sensordata');
const alertRoutes = require('./routes/alerts');

const authMiddleware = require('./middleware/auth');

const app = express();
app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/iot_project';
mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

app.use('/auth', authRoutes);
app.use('/devices', authMiddleware, deviceRoutes);
app.use('/sensordata', authMiddleware, sensorDataRoutes);
app.use('/alerts', authMiddleware, alertRoutes);

app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
console.log('PORT from env:', process.env.PORT);

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
