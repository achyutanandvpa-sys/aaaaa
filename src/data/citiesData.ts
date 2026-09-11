import { CityInfo, CityModelOutput, SupportedCrop, NearestStationResult } from '../types.ts';

export const CITIES_130_MASTER: CityInfo[] = [
  // 1. Western Region (Maharashtra, Gujarat, Goa)
  { id: 1, name: 'Mumbai', state: 'Maharashtra', lat: 19.08, lng: 72.88, zone: 'Coastal Metropolitan', region: 'Western Region' },
  { id: 2, name: 'Pune', state: 'Maharashtra', lat: 18.52, lng: 73.86, zone: 'Plateau Urban', region: 'Western Region' },
  { id: 3, name: 'Nagpur', state: 'Maharashtra', lat: 21.15, lng: 79.09, zone: 'Central Inland', region: 'Western Region' },
  { id: 4, name: 'Nashik', state: 'Maharashtra', lat: 20.00, lng: 73.79, zone: 'Agricultural Hub', region: 'Western Region' },
  { id: 5, name: 'Aurangabad', state: 'Maharashtra', lat: 19.88, lng: 75.34, zone: 'Semi-Arid Inland', region: 'Western Region' },
  { id: 6, name: 'Kolhapur', state: 'Maharashtra', lat: 16.71, lng: 74.24, zone: 'Southern Plateau', region: 'Western Region' },
  { id: 7, name: 'Solapur', state: 'Maharashtra', lat: 17.66, lng: 75.91, zone: 'Semi-Arid Plateau', region: 'Western Region' },
  { id: 8, name: 'Amravati', state: 'Maharashtra', lat: 20.94, lng: 77.78, zone: 'Cotton Belt Inland', region: 'Western Region' },
  { id: 9, name: 'Nanded', state: 'Maharashtra', lat: 19.14, lng: 77.32, zone: 'Marathwada Inland', region: 'Western Region' },

  // Northern Region - Delhi NCR
  { id: 10, name: 'Delhi', state: 'Delhi NCT', lat: 28.61, lng: 77.21, zone: 'Northern Capital Metro', region: 'Northern Region' },
  { id: 11, name: 'Noida', state: 'Uttar Pradesh', lat: 28.54, lng: 77.39, zone: 'NCR Urban', region: 'Northern Region' },
  { id: 12, name: 'Ghaziabad', state: 'Uttar Pradesh', lat: 28.67, lng: 77.45, zone: 'NCR Urban', region: 'Northern Region' },
  { id: 13, name: 'Faridabad', state: 'Haryana', lat: 28.41, lng: 77.32, zone: 'NCR Industrial', region: 'Northern Region' },
  { id: 14, name: 'Gurugram', state: 'Haryana', lat: 28.46, lng: 77.03, zone: 'NCR Urban', region: 'Northern Region' },

  // Southern Region - Karnataka
  { id: 15, name: 'Bengaluru', state: 'Karnataka', lat: 12.97, lng: 77.59, zone: 'Southern Tech Hub', region: 'Southern Region' },
  { id: 16, name: 'Mysuru', state: 'Karnataka', lat: 12.30, lng: 76.64, zone: 'Southern Plateau', region: 'Southern Region' },
  { id: 17, name: 'Mangaluru', state: 'Karnataka', lat: 12.91, lng: 74.86, zone: 'Arabian Sea Coast', region: 'Southern Region' },
  { id: 18, name: 'Hubli', state: 'Karnataka', lat: 15.36, lng: 75.12, zone: 'Northern Karnataka', region: 'Southern Region' },
  { id: 19, name: 'Belagavi', state: 'Karnataka', lat: 15.85, lng: 74.50, zone: 'Western Ghats Foothills', region: 'Southern Region' },
  { id: 20, name: 'Bellary', state: 'Karnataka', lat: 15.14, lng: 76.92, zone: 'Eastern Dry Zone', region: 'Southern Region' },

  // Southern Region - Tamil Nadu & Puducherry
  { id: 21, name: 'Chennai', state: 'Tamil Nadu', lat: 13.08, lng: 80.27, zone: 'Bay of Bengal Coast', region: 'Southern Region' },
  { id: 22, name: 'Coimbatore', state: 'Tamil Nadu', lat: 11.02, lng: 76.96, zone: 'Rain Shadow Basin', region: 'Southern Region' },
  { id: 23, name: 'Madurai', state: 'Tamil Nadu', lat: 9.93, lng: 78.12, zone: 'Southern Plains', region: 'Southern Region' },
  { id: 24, name: 'Tiruchirappalli', state: 'Tamil Nadu', lat: 10.79, lng: 78.70, zone: 'Cauvery Delta', region: 'Southern Region' },
  { id: 25, name: 'Salem', state: 'Tamil Nadu', lat: 11.66, lng: 78.15, zone: 'Inland Basin', region: 'Southern Region' },
  { id: 26, name: 'Tirunelveli', state: 'Tamil Nadu', lat: 8.71, lng: 77.76, zone: 'Coastal South', region: 'Southern Region' },
  { id: 27, name: 'Erode', state: 'Tamil Nadu', lat: 11.34, lng: 77.72, zone: 'Agricultural Basin', region: 'Southern Region' },
  { id: 28, name: 'Vellore', state: 'Tamil Nadu', lat: 12.92, lng: 79.13, zone: 'Northern Plains', region: 'Southern Region' },
  { id: 29, name: 'Thoothukudi', state: 'Tamil Nadu', lat: 8.76, lng: 78.13, zone: 'Gulf of Mannar Coast', region: 'Southern Region' },
  { id: 30, name: 'Puducherry', state: 'Puducherry UT', lat: 11.94, lng: 79.81, zone: 'Coromandel Coast', region: 'Southern Region' },

  // Southern Region - Andhra Pradesh
  { id: 31, name: 'Visakhapatnam', state: 'Andhra Pradesh', lat: 17.69, lng: 83.22, zone: 'Eastern Seaboard Port', region: 'Southern Region' },
  { id: 32, name: 'Vijayawada', state: 'Andhra Pradesh', lat: 16.51, lng: 80.65, zone: 'Krishna Delta', region: 'Southern Region' },
  { id: 33, name: 'Guntur', state: 'Andhra Pradesh', lat: 16.31, lng: 80.44, zone: 'Coastal Plain', region: 'Southern Region' },
  { id: 34, name: 'Nellore', state: 'Andhra Pradesh', lat: 14.44, lng: 79.99, zone: 'Penna Coastal Plain', region: 'Southern Region' },
  { id: 35, name: 'Tirupati', state: 'Andhra Pradesh', lat: 13.63, lng: 79.42, zone: 'Eastern Ghats Foothills', region: 'Southern Region' },
  { id: 36, name: 'Kurnool', state: 'Andhra Pradesh', lat: 15.83, lng: 78.04, zone: 'Rayalaseema Basin', region: 'Southern Region' },
  { id: 37, name: 'Amaravati', state: 'Andhra Pradesh', lat: 16.52, lng: 80.52, zone: 'Capital Basin', region: 'Southern Region' },

  // Southern Region - Telangana
  { id: 38, name: 'Hyderabad', state: 'Telangana', lat: 17.39, lng: 78.49, zone: 'Deccan Plateau Metro', region: 'Southern Region' },
  { id: 39, name: 'Warangal', state: 'Telangana', lat: 17.98, lng: 79.59, zone: 'Telangana Plateau', region: 'Southern Region' },
  { id: 40, name: 'Nizamabad', state: 'Telangana', lat: 18.67, lng: 78.09, zone: 'Godavari Basin', region: 'Southern Region' },
  { id: 41, name: 'Karimnagar', state: 'Telangana', lat: 18.44, lng: 79.13, zone: 'Northern Plateau', region: 'Southern Region' },

  // Southern Region - Kerala
  { id: 42, name: 'Thiruvananthapuram', state: 'Kerala', lat: 8.52, lng: 76.94, zone: 'Coastal Capital', region: 'Southern Region' },
  { id: 43, name: 'Kochi', state: 'Kerala', lat: 9.93, lng: 76.27, zone: 'Coastal Port', region: 'Southern Region' },
  { id: 44, name: 'Kozhikode', state: 'Kerala', lat: 11.26, lng: 75.78, zone: 'Malabar Coast', region: 'Southern Region' },
  { id: 45, name: 'Thrissur', state: 'Kerala', lat: 10.53, lng: 76.21, zone: 'Central Lowlands', region: 'Southern Region' },
  { id: 46, name: 'Kollam', state: 'Kerala', lat: 8.89, lng: 76.61, zone: 'Ashtamudi Coast', region: 'Southern Region' },
  { id: 47, name: 'Kannur', state: 'Kerala', lat: 11.87, lng: 75.37, zone: 'North Malabar Coast', region: 'Southern Region' },
  { id: 48, name: 'Malappuram', state: 'Kerala', lat: 11.05, lng: 76.07, zone: 'Mid-Highlands', region: 'Southern Region' },

  // Western Region - Gujarat
  { id: 49, name: 'Ahmedabad', state: 'Gujarat', lat: 23.02, lng: 72.57, zone: 'Sabarmati Basin Metro', region: 'Western Region' },
  { id: 50, name: 'Surat', state: 'Gujarat', lat: 21.17, lng: 72.83, zone: 'Gulf of Khambhat Coast', region: 'Western Region' },
  { id: 51, name: 'Vadodara', state: 'Gujarat', lat: 22.31, lng: 73.18, zone: 'Central Gujarat Plains', region: 'Western Region' },
  { id: 52, name: 'Rajkot', state: 'Gujarat', lat: 22.30, lng: 70.80, zone: 'Saurashtra Plateau', region: 'Western Region' },
  { id: 53, name: 'Bhavnagar', state: 'Gujarat', lat: 21.76, lng: 72.15, zone: 'Coastal Saurashtra', region: 'Western Region' },
  { id: 54, name: 'Jamnagar', state: 'Gujarat', lat: 22.47, lng: 70.06, zone: 'Gulf of Kutch Coast', region: 'Western Region' },
  { id: 55, name: 'Junagadh', state: 'Gujarat', lat: 21.52, lng: 70.46, zone: 'Gir Foothills', region: 'Western Region' },
  { id: 56, name: 'Gandhinagar', state: 'Gujarat', lat: 23.22, lng: 72.64, zone: 'State Capital', region: 'Western Region' },
  { id: 57, name: 'Anand', state: 'Gujarat', lat: 22.56, lng: 72.93, zone: 'Dairy / Agro Belt', region: 'Western Region' },

  // Northern Region - Rajasthan
  { id: 58, name: 'Jaipur', state: 'Rajasthan', lat: 26.91, lng: 75.79, zone: 'Semi-Arid Capital', region: 'Northern Region' },
  { id: 59, name: 'Jodhpur', state: 'Rajasthan', lat: 26.24, lng: 73.02, zone: 'Thar Desert Margin', region: 'Northern Region' },
  { id: 60, name: 'Kota', state: 'Rajasthan', lat: 25.21, lng: 75.86, zone: 'Chambal Basin', region: 'Northern Region' },
  { id: 61, name: 'Bikaner', state: 'Rajasthan', lat: 28.02, lng: 73.31, zone: 'Arid Desert Basin', region: 'Northern Region' },
  { id: 62, name: 'Udaipur', state: 'Rajasthan', lat: 24.59, lng: 73.71, zone: 'Aravalli Hills', region: 'Northern Region' },
  { id: 63, name: 'Ajmer', state: 'Rajasthan', lat: 26.45, lng: 74.64, zone: 'Central Aravalli Valley', region: 'Northern Region' },
  { id: 64, name: 'Alwar', state: 'Rajasthan', lat: 27.55, lng: 76.63, zone: 'North-Eastern Plains', region: 'Northern Region' },

  // Northern Region - Uttar Pradesh
  { id: 65, name: 'Lucknow', state: 'Uttar Pradesh', lat: 26.85, lng: 80.95, zone: 'Gangetic Plain Capital', region: 'Northern Region' },
  { id: 66, name: 'Kanpur', state: 'Uttar Pradesh', lat: 26.45, lng: 80.33, zone: 'Ganga Basin Industrial', region: 'Northern Region' },
  { id: 67, name: 'Agra', state: 'Uttar Pradesh', lat: 27.18, lng: 78.01, zone: 'Yamuna Basin', region: 'Northern Region' },
  { id: 68, name: 'Varanasi', state: 'Uttar Pradesh', lat: 25.32, lng: 82.97, zone: 'Eastern Ganga Valley', region: 'Northern Region' },
  { id: 69, name: 'Meerut', state: 'Uttar Pradesh', lat: 28.98, lng: 77.71, zone: 'Upper Doab', region: 'Northern Region' },
  { id: 70, name: 'Prayagraj', state: 'Uttar Pradesh', lat: 25.44, lng: 81.85, zone: 'Sangam Basin', region: 'Northern Region' },
  { id: 71, name: 'Gorakhpur', state: 'Uttar Pradesh', lat: 26.76, lng: 83.37, zone: 'Terai Plain', region: 'Northern Region' },
  { id: 72, name: 'Bareilly', state: 'Uttar Pradesh', lat: 28.37, lng: 79.43, zone: 'Rohilkhand Plain', region: 'Northern Region' },
  { id: 73, name: 'Aligarh', state: 'Uttar Pradesh', lat: 27.90, lng: 78.09, zone: 'Central Doab', region: 'Northern Region' },
  { id: 74, name: 'Moradabad', state: 'Uttar Pradesh', lat: 28.84, lng: 78.77, zone: 'Ramganga Basin', region: 'Northern Region' },

  // Central & Eastern Region - Madhya Pradesh
  { id: 75, name: 'Bhopal', state: 'Madhya Pradesh', lat: 23.26, lng: 77.41, zone: 'Malwa Plateau Capital', region: 'Central & Eastern Region' },
  { id: 76, name: 'Indore', state: 'Madhya Pradesh', lat: 22.72, lng: 75.86, zone: 'Commercial Hub', region: 'Central & Eastern Region' },
  { id: 77, name: 'Jabalpur', state: 'Madhya Pradesh', lat: 23.18, lng: 79.99, zone: 'Narmada Basin', region: 'Central & Eastern Region' },
  { id: 78, name: 'Gwalior', state: 'Madhya Pradesh', lat: 26.22, lng: 78.18, zone: 'Northern Plains', region: 'Central & Eastern Region' },
  { id: 79, name: 'Ujjain', state: 'Madhya Pradesh', lat: 23.18, lng: 75.78, zone: 'Shipra Basin', region: 'Central & Eastern Region' },
  { id: 80, name: 'Sagar', state: 'Madhya Pradesh', lat: 23.84, lng: 78.74, zone: 'Bundelkhand Plateau', region: 'Central & Eastern Region' },

  // Northern Region - Punjab
  { id: 81, name: 'Ludhiana', state: 'Punjab', lat: 30.90, lng: 75.86, zone: 'Agro-Industrial Hub', region: 'Northern Region' },
  { id: 82, name: 'Amritsar', state: 'Punjab', lat: 31.63, lng: 74.87, zone: 'North-Western Plains', region: 'Northern Region' },
  { id: 83, name: 'Jalandhar', state: 'Punjab', lat: 31.33, lng: 75.58, zone: 'Doaba Plain', region: 'Northern Region' },
  { id: 84, name: 'Patiala', state: 'Punjab', lat: 30.34, lng: 76.39, zone: 'Malwa Plain', region: 'Northern Region' },
  { id: 85, name: 'Bathinda', state: 'Punjab', lat: 30.21, lng: 74.95, zone: 'Southern Dry Plain', region: 'Northern Region' },

  // Northern Region - Haryana & Chandigarh
  { id: 86, name: 'Chandigarh', state: 'Chandigarh UT', lat: 30.73, lng: 76.78, zone: 'Shivalik Foothills Capital', region: 'Northern Region' },
  { id: 87, name: 'Ambala', state: 'Haryana', lat: 30.38, lng: 76.78, zone: 'North-Eastern Plain', region: 'Northern Region' },

  // Northern Region - Himachal Pradesh
  { id: 88, name: 'Shimla', state: 'Himachal Pradesh', lat: 31.10, lng: 77.17, zone: 'High Hill Capital', region: 'Northern Region' },
  { id: 89, name: 'Dharamshala', state: 'Himachal Pradesh', lat: 32.22, lng: 76.32, zone: 'Kangra Valley Hill', region: 'Northern Region' },
  { id: 90, name: 'Manali', state: 'Himachal Pradesh', lat: 32.24, lng: 77.19, zone: 'High Mountain Alpine', region: 'Northern Region' },

  // Northern Region - Uttarakhand
  { id: 91, name: 'Dehradun', state: 'Uttarakhand', lat: 30.32, lng: 78.03, zone: 'Doon Valley Capital', region: 'Northern Region' },
  { id: 92, name: 'Haridwar', state: 'Uttarakhand', lat: 29.95, lng: 78.16, zone: 'Ganga Foothills', region: 'Northern Region' },
  { id: 93, name: 'Roorkee', state: 'Uttarakhand', lat: 29.85, lng: 77.89, zone: 'Upper Gangetic Plain', region: 'Northern Region' },

  // Northern Region - Jammu & Kashmir and Ladakh
  { id: 94, name: 'Srinagar', state: 'Jammu & Kashmir', lat: 34.08, lng: 74.80, zone: 'Kashmir Valley', region: 'Northern Region' },
  { id: 95, name: 'Jammu', state: 'Jammu & Kashmir', lat: 32.73, lng: 74.86, zone: 'Tawi Foothills', region: 'Northern Region' },
  { id: 96, name: 'Leh', state: 'Ladakh', lat: 34.15, lng: 77.58, zone: 'Cold Desert High Altitude', region: 'Northern Region' },

  // Central & Eastern Region - Bihar
  { id: 97, name: 'Patna', state: 'Bihar', lat: 25.59, lng: 85.14, zone: 'Ganga Valley Capital', region: 'Central & Eastern Region' },
  { id: 98, name: 'Gaya', state: 'Bihar', lat: 24.79, lng: 85.00, zone: 'Southern Bihar Plain', region: 'Central & Eastern Region' },
  { id: 99, name: 'Muzaffarpur', state: 'Bihar', lat: 26.12, lng: 85.36, zone: 'Burhi Gandak Basin', region: 'Central & Eastern Region' },
  { id: 100, name: 'Bhagalpur', state: 'Bihar', lat: 25.24, lng: 86.98, zone: 'Eastern Ganga Plain', region: 'Central & Eastern Region' },
  { id: 101, name: 'Darbhanga', state: 'Bihar', lat: 26.15, lng: 85.89, zone: 'Mithila Plain', region: 'Central & Eastern Region' },

  // Central & Eastern Region - Jharkhand
  { id: 102, name: 'Ranchi', state: 'Jharkhand', lat: 23.34, lng: 85.31, zone: 'Chota Nagpur Capital', region: 'Central & Eastern Region' },
  { id: 103, name: 'Jamshedpur', state: 'Jharkhand', lat: 22.80, lng: 86.20, zone: 'Subarnarekha Basin', region: 'Central & Eastern Region' },
  { id: 104, name: 'Dhanbad', state: 'Jharkhand', lat: 23.80, lng: 86.43, zone: 'Damodar Valley', region: 'Central & Eastern Region' },
  { id: 105, name: 'Bokaro', state: 'Jharkhand', lat: 23.67, lng: 85.96, zone: 'Plateau Industrial', region: 'Central & Eastern Region' },

  // Central & Eastern Region - West Bengal
  { id: 106, name: 'Kolkata', state: 'West Bengal', lat: 22.57, lng: 88.36, zone: 'Hooghly Delta Metro', region: 'Central & Eastern Region' },
  { id: 107, name: 'Howrah', state: 'West Bengal', lat: 22.60, lng: 88.26, zone: 'Hooghly Basin', region: 'Central & Eastern Region' },
  { id: 108, name: 'Siliguri', state: 'West Bengal', lat: 26.73, lng: 88.40, zone: 'Terai Corridor', region: 'Central & Eastern Region' },
  { id: 109, name: 'Asansol', state: 'West Bengal', lat: 23.68, lng: 86.98, zone: 'Western Plateau Fringe', region: 'Central & Eastern Region' },
  { id: 110, name: 'Durgapur', state: 'West Bengal', lat: 23.52, lng: 87.31, zone: 'Damodar Plain', region: 'Central & Eastern Region' },

  // Central & Eastern Region - Odisha
  { id: 111, name: 'Bhubaneswar', state: 'Odisha', lat: 20.30, lng: 85.82, zone: 'Coastal Plain Capital', region: 'Central & Eastern Region' },
  { id: 112, name: 'Cuttack', state: 'Odisha', lat: 20.46, lng: 85.88, zone: 'Mahanadi Delta', region: 'Central & Eastern Region' },
  { id: 113, name: 'Rourkela', state: 'Odisha', lat: 22.26, lng: 84.85, zone: 'Chota Nagpur Fringe', region: 'Central & Eastern Region' },
  { id: 114, name: 'Sambalpur', state: 'Odisha', lat: 21.47, lng: 83.98, zone: 'Hirakud Basin', region: 'Central & Eastern Region' },
  { id: 115, name: 'Puri', state: 'Odisha', lat: 19.81, lng: 85.83, zone: 'Bay of Bengal Coast', region: 'Central & Eastern Region' },

  // Central & Eastern Region - Chhattisgarh
  { id: 116, name: 'Raipur', state: 'Chhattisgarh', lat: 21.25, lng: 81.63, zone: 'Mahanadi Basin Capital', region: 'Central & Eastern Region' },
  { id: 117, name: 'Bhilai', state: 'Chhattisgarh', lat: 21.19, lng: 81.35, zone: 'Industrial Plain', region: 'Central & Eastern Region' },
  { id: 118, name: 'Bilaspur', state: 'Chhattisgarh', lat: 22.08, lng: 82.14, zone: 'Arpa River Basin', region: 'Central & Eastern Region' },

  // North-Eastern States & Island Territories
  { id: 119, name: 'Guwahati', state: 'Assam', lat: 26.14, lng: 91.74, zone: 'Brahmaputra Valley', region: 'North-Eastern States & Island Territories' },
  { id: 120, name: 'Dibrugarh', state: 'Assam', lat: 27.47, lng: 94.91, zone: 'Upper Assam Valley', region: 'North-Eastern States & Island Territories' },
  { id: 121, name: 'Silchar', state: 'Assam', lat: 24.83, lng: 92.78, zone: 'Barak Valley', region: 'North-Eastern States & Island Territories' },
  { id: 122, name: 'Shillong', state: 'Meghalaya', lat: 25.58, lng: 91.89, zone: 'Khasi Hills Capital', region: 'North-Eastern States & Island Territories' },
  { id: 123, name: 'Agartala', state: 'Tripura', lat: 23.83, lng: 91.29, zone: 'Howrah River Plain', region: 'North-Eastern States & Island Territories' },
  { id: 124, name: 'Imphal', state: 'Manipur', lat: 24.82, lng: 93.94, zone: 'Manipur Valley Capital', region: 'North-Eastern States & Island Territories' },
  { id: 125, name: 'Aizawl', state: 'Mizoram', lat: 23.73, lng: 92.72, zone: 'Mizo Hills Ridge', region: 'North-Eastern States & Island Territories' },
  { id: 126, name: 'Kohima', state: 'Nagaland', lat: 25.67, lng: 94.11, zone: 'Naga Hills Capital', region: 'North-Eastern States & Island Territories' },
  { id: 127, name: 'Itanagar', state: 'Arunachal Pradesh', lat: 27.08, lng: 93.61, zone: 'Eastern Himalayan Hill', region: 'North-Eastern States & Island Territories' },
  { id: 128, name: 'Gangtok', state: 'Sikkim', lat: 27.34, lng: 88.61, zone: 'Shivalik Range Capital', region: 'North-Eastern States & Island Territories' },

  // Western Region - Goa
  { id: 129, name: 'Panaji', state: 'Goa', lat: 15.49, lng: 73.83, zone: 'Mandovi Estuary Coast', region: 'Western Region' },

  // North-Eastern & Island Territories - Andaman & Nicobar
  { id: 130, name: 'Port Blair', state: 'Andaman & Nicobar', lat: 11.62, lng: 92.73, zone: 'Andaman Sea Island', region: 'North-Eastern States & Island Territories' },
];

