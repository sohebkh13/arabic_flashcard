// On-device Whisper is not available in Expo Go (requires native EAS build with whisper.rn).
// This module provides a transcription stub.
// In a production EAS native build, replace transcribeAudio() with whisper.rn inference.

export async function transcribeAudio(_uri: string): Promise<string> {
  // In a native EAS build, integrate whisper.rn here:
  //   import { initWhisper } from 'whisper.rn';
  //   const ctx = await initWhisper({ filePath: require('./assets/ggml-base.bin') });
  //   const { result } = await ctx.transcribe(uri, { language: 'ar' });
  //   return result;
  //
  // For Expo Go: return a placeholder so the UI flow still works
  return "[Whisper requires native build — type the word instead]";
}

export function isWhisperAvailable(): boolean {
  return false;
}
