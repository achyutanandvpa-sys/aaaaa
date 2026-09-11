import React from 'react';
import {
  CloudSun,
  ShieldAlert,
  Sprout,
  Globe,
  Map as MapIcon,
  Smartphone,
  Table,
  Bot,
  Search,
  Crosshair,
  RefreshCw,
  Layers,
  Radio,
} from 'lucide-react';
import { ActiveModelTab, ActiveViewStyle, CityModelOutput, RegionName } from '../types.ts';

interface NavbarProps {
  activeModelTab: ActiveModelTab;
  onSelectModelTab: (tab: ActiveModelTab) => void;
  activeViewStyle: ActiveViewStyle;
  onSelectViewStyle: (view: ActiveViewStyle) => void;
  selectedCity: CityModelOutput | null;
  onOpenGPSSnapper: () => void;
  onOpenAIAnalyst: () => void;
  onOpenSearch: () => void;
  totalCitiesCount: number;
  activeWarningsCount: number;
  onRefreshData: () => void;
  isRefreshing: boolean;
  selectedRegion: string;
  onSelectRegion: (region: string) => void;
  onOpenRadarAlerts: () => void;
  isUserInsideRadar: boolean;
  activeRadarAlertsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeModelTab,
  onSelectModelTab,
  activeViewStyle,
  onSelectViewStyle,
  selectedCity: _selectedCity,
  onOpenGPSSnapper,
  onOpenAIAnalyst,
  onOpenSearch,
  totalCitiesCount,
  activeWarningsCount,
  onRefreshData,
  isRefreshing,
  selectedRegion,
  onSelectRegion,
  onOpenRadarAlerts,
  isUserInsideRadar,
  activeRadarAlertsCount,
}) => {
  const regions: (RegionName | 'All Regions')[] = [
    'All Regions',
    'Northern Region',
    'Western Region',
    'Southern Region',
    'Central & Eastern Region',
    'North-Eastern States & Island Territories',
  ];

  return (
    <header className="relative z-30 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md px-3 sm:px-5 py-2.5 flex flex-col gap-2.5 select-none">
      {/* Top Primary Bar */}
      <div className="flex items-center justify-between gap-2">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500/20 via-emerald-500/20 to-blue-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.25)]">
            <Radio className="w-5 h-5 animate-pulse text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-mono font-bold text-sm sm:text-base tracking-wider text-white flex items-center gap-1.5">
                <span>WeatherGPT</span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/50">
                  INDIA 130
                </span>
              </h1>
              <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-mono text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                3 ML Models Active
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] font-mono text-slate-400 truncate max-w-[260px] sm:max-w-md">
              1h Weather Nowcast • 3h Disaster Early Warning • Agro Crop Intelligence
            </p>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="hidden lg:flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs font-mono">
          <button
            id="btn-view-map"
            onClick={() => onSelectViewStyle('map')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              activeViewStyle === 'map'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>Interactive Map</span>
          </button>
          <button
            id="btn-view-globe"
            onClick={() => onSelectViewStyle('globe')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              activeViewStyle === 'globe'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>3D Globe</span>
          </button>
          <button
            id="btn-view-mobile"
            onClick={() => onSelectViewStyle('mobile-app')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              activeViewStyle === 'mobile-app'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile App</span>
          </button>
          <button
            id="btn-view-matrix"
            onClick={() => onSelectViewStyle('matrix')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              activeViewStyle === 'matrix'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>130 Cities Master Matrix</span>
          </button>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 font-mono text-xs">
          <button
            id="btn-hazard-radar-alerts"
            onClick={onOpenRadarAlerts}
            className={`px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all ${
              isUserInsideRadar
                ? 'bg-rose-950/90 text-rose-200 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.4)] animate-pulse'
                : activeRadarAlertsCount > 0
                ? 'bg-amber-950/60 text-amber-300 border-amber-600/70 hover:bg-amber-900/60'
                : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:text-white'
            }`}
            title="3-Hour Disaster Risk Radar Geofence Alert System"
          >
            <ShieldAlert
              className={`w-3.5 h-3.5 ${
                isUserInsideRadar ? 'text-rose-400 animate-bounce' : 'text-amber-400'
              }`}
            />
            <span className="font-semibold text-xs">
              {isUserInsideRadar ? (
                <span className="text-rose-200 font-extrabold">RADAR BREACH!</span>
              ) : (
                <span>Radar Alert ({activeRadarAlertsCount})</span>
              )}
            </span>
          </button>

          <button
            id="btn-quick-search-city"
            onClick={onOpenSearch}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800 flex items-center gap-1.5 transition-colors"
            title="Search City or Station ID (Cmd+K)"
          >
            <Search className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Search City</span>
            <kbd className="hidden md:inline text-[9px] px-1 rounded bg-slate-950 border border-slate-800 text-slate-400">
              ⌘K
            </kbd>
          </button>

          <button
            id="btn-snap-gps"
            onClick={onOpenGPSSnapper}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-850 text-slate-300 hover:text-cyan-300 border border-slate-800 flex items-center gap-1.5 transition-colors"
            title="Snap any GPS coordinates in India to nearest station"
          >
            <Crosshair className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Snap GPS</span>
          </button>

          <button
            id="btn-ai-analyst"
            onClick={onOpenAIAnalyst}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-950/80 to-blue-950/80 hover:from-cyan-900/80 hover:to-blue-900/80 border border-cyan-700/60 text-cyan-300 hover:text-white font-medium flex items-center gap-1.5 transition-all shadow-sm"
            title="WeatherGPT AI Model Analyst (Gemini)"
          >
            <Bot className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden xs:inline font-semibold">AI Analyst</span>
          </button>

          <button
            id="btn-refresh-telemetry"
            onClick={onRefreshData}
            disabled={isRefreshing}
            className="p-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-850 text-slate-400 hover:text-white border border-slate-800 transition-colors"
            title="Refresh Real-time ML Prediction Pipeline"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Secondary Controls Bar: Model Filter Tabs + Region Filter */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-850 text-xs font-mono">
        {/* Model Tabs */}
        <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-lg border border-slate-800/80">
          <span className="text-[10px] text-slate-500 uppercase px-2 font-semibold hidden md:inline">
            Active Model:
          </span>
          <button
            id="tab-model-all"
            onClick={() => onSelectModelTab('all')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeModelTab === 'all'
                ? 'bg-slate-800 text-white font-bold border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3 h-3 text-cyan-400" />
            <span>Tri-Model Overview</span>
          </button>

          <button
            id="tab-model-weather"
            onClick={() => onSelectModelTab('weather')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeModelTab === 'weather'
                ? 'bg-cyan-950/80 text-cyan-300 font-bold border border-cyan-800/60'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CloudSun className="w-3 h-3 text-cyan-400" />
            <span>1-Hour Weather</span>
          </button>

          <button
            id="tab-model-disaster"
            onClick={() => onSelectModelTab('disaster')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeModelTab === 'disaster'
                ? 'bg-rose-950/80 text-rose-300 font-bold border border-rose-800/60'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-3 h-3 text-rose-400" />
            <span>3-Hour Disaster Risk</span>
            {activeWarningsCount > 0 && (
              <span className="px-1 py-0.2 rounded-full bg-rose-500 text-slate-950 text-[10px] font-bold">
                {activeWarningsCount}
              </span>
            )}
          </button>

          <button
            id="tab-model-agro"
            onClick={() => onSelectModelTab('agro')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeModelTab === 'agro'
                ? 'bg-emerald-950/80 text-emerald-300 font-bold border border-emerald-800/60'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sprout className="w-3 h-3 text-emerald-400" />
            <span>Agro Crop Intelligence</span>
          </button>
        </div>

        {/* Region Filter & Station Count Pill */}
        <div className="flex items-center gap-2">
          {/* Mobile view toggle for smaller screens */}
          <div className="flex lg:hidden items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800">
            <button
              onClick={() => onSelectViewStyle('map')}
              className={`p-1.5 rounded ${activeViewStyle === 'map' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400'}`}
              title="Map View"
            >
              <MapIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onSelectViewStyle('globe')}
              className={`p-1.5 rounded ${activeViewStyle === 'globe' ? 'bg-slate-800 text-purple-400' : 'text-slate-400'}`}
              title="3D Globe"
            >
              <Globe className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onSelectViewStyle('mobile-app')}
              className={`p-1.5 rounded ${activeViewStyle === 'mobile-app' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400'}`}
              title="Mobile App Simulator"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onSelectViewStyle('matrix')}
              className={`p-1.5 rounded ${activeViewStyle === 'matrix' ? 'bg-slate-800 text-amber-400' : 'text-slate-400'}`}
              title="Master Matrix"
            >
              <Table className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Region Dropdown */}
          <select
            id="select-region-filter"
            value={selectedRegion}
            onChange={(e) => onSelectRegion(e.target.value)}
            className="bg-slate-900 text-slate-200 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-mono outline-none hover:border-slate-700 cursor-pointer"
          >
            {regions.map((reg) => (
              <option key={reg} value={reg}>
                {reg}
              </option>
            ))}
          </select>

          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] text-slate-400">
            <span className="font-semibold text-white">{totalCitiesCount}</span>
            <span>Stations</span>
          </div>
        </div>
      </div>
    </header>
  );
};
