import React, { useState } from 'react';
import {
  Bell,
  AlertTriangle,
  Clock,
  Droplets,
  Volume2,
  Vibrate,
  Copy,
  Check,
  ShieldAlert,
  MapPin,
  ChevronRight,
  Phone,
  Radio,
  ArrowUpRight,
  CloudRain,
  Wind,
  ShieldCheck,
} from 'lucide-react';
import { CityModelOutput } from '../../types.ts';
import { playEmergencyAlertSound, triggerDeviceVibration } from '../../services/alertSystem.ts';

interface ForecastAlertsViewProps {
  cityData: CityModelOutput;
  onSwitchToDashboard: () => void;
}

export const ForecastAlertsView: React.FC<ForecastAlertsViewProps> = ({
  cityData,
  onSwitchToDashboard,
}) => {
  const { city, weather, disaster } = cityData;
  const [isPlayingSiren, setIsPlayingSiren] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState<string[]>([]);
  const [selectedWardFilter, setSelectedWardFilter] = useState<'all' | 'high' | 'moderate'>('all');

  // Wards with realistic telemetry for the city
  const wards = [
    {
      id: 'w12',
      name: 'Ward 12 - Old Railway Colony & Subway',
      severity: 'high',
      inundationCm: 38,
      status: 'Critical Depression Sump Overloaded',
      pumps: '2x 500 HP Mobile Dewatering Units Dispatched',
      traffic: 'Traffic Diverted via Station Flyover',
      lastUpdate: '14:28 IST',
    },
    {
      id: 'w28',
      name: 'Ward 28 - Main Commercial Market & Canal',
      severity: 'moderate',
      inundationCm: 22,
      status: 'Primary Storm Culvert Clogged with Debris',
      pumps: 'Bar Screen Clearing Team on Site',
      traffic: 'Single Lane Waterlogged, Caution Advised',
      lastUpdate: '14:22 IST',
    },
    {
      id: 'w35',
      name: 'Ward 35 - Low-Lying Industrial Sector B',
      severity: 'high',
      inundationCm: 45,
      status: 'Outfall Channel Backflow Warning',
      pumps: '3x Standby High-Volume Diesel Pumps Active',
      traffic: 'Road Closed to Light Motor Vehicles',
      lastUpdate: '14:15 IST',
    },
    {
      id: 'w44',
      name: 'Ward 44 - Riverfront Bund Embankment',
      severity: 'moderate',
      inundationCm: 16,
      status: 'Sluice Gates at 60% Discharge Capacity',
      pumps: 'Gravity Discharge Operating under Watch',
      traffic: 'Normal Flow with Embankment Patrol',
      lastUpdate: '13:58 IST',
    },
    {
      id: 'w05',
      name: 'Ward 05 - Upland Residential Nagar',
      severity: 'low',
      inundationCm: 0,
      status: 'Drainage Flowing Free to Natural Outfall',
      pumps: 'No Dewatering Required',
      traffic: 'Clear & Normal',
      lastUpdate: '13:40 IST',
    },
    {
      id: 'w19',
      name: 'Ward 19 - South Transit Hub & Bus Terminal',
      severity: 'moderate',
      inundationCm: 19,
      status: 'Water Accumulation in Bus Parking Bays',
      pumps: 'Terminal Sump Pump Active',
      traffic: 'Buses Re-routed to North Concourse',
      lastUpdate: '13:30 IST',
    },
  ];

  const filteredWards = wards.filter((w) => {
    if (selectedWardFilter === 'high') return w.severity === 'high';
    if (selectedWardFilter === 'moderate') return w.severity === 'moderate';
    return true;
  });

  const handleTestSiren = () => {
    setIsPlayingSiren(true);
    playEmergencyAlertSound();
    triggerDeviceVibration([400, 200, 400]);
    setTimeout(() => setIsPlayingSiren(false), 2000);
  };

  const handleCopySMS = () => {
    const text = `🚨 [MUNICIPAL EARLY-WARNING] ${city.name.toUpperCase()}, ${city.state}: High Waterlogging & Storm Alert issued at 14:36 IST. Peak rainfall expected within 3 hours. Wards 12, 28, 35 under heightened watch. Avoid subways and low-lying roads. Emergency Helplines: 1077 / 112.`;
    navigator.clipboard.writeText(text);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2500);
  };

  const toggleAcknowledge = (id: string) => {
    setAcknowledgedAlerts((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-[1600px] w-full mx-auto font-sans">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <button
          onClick={onSwitchToDashboard}
          className="hover:text-blue-600 transition-colors"
        >
          {city.name} Dashboard
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-900 font-bold">Forecast &amp; Alerts</span>
      </div>

      {/* Hero Emergency Alert Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-amber-500/5 border-2 border-amber-400/80 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/30 animate-pulse">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-amber-500 text-white text-xs font-extrabold uppercase tracking-wider">
                  {disaster.riskLevel} ALERT
                </span>
                <span className="text-xs font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                  IMD Storm Bulletin #{city.id}-2025
                </span>
                <span className="text-xs text-slate-600 font-medium">
                  Issued: Sat, 11 Oct 2025 | 14:36 IST
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1.5 tracking-tight">
                {city.name} Urban Waterlogging &amp; Storm Early Warning
              </h2>
              <p className="text-xs sm:text-sm text-slate-700 mt-1 leading-relaxed max-w-3xl">
                Moderate to heavy precipitation wave moving across {city.name} catchment. Low-lying depressions, railway subways, and market stormwater culverts are experiencing elevated runoff accumulation with estimated lead time of 2.5 hours before storm peak.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleTestSiren}
              disabled={isPlayingSiren}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95 disabled:opacity-75"
              title="Test Emergency Audio Siren"
            >
              <Volume2 className={`w-4 h-4 ${isPlayingSiren ? 'animate-bounce' : ''}`} />
              <span>{isPlayingSiren ? 'Sounding Siren...' : 'Sound Siren'}</span>
            </button>

            <button
              onClick={handleCopySMS}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold border border-slate-300 flex items-center gap-2 shadow-xs transition-colors"
              title="Copy SMS / Telegram Broadcast Notice"
            >
              {hasCopied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">Copied to Clipboard</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-500" />
                  <span>Copy Broadcast SMS</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Lead time bar */}
        <div className="mt-4 pt-3.5 border-t border-amber-300/60 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-700">
          <div>
            <span className="text-slate-500 block text-[11px]">Estimated Peak Inflow:</span>
            <span className="font-bold text-slate-900">16:30 - 18:30 IST (~2h 15m)</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Peak Rainfall Intensity:</span>
            <span className="font-bold text-slate-900">24.6 mm/hr</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Vulnerable Population:</span>
            <span className="font-bold text-slate-900">~42,000 residents in basin</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Municipal Status:</span>
            <span className="font-bold text-emerald-700 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Emergency Cell Activated
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Ward Hazard Status & Hourly Forecast Progression */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 Cols: Ward-by-Ward Live Waterlogging Status */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span>Ward-Level Live Inundation &amp; Drainage Telemetry</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time municipal sensor readings across critical urban drainage basins
                </p>
              </div>

              {/* Filter pills */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600 self-start">
                <button
                  onClick={() => setSelectedWardFilter('all')}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    selectedWardFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'hover:text-slate-900'
                  }`}
                >
                  All Wards ({wards.length})
                </button>
                <button
                  onClick={() => setSelectedWardFilter('high')}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    selectedWardFilter === 'high' ? 'bg-rose-500 text-white shadow-2xs' : 'hover:text-rose-600'
                  }`}
                >
                  High Risk (2)
                </button>
                <button
                  onClick={() => setSelectedWardFilter('moderate')}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    selectedWardFilter === 'moderate' ? 'bg-amber-500 text-white shadow-2xs' : 'hover:text-amber-700'
                  }`}
                >
                  Moderate (3)
                </button>
              </div>
            </div>

            {/* Ward List */}
            <div className="divide-y divide-slate-100 mt-2">
              {filteredWards.map((w) => {
                const isAck = acknowledgedAlerts.includes(w.id);
                return (
                  <div key={w.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 px-2 rounded-xl transition-colors">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-3 h-3 rounded-full shrink-0 ${
                            w.severity === 'high'
                              ? 'bg-rose-500 ring-4 ring-rose-100'
                              : w.severity === 'moderate'
                              ? 'bg-amber-500 ring-4 ring-amber-100'
                              : 'bg-emerald-500'
                          }`}
                        />
                        <h4 className="text-sm font-bold text-slate-900 truncate">
                          {w.name}
                        </h4>
                        <span
                          className={`text-[10.5px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider ${
                            w.severity === 'high'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : w.severity === 'moderate'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {w.severity}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 mt-1 font-medium">
                        {w.status}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-[11px] text-slate-500">
                        <span>🚜 {w.pumps}</span>
                        <span>🚗 {w.traffic}</span>
                        <span>⏱️ {w.lastUpdate}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                      <div className="text-right">
                        <span className="text-[10.5px] text-slate-400 block font-medium">Water Depth</span>
                        <span className={`text-base font-black ${
                          w.inundationCm > 30 ? 'text-rose-600' : w.inundationCm > 15 ? 'text-amber-600' : 'text-emerald-600'
                        }`}>
                          {w.inundationCm} cm
                        </span>
                      </div>

                      <button
                        onClick={() => toggleAcknowledge(w.id)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                          isAck
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                        title="Mark alert acknowledged by ward engineer"
                      >
                        {isAck ? (
                          <>
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Ack'd</span>
                          </>
                        ) : (
                          <span>Ack</span>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Showing {filteredWards.length} municipal monitoring stations</span>
            <span className="text-blue-600 font-semibold cursor-pointer hover:underline">
              Telemetry refreshed 45s ago
            </span>
          </div>
        </div>

        {/* Right Col: 12-Hour Hourly Storm Progression */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Storm Progression (12h)
                </h3>
              </div>
              <span className="text-xs font-semibold text-slate-500">IMD High-Res</span>
            </div>

            <div className="space-y-3 mt-3">
              {[
                { time: 'Now (14:36)', mm: 8.4, status: 'Light Rain', risk: 'Low', wind: '9.5 km/h' },
                { time: '+1 Hour (15:30)', mm: 14.5, status: 'Rain Intensifying', risk: 'Medium', wind: '14.2 km/h' },
                { time: '+3 Hours (17:30)', mm: 24.6, status: 'Peak Downpour', risk: 'High', wind: '22.0 km/h' },
                { time: '+6 Hours (20:30)', mm: 16.2, status: 'Moderate Showers', risk: 'Medium', wind: '15.8 km/h' },
                { time: '+9 Hours (23:30)', mm: 6.8, status: 'Drizzle', risk: 'Low', wind: '8.4 km/h' },
                { time: '+12 Hours (02:30)', mm: 2.1, status: 'Overcast', risk: 'Low', wind: '5.2 km/h' },
              ].map((step, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{step.time}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        step.risk === 'High' ? 'bg-rose-100 text-rose-800' : step.risk === 'Medium' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {step.risk}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{step.status} • Wind {step.wind}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-slate-900 font-mono">{step.mm}</span>
                    <span className="text-[10px] text-slate-500 ml-1">mm/h</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Emergency Helplines */}
          <div className="mt-4 pt-3.5 border-t border-slate-100 bg-blue-50/60 -mx-5 -mb-5 p-4 rounded-b-2xl">
            <h4 className="text-xs font-bold text-blue-950 flex items-center gap-1.5 mb-1.5">
              <Phone className="w-3.5 h-3.5 text-blue-700" />
              <span>Municipal Emergency Disaster Helplines</span>
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs font-medium text-slate-700">
              <div className="bg-white p-2 rounded-lg border border-blue-100">
                <span className="text-[10px] text-slate-400 block">District EOC</span>
                <span className="font-bold text-blue-800 text-sm">1077</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-blue-100">
                <span className="text-[10px] text-slate-400 block">National Emergency</span>
                <span className="font-bold text-blue-800 text-sm">112</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
