'use client';

import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';

interface PushPermissionPromptProps {
  /** Called when user successfully subscribes */
  onSubscribed?: () => void;
  /** Called when user dismisses the prompt */
  onDismissed?: () => void;
}

/**
 * PushPermissionPrompt - Prompts users to enable push notifications
 *
 * Shows a banner asking users to enable push notifications.
 * Handles the subscription flow with the browser and our API.
 */
export function PushPermissionPrompt({
  onSubscribed,
  onDismissed,
}: PushPermissionPromptProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if we should show the prompt
  useEffect(() => {
    // Only show in browser with service worker support
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    // Don't show if already subscribed or denied
    if (Notification.permission === 'granted') {
      // Check if we have an active subscription
      navigator.serviceWorker.ready.then((registration) => {
        registration.pushManager.getSubscription().then((subscription) => {
          if (subscription) {
            // Already subscribed
            return;
          }
          // Has permission but not subscribed - show prompt
          setIsVisible(true);
        });
      });
      return;
    }

    if (Notification.permission === 'denied') {
      // User has denied - don't show
      return;
    }

    // Check localStorage for dismissal
    const dismissed = localStorage.getItem('push-prompt-dismissed');
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      // Don't show again for 7 days after dismissal
      if (daysSinceDismissed < 7) {
        return;
      }
    }

    // Show the prompt
    setIsVisible(true);
  }, []);

  const handleSubscribe = async () => {
    setIsSubscribing(true);
    setError(null);

    try {
      // Request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setError('Notification permission was denied');
        setIsSubscribing(false);
        return;
      }

      // Register service worker if not already
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // Get VAPID public key from environment
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        setError('Push notifications not configured');
        setIsSubscribing(false);
        return;
      }

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
      });

      // Send subscription to server
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      });

      if (!response.ok) {
        throw new Error('Failed to save subscription');
      }

      // Success!
      setIsVisible(false);
      onSubscribed?.();
    } catch (err) {
      console.error('Failed to subscribe to push:', err);
      setError('Failed to enable notifications');
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('push-prompt-dismissed', new Date().toISOString());
    setIsVisible(false);
    onDismissed?.();
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white rounded-xl shadow-xl border border-gray-200 p-4 z-50 animate-slide-up">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
          <Bell className="w-5 h-5 text-emerald-600" />
        </div>

        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">
            Get notified when your edits are approved
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Enable push notifications to know when your contributions are accepted.
          </p>

          {error && (
            <p className="text-sm text-red-500 mt-2">{error}</p>
          )}

          <div className="flex gap-2 mt-3">
            <button
              onClick={handleSubscribe}
              disabled={isSubscribing}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubscribing ? 'Enabling...' : 'Enable Notifications'}
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper to convert base64 VAPID key to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}
