import { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, X, Mic, MicOff, Volume2, VolumeX, Send, Check, XCircle, Radio, Loader2 } from 'lucide-react';
import { useStellaAgent } from '@/hooks/useStellaAgent';
import { motion, AnimatePresence } from 'framer-motion';

export default function StellaVoiceAgent() {
  const {
    messages, isOpen, setIsOpen,
    wakeWordActive, ttsEnabled,
    isListening, isWakeWordListening, interimTranscript, speaking,
    pendingCommand, isSupported, isAIThinking, proactiveSuggestions,
    toggleWakeWord, toggleTTS, toggleListening,
    sendTextCommand, confirmAction, cancelAction, clearMessages,
  } = useStellaAgent();

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const constraintsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAIThinking]);

  const handleSend = useCallback(() => {
    if (!input.trim()) return;
    sendTextCommand(input);
    setInput('');
  }, [input, sendTextCommand]);

  const statusText = !isSupported
    ? '⌨️ Scrivimi qui sotto: la voce non è disponibile qui'
    : isAIThinking
      ? '🧠 Sto pensando...'
      : isListening
        ? '🔴 Ti ascolto...'
        : isWakeWordListening
          ? '🎤 Dì "Stella"...'
          : speaking
            ? '🔊 Sto parlando...'
            : 'Assistente vocale super AI';

  return (
    <>
      <div ref={constraintsRef} className="fixed inset-0 pointer-events-none z-[9998]" />

      <AnimatePresence>
        {!isOpen && (
          <motion.button
            type="button"
            aria-label="Apri Stella AI"
            drag
            dragConstraints={constraintsRef}
            dragElastic={0.1}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-24 right-4 z-[9999] w-14 h-14 rounded-full gradient-primary shadow-glow flex items-center justify-center pointer-events-auto"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, rotate: [0, 5, -5, 0] }}
            exit={{ scale: 0, opacity: 0 }}
            whileTap={{ scale: 0.9 }}
            transition={{ rotate: { repeat: Infinity, duration: 4, ease: 'easeInOut' } }}
          >
            <Sparkles className="w-6 h-6 text-primary-foreground" />
            {isSupported && (isWakeWordListening || isListening) && (
              <span className="absolute -inset-1 rounded-full border-2 border-primary/60 animate-ping" />
            )}
            {speaking && (
              <span className="absolute -inset-0.5 rounded-full border-2 border-accent/60 animate-pulse" />
            )}
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-[9999] max-w-lg mx-auto pointer-events-auto"
          >
            <div className="bg-background/95 backdrop-blur-xl border-t border-primary/20 rounded-t-3xl shadow-2xl flex flex-col" style={{ maxHeight: '75vh' }}>
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50">
                <div className={`w-10 h-10 rounded-full gradient-primary flex items-center justify-center shrink-0 ${isListening ? 'shadow-glow' : ''}`}>
                  <Sparkles className={`w-5 h-5 text-primary-foreground ${isListening ? 'animate-pulse' : ''}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-gradient-primary">Stella AI</h3>
                  <p className="text-xs text-muted-foreground truncate">{statusText}</p>
                </div>

                <button
                  type="button"
                  aria-label={wakeWordActive ? 'Disabilita wake word' : 'Abilita wake word'}
                  onClick={toggleWakeWord}
                  disabled={!isSupported}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0 ${wakeWordActive ? 'bg-primary/20 text-primary ring-1 ring-primary/30' : 'bg-muted text-muted-foreground'} ${!isSupported ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Radio className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  aria-label={ttsEnabled ? 'Disabilita voce' : 'Abilita voce'}
                  onClick={toggleTTS}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0 ${ttsEnabled ? 'bg-primary/20 text-primary ring-1 ring-primary/30' : 'bg-muted text-muted-foreground'}`}
                >
                  {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  aria-label="Chiudi Stella"
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {!isSupported ? (
                <div className="mx-4 mt-2 px-3 py-2 rounded-xl bg-muted border border-border/60 flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0" />
                  <p className="text-xs text-muted-foreground flex-1">
                    Il microfono non è supportato in questo ambiente, ma Stella continua a funzionare se le scrivi qui sotto.
                  </p>
                </div>
              ) : (isWakeWordListening || isListening) && (
                <div className="mx-4 mt-2 px-3 py-2 rounded-xl bg-primary/10 border border-primary/20 flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shrink-0" />
                  <p className="text-xs text-primary font-medium flex-1">
                    {isListening ? '🎤 Parla ora — ti ascolto!' : '🤖 Mani Libere attiva · Dì "Stella"'}
                  </p>
                </div>
              )}

              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ minHeight: '200px', maxHeight: '45vh' }}>
                {messages.length === 0 && (
                  <div className="text-center py-8">
                    <Sparkles className="w-10 h-10 text-primary mx-auto mb-3 opacity-50" />
                    <p className="text-sm text-muted-foreground">Ciao! Sono Stella 🌟</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {isSupported
                        ? 'Il tuo assistente super AI — dì "Stella" o scrivi!'
                        : 'Il tuo assistente super AI — scrivimi qui sotto e ti rispondo subito!'}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2 justify-center">
                      {[
                        '🗺️ Mappa professionisti',
                        '✂️ Prenota taglio',
                        '🎨 Prova look AI',
                        '💬 Invia messaggio',
                        '❤️ Metti like',
                        '🔍 Cerca',
                        '📅 Calendario contenuti',
                        '❓ Aiuto',
                      ].map(cmd => (
                        <button
                          key={cmd}
                          type="button"
                          onClick={() => sendTextCommand(cmd.replace(/^.+?\s/, ''))}
                          className="px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary hover:bg-primary/20 transition-colors"
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
                        ? 'bg-primary text-primary-foreground'
                        : msg.type === 'confirmation'
                          ? 'bg-amber-500/10 border border-amber-500/30 text-foreground'
                          : msg.type === 'action_result'
                            ? 'bg-green-500/10 border border-green-500/30 text-foreground'
                            : 'bg-muted text-foreground'
                    }`}>
                      <p className="text-sm whitespace-pre-line">{msg.content}</p>

                      {msg.type === 'confirmation' && pendingCommand && (
                        <div className="flex gap-2 mt-2">
                          <button
                            type="button"
                            aria-label="Conferma azione"
                            onClick={confirmAction}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-green-500 text-white text-xs font-semibold hover:bg-green-600 transition-colors"
                          >
                            <Check className="w-3 h-3" /> Conferma
                          </button>
                          <button
                            type="button"
                            aria-label="Annulla azione"
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

                {isAIThinking && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl px-3.5 py-2.5 bg-muted flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">Stella sta pensando...</p>
                    </div>
                  </div>
                )}

                {interimTranscript && (
                  <div className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl px-3.5 py-2.5 bg-primary/30 text-foreground italic">
                      <p className="text-sm">{interimTranscript}...</p>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              <div className="px-4 py-3 border-t border-border/50 flex items-center gap-2">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="Scrivi un comando o una domanda..."
                  className="flex-1 h-10 rounded-full bg-muted px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  disabled={isAIThinking}
                />
                <button
                  type="button"
                  aria-label={isListening ? 'Ferma ascolto' : 'Inizia ascolto'}
                  onClick={toggleListening}
                  disabled={!isSupported || isAIThinking}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 ${
                    isListening ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
                <button
                  type="button"
                  aria-label="Invia comando"
                  onClick={handleSend}
                  disabled={!input.trim() || isAIThinking}
                  className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center shadow-glow disabled:opacity-50 active:scale-95 transition-transform shrink-0"
                >
                  <Send className="w-4 h-4 text-primary-foreground" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
