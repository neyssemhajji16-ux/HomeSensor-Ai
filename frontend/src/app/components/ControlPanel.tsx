import { useState } from 'react';
import { Button } from './ui/button';
import { useIoT } from '../lib/IoTContext';
import {
  RotateCcw, Volume2, VolumeX, Power, PowerOff,
  Shield, ShieldAlert, DoorOpen, DoorClosed, Loader2, Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog';

export function ControlPanel() {
  const {
    resetAllAlerts, buzzerActive, setBuzzerActive,
    systemPowered, setSystemPowered,
    sensors, esp32Connected,
    cmdDoorOpen, cmdDoorClose, cmdBuzzerOff, cmdReset, cmdTriggerPrediction,
  } = useIoT();

  const [loadingDoor,   setLoadingDoor]   = useState<'open' | 'close' | null>(null);
  const [loadingBuzzer, setLoadingBuzzer] = useState(false);
  const [loadingReset,  setLoadingReset]  = useState(false);
  const [loadingAi,     setLoadingAi]     = useState(false);

  const esp32 = sensors[0];
  const doorOpen    = esp32?.servoOuvert ?? false;
  const buzzerOn    = esp32?.buzzerOn    ?? false;
  const flameActive = esp32?.flameDetected ?? false;
  const gasActive   = esp32?.gasDetected   ?? false;

  // ── Door Open ─────────────────────────────────────────────────────
  const handleDoorOpen = async () => {
    setLoadingDoor('open');
    try {
      await cmdDoorOpen();
      toast.success('🚪 Porte ouverte avec succès');
    } catch (e: any) {
      toast.error(`Erreur: ${e.message}`);
    } finally {
      setLoadingDoor(null);
    }
  };

  // ── Door Close ────────────────────────────────────────────────────
  const handleDoorClose = async () => {
    setLoadingDoor('close');
    try {
      await cmdDoorClose();
      toast.success('🔒 Porte fermée avec succès');
    } catch (e: any) {
      if (e.message === 'danger_active') {
        toast.error('⚠️ Fermeture refusée — danger actif détecté !');
      } else {
        toast.error(`Erreur: ${e.message}`);
      }
    } finally {
      setLoadingDoor(null);
    }
  };

  // ── Buzzer Off ────────────────────────────────────────────────────
  const handleBuzzerOff = async () => {
    setLoadingBuzzer(true);
    try {
      await cmdBuzzerOff();
      setBuzzerActive(false);
      toast.success('🔇 Buzzer coupé');
    } catch (e: any) {
      if (e.message === 'fire_active') {
        toast.error('🔥 Impossible — incendie actif !');
      } else {
        toast.error(`Erreur: ${e.message}`);
      }
    } finally {
      setLoadingBuzzer(false);
    }
  };

  // ── Reset Overrides ───────────────────────────────────────────────
  const handleReset = async () => {
    setLoadingReset(true);
    try {
      await cmdReset();
      resetAllAlerts();
      toast.success('✅ Overrides réinitialisés');
    } catch (e: any) {
      toast.error(`Erreur: ${e.message}`);
    } finally {
      setLoadingReset(false);
    }
  };

  const handlePowerToggle = () => {
    setSystemPowered(!systemPowered);
    toast.success(systemPowered ? 'Surveillance arrêtée' : 'Surveillance reprise');
  };

  const handleAiPrediction = async () => {
    setLoadingAi(true);
    try {
      await cmdTriggerPrediction();
      toast.success('✨ Analyse IA terminée avec succès !');
    } catch (e: any) {
      toast.error(`Erreur IA: ${e.message}`);
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-5 sm:p-6 shadow-md border border-slate-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
            <Shield className="w-5 h-5 text-slate-700" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Control Panel</h2>
        </div>
        {/* ESP32 connection badge */}
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide flex items-center gap-1.5 ${
          esp32Connected
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-red-100 text-red-600'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${esp32Connected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
          {esp32Connected ? 'ESP32 Online' : 'ESP32 Offline'}
        </span>
      </div>

      <div className="space-y-3">

        {/* ── Door Controls ─────────────────────────────────────── */}
        <div className="rounded-xl border border-slate-200 p-3 space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Door Control {doorOpen && <span className="ml-2 text-emerald-600">● OPEN</span>}
            {!doorOpen  && <span className="ml-2 text-slate-400">● CLOSED</span>}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={handleDoorOpen}
              disabled={!esp32Connected || doorOpen || loadingDoor !== null}
              className="h-11 gap-2 text-sm font-medium border-emerald-200 hover:bg-emerald-50 hover:border-emerald-400 disabled:opacity-40"
            >
              {loadingDoor === 'open'
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <DoorOpen className="w-4 h-4 text-emerald-600" />}
              Open
            </Button>
            <Button
              variant="outline"
              onClick={handleDoorClose}
              disabled={!esp32Connected || !doorOpen || loadingDoor !== null || flameActive || gasActive}
              className="h-11 gap-2 text-sm font-medium border-slate-300 hover:bg-slate-50 disabled:opacity-40"
            >
              {loadingDoor === 'close'
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <DoorClosed className="w-4 h-4 text-slate-600" />}
              Close
            </Button>
          </div>
          {(flameActive || gasActive) && (
            <p className="text-[11px] text-red-600 font-medium text-center">
              ⚠️ Fermeture bloquée — {flameActive ? 'Incendie' : 'Fuite de gaz'} détecté
            </p>
          )}
        </div>

        {/* ── Buzzer Off ────────────────────────────────────────── */}
        <Button
          variant="outline"
          onClick={handleBuzzerOff}
          disabled={!esp32Connected || !buzzerOn || loadingBuzzer || flameActive}
          className={`w-full justify-start gap-3 h-12 sm:h-14 font-medium text-base transition-all shadow-sm rounded-xl ${
            buzzerOn
              ? 'border-orange-400 bg-orange-50 hover:bg-orange-100 ring-2 ring-orange-400 ring-opacity-50'
              : 'border-slate-200 opacity-60'
          }`}
        >
          {loadingBuzzer
            ? <Loader2 className="w-5 h-5 animate-spin" />
            : buzzerOn
              ? <Volume2  className="w-5 h-5 text-orange-600" />
              : <VolumeX  className="w-5 h-5 text-slate-400" />
          }
          <span className="text-slate-700">
            {buzzerOn ? 'Couper le Buzzer' : 'Buzzer inactif'}
          </span>
          {buzzerOn && (
            <span className="ml-auto px-2.5 py-1 bg-orange-500 text-white text-[10px] font-bold rounded-lg flex items-center gap-1.5 uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              ON
            </span>
          )}
        </Button>

        {/* ── Reset Overrides ───────────────────────────────────── */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              disabled={!esp32Connected || loadingReset}
              className="w-full justify-start gap-3 h-12 sm:h-14 font-medium text-base border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all shadow-sm rounded-xl disabled:opacity-50"
            >
              {loadingReset
                ? <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                : <RotateCcw className="w-5 h-5 text-blue-600" />}
              <span className="text-slate-700">Reset Overrides</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset All Overrides?</AlertDialogTitle>
              <AlertDialogDescription>
                This will cancel all manual door/buzzer overrides on the ESP32 and acknowledge all active alerts.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleReset} className="bg-blue-600 hover:bg-blue-700">
                Confirm Reset
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* ── System Power ──────────────────────────────────────── */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              className={`w-full justify-start gap-3 h-12 sm:h-14 font-medium text-base transition-all shadow-sm rounded-xl ${
                !systemPowered
                  ? 'border-red-400 bg-red-50 hover:bg-red-100 ring-2 ring-red-400 ring-opacity-50'
                  : 'border-slate-200 hover:border-red-300 hover:bg-red-50'
              }`}
            >
              {systemPowered
                ? <Power    className="w-5 h-5 text-emerald-600" />
                : <PowerOff className="w-5 h-5 text-red-600" />}
              <span className="text-slate-700">
                {systemPowered ? 'Monitoring On' : 'Monitoring Off'}
              </span>
              <span className={`ml-auto px-2.5 py-1 text-[10px] font-bold rounded-lg flex items-center gap-1.5 uppercase ${
                systemPowered ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
              }`}>
                {systemPowered && <span className="w-1.5 h-1.5 rounded-full bg-white opacity-80 animate-pulse" />}
                {systemPowered ? 'ON' : 'OFF'}
              </span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-600" />
                {systemPowered ? 'Stop Monitoring?' : 'Resume Monitoring?'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {systemPowered
                  ? 'This will stop the frontend from polling ESP32 data. The ESP32 will keep running.'
                  : 'This will resume polling ESP32 sensor data.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handlePowerToggle}
                className={systemPowered ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
              >
                {systemPowered ? 'Stop' : 'Resume'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* ── AI Analysis Manual Trigger ────────────────────────── */}
        <Button
          variant="outline"
          onClick={handleAiPrediction}
          disabled={loadingAi}
          className="w-full justify-start gap-3 h-12 sm:h-14 font-medium text-base border-purple-200 hover:border-purple-400 hover:bg-purple-50 transition-all shadow-sm rounded-xl disabled:opacity-50"
        >
          {loadingAi
            ? <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
            : <Sparkles className="w-5 h-5 text-purple-600" />}
          <span className="text-slate-700">Forcer Analyse IA</span>
        </Button>

      </div>
    </motion.div>
  );
}
