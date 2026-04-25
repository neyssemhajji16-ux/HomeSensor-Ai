import { Alert } from '../lib/mockData';
import { AlertTriangle, CheckCircle, Clock, X } from 'lucide-react';
import { Button } from './ui/button';
import { motion } from 'motion/react';

interface AlertItemProps {
  alert: Alert;
  onAcknowledge?: (id: string) => void;
  onDismiss?: (id: string) => void;
}

export function AlertItem({ alert, onAcknowledge, onDismiss }: AlertItemProps) {
  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-red-500 bg-red-50';
      case 'warning':
        return 'border-orange-500 bg-orange-50';
      default:
        return 'border-blue-500 bg-blue-50';
    }
  };
  
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-blue-600" />;
    }
  };
  
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'temperature': return '🌡️ Temperature';
      case 'humidity': return '💧 Humidity';
      case 'gas': return '🌫️ Gas';
      default: return type;
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.95 }}
      whileHover={{ scale: 1.01 }}
      className={`border-l-4 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-300 ${getSeverityStyle(alert.severity)} ${alert.acknowledged ? 'opacity-60 grayscale-[50%]' : ''}`}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 mt-1 bg-white p-2 rounded-xl shadow-sm">
          {alert.acknowledged ? (
            <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
          ) : (
            getSeverityIcon(alert.severity)
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <p className="text-slate-900 font-bold text-base sm:text-lg leading-tight">{alert.zone}</p>
              <p className="text-slate-600 text-xs sm:text-sm font-medium mt-0.5">{getTypeLabel(alert.type)}</p>
            </div>
            <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase shadow-sm ${
              alert.severity === 'critical' ? 'bg-red-600 text-white' : 'bg-orange-600 text-white'
            }`}>
              {alert.severity}
            </span>
          </div>
          
          <p className="text-slate-800 mt-2">{alert.message}</p>
          
          <div className="flex items-center gap-2 mt-3 text-slate-500 text-sm">
            <Clock className="w-4 h-4" />
            <span>{alert.timestamp.toLocaleString()}</span>
          </div>
          
          {!alert.acknowledged && (
            <div className="flex items-center gap-2 sm:gap-3 mt-4">
              <Button
                size="sm"
                onClick={() => onAcknowledge?.(alert.id)}
                className="bg-green-600 hover:bg-green-700 h-10 px-4 flex-1 shadow-sm font-medium"
              >
                <CheckCircle className="w-4 h-4 mr-1.5" />
                Acknowledge
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDismiss?.(alert.id)}
                className="h-10 px-4 flex-1 border-slate-300 hover:bg-slate-100 font-medium text-slate-700"
              >
                <X className="w-4 h-4 mr-1.5" />
                Dismiss
              </Button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
