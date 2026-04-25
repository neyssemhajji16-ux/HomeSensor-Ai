import {
  createContext, useContext, useState, useEffect,
  useCallback, useRef, type ReactNode
} from 'react';
import {
  mockSensors, mockAlerts, mockPredictions,
  esp32ToStatus,
  type SensorData, type Alert, type AIPrediction,
} from './mockData';

// ── Backend URL (proxied via Vite dev server) ────────────────────────
const BACKEND = '/api';   // Vite proxy → http://localhost:5000

export interface Notification {
  id:        string;
  title:     string;
  message:   string;
  severity:  'warning' | 'critical' | 'info';
  timestamp: Date;
  read:      boolean;
}

export type SystemStatus = 'safe' | 'warning' | 'danger';

interface IoTContextType {
  sensors:          SensorData[];
  setSensors:       React.Dispatch<React.SetStateAction<SensorData[]>>;
  alerts:           Alert[];
  setAlerts:        React.Dispatch<React.SetStateAction<Alert[]>>;
  acknowledgeAlert: (id: string) => void;
  dismissAlert:     (id: string) => void;
  resetAllAlerts:   () => void;
  notifications:    Notification[];
  unreadCount:      number;
  markAsRead:       (id: string) => void;
  markAllAsRead:    () => void;
  isConnected:      boolean;
  esp32Connected:   boolean;
  lastUpdate:       Date;
  secondsAgo:       number;
  systemStatus:     SystemStatus;
  buzzerActive:     boolean;
  setBuzzerActive:  (v: boolean) => void;
  systemPowered:    boolean;
  setSystemPowered: (v: boolean) => void;
  sidebarOpen:      boolean;
  setSidebarOpen:   (v: boolean) => void;
  aiPredictions:    AIPrediction[];
  // ESP32 Commands
  cmdDoorOpen:   () => Promise<void>;
  cmdDoorClose:  () => Promise<void>;
  cmdBuzzerOff:  () => Promise<void>;
  cmdReset:      () => Promise<void>;
  cmdTriggerPrediction: () => Promise<void>;
}

const IoTContext = createContext<IoTContextType | null>(null);

export function useIoT() {
  const ctx = useContext(IoTContext);
  if (!ctx) throw new Error('useIoT must be used within IoTProvider');
  return ctx;
}

