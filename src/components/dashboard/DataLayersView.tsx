import React, { useState } from 'react';
import {
  Layers,
  Satellite,
  CloudRain,
  Mountain,
  Droplets,
  Waves,
  MapPin,
  Sprout,
  ShieldAlert,
  Sliders,
  ChevronRight,
  Eye,
  EyeOff,
  Check,
  Info,
} from 'lucide-react';
import { CityModelOutput } from '../../types.ts';

interface DataLayersViewProps {
  cityData: CityModelOutput;
  onSwitchToDashboard: () => void;
  activeMapLayer: 'satellite' | 'rainfall' | 'topography';
  onSelectMapLayer: (layer: 'satellite' | 'rainfall' | 'topography') => void;
}

export const DataLayersView: React.FC<DataLayersViewProps> = ({
  cityData,
  onSwitchToDashboard,
  activeMapLayer,
  onSelectMapLayer,
}) => {
  const { city } = cityData;

  const [layersState, setLayersState] = useState([
    {
      id: 'satellite',
      name: 'Copernicus Sentinel-2 High-Res Optical',
      provider: 'European Space Agency (ESA)',
      resolution: '10m GSD',
      revisit: '5 Days',
      enabled: activeMapLayer === 'satellite',
      opacity: 100,
      icon: Satellite,
      color: 'blue',
      category: 'Remote Sensing',
    },
    {
      id: 'rainfall',
      name: 'NASA GPM IMERG Near-Real-Time Precipitation',
      provider: 'NASA Goddard / JAXA',
      resolution: '0.1° (~10km)',
      revisit: '30 Minutes',
      enabled: activeMapLayer === 'rainfall',
      opacity: 85,
      icon: CloudRain,
      color: 'sky',
      category: 'Meteorology',
    },
    {
      id: 'topography',
      name: 'SRTM 30m Digital Elevation Model (DEM)',
      provider: 'NASA / USGS',
      resolution: '1 Arc-Second (30m)',
      revisit: 'Static Baseline',
      enabled: activeMapLayer === 'topography',
      opacity: 75,
      icon: Mountain,
      color: 'emerald',
      category: 'Topography',
    },
    {
      id: 'drainage',
      name: 'Municipal Stormwater Drainage Network',
      provider: `${city.name} Municipal Corp SCADA`,
      resolution: 'Vector GIS (1:1000)',
      revisit: 'Continuous SCADA',
      enabled: true,
      opacity: 90,
      icon: Droplets,
      color: 'cyan',
      category: 'Infrastructure',
    },
    {
      id: 'inundation',
      name: '1-in-10 & 1-in-50 Year Inundation Hazard Zones',
      provider: 'CWC / NDMA Hydrology Division',
      resolution: '5m Flood Model',
      revisit: 'Dynamic 3h Run',
      enabled: true,
      opacity: 80,
      icon: Waves,
      color: 'rose',
      category: 'Hazard Modeling',
    },
    {
      id: 'wards',
      name: 'Administrative Ward Boundaries & Population',
      provider: 'Census GIS / Municipal Cadastre',
      resolution: 'Boundary Polygons',
      revisit: 'Annual',
      enabled: true,
      opacity: 60,
      icon: MapPin,
      color: 'purple',
      category: 'Administrative',
    },
    {
      id: 'soil',
      name: 'Sentinel-1 SAR Soil Moisture Saturation',
      provider: 'ISRO / Copernicus SAR Core',
      resolution: '20m SAR Index',
      revisit: '12 Days',
      enabled: false,
      opacity: 70,
      icon: Sprout,
      color: 'emerald',
      category: 'Agro-Hydrology',
    },
    {
      id: 'assets',
      name: 'Critical Infrastructure (Hospitals, Substations, Pumps)',
      provider: 'District Disaster Management Authority',
      resolution: 'Point POI Database',
      revisit: 'Monthly',
      enabled: true,
      opacity: 100,
      icon: ShieldAlert,
      color: 'amber',
      category: 'Emergency Assets',
    },
  ]);

  const toggleLayer = (id: string) => {
    setLayersState((prev) =>
      prev.map((layer) => {
        if (layer.id === id) {
          const next = !layer.enabled;
          // Synchronize base tile if it's one of the main 3
          if (id === 'satellite' || id === 'rainfall' || id === 'topography') {
            if (next) onSelectMapLayer(id);
          }
          return { ...layer, enabled: next };
        }
        return layer;
      })
    );
  };

  const updateOpacity = (id: string, opacity: number) => {
    setLayersState((prev) =>
      prev.map((layer) => (layer.id === id ? { ...layer, opacity } : layer))
    );
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
        <span className="text-slate-900 font-bold">Data Layers</span>
      </div>

      {/* Header Info */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-blue-600 text-white text-xs font-extrabold uppercase tracking-wider">
              Geospatial GIS Engine
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Multi-Spectral Satellite, Hydrological &amp; Municipal Vectors
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 mt-2 tracking-tight">
            Data Layer Management for {city.name}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Configure active earth-observation rasters, precipitation radar grids, drainage canal vectors, and hazard zones used to compute real-time waterlogging risk.
          </p>
        </div>

        <button
          onClick={onSwitchToDashboard}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs self-start md:self-center shrink-0"
        >
          View on Interactive Map
        </button>
      </div>

      {/* Layers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {layersState.map((layer) => {
          const Icon = layer.icon;
          return (
            <div
              key={layer.id}
              className={`p-4 rounded-xl border transition-all ${
                layer.enabled
                  ? 'bg-white border-blue-200 shadow-xs ring-1 ring-blue-100'
                  : 'bg-slate-50/80 border-slate-200 opacity-75'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      layer.enabled
                        ? 'bg-blue-50 text-blue-600 border border-blue-100'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {layer.category}
                      </span>
                      {layer.enabled && (
                        <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Active
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 truncate mt-1">
                      {layer.name}
                    </h4>
                    <p className="text-xs text-slate-500 font-medium">
                      Provider: {layer.provider}
                    </p>
                  </div>
                </div>

                {/* Toggle Button */}
                <button
                  onClick={() => toggleLayer(layer.id)}
                  className={`p-2 rounded-lg transition-colors shrink-0 ${
                    layer.enabled
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                  }`}
                  title={layer.enabled ? 'Disable Layer' : 'Enable Layer'}
                >
                  {layer.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>

              {/* Layer specs and opacity */}
              <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
                <div className="flex items-center gap-3">
                  <span>Res: <strong className="text-slate-700">{layer.resolution}</strong></span>
                  <span>•</span>
                  <span>Sync: <strong className="text-slate-700">{layer.revisit}</strong></span>
                </div>

                {/* Opacity slider */}
                {layer.enabled && (
                  <div className="flex items-center gap-2">
                    <Sliders className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[11px] font-mono">{layer.opacity}%</span>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={layer.opacity}
                      onChange={(e) => updateOpacity(layer.id, Number(e.target.value))}
                      className="w-20 sm:w-24 accent-blue-600 cursor-pointer"
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
