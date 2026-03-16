import { useState, useCallback, useEffect, useRef } from 'react';
import { azureSynthesizeSpeech, isAzureSpeechEnabled } from '@/lib/azureAI';

interface VoiceSynthesisOptions {
  voice?: SpeechSynthesisVoice | null;
  rate?: number;
  pitch?: number;
  volume?: number;
  /** Azure voice name (e.g. "it-IT-ElsaNeural"). Falls back to browser TTS. */
  azureVoice?: string;
  /** Language code used for Azure TTS (e.g. "it-IT"). */
  azureLang?: string;
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
  const {
    voice = null,
    rate = 1,
    pitch = 1,
    volume = 1,
    azureVoice = "it-IT-ElsaNeural",
    azureLang = "it-IT",
  } = options;

  const [speaking, setSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const isSupported =
    typeof window !== 'undefined' &&
    ('speechSynthesis' in window || isAzureSpeechEnabled());

  // Load browser voices
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const loadVoices = () => {
      const availableVoices = speechSynthesis.getVoices();
      setVoices(availableVoices);
    };

    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const cancel = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
    setSpeaking(false);
  }, []);

  // ── Browser Web Speech API helper ─────────────────────────────────────────
  const speakWithBrowser = useCallback(
    (text: string) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

      const utterance = new SpeechSynthesisUtterance(text);

      const selectedVoice =
        voice ||
        voices.find((v) => v.name.includes('Alice') || v.name.includes('Silvia')) ||
        voices.find((v) => v.lang.startsWith('it')) ||
        voices.find((v) => v.lang.startsWith('en')) ||
        voices[0];

      if (selectedVoice) utterance.voice = selectedVoice;

      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;

      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);

      speechSynthesis.speak(utterance);
    },
    [voice, voices, rate, pitch, volume]
  );

  const speak = useCallback(
    async (text: string) => {
      if (!text) return;

      cancel();

      if (isAzureSpeechEnabled()) {
        // ── Azure Speech TTS ──────────────────────────────────────────────
        setSpeaking(true);
        try {
          const audioData = await azureSynthesizeSpeech(text, azureVoice, azureLang);
          const blob = new Blob([audioData], { type: 'audio/mpeg' });
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audioRef.current = audio;

          audio.onended = () => {
            URL.revokeObjectURL(url);
            audioRef.current = null;
            setSpeaking(false);
          };
          audio.onerror = () => {
            URL.revokeObjectURL(url);
            audioRef.current = null;
            setSpeaking(false);
          };

          audio.volume = Math.max(0, Math.min(1, volume));
          audio.playbackRate = Math.max(0.5, Math.min(4, rate));
          await audio.play();
        } catch {
          setSpeaking(false);
          speakWithBrowser(text);
        }
        return;
      }

      speakWithBrowser(text);
    },
    [cancel, azureVoice, azureLang, rate, volume, speakWithBrowser]
  );

  return { speak, cancel, speaking, voices, isSupported };
};