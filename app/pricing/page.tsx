'use client';

import { useAuthContext } from '@/contexts/AuthContext';
import { TIER_CONFIGS, type UserTier, determineUserTier } from '@/lib/tiers';
import { signInWithGoogle } from '@/lib/supabase/auth';
import Link from 'next/link';

export default function PricingPage() {
  const { user, profile, isAdmin, isLoading } = useAuthContext();

  const currentTier: UserTier = determineUserTier({
    isLoggedIn: !!user,
    isAdmin: isAdmin,
    subscriptionTier: profile?.subscription_tier ?? null,
    vipExpiresAt: profile?.vip_expires_at ?? null,
  });

  const tiers: { tier: UserTier; price: string; featured?: boolean }[] = [
    { tier: 'free', price: 'Free' },
    { tier: 'plus', price: '$4.99/mo', featured: true },
    { tier: 'pro', price: '$9.99/mo' },
  ];

  const handleSignUp = async () => {
    await signInWithGoogle(window.location.href);
  };

  return (
    <main className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Choose Your Learning Plan
          </h1>
          <p className="text-xl text-(--text-secondary)">
            Learn Vietnamese at your own pace
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {tiers.map(({ tier, price, featured }) => {
            const config = TIER_CONFIGS[tier];
            const isCurrentTier = tier === currentTier;
            const cardsText = config.dailyNewCards === -1
              ? 'Unlimited cards'
              : `${config.dailyNewCards} cards/day`;

            return (
              <div
                key={tier}
                className={`relative bg-(--surface-card) rounded-2xl shadow-lg p-6 border border-(--border-default) ${
                  featured ? 'ring-2 ring-(--interactive) scale-105' : ''
                }`}
              >
                {featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-(--interactive) text-(--text-inverse) px-3 py-1 rounded-full text-sm font-medium">
                    Popular
                  </div>
                )}

                <h2 className="text-2xl font-bold text-foreground mb-2">
                  {config.name}
                </h2>
                <p className="text-3xl font-bold text-(--interactive) mb-4">
                  {price}
                </p>
                <p className="text-(--text-secondary) mb-6">{config.description}</p>

                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2 text-(--text-secondary)">
                    <svg className="w-5 h-5 text-(--feedback-success)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {cardsText}
                  </li>
                  <li className="flex items-center gap-2 text-(--text-secondary)">
                    <svg className="w-5 h-5 text-(--feedback-success)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Audio pronunciation
                  </li>
                  <li className="flex items-center gap-2 text-(--text-secondary)">
                    <svg className="w-5 h-5 text-(--feedback-success)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Unlimited review
                  </li>
                  {tier !== 'free' && (
                    <li className="flex items-center gap-2 text-(--text-secondary)">
                      <svg className="w-5 h-5 text-(--feedback-success)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Progress tracking
                    </li>
                  )}
                </ul>

                {isCurrentTier ? (
                  <div className="w-full py-3 px-6 bg-(--surface-elevated) text-(--text-secondary) font-medium rounded-xl text-center">
                    Current Plan
                  </div>
                ) : tier === 'free' && !user ? (
                  <button
                    onClick={handleSignUp}
                    className="w-full py-3 px-6 bg-(--interactive) hover:bg-(--interactive-hover) text-(--text-inverse) font-semibold rounded-xl transition-colors"
                  >
                    Sign Up Free
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full py-3 px-6 bg-(--surface-elevated) text-(--text-tertiary) font-medium rounded-xl cursor-not-allowed"
                  >
                    Coming Soon
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <Link
            href="/"
            className="text-(--interactive) hover:text-(--interactive-hover) font-medium"
          >
            ← Back to learning
          </Link>
        </div>
      </div>
    </main>
  );
}