export function IoTProvider({ children }: { children: ReactNode }) {
  const [sensors,        setSensors]        = useState<SensorData[]>(mockSensors);
  const [alerts,         setAlerts]         = useState<Alert[]>(mockAlerts);
  const [isConnected,    setIsConnected]     = useState(false);
  const [esp32Connected, setEsp32Connected]  = useState(false);
  const [lastUpdate,     setLastUpdate]      = useState(new Date());
  const [secondsAgo,     setSecondsAgo]      = useState(0);
  const [buzzerActive,   setBuzzerActive]    = useState(false);
  const [systemPowered,  setSystemPowered]   = useState(true);
  const [sidebarOpen,    setSidebarOpen]     = useState(false);
  const [aiPredictions,  setAiPredictions]   = useState<AIPrediction[]>(mockPredictions);

  const [notifications, setNotifications] = useState<Notification[]>([]);

  const alertIdsRef = useRef<Set<string>>(new Set());

  // ── Poll ESP32 status via backend REST every 2s ──────────────────
  useEffect(() => {
    if (!systemPowered) return;

    const poll = async () => {
      try {
        const res  = await fetch(`${BACKEND}/esp32/status`);
        if (!res.ok) throw new Error('backend offline');
        const data = await res.json();

        setIsConnected(true);
        setEsp32Connected(!!data.connected);
        setLastUpdate(new Date());

        const gasLevelPpm: number = data.gasLevelPpm ?? ((data.gasLevel / 4095) * 500);

        const sensor: SensorData = {
          id:           'ESP32-SMARTHOME',
          zone:         'Smart House',
          temperature:  data.temperature  ?? 0,
          humidity:     data.humidity     ?? 0,
          gasLevel:     +gasLevelPpm.toFixed(2),
          status:       data.connected ? esp32ToStatus(data) : 'normal',
          lastUpdate:   new Date(),
          position:     { x: 50, y: 50 },
          // ESP32-specific
          connected:    data.connected,
          motion:       data.motion,
          soundDetected:data.soundDetected,
          gasDetected:  data.gasDetected,
          gasLevelRaw:  data.gasLevel,
          flameDetected:data.flameDetected,
          lux:          data.lux,
          isNight:      data.isNight,
          alertActive:  data.alertActive,
          alertPriority:data.alertPriority,
          alertMessage: data.alertMessage,
          servoOuvert:  data.servoOuvert,
          buzzerOn:     data.buzzerOn,
          ledRougeOn:   data.ledRougeOn,
          ledVerteOn:   data.ledVerteOn,
          uptime:       data.uptime,
        };

        setSensors([sensor]);
        setBuzzerActive(!!data.buzzerOn);

        // Auto-generate alert from ESP32 alertMessage
        if (data.alertActive && data.alertMessage) {
          const alertId = `ESP32-${data.alertPriority}-${data.alertMessage.slice(0, 20)}`;
          if (!alertIdsRef.current.has(alertId)) {
            alertIdsRef.current.add(alertId);
            const severity: Alert['severity'] = data.alertPriority >= 3 ? 'critical' : 'warning';
            const type: Alert['type']         = data.flameDetected ? 'flame'
                                              : data.gasDetected   ? 'gas'
                                              : data.temperature > 35 ? 'temperature'
                                              : data.soundDetected    ? 'sound'
                                              : 'motion';
            const newAlert: Alert = {
              id:           alertId,
              sensorId:     'ESP32-SMARTHOME',
              zone:         'Smart House',
              type,
              severity,
              message:      data.alertMessage,
              timestamp:    new Date(),
              acknowledged: false,
            };
            setAlerts(prev => [newAlert, ...prev.slice(0, 19)]);
            setNotifications(prev => [{
              id:        alertId + '-notif',
              title:     severity === 'critical' ? '🚨 Alerte Critique' : '⚠️ Avertissement',
              message:   data.alertMessage,
              severity,
              timestamp: new Date(),
              read:      false,
            }, ...prev.slice(0, 9)]);
          }
        }

        // Clear resolved alerts from ref
        if (!data.alertActive) alertIdsRef.current.clear();

      } catch {
        setIsConnected(false);
      }
    };

    poll();
    const interval = setInterval(poll, 2000);
    return () => clearInterval(interval);
  }, [systemPowered]);

  // ── Poll AI predictions every 30s ────────────────────────────────
  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        const res = await fetch(`${BACKEND}/esp32/prediction`);
        if (!res.ok) return;
        const data = await res.json();
        if (data && data.predictedAnomaly) {
          setAiPredictions([data]);
        }
      } catch { /* silent */ }
    };
    fetchPredictions();
    const t = setInterval(fetchPredictions, 30000);
    return () => clearInterval(t);
  }, []);

  // ── Seconds ago counter ──────────────────────────────────────────
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastUpdate.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [lastUpdate]);

  // ── System status ────────────────────────────────────────────────
  const systemStatus: SystemStatus = sensors.some(s => s.status === 'critical')
    ? 'danger'
    : sensors.some(s => s.status === 'warning')
      ? 'warning'
      : 'safe';

  const unreadCount = notifications.filter(n => !n.read).length;

  const acknowledgeAlert = useCallback((id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a));
  }, []);

  const dismissAlert = useCallback((id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  }, []);

  const resetAllAlerts = useCallback(() => {
    setAlerts(prev => prev.map(a => ({ ...a, acknowledged: true })));
    alertIdsRef.current.clear();
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  // ── ESP32 Command helpers ─────────────────────────────────────────
  const esp32Cmd = useCallback(async (endpoint: string) => {
    const res = await fetch(`${BACKEND}/esp32/${endpoint}`, { method: 'POST' });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.reason || `HTTP ${res.status}`);
    }
  }, []);

  const cmdDoorOpen  = useCallback(() => esp32Cmd('cmd/door/open'),  [esp32Cmd]);
  const cmdDoorClose = useCallback(() => esp32Cmd('cmd/door/close'), [esp32Cmd]);
  const cmdBuzzerOff = useCallback(() => esp32Cmd('cmd/buzzer/off'), [esp32Cmd]);
  const cmdReset     = useCallback(() => esp32Cmd('cmd/reset'),      [esp32Cmd]);
  const cmdTriggerPrediction = useCallback(() => esp32Cmd('prediction/trigger'), [esp32Cmd]);

  return (
    <IoTContext.Provider value={{
      sensors, setSensors,
      alerts, setAlerts, acknowledgeAlert, dismissAlert, resetAllAlerts,
      notifications, unreadCount, markAsRead, markAllAsRead,
      isConnected, esp32Connected, lastUpdate, secondsAgo,
      systemStatus,
      buzzerActive, setBuzzerActive,
      systemPowered, setSystemPowered,
      sidebarOpen, setSidebarOpen,
      aiPredictions,
      cmdDoorOpen, cmdDoorClose, cmdBuzzerOff, cmdReset, cmdTriggerPrediction,
    }}>
      {children}
    </IoTContext.Provider>
  );
}
