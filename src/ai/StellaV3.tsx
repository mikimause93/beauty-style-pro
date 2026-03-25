// src/ai/StellaV3.tsx
// Top-level component — drop this anywhere inside BrowserRouter + AuthProvider.
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useStellaVoice } from './voice/StellaVoice';
import { setCurrentPage } from './core/StellaContext';
import StellaFloating from './ui/StellaFloating';
import StellaModal from './ui/StellaModal';

export default function StellaV3() {
  const [isOpen, setIsOpen] = useState(false);
  const [wakeWordActive, setWakeWordActive] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const location = useLocation();

  // Keep context page in sync with router
  useEffect(() => {
    setCurrentPage(location.pathname);
  }, [location.pathname]);

  const {
    isListening,
    isWakeWordListening,
    isSpeaking,
    isSupported,
    startWakeWordListening,
    stopWakeWordListening,
  } = useStellaVoice({
    onWakeWordDetected: () => {
      setIsOpen(true);
    },
  });

  function handleToggleWakeWord() {
    if (wakeWordActive) {
      stopWakeWordListening();
      setWakeWordActive(false);
    } else {
      if (isSupported) {
        startWakeWordListening();
        setWakeWordActive(true);
      }
    }
  }

  return (
    <>
      <StellaFloating
        isOpen={isOpen}
        isListening={isListening}
        isWakeWordListening={isWakeWordListening}
        isSpeaking={isSpeaking}
        onOpen={() => setIsOpen(true)}
      />
      <StellaModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        wakeWordActive={wakeWordActive}
        ttsEnabled={ttsEnabled}
        onToggleWakeWord={handleToggleWakeWord}
        onToggleTTS={() => setTtsEnabled(v => !v)}
      />
    </>
  );
}
