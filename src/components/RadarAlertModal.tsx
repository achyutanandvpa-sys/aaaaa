import React, { useState } from 'react';
import {
  RadarAlert,
  UserLocation,
  AlertNotificationSettings,
  sendDeviceNotification,
  playEmergencyAlertSound,
  triggerDeviceVibration,
} from '../services/alertSystem.ts';
import {
  ShieldAlert,
  Radio,
  Bell,
  Volume2,
  VolumeX,
  Crosshair,
  Clock,
  CheckCircle2,
  X,
  Navigation,
  PhoneCall,
  Smartphone,
  Compass,
} from 'lucide-react';

interface RadarAlertModalProps {
  onClose: () => void;
  alerts: RadarAlert[];
  userLocation: UserLocation;
  onUpdateUserLocation: (loc: UserLocation) => void;
  settings: AlertNotificationSettings;
  onUpdateSettings: (settings: AlertNotificationSettings) => void;
  onFlyToAlert: (alert: RadarAlert) => void;
}

export const RadarAlertModal: React.FC<RadarAlertModalProps> = ({
  onClose,
  alerts,
  userLocation,
  onUpdateUserLocation,
  settings,
  onUpdateSettings,
  onFlyToAlert,
}) => {
  const [notificationStatus, setNotificationStatus] = useState<string>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'unsupported';
  });

  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [testSuccessMessage, setTestSuccessMessage] = useState<string | null>(null);

  // Request browser Web Notification permission
  const handleRequestNotificationPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert('Web Notification API is not supported in this browser.');
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      setNotificationStatus(perm);
      if (perm === 'granted') {
        onUpdateSettings({ ...settings, webNotificationsEnabled: true });
        // Send welcoming verification notification
        sendDeviceNotification(
          'WeatherGPT Radar Alerts Enabled',
          'Your device will now receive instant push notifications if you enter an active 3-hour hazard radar perimeter.',
          { tag: 'welcome-alert' }
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Trigger immediate test alert on device
  const handleTestDeviceAlert = async () => {
    // 1. Sound
    if (settings.soundEnabled) {
      playEmergencyAlertSound();
    }
    // 2. Vibration
    if (settings.vibrationEnabled) {
      triggerDeviceVibration();
    }
    // 3. Device Notification
    const dispatched = await sendDeviceNotification(
      '🚨 TEST HAZARD RADAR ALERT',
      'WeatherGPT 3-Hour Disaster Risk Engine: Severe Cyclone / Flash Flood early warning simulated. Evacuate low-lying areas.',
      { requireInteraction: true, tag: 'test-emergency-alert' }
    );
    setTestSuccessMessage(
      dispatched
        ? '✅ Device alert dispatched successfully! Check your notification center.'
        : '🔊 Alert tone & vibration triggered. (Web Notification blocked or needs permission).'
    );
    setTimeout(() => setTestSuccessMessage(null), 5000);
  };

  // Acquire current device GPS
  const handleAcquireRealGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation not supported by device.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        onUpdateUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: 'My Real Device GPS Location',
          source: 'gps',
          timestamp: new Date().toISOString(),
        });
      },
      (err) => {
        setIsLocating(false);
        alert('Could not acquire GPS: ' + err.message);
      },
      { timeout: 8000 }
    );
  };

  // Simulation presets to test falling directly inside active radar perimeters
  const simulationPresets = [
    {
      label: 'Inside Coastal Cyclone Radar (Puri/Bhubaneswar)',
      lat: 20.2961,
      lng: 85.8245,
    },
    {
      label: 'Inside Mountain Landslide Radar (Shimla/Manali)',
      lat: 31.1048,
      lng: 77.1734,
    },
    {
      label: 'Inside Severe Smog/Heat Radar (Delhi/NCR)',
      lat: 28.6139,
      lng: 77.2090,
    },
    {
      label: 'Safe Nominal Region (Bangalore)',
      lat: 12.9716,
      lng: 77.5946,
    },
  ];

  const insideAlerts = alerts.filter((a) => a.isUserInsideRadar);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl rounded-2xl bg-slate-950 border border-slate-800 shadow-[0_25px_70px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col max-h-[92vh] font-mono text-xs text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-950/80 border border-rose-600/60 flex items-center justify-center text-rose-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  Hazard Radar Geofence & Device Alert System
                </h2>
                <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 text-[10px] font-bold">
                  3hr+ Early Warning
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Continuous geofencing monitoring of 130 hubs with instantaneous device notifications
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Status Alert Banner if user is currently inside danger radar */}
          {insideAlerts.length > 0 ? (
            <div className="p-4 rounded-xl bg-rose-950/70 border border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.3)] animate-pulse space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-white text-sm flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-300" />
                  <span>EMERGENCY: YOU ARE CURRENTLY INSIDE ACTIVE HAZARD RADAR</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-rose-500 text-slate-950 font-bold text-[10px]">
                  {insideAlerts.length} RADAR ZONES BREACHED
                </span>
              </div>
              <p className="text-xs text-rose-100 font-sans leading-relaxed">
                Your coordinates are within the predicted danger buffer of <strong>{insideAlerts[0].cityData.city.name}</strong> ({insideAlerts[0].hazardType}). Peak hazard onset predicted within <strong>{insideAlerts[0].leadTime}</strong>. Follow NDMA evacuation directives immediately.
              </p>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-300 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Geofence Status: Clear &mdash; No active 3-hour hazard radar within your current zone.</span>
              </div>
              <span className="text-[10px] text-slate-400">
                Nearest alert: {alerts[0]?.cityData.city.name} ({alerts[0]?.distanceFromUserKm.toFixed(1)} km)
              </span>
            </div>
          )}

          {/* Device Alert Controls Card */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-850 pb-2">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-white text-sm">Device Notification Delivery Channels</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                  notificationStatus === 'granted'
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                    : notificationStatus === 'denied'
                    ? 'bg-rose-950 text-rose-300 border-rose-800'
                    : 'bg-yellow-950 text-yellow-300 border-yellow-800'
                }`}
              >
                Browser Push: {notificationStatus.toUpperCase()}
              </span>
            </div>

            {/* Test Action & Permission Button */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                onClick={handleTestDeviceAlert}
                className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-slate-950 font-extrabold flex items-center justify-center gap-2 transition-all shadow-lg text-xs cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                <span>Raise Notification Alert on Device</span>
              </button>

              {notificationStatus !== 'granted' ? (
                <button
                  onClick={handleRequestNotificationPermission}
                  className="py-2.5 px-3 rounded-xl bg-cyan-950 hover:bg-cyan-900 border border-cyan-700 text-cyan-300 font-bold flex items-center justify-center gap-2 transition-colors text-xs cursor-pointer"
                >
                  <Bell className="w-4 h-4 text-cyan-400" />
                  <span>Grant Web Notification Permission</span>
                </button>
              ) : (
                <div className="py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Push Alerts Authorized</span>
                  </span>
                  <span className="text-[10px] text-slate-500">Instant Dispatch</span>
                </div>
              )}
            </div>

            {testSuccessMessage && (
              <div className="p-2 rounded-lg bg-slate-950 border border-emerald-500/60 text-emerald-300 text-xs animate-in fade-in">
                {testSuccessMessage}
              </div>
            )}

            {/* Notification & Sound Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-850 text-xs">
              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/60 border border-slate-850 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.soundEnabled}
                  onChange={(e) => onUpdateSettings({ ...settings, soundEnabled: e.target.checked })}
                  className="rounded accent-rose-500"
                />
                <span className="flex items-center gap-1.5 text-slate-300">
                  {settings.soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-rose-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
                  <span>Emergency Siren Audio</span>
                </span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/60 border border-slate-850 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.vibrationEnabled}
                  onChange={(e) => onUpdateSettings({ ...settings, vibrationEnabled: e.target.checked })}
                  className="rounded accent-rose-500"
                />
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Device Haptic Vibrate</span>
                </span>
              </label>

              <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-950/60 border border-slate-850">
                <span className="text-slate-400 text-[10px]">THRESHOLD:</span>
                <select
                  value={settings.minSeverityThreshold}
                  onChange={(e) =>
                    onUpdateSettings({
                      ...settings,
                      minSeverityThreshold: e.target.value as 'ADVISORY' | 'WARNING' | 'SEVERE',
                    })
                  }
                  className="bg-transparent text-white outline-none font-bold text-xs cursor-pointer w-full"
                >
                  <option value="SEVERE" className="bg-slate-900">SEVERE Only</option>
                  <option value="WARNING" className="bg-slate-900">WARNING & SEVERE</option>
                  <option value="ADVISORY" className="bg-slate-900">All Hazards</option>
                </select>
              </div>
            </div>
          </div>

          {/* User Location Geofence Settings */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crosshair className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-white text-sm">Monitored Geofence Coordinates</span>
              </div>
              <button
                onClick={handleAcquireRealGPS}
                disabled={isLocating}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 flex items-center gap-1 text-[11px] transition-colors cursor-pointer"
              >
                <Navigation className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
                <span>Acquire Device GPS</span>
              </button>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-850 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">ACTIVE LOCATION PIN</span>
                <span className="font-bold text-white">
                  {userLocation.lat.toFixed(4)}°N, {userLocation.lng.toFixed(4)}°E
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Label: {userLocation.label || 'User Geofence Anchor'} ({userLocation.source.toUpperCase()})
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 block">LAST EVALUATED</span>
                <span className="font-mono text-cyan-400">
                  {new Date(userLocation.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>

            {/* Quick Test Presets */}
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-1.5">
                Simulate Location in Active Radar Zones (For Testing Alerts):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {simulationPresets.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      onUpdateUserLocation({
                        lat: p.lat,
                        lng: p.lng,
                        label: p.label,
                        source: 'preset',
                        timestamp: new Date().toISOString(),
                      });
                    }}
                    className="p-2 text-left rounded-lg bg-slate-950/80 hover:bg-slate-800 border border-slate-850 hover:border-cyan-800 text-[11px] text-slate-300 hover:text-white transition-colors cursor-pointer"
                  >
                    <div className="font-semibold">{p.label}</div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {p.lat.toFixed(2)}°N, {p.lng.toFixed(2)}°E
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Active 3-Hour Disaster Risk Radar Perimeters List */}
          <div className="space-y-2">
            <span className="text-[11px] text-slate-400 uppercase font-semibold block">
              Active 3-Hour Disaster Early Warning Radars ({alerts.length} Stations Active):
            </span>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {alerts.map((a) => {
                const isInside = a.isUserInsideRadar;
                const isSevere = a.riskLevel === 'SEVERE';
                return (
                  <div
                    key={a.id}
                    className={`p-3 rounded-xl border transition-all ${
                      isInside
                        ? 'bg-rose-950/60 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.25)]'
                        : isSevere
                        ? 'bg-slate-900/90 border-rose-800/60'
                        : 'bg-slate-900/60 border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                              isSevere
                                ? 'bg-rose-500 text-slate-950'
                                : 'bg-amber-500 text-slate-950'
                            }`}
                          >
                            {a.riskLevel} ({a.riskScore}/100)
                          </span>
                          <span className="font-bold text-white text-sm">
                            #{a.cityData.city.id} {a.cityData.city.name}, {a.cityData.city.state}
                          </span>
                          {isInside && (
                            <span className="px-1.5 py-0.2 rounded bg-rose-600 text-white font-extrabold text-[9px] animate-pulse">
                              YOU ARE INSIDE RADAR
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-rose-300 font-semibold mt-1">
                          {a.hazardType}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-white">
                          {a.distanceFromUserKm.toFixed(1)} <span className="text-xs text-slate-400">km away</span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          Radar Radius: {a.radarRadiusKm} km
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800/80 text-[11px]">
                      <div>
                        <span className="text-slate-500 block text-[9px]">LEAD TIME COUNTDOWN</span>
                        <span className="font-bold text-cyan-300 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {a.leadTime}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px]">OFFICIAL PROTOCOL</span>
                        <span className="text-slate-300 truncate block">{a.ndmaProtocol}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-850 text-[10px]">
                      <span className="text-slate-400 font-sans">
                        Directive: {a.cityData.disaster.safetyChecklist[0]}
                      </span>
                      <button
                        onClick={() => {
                          onFlyToAlert(a);
                          onClose();
                        }}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold flex items-center gap-1 transition-colors shrink-0 ml-2 cursor-pointer"
                      >
                        <Compass className="w-3 h-3" />
                        <span>Show on Map</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Emergency SOS Numbers */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-850 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <PhoneCall className="w-4 h-4 text-rose-400" />
              <span>National Disaster Management Helpline:</span>
            </div>
            <div className="flex items-center gap-3 font-bold text-cyan-400">
              <span>NDMA 1078</span>
              <span>Police / Emergency 112</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
