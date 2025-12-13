const mongoose = require("mongoose");

const sensorDataSchema = new mongoose.Schema({
  deviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Device",
    required: true,
  },

  temperature: Number,
  humidity: Number,      
  illuminance: Number,    
  doors: { type: Boolean, default: false },

  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("SensorData", sensorDataSchema);
