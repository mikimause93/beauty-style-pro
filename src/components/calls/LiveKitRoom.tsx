/**
 * LiveKitRoom.tsx — Beauty Style Pro v2.0.0
 * Componente chiamate HD via LiveKit WebRTC.
 * Sostituisce il motore di chiamate base mantenendo l'UI esistente.
 * Richiede @livekit/client installato e VITE_LIVEKIT_URL configurato.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Mic, MicOff, Video, VideoOff, Phone, PhoneOff,
  Users, MonitorShare, Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const LIVEKIT_URL = import.meta.env.VITE_LIVEKIT_URL ?? "";

interface Participant {
  sid: string;
  identity: string;
  isMicEnabled: boolean;
  isCameraEnabled: boolean;
}

interface LiveKitRoomProps {
  /** Token JWT LiveKit per il partecipante locale. */
  token: string;
  /** Nome della stanza (es. "call-userId1-userId2"). */
  roomName: string;
  /** Nome visualizzato del partecipante locale. */
  displayName: string;
  /** Callback alla fine della chiamata. */
  onLeave?: () => void;
  /** Abilita la condivisione schermo (default false). */
  enableScreenShare?: boolean;
}

export default function LiveKitRoom({
  token,
  roomName,
  displayName,
  onLeave,
  enableScreenShare = false,
}: LiveKitRoomProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [lkAvailable, setLkAvailable] = useState<boolean | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const roomRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lkRef = useRef<any>(null);

  // Lazy-load LiveKit
  useEffect(() => {
    import("@livekit/client")
      .then(lk => {
        lkRef.current = lk;
        setLkAvailable(true);
      })
      .catch(() => {
        setLkAvailable(false);
      });
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateParticipants = (room: any) => {
    const list: Participant[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    room.participants.forEach((p: any) => {
      list.push({
        sid: p.sid,
        identity: p.identity,
        isMicEnabled: !p.isMicrophoneMuted,
        isCameraEnabled: !p.isCameraMuted,
      });
    });
    setParticipants(list);
  };

  const connect = useCallback(async () => {
    const lk = lkRef.current;
    if (!lk) {
      toast.error("LiveKit non disponibile. Installa @livekit/client");
      return;
    }
    if (!LIVEKIT_URL) {
      toast.error("VITE_LIVEKIT_URL non configurato");
      return;
    }
    setIsConnecting(true);
    try {
      const room = new lk.Room();
      roomRef.current = room;

      room.on(lk.RoomEvent.ParticipantConnected, () => updateParticipants(room));
      room.on(lk.RoomEvent.ParticipantDisconnected, () => updateParticipants(room));
      room.on(lk.RoomEvent.TrackMuted, () => updateParticipants(room));
      room.on(lk.RoomEvent.TrackUnmuted, () => updateParticipants(room));
      room.on(lk.RoomEvent.Disconnected, () => {
        setIsConnected(false);
        onLeave?.();
      });

      await room.connect(LIVEKIT_URL, token);
      await room.localParticipant.enableCameraAndMicrophone();

      setIsConnected(true);
      updateParticipants(room);
      toast.success(`Connesso alla stanza: ${roomName}`);
    } catch (err) {
      toast.error(`Errore connessione: ${(err as Error).message}`);
    } finally {
      setIsConnecting(false);
    }
  }, [token, roomName, onLeave]);

  const toggleMic = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    await room.localParticipant.setMicrophoneEnabled(!isMicOn);
    setIsMicOn(v => !v);
  }, [isMicOn]);

  const toggleCamera = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    await room.localParticipant.setCameraEnabled(!isCameraOn);
    setIsCameraOn(v => !v);
  }, [isCameraOn]);

  const toggleScreenShare = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    await room.localParticipant.setScreenShareEnabled(!isSharingScreen);
    setIsSharingScreen(v => !v);
  }, [isSharingScreen]);

  const leave = useCallback(async () => {
    const room = roomRef.current;
    if (room) await room.disconnect();
    onLeave?.();
  }, [onLeave]);

  // Connetti automaticamente quando LiveKit è disponibile
  useEffect(() => {
    if (lkAvailable === true && token && LIVEKIT_URL) connect();
    return () => {
      const room = roomRef.current;
      if (room) room.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lkAvailable]);

  if (lkAvailable === null) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
      </div>
    );
  }

  if (!lkAvailable) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
        <Phone className="w-12 h-12 text-muted-foreground" />
        <h3 className="text-sm font-bold">LiveKit non installato</h3>
        <p className="text-xs text-muted-foreground">
          Installa <code className="bg-muted px-1 rounded">@livekit/client</code> e configura{" "}
          <code className="bg-muted px-1 rounded">VITE_LIVEKIT_URL</code> per abilitare le chiamate HD.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-black relative">
      {/* Stato connessione */}
      <AnimatePresence>
        {isConnecting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/80 z-10"
          >
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
              <p className="text-sm text-white">Connessione a {roomName}...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Area video principale */}
      <div className="flex-1 bg-zinc-900 flex items-center justify-center relative">
        {participants.length === 0 ? (
          <div className="text-center">
            <Users className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <p className="text-sm text-zinc-500">In attesa di altri partecipanti...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 p-2 w-full h-full">
            {participants.map(p => (
              <div
                key={p.sid}
                className="relative bg-zinc-800 rounded-xl overflow-hidden flex items-center justify-center"
              >
                <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-lg">
                  {p.identity.charAt(0).toUpperCase()}
                </div>
                <div className="absolute bottom-2 left-2 flex gap-1">
                  {!p.isMicEnabled && (
                    <span className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                      <MicOff className="w-2.5 h-2.5 text-white" />
                    </span>
                  )}
                  {!p.isCameraEnabled && (
                    <span className="w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center">
                      <VideoOff className="w-2.5 h-2.5 text-white" />
                    </span>
                  )}
                </div>
                <p className="absolute bottom-2 right-2 text-[10px] text-white/70 truncate max-w-[80px]">
                  {p.identity}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Badge locale */}
        <div className="absolute top-3 left-3 bg-black/60 rounded-lg px-2 py-1 text-[10px] text-white">
          {displayName} (tu)
        </div>

        {/* Partecipanti counter */}
        <div className="absolute top-3 right-3 bg-black/60 rounded-lg px-2 py-1 text-[10px] text-white flex items-center gap-1">
          <Users className="w-3 h-3" />
          {participants.length + 1}
        </div>
      </div>

      {/* Controlli chiamata */}
      <div className="p-4 bg-zinc-900 flex items-center justify-center gap-4">
        <button
          type="button"
          aria-label={isMicOn ? "Disattiva microfono" : "Attiva microfono"}
          onClick={toggleMic}
          disabled={!isConnected}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors disabled:opacity-40 ${
            isMicOn ? "bg-zinc-700 text-white" : "bg-red-500 text-white"
          }`}
        >
          {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>

        <button
          type="button"
          aria-label={isCameraOn ? "Disattiva camera" : "Attiva camera"}
          onClick={toggleCamera}
          disabled={!isConnected}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors disabled:opacity-40 ${
            isCameraOn ? "bg-zinc-700 text-white" : "bg-red-500 text-white"
          }`}
        >
          {isCameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>

        {enableScreenShare && (
          <button
            type="button"
            aria-label={isSharingScreen ? "Ferma condivisione schermo" : "Condividi schermo"}
            onClick={toggleScreenShare}
            disabled={!isConnected}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors disabled:opacity-40 ${
              isSharingScreen ? "bg-blue-500 text-white" : "bg-zinc-700 text-white"
            }`}
          >
            <MonitorShare className="w-5 h-5" />
          </button>
        )}

        <button
          type="button"
          aria-label="Termina chiamata"
          onClick={leave}
          className="w-14 h-14 rounded-full bg-red-500 flex items-center justify-center text-white shadow-lg"
        >
          <PhoneOff className="w-6 h-6" />
        </button>

        {!isConnected && (
          <button
            type="button"
            aria-label="Connetti"
            onClick={connect}
            disabled={isConnecting}
            className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white disabled:opacity-50"
          >
            {isConnecting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Phone className="w-5 h-5" />}
          </button>
        )}
      </div>
    </div>
  );
}
