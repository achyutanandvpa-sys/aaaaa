import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import {
  CITIES_130_MASTER,
  generateModelOutputsForCity,
  snapCoordinatesToNearestStation,
} from "./src/data/citiesData.ts";
import { SupportedCrop } from "./src/types.ts";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy Gemini client helper
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "online",
    platform: "WeatherGPT India AI/ML Prediction Hub",
    totalMonitoredCities: 130,
    activeModels: [
      "1-Hour Weather Nowcast (XGBoost/ConvLSTM)",
      "3-Hour Disaster Risk Early Warning (RandomForest/Ensemble)",
      "Agro-Meteorological Crop Intelligence (BioMet)",
    ],
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// 1. Get all 130 cities with baseline prediction overview
app.get("/api/cities", (_req, res) => {
  const allCityOutputs = CITIES_130_MASTER.map((city) => generateModelOutputsForCity(city));
  res.json({
    count: allCityOutputs.length,
    timestamp: new Date().toISOString(),
    cities: allCityOutputs,
  });
});

// Helper to find city by ID
function findCityById(idParam: string) {
  const numId = parseInt(idParam, 10);
  if (isNaN(numId) || numId < 1 || numId > 130) {
    return null;
  }
  return CITIES_130_MASTER.find((c) => c.id === numId) || null;
}

// 2. 1-Hour Weather Forecast API: GET /predict/weather/:city_id (and /api/predict/weather/:city_id)
const handleWeatherPredict = (req: express.Request, res: express.Response) => {
  const city = findCityById(req.params.city_id);
  if (!city) {
    res.status(404).json({
      error: `City ID ${req.params.city_id} not found. Must be between 1 and 130.`,
    });
    return;
  }
  const modelOutput = generateModelOutputsForCity(city);
  res.json({
    model: "1-Hour Weather Forecast Model v4.2",
    city_id: city.id,
    city_name: city.name,
    state: city.state,
    coordinates: { lat: city.lat, lng: city.lng },
    zone_classification: city.zone,
    generated_at: modelOutput.lastUpdated,
    forecast: modelOutput.weather,
  });
};

app.get("/predict/weather/:city_id", handleWeatherPredict);
app.get("/api/predict/weather/:city_id", handleWeatherPredict);

// 3. 3-Hour Disaster Risk Early Warning API: GET /predict/disaster/:city_id (and /api/predict/disaster/:city_id)
const handleDisasterPredict = (req: express.Request, res: express.Response) => {
  const city = findCityById(req.params.city_id);
  if (!city) {
    res.status(404).json({
      error: `City ID ${req.params.city_id} not found. Must be between 1 and 130.`,
    });
    return;
  }
  const modelOutput = generateModelOutputsForCity(city);
  res.json({
    model: "3-Hour Disaster Risk Early Warning Model v3.8",
    city_id: city.id,
    city_name: city.name,
    state: city.state,
    coordinates: { lat: city.lat, lng: city.lng },
    zone_classification: city.zone,
    generated_at: modelOutput.lastUpdated,
    disaster_risk: modelOutput.disaster,
  });
};

app.get("/predict/disaster/:city_id", handleDisasterPredict);
app.get("/api/predict/disaster/:city_id", handleDisasterPredict);

// 4. Agro Crop Advisory API: GET /advisory/:city_id?crop=... (and /api/advisory/:city_id)
const handleAgroAdvisory = (req: express.Request, res: express.Response) => {
  const city = findCityById(req.params.city_id);
  if (!city) {
    res.status(404).json({
      error: `City ID ${req.params.city_id} not found. Must be between 1 and 130.`,
    });
    return;
  }
  const requestedCrop = (req.query.crop as SupportedCrop) || undefined;
  const modelOutput = generateModelOutputsForCity(city, requestedCrop);
  res.json({
    model: "Agro-Meteorological Crop Intelligence Model v2.5",
    city_id: city.id,
    city_name: city.name,
    state: city.state,
    coordinates: { lat: city.lat, lng: city.lng },
    zone_classification: city.zone,
    selected_crop: requestedCrop || modelOutput.agro.crop,
    generated_at: modelOutput.lastUpdated,
    agro_intelligence: modelOutput.agro,
  });
};

