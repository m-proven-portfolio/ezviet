/**
 * Server-side notification system for EZViet Core contributors
 *
 * Creates and manages in-app notifications for:
 * - Edit approvals/rejections
 * - Tier unlocks
 * - Achievement unlocks
 * - Songs needing help
 *
 * NOTE: This file uses server-only imports. For client components,
 * import from '@/lib/notifications-types' instead.
 */

import { createAdminClient } from '@/lib/supabase/server';
import { getCoreTierConfig, type CoreTier } from '@/lib/core-tiers';

// Re-export types and helpers for backwards compatibility (server-side only)
export type {
  NotificationType,
  NotificationMetadata,
  Notification,
} from '@/lib/notifications-types';

export {
  getNotificationIcon,
  getNotificationColor,
} from '@/lib/notifications-types';

import type { NotificationType, NotificationMetadata, Notification } from '@/lib/notifications-types';

/**
 * Create a notification for a user
 */
export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body?: string,
  metadata?: NotificationMetadata
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    type,
    title,
    body: body ?? null,
    metadata: metadata ?? {},
  });

  if (error) {
    console.error('Failed to create notification:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Notify user when their edit is approved
 */
export async function notifyEditApproved(
  userId: string,
  songTitle: string,
  songId: string,
  submissionId: string
): Promise<void> {
  await createNotification(
    userId,
    'edit_approved',
    'Edit Approved!',
    `Your timing edit for "${songTitle}" was approved.`,
    { songId, songTitle, submissionId }
  );
}

/**
 * Notify user when their edit is merged (directly applied)
 */
export async function notifyEditMerged(
  userId: string,
  songTitle: string,
  songId: string,
  submissionId: string
): Promise<void> {
  await createNotification(
    userId,
    'edit_merged',
    'Edit Merged!',
    `Your timing edit for "${songTitle}" is now live. Thanks for improving EZViet!`,
    { songId, songTitle, submissionId }
  );
}

/**
 * Notify user when their edit is rejected
 */
export async function notifyEditRejected(
  userId: string,
  songTitle: string,
  songId: string,
  submissionId: string,
  reviewNotes?: string
): Promise<void> {
  await createNotification(
    userId,
    'edit_rejected',
    'Edit Needs Revision',
    reviewNotes
      ? `Your edit for "${songTitle}" needs changes: ${reviewNotes}`
      : `Your edit for "${songTitle}" wasn't applied. Try again with more accurate timing.`,
    { songId, songTitle, submissionId, reviewNotes }
  );
}

/**
 * Notify user when they unlock a new tier
 */
export async function notifyTierUnlocked(
  userId: string,
  newTier: CoreTier,
  previousTier?: CoreTier
): Promise<void> {
  const tierConfig = getCoreTierConfig(newTier);

  await createNotification(
    userId,
    'tier_unlocked',
    `${tierConfig.icon} ${tierConfig.label} Unlocked!`,
    `Congratulations! You've reached ${tierConfig.label} status. ${tierConfig.description}.`,
    { newTier, previousTier }
  );
}

/**
 * Notify user when they earn an achievement
 */
export async function notifyAchievementEarned(
  userId: string,
  achievementType: string,
  achievementName: string,
  achievementDescription: string
): Promise<void> {
  await createNotification(
    userId,
    'achievement_earned',
    `Achievement Unlocked: ${achievementName}`,
    achievementDescription,
    { achievementType }
  );
}

/**
 * Notify all admins about a new LRC submission pending review
 */
export async function notifyAdminsLrcSubmission(
  submitterName: string,
  songTitle: string,
  songId: string,
  submissionId: string,
  linesCount: number
): Promise<void> {
  const supabase = createAdminClient();

  // Get all admin user IDs
  const { data: admins, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('is_admin', true);

  if (error || !admins?.length) {
    console.error('Failed to fetch admins for notification:', error);
    return;
  }

  // Create notification for each admin
  const notifications = admins.map((admin) => ({
    user_id: admin.id,
    type: 'lrc_submission_pending' as const,
    title: '🎤 New LRC Submission',
    body: `${submitterName} submitted ${linesCount} line${linesCount !== 1 ? 's' : ''} for "${songTitle}"`,
    metadata: {
      songId,
      songTitle,
      submissionId,
      submitterName,
      linesCount,
      reviewUrl: `/admin/lrc-review?submission=${submissionId}`,
    },
  }));

  const { error: insertError } = await supabase
    .from('notifications')
    .insert(notifications);

  if (insertError) {
    console.error('Failed to notify admins of LRC submission:', insertError);
  }
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const supabase = createAdminClient();

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('read_at', null);

  if (error) {
    // Table missing (migration 027 not run) - return 0 without spamming logs
    if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
      return 0;
    }
    console.error('Failed to get unread count:', error);
    return 0;
  }

  return count ?? 0;
}

/**
 * Get notifications for a user
 */
export async function getUserNotifications(
  userId: string,
  options: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
  } = {}
): Promise<Notification[]> {
  const { limit = 20, offset = 0, unreadOnly = false } = options;
  const supabase = createAdminClient();

  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (unreadOnly) {
    query = query.is('read_at', null);
  }

  const { data, error } = await query;

  if (error) {
    // Table missing (migration 027 not run) - return [] without spamming logs
    if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
      return [];
    }
    console.error('Failed to fetch notifications:', error);
    return [];
  }

  return (data as Notification[]) ?? [];
}

/**
 * Mark a notification as read
 */
export async function markAsRead(
  notificationId: string,
  userId: string
): Promise<boolean> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('user_id', userId);

  if (error) {
    if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
      return true; // no-op when table missing
    }
    console.error('Failed to mark notification as read:', error);
    return false;
  }

  return true;
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string): Promise<boolean> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('read_at', null);

  if (error) {
    if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
      return true; // no-op when table missing
    }
    console.error('Failed to mark all notifications as read:', error);
    return false;
  }

  return true;
}

