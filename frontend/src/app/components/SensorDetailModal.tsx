import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { type SensorData, generateHistoricalData } from '../lib/mockData';
import { Thermometer, Droplets, Wind, Clock, MapPin } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from 'recharts';
import { useState, useMemo } from 'react';
import { motion } from 'motion/react';

interface SensorDetailModalProps {
  sensor: SensorData | null;
  open: boolean;
  onClose: () => void;
}

export function SensorDetailModal({ sensor, open, onClose }: SensorDetailModalProps) {
  const [timeRange, setTimeRange] = useState<'6h' | '12h' | '24h'>('24h');

  const historicalData = useMemo(() => {
    const hours = timeRange === '6h' ? 6 : timeRange === '12h' ? 12 : 24;
    if (!sensor) return [];
    // Generate data specific to this sensor's base values
    const data = [];
    const now = Date.now();
    for (let i = hours; i >= 0; i--) {
      const timestamp = new Date(now - i * 60 * 60 * 1000);
      data.push({
        time: timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        temperature: +(sensor.temperature + (Math.random() - 0.5) * 4 + Math.sin(i / 4) * 2).toFixed(1),
        humidity: +(sensor.humidity + (Math.random() - 0.5) * 10 + Math.cos(i / 3) * 5).toFixed(0),
        gasLevel: +Math.max(0, sensor.gasLevel + (Math.random() - 0.5) * 0.05).toFixed(3),
      });
    }
    return data;
  }, [sensor, timeRange]);

  if (!sensor) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'text-red-600 bg-red-100 border-red-300';
      case 'warning': return 'text-orange-600 bg-orange-100 border-orange-300';
      default: return 'text-green-600 bg-green-100 border-green-300';
    }
  };

  const readings = [
    { label: 'Temperature', value: `${sensor.temperature.toFixed(1)}°C`, icon: Thermometer, color: '#ef4444', threshold: '> 35°C', isCritical: sensor.temperature > 35 },
    { label: 'Humidity', value: `${sensor.humidity.toFixed(0)}%`, icon: Droplets, color: '#3b82f6', threshold: '> 80%', isCritical: sensor.humidity > 80 },
    { label: 'Gas Level', value: `${sensor.gasLevel.toFixed(3)} ppm`, icon: Wind, color: '#a855f7', threshold: '> 0.3 ppm', isCritical: sensor.gasLevel > 0.3 },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold text-slate-900">{sensor.id}</DialogTitle>
              <div className="flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1 text-slate-500 text-sm">
                  <MapPin className="w-3.5 h-3.5" /> {sensor.zone}
                </span>
                <span className="flex items-center gap-1 text-slate-500 text-sm">
                  <Clock className="w-3.5 h-3.5" /> {sensor.lastUpdate.toLocaleTimeString()}
                </span>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(sensor.status)}`}>
              {sensor.status.toUpperCase()}
            </span>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Current Readings */}
          <div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Current Readings</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {readings.map((r, i) => {
                const Icon = r.icon;
                return (
                  <motion.div
                    key={r.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={`rounded-xl p-4 border-2 transition-colors ${r.isCritical ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white'}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-5 h-5" style={{ color: r.color }} />
                      <span className="text-slate-600 text-sm font-medium">{r.label}</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{r.value}</p>
                    <p className="text-xs text-slate-400 mt-1">Threshold: {r.threshold}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Historical Data</h3>
            <div className="flex bg-slate-100 rounded-lg p-0.5">
              {(['6h', '12h', '24h'] as const).map(range => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                    timeRange === range
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          {/* Temperature & Humidity Chart */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <h4 className="text-sm font-medium text-slate-700 mb-3">Temperature & Humidity</h4>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="temperature" stroke="#ef4444" strokeWidth={2} dot={false} name="Temp (°C)" />
                <Line type="monotone" dataKey="humidity" stroke="#3b82f6" strokeWidth={2} dot={false} name="Humidity (%)" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Gas Level Chart */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <h4 className="text-sm font-medium text-slate-700 mb-3">Gas Level</h4>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Area type="monotone" dataKey="gasLevel" stroke="#a855f7" fill="#a855f7" fillOpacity={0.2} name="Gas (ppm)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
