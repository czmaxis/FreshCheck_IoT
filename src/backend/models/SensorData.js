const mongoose = require('mongoose');

const sensorDataSchema = new mongoose.Schema({
    deviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Device', required: true },
    temperature: Number,
    humidity: Number,
    light: Number,
    doorState: Boolean,
    acc: {
        x: Number,
        y: Number,
        z: Number
    },
    timestamp: { type: Date, default: Date.now },
    doors: { type: Boolean, default: false },
});

// Index pro rychlé dotazy na time-series
sensorDataSchema.index({ deviceId: 1, timestamp: -1 });

module.exports = mongoose.model('SensorData', sensorDataSchema);
