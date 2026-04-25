import { useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { AlertItem } from '../components/AlertItem';
import { AIPredictionCard } from '../components/AIPredictionCard';
import { useIoT } from '../lib/IoTContext';
import { mockPredictions } from '../lib/mockData';
import { Filter, Download } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

export function Alerts() {
  const { alerts, acknowledgeAlert, dismissAlert } = useIoT();
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  
  const handleAcknowledge = (id: string) => {
    acknowledgeAlert(id);
    toast.success('Alert acknowledged');
  };
  
  const handleDismiss = (id: string) => {
    dismissAlert(id);
    toast.success('Alert dismissed');
  };
  
  const generateAlertsReport = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Alerts & Predictions Report', 20, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 30);
    doc.setFontSize(14);
    doc.text('Active Alerts', 20, 45);
    doc.setFontSize(9);
    let yPos = 55;
    alerts.filter(a => !a.acknowledged).forEach((alert, index) => {
      if (yPos > 270) { doc.addPage(); yPos = 20; }
      doc.text(`${index + 1}. ${alert.zone} - ${alert.severity.toUpperCase()}`, 20, yPos);
      doc.text(`   ${alert.message}`, 20, yPos + 5);
      doc.text(`   Time: ${alert.timestamp.toLocaleString()}`, 20, yPos + 10);
      yPos += 20;
    });
    doc.addPage();
    doc.setFontSize(14);
    doc.text('AI Predictions', 20, 20);
    doc.setFontSize(9);
    yPos = 30;
    mockPredictions.forEach((pred, index) => {
      if (yPos > 270) { doc.addPage(); yPos = 20; }
      doc.text(`${index + 1}. ${pred.zone} - ${pred.probability}% probability`, 20, yPos);
      doc.text(`   ${pred.predictedAnomaly}`, 20, yPos + 5);
      doc.text(`   Timeframe: ${pred.timeframe}`, 20, yPos + 10);
      doc.text(`   Action: ${pred.recommendation}`, 20, yPos + 15);
      yPos += 25;
    });
    doc.save(`alerts-report-${Date.now()}.pdf`);
    toast.success('Alerts report generated');
  };
  
  const filteredAlerts = severityFilter === 'all' 
    ? alerts 
    : alerts.filter(a => a.severity === severityFilter);
  
  const activeAlerts = filteredAlerts.filter(a => !a.acknowledged);
  const acknowledgedAlerts = filteredAlerts.filter(a => a.acknowledged);
  
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      
      <div className="lg:ml-64 transition-all duration-300">
        <Header 
          title="Alerts & Predictions" 
          subtitle="Real-time alerts and AI-powered anomaly predictions"
          actions={
            <Button onClick={generateAlertsReport} className="bg-gradient-to-r from-cyan-500 to-blue-600 hidden sm:flex">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          }
        />
        
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white">
              <p className="text-red-100 text-sm mb-1">Critical Alerts</p>
              <p className="text-4xl font-bold">{alerts.filter(a => a.severity === 'critical' && !a.acknowledged).length}</p>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
              <p className="text-orange-100 text-sm mb-1">Warnings</p>
              <p className="text-4xl font-bold">{alerts.filter(a => a.severity === 'warning' && !a.acknowledged).length}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
              <p className="text-purple-100 text-sm mb-1">AI Predictions</p>
              <p className="text-4xl font-bold">{mockPredictions.length}</p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
              <p className="text-green-100 text-sm mb-1">Resolved Today</p>
              <p className="text-4xl font-bold">{acknowledgedAlerts.length}</p>
            </div>
          </div>
          
          <Tabs defaultValue="active" className="space-y-6">
            <TabsList>
              <TabsTrigger value="active">Active Alerts ({activeAlerts.length})</TabsTrigger>
              <TabsTrigger value="acknowledged">Acknowledged ({acknowledgedAlerts.length})</TabsTrigger>
              <TabsTrigger value="predictions">AI Predictions ({mockPredictions.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="active" className="space-y-6">
              {/* Filter */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="w-48">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter by severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Active Alerts List */}
              <div className="space-y-4">
                {activeAlerts.length > 0 ? (
                  activeAlerts.map(alert => (
                    <AlertItem 
                      key={alert.id} 
                      alert={alert}
                      onAcknowledge={handleAcknowledge}
                      onDismiss={handleDismiss}
                    />
                  ))
                ) : (
                  <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-slate-900 font-semibold text-lg">All Clear!</p>
                    <p className="text-slate-500 mt-1">No active alerts at this time</p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="acknowledged" className="space-y-4">
              {acknowledgedAlerts.length > 0 ? (
                acknowledgedAlerts.map(alert => (
                  <AlertItem 
                    key={alert.id} 
                    alert={alert}
                    onAcknowledge={handleAcknowledge}
                    onDismiss={handleDismiss}
                  />
                ))
              ) : (
                <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
                  <p className="text-slate-500">No acknowledged alerts</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="predictions" className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                {mockPredictions.map((prediction, index) => (
                  <AIPredictionCard key={index} prediction={prediction} />
                ))}
              </div>
              
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">About AI Predictions</h3>
                <p className="text-slate-700">
                  Our AI model analyzes historical patterns, current readings, and environmental factors to predict 
                  potential anomalies before they occur. Predictions are updated every 5 minutes and include 
                  confidence scores and recommended actions.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
