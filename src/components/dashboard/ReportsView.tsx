import React, { useState } from 'react';
import {
  FileText,
  Printer,
  Download,
  Copy,
  Check,
  MapPin,
  Calendar,
  Clock,
  ShieldAlert,
  ChevronRight,
  Share2,
} from 'lucide-react';
import { CityModelOutput } from '../../types.ts';

interface ReportsViewProps {
  cityData: CityModelOutput;
  onSwitchToDashboard: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  cityData,
  onSwitchToDashboard,
}) => {
  const { city, weather, disaster } = cityData;
  const [hasCopied, setHasCopied] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = () => {
    const reportSummary = `OFFICIAL EARLY WARNING DISASTER BULLETIN
Location: ${city.name}, ${city.state}
Date: Sat, 11 Oct 2025 | 14:36 IST
Severity: ${disaster.riskLevel} - Urban Waterlogging & Storm Risk
Peak Precipitation: 24.6 mm/hr expected in 2.5 hours
Critical Wards: Ward 12 (Railway Basin), Ward 35 (Subway), Ward 28
Drainage Status: Sump pumps deployed; Bar screens monitored.
Emergency Helpline: 1077 / 112`;

    navigator.clipboard.writeText(reportSummary);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2500);
  };

  const handleDownloadJSON = () => {
    const data = {
      city: city.name,
      state: city.state,
      timestamp: new Date().toISOString(),
      reportId: `EWS-${city.id}-2025-1011`,
      telemetry: {
        temperatureC: weather.temperatureC,
        precipitationMmHr: weather.precipitationMm,
        humidity: weather.humidityPercent,
        windSpeedKmH: weather.windSpeedKmH,
        riskScore: 68,
        riskLevel: disaster.riskLevel,
      },
      criticalWards: [
        { ward: 12, name: 'Old Railway Colony', status: 'High Risk', inundationCm: 38 },
        { ward: 28, name: 'Main Commercial Market', status: 'Moderate', inundationCm: 22 },
        { ward: 35, name: 'Subway Underpass', status: 'Critical Inundation', inundationCm: 45 },
      ],
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `waterlogging-bulletin-${city.name.toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
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
        <span className="text-slate-900 font-bold">Reports &amp; Bulletins</span>
      </div>

      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Municipal Hydrological Situation Report
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Document ID: <strong className="font-mono text-slate-700">MC-{city.name.toUpperCase()}-EWS-2025-1011-04</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Bulletin / PDF</span>
          </button>

          <button
            onClick={handleCopy}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold border border-slate-300 flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            {hasCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{hasCopied ? 'Copied' : 'Copy Text'}</span>
          </button>

          <button
            onClick={handleDownloadJSON}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Official Government / Municipal Report Paper Layout */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm font-sans text-slate-800 space-y-6">
        {/* Document Header */}
        <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-blue-700 block">
              District Disaster Management Authority (DDMA) &bull; Emergency Operations Cell
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 uppercase tracking-tight">
              {city.name} Municipal Corporation Waterlogging &amp; Storm Warning
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Issued in conjunction with India Meteorological Department (IMD) Radar Telemetry
            </p>
          </div>

          <div className="text-left sm:text-right text-xs text-slate-600 font-mono shrink-0">
            <div>Date: <strong className="text-slate-900">11 Oct 2025</strong></div>
            <div>Time: <strong className="text-slate-900">14:36 IST</strong></div>
            <div>Alert Level: <strong className="text-amber-600 uppercase font-black">{disaster.riskLevel}</strong></div>
          </div>
        </div>

        {/* Section 1: Executive Summary */}
        <div>
          <h3 className="text-sm font-black uppercase text-slate-900 tracking-wide border-b border-slate-200 pb-1 mb-2">
            1. Executive Assessment
          </h3>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            Multi-spectral earth observation data from Copernicus Sentinel-2 combined with NASA GPM IMERG radar indicates a strong convective precipitation front approaching {city.name} urban limits. Immediate hydraulic model forecasts predict peak accumulation between 16:30 and 18:30 IST with an estimated volume of 48,200 m³/hour. Total gravity discharge outfall is currently throttled due to high catchment runoff, necessitating active mechanical dewatering across low-elevation sectors.
          </p>
        </div>

        {/* Section 2: Telemetry Metrics Table */}
        <div>
          <h3 className="text-sm font-black uppercase text-slate-900 tracking-wide border-b border-slate-200 pb-1 mb-3">
            2. Catchment Telemetry &amp; Vulnerability Matrix
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-2.5">Parameter</th>
                  <th className="p-2.5">Observed Current</th>
                  <th className="p-2.5">Projected (+3h Peak)</th>
                  <th className="p-2.5">Design Threshold</th>
                  <th className="p-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono">
                <tr>
                  <td className="p-2.5 font-sans font-medium">Precipitation Rate</td>
                  <td className="p-2.5">18.7 mm/h</td>
                  <td className="p-2.5 text-rose-600 font-bold">24.6 mm/h</td>
                  <td className="p-2.5">15.0 mm/h</td>
                  <td className="p-2.5 text-rose-600 font-sans font-bold">Exceeded</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-sans font-medium">Storm Canal Inflow</td>
                  <td className="p-2.5">31,400 m³/h</td>
                  <td className="p-2.5 text-rose-600 font-bold">48,200 m³/h</td>
                  <td className="p-2.5">34,500 m³/h</td>
                  <td className="p-2.5 text-amber-600 font-sans font-bold">Deficit Warning</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-sans font-medium">Soil Moisture Index</td>
                  <td className="p-2.5">0.82</td>
                  <td className="p-2.5">0.91</td>
                  <td className="p-2.5">0.70</td>
                  <td className="p-2.5 text-amber-600 font-sans font-bold">Saturated</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-sans font-medium">Railway Subway Basin Stage</td>
                  <td className="p-2.5">15 cm</td>
                  <td className="p-2.5 text-rose-600 font-bold">45 cm</td>
                  <td className="p-2.5">20 cm</td>
                  <td className="p-2.5 text-rose-600 font-sans font-bold">Critical Inundation</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: Priority Standard Operating Directives */}
        <div>
          <h3 className="text-sm font-black uppercase text-slate-900 tracking-wide border-b border-slate-200 pb-1 mb-2">
            3. Standard Operating Directives for Municipal Departments
          </h3>
          <ul className="text-xs text-slate-700 space-y-1.5 list-disc pl-5">
            <li><strong>Public Works Department (Drainage):</strong> Manually open secondary sluice weir at Outfall #2. Deploy mobile diesel dewatering pump units to Ward 12 and Ward 35.</li>
            <li><strong>Traffic Police Division:</strong> Erect warning barricades at low railway subway underpasses. Divert commercial freight traffic to elevated ring bypass.</li>
            <li><strong>Electricity Supply Board:</strong> Isolate street-level feeder pillars in flooded zones to eliminate electrocution hazards.</li>
            <li><strong>District Disaster Helpline:</strong> Maintain 24/7 staffing at 1077 and 112 emergency control consoles.</li>
          </ul>
        </div>

        {/* Document Footer */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500">
          <span>Official Distribution: Municipal Commissioner, SP Police, District Magistrate</span>
          <span className="font-mono mt-1 sm:mt-0">Page 1 of 1 &bull; WeatherGPT Early-Warning Hub</span>
        </div>
      </div>
    </div>
  );
};
