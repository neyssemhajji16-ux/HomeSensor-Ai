import { useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { useIoT } from '../lib/IoTContext';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { motion } from 'motion/react';

export function FloorMap() {
  const { sensors } = useIoT();
  const [zoom, setZoom] = useState(1);
  const [selectedSensor, setSelectedSensor] = useState<string | null>(null);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return '#ef4444';
      case 'warning': return '#f97316';
      default: return '#22c55e';
    }
  };
  
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.5));
  const handleReset = () => setZoom(1);
  
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      
      <div className="lg:ml-64 transition-all duration-300">
        <Header 
          title="Floor Map" 
          subtitle="Interactive building layout with real-time sensor positions"
        />
        
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Controls */}
            <div className="border-b border-slate-200 p-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Building Floor Plan</h2>
                <p className="text-slate-600 text-sm">Click on sensors for detailed information</p>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleZoomOut}>
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-slate-600 text-sm w-16 text-center">{Math.round(zoom * 100)}%</span>
                <Button variant="outline" size="sm" onClick={handleZoomIn}>
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleReset}>
                  <Maximize2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {/* Map Container */}
            <div className="relative bg-slate-100 h-[600px] overflow-auto">
              <div 
                className="absolute inset-0 flex items-center justify-center"
                style={{ transform: `scale(${zoom})`, transition: 'transform 0.3s' }}
              >
                <svg width="800" height="500" className="border-2 border-slate-300 bg-white">
                  {/* Floor Plan Structure */}
                  {/* Main Building Outline */}
                  <rect x="50" y="50" width="700" height="400" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="3" />
                  
                  {/* Rooms */}
                  <rect x="50" y="50" width="200" height="150" fill="#e0f2fe" stroke="#94a3b8" strokeWidth="2" />
                  <text x="150" y="130" textAnchor="middle" fill="#475569" fontSize="14" fontWeight="600">Server Room</text>
                  
                  <rect x="300" y="50" width="250" height="150" fill="#fef3c7" stroke="#94a3b8" strokeWidth="2" />
                  <text x="425" y="130" textAnchor="middle" fill="#475569" fontSize="14" fontWeight="600">Laboratory</text>
                  
                  <rect x="600" y="50" width="150" height="150" fill="#ddd6fe" stroke="#94a3b8" strokeWidth="2" />
                  <text x="675" y="130" textAnchor="middle" fill="#475569" fontSize="14" fontWeight="600">Office Area</text>
                  
                  <rect x="50" y="250" width="300" height="200" fill="#d1fae5" stroke="#94a3b8" strokeWidth="2" />
                  <text x="200" y="355" textAnchor="middle" fill="#475569" fontSize="14" fontWeight="600">Storage Area</text>
                  
                  <rect x="400" y="250" width="350" height="200" fill="#fed7aa" stroke="#94a3b8" strokeWidth="2" />
                  <text x="575" y="355" textAnchor="middle" fill="#475569" fontSize="14" fontWeight="600">Production Floor</text>
                  
                  {/* Sensors */}
                  {sensors.map(sensor => {
                    const x = (sensor.position.x / 100) * 700 + 50;
                    const y = (sensor.position.y / 100) * 400 + 50;
                    const isSelected = selectedSensor === sensor.id;
                    
                    return (
                      <g key={sensor.id}>
                        {/* Sensor Pulse Animation */}
                        {sensor.status !== 'normal' && (
                          <motion.circle
                            cx={x}
                            cy={y}
                            r="20"
                            fill={getStatusColor(sensor.status)}
                            opacity="0.3"
                            animate={{
                              scale: [1, 1.5, 1],
                              opacity: [0.3, 0, 0.3]
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                          />
                        )}
                        
                        {/* Sensor Marker */}
                        <circle
                          cx={x}
                          cy={y}
                          r={isSelected ? "16" : "12"}
                          fill={getStatusColor(sensor.status)}
                          stroke="white"
                          strokeWidth={isSelected ? "3" : "2"}
                          style={{ cursor: 'pointer', transition: 'all 0.3s' }}
                          onClick={() => setSelectedSensor(isSelected ? null : sensor.id)}
                        />
                        
                        {/* Sensor Icon */}
                        <circle cx={x} cy={y} r="4" fill="white" />
                        
                        {/* Sensor Label */}
                        <text
                          x={x}
                          y={y + 25}
                          textAnchor="middle"
                          fill="#1e293b"
                          fontSize="10"
                          fontWeight="600"
                        >
                          {sensor.id}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
            
            {/* Legend */}
            <div className="border-t border-slate-200 p-4 flex items-center gap-6">
              <span className="text-slate-700 font-medium">Status:</span>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-slate-600 text-sm">Normal</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500" />
                <span className="text-slate-600 text-sm">Warning</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-slate-600 text-sm">Critical</span>
              </div>
            </div>
          </div>
          
          {/* Selected Sensor Details */}
          {selectedSensor && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 bg-white rounded-xl p-6 shadow-sm border border-slate-200"
            >
              {(() => {
                const sensor = sensors.find(s => s.id === selectedSensor);
                if (!sensor) return null;
                
                return (
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-4">
                      Sensor Details: {sensor.id}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-slate-600 text-sm">Zone</p>
                        <p className="text-slate-900 font-semibold">{sensor.zone}</p>
                      </div>
                      <div>
                        <p className="text-slate-600 text-sm">Temperature</p>
                        <p className="text-slate-900 font-semibold">{sensor.temperature.toFixed(1)}°C</p>
                      </div>
                      <div>
                        <p className="text-slate-600 text-sm">Humidity</p>
                        <p className="text-slate-900 font-semibold">{sensor.humidity.toFixed(0)}%</p>
                      </div>
                      <div>
                        <p className="text-slate-600 text-sm">Gas Level</p>
                        <p className="text-slate-900 font-semibold">{sensor.gasLevel.toFixed(2)} ppm</p>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
