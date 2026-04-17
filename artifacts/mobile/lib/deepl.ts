// DeepL Free API integration
// The API key is passed via EXPO_PUBLIC_DEEPL_API_KEY env var (set in Replit secrets)
const DEEPL_API_KEY = process.env.EXPO_PUBLIC_DEEPL_API_KEY ?? "";
const DEEPL_BASE = "https://api-free.deepl.com/v2";

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
    throw new Error("DeepL API key not configured. Set DEEPL_API_KEY in Replit Secrets.");
  }

  const sourceLang = direction === "ar_to_en" ? "AR" : "EN";
  const targetLang = direction === "ar_to_en" ? "EN-US" : "AR";

  const params = new URLSearchParams({
    auth_key: DEEPL_API_KEY,
    text,
    source_lang: sourceLang,
    target_lang: targetLang,
  });

  const res = await fetch(`${DEEPL_BASE}/translate`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`DeepL error ${res.status}: ${errText}`);
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

export async function detectAndTranslate(text: string): Promise<TranslationResult & { direction: TranslationDirection }> {
  // Detect Arabic by checking for Arabic Unicode characters
  const arabicRegex = /[\u0600-\u06FF]/;
  const isArabic = arabicRegex.test(text);
  const direction: TranslationDirection = isArabic ? "ar_to_en" : "en_to_ar";
  const result = await translate(text, direction);
  return { ...result, direction };
}
