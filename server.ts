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
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
}

// Resilient Gemini Generator with multi-tier fallback to handle 503 high-demand spikes
async function generateGeminiContentWithFallback(
  ai: GoogleGenAI,
  prompt: string,
  systemInstruction: string,
  temperature: number = 0.35
): Promise<{ text: string; model: string }> {
  // Tier 1: Try gemini-3.8-flash first with 7s timeout
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
      7000,
      "gemini-3.8-flash"
    );
    if (res.text) {
      return { text: res.text, model: "gemini-3.8-flash" };
    }
  } catch (err: any) {
    console.warn("gemini-3.8-flash busy/unavailable/timed-out (503/demand spike), attempting gemini-3.6-flash fallback:", err?.message || err);
  }

  // Tier 2: Try gemini-3.6-flash if 3.8 is overloaded with 6s timeout
  try {
    const res = await withTimeout(
      ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          systemInstruction,
          temperature,
        },
      }),
      6000,
      "gemini-3.6-flash"
    );
    if (res.text) {
      return { text: res.text, model: "gemini-3.6-flash" };
    }
  } catch (err: any) {
    console.warn("gemini-3.6-flash also busy/unavailable/timed-out, attempting gemini-3.1-flash-lite fallback:", err?.message || err);
  }

  // Tier 3: Try gemini-3.1-flash-lite if 3.6 is overloaded with 5s timeout
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
      5000,
      "gemini-3.1-flash-lite"
    );
    if (res.text) {
      return { text: res.text, model: "gemini-3.1-flash-lite" };
    }
  } catch (err: any) {
    console.warn("gemini-3.1-flash-lite also busy/unavailable/timed-out:", err?.message || err);
  }

  throw new Error("All Gemini models temporarily at peak demand");
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

    res.json({
      report: genResult.text,
      model: genResult.model,
      city: targetCity,
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.warn("AI Analysis Graceful Fallback:", error?.message);
    res.json({
      report: generateTelemetrySynthesisReport(targetCity, modelOutput, customPrompt, focusArea),
      model: "WeatherGPT-Synthesis-Engine (High Demand Mode)",
      city: targetCity,
    });
  }
});

