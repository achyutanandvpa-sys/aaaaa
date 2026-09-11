import { CityModelOutput, DisasterRisk } from '../types.ts';
import { calculateHaversineDistanceKm, calculateBearingDeg } from '../data/citiesData.ts';

export interface UserLocation {
  lat: number;
  lng: number;
  label?: string;
  source: 'gps' | 'preset' | 'manual';
  timestamp: string;
}

export interface RadarAlert {
  id: string;
  cityData: CityModelOutput;
  hazardType: string;
  riskLevel: 'LOW' | 'ADVISORY' | 'WARNING' | 'SEVERE';
  riskScore: number;
  radarRadiusKm: number;
  distanceFromUserKm: number;
  bearingDeg: number;
  isUserInsideRadar: boolean;
  leadTime: string;
  ndmaProtocol: string;
  timestamp: string;
}

export interface AlertNotificationSettings {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  webNotificationsEnabled: boolean;
  minSeverityThreshold: 'ADVISORY' | 'WARNING' | 'SEVERE';
  autoMonitorGPS: boolean;
}

// Compute hazard radar impact radius based on severity & hazard type
export function calculateRadarRadiusKm(disaster: DisasterRisk): number {
  const isSevere = disaster.riskLevel === 'SEVERE';
  const isWarning = disaster.riskLevel === 'WARNING';
  const hazard = disaster.primaryHazard.toLowerCase();

  // Tropical Cyclone or Heatwave impacts wider radius
  if (hazard.includes('cyclone') || hazard.includes('depression')) {
    return isSevere ? 130 : isWarning ? 90 : 50;
  }
  if (hazard.includes('heatwave') || hazard.includes('smog') || hazard.includes('dust')) {
    return isSevere ? 85 : isWarning ? 60 : 35;
  }
  if (hazard.includes('flood') || hazard.includes('waterlogging')) {
    return isSevere ? 65 : isWarning ? 45 : 25;
  }
  if (hazard.includes('landslide') || hazard.includes('lightning')) {
    return isSevere ? 40 : isWarning ? 25 : 15;
  }
  return isSevere ? 60 : isWarning ? 40 : 20;
}

// Evaluate user location against all 130 city 3-hour disaster prediction radars
export function evaluateUserHazardRadar(
  userLat: number,
  userLng: number,
  cities: CityModelOutput[]
): {
  insideRadarCount: number;
  radarAlerts: RadarAlert[];
  highestSeverityAlert: RadarAlert | null;
  nearestAlert: RadarAlert | null;
} {
  const alerts: RadarAlert[] = [];

  cities.forEach((c) => {
    // Only cities with active warning or severe risk (or advisory if score >= 45)
    if (
      c.disaster.riskLevel === 'SEVERE' ||
      c.disaster.riskLevel === 'WARNING' ||
      (c.disaster.riskLevel === 'ADVISORY' && c.disaster.riskScore >= 45)
    ) {
      const dist = calculateHaversineDistanceKm(userLat, userLng, c.city.lat, c.city.lng);
      const bearing = calculateBearingDeg(userLat, userLng, c.city.lat, c.city.lng);
      const radarRadius = calculateRadarRadiusKm(c.disaster);
      const isInside = dist <= radarRadius;

      alerts.push({
        id: `alert-${c.city.id}-${Date.now()}`,
        cityData: c,
        hazardType: c.disaster.primaryHazard,
        riskLevel: c.disaster.riskLevel,
        riskScore: c.disaster.riskScore,
        radarRadiusKm: radarRadius,
        distanceFromUserKm: dist,
        bearingDeg: bearing,
        isUserInsideRadar: isInside,
        leadTime: c.disaster.leadTime,
        ndmaProtocol: c.disaster.activeNDMAProtocol,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Sort alerts by distance from user
  alerts.sort((a, b) => a.distanceFromUserKm - b.distanceFromUserKm);

  const insideAlerts = alerts.filter((a) => a.isUserInsideRadar);

  // Find highest severity alert (SEVERE > WARNING > ADVISORY)
  let highest: RadarAlert | null = null;
  const severeAlert = alerts.find((a) => a.riskLevel === 'SEVERE' && a.isUserInsideRadar) || alerts.find((a) => a.riskLevel === 'SEVERE');
  const warningAlert = alerts.find((a) => a.riskLevel === 'WARNING' && a.isUserInsideRadar) || alerts.find((a) => a.riskLevel === 'WARNING');
  highest = severeAlert || warningAlert || alerts[0] || null;

  return {
    insideRadarCount: insideAlerts.length,
    radarAlerts: alerts,
    highestSeverityAlert: insideAlerts.length > 0 ? insideAlerts[0] : highest,
    nearestAlert: alerts[0] || null,
  };
}

// Synthesize Emergency EAS Audio Tone using Web Audio API
let audioCtx: AudioContext | null = null;

export function playEmergencyAlertSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;

    // Dual-tone EAS emergency frequency (853 Hz and 960 Hz)
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(853, now); // 853Hz standard Emergency Alert frequency
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(960, now); // 960Hz standard Emergency Alert frequency

    // Pulsing siren volume envelope
    gainNode.gain.setValueAtTime(0.01, now);
    gainNode.gain.linearRampToValueAtTime(0.25, now + 0.1);
    gainNode.gain.setValueAtTime(0.25, now + 0.3);
    gainNode.gain.linearRampToValueAtTime(0.01, now + 0.4);
    gainNode.gain.setValueAtTime(0.01, now + 0.5);
    gainNode.gain.linearRampToValueAtTime(0.25, now + 0.6);
    gainNode.gain.setValueAtTime(0.25, now + 0.8);
    gainNode.gain.linearRampToValueAtTime(0.001, now + 1.1);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 1.2);
    osc2.stop(now + 1.2);
  } catch (err) {
    console.warn('Audio tone synthesis error:', err);
  }
}

// Physical device vibration if supported by mobile/browser
export function triggerDeviceVibration() {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([300, 150, 300, 150, 450]);
    } catch {
      // Ignore vibration errors
    }
  }
}

// Device Notification Dispatcher (Web Notification API with permission handling)
export async function sendDeviceNotification(
  title: string,
  body: string,
  options?: { tag?: string; requireInteraction?: boolean }
): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  try {
    let perm = Notification.permission;
    if (perm === 'default') {
      perm = await Notification.requestPermission();
    }
    if (perm === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag: options?.tag || 'weathergpt-radar-alert',
        requireInteraction: options?.requireInteraction ?? true,
      });
      return true;
    }
  } catch (err) {
    console.warn('Web notification dispatch failed:', err);
  }
  return false;
}
