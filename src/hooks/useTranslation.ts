import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

const LANGUAGES = [
  { code: "it", label: "🇮🇹 Italiano" },
  { code: "en", label: "🇬🇧 English" },
  { code: "es", label: "🇪🇸 Español" },
  { code: "fr", label: "🇫🇷 Français" },
  { code: "de", label: "🇩🇪 Deutsch" },
  { code: "pt", label: "🇵🇹 Português" },
  { code: "ar", label: "🇸🇦 العربية" },
  { code: "zh", label: "🇨🇳 中文" },
  { code: "ja", label: "🇯🇵 日本語" },
  { code: "ru", label: "🇷🇺 Русский" },
];

export function useTranslation() {
  const [translating, setTranslating] = useState(false);
  const [targetLang, setTargetLang] = useState("it");
  const [autoTranslate, setAutoTranslate] = useState(true);
  const cacheRef = useRef<Map<string, string>>(new Map());

  const translate = useCallback(async (text: string, target?: string): Promise<string> => {
    if (!text.trim()) return text;
    const lang = target || targetLang;
    const cacheKey = `${text.slice(0, 80)}__${lang}`;
    if (cacheRef.current.has(cacheKey)) return cacheRef.current.get(cacheKey)!;
    setTranslating(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-translate", {
        body: { text, targetLang: lang },
      });
      if (error) throw error;
      const result = data?.translated || text;
      cacheRef.current.set(cacheKey, result);
      return result;
    } catch {
      return text;
    } finally {
      setTranslating(false);
    }
  }, [targetLang]);

  return { translate, translating, targetLang, setTargetLang, autoTranslate, setAutoTranslate, LANGUAGES };
}
