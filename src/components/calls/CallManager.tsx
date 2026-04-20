import { useEffect, useRef, useState } from "react";
import { useCall } from "@/contexts/CallContext";
import { Phone, PhoneOff, Video, Mic, MicOff, VideoOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

/**
 * Global UI for incoming + active calls. Mount once near the root.
 * Shows a fullscreen overlay when there's an incoming or active call.
 */
export default function CallManager() {
  const {
    status, incoming, localStream, remoteStream, activeKind, peerName,
    acceptCall, rejectCall, endCall, toggleMic, toggleCamera,
  } = useCall();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    if (status !== "in-call") { setElapsed(0); return; }
    const start = Date.now();
    const i = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(i);
  }, [status]);

  // Incoming call modal
  if (status === "ringing-in" && incoming) {
    return (
      <div className="fixed inset-0 z-[200] bg-background/95 backdrop-blur-md flex flex-col items-center justify-center p-6">
        <div className="text-center mb-8 animate-in fade-in zoom-in duration-300">
          <Avatar className="w-32 h-32 mx-auto mb-4 ring-4 ring-primary animate-pulse">
            <AvatarImage src={incoming.fromAvatar} />
            <AvatarFallback className="text-3xl">{incoming.fromName?.[0] || "?"}</AvatarFallback>
          </Avatar>
          <h2 className="text-2xl font-bold mb-1">{incoming.fromName || "Sconosciuto"}</h2>
          <p className="text-muted-foreground flex items-center justify-center gap-2">
            {incoming.kind === "video" ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
            Chiamata {incoming.kind === "video" ? "video" : "audio"} in arrivo...
          </p>
        </div>
        <div className="flex gap-12">
          <Button
            size="lg"
            variant="destructive"
            className="rounded-full w-16 h-16 p-0"
            onClick={rejectCall}
          >
            <PhoneOff className="w-7 h-7" />
          </Button>
          <Button
            size="lg"
            className="rounded-full w-16 h-16 p-0 bg-green-600 hover:bg-green-700"
            onClick={acceptCall}
          >
            <Phone className="w-7 h-7" />
          </Button>
        </div>
      </div>
    );
  }

  // Active or outgoing call
  if (status === "ringing-out" || status === "connecting" || status === "in-call") {
    const isVideo = activeKind === "video";
    return (
      <div className="fixed inset-0 z-[200] bg-black flex flex-col">
        <div className="relative flex-1 overflow-hidden">
          {isVideo && remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-white">
              <Avatar className="w-40 h-40 mb-6 ring-4 ring-primary">
                <AvatarFallback className="text-4xl bg-primary/20">{peerName?.[0] || "?"}</AvatarFallback>
              </Avatar>
              <h2 className="text-2xl font-bold">{peerName || "Chiamata"}</h2>
              <p className="text-white/70 mt-2">
                {status === "ringing-out" && "Squillo..."}
                {status === "connecting" && "Connessione..."}
                {status === "in-call" && `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, "0")}`}
              </p>
            </div>
          )}

          {isVideo && localStream && (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="absolute top-4 right-4 w-32 h-44 rounded-xl object-cover border-2 border-white/30 shadow-xl"
            />
          )}

          {isVideo && status === "in-call" && (
            <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
              {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}
            </div>
          )}
        </div>

        <div className="bg-black/80 backdrop-blur p-6 flex justify-center gap-6">
          <Button
            size="lg"
            variant="secondary"
            className="rounded-full w-14 h-14 p-0"
            onClick={() => { setMuted(m => !m); toggleMic(muted); }}
          >
            {muted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </Button>
          {isVideo && (
            <Button
              size="lg"
              variant="secondary"
              className="rounded-full w-14 h-14 p-0"
              onClick={() => { setCamOff(c => !c); toggleCamera(camOff); }}
            >
              {camOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
            </Button>
          )}
          <Button
            size="lg"
            variant="destructive"
            className="rounded-full w-14 h-14 p-0"
            onClick={() => endCall(true)}
          >
            <PhoneOff className="w-6 h-6" />
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
