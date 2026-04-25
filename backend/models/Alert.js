const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  type:      { type: String, enum: ['temperature', 'humidity', 'gas', 'flame', 'sound', 'motion'], required: true },
  value:     { type: Number, required: true },
  level:     { type: String, enum: ['warning', 'critical'], required: true },
  device_id: { type: String, default: 'ESP32-01' },
  resolved:  { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Alert', alertSchema);
