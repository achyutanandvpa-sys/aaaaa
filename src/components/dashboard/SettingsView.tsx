import React, { useState } from 'react';
import {
  Settings,
  Volume2,
  VolumeX,
  Vibrate,
  Bell,
  Clock,
  Check,
  RotateCcw,
  ShieldCheck,
  ChevronRight,
  Radio,
  Sliders,
} from 'lucide-react';
import { CityModelOutput } from '../../types.ts';
import { playEmergencyAlertSound, triggerDeviceVibration } from '../../services/alertSystem.ts';

interface SettingsViewProps {
  cityData: CityModelOutput;
  onSwitchToDashboard: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  cityData,
  onSwitchToDashboard,
}) => {
  const { city } = cityData;

  // Settings states
  const [severeRainThreshold, setSevereRainThreshold] = useState(25);
  const [inundationDepthThreshold, setInundationDepthThreshold] = useState(25);
  const [sirenSoundEnabled, setSirenSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [webPushEnabled, setWebPushEnabled] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState('60');
  const [isSaved, setIsSaved] = useState(false);
  const [isTestingSiren, setIsTestingSiren] = useState(false);

  const handleTestSiren = () => {
    setIsTestingSiren(true);
    playEmergencyAlertSound();
    triggerDeviceVibration([300, 150, 300]);
    setTimeout(() => setIsTestingSiren(false), 2000);
  };

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleReset = () => {
    setSevereRainThreshold(25);
    setInundationDepthThreshold(25);
    setSirenSoundEnabled(true);
    setVibrationEnabled(true);
    setWebPushEnabled(true);
    setRefreshInterval('60');
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-[1600px] w-full mx-auto font-sans">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <button
          onClick={onSwitchToDashboard}
          className="hover:text-blue-600 transition-colors"
        >
          {city.name} Dashboard
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-900 font-bold">Settings &amp; Thresholds</span>
      </div>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-blue-600 text-white text-xs font-extrabold uppercase tracking-wider">
              System Configuration
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Early-Warning Sensitivity &amp; Sensor Calibration
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 mt-2 tracking-tight">
            Early-Warning System Settings for {city.name}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Customize rainfall intensity triggers, water depth alarm thresholds, alert sirens, and AI model parameters for the municipal disaster cell.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-center shrink-0">
          <button
            onClick={handleReset}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            {isSaved ? <Check className="w-4 h-4 text-emerald-300" /> : <ShieldCheck className="w-4 h-4" />}
            <span>{isSaved ? 'Settings Saved!' : 'Save Settings'}</span>
          </button>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Section 1: Alert Thresholds & Sensors */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-5">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
            <Sliders className="w-4 h-4 text-blue-600" />
            <span>Inundation &amp; Precipitation Thresholds</span>
          </h3>

          {/* Severe Rain Threshold Slider */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-1.5">
              <span>Severe Precipitation Trigger</span>
              <span className="font-mono text-blue-600">{severeRainThreshold} mm/hour</span>
            </div>
            <input
              type="range"
              min="10"
              max="60"
              step="5"
              value={severeRainThreshold}
              onChange={(e) => setSevereRainThreshold(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Rainfall exceeding this rate triggers an automatic high-priority municipal warning.
            </p>
          </div>

          {/* Inundation Depth Threshold Slider */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-1.5">
              <span>Critical Underpass Inundation Depth</span>
              <span className="font-mono text-rose-600">{inundationDepthThreshold} cm</span>
            </div>
            <input
              type="range"
              min="10"
              max="50"
              step="5"
              value={inundationDepthThreshold}
              onChange={(e) => setInundationDepthThreshold(Number(e.target.value))}
              className="w-full accent-rose-600 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Depth at railway subways and sumps that triggers traffic diversion booms.
            </p>
          </div>

          {/* Refresh Interval Selector */}
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1.5">
              SCADA &amp; Satellite Telemetry Refresh Interval
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: '30 Seconds', value: '30' },
                { label: '1 Minute (Default)', value: '60' },
                { label: '5 Minutes', value: '300' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setRefreshInterval(opt.value)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors ${
                    refreshInterval === opt.value
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Section 2: Audio Alarms & Notifications */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-5">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
            <Bell className="w-4 h-4 text-blue-600" />
            <span>Emergency Broadcast &amp; Siren Alarms</span>
          </h3>

          {/* Siren Audio Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Volume2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Audio Siren Alarm</h4>
                <p className="text-[11px] text-slate-500">Play tone when severe waterlogging is detected</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleTestSiren}
                disabled={isTestingSiren}
                className="text-xs font-bold px-2.5 py-1 rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-2xs"
              >
                {isTestingSiren ? 'Testing...' : 'Test'}
              </button>
              <input
                type="checkbox"
                checked={sirenSoundEnabled}
                onChange={(e) => setSirenSoundEnabled(e.target.checked)}
                className="w-4 h-4 accent-rose-600 cursor-pointer"
              />
            </div>
          </div>

          {/* Haptic Vibration Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <Vibrate className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Haptic Vibration Pulse</h4>
                <p className="text-[11px] text-slate-500">Vibrate mobile and tablet devices on flash alert</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={vibrationEnabled}
              onChange={(e) => setVibrationEnabled(e.target.checked)}
              className="w-4 h-4 accent-blue-600 cursor-pointer"
            />
          </div>

          {/* Web Push Notification Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Web Push Notifications</h4>
                <p className="text-[11px] text-slate-500">Send immediate browser notification alerts</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={webPushEnabled}
              onChange={(e) => setWebPushEnabled(e.target.checked)}
              className="w-4 h-4 accent-indigo-600 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Sensor Health Monitoring Matrix */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-600" />
            <span>Remote Sensing Feeds &amp; Municipal SCADA Health</span>
          </span>
          <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            All Systems Operational (99.9% Uptime)
          </span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 text-[10px] uppercase font-bold block">IMD Doppler Radar</span>
            <span className="font-bold text-slate-900 mt-0.5 block">Active (38ms)</span>
            <span className="text-[10px] text-emerald-600 font-semibold">● Online</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 text-[10px] uppercase font-bold block">ESA Sentinel-2</span>
            <span className="font-bold text-slate-900 mt-0.5 block">Synced (110ms)</span>
            <span className="text-[10px] text-emerald-600 font-semibold">● 10m Rasters</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 text-[10px] uppercase font-bold block">NASA GPM IMERG</span>
            <span className="font-bold text-slate-900 mt-0.5 block">Active (85ms)</span>
            <span className="text-[10px] text-emerald-600 font-semibold">● 30m Rain Grid</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Municipal SCADA</span>
            <span className="font-bold text-slate-900 mt-0.5 block">42 / 42 Connected</span>
            <span className="text-[10px] text-emerald-600 font-semibold">● Low Latency</span>
          </div>
        </div>
      </div>
    </div>
  );
};
