import { Link, useLocation } from 'react-router';
import { 
  LayoutDashboard, 
  Radio, 
  Map, 
  BarChart3, 
  Bell,
  Activity,
  X
} from 'lucide-react';
import { useIoT } from '../lib/IoTContext';
import { motion, AnimatePresence } from 'motion/react';

export function Sidebar() {
  const location = useLocation();
  const { systemStatus, sidebarOpen, setSidebarOpen } = useIoT();
  
  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Sensors', href: '/sensors', icon: Radio },
    { name: 'Floor Map', href: '/floor-map', icon: Map },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Alerts', href: '/alerts', icon: Bell },
  ];

  const getStatusInfo = () => {
    switch (systemStatus) {
      case 'danger': return { color: 'bg-red-500', text: 'Critical Alert Active', textColor: 'text-red-400' };
      case 'warning': return { color: 'bg-orange-500', text: 'Warnings Detected', textColor: 'text-orange-400' };
      default: return { color: 'bg-green-500', text: 'All Systems Operational', textColor: 'text-green-400' };
    }
  };

  const statusInfo = getStatusInfo();

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-white font-semibold">HomeSensor Ai</h1>
              <p className="text-slate-400 text-xs">Intelligent Monitoring</p>
            </div>
          </div>
          {/* Close button for mobile */}
          <button
            className="lg:hidden text-slate-400 hover:text-white p-1"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                ${isActive 
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20' 
                  : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                }
              `}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>
      
      {/* Footer */}
      <div className="p-4 border-t border-slate-700">
        <div className="px-4 py-3 rounded-lg bg-slate-800/50">
          <p className="text-slate-400 text-xs">System Status</p>
          <div className="flex items-center gap-2 mt-1">
            <div className={`w-2 h-2 rounded-full ${statusInfo.color} animate-pulse`} />
            <p className={`text-sm ${statusInfo.textColor}`}>{statusInfo.text}</p>
          </div>
        </div>
      </div>
    </>
  );
  
  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-slate-900 to-slate-800 border-r border-slate-700 flex-col z-30">
        {sidebarContent}
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-slate-900 to-slate-800 border-r border-slate-700 flex flex-col z-50 lg:hidden"
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
