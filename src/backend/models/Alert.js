const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
    deviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Device', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['temperature', 'humidity', 'door'], required: true },
    value: Number,
    active: { type: Boolean, default: true },
    timestamp: { type: Date, default: Date.now },
    resolvedAt: Date
});

module.exports = mongoose.model('Alert', alertSchema);
