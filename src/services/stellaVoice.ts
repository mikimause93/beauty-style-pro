/**
 * stellaVoice.ts — Beauty Style Pro v2.0.0
 * Servizio vocale di Stella: STT via OpenAI Whisper, TTS via ElevenLabs.
 * Endpoint base configurabile via VITE_STELLA_VOICE_URL.
 */

const VOICE_URL = import.meta.env.VITE_STELLA_VOICE_URL ?? "http://localhost:8002";
const ELEVENLABS_VOICE_ID =
  import.meta.env.VITE_ELEVENLABS_VOICE_ID ?? "21m00Tcm4TlvDq8ikWAM"; // Rachel

export interface TranscribeOptions {
  language?: string;
  prompt?: string;
}

/**
 * Trascrive un blob audio con OpenAI Whisper tramite il voice service.
 */
export async function transcribeAudio(
  audioBlob: Blob,
  options: TranscribeOptions = {},
): Promise<string> {
  const form = new FormData();
  form.append("audio", audioBlob, "recording.webm");
  if (options.language) form.append("language", options.language);
  if (options.prompt) form.append("prompt", options.prompt);

  const res = await fetch(`${VOICE_URL}/v2/stt`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    throw new Error(`STT error: ${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as { text: string };
  return data.text ?? "";
}

/**
 * Genera audio dalla stringa `text` con la voce italiana ElevenLabs di Stella.
 * Restituisce un Blob audio da riprodurre con HTMLAudioElement.
 */
export async function synthesizeSpeech(
  text: string,
  voiceId = ELEVENLABS_VOICE_ID,
): Promise<Blob> {
  const res = await fetch(`${VOICE_URL}/v2/tts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, voiceId }),
  });
  if (!res.ok) {
    throw new Error(`TTS error: ${res.status} ${res.statusText}`);
  }
  return res.blob();
}

/**
 * Riproduce il testo come audio ElevenLabs, restituisce il
 * HTMLAudioElement per permettere stop/pause.
 */
export async function speakWithElevenLabs(text: string): Promise<HTMLAudioElement> {
  const blob = await synthesizeSpeech(text);
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  audio.onended = () => URL.revokeObjectURL(url);
  audio.play();
  return audio;
}
