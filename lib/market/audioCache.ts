/**
 * Market Audio Cache
 *
 * Session-based cache for TTS audio. Cleared on page refresh.
 * This avoids regenerating the same audio within a session.
 */

/** Cache for phrase audio (keyed by phrase ID or vietnamese text) */
export const phraseAudioCache = new Map<string, string>();

/** Cache for vendor dialogue audio (keyed by vietnamese text) */
export const vendorAudioCache = new Map<string, string>();

/** Get cache key from text (normalize for consistent lookups) */
export function getCacheKey(text: string): string {
  return text.trim().toLowerCase();
}

/** Check if audio is cached */
export function hasAudioCached(text: string): boolean {
  const key = getCacheKey(text);
  return phraseAudioCache.has(key) || vendorAudioCache.has(key);
}

/** Get cached audio URL */
export function getCachedAudio(text: string): string | undefined {
  const key = getCacheKey(text);
  return phraseAudioCache.get(key) || vendorAudioCache.get(key);
}

/** Cache audio URL */
export function cacheAudio(text: string, audioUrl: string): void {
  const key = getCacheKey(text);
  phraseAudioCache.set(key, audioUrl);
}
