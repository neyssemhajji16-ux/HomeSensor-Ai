const mongoose = require('mongoose');

const sensorDataSchema = new mongoose.Schema({
  temperature: { type: Number, required: true },
  humidity:    { type: Number, required: true },
  gas:         { type: Number, required: true },
  device_id:   { type: String, default: 'ESP32-01' },
  timestamp:   { type: Date,   default: Date.now }
});

sensorDataSchema.index({ timestamp: -1 });
sensorDataSchema.index({ device_id: 1, timestamp: -1 });

module.exports = mongoose.model('SensorData', sensorDataSchema);
