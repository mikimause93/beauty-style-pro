import { useState, useCallback } from "react";
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
  const [targetLang, setTargetLang] = useState("en");

  const translate = useCallback(async (text: string, target?: string): Promise<string> => {
    if (!text.trim()) return text;
    setTranslating(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-translate", {
        body: { text, targetLang: target || targetLang },
      });
      if (error) throw error;
      return data?.translated || text;
    } catch {
      return text;
    } finally {
      setTranslating(false);
    }
  }, [targetLang]);

  return { translate, translating, targetLang, setTargetLang, LANGUAGES };
}