app.get("/advisory/:city_id", handleAgroAdvisory);
app.get("/api/advisory/:city_id", handleAgroAdvisory);

// 5. PostGIS Spatial Snapping Engine for Any Coordinates in India
app.get("/api/nearest", (req, res) => {
  const lat = parseFloat(req.query.lat as string);
  const lng = parseFloat(req.query.lng as string);

  if (isNaN(lat) || isNaN(lng)) {
    res.status(400).json({ error: "Valid 'lat' and 'lng' float query parameters are required." });
    return;
  }

  const snapped = snapCoordinatesToNearestStation(lat, lng);
  res.json({
    engine: "PostGIS Spatial ST_Distance Snapping Engine",
    query_coordinates: { lat, lng },
    nearest_station: snapped,
  });
});

// Timeout wrapper to guarantee swift fallback under high demand
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, _label: string): Promise<T> {
  let timer: NodeJS.Timeout;
  // Guard against unhandled promise rejections if the background request settles after timeout
  promise.catch(() => {});
  return Promise.race([
    promise.finally(() => clearTimeout(timer)),
    new Promise<T>((_, reject) => {
      timer = setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs);
    }),
  ]);
}

// Resilient Gemini Generator with graceful fallback to handle 503 high-demand spikes smoothly
async function generateGeminiContentWithFallback(
  ai: GoogleGenAI,
  prompt: string,
  systemInstruction: string,
  temperature: number = 0.35
): Promise<{ text: string; model: string } | null> {
  // Tier 1: gemini-3.8-flash (official primary model for basic text and chat tasks)
  try {
    const res = await withTimeout(
      ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          systemInstruction,
          temperature,
        },
      }),
      12000,
      "gemini-3.8-flash"
    );
    if (res.text) {
      return { text: res.text, model: "gemini-3.8-flash" };
    }
  } catch (_err) {
    // Model may be under temporary peak demand or timeout; gracefully try lightweight tier
  }

  // Tier 2: gemini-3.1-flash-lite (official lightweight model for high-throughput / high-demand fallback)
  try {
    const res = await withTimeout(
      ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: prompt,
        config: {
          systemInstruction,
          temperature,
        },
      }),
      8000,
      "gemini-3.1-flash-lite"
    );
    if (res.text) {
      return { text: res.text, model: "gemini-3.1-flash-lite" };
    }
  } catch (_err) {
    // Graceful fallback to deterministic local synthesis engine
  }

  return null;
}

function generateTelemetrySynthesisReport(
  targetCity: any,
  modelOutput: any,
  customPrompt?: string,
  focusArea?: string
): string {
  return `[WeatherGPT Intelligence Engine - Live Model Synthesis Report]\n\n` +
    `Station: #${targetCity.id} ${targetCity.name}, ${targetCity.state} (${targetCity.zone})\n` +
    `Focus: ${focusArea || 'Comprehensive Meteorological & Agro Advisory'}\n\n` +
    `1. 1-Hour Weather Nowcast:\n` +
    `- Temperature: ${modelOutput.weather.tempC}°C (Feels like: ${modelOutput.weather.feelsLikeC}°C)\n` +
    `- Precipitation: ${modelOutput.weather.precipitationMm} mm/hr (${modelOutput.weather.precipProb}% probability)\n` +
    `- Wind Vector: ${modelOutput.weather.windSpeedKmh} km/h ${modelOutput.weather.windDirection} (${modelOutput.weather.windHeadingDeg}°)\n` +
    `- Humidity: ${modelOutput.weather.humidity}% | Air Quality Index: ${modelOutput.weather.aqi} (${modelOutput.weather.aqiStatus})\n` +
    `- 60-Minute Radar Trend: ${modelOutput.weather.forecastNext1h}\n\n` +
    `2. 3-Hour Disaster Risk Early Warning:\n` +
    `- Risk Level: ${modelOutput.disaster.riskLevel} (Score: ${modelOutput.disaster.riskScore}/100, Probability: ${modelOutput.disaster.probability}%)\n` +
    `- Primary Hazard: ${modelOutput.disaster.primaryHazard} [Lead Time: ${modelOutput.disaster.leadTime}]\n` +
    `- Impact Radius: ${modelOutput.disaster.impactRadiusKm} km buffer\n` +
    `- Active NDMA Protocol: ${modelOutput.disaster.activeNDMAProtocol}\n` +
    `- Directives: ${modelOutput.disaster.safetyChecklist.join("; ")}\n` +
    `- National Emergency Helpline: 1078 (NDMA) / 112\n\n` +
    `3. Agro-Meteorological Crop Intelligence:\n` +
    `- Monitored Crop: ${modelOutput.agro.cropName} (Suitability Score: ${modelOutput.agro.suitabilityScore}%)\n` +
    `- Soil Moisture: ${modelOutput.agro.soilMoisturePct}% (${modelOutput.agro.soilStatus})\n` +
    `- Irrigation Advisory: ${modelOutput.agro.irrigationAdvisory}\n` +
    `- Pest/Pathogen Threat: ${modelOutput.agro.pestRisk} (${modelOutput.agro.pestDetails})\n` +
    `- Agronomic Recommendation: ${modelOutput.agro.fertilizerTip}\n\n` +
    (customPrompt ? `Target Query Synthesis ("${customPrompt}"):\nBased on active station telemetry, operational risk is currently rated ${modelOutput.disaster.riskLevel}. Soil moisture index stands at ${modelOutput.agro.soilMoisturePct}%, requiring ${modelOutput.agro.irrigationAdvisory.toLowerCase()}. Follow NDMA guidelines.` : '');
}

