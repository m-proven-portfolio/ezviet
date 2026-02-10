/**
 * Vietnamese diacritics mapping for slug generation
 */
const vietnameseMap: Record<string, string> = {
  'à': 'a', 'á': 'a', 'ạ': 'a', 'ả': 'a', 'ã': 'a',
  'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ậ': 'a', 'ẩ': 'a', 'ẫ': 'a',
  'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ặ': 'a', 'ẳ': 'a', 'ẵ': 'a',
  'è': 'e', 'é': 'e', 'ẹ': 'e', 'ẻ': 'e', 'ẽ': 'e',
  'ê': 'e', 'ề': 'e', 'ế': 'e', 'ệ': 'e', 'ể': 'e', 'ễ': 'e',
  'ì': 'i', 'í': 'i', 'ị': 'i', 'ỉ': 'i', 'ĩ': 'i',
  'ò': 'o', 'ó': 'o', 'ọ': 'o', 'ỏ': 'o', 'õ': 'o',
  'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ộ': 'o', 'ổ': 'o', 'ỗ': 'o',
  'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ợ': 'o', 'ở': 'o', 'ỡ': 'o',
  'ù': 'u', 'ú': 'u', 'ụ': 'u', 'ủ': 'u', 'ũ': 'u',
  'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ự': 'u', 'ử': 'u', 'ữ': 'u',
  'ỳ': 'y', 'ý': 'y', 'ỵ': 'y', 'ỷ': 'y', 'ỹ': 'y',
  'đ': 'd',
};

/**
 * Generate a URL-friendly slug from text (Vietnamese-aware)
 * "Con Bướm Xuân" -> "con-buom-xuan"
 */
export function slugify(text: string): string {
  let result = text.toLowerCase().trim();

  // Replace Vietnamese characters
  result = result
    .split('')
    .map((char) => vietnameseMap[char] || char)
    .join('');

  return result
    .replace(/[^a-z0-9\s-]/g, '') // Remove non-alphanumeric except spaces/hyphens
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Format date for display
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
}

/**
 * Format relative time like "2 hours ago", "3 days ago"
 */
export function formatDistanceToNow(date: string | Date): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffWeeks < 4) return `${diffWeeks}w ago`;
  if (diffMonths < 12) return `${diffMonths}mo ago`;
  return formatDate(date);
}

/**
 * Get Supabase storage public URL
 */
export function getStorageUrl(bucket: string, path: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}

/**
 * Check if an error is a network-related error that should be silently ignored.
 * These errors occur when:
 * - Device goes to sleep (ERR_NETWORK_IO_SUSPENDED)
 * - Network connection changes (ERR_NETWORK_CHANGED)
 * - DNS resolution fails during network transition (ERR_NAME_NOT_RESOLVED)
 * - User is offline
 *
 * These are expected behaviors and shouldn't spam the console.
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return true;
  }
  // Check for AbortError (request was cancelled)
  if (error instanceof DOMException && error.name === 'AbortError') {
    return true;
  }
  return false;
}

/**
 * Get the start timestamp of the current 6-hour learning cycle.
 * Cycles start at: 00:00, 06:00, 12:00, 18:00
 * Used for seeded randomization so all users see the same card order per cycle.
 */
export function getCycleTimestamp(): number {
  const now = new Date();
  const hour = now.getHours();
  const cycleHour = Math.floor(hour / 6) * 6;
  const cycleStart = new Date(now);
  cycleStart.setHours(cycleHour, 0, 0, 0);
  return cycleStart.getTime();
}

/**
 * Deterministic shuffle using a seeded random number generator.
 * Same seed always produces the same shuffled order (Fisher-Yates with LCG).
 */
export function seededShuffle<T>(array: T[], seed: number): T[] {
  const result = [...array];
  let s = seed;
  const random = () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