// Seeded pseudo-random generator for deterministic yet realistic model predictions per city
function pseudoRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Generate high-fidelity model predictions for any city
export function generateModelOutputsForCity(
  city: CityInfo,
  cropOverride?: SupportedCrop,
  timeJitter = 0
): CityModelOutput {
  const seed = city.id * 17 + timeJitter;
  const r1 = pseudoRandom(seed + 1);
  const r2 = pseudoRandom(seed + 2);
  const r3 = pseudoRandom(seed + 3);
  const r4 = pseudoRandom(seed + 4);
  const r5 = pseudoRandom(seed + 5);

  const isCoastal = city.zone.includes('Coast') || city.zone.includes('Island') || city.zone.includes('Port');
  const isMountain = city.zone.includes('Hill') || city.zone.includes('Alpine') || city.zone.includes('Valley') || city.zone.includes('Ridge');
  const isArid = city.zone.includes('Arid') || city.zone.includes('Desert') || city.state === 'Rajasthan';
  const isGangetic = city.zone.includes('Ganga') || city.zone.includes('Plain') || city.zone.includes('Doab');

  // 1. 1-Hour Weather Forecast
  let baseTemp = 28;
  if (isMountain) baseTemp = city.name === 'Leh' ? -2 : 14;
  else if (isArid) baseTemp = 37;
  else if (isCoastal) baseTemp = 31;
  else baseTemp = 32;

  const tempC = Math.round((baseTemp + (r1 * 6 - 3)) * 10) / 10;
  const feelsLikeC = Math.round((tempC + (isCoastal ? 3.5 : isArid ? 1.5 : 1)) * 10) / 10;
  const humidity = Math.min(98, Math.max(18, Math.round(isCoastal ? 75 + r2 * 20 : isArid ? 22 + r2 * 20 : 45 + r2 * 35)));
  const windSpeedKmh = Math.round(8 + r3 * 28 + (isCoastal ? 10 : 0));
  const windHeadings = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const windHeadingDeg = Math.round(r4 * 360);
  const windDirection = windHeadings[Math.floor((windHeadingDeg / 22.5) % 16)];
  const cloudCover = Math.round(isCoastal ? 40 + r5 * 50 : isMountain ? 50 + r5 * 45 : 15 + r5 * 60);

  let precipProb = Math.round(isCoastal ? 45 + r1 * 50 : isMountain ? 50 + r1 * 40 : r1 * 40);
  let precipitationMm = precipProb > 60 ? Math.round(r2 * 18 * 10) / 10 : 0;
  if (precipProb < 20) precipitationMm = 0;

  // Weather Condition string & icon
  let condition = 'Partly Cloudy';
  let conditionIcon = 'cloud-sun';
  if (precipitationMm > 12) {
    condition = 'Heavy Monsoonal Rain';
    conditionIcon = 'cloud-lightning';
  } else if (precipitationMm > 2) {
    condition = 'Scattered Thunderstorms';
    conditionIcon = 'cloud-rain';
  } else if (tempC > 40) {
    condition = 'Extreme Heat Wave';
    conditionIcon = 'sun-flame';
  } else if (tempC < 5) {
    condition = 'Cold Alpine Chill';
    conditionIcon = 'snowflake';
  } else if (cloudCover < 25) {
    condition = 'Clear Sky';
    conditionIcon = 'sun';
  } else if (cloudCover > 80) {
    condition = 'Dense Overcast';
    conditionIcon = 'cloud';
  }

  // AQI based on geographic profile
  let aqi = 65;
  if (city.region === 'Northern Region' && (city.state === 'Delhi NCT' || city.state === 'Uttar Pradesh' || city.state === 'Haryana')) {
    aqi = Math.round(210 + r3 * 180);
  } else if (isCoastal || isMountain) {
    aqi = Math.round(35 + r3 * 45);
  } else {
    aqi = Math.round(85 + r3 * 90);
  }

  let aqiStatus: 'Good' | 'Moderate' | 'Poor' | 'Very Poor' | 'Severe' = 'Moderate';
  if (aqi <= 50) aqiStatus = 'Good';
  else if (aqi <= 100) aqiStatus = 'Moderate';
  else if (aqi <= 200) aqiStatus = 'Poor';
  else if (aqi <= 300) aqiStatus = 'Very Poor';
  else aqiStatus = 'Severe';

  // 1-Hour Nowcast statement
  let forecastNext1h = `T+60m: Stable barometric trend at ${Math.round(1008 + (r2 * 10 - 5))} hPa. Temperature moving to ${(tempC + 0.3).toFixed(1)}°C. Winds steady from ${windDirection} at ${windSpeedKmh} km/h.`;
  if (precipitationMm > 5) {
    forecastNext1h = `T+60m: Intensely convective rain bands approaching from ${windDirection}. Expected accumulation ${precipitationMm + 4}mm with gust fronts up to ${windSpeedKmh + 18} km/h.`;
  } else if (tempC > 38) {
    forecastNext1h = `T+60m: High insolation peak. Temperature may elevate to ${(tempC + 1.2).toFixed(1)}°C with high wet-bulb index.`;
  }

  // 6-hour hourly trend
  const hourly = [0, 1, 2, 3, 4, 5].map((hr) => {
    const timeLabel = `+${hr + 1}h`;
    const hTemp = Math.round((tempC + (hr * 0.4 - 0.2)) * 10) / 10;
    const hRain = Math.min(100, Math.max(0, Math.round(precipProb + (pseudoRandom(seed + hr * 7) * 20 - 10))));
    return {
      time: timeLabel,
      tempC: hTemp,
      rainProb: hRain,
      cond: hRain > 60 ? 'Rain' : hTemp > 38 ? 'Heat' : 'Partly Cloudy',
    };
  });

  // 2. 3-Hour Disaster Risk Early Warning Model
  let riskScore = Math.round(15 + r4 * 45);
  let riskLevel: 'LOW' | 'ADVISORY' | 'WARNING' | 'SEVERE' = 'LOW';
  let primaryHazard = 'Nominal Climatological State';
  let secondaryHazard: string | undefined = undefined;
  let activeNDMAProtocol = 'NDMA Level-0: Standard Monitoring & Surveillance';
  const safetyChecklist: string[] = [
    'Normal civic operations permitted',
    'Follow standard IMD/SDMA regular updates',
  ];

  if (city.name === 'Mumbai' || city.name === 'Guwahati' || city.name === 'Patna' || city.name === 'Kolkata') {
    riskScore = Math.round(72 + r1 * 22);
    riskLevel = riskScore > 85 ? 'SEVERE' : 'WARNING';
    primaryHazard = 'Urban Flash Flood & Drainage Choke Warning';
    secondaryHazard = 'Storm Surge Tidal Inundation';
    activeNDMAProtocol = 'NDMA Protocol ORANGE/RED: Activate Emergency Drainage Stations';
    safetyChecklist.push('Avoid low-lying subways & underpasses', 'Keep 48-hr emergency drinking water', 'High-voltage transformer safety perimeter enforced');
  } else if (city.name === 'Puri' || city.name === 'Visakhapatnam' || city.name === 'Chennai' || city.name === 'Thoothukudi') {
    riskScore = Math.round(68 + r2 * 26);
    riskLevel = riskScore > 84 ? 'SEVERE' : 'WARNING';
    primaryHazard = 'Tropical Cyclonic Depression & Gale Advisory';
    secondaryHazard = 'Coastal High-Tide Surge';
    activeNDMAProtocol = 'NDMA Protocol ORANGE: Complete Suspension of Coastal Fishing & Maritime Excursions';
    safetyChecklist.push('Fishermen strictly advised not to venture into deep sea', 'Anchor light marine crafts in harbor', 'Secure tin roofs and rooftop loose objects');
  } else if (city.name === 'Shimla' || city.name === 'Manali' || city.name === 'Dharamshala' || city.name === 'Gangtok' || city.name === 'Aizawl') {
    riskScore = Math.round(65 + r3 * 28);
    riskLevel = riskScore > 82 ? 'SEVERE' : 'WARNING';
    primaryHazard = 'Slope Landslide Hazard & Cloudburst Trigger';
    secondaryHazard = 'National Highway Blockage';
    activeNDMAProtocol = 'NDMA Protocol YELLOW/ORANGE: Restrict Heavy Transport on Vulnerable Slopes';
    safetyChecklist.push('Avoid travel on NH landslide-prone stretches', 'Monitor natural slope cracks', 'Maintain battery communication backups');
  } else if (city.name === 'Bikaner' || city.name === 'Jodhpur' || city.name === 'Nagpur' || city.name === 'Solapur') {
    riskScore = Math.round(62 + r4 * 30);
    riskLevel = riskScore > 80 ? 'SEVERE' : 'WARNING';
    primaryHazard = 'Extreme Heatwave & Dehydration Red Alert';
    secondaryHazard = 'Severe Thermal Sunstroke';
    activeNDMAProtocol = 'NDMA Protocol RED: Industrial Labor Afternoon Stand-down (12:00-15:30)';
    safetyChecklist.push('Carry ORS solution and stay in shaded cooling hubs', 'Never leave children/pets inside parked cars', 'Restrict direct outdoor exposure between 12-4 PM');
  } else if (city.name === 'Delhi' || city.name === 'Noida' || city.name === 'Ghaziabad' || city.name === 'Kanpur') {
    riskScore = Math.round(58 + r5 * 32);
    riskLevel = riskScore > 80 ? 'SEVERE' : riskScore > 65 ? 'WARNING' : 'ADVISORY';
    primaryHazard = 'Severe PM2.5 Micro-Particulate Smog Spike';
    secondaryHazard = 'Critical Respiratory Distress';
    activeNDMAProtocol = 'GRAP Stage-IV Enforcement: Anti-Smog Gun Deployed';
    safetyChecklist.push('Wear N95/FFP2 masks outdoors', 'Children and asthmatic patients avoid morning jogs', 'Operate HEPA room air purifiers indoors');
  } else if (riskScore > 50) {
    riskLevel = 'ADVISORY';
    primaryHazard = 'Localized Convective Lightning & Gust Front';
    safetyChecklist.push('Take shelter in enclosed brick buildings during lightning', 'Avoid standing under tall trees or electric poles');
  }

  // 3. Agro-Meteorological Crop Intelligence
  const crop: SupportedCrop = cropOverride || (isGangetic ? 'wheat' : isCoastal ? 'rice' : isArid ? 'mustard' : city.zone.includes('Cotton') ? 'cotton' : 'rice');

  const cropNames: Record<SupportedCrop, string> = {
    rice: 'Kharif Paddy (Rice)',
    wheat: 'Rabi Wheat (HD-3086 / PBW-550)',
    cotton: 'Bt Cotton (Hybrid)',
    maize: 'Hybrid Sweet & Grain Maize',
    sugarcane: 'Sugarcane (Co-0238)',
    mustard: 'Yellow Mustard / Rapeseed',
    pulses: 'Chickpea & Arhar Pulses',
    soybean: 'Kharif Soybean (JS-9560)',
    millets: 'Pearl Millet (Bajra / Jowar)',
    groundnut: 'Spanish Bunch Groundnut',
  };

  const suitabilityScore = Math.round(60 + r1 * 38);
  const soilMoisturePct = Math.min(95, Math.max(12, Math.round(isCoastal ? 65 + r2 * 25 : isArid ? 18 + r2 * 20 : 40 + r2 * 35)));

  let soilStatus: 'Deficit' | 'Optimal' | 'Saturated' | 'Waterlogged' = 'Optimal';
  if (soilMoisturePct < 25) soilStatus = 'Deficit';
  else if (soilMoisturePct > 80) soilStatus = 'Waterlogged';
  else if (soilMoisturePct > 65) soilStatus = 'Saturated';

  let irrigationAdvisory = 'Normal scheduled irrigation cycle recommended.';
  if (precipitationMm > 4 || precipProb > 60) {
    irrigationAdvisory = 'SUSPEND IRRIGATION: Substantial precipitation (>1h) will provide natural root-zone saturation.';
  } else if (soilStatus === 'Deficit') {
    irrigationAdvisory = 'IMMEDIATE IRRIGATION REQUIRED: Critical moisture deficit. Run drip or micro-sprinkler for 45 mins at dusk.';
  } else if (soilStatus === 'Waterlogged') {
    irrigationAdvisory = 'DRAINAGE PRIORITY: Dig contour trenches to prevent root-rot & collar fungus.';
  }

  let pestRisk: 'Low' | 'Moderate' | 'High' | 'Critical' = 'Low';
  let pestDetails = 'Low ambient pathogen pressure. Monitor standard leaf nodes.';
  if (humidity > 78 && tempC > 27) {
    pestRisk = 'High';
    pestDetails = 'Elevated Blast (Magnaporthe) and Leaf Folder spore germination due to high relative humidity.';
  } else if (tempC > 36) {
    pestRisk = 'Moderate';
    pestDetails = 'Aphid and whitefly cluster risk on tender shoots. Check underside of leaves.';
  }

  const sowingHarvestWindow = isArid
    ? 'Optimal Harvesting: 14-22 days | Post-monsoon seed bed preparation'
    : isGangetic
    ? 'Vegetative tillering phase | Ideal foliar spraying window: 07:00-10:00 AM'
    : 'Active grain filling | Irrigation cutoff recommended 10 days before harvest';

  const gddAccumulated = Math.round(1450 + r4 * 600);
  const fertilizerTip = soilStatus === 'Waterlogged'
    ? 'Avoid urea broadcasting now to prevent leaching. Apply foliar zinc & potassium once drainage stabilizes.'
    : 'Apply split dose of Urea (45kg/ha) + DAP during morning soil absorption window.';

  const recommendedCrops = ['rice', 'wheat', 'maize', 'pulses', 'mustard'].filter((c) => c !== crop).slice(0, 3);

  return {
    city,
    weather: {
      tempC,
      feelsLikeC,
      condition,
      conditionIcon,
      humidity,
      windSpeedKmh,
      windDirection,
      windHeadingDeg,
      precipitationMm,
      precipProb,
      cloudCover,
      pressureHpa: Math.round(1008 + (r2 * 10 - 5)),
      uvIndex: isArid ? 9 : isCoastal ? 7 : 6,
      visibilityKm: aqi > 250 ? 2.1 : 9.5,
      aqi,
      aqiStatus,
      forecastNext1h,
      hourly,
    },
    disaster: {
      riskScore,
      riskLevel,
      primaryHazard,
      secondaryHazard,
      leadTime: riskLevel === 'SEVERE' ? 'T+01:30 Hrs (Urgent)' : riskLevel === 'WARNING' ? 'T+03:00 Hrs' : 'T+06:00 Hrs',
      advisory: `${primaryHazard}. Safety checklist active under ${activeNDMAProtocol}.`,
      probability: Math.round(65 + r5 * 30),
      impactRadiusKm: Math.round(15 + r3 * 40),
      safetyChecklist,
      modelConfidence: Math.round(86 + r2 * 12),
      activeNDMAProtocol,
    },
    agro: {
      crop,
      cropName: cropNames[crop] || crop,
      suitabilityScore,
      soilMoisturePct,
      soilStatus,
      irrigationAdvisory,
      pestRisk,
      pestDetails,
      sowingHarvestWindow,
      gddAccumulated,
      fertilizerTip,
      recommendedCrops,
    },
    lastUpdated: new Date().toISOString(),
    modelVersions: {
      weather1h: 'Nowcast-XGBoost-ConvLSTM-v4.2',
      disaster3h: 'EarlyWarning-RandomForest-Ensemble-v3.8',
      agroCrop: 'CropIntel-BioMet-v2.5',
    },
  };
}