// 6. Gemini AI Intelligence Analyst for custom queries & deep advisories
app.post("/api/ai/deep-analysis", async (req, res) => {
  const { cityId, customPrompt, focusArea } = req.body;
  let city = null;
  if (cityId) {
    city = findCityById(String(cityId));
  }
  const targetCity = city || CITIES_130_MASTER[0];
  const modelOutput = generateModelOutputsForCity(targetCity);

  try {
    const ai = getGeminiClient();
    if (!ai) {
      res.json({
        report: generateTelemetrySynthesisReport(targetCity, modelOutput, customPrompt, focusArea),
        model: "WeatherGPT-Local-Synthesis",
        city: targetCity,
      });
      return;
    }

    const systemInstruction = `You are WeatherGPT India's Chief AI Agro-Meteorologist and NDMA Disaster Risk Specialist. You synthesize outputs from three active AI/ML models running across 130 Indian hubs:
1. 1-Hour Weather Forecast Model
2. 3-Hour Disaster Risk Early Warning Model
3. Agro-Meteorological Crop Intelligence Model
Provide a high-impact, actionable, professional briefing formatted cleanly with concise bullet points and bold section headers. Tone: Authoritative, urgent when risk is high, scientifically grounded.`;

    const userPrompt = `Synthesize full operational intelligence for ${targetCity.name} (ID #${targetCity.id}, ${targetCity.state}, Zone: ${targetCity.zone}).
Current Live ML Model Telemetry:
- 1-Hour Weather: Temp ${modelOutput.weather.tempC}°C (Feels ${modelOutput.weather.feelsLikeC}°C), Wind: ${modelOutput.weather.windSpeedKmh} km/h ${modelOutput.weather.windDirection}, Rain: ${modelOutput.weather.precipitationMm} mm/hr (${modelOutput.weather.precipProb}%), Humidity: ${modelOutput.weather.humidity}%, AQI: ${modelOutput.weather.aqi} (${modelOutput.weather.aqiStatus}), Cloud: ${modelOutput.weather.cloudCover}%
- 3-Hour Disaster Warning: Risk Score ${modelOutput.disaster.riskScore}/100 [Level: ${modelOutput.disaster.riskLevel}], Primary Hazard: ${modelOutput.disaster.primaryHazard}, Lead Time: ${modelOutput.disaster.leadTime}, Protocol: ${modelOutput.disaster.activeNDMAProtocol}
- Agro Intelligence: Selected Crop ${modelOutput.agro.cropName}, Suitability: ${modelOutput.agro.suitabilityScore}%, Soil Moisture: ${modelOutput.agro.soilMoisturePct}% (${modelOutput.agro.soilStatus}), Pest Threat: ${modelOutput.agro.pestRisk} (${modelOutput.agro.pestDetails}), Fertilizer advisory: ${modelOutput.agro.fertilizerTip}

Specific user query: ${customPrompt || "Provide full 360-degree tactical weather, disaster mitigation, and crop advisory summary."}
Focus Area: ${focusArea || "Combined Intelligence"}`;

    const genResult = await generateGeminiContentWithFallback(
      ai,
      userPrompt,
      systemInstruction,
      0.35
    );

    if (!genResult) {
      res.json({
        report: generateTelemetrySynthesisReport(targetCity, modelOutput, customPrompt, focusArea),
        model: "WeatherGPT-Synthesis-Engine",
        city: targetCity,
      });
      return;
    }

    res.json({
      report: genResult.text,
      model: genResult.model,
      city: targetCity,
    });
  } catch (_err) {
    res.json({
      report: generateTelemetrySynthesisReport(targetCity, modelOutput, customPrompt, focusArea),
      model: "WeatherGPT-Synthesis-Engine",
      city: targetCity,
    });
  }
});

