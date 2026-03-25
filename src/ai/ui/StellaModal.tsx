// src/ai/ui/StellaModal.tsx
import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, Mic, MicOff, Volume2, VolumeX, Radio, Sparkles, Loader2, Check, XCircle } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { stellaChat } from '../core/StellaCore';
import { useStellaVoice } from '../voice/StellaVoice';
import { useStellaCommands } from '../voice/StellaCommands';
import { SlideUpPanel, FadeInMessage } from './StellaAnimations';
import type { StellaMessage } from '../types/stella.types';

const QUICK_ACTIONS = [
  'Apri agenda',
  'Mostra statistiche',
  'Apri shop',
  'Prenota',
  'Le mie prenotazioni',
  'Cerca professionisti',
];

interface StellaModalProps {
  isOpen: boolean;
  onClose: () => void;
  wakeWordActive: boolean;
  ttsEnabled: boolean;
  onToggleWakeWord: () => void;
  onToggleTTS: () => void;
}

export default function StellaModal({
  isOpen,
  onClose,
  wakeWordActive,
  ttsEnabled,
  onToggleWakeWord,
  onToggleTTS,
}: StellaModalProps) {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { setTheme } = useTheme();

  const [messages, setMessages] = useState<StellaMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Array<{ role: string; content: string }>>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { parseCommand } = useStellaCommands();

  const {
    isListening, isWakeWordListening, interimTranscript, isSpeaking, isSupported,
    speak, cancelTTS, startListening, stopListening, resetTranscript, transcript,
  } = useStellaVoice({
    onWakeWordDetected: () => {
      if (ttsEnabled) speak('Ciao! Come posso aiutarti?');
    },
  });

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Process transcript when voice recognition finishes
  useEffect(() => {
    if (transcript && !isListening) {
      // Try quick command first
      const { matched, response, action } = parseCommand(transcript);
      if (matched) {
        if (action === 'theme:light') setTheme('light');
        else if (action === 'theme:dark') setTheme('dark');
        if (ttsEnabled) speak(response);
        toast.success(response);
        resetTranscript();
        return;
      }
      // Otherwise send to AI
      setInput(transcript);
      resetTranscript();
    }
  }, [transcript, isListening, parseCommand, setTheme, ttsEnabled, speak, resetTranscript]);

  const addMessage = useCallback((msg: Omit<StellaMessage, 'id' | 'timestamp'>) => {
    setMessages(prev => [...prev, { ...msg, id: Date.now().toString() + Math.random(), timestamp: new Date() }]);
  }, []);

  const sendMessage = useCallback(async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || isLoading || !user) return;

    setInput('');
    addMessage({ role: 'user', content, type: 'text' });
    setIsLoading(true);

    const updatedHistory = [...conversationHistory, { role: 'user', content }];

    try {
      const result = await stellaChat(content, user.id, navigate, conversationHistory);

      addMessage({
        role: 'stella',
        content: result.response,
        type: result.actions && result.actions.length > 0 ? 'action_result' : 'text',
        actions: result.actions,
      });

      setConversationHistory([
        ...updatedHistory,
        { role: 'assistant', content: result.response },
      ]);

      if (ttsEnabled && result.response) speak(result.response);
    } catch (err) {
      console.error('Stella V3 error:', err);
      addMessage({ role: 'stella', content: 'Mi dispiace, qualcosa è andato storto. Riprova! 🙏', type: 'error' });
      toast.error('Errore Stella AI');
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, user, navigate, conversationHistory, addMessage, ttsEnabled, speak]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <SlideUpPanel className="fixed inset-x-0 bottom-0 z-[9999] max-w-lg mx-auto pointer-events-auto">
        <div
          className="bg-background/95 backdrop-blur-xl border-t border-purple-500/20 rounded-t-3xl shadow-2xl shadow-purple-900/20 flex flex-col"
          style={{ maxHeight: '78vh' }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 shrink-0">
            <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center shrink-0 ${isListening ? 'shadow-lg shadow-purple-500/50' : ''}`}>
              <Sparkles className={`w-5 h-5 text-white ${isListening ? 'animate-pulse' : ''}`} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-foreground">Stella AI V3</h3>
              <p className="text-xs text-muted-foreground truncate">
                {isListening
                  ? '🔴 Ti ascolto...'
                  : isWakeWordListening
                  ? '🎤 Dì "Stella"...'
                  : isSpeaking
                  ? '🔊 Sto parlando...'
                  : `Ciao${profile?.display_name ? `, ${profile.display_name}` : ''}! Come posso aiutarti?`}
              </p>
            </div>

            {/* Wake word toggle */}
            {isSupported && (
              <button
                type="button"
                aria-label={wakeWordActive ? 'Disabilita wake word' : 'Abilita wake word'}
                onClick={onToggleWakeWord}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0 ${
                  wakeWordActive
                    ? 'bg-green-500/20 text-green-400 ring-1 ring-green-500/30'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                <Radio className="w-4 h-4" />
              </button>
            )}

            {/* TTS toggle */}
            <button
              type="button"
              aria-label={ttsEnabled ? 'Disabilita voce' : 'Abilita voce'}
              onClick={() => {
                onToggleTTS();
                if (ttsEnabled) cancelTTS();
              }}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0 ${
                ttsEnabled
                  ? 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/30'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Close */}
            <button
              type="button"
              aria-label="Chiudi Stella"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Listening banner */}
          {(isWakeWordListening || isListening) && (
            <div className="mx-4 mt-2 px-3 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center gap-2 shrink-0">
              <div className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse shrink-0" />
              <p className="text-xs text-purple-300 font-medium flex-1">
                {isListening ? '🎤 Parla ora — ti ascolto!' : '🤖 Mani Libere · Dì "Stella"'}
              </p>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ minHeight: '160px' }}>
            {messages.length === 0 && (
              <div className="text-center py-6">
                <Sparkles className="w-10 h-10 text-purple-400 mx-auto mb-3 opacity-50" />
                <p className="text-sm text-muted-foreground">
                  Ciao{profile?.display_name ? ` ${profile.display_name}` : ''}! Sono Stella AI V3 👋
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Posso aprire schermate, prenotare, mostrare statistiche e molto altro!
                </p>
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  {QUICK_ACTIONS.map(cmd => (
                    <button
                      key={cmd}
                      type="button"
                      onClick={() => sendMessage(cmd)}
                      className="px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300 hover:bg-purple-500/20 transition-colors"
                    >
                      {cmd}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map(msg => (
              <FadeInMessage
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-purple-600 to-pink-500 text-white'
                      : msg.type === 'action_result'
                      ? 'bg-green-500/10 border border-green-500/30 text-foreground'
                      : msg.type === 'error'
                      ? 'bg-red-500/10 border border-red-500/30 text-foreground'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>

                  {/* Action results */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {msg.actions.map((act, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-xs">
                          {act.result.success ? (
                            <Check className="w-3 h-3 text-green-400 shrink-0" />
                          ) : (
                            <XCircle className="w-3 h-3 text-red-400 shrink-0" />
                          )}
                          <span className={act.result.success ? 'text-green-300' : 'text-red-300'}>
                            {act.result.message}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </FadeInMessage>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <FadeInMessage className="flex justify-start">
                <div className="bg-muted rounded-2xl px-3.5 py-2.5">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                    <span className="text-xs text-muted-foreground">Sto elaborando...</span>
                  </div>
                </div>
              </FadeInMessage>
            )}

            {/* Interim transcript preview */}
            {interimTranscript && (
              <FadeInMessage className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl px-3.5 py-2.5 bg-purple-500/30 text-purple-200 italic">
                  <p className="text-sm">{interimTranscript}...</p>
                </div>
              </FadeInMessage>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input bar */}
          <div className="px-4 py-3 border-t border-border/50 flex items-center gap-2 shrink-0">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Scrivi un comando a Stella..."
              disabled={isLoading}
              className="flex-1 h-10 rounded-full bg-muted px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 disabled:opacity-60"
            />
            {isSupported && (
              <button
                type="button"
                aria-label={isListening ? 'Ferma ascolto' : 'Inizia ascolto vocale'}
                onClick={() => (isListening ? stopListening() : startListening())}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 ${
                  isListening
                    ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            )}
            <button
              type="button"
              aria-label="Invia a Stella"
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20 disabled:opacity-50 active:scale-95 transition-transform shrink-0"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </SlideUpPanel>
    </AnimatePresence>
  );
}
