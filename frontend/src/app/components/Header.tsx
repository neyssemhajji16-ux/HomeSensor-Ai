import { NotificationCenter } from './NotificationCenter';
import { useIoT } from '../lib/IoTContext';
import { Wifi, WifiOff, Menu } from 'lucide-react';
import { Button } from './ui/button';

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function Header({ title, subtitle, actions }: HeaderProps) {
  const { isConnected, secondsAgo, sidebarOpen, setSidebarOpen } = useIoT();

  return (
    <div className="bg-white border-b border-slate-200 px-4 sm:px-8 py-4 sticky top-0 z-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Mobile hamburger */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="w-5 h-5" />
          </Button>

          <div>
            <h1 className="text-slate-900 text-xl sm:text-2xl font-semibold">{title}</h1>
            {subtitle && <p className="text-slate-500 text-sm mt-1 hidden sm:block">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Live Status */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50">
            {isConnected ? (
              <>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                </span>
                <span className="text-green-700 text-xs font-semibold">LIVE</span>
                <span className="text-slate-400 text-[10px]">{secondsAgo}s ago</span>
              </>
            ) : (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span className="text-red-700 text-xs font-semibold">OFFLINE</span>
              </>
            )}
          </div>

          {actions}

          <NotificationCenter />

          <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <span className="text-white text-sm font-medium">A</span>
            </div>
            <div className="hidden md:block">
              <p className="text-slate-900 text-sm font-medium">Admin</p>
              <p className="text-slate-500 text-xs">System Manager</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