// Helper for high-fidelity multilingual fallback answers strictly adhering to WeatherGPT AI Agent rules
function getMultilingualFallbackResponse(
  query: string,
  city: any,
  telemetry: any,
  langCode: string
): string {
  const q = (query || "").trim().toLowerCase();
  const c = city.name;
  const temp = Math.round(telemetry.weather.tempC);
  const feels = Math.round(telemetry.weather.feelsLikeC);
  const rainMm = telemetry.weather.precipitationMm;
  const rainProb = telemetry.weather.precipProb;
  const humidity = telemetry.weather.humidity;
  const wind = telemetry.weather.windSpeedKmh;
  const aqi = telemetry.weather.aqi;
  const aqiStatus = telemetry.weather.aqiStatus;
  const riskLevel = telemetry.disaster.riskLevel;
  const riskScore = telemetry.disaster.riskScore;
  const hazard = telemetry.disaster.primaryHazard;
  const leadTime = telemetry.disaster.leadTime;
  const crop = telemetry.agro.cropName;
  const soilMoisture = telemetry.agro.soilMoisturePct;
  const irrigation = telemetry.agro.irrigationAdvisory;
  const soilStatus = telemetry.agro.soilStatus;

  // 1. GREETINGS & CASUAL CHAT CHECK
  const isGreeting = /^(hi|hello|hey|namaste|namaskar|pranam|नमस्ते|हेलो|हाय|प्रणाम|kem cho|vanakkam|sat sri akal|aadab)[\s!.,?]*$/i.test(q) ||
    /^(good morning|good afternoon|good evening|शुभ प्रभात|शुभ संध्या)/i.test(q);

  if (isGreeting) {
    switch (langCode) {
      case 'hi':
        return `नमस्ते! वर्तमान में आपकी लोकेशन के निकट **#${city.id} ${c}** (${city.state}) स्टेशन सक्रिय है। आप क्या जानना चाहते हैं?`;
      case 'bn':
        return `নমস্কার! বর্তমানে আপনার অবস্থানের নিকটবর্তী **#${city.id} ${c}** স্টেশন সক্রিয় রয়েছে। আমি আপনাকে কীভাবে সাহায্য করতে পারি?`;
      case 'te':
        return `నమస్కారం! ప్రస్తుతం మీ లొకేషన్ సమీపంలోని **#${city.id} ${c}** స్టేషన్ మానిటర్ చేయబడుతోంది. నేను మీకు ఎలా సహాయపడగలను?`;
      case 'ta':
        return `வணக்கம்! தற்போது உங்கள் இருப்பிடத்திற்கு அருகிலுள்ள **#${city.id} ${c}** நிலையம் கண்காணிக்கப்படுகிறது. நான் உங்களுக்கு எவ்வாறு உதவலாம்?`;
      case 'mr':
        return `नमस्कार! सध्या आपल्या स्थानाजवळील **#${city.id} ${c}** स्टेशन सक्रिय आहे. मी आपल्याला काय मदत करू शकतो?`;
      case 'gu':
        return `નમસ્તે! હાલમાં તમારા લોકેશન નજીકનું **#${city.id} ${c}** સ્ટેશન સક્રિય છે. હું તમને કેવી રીતે મદદ કરી શકું?`;
      case 'kn':
        return `ನಮಸ್ಕಾರ! ಪ್ರಸ್ತುತ ನಿಮ್ಮ ಸ್ಥಳದ ಹತ್ತಿರದ **#${city.id} ${c}** ನಿಲ್ದಾಣ ಸಕ್ರಿಯವಾಗಿದೆ. ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?`;
      case 'ml':
        return `നമസ്കാരം! നിലവിൽ നിങ്ങളുടെ ലൊക്കേഷന് അടുത്തുള്ള **#${city.id} ${c}** സ്റ്റേഷൻ നിരീക്ഷിക്കുന്നു. ഞാൻ എങ്ങനെ സഹായിക്കാം?`;
      case 'pa':
        return `ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਇਸ ਵੇਲੇ ਤੁਹਾਡੇ ਸਥਾਨ ਨੇੜੇ **#${city.id} ${c}** ਸਟੇਸ਼ਨ ਨਿਗਰਾਨੀ ਹੇਠ ਹੈ। ਮੈਂ ਤੁਹਾਡੀ ਕੀ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ?`;
      default:
        return `Hello! Currently monitoring station **#${city.id} ${c}**, ${city.state} for your location. What would you like to know?`;
    }
  }

  // 2. SPECIFIC WEATHER METRICS: ANSWER ONLY WHAT IS ASKED
  const isRainQuery = q.includes('barish') || q.includes('बारिश') || q.includes('वर्षा') || q.includes('rain') || q.includes('precipitation');
  if (isRainQuery) {
    if (rainMm > 0.5) {
      return langCode === 'hi'
        ? `अगले 1 घंटे में **${rainMm} मिमी/घंटा** बारिश होने की संभावना है (${rainProb}% संभावना)।`
        : `Rain expected in the next 1 hour: **${rainMm} mm/h** (${rainProb}% chance).`;
    }
    return langCode === 'hi'
      ? `अगले 1 घंटे में **बारिश की संभावना नहीं है** (${rainMm} मिमी/घंटा, ${rainProb}% संभावना)।`
      : `No significant rain expected in the next 1 hour (${rainMm} mm/h, ${rainProb}% chance).`;
  }

  const isTempQuery = q.includes('temp') || q.includes('तापमान') || q.includes('गर्मी') || q.includes('heat') || q.includes('cold') || q.includes('ठंड');
  if (isTempQuery) {
    return langCode === 'hi'
      ? `वर्तमान तापमान **${temp}°C** है (महसूस हो रहा: ${feels}°C)।`
      : `The current temperature is **${temp}°C** (feels like ${feels}°C).`;
  }

  const isWindQuery = q.includes('wind') || q.includes('हवा') || q.includes('आंधी') || q.includes('तूफान');
  if (isWindQuery) {
    return langCode === 'hi'
      ? `हवा की गति **${wind} किमी/घंटा** (${telemetry.weather.windDirection}) है।`
      : `Wind speed is **${wind} km/h** (${telemetry.weather.windDirection}).`;
  }

  const isHumidityQuery = q.includes('humidity') || q.includes('आर्द्रता') || q.includes('उमस') || q.includes('सीलन');
  if (isHumidityQuery) {
    return langCode === 'hi'
      ? `वर्तमान में हवा में आर्द्रता (Humidity) **${humidity}%** है।`
      : `Relative humidity is **${humidity}%**.`;
  }

  const isAqiQuery = q.includes('aqi') || q.includes('pollution') || q.includes('प्रदूषण') || q.includes('हवा की गुणवत्ता');
  if (isAqiQuery) {
    return langCode === 'hi'
      ? `वायु गुणवत्ता सूचकांक (AQI) **${aqi}** (${aqiStatus}) है।`
      : `Air Quality Index (AQI) is **${aqi}** (${aqiStatus}).`;
  }

  // 3. SPECIFIC DISASTER / HAZARD / ALERT QUERY
  const isHazardQuery = q.includes('disaster') || q.includes('आपदा') || q.includes('alert') || q.includes('अलर्ट') || q.includes('खतरा') || q.includes('hazard') || q.includes('emergency') || q.includes('हेल्पलाइन') || q.includes('cyclone') || q.includes('flood');
  if (isHazardQuery) {
    if (langCode === 'hi') {
      return `🚨 **${c} आपदा स्थिति:** जोखिम स्तर **${riskLevel}** (${riskScore}/100)। मुख्य खतरा: **${hazard}** (समय: ${leadTime})। ${telemetry.disaster.activeNDMAProtocol}`;
    }
    return `🚨 **${c} Hazard Status:** Risk level **${riskLevel}** (${riskScore}/100). Primary hazard: **${hazard}** (Lead time: ${leadTime}). ${telemetry.disaster.activeNDMAProtocol}`;
  }

  // 4. SPECIFIC AGRO / CROP / IRRIGATION QUERIES
  const isIrrigationQuery = q.includes('irrigation') || q.includes('सिंचाई') || q.includes('पानी देना') || q.includes('water');
  if (isIrrigationQuery) {
    let adviceHi = '';
    let adviceEn = '';
    if (soilMoisture < 35 && rainMm < 1) {
      adviceHi = `मिट्टी में नमी कम (${soilMoisture}%) है और बारिश नहीं है, अतः **हल्की सिंचाई तुरंत करें**।`;
      adviceEn = `Soil moisture is low (${soilMoisture}%) with no rain; **light irrigation is recommended**.`;
    } else if (soilMoisture > 65 || rainMm >= 1) {
      adviceHi = `मिट्टी में पर्याप्त नमी (${soilMoisture}%) है और बारिश संभव है, अतः **सिंचाई स्थगित रखें**।`;
      adviceEn = `Soil moisture is high (${soilMoisture}%) with rain likely; **pause irrigation**.`;
    } else {
      adviceHi = `मिट्टी की नमी ${soilMoisture}% सामान्य है। ${irrigation}`;
      adviceEn = `Soil moisture is ${soilMoisture}%. ${irrigation}`;
    }
    return langCode === 'hi' ? `${crop} फसल: ${adviceHi}` : `For ${crop}: ${adviceEn}`;
  }

  const isFertilizerQuery = q.includes('fertilizer') || q.includes('खाद') || q.includes('उर्वरक') || q.includes('nutrient');
  if (isFertilizerQuery) {
    return langCode === 'hi'
      ? `${crop} के लिए खाद/पोषक सलाह: ${telemetry.agro.fertilizerTip}`
      : `Fertilizer advice for ${crop}: ${telemetry.agro.fertilizerTip}`;
  }

  const isPestQuery = q.includes('pest') || q.includes('कीट') || q.includes('रोग') || q.includes('spray') || q.includes('छिड़काव');
  if (isPestQuery) {
    return langCode === 'hi'
      ? `${crop} कीट जोखिम: **${telemetry.agro.pestRisk}**। ${telemetry.agro.pestDetails}`
      : `Pest risk for ${crop}: **${telemetry.agro.pestRisk}**. ${telemetry.agro.pestDetails}`;
  }

  const isAgroQuery = q.includes('crop') || q.includes('फसल') || q.includes('soil') || q.includes('मिट्टी') || q.includes('moisture') || q.includes('नमी');
  if (isAgroQuery) {
    return langCode === 'hi'
      ? `${crop} के लिए मिट्टी की नमी **${soilMoisture}%** (${soilStatus}) है। ${irrigation}`
      : `For ${crop}: Soil moisture is **${soilMoisture}%** (${soilStatus}). ${irrigation}`;
  }

  // 5. GENERAL WEATHER QUERY (e.g. "aaj ka mausam" / "weather today")
  const isGeneralWeather = q.includes('मौसम') || q.includes('weather') || q.includes('nowcast');
  if (isGeneralWeather) {
    return langCode === 'hi'
      ? `**${c} मौसम:** तापमान ${temp}°C, बारिश ${rainMm} मिमी/घं (${rainProb}%), आर्द्रता ${humidity}%, हवा ${wind} किमी/घं।`
      : `**${c} Weather:** Temp ${temp}°C, Rain ${rainMm} mm/h (${rainProb}%), Humidity ${humidity}%, Wind ${wind} km/h.`;
  }

  // 6. DEFAULT DIRECT SUMMARY (1 concise line)
  if (langCode === 'hi') {
    return `**${c} स्थिति:** तापमान ${temp}°C, बारिश ${rainMm} मिमी/घं, मिट्टी नमी ${soilMoisture}%, अलर्ट: ${riskLevel}।`;
  }

  return `**${c} Status:** Temp ${temp}°C, Rain ${rainMm} mm/h, Soil Moisture ${soilMoisture}%, Alert: ${riskLevel}.`;
}

