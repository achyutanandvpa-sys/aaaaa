import React, { useState } from 'react';
import { NearestStationResult, CityModelOutput } from '../types.ts';
import { snapCoordinatesToNearestStation } from '../data/citiesData.ts';
import {
  Crosshair,
  MapPin,
  Navigation,
  X,
  ArrowRight,
} from 'lucide-react';

interface GPSSnapperModalProps {
  onClose: () => void;
  onApplySnap: (result: NearestStationResult) => void;
  onSelectCity: (city: CityModelOutput) => void;
}

export const GPSSnapperModal: React.FC<GPSSnapperModalProps> = ({
  onClose,
  onApplySnap,
  onSelectCity,
}) => {
  const [latInput, setLatInput] = useState<string>('28.6139'); // Delhi
  const [lngInput, setLngInput] = useState<string>('77.2090');
  const [snappedResult, setSnappedResult] = useState<NearestStationResult | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const presets = [
    { name: 'Taj Mahal (Agra)', lat: 27.1751, lng: 78.0421 },
    { name: 'Kedarnath Temple', lat: 30.7346, lng: 79.0669 },
    { name: 'Sundarbans Delta', lat: 21.9497, lng: 89.1833 },
    { name: 'Thar Desert (Jaisalmer)', lat: 26.9157, lng: 70.9083 },
    { name: 'Silicon Valley (Whitefield, BLR)', lat: 12.9698, lng: 77.7500 },
    { name: 'Kaziranga National Park', lat: 26.5775, lng: 93.1711 },
  ];

  const handleComputeSnap = (latVal: number, lngVal: number) => {
    setErrorMsg(null);
    if (isNaN(latVal) || isNaN(lngVal)) {
      setErrorMsg('Please enter valid numeric latitude and longitude coordinates.');
      return;
    }
    const result = snapCoordinatesToNearestStation(latVal, lngVal);
    setSnappedResult(result);
  };

  const handleUseBrowserGPS = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser environment.');
      return;
    }
    setIsLocating(true);
    setErrorMsg(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLatInput(lat.toFixed(4));
        setLngInput(lng.toFixed(4));
        handleComputeSnap(lat, lng);
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        setErrorMsg('Unable to acquire current location: ' + err.message);
      },
      { timeout: 8000 }
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl overflow-hidden font-mono text-xs text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
            <Crosshair className="w-4 h-4" />
            <span>PostGIS Spatial Snapping Engine</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-4">
          <p className="text-slate-400 text-xs font-sans">
            Snap any coordinate across India to the nearest operational WeatherGPT station among the 130 active AI/ML hubs using geodesic ST_Distance calculations.
          </p>

          {/* Preset Buttons */}
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">
              Sample Coordinates in India:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {presets.map((p) => (
                <button
                  key={p.name}
                  onClick={() => {
                    setLatInput(p.lat.toString());
                    setLngInput(p.lng.toString());
                    handleComputeSnap(p.lat, p.lng);
                  }}
                  className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-850 text-[10px]"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Coordinate Inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">LATITUDE (°N)</label>
              <input
                type="text"
                value={latInput}
                onChange={(e) => setLatInput(e.target.value)}
                placeholder="e.g. 28.6139"
                className="w-full bg-slate-900 border border-slate-850 rounded-lg p-2 text-white font-bold outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">LONGITUDE (°E)</label>
              <input
                type="text"
                value={lngInput}
                onChange={(e) => setLngInput(e.target.value)}
                placeholder="e.g. 77.2090"
                className="w-full bg-slate-900 border border-slate-850 rounded-lg p-2 text-white font-bold outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => handleComputeSnap(parseFloat(latInput), parseFloat(lngInput))}
              className="flex-1 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Crosshair className="w-4 h-4" />
              <span>Snap Nearest Station</span>
            </button>
            <button
              onClick={handleUseBrowserGPS}
              disabled={isLocating}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 flex items-center gap-1.5 transition-colors"
              title="Detect device GPS"
            >
              <Navigation className={`w-4 h-4 text-emerald-400 ${isLocating ? 'animate-spin' : ''}`} />
              <span>Device GPS</span>
            </button>
          </div>

          {/* Result Card */}
          {snappedResult && (
            <div className="p-4 rounded-xl bg-slate-900/90 border border-cyan-700/60 space-y-3 mt-4 animate-in fade-in">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] text-cyan-400 uppercase font-bold block">
                    NEAREST MONITORED STATION IDENTIFIED
                  </span>
                  <div className="text-base font-bold text-white mt-0.5">
                    #{snappedResult.nearestCity.city.id} {snappedResult.nearestCity.city.name}
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {snappedResult.nearestCity.city.state} • {snappedResult.nearestCity.city.zone}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-xl font-extrabold text-emerald-400">
                    {snappedResult.distanceKm} <span className="text-xs text-slate-400">km</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Bearing: {snappedResult.bearingDeg}°</span>
                </div>
              </div>

              {/* Station Models Summary */}
              <div className="grid grid-cols-3 gap-2 text-[10px] bg-slate-950/80 p-2.5 rounded-lg border border-slate-850">
                <div>
                  <span className="text-slate-500 block">1H WEATHER</span>
                  <span className="font-bold text-white">
                    {Math.round(snappedResult.nearestCity.weather.tempC)}°C
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">3H HAZARD</span>
                  <span className="font-bold text-rose-400">
                    {snappedResult.nearestCity.disaster.riskLevel}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">AGRO CROP</span>
                  <span className="font-bold text-emerald-400">
                    {snappedResult.nearestCity.agro.suitabilityScore}%
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => {
                    onApplySnap(snappedResult);
                    onClose();
                  }}
                  className="flex-1 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Plot on Map</span>
                </button>
                <button
                  onClick={() => {
                    onSelectCity(snappedResult.nearestCity);
                    onClose();
                  }}
                  className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>Inspect Station</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
