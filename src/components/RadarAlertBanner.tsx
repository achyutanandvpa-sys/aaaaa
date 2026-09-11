import React from 'react';
import { RadarAlert } from '../services/alertSystem.ts';
import {
  Volume2,
  VolumeX,
  X,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

interface RadarAlertBannerProps {
  alert: RadarAlert | null;
  onOpenDetails: () => void;
  onDismiss: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const RadarAlertBanner: React.FC<RadarAlertBannerProps> = ({
  alert,
  onOpenDetails,
  onDismiss,
  soundEnabled,
  onToggleSound,
}) => {
  if (!alert) return null;

  const isSevere = alert.riskLevel === 'SEVERE';
  const isInside = alert.isUserInsideRadar;

  return (
    <div
      className={`relative z-40 w-full px-3 sm:px-6 py-2 border-b flex items-center justify-between gap-3 text-xs font-mono transition-all animate-in slide-in-from-top duration-300 shadow-xl select-none ${
        isInside
          ? 'bg-rose-950/95 border-rose-600 text-rose-100 shadow-[0_4px_25px_rgba(244,63,94,0.35)]'
          : isSevere
          ? 'bg-amber-950/95 border-amber-600 text-amber-100'
          : 'bg-slate-900/95 border-slate-700 text-slate-200'
      }`}
    >
      <div className="flex items-center gap-2.5 overflow-hidden">
        {/* Animated Radar Pulse Beacon */}
        <div className="relative flex items-center justify-center shrink-0">
          <span
            className={`w-3 h-3 rounded-full ${
              isInside ? 'bg-rose-500 animate-ping' : 'bg-amber-400'
            }`}
          />
          <ShieldAlert
            className={`w-4 h-4 absolute ${
              isInside ? 'text-rose-200 animate-pulse' : 'text-amber-300'
            }`}
          />
        </div>

        <div className="truncate">
          <div className="flex items-center gap-2">
            <span
              className={`px-1.5 py-0.2 rounded text-[10px] font-extrabold uppercase tracking-wider ${
                isInside
                  ? 'bg-rose-500 text-slate-950'
                  : 'bg-amber-500 text-slate-950'
              }`}
            >
              {isInside ? 'RADAR PERIMETER BREACH' : '3HR HAZARD RADAR ALERT'}
            </span>
            <span className="font-bold text-white text-xs truncate">
              {alert.hazardType} &mdash; #{alert.cityData.city.id} {alert.cityData.city.name} ({alert.cityData.city.state})
            </span>
          </div>
          <p className="text-[11px] text-slate-300 font-sans truncate mt-0.5">
            {isInside ? (
              <span className="text-rose-200 font-medium">
                ⚠️ You are <strong>{alert.distanceFromUserKm.toFixed(1)} km</strong> from epicenter (within {alert.radarRadiusKm} km radar radius). Lead time: <strong>{alert.leadTime}</strong>.
              </span>
            ) : (
              <span>
                3-Hour early warning active {alert.distanceFromUserKm.toFixed(1)} km from your location. Score: {alert.riskScore}/100.
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onToggleSound}
          className={`p-1.5 rounded-lg border transition-colors ${
            soundEnabled
              ? 'bg-rose-900/80 border-rose-600 text-white'
              : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
          }`}
          title={soundEnabled ? 'Emergency Siren Sound ON' : 'Emergency Siren Sound MUTED'}
        >
          {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-rose-300 animate-pulse" /> : <VolumeX className="w-3.5 h-3.5" />}
        </button>

        <button
          onClick={onOpenDetails}
          className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 flex items-center gap-1 font-semibold text-[11px] transition-colors"
        >
          <span>Safety Directives</span>
          <ArrowRight className="w-3 h-3" />
        </button>

        <button
          onClick={onDismiss}
          className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          title="Dismiss Alert Bar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
