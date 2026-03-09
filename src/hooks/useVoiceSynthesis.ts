import { useState, useCallback, useEffect } from 'react';

interface VoiceSynthesisOptions {
  voice?: SpeechSynthesisVoice | null;
  rate?: number;
  pitch?: number;
  volume?: number;
}

interface VoiceSynthesisHook {
  speak: (text: string) => void;
  cancel: () => void;
  speaking: boolean;
  voices: SpeechSynthesisVoice[];
  isSupported: boolean;
}

export const useVoiceSynthesis = (
  options: VoiceSynthesisOptions = {}
): VoiceSynthesisHook => {
  const { voice = null, rate = 1, pitch = 1, volume = 1 } = options;
  
  const [speaking, setSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Load voices
  useEffect(() => {
    if (!isSupported) return;

    const loadVoices = () => {
      const availableVoices = speechSynthesis.getVoices();
      setVoices(availableVoices);
    };

    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      speechSynthesis.onvoiceschanged = null;
    };
  }, [isSupported]);

  const speak = useCallback((text: string) => {
    if (!isSupported || !text) return;

    // Cancel any ongoing speech
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set voice (prioritize Italian female voices)
    const selectedVoice = voice || 
      voices.find(v => v.name.includes('Alice') || v.name.includes('Silvia')) ||
      voices.find(v => v.lang.startsWith('it')) ||
      voices.find(v => v.lang.startsWith('en')) ||
      voices[0];
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    speechSynthesis.speak(utterance);
  }, [isSupported, voice, voices, rate, pitch, volume]);

  const cancel = useCallback(() => {
    if (isSupported) {
      speechSynthesis.cancel();
      setSpeaking(false);
    }
  }, [isSupported]);

  return {
    speak,
    cancel,
    speaking,
    voices,
    isSupported,
  };
};