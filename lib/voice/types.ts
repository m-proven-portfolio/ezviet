/**
 * Voice Recording System Types
 *
 * Universal types for recording, storing, and tracking
 * user voice progress across the entire app.
 */

/** Context where the recording was made */
export type VoiceContext = 'market' | 'flashcard' | 'tone_gym' | 'practice';

/** A stored voice recording */
export interface VoiceRecording {
  id: string;
  userId: string;
  context: VoiceContext;
  phraseText: string;
  phraseId?: string;
  storagePath: string;
  publicUrl: string;
  durationMs: number;
  createdAt: Date;
  ratingCount: number;
  ratingAverage: number | null;
}

/** Database row shape (snake_case) */
export interface VoiceRecordingRow {
  id: string;
  user_id: string;
  context: string;
  phrase_text: string;
  phrase_id: string | null;
  storage_path: string;
  duration_ms: number | null;
  created_at: string;
  rating_count: number;
  rating_sum: number;
}

/** User's voice recording progress stats */
export interface VoiceProgress {
  totalRecordings: number;
  recordingsByContext: Record<VoiceContext, number>;
  firstRecordingDate: Date | null;
  latestRecordingDate: Date | null;
}

/** Convert database row to VoiceRecording */
export function toVoiceRecording(
  row: VoiceRecordingRow,
  publicUrl: string
): VoiceRecording {
  return {
    id: row.id,
    userId: row.user_id,
    context: row.context as VoiceContext,
    phraseText: row.phrase_text,
    phraseId: row.phrase_id ?? undefined,
    storagePath: row.storage_path,
    publicUrl,
    durationMs: row.duration_ms ?? 0,
    createdAt: new Date(row.created_at),
    ratingCount: row.rating_count,
    ratingAverage: row.rating_count > 0 ? row.rating_sum / row.rating_count : null,
  };
}
