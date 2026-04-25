import { useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { SensorCard } from '../components/SensorCard';
import { AIPredictionCard } from '../components/AIPredictionCard';
import { AlertItem } from '../components/AlertItem';
import { ControlPanel } from '../components/ControlPanel';
import { SensorDetailModal } from '../components/SensorDetailModal';
import { Button } from '../components/ui/button';
import { useIoT } from '../lib/IoTContext';
import { mockPredictions, generateHistoricalData, type SensorData } from '../lib/mockData';
import { Activity, TrendingUp, AlertTriangle, Radio, Download, Shield, ShieldAlert, ShieldCheck } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import jsPDF from 'jspdf';
import { toast } from 'sonner';
import { motion } from 'motion/react';

export function Dashboard() {
  const { sensors, alerts, acknowledgeAlert, dismissAlert, systemStatus } = useIoT();
  const [historicalData] = useState(generateHistoricalData(24));
  const [selectedSensor, setSelectedSensor] = useState<SensorData | null>(null);

  const generatePDFReport = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('IoT Monitoring System Report', 20, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 30);
    doc.setFontSize(14);
    doc.text('System Overview', 20, 45);
    doc.setFontSize(10);
    doc.text(`Total Sensors: ${sensors.length}`, 20, 55);
    doc.text(`Active Alerts: ${alerts.filter(a => !a.acknowledged).length}`, 20, 62);
    doc.text(`Critical Zones: ${sensors.filter(s => s.status === 'critical').length}`, 20, 69);
    doc.setFontSize(14);
    doc.text('Sensor Status', 20, 85);
    doc.setFontSize(9);
    let yPos = 95;
    sensors.forEach((sensor) => {
      if (yPos > 270) { doc.addPage(); yPos = 20; }
      doc.text(`${sensor.id} (${sensor.zone})`, 20, yPos);
      doc.text(`Temp: ${sensor.temperature.toFixed(1)}°C | Humidity: ${sensor.humidity.toFixed(0)}% | Gas: ${sensor.gasLevel.toFixed(2)} ppm`, 20, yPos + 5);
      doc.text(`Status: ${sensor.status.toUpperCase()}`, 20, yPos + 10);
      yPos += 20;
    });
    doc.save(`iot-report-${Date.now()}.pdf`);
    toast.success('PDF report generated successfully');
  };

  const getSystemStatusConfig = () => {
    switch (systemStatus) {
      case 'danger': return {
        label: 'DANGER', color: 'from-red-500 to-red-700', bg: 'bg-red-50 border-red-200',
        icon: ShieldAlert, textColor: 'text-red-700', desc: 'Critical conditions detected — immediate action required'
      };
      case 'warning': return {
        label: 'WARNING', color: 'from-orange-400 to-orange-600', bg: 'bg-orange-50 border-orange-200',
        icon: Shield, textColor: 'text-orange-700', desc: 'Some sensors are reporting abnormal values'
      };
      default: return {
        label: 'SAFE', color: 'from-emerald-400 to-green-600', bg: 'bg-green-50 border-green-200',
        icon: ShieldCheck, textColor: 'text-green-700', desc: 'All systems operating within normal parameters'
      };
    }
  };

  const statusConfig = getSystemStatusConfig();
  const StatusIcon = statusConfig.icon;

  const stats = [
    { label: 'Active Sensors', value: sensors.length, change: `${sensors.filter(s => s.status === 'normal').length} normal`, icon: Radio, color: 'from-cyan-500 to-blue-600' },
    { label: 'Active Alerts', value: alerts.filter(a => !a.acknowledged).length, change: `${alerts.length} total`, icon: AlertTriangle, color: 'from-orange-500 to-red-600' },
    { label: 'System Health', value: `${Math.round((sensors.filter(s => s.status === 'normal').length / sensors.length) * 100)}%`, change: 'Based on sensor status', icon: Activity, color: 'from-green-500 to-emerald-600' },
    { label: 'AI Predictions', value: mockPredictions.length, change: 'Updated 5 min ago', icon: TrendingUp, color: 'from-purple-500 to-pink-600' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="lg:ml-64 transition-all duration-300">
        <Header
          title="Dashboard Overview"
          subtitle="Real-time monitoring of your IoT infrastructure"
          actions={
            <Button onClick={generatePDFReport} className="bg-gradient-to-r from-cyan-500 to-blue-600 hidden sm:flex">
              <Download className="w-4 h-4 mr-2" />
              Generate Report
            </Button>
          }
        />
        <div className="p-4 sm:p-6 lg:p-8">

          {/* Overall System Status */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl p-6 mb-6 sm:mb-8 border-2 ${statusConfig.bg} shadow-md transition-all duration-500 relative overflow-hidden`}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full -mr-10 -mt-10 blur-2xl"></div>
            <div className="flex items-center gap-4 relative z-10">
              <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${statusConfig.color} flex items-center justify-center shadow-lg relative`}>
                <StatusIcon className={`w-7 h-7 sm:w-8 sm:h-8 text-white relative z-10`} />
                {systemStatus !== 'normal' && (
                  <span className="absolute inset-0 rounded-2xl bg-white opacity-25 animate-ping"></span>
                )}
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-1">
                  <h2 className={`text-lg sm:text-xl font-bold ${statusConfig.textColor}`}>Overall System Status</h2>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${statusConfig.color} shadow-sm uppercase tracking-wide flex items-center gap-1.5`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-white opacity-80 animate-pulse"></span>
                    {statusConfig.label}
                  </span>
                </div>
                <p className="text-slate-700 text-sm sm:text-base font-medium">{statusConfig.desc}</p>
              </div>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -4 }}
                  className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-inner`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <p className="text-slate-500 text-xs sm:text-sm font-medium uppercase tracking-wide mb-1">{stat.label}</p>
                  <p className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">{stat.value}</p>
                  <p className="text-slate-500 text-xs font-semibold">{stat.change}</p>
                </motion.div>
              );
            })}
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 sm:mb-8">
            {/* Recent Alerts */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-5 sm:p-6 shadow-md border border-slate-200">
              <h2 className="text-xl font-bold text-slate-900 mb-5">Recent Alerts</h2>
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {alerts.length > 0 ? (
                  alerts.slice(0, 3).map(alert => (
                    <AlertItem
                      key={alert.id}
                      alert={alert}
                      onAcknowledge={acknowledgeAlert}
                      onDismiss={dismissAlert}
                    />
                  ))
                ) : (
                  <p className="text-slate-500 text-center py-8">No active alerts</p>
                )}
              </div>
            </div>

            {/* AI Predictions + Control Panel stack */}
            <div className="space-y-6">
              {/* AI Predictions */}
              <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-md border border-slate-200">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl font-bold text-slate-900">AI Predictions</h2>
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-lg uppercase tracking-wide flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
                    LIVE
                  </span>
                </div>
                <div className="space-y-4">
                  {mockPredictions.slice(0, 2).map((prediction, index) => (
                    <AIPredictionCard key={index} prediction={prediction} />
                  ))}
                </div>
              </div>

              {/* Control Panel */}
              <ControlPanel />
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 sm:mb-8">
            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-md border border-slate-200 hover:shadow-lg transition-all duration-300">
              <h2 className="text-xl font-bold text-slate-900 mb-5">Temperature & Humidity Trends</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                  <Legend />
                  <Line type="monotone" dataKey="temperature" stroke="#ef4444" strokeWidth={2} name="Temperature (°C)" />
                  <Line type="monotone" dataKey="humidity" stroke="#3b82f6" strokeWidth={2} name="Humidity (%)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-md border border-slate-200 hover:shadow-lg transition-all duration-300">
              <h2 className="text-xl font-bold text-slate-900 mb-5">Gas Level Monitoring</h2>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                  <Area type="monotone" dataKey="gasLevel" stroke="#a855f7" fill="#a855f7" fillOpacity={0.3} name="Gas Level (ppm)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sensor Grid */}
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-4">Sensor Overview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {sensors.map(sensor => (
                <SensorCard key={sensor.id} sensor={sensor} onClick={() => setSelectedSensor(sensor)} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sensor Detail Modal */}
      <SensorDetailModal
        sensor={selectedSensor}
        open={!!selectedSensor}
        onClose={() => setSelectedSensor(null)}
      />
    </div>
  );
}
