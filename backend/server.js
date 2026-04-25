const express    = require('express');
const http       = require('http');
const socketIo   = require('socket.io');
const cors       = require('cors');
const mqtt       = require('mqtt');
const mongoose   = require('mongoose');
const nodemailer = require('nodemailer');
const { Mistral } = require('@mistralai/mistralai');
require('dotenv').config();

const sensorRoutes = require('./routes/sensors');
const alertRoutes  = require('./routes/alerts');
const reportRoutes = require('./routes/reports');
const { router: esp32Router, setESP32State, setLatestPrediction } = require('./routes/esp32');

const mistral = new Mistral({ apiKey: process.env.MISTRAL_API_KEY || '' });

const app    = express();
const server = http.createServer(app);
const io     = socketIo(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// ── Middleware ───────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── MongoDB ──────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/iot_surveillance')
  .then(() => console.log('✅ MongoDB connecté'))
  .catch(err => console.error('❌ MongoDB erreur:', err));

// ── Routes ───────────────────────────────────────────────────────────
app.use('/api/sensors', sensorRoutes);
app.use('/api/alerts',  alertRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/esp32',   esp32Router);

app.get('/', (req, res) => res.json({ status: 'IoT Server running', version: '2.0.0' }));

// ── MQTT Client (pour autres capteurs futurs) ────────────────────────
const mqttClient = mqtt.connect(process.env.MQTT_BROKER || 'mqtt://localhost:1883');

mqttClient.on('connect', () => {
  console.log('✅ MQTT connecté');
  mqttClient.subscribe('iot/sensors/#');
});

const lastPredictionTime = {};

mqttClient.on('message', async (topic, message) => {
  try {
    const data = JSON.parse(message.toString());
    const { temperature, humidity, gas, device_id } = data;
    const timestamp = new Date();

    const SensorData = require('./models/SensorData');
    await new SensorData({ temperature, humidity, gas, device_id, timestamp }).save();

    const alerts = [];
    if (temperature > 35) alerts.push({ type: 'temperature', value: temperature, level: temperature > 40 ? 'critical' : 'warning' });
    if (humidity    > 80) alerts.push({ type: 'humidity',    value: humidity,    level: 'warning' });
    if (gas         > 300) alerts.push({ type: 'gas',        value: gas,         level: gas > 400 ? 'critical' : 'warning' });

    for (const alert of alerts) {
      const Alert  = require('./models/Alert');
      const saved  = await new Alert({ ...alert, device_id, timestamp }).save();
      io.emit('new_alert', saved);
      if (alert.level === 'critical') await sendEmailAlert(alert, device_id);
    }

    io.emit('sensor_data', { temperature, humidity, gas, device_id, timestamp });

    const now = Date.now();
    if (process.env.MISTRAL_API_KEY && (!lastPredictionTime[device_id] || now - lastPredictionTime[device_id] > 60000)) {
      lastPredictionTime[device_id] = now;
      predictDangerMistral(temperature, humidity, gas).then(prediction => {
        if (prediction) io.emit('ai_prediction', { ...prediction, device_id, timestamp });
      });
    }
  } catch (err) {
    console.error('Erreur MQTT message:', err);
  }
});

// ════════════════════════════════════════════════════════════════════
// ── ESP32 Direct HTTP Polling ────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════
const ESP32_IP      = process.env.ESP32_IP || '192.168.1.100';
let   esp32Connected = false;
let   esp32State     = {};
let   lastAlertMsg   = '';

function fetchESP32() {
  return new Promise((resolve, reject) => {
    const req = http.get(
      `http://${ESP32_IP}/api/data`,
      { timeout: 3000 },
      (res) => {
        let raw = '';
        res.on('data', chunk => (raw += chunk));
        res.on('end', () => {
          try   { resolve(JSON.parse(raw)); }
          catch { reject(new Error('JSON parse error')); }
        });
      }
    );
    req.on('error',   reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

// Normalize ESP32 raw gas ADC (0-4095) → ppm-equivalent (0-500)
function normalizeGas(raw) {
  return +((raw / 4095) * 500).toFixed(1);
}

// Map ESP32 alert priority → alert level string
function priorityToLevel(p) {
  if (p >= 3) return 'critical';
  if (p >= 1) return 'warning';
  return 'info';
}

// Poll every 2 seconds
setInterval(async () => {
  try {
    const data = await fetchESP32();
    esp32State    = data;
    esp32Connected = true;
    setESP32State(data, true);

    // ── Emit to frontend ──────────────────────────────────────────
    io.emit('esp32_data', {
      ...data,
      gasLevelPpm: normalizeGas(data.gasLevel),
      connected:   true,
      timestamp:   new Date(),
    });

    // ── Save to MongoDB ───────────────────────────────────────────
    const SensorData = require('./models/SensorData');
    await new SensorData({
      temperature: data.temperature,
      humidity:    data.humidity,
      gas:         normalizeGas(data.gasLevel),
      device_id:   'ESP32-SMARTHOME',
      timestamp:   new Date(),
    }).save();

    // ── Create alert if new message ───────────────────────────────
    if (data.alertActive && data.alertMessage && data.alertMessage !== lastAlertMsg) {
      lastAlertMsg = data.alertMessage;
      const Alert  = require('./models/Alert');
      const type   = data.flameDetected ? 'flame'
                   : data.gasDetected   ? 'gas'
                   : data.temperature > 35 ? 'temperature'
                   : data.soundDetected    ? 'sound'
                   : 'motion';
      const saved = await new Alert({
        type,
        value:     data.temperature,
        level:     priorityToLevel(data.alertPriority),
        device_id: 'ESP32-SMARTHOME',
        timestamp: new Date(),
      }).save();
      io.emit('new_alert', { ...saved.toObject(), message: data.alertMessage });

      if (saved.level === 'critical') {
        await sendEmailAlert({ type, value: data.temperature }, 'ESP32-SMARTHOME')
          .catch(e => console.error('Email erreur:', e.message));
      }
    }

    // Reset last alert when resolved
    if (!data.alertActive) lastAlertMsg = '';

    // ── AI Prediction (throttled 1 min) ───────────────────────────
    const now = Date.now();
    const key = 'ESP32-SMARTHOME';
    if (process.env.MISTRAL_API_KEY && (!lastPredictionTime[key] || now - lastPredictionTime[key] > 60000)) {
      lastPredictionTime[key] = now;
      predictDangerMistral(data.temperature, data.humidity, normalizeGas(data.gasLevel))
        .then(prediction => {
          if (prediction) {
            const enriched = { ...prediction, sensorId: key, zone: 'Smart House', timestamp: new Date() };
            setLatestPrediction(enriched);
            io.emit('ai_prediction', enriched);
          }
        });
    }
  } catch {
    if (esp32Connected) {
      esp32Connected = false;
      setESP32State({}, false);
      console.warn(`[ESP32] Déconnecté (${ESP32_IP}) — nouvelle tentative...`);
      io.emit('esp32_data', { connected: false });
    }
  }
}, 2000);

// ── AI Prediction avec Mistral ───────────────────────────────────────
async function predictDangerMistral(temp, hum, gas) {
  try {
    const prompt = `Analyse ces données IoT et évalue le danger: Temp=${temp}°C, Hum=${hum}%, Gaz=${gas}ppm. Seuils: 40°C, 400ppm.
    Réponds UNIQUEMENT en JSON strict avec ce format exact:
    {
      "predictedAnomaly": "Description courte de l'anomalie potentielle",
      "probability": <pourcentage de risque 0-100 entier>,
      "timeframe": "Estimation du temps (ex: 'Dans 2 heures', 'Immédiat')",
      "recommendation": "Action recommandée"
    }`;

    const response = await mistral.chat.complete({
      model:          'mistral-small-latest',
      messages:       [{ role: 'user', content: prompt }],
      responseFormat: { type: 'json_object' }
    });
    return JSON.parse(response.choices[0].message.content);
  } catch (err) {
    console.error('Erreur API Mistral:', err.message);
    return null;
  }
}

// Export for manual triggering if needed
module.exports.predictDangerMistral = predictDangerMistral;

// ── Email alertes ────────────────────────────────────────────────────
async function sendEmailAlert(alert, device_id) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return;
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
  });
  await transporter.sendMail({
    from:    process.env.EMAIL_USER,
    to:      process.env.ALERT_EMAIL,
    subject: `🚨 ALERTE CRITIQUE IoT — ${alert.type.toUpperCase()}`,
    html: `
      <h2>Alerte critique détectée</h2>
      <p><b>Type:</b> ${alert.type}</p>
      <p><b>Valeur:</b> ${alert.value}</p>
      <p><b>Capteur:</b> ${device_id}</p>
      <p><b>Heure:</b> ${new Date().toLocaleString('fr-FR')}</p>
    `
  });
}

// ── Socket.IO ────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[WS] Client connecté: ${socket.id}`);
  // Send current ESP32 state immediately on connect
  if (Object.keys(esp32State).length > 0) {
    socket.emit('esp32_data', {
      ...esp32State,
      gasLevelPpm: normalizeGas(esp32State.gasLevel || 0),
      connected:   esp32Connected,
      timestamp:   new Date(),
    });
  }
  socket.on('disconnect', () => console.log(`[WS] Client déconnecté: ${socket.id}`));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur port ${PORT}`);
  console.log(`📡 Polling ESP32 @ http://${ESP32_IP}/api/data`);
  console.log(`🔌 Socket.IO actif — événements: esp32_data, new_alert, ai_prediction`);
});

module.exports = { app, io };
