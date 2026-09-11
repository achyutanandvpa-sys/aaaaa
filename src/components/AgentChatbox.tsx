import React, { useState, useEffect, useRef } from 'react';
import { CityModelOutput, SupportedCrop } from '../types.ts';
import {
  IndianLanguageCode,
  INDIAN_LANGUAGES,
} from '../data/indianLanguages.ts';
import { voiceAssistant } from '../services/voiceService.ts';
import {
  Bot,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  MapPin,
  RefreshCw,
  X,
  ChevronDown,
  Globe,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  languageCode?: IndianLanguageCode;
  modelBadge?: string;
  isSpeaking?: boolean;
}

interface AgentChatboxProps {
  currentCity: CityModelOutput;
  allCities: CityModelOutput[];
  selectedCrop?: SupportedCrop;
  onSelectCity?: (city: CityModelOutput) => void;
  onClose?: () => void;
  isMobileEmbedded?: boolean;
}

export const AgentChatbox: React.FC<AgentChatboxProps> = ({
  currentCity,
  allCities,
  selectedCrop,
  onSelectCity,
  onClose,
  isMobileEmbedded = false,
}) => {
  const [selectedLang, setSelectedLang] = useState<IndianLanguageCode>('hi');
  const [selectedCityId, setSelectedCityId] = useState<number>(currentCity.city.id);
  const [inputText, setInputText] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [interimVoiceText, setInterimVoiceText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeSpeakingMsgId, setActiveSpeakingMsgId] = useState<string | null>(null);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState<boolean>(false);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);

  const activeLangConfig = INDIAN_LANGUAGES[selectedLang] || INDIAN_LANGUAGES.hi;

  // Initialize conversation with multilingual greeting
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome-1',
      role: 'assistant',
      text: activeLangConfig.welcomeMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      languageCode: selectedLang,
      modelBadge: 'Gemini 3.8 Flash',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Keep internal city ID in sync if external currentCity changes
    setSelectedCityId(currentCity.city.id);
  }, [currentCity.city.id]);

  useEffect(() => {
    // Scroll to bottom on new messages
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, interimVoiceText, isLoading]);

  // Handle language switch
  const handleLanguageChange = (langCode: IndianLanguageCode) => {
    setSelectedLang(langCode);
    setIsLangDropdownOpen(false);
    const newConfig = INDIAN_LANGUAGES[langCode];
    // Add assistant announcement in new language
    const welcomeMsg: ChatMessage = {
      id: `lang-switch-${Date.now()}`,
      role: 'assistant',
      text: newConfig.welcomeMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      languageCode: langCode,
      modelBadge: 'Gemini 3.8 Flash',
    };
    setMessages((prev) => [...prev, welcomeMsg]);
  };

  // Send message to backend Gemini API
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    // Stop listening if active
    if (isListening) {
      voiceAssistant.stopListening();
      setIsListening(false);
      setInterimVoiceText('');
    }

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      languageCode: selectedLang,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setInterimVoiceText('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/agent-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({
            role: m.role === 'user' ? 'user' : 'model',
            content: m.text,
          })),
          cityId: selectedCityId,
          crop: selectedCrop || currentCity.agro.crop,
          languageCode: selectedLang,
        }),
      });

      const data = await response.json();
      const replyText = data.reply || activeLangConfig.welcomeMessage;

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        languageCode: selectedLang,
        modelBadge: data.model || 'Gemini 3.8 Flash',
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (_err) {
      const fallbackMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        text: `⚠️ Network timeout or connection interrupted. Here is live telemetry for ${currentCity.city.name}: ${currentCity.weather.tempC}°C, Rain: ${currentCity.weather.precipitationMm} mm/h. Please retry your inquiry.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        languageCode: selectedLang,
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Start Voice Recognition in selected Indian language
  const handleToggleVoiceInput = () => {
    if (isListening) {
      voiceAssistant.stopListening();
      setIsListening(false);
      setInterimVoiceText('');
      return;
    }

    setVoiceNotice(null);
    const started = voiceAssistant.startListening({
      languageCode: selectedLang,
      onStart: () => {
        setIsListening(true);
        setInterimVoiceText('');
      },
      onResult: (transcript, isFinal) => {
        if (isFinal) {
          setIsListening(false);
          setInterimVoiceText('');
          setInputText(transcript);
          // Auto send after brief verification pause
          handleSendMessage(transcript);
        } else {
          setInterimVoiceText(transcript);
        }
      },
      onError: (errMsg) => {
        setIsListening(false);
        setInterimVoiceText('');
        setVoiceNotice(errMsg);
        setTimeout(() => setVoiceNotice(null), 5000);
      },
      onEnd: () => {
        setIsListening(false);
      },
    });

    if (!started) {
      setVoiceNotice('Voice recognition not supported in this browser. Please use quick voice prompts below.');
      setTimeout(() => setVoiceNotice(null), 5000);
    }
  };

  // Text-To-Speech audio readout
  const handleReadAloud = (msg: ChatMessage) => {
    if (activeSpeakingMsgId === msg.id) {
      voiceAssistant.stopSpeaking();
      setActiveSpeakingMsgId(null);
      return;
    }

    setActiveSpeakingMsgId(msg.id);
    voiceAssistant.speakText(msg.text, msg.languageCode || selectedLang, () => {
      setActiveSpeakingMsgId(null);
    });
  };

  const handleCitySelectChange = (cityId: number) => {
    setSelectedCityId(cityId);
    const cityObj = allCities.find((c) => c.city.id === cityId);
    if (cityObj && onSelectCity) {
      onSelectCity(cityObj);
    }
  };

  return (
    <div
      className={`flex flex-col w-full h-full bg-[#080d1a] ${
        isMobileEmbedded
          ? 'rounded-none'
          : 'rounded-2xl border border-slate-800 shadow-2xl overflow-hidden'
      } font-mono text-xs text-slate-200 select-none`}
    >
      {/* Top Header */}
      <div className="p-3 sm:p-4 bg-slate-950/95 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600/30 to-emerald-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-bold text-white text-xs sm:text-sm">
              <span>WeatherGPT AI Agent</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-normal">
                Google Gemini API
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-sans hidden sm:block">
              130 Cities • 1h Weather • 3h Hazard Radar • Agro Intel
            </p>
          </div>
        </div>

        {/* Top Header Controls: Language Selector & Close Button */}
        <div className="flex items-center gap-2">
          {/* Language Selector Dropdown */}
          <div className="relative">
            <button
              id="chat-language-selector-btn"
              onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-cyan-700/60 text-cyan-300 font-bold text-[11px] transition-colors"
            >
              <span>{activeLangConfig.flag}</span>
              <span>{activeLangConfig.nativeName}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isLangDropdownOpen && (
              <div className="absolute right-0 mt-1 w-44 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl z-50 p-1 max-h-60 overflow-y-auto">
                <div className="text-[9px] uppercase tracking-wider text-slate-500 px-2 py-1 font-bold">
                  Select Indian Language
                </div>
                {Object.values(INDIAN_LANGUAGES).map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs transition-colors ${
                      selectedLang === lang.code
                        ? 'bg-cyan-950/80 text-cyan-300 font-bold border border-cyan-800/60'
                        : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <span>{lang.nativeName}</span>
                    <span className="text-[10px] text-slate-500">{lang.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Close Chat"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Target City Selector Bar */}
      <div className="p-2 px-3 bg-slate-900/80 border-b border-slate-850 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1.5 text-slate-400 text-[11px] min-w-0">
          <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="shrink-0">{activeLangConfig.labels.switchStation}:</span>
          <select
            value={selectedCityId}
            onChange={(e) => handleCitySelectChange(parseInt(e.target.value, 10))}
            className="bg-slate-950 text-cyan-300 font-bold text-[11px] rounded px-2 py-0.5 border border-slate-800 outline-none truncate max-w-[190px] cursor-pointer"
          >
            {allCities.map((c) => (
              <option key={c.city.id} value={c.city.id}>
                #{c.city.id} {c.city.name} ({c.city.state})
              </option>
            ))}
          </select>
        </div>

        <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60 shrink-0 font-bold">
          {Math.round(currentCity.weather.tempC)}°C • {currentCity.disaster.riskLevel}
        </span>
      </div>

      {/* Notice Banner (e.g. microphone status) */}
      {voiceNotice && (
        <div className="p-2 px-3 bg-amber-950/70 border-b border-amber-800/60 text-amber-300 text-[10px] flex items-center gap-2 font-sans">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
          <span>{voiceNotice}</span>
        </div>
      )}

      {/* Scrollable Conversation Stream */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 font-sans">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.role === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <div
              className={`max-w-[85%] sm:max-w-[80%] rounded-2xl p-3 sm:p-3.5 leading-relaxed text-xs shadow-md ${
                msg.role === 'user'
                  ? 'bg-cyan-600 text-white rounded-br-xs font-medium'
                  : 'bg-slate-900/90 text-slate-200 border border-slate-800 rounded-bl-xs'
              }`}
            >
              {/* Assistant Message Header */}
              {msg.role === 'assistant' && (
                <div className="flex items-center justify-between gap-2 pb-1 mb-1.5 border-b border-slate-800 font-mono text-[10px] text-slate-400">
                  <div className="flex items-center gap-1 text-cyan-400 font-bold">
                    <Sparkles className="w-3 h-3" />
                    <span>WeatherGPT Assistant</span>
                  </div>
                  {msg.modelBadge && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-950 border border-slate-800 text-slate-400">
                      {msg.modelBadge}
                    </span>
                  )}
                </div>
              )}

              {/* Message Content */}
              <div className="whitespace-pre-wrap font-sans text-[12px] leading-relaxed">
                {msg.text}
              </div>

              {/* Message Bottom Footer: Time & TTS Button */}
              <div className="flex items-center justify-between gap-2 mt-2 pt-1 border-t border-slate-800/40 text-[10px] font-mono text-slate-400">
                <span>{msg.timestamp}</span>
                {msg.role === 'assistant' && (
                  <button
                    onClick={() => handleReadAloud(msg)}
                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors ${
                      activeSpeakingMsgId === msg.id
                        ? 'bg-cyan-900 text-cyan-300 animate-pulse'
                        : 'hover:bg-slate-800 text-slate-400 hover:text-cyan-300'
                    }`}
                    title="Audio Readout in Native Language"
                  >
                    {activeSpeakingMsgId === msg.id ? (
                      <>
                        <VolumeX className="w-3 h-3" />
                        <span>Speaking...</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3 h-3" />
                        <span>Listen 🔊</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Live Listening Feedback State */}
        {isListening && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-cyan-950/60 border border-cyan-700/60 text-cyan-300 font-mono text-[11px] animate-pulse">
            <div className="w-3 h-3 rounded-full bg-cyan-400 animate-ping" />
            <div className="flex-1 truncate">
              <span className="font-bold">{activeLangConfig.listeningText}: </span>
              <span className="text-white italic">{interimVoiceText || '...'}</span>
            </div>
            <button
              onClick={() => voiceAssistant.stopListening()}
              className="text-[10px] bg-cyan-900 hover:bg-cyan-800 px-2 py-0.5 rounded text-white"
            >
              Stop
            </button>
          </div>
        )}

        {/* Loading Spinner State */}
        {isLoading && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-400 text-xs font-mono">
            <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
            <span>WeatherGPT Agent is synthesizing model telemetry...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Multilingual Quick Query Chips */}
      <div className="p-2 border-t border-slate-800/80 bg-slate-950/80 shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[11px]">
          <span className="text-[10px] text-slate-500 uppercase font-bold shrink-0">
            {activeLangConfig.labels.voiceSearch}:
          </span>
          {activeLangConfig.samplePrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(p)}
              disabled={isLoading}
              className="px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-700/60 text-slate-300 hover:text-cyan-300 whitespace-nowrap transition-colors shrink-0 text-[11px] font-sans disabled:opacity-50"
            >
              💬 {p}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Input Bar with Voice Button & Send */}
      <div className="p-2 sm:p-3 border-t border-slate-800 bg-slate-950 shrink-0">
        <div className="flex items-center gap-1.5 bg-slate-900 rounded-xl p-1 border border-slate-800 focus-within:border-cyan-600/70 transition-colors">
          {/* Voice Input Mic Button */}
          <button
            id="agent-chat-voice-btn"
            onClick={handleToggleVoiceInput}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all shrink-0 ${
              isListening
                ? 'bg-rose-600 text-white animate-pulse shadow-[0_0_12px_rgba(244,63,94,0.6)]'
                : 'bg-slate-800 hover:bg-cyan-950 text-cyan-400 hover:text-cyan-300 border border-slate-700 hover:border-cyan-600/50'
            }`}
            title={`${activeLangConfig.labels.speakNow} (${activeLangConfig.name})`}
          >
            {isListening ? (
              <MicOff className="w-4 h-4" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </button>

          {/* Text Input Field */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isLoading) {
                handleSendMessage();
              }
            }}
            placeholder={
              isListening
                ? activeLangConfig.listeningText
                : `${activeLangConfig.micPrompt}`
            }
            className="flex-1 bg-transparent px-2 py-1 text-xs text-white placeholder-slate-500 outline-none font-sans"
          />

          {/* Send Button */}
          <button
            id="agent-chat-send-btn"
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim() || isLoading}
            className="w-9 h-9 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-white disabled:text-slate-600 flex items-center justify-center transition-colors shrink-0"
            title={activeLangConfig.labels.send}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
