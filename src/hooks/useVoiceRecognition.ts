import { useState, useCallback, useRef, useEffect } from 'react';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
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

  const recognitionRef = useRef<any>(null);
  const wakeWordRecognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const wakeWordActiveRef = useRef(false);
  const onWakeWordRef = useRef(onWakeWordDetected);
  const wakeWordsRef = useRef(wakeWords);
  const handoffToCommandRef = useRef(false);

  useEffect(() => { onWakeWordRef.current = onWakeWordDetected; }, [onWakeWordDetected]);
  useEffect(() => { wakeWordsRef.current = wakeWords; }, [wakeWords]);
  useEffect(() => { isListeningRef.current = isListening; }, [isListening]);

  const isSupported = typeof window !== 'undefined' &&
    ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);

  const stopListening = useCallback(() => {
    handoffToCommandRef.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
      setIsListening(false);
      isListeningRef.current = false;
      setInterimTranscript('');
    }
  }, []);

  const stopWakeWordListening = useCallback(() => {
    wakeWordActiveRef.current = false;
    handoffToCommandRef.current = false;
    if (wakeWordRecognitionRef.current) {
      const ref = wakeWordRecognitionRef.current;
      wakeWordRecognitionRef.current = null;
      try { ref.stop(); } catch {}
      setIsWakeWordListening(false);
    }
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported) return;

    handoffToCommandRef.current = true;

    if (wakeWordRecognitionRef.current) {
      const wakeRef = wakeWordRecognitionRef.current;
      wakeWordRecognitionRef.current = null;
      try { wakeRef.stop(); } catch {}
      setIsWakeWordListening(false);
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.continuous = continuous;
      recognition.interimResults = interimResults;
      recognition.lang = language;

      recognition.onstart = () => {
        setIsListening(true);
        isListeningRef.current = true;
        handoffToCommandRef.current = false;
        setError(null);
      };

      recognition.onresult = (event: any) => {
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

      recognition.onerror = (event: any) => {
        if (event.error !== 'aborted' && event.error !== 'no-speech') {
          setError(`Speech recognition error: ${event.error}`);
        }
        setIsListening(false);
        isListeningRef.current = false;
        handoffToCommandRef.current = false;
      };

      recognition.onend = () => {
        setIsListening(false);
        isListeningRef.current = false;
        handoffToCommandRef.current = false;
        setInterimTranscript('');
        recognitionRef.current = null;
      };

      recognition.start();
    } catch {
      handoffToCommandRef.current = false;
      setError('Speech recognition not supported');
      setIsListening(false);
      isListeningRef.current = false;
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
    if (isListeningRef.current) return;

    wakeWordActiveRef.current = true;

    if (wakeWordRecognitionRef.current) {
      try { wakeWordRecognitionRef.current.stop(); } catch {}
      wakeWordRecognitionRef.current = null;
    }

    const createWakeWordRecognition = () => {
      if (!wakeWordActiveRef.current) return;

      try {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        wakeWordRecognitionRef.current = recognition;

        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = language;

        recognition.onstart = () => {
          setIsWakeWordListening(true);
          setError(null);
        };

        recognition.onresult = (event: any) => {
          const currentTranscript = Array.from(event.results)
            .map((result: any) => result[0].transcript)
            .join('').toLowerCase();

          const wakeWordFound = wakeWordsRef.current.some(word =>
            currentTranscript.includes(word.toLowerCase())
          );

          if (wakeWordFound) {
            setWakeWordDetected(true);
            onWakeWordRef.current?.();
            handoffToCommandRef.current = true;
            wakeWordActiveRef.current = false;
            if (wakeWordRecognitionRef.current) {
              const ref = wakeWordRecognitionRef.current;
              wakeWordRecognitionRef.current = null;
              try { ref.stop(); } catch {}
            }
            setIsWakeWordListening(false);
            setTimeout(() => {
              startListening();
            }, 600);
          }
        };

        recognition.onerror = (event: any) => {
          if (event.error !== 'aborted' && event.error !== 'no-speech') {
            setError(`Wake word detection error: ${event.error}`);
          }
          setIsWakeWordListening(false);
        };

        recognition.onend = () => {
          setIsWakeWordListening(false);
          if (wakeWordActiveRef.current && !isListeningRef.current && !handoffToCommandRef.current) {
            setTimeout(() => {
              if (wakeWordActiveRef.current && !isListeningRef.current && !handoffToCommandRef.current) {
                createWakeWordRecognition();
              }
            }, 1000);
          }
        };

        recognition.start();
      } catch {
        setError('Wake word recognition not supported');
        setIsWakeWordListening(false);
      }
    };

    createWakeWordRecognition();
  }, [isSupported, wakeWordEnabled, language, startListening]);

  useEffect(() => {
    return () => {
      wakeWordActiveRef.current = false;
      handoffToCommandRef.current = false;
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
      if (wakeWordRecognitionRef.current) {
        try { wakeWordRecognitionRef.current.stop(); } catch {}
      }
    };
  }, []);

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
