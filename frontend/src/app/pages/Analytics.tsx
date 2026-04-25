import { useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { generateHistoricalData } from '../lib/mockData';
import { useIoT } from '../lib/IoTContext';
import { Download, Calendar } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

export function Analytics() {
  const { sensors } = useIoT();
  const [timeRange, setTimeRange] = useState('24h');
  const [selectedZone, setSelectedZone] = useState('all');
  
  const historicalData = generateHistoricalData(timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720);
  
  const zones = ['all', ...Array.from(new Set(sensors.map(s => s.zone)))];
  
  const radarData = [
    { metric: 'Temperature', value: 85 },
    { metric: 'Humidity', value: 75 },
    { metric: 'Gas Level', value: 65 },
    { metric: 'Response Time', value: 90 },
    { metric: 'Accuracy', value: 95 },
    { metric: 'Uptime', value: 98 },
  ];
  
  const generateAnalyticsReport = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Analytics Report', 20, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 30);
    doc.text(`Time Range: ${timeRange}`, 20, 37);
    doc.text(`Zone: ${selectedZone}`, 20, 44);
    doc.setFontSize(14);
    doc.text('Performance Metrics', 20, 60);
    doc.setFontSize(10);
    doc.text('Overall system performance is within acceptable parameters.', 20, 70);
    doc.text('Average temperature: 24.5°C', 20, 77);
    doc.text('Average humidity: 52%', 20, 84);
    doc.text('Average gas level: 0.08 ppm', 20, 91);
    doc.save(`analytics-report-${Date.now()}.pdf`);
    toast.success('Analytics report generated');
  };
  
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      
      <div className="lg:ml-64 transition-all duration-300">
        <Header 
          title="Analytics & Insights" 
          subtitle="Advanced data visualization and trend analysis"
          actions={
            <Button onClick={generateAnalyticsReport} className="bg-gradient-to-r from-cyan-500 to-blue-600 hidden sm:flex">
              <Download className="w-4 h-4 mr-2" />
              Export Analytics
            </Button>
          }
        />
        
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Filters */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-full md:w-48">
                  <Calendar className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Select time range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">Last 24 Hours</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={selectedZone} onValueChange={setSelectedZone}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Select zone" />
                </SelectTrigger>
                <SelectContent>
                  {zones.map(zone => (
                    <SelectItem key={zone} value={zone}>
                      {zone === 'all' ? 'All Zones' : zone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Charts Grid */}
          <div className="space-y-6">
            {/* Temperature Analysis */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Temperature Analysis</h2>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={historicalData}>
                  <defs>
                    <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px'
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="temperature" 
                    stroke="#ef4444" 
                    fillOpacity={1} 
                    fill="url(#colorTemp)" 
                    strokeWidth={2}
                    name="Temperature (°C)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            {/* Humidity & Gas Comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <h2 className="text-xl font-semibold text-slate-900 mb-4">Humidity Distribution</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={historicalData.filter((_, i) => i % 3 === 0)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="time" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px'
                      }} 
                    />
                    <Bar dataKey="humidity" fill="#3b82f6" radius={[8, 8, 0, 0]} name="Humidity (%)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <h2 className="text-xl font-semibold text-slate-900 mb-4">Gas Level Trends</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={historicalData.filter((_, i) => i % 3 === 0)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="time" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px'
                      }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="gasLevel" 
                      stroke="#a855f7" 
                      strokeWidth={3}
                      dot={{ fill: '#a855f7', r: 4 }}
                      name="Gas Level (ppm)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Performance Radar */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">System Performance Overview</h2>
              <div className="flex justify-center">
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="metric" stroke="#64748b" />
                    <PolarRadiusAxis stroke="#64748b" />
                    <Radar 
                      name="Performance" 
                      dataKey="value" 
                      stroke="#06b6d4" 
                      fill="#06b6d4" 
                      fillOpacity={0.5}
                      strokeWidth={2}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px'
                      }} 
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Combined Metrics */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">All Metrics Combined</h2>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px'
                    }} 
                  />
                  <Legend />
                  <Line type="monotone" dataKey="temperature" stroke="#ef4444" strokeWidth={2} name="Temperature (°C)" />
                  <Line type="monotone" dataKey="humidity" stroke="#3b82f6" strokeWidth={2} name="Humidity (%)" />
                  <Line type="monotone" dataKey="gasLevel" stroke="#a855f7" strokeWidth={2} name="Gas Level (ppm)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