// Great-circle distance between two GPS coordinates in kilometers (Haversine formula)
export function calculateHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Calculate bearing angle from point 1 to point 2
export function calculateBearingDeg(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;
  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
  const theta = Math.atan2(y, x);
  return Math.round(((theta * 180) / Math.PI + 360) % 360);
}

// PostGIS spatial snap function: finds the closest monitored station to any India GPS point
export function snapCoordinatesToNearestStation(lat: number, lng: number): NearestStationResult {
  let closestCity = CITIES_130_MASTER[0];
  let minDistance = calculateHaversineDistanceKm(lat, lng, closestCity.lat, closestCity.lng);

  for (let i = 1; i < CITIES_130_MASTER.length; i++) {
    const dist = calculateHaversineDistanceKm(lat, lng, CITIES_130_MASTER[i].lat, CITIES_130_MASTER[i].lng);
    if (dist < minDistance) {
      minDistance = dist;
      closestCity = CITIES_130_MASTER[i];
    }
  }

  const bearing = calculateBearingDeg(lat, lng, closestCity.lat, closestCity.lng);
  const modelOutput = generateModelOutputsForCity(closestCity);

  return {
    targetCoords: { lat, lng },
    nearestCity: modelOutput,
    distanceKm: minDistance,
    bearingDeg: bearing,
    snappedStationId: closestCity.id,
  };
}
