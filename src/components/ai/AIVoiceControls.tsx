import { Mic, Volume2 } from "lucide-react";

interface Props {
  wakeWordEnabled: boolean;
  isTTSEnabled: boolean;
  onToggleWakeWord: () => void;
  onToggleTTS: () => void;
}

export default function AIVoiceControls({ wakeWordEnabled, isTTSEnabled, onToggleWakeWord, onToggleTTS }: Props) {
  return (
    <div className="sticky bottom-20 px-4 py-2 flex justify-center gap-2">
      <button
        onClick={onToggleWakeWord}
        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
          wakeWordEnabled ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-muted text-muted-foreground"
        }`}
      >
        <Mic className="w-3 h-3 inline mr-1" aria-hidden="true" /> Wake Word {wakeWordEnabled ? "ON" : "OFF"}
      </button>
      <button
        onClick={onToggleTTS}
        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
          isTTSEnabled ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "bg-muted text-muted-foreground"
        }`}
      >
        <Volume2 className="w-3 h-3 inline mr-1" aria-hidden="true" /> Audio {isTTSEnabled ? "ON" : "OFF"}
      </button>
    </div>
  );
}
