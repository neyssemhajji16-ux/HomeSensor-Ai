import { AIPrediction } from '../lib/mockData';
import { Brain, TrendingUp, Clock, Lightbulb } from 'lucide-react';
import { motion } from 'motion/react';

interface AIPredictionCardProps {
  prediction: AIPrediction;
}

export function AIPredictionCard({ prediction }: AIPredictionCardProps) {
  const getProbabilityConfig = (probability: number) => {
    if (probability >= 75) return { color: 'text-red-600 bg-red-100', bar: 'bg-red-500', label: 'High Risk' };
    if (probability >= 50) return { color: 'text-orange-600 bg-orange-100', bar: 'bg-orange-500', label: 'Medium Risk' };
    return { color: 'text-emerald-600 bg-emerald-100', bar: 'bg-emerald-500', label: 'Low Risk' };
  };

  const config = getProbabilityConfig(prediction.probability);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-all duration-300"
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0 shadow-inner">
          <Brain className="w-6 h-6 text-white" />
        </div>
        
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-slate-900 font-bold text-lg">{prediction.zone}</h3>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${config.color}`}>
                  {config.label}
                </span>
              </div>
              <p className="text-slate-500 text-xs font-medium mt-0.5 tracking-wide uppercase">{prediction.sensorId}</p>
            </div>
            <div className="flex flex-col items-end">
              <span className={`text-lg font-bold ${config.color.split(' ')[0]}`}>
                {prediction.probability}%
              </span>
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Confidence</span>
            </div>
          </div>
          
          {/* Confidence Bar */}
          <div className="w-full h-1.5 bg-slate-100 rounded-full mb-5 overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${prediction.probability}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className={`h-full rounded-full ${config.bar}`} 
            />
          </div>
          
          <div className="space-y-3 mt-4">
            <div className="flex items-start gap-2">
              <TrendingUp className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-slate-700 text-sm font-medium">Predicted Anomaly</p>
                <p className="text-slate-900">{prediction.predictedAnomaly}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-slate-700 text-sm font-medium">Timeframe</p>
                <p className="text-slate-900">{prediction.timeframe}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-slate-700 text-sm font-medium">Recommendation</p>
                <p className="text-slate-900">{prediction.recommendation}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
