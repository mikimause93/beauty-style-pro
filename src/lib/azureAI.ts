/**
 * Azure AI Services — lightweight REST helpers.
 *
 * All functions gracefully return null / throw so callers can fall back to
 * the existing Supabase Edge-Function implementations when Azure env vars
 * are not configured.
 *
 * Environment variables (all optional — see .env.example):
 *   VITE_AZURE_OPENAI_KEY / VITE_AZURE_OPENAI_ENDPOINT / VITE_AZURE_OPENAI_DEPLOYMENT
 *   VITE_AZURE_SPEECH_KEY / VITE_AZURE_SPEECH_REGION
 *   VITE_AZURE_TRANSLATOR_KEY / VITE_AZURE_TRANSLATOR_REGION
 *   VITE_AZURE_FACE_KEY / VITE_AZURE_FACE_ENDPOINT
 *   VITE_AZURE_STORAGE_ACCOUNT / VITE_AZURE_STORAGE_SAS_TOKEN
 */

// ── Configuration helpers ──────────────────────────────────────────────────

export const azureConfig = {
  openai: {
    key: import.meta.env.VITE_AZURE_OPENAI_KEY as string | undefined,
    endpoint: import.meta.env.VITE_AZURE_OPENAI_ENDPOINT as string | undefined,
    deployment: import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT as string | undefined,
  },
  speech: {
    key: import.meta.env.VITE_AZURE_SPEECH_KEY as string | undefined,
    region: import.meta.env.VITE_AZURE_SPEECH_REGION as string | undefined,
  },
  translator: {
    key: import.meta.env.VITE_AZURE_TRANSLATOR_KEY as string | undefined,
    region: import.meta.env.VITE_AZURE_TRANSLATOR_REGION as string | undefined,
  },
  face: {
    key: import.meta.env.VITE_AZURE_FACE_KEY as string | undefined,
    endpoint: import.meta.env.VITE_AZURE_FACE_ENDPOINT as string | undefined,
  },
  storage: {
    account: import.meta.env.VITE_AZURE_STORAGE_ACCOUNT as string | undefined,
    sasToken: import.meta.env.VITE_AZURE_STORAGE_SAS_TOKEN as string | undefined,
  },
} as const;

export const isAzureOpenAIEnabled = () =>
  !!(azureConfig.openai.key && azureConfig.openai.endpoint && azureConfig.openai.deployment);

export const isAzureSpeechEnabled = () =>
  !!(azureConfig.speech.key && azureConfig.speech.region);

export const isAzureTranslatorEnabled = () =>
  !!(azureConfig.translator.key);

export const isAzureFaceEnabled = () =>
  !!(azureConfig.face.key && azureConfig.face.endpoint);

export const isAzureStorageEnabled = () =>
  !!(azureConfig.storage.account && azureConfig.storage.sasToken);

// ── Azure OpenAI ───────────────────────────────────────────────────────────

export interface AzureOpenAIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AzureOpenAIOptions {
  messages: AzureOpenAIMessage[];
  temperature?: number;
  maxTokens?: number;
}

/**
 * Call Azure OpenAI chat completions (non-streaming).
 * Returns the assistant reply or throws on error.
 */
export async function azureOpenAIChat(options: AzureOpenAIOptions): Promise<string> {
  const { key, endpoint, deployment } = azureConfig.openai;
  if (!key || !endpoint || !deployment) {
    throw new Error("Azure OpenAI not configured");
  }

  const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=2024-02-15-preview`;

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": key,
    },
    body: JSON.stringify({
      messages: options.messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 800,
    }),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => resp.statusText);
    throw new Error(`Azure OpenAI error ${resp.status}: ${text}`);
  }

  const json = await resp.json();
  return (json.choices?.[0]?.message?.content ?? "") as string;
}

/**
 * Stream Azure OpenAI chat completions via Server-Sent Events.
 */
export async function azureOpenAIStream(options: AzureOpenAIOptions & {
  onDelta: (text: string) => void;
  onDone: () => void;
  onError?: (error: string) => void;
}) {
  const { key, endpoint, deployment } = azureConfig.openai;
  if (!key || !endpoint || !deployment) {
    options.onError?.("Azure OpenAI not configured");
    return;
  }

  const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=2024-02-15-preview`;

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": key,
    },
    body: JSON.stringify({
      messages: options.messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 800,
      stream: true,
    }),
  });

  if (resp.status === 429) {
    options.onError?.("Troppe richieste Azure, riprova tra poco");
    return;
  }
  if (!resp.ok || !resp.body) {
    options.onError?.("Errore Azure OpenAI");
    return;
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buf.indexOf("\n")) !== -1) {
      let line = buf.slice(0, idx);
      buf = buf.slice(idx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line.startsWith("data: ") || line.trim() === "") continue;
      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") { options.onDone(); return; }
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) options.onDelta(content);
      } catch { /* skip malformed chunks */ }
    }
  }

  options.onDone();
}

// ── Azure Translator ───────────────────────────────────────────────────────

/**
 * Translate text using Azure Translator REST API.
 * @param text      - Source text.
 * @param targetLang - BCP-47 language code, e.g. "it", "en", "fr".
 * @param sourceLang - Optional BCP-47 source language; "auto-detect" or omit to detect automatically.
 * @returns Translated text, or the original text if the call fails.
 */
