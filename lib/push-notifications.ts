/**
 * Push Notification Service for EZViet
 *
 * Sends web push notifications to subscribed users.
 *
 * SETUP REQUIRED:
 * 1. Install web-push: npm install web-push
 * 2. Generate VAPID keys: npx web-push generate-vapid-keys
 * 3. Add to .env.local:
 *    - NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
 *    - VAPID_PRIVATE_KEY=...
 *    - VAPID_SUBJECT=mailto:admin@ezviet.org
 */

import { createAdminClient } from '@/lib/supabase/server';
import { type NotificationType, getNotificationIcon } from '@/lib/notifications';

// Type for push subscription from database
interface PushSubscriptionData {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

// Notification payload structure
export interface PushNotificationPayload {
  title: string;
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  url?: string;
  notificationId?: string;
  type?: NotificationType;
  requireInteraction?: boolean;
  actions?: Array<{ action: string; title: string }>;
}

// Web-push types (subset we need)
interface WebPushLib {
  setVapidDetails: (subject: string, publicKey: string, privateKey: string) => void;
  sendNotification: (
    subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
    payload: string
  ) => Promise<void>;
}

// Lazy-load web-push only at runtime so build succeeds when the package is optional
let webpush: WebPushLib | null = null;
function getWebPush(): WebPushLib | null {
  if (webpush !== null) return webpush;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    webpush = require('web-push') as WebPushLib;
  } catch {
    webpush = null;
  }
  return webpush;
}

// Initialize web-push with VAPID details
function initWebPush(): boolean {
  const wp = getWebPush();
  if (!wp) {
    console.warn(
      '[Push] web-push package not installed. Run: npm install web-push'
    );
    return false;
  }

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:admin@ezviet.org';

  if (!publicKey || !privateKey) {
    console.warn(
      '[Push] VAPID keys not configured. See lib/push-notifications.ts for setup.'
    );
    return false;
  }

  wp.setVapidDetails(subject, publicKey, privateKey);
  return true;
}

/**
 * Send push notification to a specific subscription
 */
export async function sendPushNotification(
  subscription: PushSubscriptionData,
  payload: PushNotificationPayload
): Promise<boolean> {
  const wp = getWebPush();
  if (!initWebPush() || !wp) {
    console.log('[Push] Skipping push notification (not configured)');
    return false;
  }

  try {
    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    };

    await wp.sendNotification(
      pushSubscription,
      JSON.stringify(payload)
    );
    return true;
  } catch (error: unknown) {
    const err = error as { statusCode?: number };
    console.error('[Push] Failed to send notification:', error);

    // If subscription is no longer valid, remove it
    if (err.statusCode === 404 || err.statusCode === 410) {
      await removeInvalidSubscription(subscription.id);
    }

    return false;
  }
}

/**
 * Send push notification to all subscriptions for a user
 */
export async function sendPushToUser(
  userId: string,
  payload: PushNotificationPayload
): Promise<{ sent: number; failed: number }> {
  const supabase = createAdminClient();

  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', userId);

  if (error || !subscriptions || subscriptions.length === 0) {
    return { sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;

  for (const subscription of subscriptions) {
    const success = await sendPushNotification(subscription, payload);
    if (success) {
      sent++;
      // Update last_used_at
      await supabase
        .from('push_subscriptions')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', subscription.id);
    } else {
      failed++;
    }
  }

  return { sent, failed };
}

/**
 * Remove an invalid subscription from the database
 */
async function removeInvalidSubscription(subscriptionId: string): Promise<void> {
  const supabase = createAdminClient();
  await supabase
    .from('push_subscriptions')
    .delete()
    .eq('id', subscriptionId);
}

/**
 * Helper to create a push payload for edit approval
 */
export function createEditApprovedPush(
  songTitle: string,
  songId: string,
  notificationId: string
): PushNotificationPayload {
  return {
    title: 'Edit Approved!',
    body: `Your timing edit for "${songTitle}" was approved.`,
    icon: getNotificationIcon('edit_approved'),
    url: `/profile`,
    notificationId,
    type: 'edit_approved',
    tag: `edit-${songId}`,
    actions: [
      { action: 'view', title: 'View' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };
}

/**
 * Helper to create a push payload for edit merged
 */
export function createEditMergedPush(
  songTitle: string,
  songId: string,
  notificationId: string
): PushNotificationPayload {
  return {
    title: 'Edit Merged!',
    body: `Your timing edit for "${songTitle}" is now live!`,
    icon: getNotificationIcon('edit_merged'),
    url: `/profile`,
    notificationId,
    type: 'edit_merged',
    tag: `edit-${songId}`,
    requireInteraction: true,
  };
}

/**
 * Helper to create a push payload for tier unlock
 */
export function createTierUnlockedPush(
  tierName: string,
  tierIcon: string,
  notificationId: string
): PushNotificationPayload {
  return {
    title: `${tierIcon} ${tierName} Unlocked!`,
    body: `Congratulations! You've reached ${tierName} status.`,
    icon: tierIcon,
    url: '/profile',
    notificationId,
    type: 'tier_unlocked',
    tag: 'tier-unlock',
    requireInteraction: true,
  };
}

/**
 * Helper to create a push payload for achievement
 */
export function createAchievementPush(
  achievementName: string,
  description: string,
  notificationId: string
): PushNotificationPayload {
  return {
    title: `Achievement: ${achievementName}`,
    body: description,
    icon: getNotificationIcon('achievement_earned'),
    url: '/profile',
    notificationId,
    type: 'achievement_earned',
    tag: 'achievement',
  };
}

/**
 * Get user's push subscription status
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const supabase = createAdminClient();

  const { count, error } = await supabase
    .from('push_subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) return false;
  return (count ?? 0) > 0;
}

/**
 * Save a push subscription for a user
 */
export async function saveSubscription(
  userId: string,
  endpoint: string,
  p256dh: string,
  auth: string,
  userAgent?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: userId,
      endpoint,
      p256dh,
      auth,
      user_agent: userAgent,
    },
    {
      onConflict: 'user_id,endpoint',
    }
  );

  if (error) {
    console.error('[Push] Failed to save subscription:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Remove a push subscription for a user
 */
export async function removeSubscription(
  userId: string,
  endpoint: string
): Promise<boolean> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('user_id', userId)
    .eq('endpoint', endpoint);

  if (error) {
    console.error('[Push] Failed to remove subscription:', error);
    return false;
  }

  return true;
}
