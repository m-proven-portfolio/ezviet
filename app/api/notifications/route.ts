import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getUserNotifications,
  getUnreadCount,
  markAllAsRead,
  type Notification,
} from '@/lib/notifications';

export interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
  hasMore: boolean;
}

/**
 * GET /api/notifications
 * Fetch notifications for the authenticated user
 *
 * Query params:
 * - limit: number (default 20)
 * - offset: number (default 0)
 * - unreadOnly: boolean (default false)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') ?? '20', 10);
    const offset = parseInt(searchParams.get('offset') ?? '0', 10);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    const [notifications, unreadCount] = await Promise.all([
      getUserNotifications(user.id, { limit: limit + 1, offset, unreadOnly }),
      getUnreadCount(user.id),
    ]);

    // Check if there are more notifications
    const hasMore = notifications.length > limit;
    const trimmedNotifications = notifications.slice(0, limit);

    return NextResponse.json({
      notifications: trimmedNotifications,
      unreadCount,
      hasMore,
    });
  } catch (error) {
    console.error('Notifications API error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

/**
 * POST /api/notifications
 * Mark all notifications as read
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'markAllRead') {
      const success = await markAllAsRead(user.id);
      if (!success) {
        return NextResponse.json(
          { error: 'Failed to mark notifications as read' },
          { status: 500 }
        );
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Notifications API error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
