// DeepL Free API — header-based authentication (required since Nov 2025)
import { Platform } from "react-native";

const DEEPL_API_KEY = process.env.EXPO_PUBLIC_DEEPL_API_KEY ?? "";
const WEB_PROXY_URL = process.env.EXPO_PUBLIC_DEEPL_PROXY_URL;

function getWebProxyBase(): string {
  if (WEB_PROXY_URL) {
    return WEB_PROXY_URL;
  }

  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    const isLocalHost =
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1" ||
      hostname.endsWith(".localhost");

    if (isLocalHost) {
      return "http://localhost:3099/v2";
    }
  }

  return "/api/deepl";
}

// On web, browsers block direct calls (CORS). Route through a same-origin proxy.
// On native (Expo Go / Android), call DeepL directly — no CORS restrictions.
const DEEPL_BASE = Platform.OS === "web" ? getWebProxyBase() : "https://api-free.deepl.com/v2";

export type TranslationDirection = "ar_to_en" | "en_to_ar";

export interface TranslationResult {
  translatedText: string;
  detectedSourceLang?: string;
}

export async function translate(
  text: string,
  direction: TranslationDirection,
  signal?: AbortSignal
): Promise<TranslationResult> {
  if (!text.trim()) throw new Error("Empty input");

  if (!DEEPL_API_KEY) {
    throw new Error("DeepL API key not configured. Add EXPO_PUBLIC_DEEPL_API_KEY in .env file.");
  }

  const sourceLang = direction === "ar_to_en" ? "AR" : "EN";
  const targetLang = direction === "ar_to_en" ? "EN-US" : "AR";

  const res = await fetch(`${DEEPL_BASE.replace(/\/+$/, "")}/translate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Header-based auth (required since Nov 2025 — form body auth deprecated)
      "Authorization": `DeepL-Auth-Key ${DEEPL_API_KEY}`,
    },
    signal,
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

export function isLikelyRomanizedArabic(text: string): boolean {
  const value = text.trim();
  if (!value) return false;
  const hasArabic = /[\u0600-\u06FF]/.test(value);
  const hasLatin = /[a-z]/i.test(value);
  return !hasArabic && hasLatin;
}

export async function convertRomanizedToArabic(text: string, signal?: AbortSignal): Promise<string> {
  const value = text.trim();
  if (!value) return value;
  if (!isLikelyRomanizedArabic(value)) return value;

  const result = await translate(value, "en_to_ar", signal);
  return result.translatedText;
}

const arabicToLatinMap: Array<[RegExp, string]> = [
  [/آ/g, "aa"],
  [/أ|إ|ا/g, "a"],
  [/ب/g, "b"],
  [/ت/g, "t"],
  [/ث/g, "th"],
  [/ج/g, "j"],
  [/ح/g, "h"],
  [/خ/g, "kh"],
  [/د/g, "d"],
  [/ذ/g, "dh"],
  [/ر/g, "r"],
  [/ز/g, "z"],
  [/س/g, "s"],
  [/ش/g, "sh"],
  [/ص/g, "s"],
  [/ض/g, "d"],
  [/ط/g, "t"],
  [/ظ/g, "z"],
  [/ع/g, "'"],
  [/غ/g, "gh"],
  [/ف/g, "f"],
  [/ق/g, "q"],
  [/ك/g, "k"],
  [/ل/g, "l"],
  [/م/g, "m"],
  [/ن/g, "n"],
  [/ه/g, "h"],
  [/و/g, "w"],
  [/ي/g, "y"],
  [/ة/g, "ah"],
  [/ى/g, "a"],
  [/ء/g, "'"],
  [/ؤ/g, "u"],
  [/ئ/g, "i"],
  [/ً|ٌ|ٍ|َ|ُ|ِ|ْ|ّ|ٰ/g, ""],
];

export function transliterateArabicToLatin(text: string): string {
  const value = text.trim();
  if (!value) return value;

  return arabicToLatinMap.reduce((acc, [pattern, replacement]) => acc.replace(pattern, replacement), value);
}

export async function detectAndTranslate(text: string): Promise<TranslationResult & { direction: TranslationDirection }> {
  const direction = detectDirection(text);
  const result = await translate(text, direction);
  return { ...result, direction };
}
