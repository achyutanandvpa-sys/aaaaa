import React, { useState } from 'react';
import {
  CityModelOutput,
  SupportedCrop,
} from '../types.ts';
import {
  IndianLanguageCode,
  INDIAN_LANGUAGES,
} from '../data/indianLanguages.ts';
import { voiceAssistant } from '../services/voiceService.ts';
import { AgentChatbox } from './AgentChatbox.tsx';
import {
  CloudSun,
  ShieldAlert,
  Sprout,
  Search,
  ChevronDown,
  MapPin,
  PhoneCall,
  CheckCircle2,
  Clock,
  X,
  Bot,
  Mic,
  MicOff,
  Maximize2,
  Minimize2,
  Volume2,
  Sliders,
  Sparkles,
  Droplets,
  Wind,
  Compass,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface MobileAppViewProps {
  cities: CityModelOutput[];
  currentCity: CityModelOutput;
  onSelectCity: (city: CityModelOutput) => void;
  onSelectCrop: (crop: SupportedCrop) => void;
  onOpenAIAnalyst: () => void;
}

export const MobileAppView: React.FC<MobileAppViewProps> = ({
  cities,
  currentCity,
  onSelectCity,
  onSelectCrop,
  onOpenAIAnalyst: _onOpenAIAnalyst,
}) => {
  // Mobile tabs: 'home' (1h Weather), 'disaster' (3h Hazard), 'farm' (Agro Intel), 'agent' (AI Chatbox)
  const [activeMobileTab, setActiveMobileTab] = useState<'home' | 'disaster' | 'farm' | 'agent'>('home');
  const [isCityModalOpen, setIsCityModalOpen] = useState<boolean>(false);
  const [citySearchQuery, setCitySearchQuery] = useState<string>('');
  const [selectedCrop, setSelectedCrop] = useState<SupportedCrop>(currentCity.agro.crop);

  // Flexibility: Toggle between phone frame mockup or fluid full-width mobile experience
  const [isFluidMode, setIsFluidMode] = useState<boolean>(false);

  // Multilingual facility: active Indian language
  const [currentLang, setCurrentLang] = useState<IndianLanguageCode>('hi');
  const [isLangMenuOpen, setIsLangMenuOpen] = useState<boolean>(false);

  // Interactive 1-Hour Radar Time Scrubber (0 min, 15 min, 30 min, 45 min, 60 min)
  const [radarOffsetMinutes, setRadarOffsetMinutes] = useState<number>(0);

  // Interactive Disaster Checklist State (allow user to toggle directives done)
  const [completedDirectives, setCompletedDirectives] = useState<Record<string, boolean>>({});

  // Interactive Irrigation Acreage Calculator
  const [fieldAcreage, setFieldAcreage] = useState<number>(2.5);

  // Voice Quick Command state
  const [isQuickVoiceActive, setIsQuickVoiceActive] = useState<boolean>(false);
  const [quickVoiceFeedback, setQuickVoiceFeedback] = useState<string | null>(null);

  const langConfig = INDIAN_LANGUAGES[currentLang] || INDIAN_LANGUAGES.hi;

  const filteredCities = cities.filter((c) => {
    const q = citySearchQuery.toLowerCase();
    return (
      c.city.name.toLowerCase().includes(q) ||
      c.city.state.toLowerCase().includes(q) ||
      c.city.id.toString() === q
    );
  });

  const cropsList: { id: SupportedCrop; label: string; icon: string }[] = [
    { id: 'rice', label: 'Paddy / Rice', icon: '🌾' },
    { id: 'wheat', label: 'Wheat (Rabi)', icon: '🌾' },
    { id: 'cotton', label: 'Bt Cotton', icon: '🌱' },
    { id: 'maize', label: 'Maize', icon: '🌽' },
    { id: 'sugarcane', label: 'Sugarcane', icon: '🎋' },
    { id: 'mustard', label: 'Mustard', icon: '🌻' },
    { id: 'pulses', label: 'Pulses', icon: '🌱' },
    { id: 'soybean', label: 'Soybean', icon: '🌱' },
    { id: 'millets', label: 'Millets', icon: '🌾' },
  ];

  const handleCropChange = (crop: SupportedCrop) => {
    setSelectedCrop(crop);
    onSelectCrop(crop);
  };

  // Dynamic calculated weather telemetry based on interactive 60-min scrubber
  const scrubbedTemp = Math.round((currentCity.weather.tempC + (radarOffsetMinutes / 60) * 0.8) * 10) / 10;
  const scrubbedRain = Math.max(0, Math.round((currentCity.weather.precipitationMm + (radarOffsetMinutes > 20 ? 1.2 : 0)) * 10) / 10);
  const scrubbedHumidity = Math.min(99, Math.round(currentCity.weather.humidity + (radarOffsetMinutes / 30) * 2));

  // Quick Voice Command Trigger from mobile view
  const handleQuickVoiceClick = () => {
    if (isQuickVoiceActive) {
      voiceAssistant.stopListening();
      setIsQuickVoiceActive(false);
      setQuickVoiceFeedback(null);
      return;
    }

    setQuickVoiceFeedback(`${langConfig.labels.speakNow} (${langConfig.name})`);
    voiceAssistant.startListening({
      languageCode: currentLang,
      onStart: () => {
        setIsQuickVoiceActive(true);
      },
      onResult: (transcript, isFinal) => {
        setQuickVoiceFeedback(`"${transcript}"`);
        if (isFinal) {
          setIsQuickVoiceActive(false);
          // Switch to agent chat tab to process the voice command with context
          setActiveMobileTab('agent');
        }
      },
      onError: (err) => {
        setIsQuickVoiceActive(false);
        setQuickVoiceFeedback(err);
        setTimeout(() => setQuickVoiceFeedback(null), 4000);
      },
      onEnd: () => {
        setIsQuickVoiceActive(false);
      },
    });
  };

  const toggleDirectiveCheck = (index: number) => {
    const key = `${currentCity.city.id}-${index}`;
    setCompletedDirectives((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-1 sm:p-4 bg-[#050811] overflow-y-auto font-mono text-xs text-slate-200 select-none">
      {/* View Flexibility Controls Bar */}
      <div className="w-full max-w-sm sm:max-w-md flex items-center justify-between px-2 py-1.5 mb-1 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-bold text-slate-300">WeatherGPT Mobile</span>
          <span className="text-[10px] text-slate-500">• 130 Hubs</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Indian Language Selector Dropdown */}
          <div className="relative">
            <button
              id="mobile-language-btn"
              onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 hover:border-cyan-700/60 text-cyan-300 font-bold text-[10px] transition-colors"
            >
              <span>{langConfig.flag}</span>
              <span>{langConfig.nativeName}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isLangMenuOpen && (
              <div className="absolute right-0 mt-1 w-40 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl z-50 p-1 max-h-56 overflow-y-auto">
                <div className="text-[9px] uppercase tracking-wider text-slate-500 px-2 py-1 font-bold">
                  Indian Languages
                </div>
                {Object.values(INDIAN_LANGUAGES).map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      setCurrentLang(l.code);
                      setIsLangMenuOpen(false);
                    }}
                    className={`w-full text-left px-2 py-1 rounded-lg flex items-center justify-between text-[11px] transition-colors ${
                      currentLang === l.code
                        ? 'bg-cyan-950/80 text-cyan-300 font-bold border border-cyan-800/60'
                        : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <span>{l.nativeName}</span>
                    <span className="text-[9px] text-slate-500">{l.code.toUpperCase()}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Fluid vs Device Mockup Toggle */}
          <button
            onClick={() => setIsFluidMode(!isFluidMode)}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors text-[10px]"
            title={isFluidMode ? 'Switch to Phone Mockup' : 'Switch to Full Mobile Screen'}
          >
            {isFluidMode ? (
              <>
                <Minimize2 className="w-3 h-3 text-cyan-400" />
                <span>Phone Frame</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3 h-3 text-cyan-400" />
                <span>Full Mobile</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Mobile App Container */}
      <div
        className={`w-full ${
          isFluidMode
            ? 'max-w-xl rounded-2xl h-[90vh]'
            : 'max-w-sm rounded-[36px] border-4 border-slate-700/80 shadow-[0_0_50px_rgba(0,0,0,0.9)] h-[760px] max-h-[92vh]'
        } bg-[#0b101d] overflow-hidden flex flex-col relative`}
      >
        {/* Top Speaker / Camera Notch (Mockup Mode only) */}
        {!isFluidMode && (
          <div className="pt-2 px-6 flex items-center justify-between bg-slate-950 text-[10px] font-mono text-slate-400 shrink-0">
            <span>9:41</span>
            <div className="w-20 h-3.5 bg-slate-900 rounded-full border border-slate-800 flex items-center justify-center">
              <span className="w-2 h-2 rounded-full bg-slate-700" />
            </div>
            <div className="flex items-center gap-1">
              <span>5G</span>
              <div className="w-4 h-2 border border-slate-400 rounded-xs p-0.5">
                <div className="w-2 h-full bg-slate-300" />
              </div>
            </div>
          </div>
        )}

        {/* Top Header with City Selector Modal Trigger & Quick Voice Mic */}
        <div className="p-3 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between shrink-0 gap-2">
          <button
            id="mobile-city-selector-btn"
            onClick={() => setIsCityModalOpen(true)}
            className="flex items-center gap-2 text-left p-1 rounded-lg hover:bg-slate-800 transition-colors group min-w-0"
          >
            <div className="w-8 h-8 rounded-full bg-cyan-950/80 border border-cyan-700/60 flex items-center justify-center text-cyan-400 shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1 text-xs font-mono font-bold text-white group-hover:text-cyan-300 truncate">
                <span className="truncate">#{currentCity.city.id} {currentCity.city.name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </div>
              <span className="text-[10px] font-mono text-slate-400 block truncate">
                {currentCity.city.state} • {currentCity.city.zone}
              </span>
            </div>
          </button>

          {/* Quick Voice Mic Button */}
          <button
            id="mobile-voice-quick-btn"
            onClick={handleQuickVoiceClick}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border transition-all shrink-0 font-bold text-[11px] ${
              isQuickVoiceActive
                ? 'bg-rose-600 text-white border-rose-500 animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.6)]'
                : 'bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border-cyan-700/60 hover:border-cyan-500'
            }`}
            title={`${langConfig.labels.voiceSearch} (${langConfig.nativeName})`}
          >
            {isQuickVoiceActive ? (
              <>
                <MicOff className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Listening...</span>
              </>
            ) : (
              <>
                <Mic className="w-3.5 h-3.5" />
                <span>{langConfig.labels.voiceSearch}</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Voice Feedback Banner */}
        {quickVoiceFeedback && (
          <div className="px-3 py-1.5 bg-cyan-950/90 border-b border-cyan-800 text-cyan-300 text-[11px] flex items-center justify-between gap-2 shrink-0 animate-fadeIn">
            <div className="flex items-center gap-1.5 truncate">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shrink-0" />
              <span className="truncate font-sans">{quickVoiceFeedback}</span>
            </div>
            <button
              onClick={() => setQuickVoiceFeedback(null)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 font-mono text-xs text-slate-200">
          {/* TAB 1: HOME (1-Hour Weather Nowcast with Interactive 60-min Radar Scrubber) */}
          {activeMobileTab === 'home' && (
            <div className="space-y-3">
              {/* Primary Weather Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/40 border border-cyan-800/40 shadow-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] uppercase text-cyan-400 font-semibold tracking-wider block">
                      {langConfig.labels.nowcast} (NOWCAST)
                    </span>
                    <div className="text-4xl font-extrabold text-white mt-1">
                      {scrubbedTemp}° <span className="text-xl text-slate-400">C</span>
                    </div>
                    <div className="text-xs text-slate-300 font-sans mt-0.5 font-medium">
                      {langConfig.labels.feelsLike} {Math.round(currentCity.weather.feelsLikeC)}° • {currentCity.weather.condition}
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-cyan-950/60 border border-cyan-700/60 flex items-center justify-center text-cyan-400 shadow-inner">
                    <CloudSun className="w-7 h-7" />
                  </div>
                </div>

                {/* Micro Stats Grid */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-800/80 text-[11px]">
                  <div className="p-1.5 rounded-lg bg-slate-950/50 text-center">
                    <span className="text-[9px] text-slate-500 block uppercase">{langConfig.labels.humidity}</span>
                    <span className="font-bold text-slate-200">{scrubbedHumidity}%</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-slate-950/50 text-center">
                    <span className="text-[9px] text-slate-500 block uppercase">{langConfig.labels.wind}</span>
                    <span className="font-bold text-slate-200">{currentCity.weather.windSpeedKmh} km/h</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-slate-950/50 text-center">
                    <span className="text-[9px] text-slate-500 block uppercase">{langConfig.labels.rain}</span>
                    <span className="font-bold text-cyan-400">{scrubbedRain} mm</span>
                  </div>
                </div>
              </div>

              {/* Interactive 1-Hour Radar Time Scrubber */}
              <div className="p-3 rounded-xl bg-slate-900/80 border border-cyan-900/50 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5 font-bold text-cyan-300">
                    <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{langConfig.labels.radarScrubber}</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                    +{radarOffsetMinutes} min forecast
                  </span>
                </div>

                {/* Scrubber Range Slider */}
                <input
                  type="range"
                  min="0"
                  max="60"
                  step="15"
                  value={radarOffsetMinutes}
                  onChange={(e) => setRadarOffsetMinutes(parseInt(e.target.value, 10))}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />

                <div className="flex justify-between text-[9px] font-mono text-slate-500 pt-0.5">
                  <span className={radarOffsetMinutes === 0 ? 'text-cyan-400 font-bold' : ''}>NOW (0m)</span>
                  <span className={radarOffsetMinutes === 15 ? 'text-cyan-400 font-bold' : ''}>+15m</span>
                  <span className={radarOffsetMinutes === 30 ? 'text-cyan-400 font-bold' : ''}>+30m</span>
                  <span className={radarOffsetMinutes === 45 ? 'text-cyan-400 font-bold' : ''}>+45m</span>
                  <span className={radarOffsetMinutes === 60 ? 'text-cyan-400 font-bold' : ''}>+60m</span>
                </div>
              </div>

              {/* 1-Hour Forecast statement */}
              <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 text-[11px] leading-relaxed">
                <span className="text-cyan-400 font-bold block mb-1">📡 Radar Trend:</span>
                <p className="text-slate-300 font-sans">{currentCity.weather.forecastNext1h}</p>
              </div>

              {/* Hourly Forecast Bar */}
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-2 font-semibold">
                  Hourly Temperature & Rain Probability
                </span>
                <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1 no-scrollbar">
                  {currentCity.weather.hourly.map((h, i) => (
                    <div key={i} className="text-center min-w-[42px] p-1.5 rounded bg-slate-950/60 border border-slate-850">
                      <span className="text-[10px] text-slate-400 block">{h.time}</span>
                      <span className="font-bold text-xs text-white block my-0.5">{Math.round(h.tempC)}°</span>
                      <span className="text-[9px] text-cyan-400 block">{h.rainProb}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* AQI & Wind Vector Card */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-[9px] text-slate-500 uppercase block">AIR QUALITY (AQI)</span>
                  <div className="text-sm font-bold text-white mt-0.5">{currentCity.weather.aqi} AQI</div>
                  <span
                    className={`mt-1 inline-block px-1.5 py-0.2 rounded text-[10px] font-bold border ${
                      currentCity.weather.aqiStatus === 'Good'
                        ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60'
                        : currentCity.weather.aqiStatus === 'Moderate'
                        ? 'bg-yellow-950/80 text-yellow-400 border-yellow-800/60'
                        : 'bg-rose-950/80 text-rose-400 border-rose-800/60'
                    }`}
                  >
                    {currentCity.weather.aqiStatus}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-[9px] text-slate-500 uppercase block">WIND VECTOR</span>
                  <div className="text-sm font-bold text-white mt-0.5 flex items-center gap-1">
                    <Compass className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{currentCity.weather.windDirection}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                    {currentCity.weather.windHeadingDeg}° Heading
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DISASTER (3-Hour Disaster Risk Early Warning) */}
          {activeMobileTab === 'disaster' && (
            <div className="space-y-3">
              {/* Main Risk Alert Banner */}
              <div
                className={`p-4 rounded-2xl border ${
                  currentCity.disaster.riskLevel === 'SEVERE'
                    ? 'bg-rose-950/40 border-rose-700/60'
                    : currentCity.disaster.riskLevel === 'WARNING'
                    ? 'bg-amber-950/40 border-amber-700/60'
                    : currentCity.disaster.riskLevel === 'ADVISORY'
                    ? 'bg-yellow-950/40 border-yellow-700/60'
                    : 'bg-emerald-950/40 border-emerald-700/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-300">
                    3-HOUR EARLY WARNING
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                      currentCity.disaster.riskLevel === 'SEVERE'
                        ? 'bg-rose-500 text-slate-950 border-rose-400'
                        : currentCity.disaster.riskLevel === 'WARNING'
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : currentCity.disaster.riskLevel === 'ADVISORY'
                        ? 'bg-yellow-500 text-slate-950 border-yellow-400'
                        : 'bg-emerald-500 text-slate-950 border-emerald-400'
                    }`}
                  >
                    {currentCity.disaster.riskLevel}
                  </span>
                </div>
                <div className="mt-2">
                  <div className="text-xl font-bold text-white leading-snug">
                    {currentCity.disaster.primaryHazard}
                  </div>
                  <div className="text-[11px] text-slate-300 mt-1 flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    <span>
                      {langConfig.labels.leadTime}: <strong className="text-white">{currentCity.disaster.leadTime}</strong>
                    </span>
                  </div>
                </div>

                {/* Score and Probability */}
                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800 text-[11px]">
                  <div>
                    <span className="text-[9px] text-slate-400 block">{langConfig.labels.riskScore}</span>
                    <span className="text-lg font-bold text-white">{currentCity.disaster.riskScore}/100</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block">PROBABILITY</span>
                    <span className="text-lg font-bold text-cyan-300">{currentCity.disaster.probability}%</span>
                  </div>
                </div>
              </div>

              {/* Active NDMA Protocol */}
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px]">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">
                  OFFICIAL NDMA PROTOCOL
                </span>
                <p className="text-slate-200 font-medium font-sans">{currentCity.disaster.activeNDMAProtocol}</p>
              </div>

              {/* Interactive Actionable Safety Checklist */}
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    {langConfig.labels.safetyChecklist} (Tap to check):
                  </span>
                </div>
                {currentCity.disaster.safetyChecklist.map((item, idx) => {
                  const isChecked = Boolean(completedDirectives[`${currentCity.city.id}-${idx}`]);
                  return (
                    <button
                      key={idx}
                      onClick={() => toggleDirectiveCheck(idx)}
                      className={`w-full text-left p-2 rounded-lg flex items-start gap-2 text-[11px] font-sans transition-colors ${
                        isChecked
                          ? 'bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 line-through'
                          : 'bg-slate-950/50 hover:bg-slate-850 text-slate-300 border border-slate-850'
                      }`}
                    >
                      <CheckCircle2
                        className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                          isChecked ? 'text-emerald-400' : 'text-slate-500'
                        }`}
                      />
                      <span>{item}</span>
                    </button>
                  );
                })}
              </div>

              {/* Emergency Hotline Button */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2 text-slate-300">
                  <PhoneCall className="w-4 h-4 text-rose-400" />
                  <span>{langConfig.labels.emergencyCall}:</span>
                </div>
                <span className="font-bold text-cyan-400 text-sm">1078 / 112</span>
              </div>
            </div>
          )}

          {/* TAB 3: FARM (Agro-Meteorological Crop Intelligence) */}
          {activeMobileTab === 'farm' && (
            <div className="space-y-3">
              {/* Crop Selector Chips */}
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1.5 font-semibold">
                  Select Target Crop:
                </span>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {cropsList.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleCropChange(c.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs whitespace-nowrap transition-colors flex items-center gap-1 shrink-0 ${
                        selectedCrop === c.id
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 font-bold'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      <span>{c.icon}</span>
                      <span>{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Crop Suitability & Soil Moisture Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-emerald-950/40 border border-emerald-800/40 shadow-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] uppercase text-emerald-400 font-semibold tracking-wider block">
                      AGRO CROP INTELLIGENCE MODEL
                    </span>
                    <div className="text-xl font-bold text-white mt-1">
                      {currentCity.agro.cropName}
                    </div>
                    <div className="text-xs text-slate-300 font-sans mt-0.5">
                      {langConfig.labels.suitability}: <strong className="text-emerald-400">{currentCity.agro.suitabilityScore}%</strong>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-700/60 flex items-center justify-center text-emerald-400">
                    <Sprout className="w-5 h-5" />
                  </div>
                </div>

                {/* Soil Moisture Bar */}
                <div className="mt-4 pt-3 border-t border-slate-800">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-slate-400">{langConfig.labels.soilMoisture}:</span>
                    <span className="font-bold text-white">{currentCity.agro.soilMoisturePct}% ({currentCity.agro.soilStatus})</span>
                  </div>
                  <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full"
                      style={{ width: `${currentCity.agro.soilMoisturePct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Interactive Irrigation Requirement Calculator */}
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <Droplets className="w-3.5 h-3.5" />
                    <span>Field Irrigation Calculator:</span>
                  </span>
                  <span className="text-white font-bold">{fieldAcreage} Acres</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="10"
                  step="0.5"
                  value={fieldAcreage}
                  onChange={(e) => setFieldAcreage(parseFloat(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1 border-t border-slate-850">
                  <span>Est. Water Volume Needed:</span>
                  <span className="text-emerald-300 font-bold">
                    {Math.round(fieldAcreage * (100 - currentCity.agro.soilMoisturePct) * 120)} Litres
                  </span>
                </div>
              </div>

              {/* Irrigation Advisory */}
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px]">
                <span className="text-emerald-400 font-bold block mb-1">💧 {langConfig.labels.irrigation}:</span>
                <p className="text-slate-200 font-sans leading-relaxed">{currentCity.agro.irrigationAdvisory}</p>
              </div>

              {/* Pest & Pathogen Alert */}
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-amber-400 font-bold">🐛 {langConfig.labels.pestRisk}:</span>
                  <span className="px-1.5 py-0.2 rounded bg-amber-950 text-amber-400 border border-amber-800 font-bold text-[10px]">
                    {currentCity.agro.pestRisk}
                  </span>
                </div>
                <p className="text-slate-300 font-sans leading-relaxed">{currentCity.agro.pestDetails}</p>
              </div>

              {/* Operations & Fertilizer */}
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px]">
                <span className="text-slate-400 block text-[10px] mb-1 font-semibold">FERTILIZER & SOIL RECOMMENDATION</span>
                <p className="text-slate-300 font-sans">{currentCity.agro.fertilizerTip}</p>
              </div>
            </div>
          )}

          {/* TAB 4: AGENT CHATBOX (Multilingual AI Agent with Voice Input) */}
          {activeMobileTab === 'agent' && (
            <div className="h-full -m-3">
              <AgentChatbox
                currentCity={currentCity}
                allCities={cities}
                selectedCrop={selectedCrop}
                onSelectCity={onSelectCity}
                isMobileEmbedded={true}
              />
            </div>
          )}
        </div>

        {/* Mobile Bottom Navigation Bar: Home, Disaster, Farm, AI Agent */}
        <div className="p-2 border-t border-slate-800 bg-slate-950 flex items-center justify-around font-mono text-xs shrink-0">
          <button
            id="mobile-tab-home"
            onClick={() => setActiveMobileTab('home')}
            className={`flex flex-col items-center gap-1 p-1 px-2.5 rounded-lg transition-colors ${
              activeMobileTab === 'home' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CloudSun className="w-4 h-4" />
            <span className="text-[10px]">{langConfig.labels.home}</span>
          </button>
          <button
            id="mobile-tab-disaster"
            onClick={() => setActiveMobileTab('disaster')}
            className={`flex flex-col items-center gap-1 p-1 px-2.5 rounded-lg transition-colors ${
              activeMobileTab === 'disaster' ? 'text-rose-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span className="text-[10px]">{langConfig.labels.disaster}</span>
          </button>
          <button
            id="mobile-tab-farm"
            onClick={() => setActiveMobileTab('farm')}
            className={`flex flex-col items-center gap-1 p-1 px-2.5 rounded-lg transition-colors ${
              activeMobileTab === 'farm' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sprout className="w-4 h-4" />
            <span className="text-[10px]">{langConfig.labels.farm}</span>
          </button>
          <button
            id="mobile-tab-agent"
            onClick={() => setActiveMobileTab('agent')}
            className={`flex flex-col items-center gap-1 p-1 px-2.5 rounded-lg transition-colors relative ${
              activeMobileTab === 'agent'
                ? 'text-cyan-300 font-bold bg-cyan-950/60 border border-cyan-700/60'
                : 'text-slate-400 hover:text-cyan-300'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span className="text-[10px]">{langConfig.labels.agentChat}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 absolute top-1 right-2 animate-ping" />
          </button>
        </div>
      </div>

      {/* City Selector Modal Popup */}
      {isCityModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setIsCityModalOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden font-mono text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <span className="font-bold text-white text-sm">Select Monitored Hub (130 Cities)</span>
              <button
                onClick={() => setIsCityModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-2 border-b border-slate-800">
              <div className="flex items-center gap-2 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={citySearchQuery}
                  onChange={(e) => setCitySearchQuery(e.target.value)}
                  placeholder="Search city, state or ID..."
                  className="bg-transparent text-xs text-white placeholder-slate-500 outline-none w-full"
                  autoFocus
                />
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto p-1 space-y-1">
              {filteredCities.map((c) => (
                <button
                  key={c.city.id}
                  onClick={() => {
                    onSelectCity(c);
                    setIsCityModalOpen(false);
                  }}
                  className={`w-full text-left p-2 rounded-lg flex items-center justify-between transition-colors ${
                    currentCity.city.id === c.city.id
                      ? 'bg-cyan-950/70 border border-cyan-800/60 text-cyan-300'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div>
                    <span className="font-bold block">#{c.city.id} {c.city.name}</span>
                    <span className="text-[10px] text-slate-500">{c.city.state} • {c.city.zone}</span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-200">{Math.round(c.weather.tempC)}°C</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
