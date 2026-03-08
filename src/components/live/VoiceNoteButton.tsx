import { useState, useRef } from "react";
import { Mic, Square, Send } from "lucide-react";
import { toast } from "sonner";

interface VoiceNoteButtonProps {
  onSend: (audioBlob: Blob, durationSecs: number) => void;
}

export default function VoiceNoteButton({ onSend }: VoiceNoteButtonProps) {
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = e => chunksRef.current.push(e.data);
      recorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        if (duration > 0) onSend(blob, duration);
        setDuration(0);
      };
      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
      setDuration(0);
      timerRef.current = window.setInterval(() => setDuration(d => d + 1), 1000);
    } catch {
      toast.error("Permesso microfono negato");
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    recorderRef.current?.stop();
    setRecording(false);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  if (recording) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-destructive/10 border border-destructive/30 animate-pulse">
        <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
        <span className="text-xs font-mono font-bold text-destructive">{formatTime(duration)}</span>
        <button onClick={stopRecording} className="w-8 h-8 rounded-full bg-destructive flex items-center justify-center">
          <Square className="w-3.5 h-3.5 text-destructive-foreground fill-destructive-foreground" />
        </button>
      </div>
    );
  }

  return (
    <button onClick={startRecording}
      className="w-10 h-10 rounded-full glass flex items-center justify-center hover:scale-110 transition-transform"
      title="Nota vocale">
      <Mic className="w-4 h-4 text-primary" />
    </button>
  );
}
