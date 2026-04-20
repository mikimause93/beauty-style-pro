import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export type CallKind = "audio" | "video";
export type CallStatus = "idle" | "ringing-out" | "ringing-in" | "connecting" | "in-call" | "ended";

export interface IncomingCall {
  callId: string;
  fromUser: string;
  fromName?: string;
  fromAvatar?: string;
  kind: CallKind;
}

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun.cloudflare.com:3478" },
];

interface SignalRow {
  id: string;
  call_id: string;
  from_user: string;
  to_user: string;
  signal_type: string;
  payload: any;
  call_kind: string;
  created_at: string;
}

/**
 * Global WebRTC call manager. Mount once at the app root via <CallManager />.
 * Listens for incoming call signals on the call_signals table and orchestrates
 * a real peer-to-peer audio/video connection.
 */
export function useWebRTCCall() {
  const { user } = useAuth();
  const [status, setStatus] = useState<CallStatus>("idle");
  const [incoming, setIncoming] = useState<IncomingCall | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [activeKind, setActiveKind] = useState<CallKind>("video");
  const [peerName, setPeerName] = useState<string>("");

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const callIdRef = useRef<string | null>(null);
  const peerIdRef = useRef<string | null>(null);
  const pendingIceRef = useRef<RTCIceCandidateInit[]>([]);
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);

  const sendSignal = useCallback(async (
    type: string,
    toUser: string,
    payload: any = null,
    kind: CallKind = "video",
    callId?: string,
  ) => {
    if (!user) return;
    const cid = callId || callIdRef.current;
    if (!cid) return;
    await supabase.from("call_signals").insert({
      call_id: cid,
      from_user: user.id,
      to_user: toUser,
      signal_type: type,
      payload,
      call_kind: kind,
    });
  }, [user]);

  const cleanupPeer = useCallback(() => {
    if (pcRef.current) {
      try { pcRef.current.close(); } catch {}
      pcRef.current = null;
    }
    if (localStream) {
      localStream.getTracks().forEach(t => t.stop());
    }
    setLocalStream(null);
    setRemoteStream(null);
    pendingIceRef.current = [];
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current = null;
    }
  }, [localStream]);

  const endCall = useCallback(async (notifyPeer = true) => {
    if (notifyPeer && peerIdRef.current && callIdRef.current) {
      await sendSignal("hangup", peerIdRef.current, null, activeKind);
    }
    cleanupPeer();
    callIdRef.current = null;
    peerIdRef.current = null;
    setStatus("idle");
    setIncoming(null);
    setPeerName("");
  }, [activeKind, cleanupPeer, sendSignal]);

  const createPeer = useCallback((toUser: string, callId: string, kind: CallKind) => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        void sendSignal("ice", toUser, e.candidate.toJSON(), kind, callId);
      }
    };

    pc.ontrack = (e) => {
      const [stream] = e.streams;
      if (stream) setRemoteStream(stream);
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") {
        setStatus("in-call");
      } else if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
        toast.error("Connessione persa");
        void endCall(true);
      }
    };

    pcRef.current = pc;
    return pc;
  }, [endCall, sendSignal]);

  const getMedia = useCallback(async (kind: CallKind): Promise<MediaStream> => {
    const constraints: MediaStreamConstraints = {
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      video: kind === "video" ? { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" } : false,
    };
    return await navigator.mediaDevices.getUserMedia(constraints);
  }, []);

  /** Start an outgoing call */
  const startCall = useCallback(async (toUser: string, kind: CallKind, peerDisplayName?: string) => {
    if (!user) {
      toast.error("Devi essere loggato");
      return;
    }
    if (status !== "idle") {
      toast.error("Hai già una chiamata in corso");
      return;
    }
    try {
      const callId = crypto.randomUUID();
      callIdRef.current = callId;
      peerIdRef.current = toUser;
      setActiveKind(kind);
      setPeerName(peerDisplayName || "");
      setStatus("ringing-out");

      const stream = await getMedia(kind);
      setLocalStream(stream);

      const pc = createPeer(toUser, callId, kind);
      stream.getTracks().forEach(t => pc.addTrack(t, stream));

      // Send ringing signal first (so peer can show incoming UI)
      await sendSignal("ringing", toUser, { name: peerDisplayName }, kind, callId);

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await sendSignal("offer", toUser, { sdp: offer.sdp, type: offer.type }, kind, callId);
    } catch (err: any) {
      toast.error(err?.message || "Impossibile avviare la chiamata");
      cleanupPeer();
      setStatus("idle");
      callIdRef.current = null;
      peerIdRef.current = null;
    }
  }, [cleanupPeer, createPeer, getMedia, sendSignal, status, user]);

  /** Accept an incoming call */
  const acceptCall = useCallback(async () => {
    if (!incoming || !user) return;
    try {
      const { callId, fromUser, kind } = incoming;
      callIdRef.current = callId;
      peerIdRef.current = fromUser;
      setActiveKind(kind);
      setPeerName(incoming.fromName || "");
      setStatus("connecting");
      if (ringtoneRef.current) { ringtoneRef.current.pause(); ringtoneRef.current = null; }

      const stream = await getMedia(kind);
      setLocalStream(stream);

      const pc = createPeer(fromUser, callId, kind);
      stream.getTracks().forEach(t => pc.addTrack(t, stream));
      setIncoming(null);

      // Tell caller we accepted (they'll know the offer is processable)
      await sendSignal("accept", fromUser, null, kind, callId);
    } catch (err: any) {
      toast.error(err?.message || "Impossibile accettare la chiamata");
      void endCall(true);
    }
  }, [createPeer, endCall, getMedia, incoming, sendSignal, user]);

  /** Reject an incoming call */
  const rejectCall = useCallback(async () => {
    if (!incoming) return;
    await sendSignal("reject", incoming.fromUser, null, incoming.kind, incoming.callId);
    if (ringtoneRef.current) { ringtoneRef.current.pause(); ringtoneRef.current = null; }
    setIncoming(null);
    setStatus("idle");
    callIdRef.current = null;
    peerIdRef.current = null;
  }, [incoming, sendSignal]);

  /** Toggle local mic */
  const toggleMic = useCallback((on?: boolean) => {
    if (!localStream) return;
    localStream.getAudioTracks().forEach(t => t.enabled = on ?? !t.enabled);
  }, [localStream]);

  /** Toggle local camera */
  const toggleCamera = useCallback((on?: boolean) => {
    if (!localStream) return;
    localStream.getVideoTracks().forEach(t => t.enabled = on ?? !t.enabled);
  }, [localStream]);

  // Realtime signaling listener
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`call-signals-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "call_signals",
          filter: `to_user=eq.${user.id}`,
        },
        async (payload) => {
          const sig = payload.new as SignalRow;
          const pc = pcRef.current;

          try {
            if (sig.signal_type === "ringing") {
              // Incoming call notification
              if (status !== "idle") {
                // Already busy — auto-reject
                await supabase.from("call_signals").insert({
                  call_id: sig.call_id,
                  from_user: user.id,
                  to_user: sig.from_user,
                  signal_type: "reject",
                  payload: { reason: "busy" },
                  call_kind: sig.call_kind,
                });
                return;
              }
              // Fetch caller profile
              const { data: prof } = await supabase
                .from("profiles")
                .select("display_name, avatar_url")
                .eq("user_id", sig.from_user)
                .maybeSingle();
              setIncoming({
                callId: sig.call_id,
                fromUser: sig.from_user,
                fromName: prof?.display_name || sig.payload?.name || "Sconosciuto",
                fromAvatar: prof?.avatar_url || undefined,
                kind: (sig.call_kind as CallKind) || "video",
              });
              setStatus("ringing-in");
              // Try to play ringtone (best-effort)
              try {
                const audio = new Audio("data:audio/wav;base64,UklGRkAAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YRwAAAAAAA==");
                audio.loop = true;
                audio.volume = 0.4;
                ringtoneRef.current = audio;
                await audio.play().catch(() => {});
              } catch {}
            } else if (sig.signal_type === "offer") {
              if (!pc || sig.call_id !== callIdRef.current) return;
              await pc.setRemoteDescription(new RTCSessionDescription({ type: "offer", sdp: sig.payload.sdp }));
              // Drain any queued ICE
              for (const c of pendingIceRef.current) {
                try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch {}
              }
              pendingIceRef.current = [];
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              await sendSignal("answer", sig.from_user, { sdp: answer.sdp, type: answer.type }, (sig.call_kind as CallKind) || "video", sig.call_id);
            } else if (sig.signal_type === "answer") {
              if (!pc || sig.call_id !== callIdRef.current) return;
              await pc.setRemoteDescription(new RTCSessionDescription({ type: "answer", sdp: sig.payload.sdp }));
              for (const c of pendingIceRef.current) {
                try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch {}
              }
              pendingIceRef.current = [];
              setStatus("connecting");
            } else if (sig.signal_type === "ice") {
              if (sig.call_id !== callIdRef.current) return;
              const cand = sig.payload as RTCIceCandidateInit;
              if (pc && pc.remoteDescription) {
                try { await pc.addIceCandidate(new RTCIceCandidate(cand)); } catch {}
              } else {
                pendingIceRef.current.push(cand);
              }
            } else if (sig.signal_type === "accept") {
              // Callee accepted; offer was already sent — we're just waiting for answer
              setStatus("connecting");
            } else if (sig.signal_type === "reject") {
              toast.info(sig.payload?.reason === "busy" ? "Utente occupato" : "Chiamata rifiutata");
              cleanupPeer();
              callIdRef.current = null;
              peerIdRef.current = null;
              setStatus("idle");
              setIncoming(null);
            } else if (sig.signal_type === "hangup") {
              toast.info("Chiamata terminata");
              cleanupPeer();
              callIdRef.current = null;
              peerIdRef.current = null;
              setStatus("idle");
              setIncoming(null);
            }
          } catch (err) {
            console.error("[CallSignal]", err);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, status]);

  // Cleanup on unmount
  useEffect(() => () => cleanupPeer(), [cleanupPeer]);

  return {
    status,
    incoming,
    localStream,
    remoteStream,
    activeKind,
    peerName,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMic,
    toggleCamera,
  };
}
