import React, { useState, useEffect } from "react";

const CACHE_KEY = "al_waleed_translation_cache";

let translationCache: Record<string, string> = {};

try {
  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    translationCache = JSON.parse(cached);
  }
} catch (e) {
  console.error("Failed to load translation cache from localStorage", e);
}

function saveCache() {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(translationCache));
  } catch (e) {
    console.error("Failed to save translation cache to localStorage", e);
  }
}

/**
 * Checks if a string contains Arabic characters
 */
export function hasArabicCharacters(text: any): boolean {
  if (!text || typeof text !== "string") return false;
  const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  return arabicPattern.test(text);
}

/**
 * Translates a given text to the target language securely using the backend API
 */
export async function fetchTranslation(text: string, targetLang: 'en' | 'ar'): Promise<string> {
  if (!text || !text.trim()) return text;
  
  // If targetLang is Arabic and input doesn't contain Arabic, or targetLang is English and input doesn't contain Arabic
  // We can shortcut unless translation is really needed.
  if (targetLang === 'en' && !hasArabicCharacters(text)) {
    return text; // Already English
  }

  const cacheKey = `${text.trim()}_to_${targetLang}`;
  if (translationCache[cacheKey]) {
    return translationCache[cacheKey];
  }

  try {
    const response = await fetch("/api/translate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text, targetLang }),
    });
    const data = await response.json();
    if (data && data.translation) {
      translationCache[cacheKey] = data.translation;
      saveCache();
      return data.translation;
    }
  } catch (err) {
    console.error(`Failed to fetch translation for: "${text}"`, err);
  }
  return text;
}

interface TranslatedTextProps {
  text: string;
  lang: 'ar' | 'en';
  fallback?: string;
  className?: string;
}

/**
 * A highly resilient React component that automatically translates Arabic database content
 * into English on-the-fly when the language is set to 'en', using the secure Gemini API.
 */
export function TranslatedText({ text, lang, fallback, className }: TranslatedTextProps) {
  const [displayText, setDisplayText] = useState(text || "");
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    let active = true;
    if (!text) {
      setDisplayText("");
      return;
    }

    if (lang === "en" && hasArabicCharacters(text)) {
      // Check if already in cache to avoid setting state multiple times or flashing loading
      const cacheKey = `${text.trim()}_to_en`;
      if (translationCache[cacheKey]) {
        setDisplayText(translationCache[cacheKey]);
        setIsTranslating(false);
        return;
      }

      setIsTranslating(true);
      fetchTranslation(text, "en").then((translated) => {
        if (active) {
          setDisplayText(translated);
          setIsTranslating(false);
        }
      });
    } else {
      setDisplayText(text);
      setIsTranslating(false);
    }

    return () => {
      active = false;
    };
  }, [text, lang]);

  return (
    <span className={`${className || ""} ${isTranslating ? "opacity-60 animate-pulse transition-opacity" : "transition-opacity"}`}>
      {displayText || fallback || text}
    </span>
  );
}
