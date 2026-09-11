import React, { useEffect, useRef, useState } from 'react';
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
} from 'lucide-react';

interface IndiaMapProps {
  cities: CityModelOutput[];
  activeModelTab: ActiveModelTab;
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

  // Render Markers for all 130 cities
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;
    const markersGroup = markersLayerRef.current;
    markersGroup.clearLayers();

    cities.forEach((cityData) => {
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
  }, [cities, activeModelTab, selectedCity]);

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

      {/* Top Right Quick Actions & Coordinates */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2 pointer-events-auto">
        <button
          onClick={handleResetView}
          className="glass-panel p-2 rounded-xl text-slate-300 hover:text-cyan-400 transition-colors flex items-center gap-1.5 text-xs font-mono"
          title="Reset View to India Center"
        >
          <Crosshair className="w-4 h-4" />
          <span className="hidden sm:inline">Reset India</span>
        </button>
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
          <div className="font-semibold text-white flex items-center gap-1.5">
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
          {activeModelTab === 'disaster' && (
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px]">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Low / Nominal
              </span>
              <span className="flex items-center gap-1.5 text-yellow-400">
                <span className="w-2 h-2 rounded-full bg-yellow-400" /> Advisory Level
              </span>
              <span className="flex items-center gap-1.5 text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> Warning Alert
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
    if (isSevere) color = '#f43f5e'; // Red
    else if (isWarning) color = '#fbbf24'; // Orange
    else if (isAdvisory) color = '#facc15'; // Yellow
    return `
      <div style="position: relative; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
        ${pulseRing}
        <div style="width: 24px; height: 24px; background: #0b0f19; border: 2px solid ${color}; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: ${color}; font-size: 10px; font-weight: 800; font-family: 'JetBrains Mono', monospace; ${selectedBorder}">
          ${disaster.riskScore}
        </div>
      </div>
    `;
  }

  if (activeModel === 'weather') {
    const isHot = weather.tempC > 38;
    const isCold = weather.tempC < 15;
    const isRaining = weather.precipitationMm > 2;
    const bgBadge = isRaining ? '#0284c7' : isHot ? '#b91c1c' : isCold ? '#4338ca' : '#047857';

    return `
      <div style="position: relative; width: 34px; height: 22px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
        <div style="background: ${bgBadge}; color: #ffffff; border: 1.5px solid #ffffff; border-radius: 12px; font-size: 9.5px; font-weight: 700; font-family: 'JetBrains Mono', monospace; padding: 1px 5px; white-space: nowrap; ${selectedBorder}">
          ${Math.round(weather.tempC)}°
        </div>
      </div>
    `;
  }

  if (activeModel === 'agro') {
    const isHigh = agro.suitabilityScore >= 75;
    const color = isHigh ? '#10b981' : agro.suitabilityScore >= 60 ? '#06b6d4' : '#f59e0b';
    return `
      <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
        <div style="width: 22px; height: 22px; background: #091e13; border: 2px solid ${color}; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: ${color}; font-size: 9px; font-weight: 800; font-family: 'JetBrains Mono', monospace; ${selectedBorder}">
          🌱
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