// 7. Conversational Multilingual Agentic Chatbox with Google Gemini API
app.post("/api/ai/agent-chat", async (req, res) => {
  try {
    const { messages, cityId, crop, languageCode } = req.body;
    const targetCity = (cityId ? findCityById(String(cityId)) : null) || CITIES_130_MASTER[0];
    const modelOutput = generateModelOutputsForCity(targetCity, crop);
    const lang = (languageCode || 'hi').toLowerCase();

    const lastUserMessage = Array.isArray(messages) && messages.length > 0
      ? messages[messages.length - 1].content || messages[messages.length - 1].text || ""
      : "Hello";

    const ai = getGeminiClient();
    if (!ai) {
      const fallbackReply = getMultilingualFallbackResponse(
        lastUserMessage,
        targetCity,
        modelOutput,
        lang
      );
      res.json({
        reply: fallbackReply,
        model: "WeatherGPT-Local-Engine",
        city: targetCity,
        languageCode: lang,
      });
      return;
    }

    const languageNames: Record<string, string> = {
      hi: "Hindi (हिंदी)",
      en: "Indian English",
      bn: "Bengali (বাংলা)",
      te: "Telugu (తెలుగు)",
      mr: "Marathi (मराठी)",
      ta: "Tamil (தமிழ்)",
      gu: "Gujarati (ગુજરાતી)",
      kn: "Kannada (ಕನ್ನಡ)",
      ml: "Malayalam (മലയാളം)",
      pa: "Punjabi (ਪੰਜਾਬੀ)",
      or: "Odia (ଓଡ଼ିଆ)",
    };

    const targetLangLabel = languageNames[lang] || "Hindi (हिंदी)";

    const systemInstruction = `You are "WeatherGPT AI Agent", an accurate meteorological and agricultural assistant for India.

CRITICAL DIRECTIVE - STRICT MINIMALISM & RELEVANCE:
1. GIVE ONLY THE DIRECT ANSWER TO EXACTLY WHAT THE USER ASKS. DO NOT GIVE UNNECESSARY THINGS OR UNREQUESTED METRICS.
   - If the user asks about rain (e.g., "अगले 1 घंटे में क्या बारिश होगी?", "will it rain?", "barish kab hogi?"): Answer ONLY about rain/precipitation (probability, mm/h, time). DO NOT mention wind speed, temperature, humidity, AQI, crop data, or emergency helpline numbers unless specifically asked.
   - If the user asks about temperature: Answer ONLY about the temperature and feels-like temperature.
   - If the user asks about wind: Answer ONLY the wind speed and direction.
   - If the user asks about air quality/AQI: Answer ONLY the AQI number and status category.
   - If the user asks about disaster or hazard alerts: Answer ONLY the hazard risk level and safety directives.
   - If the user asks about crop, irrigation, fertilizer, or pests: Answer ONLY that specific agricultural query.
   - If the user sends a simple greeting ("hi", "hello", "namaste", "pranam"): Reply with a brief, friendly 1-sentence greeting acknowledging station #${targetCity.id} ${targetCity.name} and ask how you can assist. DO NOT output any weather/crop tables.

2. LENGTH & FORMAT:
   - Provide concise, direct responses (1 to 2 sentences). No unrequested bullet lists, no multi-category data dumps, no markdown tables unless the user explicitly requested a "full report".
   - Ground strictly in the provided real-time station telemetry. Never fabricate numbers.
   - Match user language: current interface language is ${targetLangLabel}, or answer in the specific language used by the user (Hindi, Hinglish, English, etc.).`;

    const liveTelemetry = `CURRENT LIVE TELEMETRY FOR STATION:
City: ${targetCity.name} (#${targetCity.id}), State: ${targetCity.state}, Zone: ${targetCity.zone}
Coordinates: Lat ${targetCity.lat}, Lng ${targetCity.lng}
1. 1-Hour Weather Nowcast:
   - Temp: ${modelOutput.weather.tempC}°C (Feels like: ${modelOutput.weather.feelsLikeC}°C)
   - Condition: ${modelOutput.weather.condition}
   - Rain: ${modelOutput.weather.precipitationMm} mm/hr (${modelOutput.weather.precipProb}% probability)
   - Wind: ${modelOutput.weather.windSpeedKmh} km/h (${modelOutput.weather.windDirection})
   - Humidity: ${modelOutput.weather.humidity}%
   - Cloud Cover: ${modelOutput.weather.cloudCover}%
   - AQI: ${modelOutput.weather.aqi} (${modelOutput.weather.aqiStatus})
   - Radar Trend: ${modelOutput.weather.forecastNext1h}
2. 3-Hour Disaster Risk:
   - Risk Level: ${modelOutput.disaster.riskLevel} (Score: ${modelOutput.disaster.riskScore}/100)
   - Primary Hazard: ${modelOutput.disaster.primaryHazard}
   - Lead Time: ${modelOutput.disaster.leadTime}
   - Impact Radius: ${modelOutput.disaster.impactRadiusKm} km
   - Protocol: ${modelOutput.disaster.activeNDMAProtocol}
   - Safety Directives: ${modelOutput.disaster.safetyChecklist.join("; ")}
   - NDMA Hotline: 1078 / 112
3. Agro Crop Intelligence:
   - Target Crop: ${modelOutput.agro.cropName} (Suitability: ${modelOutput.agro.suitabilityScore}%)
   - Soil Moisture: ${modelOutput.agro.soilMoisturePct}% (${modelOutput.agro.soilStatus})
   - Irrigation Advisory: ${modelOutput.agro.irrigationAdvisory}
   - Pest Risk: ${modelOutput.agro.pestRisk} (${modelOutput.agro.pestDetails})
   - Fertilizer Tip: ${modelOutput.agro.fertilizerTip}`;

    const recentContext = Array.isArray(messages)
      ? messages.slice(-4).map((m: any) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content || m.text || ''}`).join('\n')
      : `User: ${lastUserMessage}`;

    const fullPrompt = `${liveTelemetry}\n\nCONVERSATION CONTEXT:\n${recentContext}\n\nUser Question/Voice Input: ${lastUserMessage}\n\nRespond in ${targetLangLabel} addressing the user's intent directly.`;

    const genResult = await generateGeminiContentWithFallback(
      ai,
      fullPrompt,
      systemInstruction,
      0.4
    );

    if (!genResult) {
      const fallback = getMultilingualFallbackResponse(
        lastUserMessage,
        targetCity,
        modelOutput,
        lang
      );
      res.json({
        reply: fallback,
        model: "WeatherGPT-Engine",
        city: targetCity,
        languageCode: lang,
      });
      return;
    }

    res.json({
      reply: genResult.text,
      model: genResult.model,
      city: targetCity,
      languageCode: lang,
    });
  } catch (_err) {
    let targetCity = CITIES_130_MASTER[0];
    if (req.body?.cityId) {
      const found = findCityById(String(req.body.cityId));
      if (found) targetCity = found;
    }
    const modelOutput = generateModelOutputsForCity(targetCity);
    const lastMsg = req.body?.messages?.[req.body?.messages?.length - 1]?.content || "";
    const lang = req.body?.languageCode || 'hi';
    const fallback = getMultilingualFallbackResponse(
      lastMsg,
      targetCity,
      modelOutput,
      lang
    );
    res.json({
      reply: fallback,
      model: "WeatherGPT-Engine",
      city: targetCity,
      languageCode: lang,
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`WeatherGPT Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
