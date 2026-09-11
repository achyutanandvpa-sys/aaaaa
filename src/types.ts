export type RegionName =
  | 'Northern Region'
  | 'Western Region'
  | 'Southern Region'
  | 'Central & Eastern Region'
  | 'North-Eastern States & Island Territories';

export type DisasterRiskLevel = 'LOW' | 'ADVISORY' | 'WARNING' | 'SEVERE';

export interface CityInfo {
  id: number;
  name: string;
  state: string;
  lat: number;
  lng: number;
  zone: string;
  region: RegionName;
}

export interface WeatherForecast {
  tempC: number;
  feelsLikeC: number;
  condition: string;
  conditionIcon: string;
  humidity: number;
  windSpeedKmh: number;
  windDirection: string;
  windHeadingDeg: number;
  precipitationMm: number;
  precipProb: number;
  cloudCover: number;
  pressureHpa: number;
  uvIndex: number;
  visibilityKm: number;
  aqi: number;
  aqiStatus: 'Good' | 'Moderate' | 'Poor' | 'Very Poor' | 'Severe';
  forecastNext1h: string;
  hourly: Array<{ time: string; tempC: number; rainProb: number; cond: string }>;
}

export interface DisasterRisk {
  riskScore: number; // 0 to 100
  riskLevel: DisasterRiskLevel;
  primaryHazard: string;
  secondaryHazard?: string;
  leadTime: string;
  advisory: string;
  probability: number;
  impactRadiusKm: number;
  safetyChecklist: string[];
  modelConfidence: number;
  activeNDMAProtocol: string;
}

export type SupportedCrop =
  | 'rice'
  | 'wheat'
  | 'cotton'
  | 'maize'
  | 'sugarcane'
  | 'mustard'
  | 'pulses'
  | 'soybean'
  | 'millets'
  | 'groundnut';

export interface AgroIntelligence {
  crop: SupportedCrop;
  cropName: string;
  suitabilityScore: number; // 0 to 100%
  soilMoisturePct: number;
  soilStatus: 'Deficit' | 'Optimal' | 'Saturated' | 'Waterlogged';
  irrigationAdvisory: string;
  pestRisk: 'Low' | 'Moderate' | 'High' | 'Critical';
  pestDetails: string;
  sowingHarvestWindow: string;
  gddAccumulated: number;
  fertilizerTip: string;
  recommendedCrops: string[];
}

export interface CityModelOutput {
  city: CityInfo;
  weather: WeatherForecast;
  disaster: DisasterRisk;
  agro: AgroIntelligence;
  lastUpdated: string;
  modelVersions: {
    weather1h: string;
    disaster3h: string;
    agroCrop: string;
  };
}

export interface NearestStationResult {
  targetCoords: { lat: number; lng: number };
  nearestCity: CityModelOutput;
  distanceKm: number;
  bearingDeg: number;
  snappedStationId: number;
}

export type ActiveModelTab = 'all' | 'weather' | 'disaster' | 'agro';
export type ActiveViewStyle = 'map' | 'globe' | 'mobile-app' | 'matrix';
