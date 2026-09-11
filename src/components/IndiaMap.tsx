import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import {
  ActiveModelTab,
  CityModelOutput,
  NearestStationResult,
} from '../types.ts';
import {
  snapCoordinatesToNearestStation,
} from '../data/citiesData.ts';
import { RadarAlert, UserLocation } from '../services/alertSystem.ts';
import {
  Crosshair,
  Compass,
  Navigation,
  X,
  Radio,
  CloudSun,
  ShieldAlert,
  Sprout,
  Layers,
} from 'lucide-react';

interface IndiaMapProps {
  cities: CityModelOutput[];
  activeModelTab: ActiveModelTab;
  onSelectModelTab: (tab: ActiveModelTab) => void;
  selectedCity: CityModelOutput | null;
  onSelectCity: (city: CityModelOutput) => void;
  flyToCity: CityModelOutput | null;
  nearestStationSnap: NearestStationResult | null;
  onSnapGPS: (result: NearestStationResult | null) => void;
  userLocation?: UserLocation | null;
  radarAlerts?: RadarAlert[];
  showRadarZones?: boolean;
  onToggleRadarZones?: () => void;
}

export const IndiaMap: React.FC<IndiaMapProps> = ({
  cities,
  activeModelTab,
  onSelectModelTab,
  selectedCity,
  onSelectCity,
  flyToCity,
  nearestStationSnap,
  onSnapGPS,
  userLocation,
  radarAlerts = [],
  showRadarZones = true,
  onToggleRadarZones,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const snapLineLayerRef = useRef<L.LayerGroup | null>(null);
  const radarCirclesLayerRef = useRef<L.LayerGroup | null>(null);
  const userLocationLayerRef = useRef<L.LayerGroup | null>(null);

  const [tileLayerType, setTileLayerType] = useState<'dark' | 'satellite' | 'street'>('dark');
  const [cursorCoords, setCursorCoords] = useState<{ lat: number; lng: number } | null>(null);
  const currentTileLayerRef = useRef<L.TileLayer | null>(null);

  // Model-specific point classification
  const disasterCities = useMemo(() => {
    return cities.filter(
      (c) =>
        c.disaster.riskLevel === 'SEVERE' ||
        c.disaster.riskLevel === 'WARNING' ||
        c.disaster.riskLevel === 'ADVISORY' ||
        c.disaster.riskScore >= 45
    );
  }, [cities]);

  const weatherCities = useMemo(() => {
    return cities.filter(
      (c) =>
        c.weather.precipitationMm > 0 ||
        c.weather.precipProb >= 50 ||
        c.weather.tempC >= 35 ||
        c.weather.tempC <= 16 ||
        c.weather.condition.toLowerCase().includes('rain') ||
        c.weather.condition.toLowerCase().includes('thunder') ||
        c.weather.condition.toLowerCase().includes('storm') ||
        c.weather.aqi > 180
    );
  }, [cities]);

  const agroCities = useMemo(() => {
    return cities.filter(
      (c) =>
        c.agro.pestRisk !== 'Low' ||
        c.agro.soilStatus === 'Deficit' ||
        c.agro.soilStatus === 'Waterlogged' ||
        c.agro.soilStatus === 'Saturated' ||
        c.agro.suitabilityScore >= 75
    );
  }, [cities]);

  // Points that should actually be drawn on the map based on the active label
  const displayedCities = useMemo(() => {
    if (activeModelTab === 'disaster') return disasterCities;
    if (activeModelTab === 'weather') return weatherCities;
    if (activeModelTab === 'agro') return agroCities;
    return cities;
  }, [activeModelTab, cities, disasterCities, weatherCities, agroCities]);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [22.59, 79.50], // Center of India
      zoom: 5,
      minZoom: 4,
      maxZoom: 17,
      zoomControl: false,
      attributionControl: true,
    });

    // Zoom control
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Initial tile layer: High-contrast Dark Tactical OSM (No API key required)
    const tileLayer = L.tileLayer(
      'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | WeatherGPT India',
        maxZoom: 19,
        className: 'tactical-dark-tiles',
      }
    ).addTo(map);
    currentTileLayerRef.current = tileLayer;

    const radarCirclesGroup = L.layerGroup().addTo(map);
    const snapLineGroup = L.layerGroup().addTo(map);
    const userLocationGroup = L.layerGroup().addTo(map);
    const markersGroup = L.layerGroup().addTo(map);

    radarCirclesLayerRef.current = radarCirclesGroup;
    snapLineLayerRef.current = snapLineGroup;
    userLocationLayerRef.current = userLocationGroup;
    markersLayerRef.current = markersGroup;

    mapInstanceRef.current = map;

    // Track mouse coordinates
    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      setCursorCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
    });

    map.on('mouseout', () => {
      setCursorCoords(null);
    });

    // Map Click: PostGIS Spatial Snapping Engine for ANY coordinate in India
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      // Only snap if clicked roughly within India or subcontinent bounds
      if (lat >= 5 && lat <= 38 && lng >= 65 && lng <= 100) {
        const snapped = snapCoordinatesToNearestStation(lat, lng);
        onSnapGPS(snapped);
      }
    });

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layer when switching between dark, satellite, street
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (currentTileLayerRef.current) {
      map.removeLayer(currentTileLayerRef.current);
    }

    let newLayer: L.TileLayer;
    if (tileLayerType === 'satellite') {
      newLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          maxZoom: 18,
          attribution:
            'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP',
        }
      );
    } else if (tileLayerType === 'street') {
      newLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | WeatherGPT India',
      });
    } else {
      // Default: dark tactical without any API key watermark
      newLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        className: 'tactical-dark-tiles',
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | WeatherGPT India',
      });
    }

    newLayer.addTo(map);
    currentTileLayerRef.current = newLayer;
  }, [tileLayerType]);

  // Handle flying to a selected city
  useEffect(() => {
    if (flyToCity && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(
        [flyToCity.city.lat, flyToCity.city.lng],
        8,
        { duration: 1.2 }
      );
    }
  }, [flyToCity]);

  // Render snapped line if GPS snap is active
  useEffect(() => {
    if (!mapInstanceRef.current || !snapLineLayerRef.current) return;
    const group = snapLineLayerRef.current;
    group.clearLayers();

    if (nearestStationSnap) {
      const { targetCoords, nearestCity, distanceKm, bearingDeg } = nearestStationSnap;

      // Click target circle marker
      const targetMarker = L.circleMarker([targetCoords.lat, targetCoords.lng], {
        radius: 7,
        color: '#f43f5e',
        weight: 2,
        fillColor: '#f43f5e',
        fillOpacity: 0.8,
      });

      targetMarker.bindTooltip(
        `<div class="font-mono text-xs p-1"><strong>Query Coordinate</strong><br/>${targetCoords.lat.toFixed(4)}°N, ${targetCoords.lng.toFixed(4)}°E</div>`,
        { permanent: true, direction: 'bottom' }
      );
      group.addLayer(targetMarker);

      // Dashline connecting target to nearest station
      const snapLine = L.polyline(
        [
          [targetCoords.lat, targetCoords.lng],
          [nearestCity.city.lat, nearestCity.city.lng],
        ],
        {
          color: '#38bdf8',
          weight: 2.5,
          dashArray: '6, 6',
          opacity: 0.9,
        }
      );
      group.addLayer(snapLine);

      // Midpoint distance label
      const midLat = (targetCoords.lat + nearestCity.city.lat) / 2;
      const midLng = (targetCoords.lng + nearestCity.city.lng) / 2;

      const distanceBadge = L.marker([midLat, midLng], {
        icon: L.divIcon({
          className: 'snap-distance-label',
          html: `<div style="background: rgba(15,23,42,0.95); border: 1px solid #38bdf8; color: #38bdf8; font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; white-space: nowrap; box-shadow: 0 4px 12px rgba(0,0,0,0.8);">
            ${distanceKm} km • Bearing ${bearingDeg}°
          </div>`,
          iconAnchor: [40, 10],
        }),
      });
      group.addLayer(distanceBadge);
    }
  }, [nearestStationSnap]);

  // Render 3-Hour Disaster Hazard Radar Circles
  useEffect(() => {
    if (!mapInstanceRef.current || !radarCirclesLayerRef.current) return;
    const group = radarCirclesLayerRef.current;
    group.clearLayers();

    if (!showRadarZones || !radarAlerts) return;

    radarAlerts.forEach((alert) => {
      const isSevere = alert.riskLevel === 'SEVERE';
      const color = isSevere ? '#f43f5e' : '#f59e0b';
      const circle = L.circle([alert.cityData.city.lat, alert.cityData.city.lng], {
        radius: alert.radarRadiusKm * 1000,
        color: color,
        weight: isSevere ? 2 : 1.5,
        fillColor: color,
        fillOpacity: isSevere ? 0.16 : 0.1,
        dashArray: '5, 5',
      });

      circle.bindTooltip(
        `<div style="font-family: 'JetBrains Mono', monospace; font-size: 11px; background: rgba(9,14,26,0.95); color: #fff; padding: 6px 10px; border-radius: 6px; border: 1px solid ${color}; box-shadow: 0 4px 15px rgba(0,0,0,0.8);">
          <strong style="color: ${color};">${alert.riskLevel} HAZARD RADAR: ${alert.radarRadiusKm} KM BUFFER</strong><br/>
          <span>Hub: #${alert.cityData.city.id} ${alert.cityData.city.name}</span><br/>
          <span>Hazard: ${alert.hazardType}</span><br/>
          <span style="color: #38bdf8;">Lead Time: ${alert.leadTime}</span>
        </div>`,
        { sticky: true }
      );
      group.addLayer(circle);
    });
  }, [radarAlerts, showRadarZones]);

  // Render User Location Pin and Alert Intersection Vector
  useEffect(() => {
    if (!mapInstanceRef.current || !userLocationLayerRef.current) return;
    const group = userLocationLayerRef.current;
    group.clearLayers();

    if (!userLocation) return;

    // Glowing User Location Marker
    const userDivIcon = L.divIcon({
      className: 'weathergpt-user-pin',
      html: `
        <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 34px; height: 34px;">
          <div style="position: absolute; width: 34px; height: 34px; border-radius: 50%; background: rgba(56, 189, 248, 0.4); animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="width: 16px; height: 16px; border-radius: 50%; background: #0284c7; border: 2.5px solid #ffffff; box-shadow: 0 0 14px #38bdf8; display: flex; align-items: center; justify-content: center;">
            <div style="width: 4px; height: 4px; border-radius: 50%; background: #ffffff;"></div>
          </div>
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
    });

    const userMarker = L.marker([userLocation.lat, userLocation.lng], {
      icon: userDivIcon,
      zIndexOffset: 1000,
    });

    userMarker.bindTooltip(
      `<div style="font-family: 'JetBrains Mono', monospace; font-size: 11px; background: rgba(15,23,42,0.95); color: #38bdf8; border: 1px solid #0284c7; padding: 4px 8px; border-radius: 6px; font-weight: 700; box-shadow: 0 4px 15px rgba(0,0,0,0.8);">
        📍 YOUR MONITORED LOCATION<br/>
        <span style="font-size: 10px; color: #cbd5e1; font-weight: 400;">${userLocation.lat.toFixed(4)}°N, ${userLocation.lng.toFixed(4)}°E</span>
      </div>`,
      { permanent: false, direction: 'top' }
    );
    group.addLayer(userMarker);

    // If user is inside any active radar zone, draw red warning vector to epicenter
    if (radarAlerts) {
      const breached = radarAlerts.filter((a) => a.isUserInsideRadar);
      breached.forEach((alert) => {
        const warningLine = L.polyline(
          [
            [userLocation.lat, userLocation.lng],
            [alert.cityData.city.lat, alert.cityData.city.lng],
          ],
          {
            color: '#f43f5e',
            weight: 3,
            dashArray: '4, 4',
            opacity: 0.95,
          }
        );
        group.addLayer(warningLine);
      });
    }
  }, [userLocation, radarAlerts]);

  // Render Markers for selected points based on active label
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;
    const markersGroup = markersLayerRef.current;
    markersGroup.clearLayers();

    displayedCities.forEach((cityData) => {
      const isSelected = selectedCity?.city.id === cityData.city.id;
      const markerHtml = createCityMarkerHtml(cityData, activeModelTab, isSelected);

      const divIcon = L.divIcon({
        className: 'weathergpt-city-marker',
        html: markerHtml,
        iconSize: isSelected ? [38, 38] : [28, 28],
        iconAnchor: isSelected ? [19, 19] : [14, 14],
      });

      const marker = L.marker([cityData.city.lat, cityData.city.lng], { icon: divIcon });

      // Click to select
      marker.on('click', () => {
        onSelectCity(cityData);
      });

      // Hover Tooltip with instant 3-model readout
      const tooltipHtml = `
        <div style="font-family: 'JetBrains Mono', monospace; min-width: 190px; background: rgba(9, 14, 26, 0.96); border: 1px solid #1e293b; color: #f1f5f9; padding: 8px; border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,0.85);">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #1e293b; padding-bottom: 4px; margin-bottom: 6px;">
            <span style="font-weight: 700; font-size: 13px; color: #38bdf8;">#${cityData.city.id} ${cityData.city.name}</span>
            <span style="font-size: 9px; padding: 1px 4px; border-radius: 3px; background: #1e293b; color: #94a3b8;">${cityData.city.state}</span>
          </div>
          <div style="font-size: 10px; color: #94a3b8; margin-bottom: 4px;">${cityData.city.zone}</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 11px; margin-top: 4px;">
            <div style="background: rgba(15,23,42,0.8); padding: 3px 5px; border-radius: 4px;">
              <span style="font-size: 9px; color: #64748b; display: block;">1H NOWCAST</span>
              <span style="font-weight: 700; color: #38bdf8;">${cityData.weather.tempC}°C • ${cityData.weather.condition}</span>
            </div>
            <div style="background: rgba(15,23,42,0.8); padding: 3px 5px; border-radius: 4px;">
              <span style="font-size: 9px; color: #64748b; display: block;">3H HAZARD</span>
              <span style="font-weight: 700; color: ${
                cityData.disaster.riskLevel === 'SEVERE'
                  ? '#f43f5e'
                  : cityData.disaster.riskLevel === 'WARNING'
                  ? '#fbbf24'
                  : cityData.disaster.riskLevel === 'ADVISORY'
                  ? '#facc15'
                  : '#10b981'
              };">${cityData.disaster.riskLevel} (${cityData.disaster.riskScore}/100)</span>
            </div>
          </div>
          <div style="margin-top: 4px; font-size: 10px; color: #34d399; background: rgba(6,78,59,0.3); padding: 2px 5px; border-radius: 4px; border: 1px solid rgba(16,185,129,0.3);">
            🌾 <strong>${cityData.agro.cropName}</strong>: ${cityData.agro.suitabilityScore}% Suitability • Moisture: ${cityData.agro.soilStatus}
          </div>
        </div>
      `;

      marker.bindTooltip(tooltipHtml, {
        direction: 'top',
        offset: [0, -14],
        className: 'tactical-city-tooltip',
        opacity: 0.98,
      });

      markersGroup.addLayer(marker);
    });
  }, [displayedCities, activeModelTab, selectedCity]);

  const handleResetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([22.59, 79.50], 5, { duration: 1 });
    }
  };

  return (
    <div className="relative w-full h-full">
      {/* Map Element */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Grid Scanline Overlay */}
      <div className="absolute inset-0 pointer-events-none grid-overlay opacity-30 z-10" />

      {/* Top Left Floating Tile Controls */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 pointer-events-auto">
        <div className="glass-panel p-1.5 rounded-xl flex items-center gap-1 text-xs font-mono">
          <button
            onClick={() => setTileLayerType('dark')}
            className={`px-2 py-1 rounded-lg transition-colors ${
              tileLayerType === 'dark'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Dark Tactical
          </button>
          <button
            onClick={() => setTileLayerType('satellite')}
            className={`px-2 py-1 rounded-lg transition-colors ${
              tileLayerType === 'satellite'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Satellite
          </button>
          <button
            onClick={() => setTileLayerType('street')}
            className={`px-2 py-1 rounded-lg transition-colors ${
              tileLayerType === 'street'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Clean Street
          </button>
          <div className="w-px h-4 bg-slate-800 mx-0.5" />
          <button
            onClick={onToggleRadarZones}
            className={`px-2 py-1 rounded-lg transition-colors flex items-center gap-1.5 ${
              showRadarZones
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Toggle 3-Hour Disaster Risk Hazard Radar Impact Circles"
          >
            <Radio className={`w-3 h-3 ${showRadarZones ? 'animate-pulse text-rose-400' : ''}`} />
            <span>Hazard Radars</span>
          </button>
        </div>

        {/* Spatial Snapping Indicator Notice if active */}
        {nearestStationSnap && (
          <div className="glass-panel-heavy p-2.5 rounded-xl border border-cyan-700/60 max-w-sm flex items-start justify-between gap-2 text-xs font-mono">
            <div>
              <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
                <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                <span>PostGIS Snapped Station</span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1">
                Nearest Hub: <strong className="text-white">#{nearestStationSnap.nearestCity.city.id} {nearestStationSnap.nearestCity.city.name}</strong> ({nearestStationSnap.nearestCity.city.state})
              </p>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Distance: <span className="text-emerald-400 font-bold">{nearestStationSnap.distanceKm} km</span> • Bearing: {nearestStationSnap.bearingDeg}°
              </div>
            </div>
            <button
              onClick={() => onSnapGPS(null)}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
              title="Clear GPS Snap"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Top Right: 3 Model Point Filter Labels on Map Side & Reset Button */}
      <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2 pointer-events-auto max-w-[calc(100vw-2rem)]">
        <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
          {/* Three Model Point Filter Labels directly on Map Side */}
          <div className="glass-panel p-1 rounded-xl flex items-center gap-1 text-xs font-mono border border-slate-800 shadow-2xl bg-slate-950/90 backdrop-blur-md">
            <span className="text-[10px] text-slate-400 font-semibold px-2 hidden xl:inline flex items-center gap-1">
              <Layers className="w-3 h-3 text-cyan-400" />
              Points:
            </span>

            {/* Label 0: All Stations */}
            <button
              id="map-label-all"
              onClick={() => onSelectModelTab('all')}
              className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 font-medium ${
                activeModelTab === 'all'
                  ? 'bg-slate-800 text-cyan-300 border border-slate-600 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
              title="Show all 130 stations across India"
            >
              <span>All</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-850 text-slate-300 font-mono">
                {cities.length}
              </span>
            </button>

            {/* Label 1: 1-Hour Forecast */}
            <button
              id="map-label-weather"
              onClick={() => onSelectModelTab(activeModelTab === 'weather' ? 'all' : 'weather')}
              className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 font-medium ${
                activeModelTab === 'weather'
                  ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400 font-bold shadow-[0_0_12px_rgba(6,182,212,0.35)] ring-1 ring-cyan-400/50'
                  : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-900'
              }`}
              title="Click to show only 1-Hour Forecast weather points"
            >
              <CloudSun className="w-3.5 h-3.5 text-cyan-400" />
              <span>1h Forecast</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                activeModelTab === 'weather' ? 'bg-cyan-400 text-slate-950' : 'bg-slate-800 text-cyan-400'
              }`}>
                {weatherCities.length}
              </span>
            </button>

            {/* Label 2: 3h Disaster Early Warning (Disaster Only) */}
            <button
              id="map-label-disaster"
              onClick={() => onSelectModelTab(activeModelTab === 'disaster' ? 'all' : 'disaster')}
              className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 font-medium ${
                activeModelTab === 'disaster'
                  ? 'bg-rose-500/30 text-rose-200 border border-rose-400 font-bold shadow-[0_0_16px_rgba(244,63,94,0.45)] ring-1 ring-rose-400'
                  : 'text-slate-400 hover:text-rose-300 hover:bg-slate-900'
              }`}
              title="Click to show ONLY disaster & hazard alert points"
            >
              <ShieldAlert className={`w-3.5 h-3.5 text-rose-400 ${activeModelTab === 'disaster' ? 'animate-pulse' : ''}`} />
              <span>Disaster Only</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                activeModelTab === 'disaster' ? 'bg-rose-500 text-slate-950 animate-pulse' : 'bg-rose-950/80 text-rose-300'
              }`}>
                {disasterCities.length}
              </span>
            </button>

            {/* Label 3: Agro Crop Intelligence */}
            <button
              id="map-label-agro"
              onClick={() => onSelectModelTab(activeModelTab === 'agro' ? 'all' : 'agro')}
              className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 font-medium ${
                activeModelTab === 'agro'
                  ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-400 font-bold shadow-[0_0_12px_rgba(16,185,129,0.35)] ring-1 ring-emerald-400/50'
                  : 'text-slate-400 hover:text-emerald-300 hover:bg-slate-900'
              }`}
              title="Click to show only Agro Crop Intelligence points"
            >
              <Sprout className="w-3.5 h-3.5 text-emerald-400" />
              <span>Agro Intel</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                activeModelTab === 'agro' ? 'bg-emerald-400 text-slate-950' : 'bg-slate-800 text-emerald-400'
              }`}>
                {agroCities.length}
              </span>
            </button>
          </div>

          <button
            onClick={handleResetView}
            className="glass-panel p-2 rounded-xl text-slate-300 hover:text-cyan-400 transition-colors flex items-center gap-1.5 text-xs font-mono border border-slate-800"
            title="Reset View to India Center"
          >
            <Crosshair className="w-4 h-4" />
            <span className="hidden sm:inline">Reset India</span>
          </button>
        </div>

        {/* Active Filter Notice Pill */}
        {activeModelTab !== 'all' && (
          <div className="glass-panel-heavy px-3 py-1.5 rounded-xl border border-slate-700/80 flex items-center gap-2 text-xs font-mono shadow-2xl bg-slate-950/95 animate-fadeIn">
            {activeModelTab === 'disaster' && (
              <>
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span className="text-rose-300 font-bold">Disaster Points Only:</span>
                <span className="text-slate-300 text-[11px]">
                  Showing <strong className="text-white">{disasterCities.length}</strong> Hazard Hotspots ({cities.length - disasterCities.length} safe hubs hidden)
                </span>
                <button
                  onClick={() => onSelectModelTab('all')}
                  className="ml-1 text-[11px] underline text-cyan-400 hover:text-cyan-200"
                >
                  Show All (130)
                </button>
              </>
            )}
            {activeModelTab === 'weather' && (
              <>
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span className="text-cyan-300 font-bold">1h Forecast Points:</span>
                <span className="text-slate-300 text-[11px]">
                  Showing <strong className="text-white">{weatherCities.length}</strong> Active Weather Points ({cities.length - weatherCities.length} nominal hidden)
                </span>
                <button
                  onClick={() => onSelectModelTab('all')}
                  className="ml-1 text-[11px] underline text-cyan-400 hover:text-cyan-200"
                >
                  Show All (130)
                </button>
              </>
            )}
            {activeModelTab === 'agro' && (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-emerald-300 font-bold">Agro Intel Points:</span>
                <span className="text-slate-300 text-[11px]">
                  Showing <strong className="text-white">{agroCities.length}</strong> Agricultural Advisory Points ({cities.length - agroCities.length} hidden)
                </span>
                <button
                  onClick={() => onSelectModelTab('all')}
                  className="ml-1 text-[11px] underline text-cyan-400 hover:text-cyan-200"
                >
                  Show All (130)
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Bottom Center: Coordinates Readout & Click-to-snap hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
        <div className="glass-panel px-3.5 py-1.5 rounded-full flex items-center gap-3 text-xs font-mono text-slate-300 border border-slate-800 shadow-xl">
          <div className="flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">GPS:</span>
            <span className="text-cyan-300 font-medium">
              {cursorCoords ? `${cursorCoords.lat.toFixed(4)}°N, ${cursorCoords.lng.toFixed(4)}°E` : 'Click anywhere in India to snap station'}
            </span>
          </div>
          <div className="h-3 w-px bg-slate-700 hidden sm:block" />
          <div className="hidden sm:flex items-center gap-1.5 text-slate-400 text-[11px]">
            <span>ST_Distance Snapping Active</span>
          </div>
        </div>
      </div>

      {/* Bottom Left Legend for active model */}
      <div className="absolute bottom-4 left-4 z-20 pointer-events-auto hidden md:block">
        <div className="glass-panel p-2.5 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 space-y-1.5 max-w-xs">
          <div className="font-semibold text-white flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>
                {activeModelTab === 'disaster'
                  ? '3H Hazard Risk Level'
                  : activeModelTab === 'weather'
                  ? '1H Weather Conditions'
                  : activeModelTab === 'agro'
                  ? 'Agro Suitability Index'
                  : '130 Monitored Stations'}
              </span>
            </div>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-cyan-300">
              {displayedCities.length} / {cities.length}
            </span>
          </div>
          {activeModelTab === 'disaster' && (
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px]">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Low (Filtered)
              </span>
              <span className="flex items-center gap-1.5 text-yellow-400">
                <span className="w-2 h-2 rounded-full bg-yellow-400" /> Advisory
              </span>
              <span className="flex items-center gap-1.5 text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> Warning
              </span>
              <span className="flex items-center gap-1.5 text-rose-400">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" /> Severe Emergency
              </span>
            </div>
          )}
          {activeModelTab === 'weather' && (
            <div className="flex items-center gap-3 text-[10px] text-slate-400">
              <span>🌧️ Rain (&gt;2mm)</span>
              <span>⚡ Thunderstorm</span>
              <span>☀️ Clear</span>
              <span>🌫️ Smog</span>
            </div>
          )}
          {activeModelTab === 'agro' && (
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              <span className="text-emerald-400 font-bold">&gt;80% High</span>
              <span className="text-cyan-400 font-bold">60-80% Good</span>
              <span className="text-amber-400 font-bold">&lt;60% Stress</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper function to create interactive tactical marker HTML
function createCityMarkerHtml(
  data: CityModelOutput,
  activeModel: ActiveModelTab,
  isSelected: boolean
): string {
  const { city, weather, disaster, agro } = data;
  const isSevere = disaster.riskLevel === 'SEVERE';
  const isWarning = disaster.riskLevel === 'WARNING';
  const isAdvisory = disaster.riskLevel === 'ADVISORY';

  // Ring styling
  let pulseRing = '';
  if (isSevere) {
    pulseRing = `<div style="position: absolute; inset: -8px; border: 2px solid #f43f5e; border-radius: 50%; animation: pulse-ring 1.8s cubic-bezier(0,0,0.2,1) infinite;"></div>`;
  } else if (isWarning) {
    pulseRing = `<div style="position: absolute; inset: -6px; border: 1.5px solid #fbbf24; border-radius: 50%; animation: pulse-ring 2.4s infinite;"></div>`;
  }

  const selectedBorder = isSelected
    ? `box-shadow: 0 0 0 3px #38bdf8, 0 0 16px #38bdf8;`
    : `box-shadow: 0 4px 12px rgba(0,0,0,0.8);`;

  if (activeModel === 'disaster') {
    let color = '#10b981'; // Green
    let icon = '🛡️';
    if (isSevere) {
      color = '#f43f5e';
      icon = '🚨';
    } else if (isWarning) {
      color = '#fbbf24';
      icon = '⚠️';
    } else if (isAdvisory) {
      color = '#facc15';
      icon = '⚡';
    }
    return `
      <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
        ${pulseRing}
        <div style="min-width: 28px; height: 26px; padding: 0 4px; background: #090e1a; border: 2px solid ${color}; border-radius: 13px; display: flex; align-items: center; justify-content: center; gap: 2px; color: ${color}; font-size: 10px; font-weight: 800; font-family: 'JetBrains Mono', monospace; ${selectedBorder}">
          <span style="font-size: 10px;">${icon}</span>
          <span>${disaster.riskScore}</span>
        </div>
      </div>
    `;
  }

  if (activeModel === 'weather') {
    const isHot = weather.tempC > 38;
    const isCold = weather.tempC < 15;
    const isRaining = weather.precipitationMm > 2 || weather.condition.toLowerCase().includes('rain');
    const isThunder = weather.condition.toLowerCase().includes('thunder') || weather.condition.toLowerCase().includes('storm');
    const bgBadge = isThunder ? '#7c3aed' : isRaining ? '#0284c7' : isHot ? '#b91c1c' : isCold ? '#4338ca' : '#047857';
    const condIcon = isThunder ? '⚡' : isRaining ? '🌧️' : isHot ? '☀️' : isCold ? '❄️' : '⛅';

    return `
      <div style="position: relative; width: 44px; height: 24px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
        <div style="background: ${bgBadge}; color: #ffffff; border: 1.5px solid #ffffff; border-radius: 12px; font-size: 9.5px; font-weight: 700; font-family: 'JetBrains Mono', monospace; padding: 1.5px 6px; white-space: nowrap; display: flex; align-items: center; gap: 2px; ${selectedBorder}">
          <span style="font-size: 9px;">${condIcon}</span>
          <span>${Math.round(weather.tempC)}°</span>
        </div>
      </div>
    `;
  }

  if (activeModel === 'agro') {
    const isHigh = agro.suitabilityScore >= 75;
    const color = isHigh ? '#10b981' : agro.suitabilityScore >= 60 ? '#06b6d4' : '#f59e0b';
    const cropEmoji = agro.crop === 'rice' ? '🌾' : agro.crop === 'wheat' ? '🌾' : agro.crop === 'cotton' ? '🌱' : agro.crop === 'maize' ? '🌽' : '🌱';
    return `
      <div style="position: relative; width: 38px; height: 26px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
        <div style="min-width: 32px; height: 22px; padding: 0 4px; background: #091e13; border: 1.5px solid ${color}; border-radius: 11px; display: flex; align-items: center; justify-content: center; gap: 2px; color: ${color}; font-size: 9px; font-weight: 800; font-family: 'JetBrains Mono', monospace; ${selectedBorder}">
          <span style="font-size: 9px;">${cropEmoji}</span>
          <span>${agro.suitabilityScore}%</span>
        </div>
      </div>
    `;
  }

  // Default 'all' Tri-Model overview
  let dotColor = '#38bdf8';
  if (isSevere) dotColor = '#f43f5e';
  else if (isWarning) dotColor = '#fbbf24';

  return `
    <div style="position: relative; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
      ${pulseRing}
      <div style="width: 18px; height: 18px; background: #090e1a; border: 2px solid ${dotColor}; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #f8fafc; font-size: 8px; font-weight: 800; font-family: 'JetBrains Mono', monospace; ${selectedBorder}">
        ${city.id}
      </div>
    </div>
  `;
}
