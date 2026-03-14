import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useTranslation() {
  const [translating, setTranslating] = useState(false);
  const [autoTranslate, setAutoTranslate] = useState(true);
  const cacheRef = useRef<Map<string, string>>(new Map());

  // Auto-detect source language and translate to user's browser language
  const getUserLanguage = (): string => {
    const browserLang = navigator.language?.split("-")[0] || "it";
    return browserLang;
  };

  const translate = useCallback(async (text: string, targetOverride?: string): Promise<string> => {
    if (!text.trim() || text.length < 3) return text;
    const target = targetOverride || getUserLanguage();
    const cacheKey = `${text.slice(0, 80)}__${target}`;
    if (cacheRef.current.has(cacheKey)) return cacheRef.current.get(cacheKey)!;
    
    setTranslating(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-translate", {
        body: { 
          text, 
          sourceLang: "auto-detect",
          targetLang: target 
        },
      });
      if (error) throw error;
      const result = data?.translated || text;
      
      // Don't cache if translation is same as original (same language)
      if (result.trim().toLowerCase() === text.trim().toLowerCase()) {
        return text;
      }
      
      cacheRef.current.set(cacheKey, result);
      return result;
    } catch {
      return text;
    } finally {
      setTranslating(false);
    }
  }, []);

  return { translate, translating, autoTranslate, setAutoTranslate, getUserLanguage };
}
