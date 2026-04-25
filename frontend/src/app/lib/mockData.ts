// Types and mock data for the IoT monitoring system

export interface SensorData {
  id:          string;
  zone:        string;
  temperature: number;
  humidity:    number;
  gasLevel:    number;   // normalized ppm
  status:      'normal' | 'warning' | 'critical';
  lastUpdate:  Date;
  position:    { x: number; y: number };

  // ── ESP32-specific fields ────────────────────────────────────────
  motion?:        boolean;
  soundDetected?: boolean;
  gasDetected?:   boolean;
  gasLevelRaw?:   number;    // raw ADC 0-4095
  flameDetected?: boolean;
  lux?:           number;
  isNight?:       boolean;
  alertActive?:   boolean;
  alertPriority?: number;    // 0-3
  alertMessage?:  string;
  servoOuvert?:   boolean;
  buzzerOn?:      boolean;
  ledRougeOn?:    boolean;
  ledVerteOn?:    boolean;
  uptime?:        number;
  connected?:     boolean;
}

export interface Alert {
  id:           string;
  sensorId:     string;
  zone:         string;
  type:         'temperature' | 'humidity' | 'gas' | 'flame' | 'sound' | 'motion';
  severity:     'warning' | 'critical';
  message:      string;
  timestamp:    Date;
  acknowledged: boolean;
}

export interface AIPrediction {
  sensorId:          string;
  zone:              string;
  predictedAnomaly:  string;
  probability:       number;
  timeframe:         string;
  recommendation:    string;
}

// ── Initial mock sensors (used as fallback when ESP32 is offline) ────
export const mockSensors: SensorData[] = [
  {
    id:          'ESP32-SMARTHOME',
    zone:        'Smart House',
    temperature: 24.0,
    humidity:    50,
    gasLevel:    0.05,
    status:      'normal',
    lastUpdate:  new Date(),
    position:    { x: 50, y: 50 },
    connected:   false,
    alertActive: false,
    alertMessage: '',
    servoOuvert: false,
    buzzerOn:    false,
    motion:      false,
    flameDetected: false,
    gasDetected:   false,
  },
];

export const mockAlerts: Alert[] = [];

export const mockPredictions: AIPrediction[] = [
  {
    sensorId:         'ESP32-SMARTHOME',
    zone:             'Smart House',
    predictedAnomaly: 'Connecting to ESP32...',
    probability:      0,
    timeframe:        'Waiting for sensor data',
    recommendation:   'Make sure ESP32 is powered and connected to WiFi',
  },
];

// ── Determine sensor status from ESP32 data ──────────────────────────
export function esp32ToStatus(data: Partial<SensorData>): 'normal' | 'warning' | 'critical' {
  if (data.flameDetected || data.gasDetected) return 'critical';
  if ((data.alertPriority ?? 0) >= 2)         return 'warning';
  if ((data.alertPriority ?? 0) >= 1)         return 'warning';
  return 'normal';
}

// ── Generate historical chart data ───────────────────────────────────
export const generateHistoricalData = (hours: number = 24) => {
  const data = [];
  const now  = Date.now();
  for (let i = hours; i >= 0; i--) {
    const timestamp = new Date(now - i * 60 * 60 * 1000);
    data.push({
      time:        timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      temperature: 20 + Math.random() * 10 + Math.sin(i / 4) * 5,
      humidity:    45 + Math.random() * 15 + Math.cos(i / 3) * 10,
      gasLevel:    0.01 + Math.random() * 0.1,
    });
  }
  return data;
};
