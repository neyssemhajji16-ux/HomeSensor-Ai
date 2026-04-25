# IoT Surveillance Intelligente — PFE
## Système de Surveillance Température · Humidité · Gaz

---

## Structure du projet

```
iot-project/
├── backend/
│   ├── server.js              ← Serveur Express + MQTT + WebSocket
│   ├── esp32_firmware.ino     ← Code Arduino pour ESP32
│   ├── .env.example           ← Variables d'environnement
│   ├── models/
│   │   ├── SensorData.js      ← Modèle MongoDB données capteurs
│   │   └── Alert.js           ← Modèle MongoDB alertes
│   └── routes/
│       ├── sensors.js         ← API REST capteurs
│       ├── alerts.js          ← API REST alertes
│       └── reports.js         ← Génération PDF
├── frontend/
│   └── src/
│       ├── App.jsx            ← Composant principal React
│       ├── App.css            ← Styles dashboard
│       └── components/
│           ├── SensorCard.jsx ← Carte capteur avec mini-graphique
│           ├── MainChart.jsx  ← Graphique historique temps réel
│           └── index.jsx      ← AlertPanel, AIPrediction, SensorMap, StatsPanel
└── ml_model/
    └── train_model.py         ← Modèle IA Random Forest + IsolationForest
```

---

## Installation

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# Modifier .env avec tes infos (MongoDB, Email, MQTT)
npm run dev
```

### 2. Frontend

```bash
cd frontend
npm install
npm start
```

### 3. MQTT Broker (Mosquitto)

```bash
# Ubuntu/Debian
sudo apt install mosquitto mosquitto-clients
sudo systemctl start mosquitto

# Test
mosquitto_pub -t "iot/sensors/data" -m '{"temperature":38,"humidity":65,"gas":350,"device_id":"ESP32-01"}'
```

### 4. MongoDB

```bash
# Ubuntu/Debian
sudo apt install mongodb
sudo systemctl start mongodb
```

### 5. Modèle IA

```bash
cd ml_model
pip install scikit-learn pandas numpy joblib
python train_model.py
```

### 6. ESP32

1. Ouvrir `backend/esp32_firmware.ino` dans Arduino IDE
2. Installer bibliothèques: `PubSubClient`, `DHT sensor library`, `ArduinoJson`
3. Modifier `WIFI_SSID`, `WIFI_PASS`, `MQTT_SERVER`
4. Téléverser sur ESP32

---

## API REST

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | /api/sensors/latest | Dernière mesure |
| GET | /api/sensors/history?limit=50 | Historique |
| GET | /api/sensors/stats | Statistiques du jour |
| POST | /api/sensors/manual | Ajouter mesure manuellement |
| GET | /api/alerts | Liste des alertes |
| PUT | /api/alerts/:id/resolve | Résoudre une alerte |
| GET | /api/reports/generate | Télécharger rapport PDF |

---

## Technologies utilisées

| Couche | Technologies |
|--------|-------------|
| Hardware | ESP32, DHT22, MQ-2, LED, Buzzer |
| Communication | MQTT (Mosquitto), WebSocket (Socket.io) |
| Backend | Node.js, Express, MongoDB, Mongoose |
| Frontend | React.js, Chart.js, CSS3 |
| IA/ML | Python, scikit-learn (Random Forest, IsolationForest) |
| Rapport | PDFKit |
| Email | Nodemailer |
