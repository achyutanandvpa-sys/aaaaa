/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ActiveModelTab,
  ActiveViewStyle,
  CityModelOutput,
  NearestStationResult,
  SupportedCrop,
} from './types.ts';
import {
  CITIES_130_MASTER,
  generateModelOutputsForCity,
} from './data/citiesData.ts';
import {
  AlertNotificationSettings,
  UserLocation,
  evaluateUserHazardRadar,
  playEmergencyAlertSound,
  sendDeviceNotification,
  triggerDeviceVibration,
} from './services/alertSystem.ts';
import { Navbar } from './components/Navbar.tsx';
import { IndiaMap } from './components/IndiaMap.tsx';
import { Globe3D } from './components/Globe3D.tsx';
import { MobileAppView } from './components/MobileAppView.tsx';
import { CityMatrixView } from './components/CityMatrixView.tsx';
import { CityDetailModal } from './components/CityDetailModal.tsx';
import { GPSSnapperModal } from './components/GPSSnapperModal.tsx';
import { AIAnalystModal } from './components/AIAnalystModal.tsx';
import { SearchModal } from './components/SearchModal.tsx';
import { RadarAlertBanner } from './components/RadarAlertBanner.tsx';
import { RadarAlertModal } from './components/RadarAlertModal.tsx';

