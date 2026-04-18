// DeepL Free API — header-based authentication (required since Nov 2025)
import { Platform } from "react-native";

const DEEPL_API_KEY = process.env.EXPO_PUBLIC_DEEPL_API_KEY ?? "";
// On web, browsers block direct calls (CORS). Route through local proxy.
// On native (Expo Go / Android), call DeepL directly — no CORS restrictions.
const DEEPL_BASE = Platform.OS === "web"
  ? "http://localhost:3099/v2"
  : "https://api-free.deepl.com/v2";

export type TranslationDirection = "ar_to_en" | "en_to_ar";

export interface TranslationResult {
  translatedText: string;
  detectedSourceLang?: string;
}

export async function translate(
  text: string,
  direction: TranslationDirection
): Promise<TranslationResult> {
  if (!text.trim()) throw new Error("Empty input");

  if (!DEEPL_API_KEY) {
    throw new Error("DeepL API key not configured. Add EXPO_PUBLIC_DEEPL_API_KEY in .env file.");
  }

  const sourceLang = direction === "ar_to_en" ? "AR" : "EN";
  const targetLang = direction === "ar_to_en" ? "EN-US" : "AR";

  const res = await fetch(`${DEEPL_BASE}/translate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Header-based auth (required since Nov 2025 — form body auth deprecated)
      "Authorization": `DeepL-Auth-Key ${DEEPL_API_KEY}`,
    },
    body: JSON.stringify({
      text: [text],
      source_lang: sourceLang,
      target_lang: targetLang,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Translation failed (${res.status}): ${errText}`);
  }

  const data = await res.json() as {
    translations: Array<{ text: string; detected_source_language: string }>;
  };

  const translation = data.translations[0];
  return {
    translatedText: translation.text,
    detectedSourceLang: translation.detected_source_language,
  };
}

export function detectDirection(text: string): TranslationDirection {
  return /[\u0600-\u06FF]/.test(text) ? "ar_to_en" : "en_to_ar";
}

export async function detectAndTranslate(text: string): Promise<TranslationResult & { direction: TranslationDirection }> {
  const direction = detectDirection(text);
  const result = await translate(text, direction);
  return { ...result, direction };
}
