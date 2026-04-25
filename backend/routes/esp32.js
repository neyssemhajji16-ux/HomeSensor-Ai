const express = require('express');
const router  = express.Router();
const http    = require('http');

const ESP32_IP = process.env.ESP32_IP || '192.168.1.100';

// ── Shared in-memory state (set by server.js polling) ───────────────
let _esp32State     = {};
let _esp32Connected = false;
let _latestPrediction = null;

function setESP32State(state, connected) {
  _esp32State     = state;
  _esp32Connected = connected;
}

function setLatestPrediction(prediction) {
  _latestPrediction = prediction;
}

// ── HTTP helper → POST to ESP32 ─────────────────────────────────────
function esp32Post(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: ESP32_IP,
      port:     80,
      path,
      method:   'POST',
      timeout:  4000,
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        try   { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: {}              }); }
      });
    });
    req.on('error',   reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.end();
  });
}

// ── GET /api/esp32/status ────────────────────────────────────────────
router.get('/status', (req, res) => {
  res.json({ ..._esp32State, connected: _esp32Connected, ip: ESP32_IP });
});

// ── GET /api/esp32/prediction ────────────────────────────────────────
router.get('/prediction', (req, res) => {
  res.json(_latestPrediction || {});
});

// ── POST /api/esp32/prediction/trigger ───────────────────────────────
router.post('/prediction/trigger', async (req, res) => {
  const { predictDangerMistral } = require('../server');
  if (!predictDangerMistral) return res.status(500).json({ error: 'Function not found' });
  
  // Use dummy data if ESP32 offline
  const t = _esp32State.temperature || 36;
  const h = _esp32State.humidity || 50;
  const g = _esp32State.gasLevel || 350;
  
  const prediction = await predictDangerMistral(t, h, g);
  if (prediction) {
    const enriched = { ...prediction, sensorId: 'ESP32-SMARTHOME', zone: 'Smart House', timestamp: new Date() };
    setLatestPrediction(enriched);
    return res.json(enriched);
  }
  res.status(500).json({ error: 'Failed to generate prediction' });
});

// ── POST /api/esp32/cmd/door/open ────────────────────────────────────
router.post('/cmd/door/open', async (req, res) => {
  try {
    const result = await esp32Post('/api/cmd/door/open');
    res.status(result.status).json(result.body);
  } catch (err) {
    res.status(503).json({ ok: false, reason: 'esp32_unreachable' });
  }
});

// ── POST /api/esp32/cmd/door/close ───────────────────────────────────
router.post('/cmd/door/close', async (req, res) => {
  try {
    const result = await esp32Post('/api/cmd/door/close');
    res.status(result.status).json(result.body);
  } catch (err) {
    res.status(503).json({ ok: false, reason: 'esp32_unreachable' });
  }
});

// ── POST /api/esp32/cmd/buzzer/off ───────────────────────────────────
router.post('/cmd/buzzer/off', async (req, res) => {
  try {
    const result = await esp32Post('/api/cmd/buzzer/off');
    res.status(result.status).json(result.body);
  } catch (err) {
    res.status(503).json({ ok: false, reason: 'esp32_unreachable' });
  }
});

// ── POST /api/esp32/cmd/reset ────────────────────────────────────────
router.post('/cmd/reset', async (req, res) => {
  try {
    const result = await esp32Post('/api/cmd/reset');
    res.status(result.status).json(result.body);
  } catch (err) {
    res.status(503).json({ ok: false, reason: 'esp32_unreachable' });
  }
});

module.exports = { router, setESP32State, setLatestPrediction };
