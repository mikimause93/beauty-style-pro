// src/ai/voice/StellaVoice.ts
// Wrapper hook around the existing voice recognition and synthesis hooks.
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { useVoiceSynthesis } from '@/hooks/useVoiceSynthesis';

interface StellaVoiceOptions {
  onWakeWordDetected?: () => void;
  onTranscript?: (text: string) => void;
  language?: string;
}

export function useStellaVoice(options: StellaVoiceOptions = {}) {
  const synthesis = useVoiceSynthesis({ rate: 1.05, pitch: 1.1 });

  const recognition = useVoiceRecognition({
    continuous: false,
    interimResults: true,
    language: options.language ?? 'it-IT',
    wakeWordEnabled: true,
    wakeWords: ['stella', 'hey stella', 'ehi stella', 'ciao stella'],
    onWakeWordDetected: options.onWakeWordDetected,
  });

  return {
    // Recognition
    isListening: recognition.isListening,
    isWakeWordListening: recognition.isWakeWordListening,
    transcript: recognition.transcript,
    interimTranscript: recognition.interimTranscript,
    isSupported: recognition.isSupported,
    startListening: recognition.startListening,
    stopListening: recognition.stopListening,
    resetTranscript: recognition.resetTranscript,
    startWakeWordListening: recognition.startWakeWordListening,
    stopWakeWordListening: recognition.stopWakeWordListening,
    // Synthesis
    speak: synthesis.speak,
    cancelTTS: synthesis.cancel,
    isSpeaking: synthesis.speaking,
  };
}
