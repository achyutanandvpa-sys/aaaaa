import React, { useState } from 'react';
import {
  CityModelOutput,
  SupportedCrop,
} from '../types.ts';
import {
  X,
  CloudSun,
  ShieldAlert,
  Sprout,
  Bot,
  Copy,
  Check,
  MapPin,
  Clock,
  CheckCircle2,
  Loader2,
  Sparkles,
} from 'lucide-react';

interface CityDetailModalProps {
  cityData: CityModelOutput | null;
  onClose: () => void;
  onCropChange: (crop: SupportedCrop) => void;
  onOpenAIWithCity: (city: CityModelOutput) => void;
}

export const CityDetailModal: React.FC<CityDetailModalProps> = ({
  cityData,
  onClose,
  onCropChange,
  onOpenAIWithCity: _onOpenAIWithCity,
}) => {
  if (!cityData) return null;

  const [activeTab, setActiveTab] = useState<'all' | 'weather' | 'disaster' | 'agro' | 'api'>('all');
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  const { city, weather, disaster, agro, lastUpdated } = cityData;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEndpoint(key);
    setTimeout(() => setCopiedEndpoint(null), 2000);
  };

  const crops: { id: SupportedCrop; label: string; icon: string }[] = [
    { id: 'rice', label: 'Paddy / Rice', icon: '🌾' },
    { id: 'wheat', label: 'Wheat (Rabi)', icon: '🌾' },
    { id: 'cotton', label: 'Bt Cotton', icon: '🌱' },
    { id: 'maize', label: 'Maize', icon: '🌽' },
    { id: 'sugarcane', label: 'Sugarcane', icon: '🎋' },
    { id: 'mustard', label: 'Yellow Mustard', icon: '🌻' },
    { id: 'pulses', label: 'Pulses', icon: '🌱' },
    { id: 'soybean', label: 'Soybean', icon: '🌱' },
    { id: 'millets', label: 'Millets', icon: '🌾' },
  ];

  const handleTriggerAI = async () => {
    setIsAiLoading(true);
    setAiReport(null);
    try {
      const res = await fetch('/api/ai/deep-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cityId: city.id,
          focusArea: 'Tactical Multi-Model Briefing',
        }),
      });
      const data = await res.json();
      setAiReport(data.report || 'Tactical analysis generated.');
    } catch (_err) {
      setAiReport('Could not contact Gemini AI service. Check network or server configuration.');
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl rounded-2xl bg-slate-950 border border-slate-800 shadow-[0_25px_70px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[92vh] font-mono text-xs text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-700/60 flex items-center justify-center text-cyan-400">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  #{city.id} {city.name}, {city.state}
                </h2>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-[11px] font-semibold text-cyan-300 border border-slate-700">
                  {city.zone}
                </span>
                <span className="hidden md:inline text-[10px] text-slate-400">
                  {city.region}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                <span>GPS: {city.lat.toFixed(4)}°N, {city.lng.toFixed(4)}°E</span>
                <span>•</span>
                <span>Telemetry: {new Date(lastUpdated).toLocaleTimeString()}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTriggerAI}
              disabled={isAiLoading}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-950 to-blue-950 border border-cyan-700 text-cyan-300 hover:text-white flex items-center gap-1.5 transition-all shadow-sm"
              title="Run Gemini AI Model Synthesis"
            >
              {isAiLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              )}
              <span className="hidden sm:inline">AI Synthesis</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Tab Controls */}
        <div className="px-4 py-2 bg-slate-900/60 border-b border-slate-850 flex items-center justify-between overflow-x-auto">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 rounded-md transition-colors ${
                activeTab === 'all'
                  ? 'bg-slate-800 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Tri-Model Overview
            </button>
            <button
              onClick={() => setActiveTab('weather')}
              className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
                activeTab === 'weather'
                  ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-800'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CloudSun className="w-3 h-3 text-cyan-400" />
              <span>1-Hour Forecast</span>
            </button>
            <button
              onClick={() => setActiveTab('disaster')}
              className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
                activeTab === 'disaster'
                  ? 'bg-rose-950 text-rose-300 font-bold border border-rose-800'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldAlert className="w-3 h-3 text-rose-400" />
              <span>3-Hour Early Warning</span>
            </button>
            <button
              onClick={() => setActiveTab('agro')}
              className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
                activeTab === 'agro'
                  ? 'bg-emerald-950 text-emerald-300 font-bold border border-emerald-800'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sprout className="w-3 h-3 text-emerald-400" />
              <span>Agro Intelligence</span>
            </button>
            <button
              onClick={() => setActiveTab('api')}
              className={`px-3 py-1 rounded-md transition-colors ${
                activeTab === 'api'
                  ? 'bg-amber-950 text-amber-300 font-bold border border-amber-800'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              REST APIs Preview
            </button>
          </div>
        </div>

        {/* Modal Body Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* AI Synthesis Briefing banner if generated */}
          {aiReport && (
            <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-700/60 relative">
              <div className="flex items-center justify-between text-cyan-300 font-bold text-xs mb-2">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-cyan-400" />
                  <span>WeatherGPT AI Synthesis (Chief Agro-Meteorologist & NDMA Specialist)</span>
                </div>
                <button
                  onClick={() => setAiReport(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="text-slate-200 text-xs font-sans whitespace-pre-wrap leading-relaxed">
                {aiReport}
              </div>
            </div>
          )}

          {/* TAB: TRI-MODEL OVERVIEW OR INDIVIDUAL TABS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* 1. 1-HOUR WEATHER FORECAST CARD */}
            {(activeTab === 'all' || activeTab === 'weather') && (
              <div
                className={`p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between ${
                  activeTab === 'weather' ? 'lg:col-span-3' : ''
                }`}
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800">
                        <CloudSun className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                          Model 1 of 3
                        </span>
                        <h3 className="font-bold text-white text-sm">1-Hour Forecast</h3>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-cyan-300">
                      Nowcast v4.2
                    </span>
                  </div>

                  {/* Main Temp & Condition */}
                  <div className="my-3 flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-extrabold text-white">
                        {weather.tempC}° <span className="text-xl text-slate-400">C</span>
                      </div>
                      <span className="text-xs text-slate-300 font-sans font-medium">
                        Feels like {weather.feelsLikeC}° • {weather.condition}
                      </span>
                    </div>
                    <div className="text-right text-[11px] text-slate-400">
                      <div>Cloud: <strong className="text-white">{weather.cloudCover}%</strong></div>
                      <div>Visibility: <strong className="text-white">{weather.visibilityKm} km</strong></div>
                    </div>
                  </div>

                  {/* Atmospheric Grid */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-950/60 p-2.5 rounded-lg border border-slate-850">
                    <div>
                      <span className="text-[9px] text-slate-500 block">PRECIPITATION</span>
                      <span className="font-bold text-cyan-300">{weather.precipitationMm} mm/hr ({weather.precipProb}%)</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 block">WIND VECTOR</span>
                      <span className="font-bold text-slate-200">{weather.windSpeedKmh} km/h {weather.windDirection}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 block">HUMIDITY</span>
                      <span className="font-bold text-slate-200">{weather.humidity}%</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 block">AIR QUALITY</span>
                      <span className="font-bold text-amber-300">{weather.aqi} AQI ({weather.aqiStatus})</span>
                    </div>
                  </div>

                  {/* Forecast Statement */}
                  <div className="mt-3 text-[11px] text-slate-300 bg-slate-950/40 p-2.5 rounded-lg border border-slate-850 font-sans leading-relaxed">
                    <strong className="text-cyan-400 font-mono">Radar Trend: </strong>
                    {weather.forecastNext1h}
                  </div>

                  {/* Hourly Slider */}
                  <div className="mt-3">
                    <span className="text-[10px] text-slate-500 uppercase block mb-1">
                      Next 4 Hours Projection
                    </span>
                    <div className="grid grid-cols-4 gap-1 text-center">
                      {weather.hourly.map((h, i) => (
                        <div key={i} className="bg-slate-950/80 p-1.5 rounded border border-slate-850 text-[10px]">
                          <span className="text-slate-400 block">{h.time}</span>
                          <span className="font-bold text-white my-0.5 block">{Math.round(h.tempC)}°</span>
                          <span className="text-cyan-400">{h.rainProb}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Direct API Endpoint link */}
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                  <span className="truncate">GET /predict/weather/{city.id}</span>
                  <button
                    onClick={() => copyToClipboard(`curl http://localhost:3000/predict/weather/${city.id}`, 'weather')}
                    className="p-1 rounded hover:bg-slate-800 text-cyan-400 flex items-center gap-1"
                  >
                    {copiedEndpoint === 'weather' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>cURL</span>
                  </button>
                </div>
              </div>
            )}

            {/* 2. 3-HOUR DISASTER RISK EARLY WARNING CARD */}
            {(activeTab === 'all' || activeTab === 'disaster') && (
              <div
                className={`p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between ${
                  activeTab === 'disaster' ? 'lg:col-span-3' : ''
                }`}
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-rose-950 text-rose-400 border border-rose-800">
                        <ShieldAlert className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                          Model 2 of 3
                        </span>
                        <h3 className="font-bold text-white text-sm">3h Disaster Early Warning</h3>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                        disaster.riskLevel === 'SEVERE'
                          ? 'bg-rose-500 text-slate-950 border-rose-400'
                          : disaster.riskLevel === 'WARNING'
                          ? 'bg-amber-500 text-slate-950 border-amber-400'
                          : disaster.riskLevel === 'ADVISORY'
                          ? 'bg-yellow-500 text-slate-950 border-yellow-400'
                          : 'bg-emerald-500 text-slate-950 border-emerald-400'
                      }`}
                    >
                      {disaster.riskLevel}
                    </span>
                  </div>

                  {/* Hazard Identification & Lead time */}
                  <div className="my-3">
                    <div className="text-base font-bold text-white">
                      {disaster.primaryHazard}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-300 mt-1">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Lead Time: <strong className="text-white">{disaster.leadTime}</strong></span>
                      <span>•</span>
                      <span>Probability: <strong className="text-rose-400">{disaster.probability}%</strong></span>
                    </div>
                  </div>

                  {/* Risk Meter */}
                  <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-850 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Hazard Intensity Score:</span>
                      <span className="font-bold text-white">{disaster.riskScore} / 100</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className={`h-full rounded-full ${
                          disaster.riskLevel === 'SEVERE'
                            ? 'bg-rose-500'
                            : disaster.riskLevel === 'WARNING'
                            ? 'bg-amber-500'
                            : disaster.riskLevel === 'ADVISORY'
                            ? 'bg-yellow-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${disaster.riskScore}%` }}
                      />
                    </div>
                  </div>

                  {/* NDMA Protocol */}
                  <div className="mt-3 p-2.5 rounded-lg bg-slate-950/40 border border-slate-850 text-[11px]">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">
                      ACTIVE NDMA STANDARD PROTOCOL:
                    </span>
                    <span className="text-slate-200 font-medium">{disaster.activeNDMAProtocol}</span>
                  </div>

                  {/* Safety Checklist */}
                  <div className="mt-3 space-y-1.5">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                      Recommended Immediate Directives:
                    </span>
                    {disaster.safetyChecklist.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-300 font-sans">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Direct API Endpoint link */}
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                  <span className="truncate">GET /predict/disaster/{city.id}</span>
                  <button
                    onClick={() => copyToClipboard(`curl http://localhost:3000/predict/disaster/${city.id}`, 'disaster')}
                    className="p-1 rounded hover:bg-slate-800 text-rose-400 flex items-center gap-1"
                  >
                    {copiedEndpoint === 'disaster' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>cURL</span>
                  </button>
                </div>
              </div>
            )}

            {/* 3. AGRO-METEOROLOGICAL CROP INTELLIGENCE CARD */}
            {(activeTab === 'all' || activeTab === 'agro') && (
              <div
                className={`p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between ${
                  activeTab === 'agro' ? 'lg:col-span-3' : ''
                }`}
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800">
                        <Sprout className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                          Model 3 of 3
                        </span>
                        <h3 className="font-bold text-white text-sm">Agro Crop Intelligence</h3>
                      </div>
                    </div>
                    <select
                      value={agro.crop}
                      onChange={(e) => onCropChange(e.target.value as SupportedCrop)}
                      className="bg-slate-950 text-emerald-300 border border-emerald-800/80 rounded px-2 py-0.5 text-xs outline-none cursor-pointer"
                    >
                      {crops.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.icon} {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Crop Suitability & Soil Moisture */}
                  <div className="my-3 flex items-center justify-between">
                    <div>
                      <div className="text-xl font-bold text-white">
                        {agro.cropName}
                      </div>
                      <span className="text-xs text-emerald-400 font-semibold">
                        Suitability Index: {agro.suitabilityScore}%
                      </span>
                    </div>
                    <div className="text-right text-[11px]">
                      <span className="text-[10px] text-slate-500 block">SOIL MOISTURE</span>
                      <span className="font-bold text-white">{agro.soilMoisturePct}% ({agro.soilStatus})</span>
                    </div>
                  </div>

                  {/* Irrigation Advisory */}
                  <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-800/40 text-[11px] leading-relaxed">
                    <strong className="text-emerald-400 block mb-0.5">💧 Irrigation Advisory:</strong>
                    <p className="text-slate-200 font-sans">{agro.irrigationAdvisory}</p>
                  </div>

                  {/* Pest Threat */}
                  <div className="mt-3 p-2.5 rounded-lg bg-slate-950/60 border border-slate-850 text-[11px]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-amber-400 font-bold">🐛 Pest & Pathogen Warning:</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800 font-bold">
                        {agro.pestRisk} Risk
                      </span>
                    </div>
                    <p className="text-slate-300 font-sans">{agro.pestDetails}</p>
                  </div>

                  {/* Fertilizer Tip */}
                  <div className="mt-3 text-[11px] text-slate-300 bg-slate-950/40 p-2.5 rounded-lg border border-slate-850 font-sans">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-0.5">
                      FIELD MANAGEMENT TIP
                    </span>
                    {agro.fertilizerTip}
                  </div>
                </div>

                {/* Direct API Endpoint link */}
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                  <span className="truncate">GET /advisory/{city.id}?crop={agro.crop}</span>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `curl "http://localhost:3000/advisory/${city.id}?crop=${agro.crop}"`,
                        'agro'
                      )
                    }
                    className="p-1 rounded hover:bg-slate-800 text-emerald-400 flex items-center gap-1"
                  >
                    {copiedEndpoint === 'agro' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>cURL</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* TAB: REST APIS PREVIEW */}
          {activeTab === 'api' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-850 space-y-3">
                <h4 className="font-bold text-white text-sm">Direct REST API Documentation for #{city.id} {city.name}</h4>
                <p className="text-slate-400 text-xs font-sans">
                  The WeatherGPT platform exposes high-frequency REST micro-services for all 130 cities and spatial snapping for any coordinates:
                </p>
                <div className="space-y-2">
                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                    <div className="flex items-center justify-between text-cyan-300 font-bold">
                      <span>1. 1-Hour Weather Forecast API:</span>
                      <button
                        onClick={() => copyToClipboard(`curl http://localhost:3000/predict/weather/${city.id}`, 'api1')}
                        className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-white"
                      >
                        Copy cURL
                      </button>
                    </div>
                    <code className="block mt-1 text-slate-300">GET http://localhost:3000/predict/weather/{city.id}</code>
                  </div>

                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                    <div className="flex items-center justify-between text-rose-300 font-bold">
                      <span>2. 3-Hour Disaster Risk Early Warning API:</span>
                      <button
                        onClick={() => copyToClipboard(`curl http://localhost:3000/predict/disaster/${city.id}`, 'api2')}
                        className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-white"
                      >
                        Copy cURL
                      </button>
                    </div>
                    <code className="block mt-1 text-slate-300">GET http://localhost:3000/predict/disaster/{city.id}</code>
                  </div>

                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                    <div className="flex items-center justify-between text-emerald-300 font-bold">
                      <span>3. Agro-Meteorological Crop Intelligence API:</span>
                      <button
                        onClick={() => copyToClipboard(`curl "http://localhost:3000/advisory/${city.id}?crop=rice"`, 'api3')}
                        className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-white"
                      >
                        Copy cURL
                      </button>
                    </div>
                    <code className="block mt-1 text-slate-300">GET http://localhost:3000/advisory/{city.id}?crop=rice</code>
                  </div>

                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                    <div className="flex items-center justify-between text-purple-300 font-bold">
                      <span>4. PostGIS Spatial Snapping Engine for Any Lat/Lng:</span>
                      <button
                        onClick={() => copyToClipboard(`curl "http://localhost:3000/api/nearest?lat=${city.lat}&lng=${city.lng}"`, 'api4')}
                        className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-white"
                      >
                        Copy cURL
                      </button>
                    </div>
                    <code className="block mt-1 text-slate-300">GET http://localhost:3000/api/nearest?lat={city.lat}&lng={city.lng}</code>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
