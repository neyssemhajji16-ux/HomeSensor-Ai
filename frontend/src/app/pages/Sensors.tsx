import { useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { SensorCard } from '../components/SensorCard';
import { SensorDetailModal } from '../components/SensorDetailModal';
import { useIoT } from '../lib/IoTContext';
import { type SensorData } from '../lib/mockData';
import { Search, Filter } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

export function Sensors() {
  const { sensors } = useIoT();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedSensor, setSelectedSensor] = useState<SensorData | null>(null);

  const filteredSensors = sensors.filter(sensor => {
    const matchesSearch = sensor.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sensor.zone.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || sensor.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="lg:ml-64 transition-all duration-300">
        <Header
          title="Sensor Management"
          subtitle={`Monitoring ${sensors.length} ESP32 sensors across all zones`}
        />
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Filters */}
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-slate-200 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  placeholder="Search by sensor ID or zone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <p className="text-slate-600 text-sm">Total Sensors</p>
              <p className="text-2xl font-bold text-slate-900">{sensors.length}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <p className="text-green-700 text-sm">Normal</p>
              <p className="text-2xl font-bold text-green-900">{sensors.filter(s => s.status === 'normal').length}</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <p className="text-orange-700 text-sm">Warning</p>
              <p className="text-2xl font-bold text-orange-900">{sensors.filter(s => s.status === 'warning').length}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <p className="text-red-700 text-sm">Critical</p>
              <p className="text-2xl font-bold text-red-900">{sensors.filter(s => s.status === 'critical').length}</p>
            </div>
          </div>

          {/* Sensor Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredSensors.map(sensor => (
              <SensorCard key={sensor.id} sensor={sensor} onClick={() => setSelectedSensor(sensor)} />
            ))}
          </div>

          {filteredSensors.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-500">No sensors found matching your criteria</p>
            </div>
          )}
        </div>
      </div>

      <SensorDetailModal
        sensor={selectedSensor}
        open={!!selectedSensor}
        onClose={() => setSelectedSensor(null)}
      />
    </div>
  );
}