export default function App() {
  // Initialize all 130 city model predictions
  const [citiesData, setCitiesData] = useState<CityModelOutput[]>(() => {
    return CITIES_130_MASTER.map((city) => generateModelOutputsForCity(city));
  });

  const [activeModelTab, setActiveModelTab] = useState<ActiveModelTab>('all');
  const [activeViewStyle, setActiveViewStyle] = useState<ActiveViewStyle>('map');
  const [selectedRegion, setSelectedRegion] = useState<string>('All Regions');

  // Selected city for deep inspection
  const [selectedCity, setSelectedCity] = useState<CityModelOutput | null>(() => {
    return citiesData.find((c) => c.city.id === 10) || citiesData[0] || null;
  });

  // Target city for flying map camera
  const [flyToCity, setFlyToCity] = useState<CityModelOutput | null>(null);

  // PostGIS spatial snap result
  const [nearestStationSnap, setNearestStationSnap] = useState<NearestStationResult | null>(null);

  // User Geofence Location state
  const [userLocation, setUserLocation] = useState<UserLocation>(() => ({
    lat: 28.6139,
    lng: 77.2090,
    label: 'Delhi / NCR National Capital Region',
    source: 'preset',
    timestamp: new Date().toISOString(),
  }));

  // Device Alert Notification Settings
  const [alertSettings, setAlertSettings] = useState<AlertNotificationSettings>(() => ({
    soundEnabled: true,
    vibrationEnabled: true,
    webNotificationsEnabled: true,
    minSeverityThreshold: 'WARNING',
    autoMonitorGPS: true,
  }));

  // Toggle for map hazard radar circles
  const [showRadarZones, setShowRadarZones] = useState<boolean>(true);

  // Modals & Banners visibility
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [isGPSSnapperOpen, setIsGPSSnapperOpen] = useState<boolean>(false);
  const [isAIAnalystOpen, setIsAIAnalystOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isRadarAlertModalOpen, setIsRadarAlertModalOpen] = useState<boolean>(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const lastDispatchedAlertRef = useRef<string | null>(null);

  // Evaluate user geofence against all 130 city 3-hour disaster predictions
  const radarEvaluation = useMemo(() => {
    return evaluateUserHazardRadar(userLocation.lat, userLocation.lng, citiesData);
  }, [userLocation.lat, userLocation.lng, citiesData]);

  // Handle Automatic Device Notification Trigger when user enters hazard radar
  useEffect(() => {
    const activeAlert = radarEvaluation.highestSeverityAlert;
    if (!activeAlert) return;

    const alertKey = `${activeAlert.cityData.city.id}-${activeAlert.hazardType}-${activeAlert.isUserInsideRadar}`;

    // Only dispatch if not already dispatched for this event
    if (lastDispatchedAlertRef.current === alertKey) return;

    // Check threshold condition
    const meetsThreshold =
      activeAlert.isUserInsideRadar ||
      activeAlert.riskLevel === 'SEVERE' ||
      (activeAlert.riskLevel === 'WARNING' && alertSettings.minSeverityThreshold !== 'SEVERE');

    if (meetsThreshold) {
      lastDispatchedAlertRef.current = alertKey;
      setIsBannerDismissed((prev) => (prev ? false : prev));

      // 1. Device Push Notification
      if (alertSettings.webNotificationsEnabled) {
        const title = activeAlert.isUserInsideRadar
          ? `🚨 URGENT: YOU ARE INSIDE ${activeAlert.hazardType.toUpperCase()} RADAR!`
          : `⚠️ 3-HOUR HAZARD RADAR ALERT: ${activeAlert.hazardType}`;

        const body = activeAlert.isUserInsideRadar
          ? `Predicted impact at #${activeAlert.cityData.city.id} ${activeAlert.cityData.city.name}. Distance: ${activeAlert.distanceFromUserKm.toFixed(1)} km. Lead time: ${activeAlert.leadTime}. ${activeAlert.ndmaProtocol}.`
          : `Station #${activeAlert.cityData.city.id} ${activeAlert.cityData.city.name} is under ${activeAlert.riskLevel} alert (${activeAlert.distanceFromUserKm.toFixed(1)} km away).`;

        sendDeviceNotification(title, body, {
          tag: `hazard-radar-${activeAlert.cityData.city.id}`,
          requireInteraction: activeAlert.isUserInsideRadar,
        });
      }

      // 2. Dual-Tone Emergency Siren Sound
      if (alertSettings.soundEnabled && activeAlert.isUserInsideRadar) {
        playEmergencyAlertSound();
      }

      // 3. Physical Device Vibration
      if (alertSettings.vibrationEnabled && activeAlert.isUserInsideRadar) {
        triggerDeviceVibration();
      }
    }
  }, [radarEvaluation, alertSettings]);

  // Keyboard shortcut listener (Cmd+K / Ctrl+K for search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsDetailModalOpen(false);
        setIsGPSSnapperOpen(false);
        setIsAIAnalystOpen(false);
        setIsRadarAlertModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter cities by Region
  const filteredCities = useMemo(() => {
    if (selectedRegion === 'All Regions') return citiesData;
    return citiesData.filter((c) => c.city.region === selectedRegion);
  }, [citiesData, selectedRegion]);

  // Total active disaster warnings count
  const activeWarningsCount = useMemo(() => {
    return citiesData.filter(
      (c) => c.disaster.riskLevel === 'WARNING' || c.disaster.riskLevel === 'SEVERE'
    ).length;
  }, [citiesData]);

  // Refresh model telemetry (simulates real-time update)
  const handleRefreshData = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setCitiesData((prev) =>
        prev.map((item) => generateModelOutputsForCity(item.city, item.agro.crop))
      );
      setIsRefreshing(false);
    }, 450);
  };

  // Crop change handler for selected city
  const handleCropChange = (crop: SupportedCrop) => {
    if (!selectedCity) return;
    const updated = generateModelOutputsForCity(selectedCity.city, crop);
    setSelectedCity(updated);
    setCitiesData((prev) =>
      prev.map((c) => (c.city.id === updated.city.id ? updated : c))
    );
  };

  // Click on a city: set selected city and open details modal
  const handleSelectCity = (city: CityModelOutput) => {
    setSelectedCity(city);
    setIsDetailModalOpen(true);
  };

  // Fly to city on tactical map
  const handleFlyToCity = (city: CityModelOutput) => {
    setSelectedCity(city);
    setFlyToCity(city);
    setActiveViewStyle('map');
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#07090e] text-slate-100 overflow-hidden font-mono">
      {/* Top Header Navigation */}
      <Navbar
        activeModelTab={activeModelTab}
        onSelectModelTab={setActiveModelTab}
        activeViewStyle={activeViewStyle}
        onSelectViewStyle={setActiveViewStyle}
        selectedCity={selectedCity}
        onOpenGPSSnapper={() => setIsGPSSnapperOpen(true)}
        onOpenAIAnalyst={() => setIsAIAnalystOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        totalCitiesCount={CITIES_130_MASTER.length}
        activeWarningsCount={activeWarningsCount}
        onRefreshData={handleRefreshData}
        isRefreshing={isRefreshing}
        selectedRegion={selectedRegion}
        onSelectRegion={setSelectedRegion}
        onOpenRadarAlerts={() => setIsRadarAlertModalOpen(true)}
        isUserInsideRadar={radarEvaluation.insideRadarCount > 0}
        activeRadarAlertsCount={radarEvaluation.radarAlerts.length}
      />

      {/* Emergency Hazard Radar Alert Banner */}
      {!isBannerDismissed && radarEvaluation.highestSeverityAlert && (
        <RadarAlertBanner
          alert={radarEvaluation.highestSeverityAlert}
          onOpenDetails={() => setIsRadarAlertModalOpen(true)}
          onDismiss={() => setIsBannerDismissed(true)}
          soundEnabled={alertSettings.soundEnabled}
          onToggleSound={() =>
            setAlertSettings((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }))
          }
        />
      )}

      {/* Main Viewport Container */}
      <main className="relative flex-1 w-full h-full overflow-hidden">
        {/* VIEW 1: Interactive Tactical Map with Hazard Radar Circles & User Pin */}
        {activeViewStyle === 'map' && (
          <IndiaMap
            cities={filteredCities}
            activeModelTab={activeModelTab}
            selectedCity={selectedCity}
            onSelectCity={handleSelectCity}
            flyToCity={flyToCity}
            nearestStationSnap={nearestStationSnap}
            onSnapGPS={setNearestStationSnap}
            userLocation={userLocation}
            radarAlerts={radarEvaluation.radarAlerts}
            showRadarZones={showRadarZones}
            onToggleRadarZones={() => setShowRadarZones((prev) => !prev)}
          />
        )}

        {/* VIEW 2: 3D Globe Web Dashboard */}
        {activeViewStyle === 'globe' && (
          <Globe3D
            cities={filteredCities}
            selectedCity={selectedCity}
            onSelectCity={handleSelectCity}
          />
        )}

        {/* VIEW 3: Mobile App View Simulator */}
        {activeViewStyle === 'mobile-app' && selectedCity && (
          <MobileAppView
            cities={citiesData}
            currentCity={selectedCity}
            onSelectCity={(city) => setSelectedCity(city)}
            onSelectCrop={handleCropChange}
            onOpenAIAnalyst={() => setIsAIAnalystOpen(true)}
          />
        )}

        {/* VIEW 4: 130 Cities Master Matrix */}
        {activeViewStyle === 'matrix' && (
          <CityMatrixView
            cities={citiesData}
            onSelectCity={handleSelectCity}
            onFlyToCityOnMap={handleFlyToCity}
          />
        )}
      </main>

      {/* Modals */}
      {isDetailModalOpen && selectedCity && (
        <CityDetailModal
          cityData={selectedCity}
          onClose={() => setIsDetailModalOpen(false)}
          onCropChange={handleCropChange}
          onOpenAIWithCity={() => {
            setIsDetailModalOpen(false);
            setIsAIAnalystOpen(true);
          }}
        />
      )}

      {isRadarAlertModalOpen && (
        <RadarAlertModal
          onClose={() => setIsRadarAlertModalOpen(false)}
          alerts={radarEvaluation.radarAlerts}
          userLocation={userLocation}
          onUpdateUserLocation={(loc) => {
            setUserLocation(loc);
            setIsBannerDismissed(false);
          }}
          settings={alertSettings}
          onUpdateSettings={setAlertSettings}
          onFlyToAlert={(alert) => {
            setSelectedCity(alert.cityData);
            setFlyToCity(alert.cityData);
            setActiveViewStyle('map');
          }}
        />
      )}

      {isGPSSnapperOpen && (
        <GPSSnapperModal
          onClose={() => setIsGPSSnapperOpen(false)}
          onApplySnap={(res) => {
            setNearestStationSnap(res);
            setSelectedCity(res.nearestCity);
            setFlyToCity(res.nearestCity);
            setActiveViewStyle('map');
          }}
          onSelectCity={(city) => {
            setSelectedCity(city);
            setIsDetailModalOpen(true);
          }}
        />
      )}

      {isAIAnalystOpen && (
        <AIAnalystModal
          onClose={() => setIsAIAnalystOpen(false)}
          initialCity={selectedCity}
          allCities={citiesData}
        />
      )}

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        cities={citiesData}
        onSelectCity={(c) => {
          setSelectedCity(c);
          setFlyToCity(c);
          setIsDetailModalOpen(true);
        }}
      />
    </div>
  );
}
