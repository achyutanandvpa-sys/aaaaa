/**
 * Voice Recognition & Speech Synthesis Utility for WeatherGPT India
 * Full support for 11 Indian Languages with Web Speech API & Text-to-Speech
 */

import { IndianLanguageCode, INDIAN_LANGUAGES } from '../data/indianLanguages.ts';

// Type definitions for Web Speech API
declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

export interface VoiceRecognitionOptions {
  languageCode: IndianLanguageCode;
  onResult: (transcript: string, isFinal: boolean) => void;
  onError: (error: string) => void;
  onEnd: () => void;
  onStart: () => void;
}

export class VoiceAssistantManager {
  private recognition: any = null;
  private isListening: boolean = false;
  private currentLangCode: IndianLanguageCode = 'hi';

  public isSpeechSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  public isTTSSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return 'speechSynthesis' in window;
  }

  public startListening(options: VoiceRecognitionOptions): boolean {
    this.stopListening();

    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      options.onError('Web Speech Recognition API is not supported in this browser environment. You can type or tap preset voice commands below.');
      return false;
    }

    try {
      this.recognition = new SpeechRecognitionClass();
      const langConfig = INDIAN_LANGUAGES[options.languageCode] || INDIAN_LANGUAGES.en;
      this.recognition.lang = langConfig.bcp47;
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;
      this.currentLangCode = options.languageCode;

      this.recognition.onstart = () => {
        this.isListening = true;
        options.onStart();
      };

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript.trim()) {
          options.onResult(finalTranscript.trim(), true);
        } else if (interimTranscript.trim()) {
          options.onResult(interimTranscript.trim(), false);
        }
      };

      this.recognition.onerror = (event: any) => {
        this.isListening = false;
        let errMsg = event?.error || 'Voice recognition error';
        if (event.error === 'not-allowed') {
          errMsg = 'Microphone permission denied. Please allow microphone access in your browser settings.';
        } else if (event.error === 'no-speech') {
          errMsg = 'No speech detected. Please speak closer to your microphone.';
        } else if (event.error === 'network') {
          errMsg = 'Speech network connectivity error.';
        }
        options.onError(errMsg);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        options.onEnd();
      };

      this.recognition.start();
      return true;
    } catch (err: any) {
      this.isListening = false;
      options.onError(err?.message || 'Could not start voice recognition.');
      return false;
    }
  }

  public stopListening() {
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch (_e) {
        // ignore
      }
      this.recognition = null;
    }
    this.isListening = false;
  }

  public getListeningState(): boolean {
    return this.isListening;
  }

  /**
   * Speaks out the text response in the matching Indian language voice
   */
  public speakText(text: string, langCode: IndianLanguageCode, onEnd?: () => void) {
    if (!this.isTTSSupported()) return;

    try {
      window.speechSynthesis.cancel(); // cancel any ongoing speech
      const cleanText = text.replace(/[*#_`]/g, '').slice(0, 350); // read first couple sentences clearly
      const utterance = new SpeechSynthesisUtterance(cleanText);
      const langConfig = INDIAN_LANGUAGES[langCode] || INDIAN_LANGUAGES.en;
      utterance.lang = langConfig.bcp47;
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      // Try finding best matching voice
      const voices = window.speechSynthesis.getVoices();
      const matchedVoice = voices.find(
        (v) => v.lang.toLowerCase().replace('_', '-') === langConfig.bcp47.toLowerCase()
      ) || voices.find((v) => v.lang.startsWith(langCode));

      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      if (onEnd) {
        utterance.onend = onEnd;
        utterance.onerror = onEnd;
      }

      window.speechSynthesis.speak(utterance);
    } catch (_e) {
      // ignore TTS errors
    }
  }

  public stopSpeaking() {
    if (this.isTTSSupported()) {
      window.speechSynthesis.cancel();
    }
  }
}

export const voiceAssistant = new VoiceAssistantManager();
