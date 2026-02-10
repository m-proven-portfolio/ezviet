/**
 * Client-safe notification types and display helpers
 *
 * Split from notifications.ts to avoid importing server-only code in client components
 */

import type { CoreTier } from '@/lib/core-tiers';

export type NotificationType =
  | 'edit_approved'
  | 'edit_rejected'
  | 'edit_merged'
  | 'tier_unlocked'
  | 'achievement_earned'
  | 'song_needs_help'
  | 'mention'
  | 'lrc_submission_pending';

export interface NotificationMetadata {
  songId?: string;
  songTitle?: string;
  submissionId?: string;
  achievementType?: string;
  newTier?: CoreTier;
  previousTier?: CoreTier;
  reviewNotes?: string;
  [key: string]: unknown;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  metadata: NotificationMetadata;
  read_at: string | null;
  created_at: string;
}

/**
 * Notification display helpers
 */
export function getNotificationIcon(type: NotificationType): string {
  const icons: Record<NotificationType, string> = {
    edit_approved: '✅',
    edit_rejected: '⚠️',
    edit_merged: '🎉',
    tier_unlocked: '🏆',
    achievement_earned: '🎖️',
    song_needs_help: '🎵',
    mention: '💬',
    lrc_submission_pending: '🎤',
  };
  return icons[type] ?? '📢';
}

export function getNotificationColor(type: NotificationType): string {
  const colors: Record<NotificationType, string> = {
    edit_approved: 'text-emerald-500',
    edit_rejected: 'text-amber-500',
    edit_merged: 'text-purple-500',
    tier_unlocked: 'text-yellow-500',
    achievement_earned: 'text-blue-500',
    song_needs_help: 'text-pink-500',
    mention: 'text-cyan-500',
    lrc_submission_pending: 'text-orange-500',
  };
  return colors[type] ?? 'text-zinc-400';
}