// Helper for high-fidelity multilingual fallback answers
function getMultilingualFallbackResponse(
  query: string,
  city: any,
  telemetry: any,
  langCode: string
): string {
  const q = (query || "").toLowerCase();
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
  const pestRisk = telemetry.agro.pestRisk;

  switch (langCode) {
    case 'hi':
      if (q.includes('barish') || q.includes('बारिश') || q.includes('मौसम') || q.includes('rain') || q.includes('weather')) {
        return `🌦️ **${c} का 1-घंटा मौसम रडार:**\n- वर्तमान तापमान: **${temp}°C** (महसूस हो रहा: ${feels}°C)\n- बारिश का अनुमान: **${rainMm} मिमी/घं (${rainProb}% संभावना)**\n- हवा की गति: ${wind} किमी/घंटा, नमी: ${humidity}%\n- वायु गुणवत्ता (AQI): **${aqi} (${aqiStatus})**\n- 60-मिनट पूर्वानुमान: ${telemetry.weather.forecastNext1h}`;
      }
      if (q.includes('disaster') || q.includes('आपदा') || q.includes('alert') || q.includes('अलर्ट') || q.includes('खतरा')) {
        return `🚨 **${c} 3-घंटे का आपदा जोखिम चेतावनी:**\n- जोखिम स्तर: **${riskLevel} (${riskScore}/100)**\n- मुख्य खतरा: **${hazard}** (समय: ${leadTime})\n- सक्रिय प्रोटोकॉल: ${telemetry.disaster.activeNDMAProtocol}\n- आपातकालीन हेल्पलाइन: **1078 (एनडीएमए) / 112**`;
      }
      return `🌾 **${c} के लिए विस्तृत मौसम एवं कृषि सलाह:**\n- मौसम: ${temp}°C, नमी: ${humidity}%, बारिश: ${rainMm} mm/hr\n- फसल: **${crop}** (उपयुक्तता: ${telemetry.agro.suitabilityScore}%)\n- मिट्टी की नमी: ${soilMoisture}% | सिंचाई: ${irrigation}\n- कीट जोखिम: ${pestRisk} | आपदा चेतावनी: ${riskLevel} (${hazard})`;

    case 'bn':
      return `🌦️ **${c} আবহাওয়া ও দুর্যোগ সতর্কতা (WeatherGPT):**\n- তাপমাত্রা: **${temp}°C** | আর্দ্রতা: **${humidity}%**\n- বৃষ্টিপাত: **${rainMm} মিমি (${rainProb}%)** | বাতাসের গতি: ${wind} কিমি/ঘণ্টা\n- ৩-ঘণ্টার দুর্যোগের ঝুঁকি: **${riskLevel}** (${hazard}, লিড টাইম: ${leadTime})\n- ফসল (${crop}): মাটির আর্দ্রতা ${soilMoisture}%, সেচ: ${irrigation}\n- জরুরি সহায়তা: **1078 / 112**`;

    case 'te':
      return `🌦️ **${c} వాతావరణం మరియు విపత్తు నివేదిక:**\n- ఉష్ణోగ్రత: **${temp}°C** (తేమ: ${humidity}%, గాలి: ${wind} km/h)\n- రాబోయే 1 గంట వర్షపాతం: **${rainMm} mm (${rainProb}%)**\n- 3-గంటల విపత్తు ముప్పు: **${riskLevel}** (${hazard}, సమయం: ${leadTime})\n- వ్యవసాయ సలహా (${crop}): నేల తేమ ${soilMoisture}%, నీటిపారుదల: ${irrigation}\n- అత్యవసర హెల్ప్‌లైన్: **1078 / 112**`;

    case 'ta':
      return `🌦️ **${c} நேரடி வானிலை மற்றும் பேரிடர் முன்னறிவிப்பு:**\n- வெப்பநிலை: **${temp}°C** | ஈரப்பதம்: **${humidity}%**\n- 1 மணிநேர மழை: **${rainMm} மிமீ (${rainProb}%)**\n- 3 மணிநேர பேரிடர் எச்சரிக்கை: **${riskLevel}** (${hazard}, அவகாசம்: ${leadTime})\n- வேளாண் வழிகாட்டல் (${crop}): மண் ஈரம் ${soilMoisture}%, பாசனம்: ${irrigation}\n- தேசிய அவசர உதவி எண்: **1078 / 112**`;

    case 'mr':
      return `🌦️ **${c} थेट हवामान आणि आपत्ती इशारा:**\n- तापमान: **${temp}°C** (जाणवणारे: ${feels}°C), आर्द्रता: **${humidity}%**\n- पुढील १ तासात पाऊस: **${rainMm} मिमी (${rainProb}% शक्यता)**\n- ३-तास आपत्ती धोका: **${riskLevel}** (${hazard}, वेळ: ${leadTime})\n- पीक सल्ला (${crop}): मातीतील ओलावा ${soilMoisture}%, सिंचन: ${irrigation}\n- राष्ट्रीय आपत्ती हेल्पलाईन: **1078 / 112**`;

    case 'gu':
      return `🌦️ **${c} લાઈવ હવામાન અને આપત્તિ ચેતવણી:**\n- તાપમાન: **${temp}°C** | ભેજ: **${humidity}%**\n- આગામી 1 કલાક વરસાદ: **${rainMm} મિમી (${rainProb}%)**\n- 3-કલાક આપત્તિ જોખમ: **${riskLevel}** (${hazard})\n- કૃષિ સલાહ (${crop}): જમીનનો ભેજ ${soilMoisture}%, પિયત: ${irrigation}\n- ઈમરજન્સી હેલ્પલાઈન: **1078 / 112**`;

    case 'kn':
      return `🌦️ **${c} ಹವಾಮಾನ ಮತ್ತು ವಿಪತ್ತು ಮುನ್ಸೂಚನೆ:**\n- ತಾಪಮಾನ: **${temp}°C**, ತೇವಾಂಶ: **${humidity}%**\n- 1 ಗಂಟೆಯ ಮಳೆ: **${rainMm} mm (${rainProb}%)**\n- 3 ಗಂಟೆಯ ವಿಪತ್ತು ಎಚ್ಚರಿಕೆ: **${riskLevel}** (${hazard})\n- ಬೆಳೆ ಮಾಹಿತಿ (${crop}): ಮಣ್ಣಿನ ತೇವಾಂಶ ${soilMoisture}%, ನೀರಾವರಿ: ${irrigation}\n- ತುರ್ತು ಸಹಾಯವಾಣಿ: **1078 / 112**`;

    case 'ml':
      return `🌦️ **${c} തത്സമയ കാലാവസ്ഥയും ദുരന്ത മുന്നറിയിപ്പും:**\n- താപനില: **${temp}°C** | ഈർപ്പം: **${humidity}%**\n- 1 മണിക്കൂറിലെ മഴ: **${rainMm} mm (${rainProb}%)**\n- 3 മണിക്കൂറിലെ ദുരന്ത സാധ്യത: **${riskLevel}** (${hazard})\n- കൃഷി നിർദ്ദേശം (${crop}): മണ്ണിലെ ഈർപ്പം ${soilMoisture}%, ജലസേചനം: ${irrigation}\n- ദുരന്ത നിവാരണ ഹെൽപ്പ്‌ലൈൻ: **1078 / 112**`;

    case 'pa':
      return `🌦️ **${c} ਲਾਈਵ ਮੌਸਮ ਅਤੇ ਆਫ਼ਤ ਚਿਤਾਵਨੀ:**\n- ਤਾਪਮਾਨ: **${temp}°C**, ਨਮੀ: **${humidity}%**\n- ਅਗਲੇ 1 ਘੰਟੇ ਵਿੱਚ ਮੀਂਹ: **${rainMm} mm (${rainProb}%)**\n- 3 ਘੰਟਿਆਂ ਦਾ ਆਫ਼ਤ ਖ਼ਤਰਾ: **${riskLevel}** (${hazard})\n- ਖੇਤੀ ਸਲਾਹ (${crop}): ਮਿੱਟੀ ਦੀ ਨਮੀ ${soilMoisture}%, ਸਿੰਚਾਈ: ${irrigation}\n- ਐਮਰਜੈਂਸੀ ਹੈਲਪਲਾਈਨ: **1078 / 112**`;

    case 'or':
      return `🌦️ **${c} ପାଣିପାଗ ଏବଂ ବିପର୍ଯ୍ୟୟ ଚେତାବନୀ:**\n- ତାପମାତ୍ରା: **${temp}°C**, ଆର୍ଦ୍ରତା: **${humidity}%**\n- ୧-ଘଣ୍ଟାର ବର୍ଷା: **${rainMm} mm (${rainProb}%)**\n- ୩-ଘଣ୍ଟା ବିପର୍ଯ୍ୟୟ ବିପଦ: **${riskLevel}** (${hazard})\n- କୃଷି ପରାମର୍ଶ (${crop}): ମାଟିର ଆର୍ଦ୍ରତା ${soilMoisture}%, ଜଳସେଚନ: ${irrigation}\n- ଜରୁରୀକାଳୀନ ହେଲ୍ପଲାଇନ: **1078 / 112**`;

    default:
      return `🌦️ **WeatherGPT Live Operational Intel for ${c}:**\n- **1-Hour Nowcast:** ${temp}°C (Feels ${feels}°C), Rain: ${rainMm} mm/h (${rainProb}% prob), Wind: ${wind} km/h, Humidity: ${humidity}%, AQI: ${aqi} (${aqiStatus})\n- **3-Hour Disaster Risk:** ${riskLevel} (${riskScore}/100) - ${hazard} [Lead Time: ${leadTime}]\n- **Agro Intel:** Target Crop: ${crop}, Soil Moisture: ${soilMoisture}%, Irrigation: ${irrigation}\n- **Emergency NDMA Hotline:** 1078 or 112`;
  }
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

    const systemInstruction = `You are WeatherGPT India's premier conversational AI Agentic Assistant for 130 cities across India.
You integrate three AI/ML models:
1. 1-Hour Weather Nowcast (hyper-local rain radar, temperature, wind, humidity, AQI)
2. 3-Hour Disaster Risk Early Warning (NDMA protocols, cyclone/flood/heatwave lead time, helpline 1078/112)
3. Agro-Meteorological Crop Intelligence (crop suitability, soil moisture, irrigation schedule, pest & pathogen control)

MANDATORY MULTILINGUAL RULE:
The user selected language is: ${targetLangLabel}.
You MUST reply fluently, naturally, and warmly in ${targetLangLabel} (in its native script, or English if English is selected).
Use clear, concise bullet points and bold formatting. Keep responses easy to understand for farmers, citizens, and disaster teams.
Always mention exact figures (temperature, rain mm, risk score, lead time) from the provided live telemetry.`;

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

    res.json({
      reply: genResult.text,
      model: genResult.model,
      city: targetCity,
      languageCode: lang,
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.warn("Agent Chat Fallback Activated:", error?.message);
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
      model: "WeatherGPT-Safe-Fallback",
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
