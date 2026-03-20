import { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, X, Mic, MicOff, Volume2, VolumeX, Send, Check, XCircle, Radio } from 'lucide-react';
import { useStellaAgent } from '@/hooks/useStellaAgent';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';

export default function StellaVoiceAgent() {
  const {
    messages, isOpen, setIsOpen,
    wakeWordActive, ttsEnabled,
    isListening, isWakeWordListening, interimTranscript, speaking,
    pendingCommand, isSupported,
    toggleWakeWord, toggleTTS, toggleListening,
    sendTextCommand, confirmAction, cancelAction, clearMessages,
  } = useStellaAgent();

  const [input, setInput] = useState('');
  const [fabPos, setFabPos] = useState({ x: 0, y: 0 });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const constraintsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(() => {
    if (!input.trim()) return;
    sendTextCommand(input);
    setInput('');
  }, [input, sendTextCommand]);

  if (!isSupported) return null;

  return (
    <>
      {/* Drag constraints container */}
      <div ref={constraintsRef} className="fixed inset-0 pointer-events-none z-[9998]" />

      {/* Floating Stella Button (draggable) */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            type="button"
            aria-label="Apri Stella AI"
            drag
            dragConstraints={constraintsRef}
            dragElastic={0.1}
            onDragEnd={(_e, info) => setFabPos({ x: info.point.x, y: info.point.y })}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-24 right-4 z-[9999] w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 shadow-lg shadow-purple-500/40 flex items-center justify-center pointer-events-auto"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileTap={{ scale: 0.9 }}
          >
            <Sparkles className="w-6 h-6 text-white" />
            {/* Listening indicator ring */}
            {(isWakeWordListening || isListening) && (
              <span className="absolute -inset-1 rounded-full border-2 border-purple-400/60 animate-ping" />
            )}
            {speaking && (
              <span className="absolute -inset-0.5 rounded-full border-2 border-pink-400/60 animate-pulse" />
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Stella Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-[9999] max-w-lg mx-auto pointer-events-auto"
          >
            <div className="bg-background/95 backdrop-blur-xl border-t border-purple-500/20 rounded-t-3xl shadow-2xl shadow-purple-900/20 flex flex-col" style={{ maxHeight: '75vh' }}>
              {/* Header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center shrink-0 ${isListening ? 'shadow-lg shadow-purple-500/50' : ''}`}>
                  <Sparkles className={`w-5 h-5 text-white ${isListening ? 'animate-pulse' : ''}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-foreground">Stella AI</h3>
                  <p className="text-xs text-muted-foreground truncate">
                    {isListening ? '🔴 Ti ascolto...' : isWakeWordListening ? '🎤 Dì "Stella"...' : speaking ? '🔊 Sto parlando...' : 'Assistente vocale'}
                  </p>
                </div>

                {/* Wake word toggle */}
                <button type="button" aria-label={wakeWordActive ? 'Disabilita wake word' : 'Abilita wake word'}
                  onClick={toggleWakeWord}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0 ${wakeWordActive ? 'bg-green-500/20 text-green-400 ring-1 ring-green-500/30' : 'bg-muted text-muted-foreground'}`}
                >
                  <Radio className="w-4 h-4" />
                </button>
                {/* TTS toggle */}
                <button type="button" aria-label={ttsEnabled ? 'Disabilita voce' : 'Abilita voce'}
                  onClick={toggleTTS}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0 ${ttsEnabled ? 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/30' : 'bg-muted text-muted-foreground'}`}
                >
                  {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
                {/* Close */}
                <button type="button" aria-label="Chiudi Stella" onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Active listening banner */}
              {(isWakeWordListening || isListening) && (
                <div className="mx-4 mt-2 px-3 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse shrink-0" />
                  <p className="text-xs text-purple-300 font-medium flex-1">
                    {isListening ? '🎤 Parla ora — ti ascolto!' : '🤖 Mani Libere attiva · Dì "Stella"'}
                  </p>
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ minHeight: '200px', maxHeight: '45vh' }}>
                {messages.length === 0 && (
                  <div className="text-center py-8">
                    <Sparkles className="w-10 h-10 text-purple-400 mx-auto mb-3 opacity-50" />
                    <p className="text-sm text-muted-foreground">Ciao! Sono Stella. 👋</p>
                    <p className="text-xs text-muted-foreground mt-1">Dì "Stella" o scrivi un comando!</p>
                    <div className="mt-4 flex flex-wrap gap-2 justify-center">
                      {['Apri chat', 'Prenota', 'Cerca sulla mappa', 'Le mie notifiche'].map(cmd => (
                        <button key={cmd} type="button"
                          onClick={() => sendTextCommand(cmd)}
                          className="px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300 hover:bg-purple-500/20 transition-colors"
                        >
                          {cmd}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${
                      msg.role === 'user'
                        ? 'bg-purple-600 text-white'
                        : msg.type === 'confirmation'
                          ? 'bg-amber-500/10 border border-amber-500/30 text-foreground'
                          : msg.type === 'action_result'
                            ? 'bg-green-500/10 border border-green-500/30 text-foreground'
                            : 'bg-muted text-foreground'
                    }`}>
                      <p className="text-sm">{msg.content}</p>

                      {/* Confirmation buttons */}
                      {msg.type === 'confirmation' && pendingCommand && (
                        <div className="flex gap-2 mt-2">
                          <button type="button" aria-label="Conferma azione"
                            onClick={confirmAction}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-green-500 text-white text-xs font-semibold hover:bg-green-600 transition-colors"
                          >
                            <Check className="w-3 h-3" /> Conferma
                          </button>
                          <button type="button" aria-label="Annulla azione"
                            onClick={cancelAction}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-colors"
                          >
                            <XCircle className="w-3 h-3" /> Annulla
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Interim transcript */}
                {interimTranscript && (
                  <div className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl px-3.5 py-2.5 bg-purple-500/30 text-purple-200 italic">
                      <p className="text-sm">{interimTranscript}...</p>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input bar */}
              <div className="px-4 py-3 border-t border-border/50 flex items-center gap-2">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="Scrivi un comando..."
                  className="flex-1 h-10 rounded-full bg-muted px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                />
                {/* Mic button */}
                <button type="button" aria-label={isListening ? 'Ferma ascolto' : 'Inizia ascolto'}
                  onClick={toggleListening}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 ${
                    isListening ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
                {/* Send */}
                <button type="button" aria-label="Invia comando" onClick={handleSend}
                  disabled={!input.trim()}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20 disabled:opacity-50 active:scale-95 transition-transform shrink-0"
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
