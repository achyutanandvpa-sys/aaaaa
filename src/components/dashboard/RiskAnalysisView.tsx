import React from 'react';
import {
  TrendingUp,
  Activity,
  Layers,
  Droplets,
  Waves,
  Mountain,
  AlertTriangle,
  Lightbulb,
  ChevronRight,
  ShieldAlert,
  ArrowUpRight,
  CheckCircle2,
} from 'lucide-react';
import { CityModelOutput } from '../../types.ts';

interface RiskAnalysisViewProps {
  cityData: CityModelOutput;
  onSwitchToDashboard: () => void;
}

export const RiskAnalysisView: React.FC<RiskAnalysisViewProps> = ({
  cityData,
  onSwitchToDashboard,
}) => {
  const { city, weather, disaster } = cityData;

  const riskFactors = [
    {
      title: 'Rainfall Inflow vs Drainage Capacity',
      score: 76,
      status: 'Deficit Detected',
      color: 'rose',
      metric: 'Peak Inflow 48,200 m³/h vs Outfall 34,500 m³/h',
      desc: 'Storm drain network running at 139% of maximum gravity design discharge capacity.',
    },
    {
      title: 'Soil Moisture & Infiltration Saturation',
      score: 82,
      status: 'Near Saturation',
      color: 'amber',
      metric: 'Soil Water Index: 0.82 (High Runoff Coeff C=0.78)',
      desc: 'Groundwater table is elevated; ground infiltration has dropped by 65%, causing immediate overland runoff.',
    },
    {
      title: 'Low-Lying Basin Depression Storage',
      score: 64,
      status: 'Moderate Hazard',
      color: 'amber',
      metric: 'Railway Subway & Ward 12 Bowl: 27.8m ASL',
      desc: 'Topographic bowl effect directs water from surrounding 42m ridges into the central commercial district.',
    },
    {
      title: 'Downstream River & Backflow Potential',
      score: 48,
      status: 'Monitored Normal',
      color: 'emerald',
      metric: 'Discharge River Stage: +1.4m below Danger Mark',
      desc: 'Sluice gates are open; reverse hydraulic head will only occur if river rises another 1.8 meters.',
    },
  ];

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
        <span className="text-slate-900 font-bold">Risk Analysis</span>
      </div>

      {/* Hero AI Multi-Vector Risk Synthesis */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-blue-600 text-white text-xs font-extrabold uppercase tracking-wider">
                AI Risk Synthesis Engine
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Multi-Model Inundation Forecast (Hydrodynamic + WRF + GPM IMERG)
              </span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 mt-2 tracking-tight">
              {city.name} Urban Waterlogging &amp; Catchment Hydrology Analysis
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Real-time hydrodynamic evaluation combining digital elevation contours (SRTM 30m), stormwater canal discharge limits, and radar precipitation telemetry.
            </p>
          </div>

          {/* Big Score Dial */}
          <div className="flex items-center gap-4 bg-slate-50 border border-slate-200/80 p-4 rounded-2xl shrink-0">
            <div className="relative w-20 h-20 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-200"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-amber-500"
                  strokeDasharray="68, 100"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xl font-black text-slate-900">68</span>
                <span className="text-[10px] text-slate-400 font-bold">/100</span>
              </div>
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Composite Risk Rating
              </span>
              <span className="text-lg font-black text-amber-600 block">
                MODERATE HAZARD
              </span>
              <span className="text-xs text-slate-500 font-medium">
                High probability in low pockets
              </span>
            </div>
          </div>
        </div>

        {/* 4 Risk Factors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {riskFactors.map((f, i) => (
            <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors">
              <div className="flex items-center justify-between gap-2 mb-2">
                <h4 className="text-sm font-bold text-slate-900">{f.title}</h4>
                <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded ${
                  f.color === 'rose' ? 'bg-rose-100 text-rose-800' : f.color === 'amber' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {f.status}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full ${
                    f.color === 'rose' ? 'bg-rose-500' : f.color === 'amber' ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${f.score}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 font-mono mb-1">
                <span>{f.metric}</span>
                <span className="font-bold text-slate-700">{f.score}%</span>
              </div>

              <p className="text-xs text-slate-600 mt-1 font-sans">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Hydraulic Capacity & Choke Points */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 Cols: Hydrology & Drainage Capacity Stats */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
            <Droplets className="w-4 h-4 text-blue-600" />
            <span>Catchment Hydrology &amp; Drainage Discharge Metrics</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
              <span className="text-[11px] text-blue-700 block font-medium">Peak Inflow Rate</span>
              <span className="text-base sm:text-lg font-black text-slate-900 font-mono">48,200</span>
              <span className="text-[10px] text-slate-500 ml-1">m³/hour</span>
            </div>
            <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
              <span className="text-[11px] text-emerald-700 block font-medium">Total Pump Capacity</span>
              <span className="text-base sm:text-lg font-black text-slate-900 font-mono">34,500</span>
              <span className="text-[10px] text-slate-500 ml-1">m³/hour</span>
            </div>
            <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-100">
              <span className="text-[11px] text-rose-700 block font-medium">Deficit Accumulation</span>
              <span className="text-base sm:text-lg font-black text-rose-600 font-mono">+13,700</span>
              <span className="text-[10px] text-slate-500 ml-1">m³/hour</span>
            </div>
            <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100">
              <span className="text-[11px] text-amber-700 block font-medium">Est. Evacuation Time</span>
              <span className="text-base sm:text-lg font-black text-slate-900 font-mono">3.8</span>
              <span className="text-[10px] text-slate-500 ml-1">hours post-storm</span>
            </div>
          </div>

          {/* Elevation Profile info */}
          <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-100">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 mb-2">
              <Mountain className="w-4 h-4 text-slate-600" />
              <span>SRTM 30m Topographic Elevation Baseline for {city.name}</span>
            </h4>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
              <div>
                <span className="font-semibold text-slate-900">Upland Ridge:</span> 42.4 m ASL (Natural Drainage Shed)
              </div>
              <div>
                <span className="font-semibold text-slate-900">City Plain Average:</span> 34.1 m ASL
              </div>
              <div>
                <span className="font-semibold text-rose-600 font-bold">Depression Sump:</span> 27.8 m ASL (Railway Subway)
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: AI Tactical Mitigation Directives */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <h3 className="text-base font-bold text-slate-900">
                Tactical Mitigation Directives
              </h3>
            </div>

            <div className="space-y-3 mt-3">
              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-slate-700">
                <span className="font-bold text-blue-900 block mb-0.5">Directive 1: Mobile Dewatering</span>
                Deploy 2x high-discharge dewatering pump trailers to Ward 12 railway underpass before 15:30 IST.
              </div>

              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-100 text-xs text-slate-700">
                <span className="font-bold text-amber-900 block mb-0.5">Directive 2: Sluice Gate Control</span>
                Pre-empty retaining basin #2 by opening sluice valve 4B by 30 cm to create 45,000 m³ retention buffer.
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 text-xs text-slate-700">
                <span className="font-bold text-emerald-900 block mb-0.5">Directive 3: Bar Screen Maintenance</span>
                Sanitation jetting crew dispatched to clear debris from primary outfall canal grates.
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Automated by NDMA AI Hydrology Core</span>
            <span className="font-semibold text-blue-600">Model Ver 3.4</span>
          </div>
        </div>
      </div>
    </div>
  );
};