export async function azureTranslate(
  text: string,
  targetLang: string,
  sourceLang?: string
): Promise<string> {
  const { key, region } = azureConfig.translator;
  if (!key) throw new Error("Azure Translator not configured");

  const params = new URLSearchParams({ "api-version": "3.0", to: targetLang });
  if (sourceLang && sourceLang !== "auto-detect") params.set("from", sourceLang);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Ocp-Apim-Subscription-Key": key,
  };
  if (region) headers["Ocp-Apim-Subscription-Region"] = region;

  const resp = await fetch(
    `https://api.cognitive.microsofttranslator.com/translate?${params.toString()}`,
    { method: "POST", headers, body: JSON.stringify([{ Text: text }]) }
  );

  if (!resp.ok) {
    const err = await resp.text().catch(() => resp.statusText);
    throw new Error(`Azure Translator error ${resp.status}: ${err}`);
  }

  const json = await resp.json();
  return json?.[0]?.translations?.[0]?.text as string ?? text;
}

// ── Azure Speech TTS ───────────────────────────────────────────────────────

/** Escape special XML characters for use in SSML strings. */
function escapeXml(str: string): string {
  return str.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<": return "&lt;";
      case ">": return "&gt;";
      case "&": return "&amp;";
      case "'": return "&apos;";
      case '"': return "&quot;";
      default: return c;
    }
  });
}

/**
 * Synthesise speech using Azure Cognitive Services Speech REST API.
 * Returns an AudioBuffer ready for playback, or throws on error.
 * @param text   - Text to synthesise.
 * @param voice  - Azure voice name (default: "it-IT-ElsaNeural").
 * @param lang   - BCP-47 language code (default: "it-IT").
 */
export async function azureSynthesizeSpeech(
  text: string,
  voice = "it-IT-ElsaNeural",
  lang = "it-IT"
): Promise<ArrayBuffer> {
  const { key, region } = azureConfig.speech;
  if (!key || !region) throw new Error("Azure Speech not configured");

  const ssml = `<speak version='1.0' xml:lang='${lang}'>
    <voice xml:lang='${lang}' name='${voice}'>${escapeXml(text)}</voice>
  </speak>`;

  const resp = await fetch(
    `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/ssml+xml",
        "Ocp-Apim-Subscription-Key": key,
        "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
      },
      body: ssml,
    }
  );

  if (!resp.ok) {
    const err = await resp.text().catch(() => resp.statusText);
    throw new Error(`Azure Speech error ${resp.status}: ${err}`);
  }

  return resp.arrayBuffer();
}

// ── Azure Face / Vision ────────────────────────────────────────────────────

export interface FaceAttribute {
  age?: number;
  gender?: string;
  smile?: number;
  headPose?: { pitch: number; roll: number; yaw: number };
  facialHair?: { moustache: number; beard: number; sideburns: number };
  glasses?: string;
  emotion?: Record<string, number>;
  hair?: {
    bald: number;
    invisible: boolean;
    hairColor: Array<{ color: string; confidence: number }>;
  };
}

export interface DetectedFace {
  faceId?: string;
  faceRectangle: { top: number; left: number; width: number; height: number };
  faceAttributes?: FaceAttribute;
}

/**
 * Detect faces and analyse attributes using Azure Face API.
 * @param imageUrl - Publicly accessible URL of the image to analyse.
 * @returns Array of detected faces with attributes.
 */
export async function azureAnalyzeFace(imageUrl: string): Promise<DetectedFace[]> {
  const { key, endpoint } = azureConfig.face;
  if (!key || !endpoint) throw new Error("Azure Face API not configured");

  const params = new URLSearchParams({
    returnFaceId: "true",
    returnFaceLandmarks: "false",
    returnFaceAttributes:
      "age,gender,smile,headPose,facialHair,glasses,emotion,hair",
  });

  const base = endpoint.endsWith("/") ? endpoint.slice(0, -1) : endpoint;
  const resp = await fetch(`${base}/face/v1.0/detect?${params.toString()}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Ocp-Apim-Subscription-Key": key,
    },
    body: JSON.stringify({ url: imageUrl }),
  });

  if (!resp.ok) {
    const err = await resp.text().catch(() => resp.statusText);
    throw new Error(`Azure Face API error ${resp.status}: ${err}`);
  }

  return resp.json() as Promise<DetectedFace[]>;
}

// ── Azure Blob Storage ────────────────────────────────────────────────────

/**
 * Upload a file to Azure Blob Storage using a pre-configured SAS token.
 * @param file       - File to upload.
 * @param container  - Container name (e.g. "user-photos").
 * @param blobName   - Destination blob path (e.g. "userId/photo.jpg").
 * @returns Public URL of the uploaded blob.
 */
export async function azureUploadBlob(
  file: File,
  container: string,
  blobName: string
): Promise<string> {
  const { account, sasToken } = azureConfig.storage;
  if (!account || !sasToken) throw new Error("Azure Storage not configured");

  const url = `https://${account}.blob.core.windows.net/${container}/${blobName}?${sasToken}`;

  const resp = await fetch(url, {
    method: "PUT",
    headers: {
      "x-ms-blob-type": "BlockBlob",
      "Content-Type": file.type,
    },
    body: file,
  });

  if (!resp.ok) {
    const err = await resp.text().catch(() => resp.statusText);
    throw new Error(`Azure Storage error ${resp.status}: ${err}`);
  }

  return `https://${account}.blob.core.windows.net/${container}/${blobName}`;
}
