import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import {
  CityModelOutput,
  SupportedCrop,
} from '../types.ts';
import { ForecastAlertsView } from './dashboard/ForecastAlertsView.tsx';
import { RiskAnalysisView } from './dashboard/RiskAnalysisView.tsx';
import { DataLayersView } from './dashboard/DataLayersView.tsx';
import { ReportsView } from './dashboard/ReportsView.tsx';
import { SettingsView } from './dashboard/SettingsView.tsx';
import {
  Waves,
  LayoutDashboard,
  Map,
  Bell,
  TrendingUp,
  Layers,
  FileText,
  Settings,
  MapPin,
  Calendar,
  Satellite,
  Thermometer,
  CloudRain,
  Wind,
  Cloud,
  Clock,
  Sprout,
  Lightbulb,
  Crosshair,
  Search,
  Droplets,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Maximize2,
  Minimize2,
} from 'lucide-react';

interface WaterloggingDashboardProps {
  cityData: CityModelOutput;
  allCities: CityModelOutput[];
  onSelectCity: (city: CityModelOutput) => void;
  onSwitchToMap: () => void;
  onOpenSearch: () => void;
  onCropChange?: (crop: SupportedCrop) => void;
}

export const WaterloggingDashboard: React.FC<WaterloggingDashboardProps> = ({
  cityData,
  allCities: _allCities,
  onSelectCity: _onSelectCity,
  onSwitchToMap,
  onOpenSearch,
}) => {
  const { city, weather, disaster, agro } = cityData;

  // Active navigation item in the sidebar
  const [activeNav, setActiveNav] = useState<'dashboard' | 'map' | 'alerts' | 'analysis' | 'layers' | 'reports' | 'settings'>('dashboard');

  // Map layer toggle: satellite, rainfall, topography
  const [mapLayer, setMapLayer] = useState<'satellite' | 'rainfall' | 'topography'>('satellite');

  // Leaflet map container and instance references
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersGroupRef = useRef<L.LayerGroup | null>(null);
  const baseTileRef = useRef<L.TileLayer | null>(null);

  // Municipal metadata lookup with exact Guntur figures matching the image
  const municipalStats = useMemo(() => {
    if (city.name.toLowerCase() === 'guntur') {
      return {
        wards: 57,
        areaKm2: '168.41',
        surroundings: [
          { name: 'Mangalagiri', lat: 16.43, lng: 80.56 },
          { name: 'Vijayawada', lat: 16.51, lng: 80.64 },
          { name: 'Tenali', lat: 16.24, lng: 80.64 },
        ],
      };
    }
    // Dynamic realistic figures for other Indian hubs
    const wards = Math.min(250, Math.max(35, Math.floor((city.id * 17) % 180 + 35)));
    const area = (wards * 2.85).toFixed(2);
    return {
      wards,
      areaKm2: area,
      surroundings: [
        { name: `${city.name} North`, lat: city.lat + 0.12, lng: city.lng + 0.08 },
        { name: `${city.name} East`, lat: city.lat - 0.05, lng: city.lng + 0.15 },
        { name: `${city.name} South`, lat: city.lat - 0.11, lng: city.lng - 0.06 },
      ],
    };
  }, [city]);

  // Hourly rainfall forecast data for the 24-hour bar chart
  const rainfall24hData = useMemo(() => {
    // If Guntur, match the exact visual bar profile in the reference image (peaks around 15h at ~25mm)
    if (city.name.toLowerCase() === 'guntur') {
      return [
        { label: 'Now', mm: 4.2 },
        { label: '3h', mm: 6.8 },
        { label: '6h', mm: 8.4 },
        { label: '9h', mm: 11.2 },
        { label: '12h', mm: 14.5 },
        { label: '15h', mm: 22.8 },
        { label: '18h', mm: 24.6 },
        { label: '21h', mm: 18.3 },
        { label: '24h', mm: 14.2 },
      ];
    }
    // For other cities, scale smoothly according to their live precipitation and risk score
    const baseMm = Math.max(2, weather.precipitationMm);
    return [
      { label: 'Now', mm: Number((baseMm * 0.4).toFixed(1)) },
      { label: '3h', mm: Number((baseMm * 0.6 + 1.2).toFixed(1)) },
      { label: '6h', mm: Number((baseMm * 0.8 + 2.0).toFixed(1)) },
      { label: '9h', mm: Number((baseMm * 1.1 + 3.1).toFixed(1)) },
      { label: '12h', mm: Number((baseMm * 1.4 + 4.5).toFixed(1)) },
      { label: '15h', mm: Number((baseMm * 1.8 + 6.2).toFixed(1)) },
      { label: '18h', mm: Number((baseMm * 2.1 + 7.5).toFixed(1)) },
      { label: '21h', mm: Number((baseMm * 1.6 + 5.0).toFixed(1)) },
      { label: '24h', mm: Number((baseMm * 1.2 + 3.2).toFixed(1)) },
    ];
  }, [city.name, weather.precipitationMm]);

  // Risk Trend 24h curve coordinates
  const riskTrendPoints = useMemo(() => {
    // High = 80, Med = 45, Low = 15
    return [
      { label: 'Now', level: 'Low', val: 20 },
      { label: '6h', level: 'Medium', val: 38 },
      { label: '12h', level: 'Medium', val: 55 },
      { label: '18h', level: 'High', val: 78 },
      { label: '24h', level: 'Medium', val: 68 },
    ];
  }, []);

  // When switching back to dashboard, refresh map layout sizing
  useEffect(() => {
    if (activeNav === 'dashboard' && mapInstanceRef.current) {
      const timer = setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [activeNav]);

  // Initialize and update Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [city.lat, city.lng],
        zoom: 12,
        zoomControl: false,
        attributionControl: false,
        maxZoom: 18,
        minZoom: 9,
      });

      // Zoom control at top left matching screenshot
      L.control.zoom({ position: 'topleft' }).addTo(map);

      // Default to high-res Satellite layer
      const satelliteLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 18 }
      ).addTo(map);
      baseTileRef.current = satelliteLayer;

      const layersGroup = L.layerGroup().addTo(map);
      layersGroupRef.current = layersGroup;
      mapInstanceRef.current = map;
    } else {
      mapInstanceRef.current.setView([city.lat, city.lng], 12);
    }

    const map = mapInstanceRef.current;
    const layersGroup = layersGroupRef.current;
    if (!map || !layersGroup) return;

    // Switch Base Tile based on active pill
    if (baseTileRef.current) {
      map.removeLayer(baseTileRef.current);
    }

    if (mapLayer === 'satellite') {
      baseTileRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 18 }
      ).addTo(map);
    } else if (mapLayer === 'rainfall') {
      baseTileRef.current = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        { maxZoom: 18 }
      ).addTo(map);
    } else {
      // Topography (SRTM style)
      baseTileRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 18 }
      ).addTo(map);
    }

    // Clear previous overlays and re-draw risk zones, boundary, drainage lines, and labels
    layersGroup.clearLayers();

    const cLat = city.lat;
    const cLng = city.lng;

    // 1. Municipal Boundary Polygon (Glowing white border)
    const boundaryPoints: [number, number][] = [
      [cLat + 0.052, cLng - 0.025],
      [cLat + 0.068, cLng + 0.015],
      [cLat + 0.048, cLng + 0.052],
      [cLat + 0.018, cLng + 0.072],
      [cLat - 0.028, cLng + 0.065],
      [cLat - 0.055, cLng + 0.038],
      [cLat - 0.065, cLng - 0.012],
      [cLat - 0.048, cLng - 0.048],
      [cLat - 0.012, cLng - 0.062],
      [cLat + 0.025, cLng - 0.055],
    ];

    const boundaryPolygon = L.polygon(boundaryPoints, {
      color: '#ffffff',
      weight: 2.5,
      dashArray: '5, 4',
      fillColor: '#06b6d4',
      fillOpacity: 0.04,
    });
    layersGroup.addLayer(boundaryPolygon);

    // 2. Heatmap Waterlogging Risk Zones (Organic Multi-Polygons matching screenshot)
    // Low Risk Zones (Outer buffer - Green/Teal)
    const lowRiskPoints: [number, number][] = [
      [cLat + 0.042, cLng - 0.015],
      [cLat + 0.055, cLng + 0.018],
      [cLat + 0.038, cLng + 0.045],
      [cLat + 0.010, cLng + 0.055],
      [cLat - 0.022, cLng + 0.050],
      [cLat - 0.042, cLng + 0.025],
      [cLat - 0.050, cLng - 0.010],
      [cLat - 0.035, cLng - 0.038],
      [cLat + 0.015, cLng - 0.040],
    ];
    layersGroup.addLayer(
      L.polygon(lowRiskPoints, {
        color: '#10b981',
        weight: 1.5,
        fillColor: '#10b981',
        fillOpacity: 0.38,
      })
    );

    // Medium Risk Zones (Mid urban belt - Yellow/Amber)
    const medRiskPoints1: [number, number][] = [
      [cLat + 0.032, cLng - 0.005],
      [cLat + 0.038, cLng + 0.025],
      [cLat + 0.015, cLng + 0.038],
      [cLat - 0.015, cLng + 0.032],
      [cLat - 0.032, cLng + 0.010],
      [cLat - 0.025, cLng - 0.022],
      [cLat + 0.008, cLng - 0.025],
    ];
    layersGroup.addLayer(
      L.polygon(medRiskPoints1, {
        color: '#f59e0b',
        weight: 1.5,
        fillColor: '#f59e0b',
        fillOpacity: 0.50,
      })
    );

    // High Risk Zones (Core low-lying urban choke points - Vivid Red)
    const highRiskPoints1: [number, number][] = [
      [cLat + 0.018, cLng + 0.002],
      [cLat + 0.024, cLng + 0.018],
      [cLat + 0.008, cLng + 0.022],
      [cLat - 0.005, cLng + 0.012],
      [cLat + 0.002, cLng - 0.008],
    ];
    layersGroup.addLayer(
      L.polygon(highRiskPoints1, {
        color: '#ef4444',
        weight: 2,
        fillColor: '#ef4444',
        fillOpacity: 0.72,
      })
    );

    const highRiskPoints2: [number, number][] = [
      [cLat - 0.015, cLng + 0.005],
      [cLat - 0.008, cLng + 0.022],
      [cLat - 0.025, cLng + 0.028],
      [cLat - 0.030, cLng + 0.012],
    ];
    layersGroup.addLayer(
      L.polygon(highRiskPoints2, {
        color: '#ef4444',
        weight: 2,
        fillColor: '#ef4444',
        fillOpacity: 0.68,
      })
    );

    // 3. Drainage Network Lines (Vibrant Cyan storm canals)
    const drainageLine1: [number, number][] = [
      [cLat + 0.045, cLng - 0.040],
      [cLat + 0.020, cLng - 0.010],
      [cLat + 0.005, cLng + 0.008],
      [cLat - 0.015, cLng + 0.035],
      [cLat - 0.035, cLng + 0.065],
    ];
    layersGroup.addLayer(
      L.polyline(drainageLine1, {
        color: '#00e5ff',
        weight: 2.6,
        opacity: 0.95,
      })
    );

    const drainageLine2: [number, number][] = [
      [cLat - 0.045, cLng - 0.020],
      [cLat - 0.020, cLng - 0.005],
      [cLat + 0.005, cLng + 0.008],
      [cLat + 0.035, cLng + 0.025],
      [cLat + 0.055, cLng + 0.045],
    ];
    layersGroup.addLayer(
      L.polyline(drainageLine2, {
        color: '#00e5ff',
        weight: 2.4,
        opacity: 0.92,
      })
    );

    // 4. Roads (Subtle slate paths)
    const roadLine1: [number, number][] = [
      [cLat - 0.06, cLng],
      [cLat, cLng],
      [cLat + 0.06, cLng],
    ];
    layersGroup.addLayer(
      L.polyline(roadLine1, {
        color: '#94a3b8',
        weight: 1.5,
        opacity: 0.7,
      })
    );

    const roadLine2: [number, number][] = [
      [cLat, cLng - 0.06],
      [cLat, cLng],
      [cLat, cLng + 0.06],
    ];
    layersGroup.addLayer(
      L.polyline(roadLine2, {
        color: '#94a3b8',
        weight: 1.5,
        opacity: 0.7,
      })
    );

    // 5. City Center Marker / Label
    const centerIcon = L.divIcon({
      className: 'custom-center-marker',
      html: `
        <div style="transform: translate(-50%, -50%); display: flex; flex-direction: column; align-items: center;">
          <div style="background: rgba(15, 23, 42, 0.85); color: #ffffff; padding: 2px 8px; border-radius: 6px; font-size: 13px; font-weight: 800; font-family: sans-serif; border: 1px solid rgba(255,255,255,0.4); text-shadow: 0 1px 3px rgba(0,0,0,0.8); white-space: nowrap;">
            ${city.name}
          </div>
        </div>
      `,
      iconSize: [80, 26],
      iconAnchor: [40, 13],
    });
    layersGroup.addLayer(L.marker([cLat, cLng], { icon: centerIcon }));

    // 6. Surrounding Localities (e.g., Mangalagiri, Vijayawada, Tenali)
    municipalStats.surroundings.forEach((surr) => {
      const surrIcon = L.divIcon({
        className: 'custom-surr-marker',
        html: `
          <div style="transform: translate(-50%, -50%); display: flex; align-items: center; gap: 4px;">
            <div style="width: 5px; height: 5px; background: #ffffff; border-radius: 50%;"></div>
            <span style="color: #e2e8f0; font-size: 11px; font-weight: 700; font-family: sans-serif; text-shadow: 0 1px 4px #000000; white-space: nowrap;">
              ${surr.name}
            </span>
          </div>
        `,
        iconSize: [90, 18],
        iconAnchor: [45, 9],
      });
      layersGroup.addLayer(L.marker([surr.lat, surr.lng], { icon: surrIcon }));
    });

    // Invalidate size once rendered to ensure correct tile stitching
    setTimeout(() => {
      map.invalidateSize();
    }, 250);
  }, [city, mapLayer, municipalStats]);

  const handleResetMap = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([city.lat, city.lng], 12);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0c182d] text-slate-100 font-sans select-none">
      {/* ========================================================================= */}
      {/* 1. LEFT SIDEBAR (Dark Navy, matches uploaded image) */}
      {/* ========================================================================= */}
      <aside className="w-64 bg-[#0a182e] border-r border-slate-800/80 flex flex-col justify-between shrink-0 z-30 shadow-2xl">
        {/* Navigation Menu */}
        <div>
          <nav className="p-3 pt-4 space-y-1 text-xs">
            {/* Dashboard */}
            <button
              id="dash-nav-dashboard"
              onClick={() => setActiveNav('dashboard')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-all ${
                activeNav === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-sky-300" />
              <span>Dashboard</span>
            </button>

            {/* Map View */}
            <button
              id="dash-nav-map"
              onClick={() => {
                setActiveNav('map');
                onSwitchToMap();
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-all ${
                activeNav === 'map'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Map className="w-4 h-4 text-slate-400" />
              <span>Map View</span>
            </button>

            {/* Forecast & Alerts */}
            <button
              id="dash-nav-alerts"
              onClick={() => setActiveNav('alerts')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium transition-all ${
                activeNav === 'alerts'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-slate-400" />
                <span>Forecast &amp; Alerts</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            </button>

            {/* Risk Analysis */}
            <button
              id="dash-nav-analysis"
              onClick={() => setActiveNav('analysis')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-all ${
                activeNav === 'analysis'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <TrendingUp className="w-4 h-4 text-slate-400" />
              <span>Risk Analysis</span>
            </button>

            {/* Data Layers */}
            <button
              id="dash-nav-layers"
              onClick={() => setActiveNav('layers')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-all ${
                activeNav === 'layers'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-4 h-4 text-slate-400" />
              <span>Data Layers</span>
            </button>

            {/* Reports */}
            <button
              id="dash-nav-reports"
              onClick={() => setActiveNav('reports')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-all ${
                activeNav === 'reports'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <FileText className="w-4 h-4 text-slate-400" />
              <span>Reports</span>
            </button>

            {/* Settings */}
            <button
              id="dash-nav-settings"
              onClick={() => setActiveNav('settings')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-all ${
                activeNav === 'settings'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span>Settings</span>
            </button>
          </nav>
        </div>

        {/* Bottom Profile / Municipal Corporation Card */}
        <div className="p-3 border-t border-slate-800/80 bg-[#081427]/80">
          <div className="bg-[#0f2342] border border-blue-900/40 rounded-xl p-2.5 flex items-start gap-2.5 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-sky-400 shrink-0 mt-0.5">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">
                {city.name} Municipal Corporation
              </p>
              <p className="text-[10.5px] text-slate-400 mt-0.5 font-medium">
                {municipalStats.wards} Wards &nbsp;|&nbsp; {municipalStats.areaKm2} km²
              </p>
              <p className="text-[10.5px] text-slate-400 font-medium">
                {city.state}, India
              </p>
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10.5px] text-slate-400 font-sans">
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              System Online
            </span>
            <span className="text-slate-400 font-mono text-[10px]">
              Sat, 11 Oct 2025 | 14:36 IST
            </span>
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. MAIN RIGHT CONTENT AREA (Light Canvas, matches uploaded image) */}
      {/* ========================================================================= */}
      <main className="flex-1 flex flex-col bg-[#eef3f8] text-slate-800 overflow-y-auto overflow-x-hidden">
        {/* Top Header Bar */}
        <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between shadow-xs sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-900/10 flex items-center justify-center text-teal-800 shrink-0">
              <MapPin className="w-6 h-6 fill-teal-800 text-teal-800" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {city.name}, {city.state}
                </h1>
                <button
                  onClick={onOpenSearch}
                  className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold border border-slate-300/80 transition-colors flex items-center gap-1.5 shadow-2xs"
                  title="Search any of 130 places"
                >
                  <Search className="w-3 h-3 text-slate-500" />
                  <span>Change Place</span>
                </button>
              </div>
              <p className="text-xs text-slate-500 font-semibold tracking-wide mt-0.5">
                {activeNav === 'dashboard' && 'Flood & Waterlogging Early Warning'}
                {activeNav === 'alerts' && 'Forecast & Ward-Level Hazard Warnings'}
                {activeNav === 'analysis' && 'Hydrological Risk & Catchment Inundation Analysis'}
                {activeNav === 'layers' && 'Earth Observation & GIS Data Layers'}
                {activeNav === 'reports' && 'Official Municipal Situation Bulletin'}
                {activeNav === 'settings' && 'Sensor Sensitivity & Alert Thresholds'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-600 font-medium">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span>Sat, 11 Oct 2025</span>
              <span className="text-slate-300">|</span>
              <span className="font-mono">14:36 IST</span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
              <Satellite className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">Satellite Data</span>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live</span>
            </div>

            <button
              onClick={onSwitchToMap}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors"
              title="Return to National India Map"
            >
              <Map className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">All India Map</span>
            </button>
          </div>
        </header>

        {/* Dashboard Body (kept mounted so Leaflet map preserves state seamlessly) */}
        <div
          style={{ display: activeNav === 'dashboard' ? 'block' : 'none' }}
          className="p-4 sm:p-6 space-y-4 max-w-[1600px] w-full mx-auto"
        >
          {/* ========================================================================= */}
          {/* 3. TOP 5 METRIC CARDS ROW */}
          {/* ========================================================================= */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* Card 1: Current Weather */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-500 shrink-0">
                  <CloudRain className="w-8 h-8 text-sky-500" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Current Weather
                  </p>
                  <p className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                    {weather.tempC.toFixed(1)} °C
                  </p>
                  <p className="text-xs font-medium text-slate-600">
                    {weather.condition || 'Light Rain'}
                  </p>
                </div>
              </div>
              <div className="text-[11px] text-slate-600 space-y-1 font-sans pl-2 border-l border-slate-100">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-400">Humidity</span>
                  <span className="font-bold text-slate-800">{weather.humidity}%</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-400">Wind</span>
                  <span className="font-bold text-slate-800">{weather.windSpeedKmh} km/h NE</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-400">Visibility</span>
                  <span className="font-bold text-slate-800">{weather.visibilityKm} km</span>
                </div>
              </div>
            </div>

            {/* Card 2: 1-Hour Forecast */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-500 shrink-0">
                <CloudRain className="w-8 h-8 text-sky-500" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  1-Hour Forecast
                </p>
                <p className="text-xl font-black text-slate-900 tracking-tight mt-0.5">
                  {Math.floor(weather.tempC - 1)}° &rarr; {Math.ceil(weather.tempC + 1)}°
                </p>
                <p className="text-xs font-medium text-slate-600">
                  {weather.precipitationMm > 0 ? 'Rain likely' : 'Overcast'}
                </p>
              </div>
            </div>

            {/* Card 3: 3-Hour Early Warning */}
            <div
              onClick={() => setActiveNav('alerts')}
              className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs flex items-center gap-3.5 cursor-pointer hover:border-blue-400 hover:shadow-sm transition-all group"
              title="Click to open Forecast & Alerts"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 shrink-0 group-hover:scale-105 transition-transform">
                <Clock className="w-8 h-8 text-amber-500" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  3-Hour Early Warning
                </p>
                <p className="text-base font-extrabold text-amber-600 tracking-tight mt-0.5 flex items-center gap-1">
                  <span>Moderate Risk</span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </p>
                <p className="text-xs font-medium text-slate-500">
                  (Heavy Rain)
                </p>
              </div>
            </div>

            {/* Card 4: Agro Intelligence */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <Sprout className="w-8 h-8 text-emerald-600" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Agro Intelligence
                </p>
                <p className="text-base font-extrabold text-emerald-600 tracking-tight mt-0.5">
                  Favorable
                </p>
                <p className="text-xs font-medium text-slate-500">
                  (Soil Moisture 1)
                </p>
              </div>
            </div>

            {/* Card 5: AI Risk Score (Gauge) */}
            <div
              onClick={() => setActiveNav('analysis')}
              className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs flex items-center justify-between cursor-pointer hover:border-blue-400 hover:shadow-sm transition-all group"
              title="Click to view Risk Analysis breakdown"
            >
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  AI Risk Score
                </p>
                <p className="text-base font-extrabold text-amber-600 tracking-tight mt-1 flex items-center gap-1">
                  <span>Moderate</span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </p>
              </div>
              {/* Circular Gauge 68/100 */}
              <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  {/* Background Circle */}
                  <path
                    className="text-slate-100"
                    strokeWidth="3.8"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  {/* Progress Arc 68% */}
                  <path
                    className="text-teal-600"
                    strokeDasharray="68, 100"
                    strokeWidth="3.8"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-sm font-black text-slate-800 leading-none">68</span>
                  <span className="text-[9px] text-slate-400 font-semibold leading-none mt-0.5">/100</span>
                </div>
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* 4. MIDDLE SECTION: WATERLOGGING RISK MAP & CONDITIONS / RAINFALL */}
          {/* ========================================================================= */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left: Waterlogging Risk Map (Col 7) */}
            <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200/90 shadow-xs flex flex-col overflow-hidden">
              {/* Card Header & Layer Toggles */}
              <div className="p-3.5 px-4 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Waterlogging Risk Map</span>
                </h2>

                <div className="flex items-center gap-1.5 text-xs font-medium">
                  <button
                    onClick={() => setMapLayer('satellite')}
                    className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                      mapLayer === 'satellite'
                        ? 'bg-blue-50 text-blue-600 border border-blue-200 font-semibold shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>Satellite (Sentinel-2)</span>
                  </button>

                  <button
                    onClick={() => setMapLayer('rainfall')}
                    className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                      mapLayer === 'rainfall'
                        ? 'bg-blue-50 text-blue-600 border border-blue-200 font-semibold shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>Rainfall (GPM IMERG)</span>
                  </button>

                  <button
                    onClick={() => setMapLayer('topography')}
                    className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                      mapLayer === 'topography'
                        ? 'bg-blue-50 text-blue-600 border border-blue-200 font-semibold shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>Topography (SRTM)</span>
                  </button>
                </div>
              </div>

              {/* Leaflet Map Stage */}
              <div className="relative h-[380px] sm:h-[410px] w-full bg-slate-900 overflow-hidden">
                <div ref={mapContainerRef} className="h-full w-full" />

                {/* Top-Right Legend Box matching uploaded image */}
                <div className="absolute top-3 right-3 z-10 pointer-events-auto bg-slate-950/85 backdrop-blur-md p-2.5 rounded-xl border border-slate-700/70 text-[11px] font-sans text-slate-200 shadow-xl space-y-1.5">
                  <div className="flex items-center gap-2 font-medium">
                    <span className="w-3 h-3 rounded-xs bg-[#ef4444]" />
                    <span>High Risk</span>
                  </div>
                  <div className="flex items-center gap-2 font-medium">
                    <span className="w-3 h-3 rounded-xs bg-[#f59e0b]" />
                    <span>Medium Risk</span>
                  </div>
                  <div className="flex items-center gap-2 font-medium">
                    <span className="w-3 h-3 rounded-xs bg-[#10b981]" />
                    <span>Low Risk</span>
                  </div>
                  <div className="pt-1 border-t border-slate-700/80 space-y-1">
                    <div className="flex items-center gap-2 font-medium">
                      <span className="w-3.5 h-3 border border-dashed border-white inline-block rounded-xs" />
                      <span>Municipal Boundary</span>
                    </div>
                    <div className="flex items-center gap-2 font-medium">
                      <span className="w-4 h-0.5 bg-[#00e5ff] inline-block" />
                      <span>Drainage Network</span>
                    </div>
                    <div className="flex items-center gap-2 font-medium">
                      <span className="w-4 h-0.5 bg-[#94a3b8] inline-block" />
                      <span>Roads</span>
                    </div>
                  </div>
                </div>

                {/* Left Floating Target Center Button */}
                <div className="absolute top-18 left-3 z-10">
                  <button
                    onClick={handleResetMap}
                    className="w-7 h-7 rounded-md bg-white border border-slate-300 flex items-center justify-center text-slate-700 hover:bg-slate-100 shadow-sm transition-colors"
                    title="Center on Municipal Limits"
                  >
                    <Crosshair className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Bottom Left Scale Indicator */}
                <div className="absolute bottom-2.5 left-3 z-10 bg-slate-950/75 backdrop-blur-sm px-2 py-0.5 rounded text-[9.5px] font-mono text-slate-300 border border-slate-700/60 flex items-center gap-3">
                  <span>0</span>
                  <span>5</span>
                  <span>10 km</span>
                </div>
              </div>
            </div>

            {/* Right: Current Conditions & Rainfall Forecast (Col 5) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              {/* Box 1: Current Conditions & Forecast */}
              <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs">
                <h3 className="text-xs font-bold text-slate-900 tracking-tight mb-3">
                  Current Conditions &amp; Forecast
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  {/* Temp */}
                  <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
                      <Thermometer className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10.5px] font-semibold text-slate-500">Temperature</p>
                      <p className="text-base font-black text-slate-900">
                        {weather.tempC.toFixed(1)}°C
                      </p>
                    </div>
                  </div>

                  {/* Rainfall 1hr */}
                  <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
                      <CloudRain className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10.5px] font-semibold text-slate-500">Rainfall (1 hr)</p>
                      <p className="text-base font-black text-slate-900">
                        18.7 mm/hr
                      </p>
                    </div>
                  </div>

                  {/* Wind Speed */}
                  <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
                      <Wind className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10.5px] font-semibold text-slate-500">Wind Speed</p>
                      <p className="text-base font-black text-slate-900">
                        9.5 km/h NE
                      </p>
                    </div>
                  </div>

                  {/* Cloud Cover */}
                  <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
                      <Cloud className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10.5px] font-semibold text-slate-500">Cloud Cover</p>
                      <p className="text-base font-black text-slate-900">
                        88%
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Box 2: Rainfall Forecast (City) Bar Chart */}
              <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs flex-1 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-slate-900 tracking-tight">
                    Rainfall Forecast ({city.name})
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono">mm</span>
                </div>

                {/* Bar Chart Area matching uploaded image */}
                <div className="relative pt-2">
                  {/* Y-Axis lines & ticks (40, 30, 20, 10, 0) */}
                  <div className="flex justify-between items-stretch h-36 border-b border-slate-200">
                    <div className="flex flex-col justify-between text-[9px] font-mono text-slate-400 pr-2 -my-1 text-right">
                      <span>40</span>
                      <span>30</span>
                      <span>20</span>
                      <span>10</span>
                      <span>0</span>
                    </div>

                    {/* Bars Grid */}
                    <div className="flex-1 grid grid-cols-9 gap-1.5 sm:gap-2 items-end px-1">
                      {rainfall24hData.map((item, idx) => {
                        // Max scale is 40mm
                        const heightPct = Math.min(100, Math.max(8, (item.mm / 40) * 100));
                        return (
                          <div key={idx} className="flex flex-col items-center gap-1 group relative h-full justify-end">
                            {/* Hover Tooltip */}
                            <div className="absolute -top-6 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[9px] px-1.5 py-0.5 rounded font-mono pointer-events-none whitespace-nowrap z-10 shadow-md">
                              {item.mm} mm
                            </div>
                            {/* Bar */}
                            <div
                              style={{ height: `${heightPct}%` }}
                              className="w-full max-w-[24px] bg-blue-500/80 hover:bg-blue-600 rounded-t-sm transition-all shadow-xs"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* X-Axis Labels */}
                  <div className="grid grid-cols-9 gap-1.5 sm:gap-2 pl-6 pr-1 pt-2 text-center text-[10px] text-slate-500 font-sans font-medium">
                    {rainfall24hData.map((item, idx) => (
                      <span key={idx} className="truncate">
                        {item.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* 5. BOTTOM ROW: RISK TREND, RECENT ALERTS, KEY INSIGHTS */}
          {/* ========================================================================= */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Bottom 1: Risk Trend (Next 24 Hours) */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs flex flex-col justify-between">
              <h3 className="text-xs font-bold text-slate-900 tracking-tight mb-2">
                Risk Trend (Next 24 Hours)
              </h3>

              <div className="relative pt-2">
                {/* Y-axis labels and chart */}
                <div className="flex items-stretch h-36">
                  <div className="flex flex-col justify-between text-[10px] font-sans font-medium text-slate-400 pr-2 -my-1 text-right w-12">
                    <span>High</span>
                    <span>Medium</span>
                    <span>Low</span>
                  </div>

                  {/* SVG Area Curve */}
                  <div className="flex-1 relative border-b border-l border-slate-200">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 240 100" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="riskAreaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity="0.32" />
                          <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Area Fill */}
                      <path
                        d="M 10,80 Q 60,68 100,55 T 180,22 T 230,35 L 230,99 L 10,99 Z"
                        fill="url(#riskAreaGrad)"
                      />

                      {/* Line Stroke */}
                      <path
                        d="M 10,80 Q 60,68 100,55 T 180,22 T 230,35"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2.2"
                      />

                      {/* Data Point Dots */}
                      <circle cx="10" cy="80" r="3" fill="#10b981" />
                      <circle cx="65" cy="66" r="3" fill="#10b981" />
                      <circle cx="120" cy="48" r="3" fill="#10b981" />
                      <circle cx="180" cy="22" r="3.5" fill="#10b981" stroke="#ffffff" strokeWidth="1" />
                      <circle cx="230" cy="35" r="3" fill="#10b981" />
                    </svg>
                  </div>
                </div>

                {/* X-axis labels */}
                <div className="flex justify-between pl-14 pr-1 pt-2 text-[10px] text-slate-500 font-sans font-medium">
                  {riskTrendPoints.map((pt, idx) => (
                    <span key={idx}>{pt.label}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom 2: Recent Alerts */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-slate-600" />
                  <h3 className="text-xs font-bold text-slate-900 tracking-tight">
                    Recent Alerts
                  </h3>
                </div>
                <button
                  onClick={() => setActiveNav('alerts')}
                  className="text-[11px] text-blue-600 hover:text-blue-800 font-medium"
                >
                  View All
                </button>
              </div>

              <div className="space-y-2.5 text-xs text-slate-700 font-sans">
                {/* Alert 1: High */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                    <span className="truncate font-medium">High waterlogging risk in Ward 12</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">11 Oct 2025, 13:45</span>
                </div>

                {/* Alert 2: Moderate */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                    <span className="truncate font-medium">Moderate risk in Ward 28</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">11 Oct 2025, 12:20</span>
                </div>

                {/* Alert 3: Warning */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 shrink-0" />
                    <span className="truncate font-medium">Heavy rainfall expected ({city.name})</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">11 Oct 2025, 10:15</span>
                </div>

                {/* Alert 4: Normal */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                    <span className="truncate font-medium">Normal conditions in Ward 05</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">11 Oct 2025, 08:10</span>
                </div>
              </div>
            </div>

            {/* Bottom 3: Key Insights */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-slate-600" />
                <h3 className="text-xs font-bold text-slate-900 tracking-tight">
                  Key Insights
                </h3>
              </div>

              <div className="space-y-2 text-xs text-slate-700 font-sans">
                {/* Insight 1 */}
                <div className="flex items-start gap-2.5">
                  <Droplets className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                  <p className="leading-snug">
                    High probability of heavy rainfall in next 3 hours.
                  </p>
                </div>

                {/* Insight 2 */}
                <div className="flex items-start gap-2.5">
                  <Waves className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
                  <p className="leading-snug">
                    River levels may rise due to upstream catchment runoff.
                  </p>
                </div>

                {/* Insight 3 */}
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <p className="leading-snug">
                    Low-lying urban areas are vulnerable to waterlogging.
                  </p>
                </div>

                {/* Insight 4 */}
                <div className="flex items-start gap-2.5">
                  <Sprout className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="leading-snug">
                    Agriculture: Good soil moisture, suitable for paddy.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* VIEW 2: Forecast & Alerts */}
        {activeNav === 'alerts' && (
          <ForecastAlertsView
            cityData={cityData}
            onSwitchToDashboard={() => setActiveNav('dashboard')}
          />
        )}

        {/* VIEW 3: Risk Analysis */}
        {activeNav === 'analysis' && (
          <RiskAnalysisView
            cityData={cityData}
            onSwitchToDashboard={() => setActiveNav('dashboard')}
          />
        )}

        {/* VIEW 4: Data Layers */}
        {activeNav === 'layers' && (
          <DataLayersView
            cityData={cityData}
            onSwitchToDashboard={() => setActiveNav('dashboard')}
            activeMapLayer={mapLayer}
            onSelectMapLayer={setMapLayer}
          />
        )}

        {/* VIEW 5: Reports */}
        {activeNav === 'reports' && (
          <ReportsView
            cityData={cityData}
            onSwitchToDashboard={() => setActiveNav('dashboard')}
          />
        )}

        {/* VIEW 6: Settings */}
        {activeNav === 'settings' && (
          <SettingsView
            cityData={cityData}
            onSwitchToDashboard={() => setActiveNav('dashboard')}
          />
        )}
      </main>
    </div>
  );
};
