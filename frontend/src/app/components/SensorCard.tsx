import { SensorData } from '../lib/mockData';
import { Thermometer, Droplets, Wind, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';

interface SensorCardProps {
  sensor: SensorData;
  onClick?: () => void;
}

export function SensorCard({ sensor, onClick }: SensorCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'border-red-500 bg-red-50';
      case 'warning': return 'border-orange-500 bg-orange-50';
      default: return 'border-green-500 bg-white';
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'critical': return 'bg-red-500 text-white';
      case 'warning': return 'bg-orange-500 text-white';
      default: return 'bg-green-500 text-white';
    }
  };
  
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      className={`border-2 rounded-2xl p-5 sm:p-6 cursor-pointer transition-all duration-300 shadow-sm hover:shadow-lg relative overflow-hidden ${getStatusColor(sensor.status)}`}
      onClick={onClick}
    >
      {/* Background Pulse for Warning/Critical */}
      {sensor.status !== 'normal' && (
        <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-20 blur-xl animate-pulse ${
          sensor.status === 'critical' ? 'bg-red-500' : 'bg-orange-500'
        }`} />
      )}
      <div className="flex items-start justify-between mb-5 relative z-10">
        <div>
          <h3 className="text-slate-900 font-bold text-lg leading-tight">{sensor.id}</h3>
          <p className="text-slate-500 text-xs font-medium uppercase tracking-wide mt-1">{sensor.zone}</p>
        </div>
        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase shadow-sm flex items-center gap-1.5 ${getStatusBadge(sensor.status)}`}>
          {sensor.status !== 'normal' && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
          {sensor.status}
        </span>
      </div>
      
      <div className="space-y-4 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
              <Thermometer className="w-4 h-4 text-red-500" />
            </div>
            <span className="text-slate-600 text-sm font-medium">Temperature</span>
          </div>
          <span className="text-slate-900 font-bold">{sensor.temperature.toFixed(1)}°C</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Droplets className="w-4 h-4 text-blue-500" />
            </div>
            <span className="text-slate-600 text-sm font-medium">Humidity</span>
          </div>
          <span className="text-slate-900 font-bold">{sensor.humidity.toFixed(0)}%</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
              <Wind className="w-4 h-4 text-purple-600" />
            </div>
            <span className="text-slate-600 text-sm font-medium">Gas Level</span>
          </div>
          <span className="text-slate-900 font-bold">{sensor.gasLevel.toFixed(2)} ppm</span>
        </div>
      </div>
      
      {sensor.status !== 'normal' && (
        <div className="mt-4 pt-3 border-t border-slate-200 flex items-center gap-2 text-orange-600">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-xs font-medium">Attention Required</span>
        </div>
      )}
      
      <p className="text-slate-500 text-xs mt-3">
        Last update: {sensor.lastUpdate.toLocaleTimeString()}
      </p>
    </motion.div>
  );
}
