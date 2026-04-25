const express  = require('express');
const router   = express.Router();
const mongoose = require('mongoose');
const SensorData = require('../models/SensorData');

// Helper: returns true when MongoDB is connected
const dbReady = () => mongoose.connection.readyState === 1;

// GET /api/sensors/latest — Dernière mesure
router.get('/latest', async (req, res) => {
  if (!dbReady()) return res.json({});   // safe fallback when DB offline
  try {
    const data = await SensorData.findOne().sort({ timestamp: -1 });
    res.json(data || {});
  } catch (err) {
    res.json({});   // never crash the frontend
  }
});

// GET /api/sensors/history?limit=50 — Historique
router.get('/history', async (req, res) => {
  if (!dbReady()) return res.json([]);
  try {
    const limit = parseInt(req.query.limit) || 50;
    const data = await SensorData.find().sort({ timestamp: -1 }).limit(limit);
    res.json(data);
  } catch (err) {
    res.json([]);
  }
});

// GET /api/sensors/stats — Statistiques du jour
router.get('/stats', async (req, res) => {
  if (!dbReady()) return res.json({ count: 0, avg: {}, min: {}, max: {} });
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const data = await SensorData.find({ timestamp: { $gte: today } });
    if (data.length === 0) return res.json({ count: 0, avg: {}, min: {}, max: {} });
    res.json({
      count: data.length,
      avg: {
        temperature: +(data.reduce((s, d) => s + d.temperature, 0) / data.length).toFixed(1),
        humidity:    +(data.reduce((s, d) => s + d.humidity, 0)    / data.length).toFixed(1),
        gas:         +(data.reduce((s, d) => s + d.gas, 0)         / data.length).toFixed(1)
      },
      min: {
        temperature: Math.min(...data.map(d => d.temperature)),
        humidity:    Math.min(...data.map(d => d.humidity)),
        gas:         Math.min(...data.map(d => d.gas))
      },
      max: {
        temperature: Math.max(...data.map(d => d.temperature)),
        humidity:    Math.max(...data.map(d => d.humidity)),
        gas:         Math.max(...data.map(d => d.gas))
      }
    });
  } catch (err) {
    res.json({ count: 0, avg: {}, min: {}, max: {} });
  }
});

// POST /api/sensors/manual — Ajouter mesure manuellement
router.post('/manual', async (req, res) => {
  try {
    const { temperature, humidity, gas, device_id } = req.body;
    const entry = new SensorData({
      temperature, humidity, gas,
      device_id: device_id || 'MANUAL',
      timestamp: new Date()
    });
    await entry.save();
    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
