import React, { useState } from 'react';
import { CityModelOutput } from '../types.ts';
import {
  Search,
  Download,
  ArrowUpDown,
  ExternalLink,
  ShieldAlert,
  CloudSun,
  Sprout,
  Compass,
} from 'lucide-react';

interface CityMatrixViewProps {
  cities: CityModelOutput[];
  onSelectCity: (city: CityModelOutput) => void;
  onFlyToCityOnMap: (city: CityModelOutput) => void;
}

export const CityMatrixView: React.FC<CityMatrixViewProps> = ({
  cities,
  onSelectCity,
  onFlyToCityOnMap,
}) => {
  const [search, setSearch] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'id' | 'name' | 'temp' | 'risk' | 'agro'>('id');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  // Filter cities
  const filtered = cities.filter((c) => {
    const q = search.toLowerCase();
    const matchesSearch =
      c.city.name.toLowerCase().includes(q) ||
      c.city.state.toLowerCase().includes(q) ||
      c.city.id.toString() === q ||
      c.city.zone.toLowerCase().includes(q);

    const matchesRegion = selectedRegion === 'All' || c.city.region === selectedRegion;
    const matchesRisk = selectedRiskFilter === 'All' || c.disaster.riskLevel === selectedRiskFilter;

    return matchesSearch && matchesRegion && matchesRisk;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    let comp = 0;
    if (sortBy === 'id') comp = a.city.id - b.city.id;
    else if (sortBy === 'name') comp = a.city.name.localeCompare(b.city.name);
    else if (sortBy === 'temp') comp = a.weather.tempC - b.weather.tempC;
    else if (sortBy === 'risk') comp = a.disaster.riskScore - b.disaster.riskScore;
    else if (sortBy === 'agro') comp = a.agro.suitabilityScore - b.agro.suitabilityScore;
    return sortAsc ? comp : -comp;
  });

  const handleSort = (field: 'id' | 'name' | 'temp' | 'risk' | 'agro') => {
    if (sortBy === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(field);
      setSortAsc(true);
    }
  };

  // Export JSON of all 130 predictions
  const exportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(cities, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `WeatherGPT_India_130_Model_Outputs_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Export CSV
  const exportCSV = () => {
    const headers = [
      'ID',
      'City',
      'State',
      'Latitude',
      'Longitude',
      'Zone',
      'Region',
      'Weather_TempC',
      'Weather_Condition',
      'Weather_HumidityPct',
      'Weather_PrecipMm',
      'Weather_AQI',
      'Disaster_RiskScore',
      'Disaster_RiskLevel',
      'Disaster_PrimaryHazard',
      'Agro_Crop',
      'Agro_SuitabilityScore',
      'Agro_SoilMoisturePct',
    ];

    const rows = cities.map((c) => [
      c.city.id,
      `"${c.city.name}"`,
      `"${c.city.state}"`,
      c.city.lat,
      c.city.lng,
      `"${c.city.zone}"`,
      `"${c.city.region}"`,
      c.weather.tempC,
      `"${c.weather.condition}"`,
      c.weather.humidity,
      c.weather.precipitationMm,
      c.weather.aqi,
      c.disaster.riskScore,
      c.disaster.riskLevel,
      `"${c.disaster.primaryHazard}"`,
      `"${c.agro.cropName}"`,
      c.agro.suitabilityScore,
      c.agro.soilMoisturePct,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `WeatherGPT_India_130_Matrix_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#07090e] p-4 sm:p-6 overflow-hidden select-none font-mono text-xs">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <span>130 Cities Master Intelligence Matrix</span>
            <span className="text-xs px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
              {sorted.length} / 130 Stations
            </span>
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Synchronized AI/ML multi-model outputs across all Indian districts & meteorological hubs.
          </p>
        </div>

        {/* Filter Controls & Search */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search box */}
          <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search station by name, state, ID..."
              className="bg-transparent text-xs text-white placeholder-slate-500 outline-none w-full"
            />
          </div>

          {/* Region Dropdown */}
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="bg-slate-900 text-slate-200 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs outline-none cursor-pointer"
          >
            <option value="All">All Regions (5)</option>
            <option value="Northern Region">Northern Region</option>
            <option value="Western Region">Western Region</option>
            <option value="Southern Region">Southern Region</option>
            <option value="Central & Eastern Region">Central & Eastern Region</option>
            <option value="North-Eastern States & Island Territories">North-Eastern & Islands</option>
          </select>

          {/* Risk Dropdown */}
          <select
            value={selectedRiskFilter}
            onChange={(e) => setSelectedRiskFilter(e.target.value)}
            className="bg-slate-900 text-slate-200 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs outline-none cursor-pointer"
          >
            <option value="All">All Risk Levels</option>
            <option value="LOW">Low (Nominal)</option>
            <option value="ADVISORY">Advisory</option>
            <option value="WARNING">Warning</option>
            <option value="SEVERE">Severe</option>
          </select>

          {/* Export Buttons */}
          <button
            onClick={exportCSV}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 flex items-center gap-1.5 transition-colors"
            title="Download full 130-city CSV dataset"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>CSV</span>
          </button>
          <button
            onClick={exportJSON}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 flex items-center gap-1.5 transition-colors"
            title="Download full 130-city JSON dataset"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-auto mt-4 rounded-xl border border-slate-800 bg-slate-950/60 shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-400 font-semibold">
            <tr>
              <th
                onClick={() => handleSort('id')}
                className="p-3 cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>ID</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('name')}
                className="p-3 cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Station / City</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="p-3">State & Zone</th>
              <th className="p-3">GPS Coords</th>
              <th
                onClick={() => handleSort('temp')}
                className="p-3 cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1 text-cyan-300">
                  <CloudSun className="w-3.5 h-3.5" />
                  <span>1h Weather Forecast</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('risk')}
                className="p-3 cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1 text-rose-400">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>3h Hazard Early Warning</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('agro')}
                className="p-3 cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1 text-emerald-400">
                  <Sprout className="w-3.5 h-3.5" />
                  <span>Agro Crop Intelligence</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-850/80 text-slate-300">
            {sorted.map((c) => {
              const isSevere = c.disaster.riskLevel === 'SEVERE';
              const isWarning = c.disaster.riskLevel === 'WARNING';
              const isAdvisory = c.disaster.riskLevel === 'ADVISORY';

              return (
                <tr
                  key={c.city.id}
                  onClick={() => onSelectCity(c)}
                  className="hover:bg-slate-900/80 cursor-pointer transition-colors group"
                >
                  {/* Station ID */}
                  <td className="p-3 font-bold text-slate-400 group-hover:text-cyan-400">
                    #{c.city.id}
                  </td>
                  {/* City Name */}
                  <td className="p-3">
                    <div className="font-bold text-white text-sm group-hover:text-cyan-300">
                      {c.city.name}
                    </div>
                    <span className="text-[10px] text-slate-500">{c.city.region}</span>
                  </td>
                  {/* State & Zone */}
                  <td className="p-3">
                    <div className="text-slate-200">{c.city.state}</div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                      {c.city.zone}
                    </span>
                  </td>
                  {/* Coordinates */}
                  <td className="p-3 text-[11px] text-slate-400 whitespace-nowrap">
                    {c.city.lat.toFixed(2)}°N, {c.city.lng.toFixed(2)}°E
                  </td>
                  {/* Model 1: 1-Hour Weather */}
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{Math.round(c.weather.tempC)}°C</span>
                      <span className="text-[11px] text-slate-300 truncate max-w-[120px]">
                        {c.weather.condition}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Rain: {c.weather.precipitationMm} mm • AQI: {c.weather.aqi}
                    </div>
                  </td>
                  {/* Model 2: 3-Hour Disaster Risk */}
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          isSevere
                            ? 'bg-rose-950 text-rose-300 border-rose-800'
                            : isWarning
                            ? 'bg-amber-950 text-amber-300 border-amber-800'
                            : isAdvisory
                            ? 'bg-yellow-950 text-yellow-300 border-yellow-800'
                            : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        }`}
                      >
                        {c.disaster.riskLevel} ({c.disaster.riskScore})
                      </span>
                      <span className="text-[11px] text-slate-200 font-medium truncate max-w-[140px]">
                        {c.disaster.primaryHazard}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      Lead: {c.disaster.leadTime}
                    </span>
                  </td>
                  {/* Model 3: Agro Crop Intelligence */}
                  <td className="p-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-white">{c.agro.cropName}:</span>
                      <span className="text-emerald-400 font-bold">{c.agro.suitabilityScore}%</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Moisture: {c.agro.soilMoisturePct}% ({c.agro.soilStatus})
                    </span>
                  </td>
                  {/* Actions */}
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onFlyToCityOnMap(c);
                        }}
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 border border-slate-800 transition-colors"
                        title="Fly to location on Tactical Map"
                      >
                        <Compass className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectCity(c);
                        }}
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
                        title="View Full Multi-Model Breakdown"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
