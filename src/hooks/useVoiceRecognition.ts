import { useState, useCallback, useRef } from 'react';

declare global {
  interface Window {
    SpeechRecognition: { new(): SpeechRecognition };
    webkitSpeechRecognition: { new(): SpeechRecognition };
  }
}

interface VoiceRecognitionOptions {
  continuous?: boolean;
  interimResults?: boolean;
  language?: string;
  wakeWordEnabled?: boolean;
  wakeWords?: string[];
  onWakeWordDetected?: () => void;
}

interface VoiceRecognitionHook {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  isSupported: boolean;
  isWakeWordListening: boolean;
  wakeWordDetected: boolean;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  startWakeWordListening: () => void;
  stopWakeWordListening: () => void;
}

export const useVoiceRecognition = (
  options: VoiceRecognitionOptions = {}
): VoiceRecognitionHook => {
  const {
    continuous = false,
    interimResults = true,
    language = 'it-IT',
    wakeWordEnabled = false,
    wakeWords = ['stella', 'hey stella', 'ehi stella', 'ciao stella'],
    onWakeWordDetected
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isWakeWordListening, setIsWakeWordListening] = useState(false);
  const [wakeWordDetected, setWakeWordDetected] = useState(false);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const wakeWordRecognitionRef = useRef<SpeechRecognition | null>(null);
  const isSupported = typeof window !== 'undefined' && 
    ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      setInterimTranscript('');
    }
  }, []);

  const stopWakeWordListening = useCallback(() => {
    if (wakeWordRecognitionRef.current) {
      wakeWordRecognitionRef.current.stop();
      setIsWakeWordListening(false);
    }
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported) return;

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      const recognition = recognitionRef.current;
      recognition.continuous = continuous;
      recognition.interimResults = interimResults;
      recognition.lang = language;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = '';
        let currentInterimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            currentInterimTranscript += result[0].transcript;
          }
        }

        if (finalTranscript) {
          setTranscript(prev => prev + finalTranscript);
        }
        setInterimTranscript(currentInterimTranscript);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        setError(`Speech recognition error: ${event.error}`);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript('');
      };

      recognition.start();
    } catch (err) {
      setError('Speech recognition not supported');
      setIsListening(false);
    }
  }, [isSupported, continuous, interimResults, language]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setError(null);
    setWakeWordDetected(false);
  }, []);

  const startWakeWordListening = useCallback(() => {
    if (!isSupported || !wakeWordEnabled) return;

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      wakeWordRecognitionRef.current = new SpeechRecognition();
      
      const recognition = wakeWordRecognitionRef.current;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language;

      recognition.onstart = () => {
        setIsWakeWordListening(true);
        setError(null);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const currentTranscript = Array.from(event.results)
          .map((result: SpeechRecognitionResult) => result[0].transcript)
          .join('').toLowerCase();

        const wakeWordFound = wakeWords.some(word => 
          currentTranscript.includes(word.toLowerCase())
        );

        if (wakeWordFound) {
          setWakeWordDetected(true);
          onWakeWordDetected?.();
          stopWakeWordListening();
          setTimeout(startListening, 500);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        setError(`Wake word detection error: ${event.error}`);
        setIsWakeWordListening(false);
      };

      recognition.onend = () => {
        setIsWakeWordListening(false);
      };

      recognition.start();
    } catch (err) {
      setError('Wake word recognition not supported');
      setIsWakeWordListening(false);
    }
  }, [isSupported, wakeWordEnabled, language, wakeWords, onWakeWordDetected, startListening, stopWakeWordListening]);

  return {
    isListening,
    transcript,
    interimTranscript,
    error,
    isSupported,
    isWakeWordListening,
    wakeWordDetected,
    startListening,
    stopListening,
    resetTranscript,
    startWakeWordListening,
    stopWakeWordListening,
  };
};