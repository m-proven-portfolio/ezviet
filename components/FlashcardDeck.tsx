'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Flashcard } from './Flashcard';
import { UpgradeNudge } from './UpgradeNudge';
import { CategoryPicker, CategoryPickerPrompt } from './CategoryPicker';
import { useFirstVisit } from '@/hooks/useFirstVisit';
import { useTutorialProgress } from '@/hooks/useTutorialProgress';
import { FeaturePreviewBar } from './FeaturePreviewBar';
import { TutorialCard } from './TutorialCard';
import { OnboardingConfetti } from './OnboardingConfetti';
import {
  getSeenCards,
  getTodayCount,
  markCardSeen,
  markCardAsSeenFromProfile,
  getProfileSource,
  clearProfileSource,
  hasReachedLimitForTier,
  getRemainingCardsForTier,
  getDailyLimitForUserTier,
} from '@/lib/progression';
import { BLOCKED_PRACTICE_CONFIG } from '@/lib/blocked-practice';
import { determineUserTier, isUnlimitedTier, type UserTier } from '@/lib/tiers';
import { useAuthContext } from '@/contexts/AuthContext';
import { useImagePreloader } from '@/lib/hooks/useImagePreloader';
import { isNetworkError } from '@/lib/utils';
import type { CardWithTerms, Category } from '@/lib/supabase/types';

// Preloading configuration
const PRELOAD_CONFIG = {
  MIN_BUFFER: 12,        // Always try to have at least 12 cards in buffer
  TRIGGER_THRESHOLD: 8,  // Start fetching when 8 cards remaining (not 2)
  BATCH_SIZE: 10,        // Fetch 10 cards at a time (not 5)
  IMAGE_PRELOAD_AHEAD: 5, // Preload images for next 5 cards
};

interface FlashcardDeckProps {
  initialCards: CardWithTerms[];
}

export function FlashcardDeck({ initialCards }: FlashcardDeckProps) {
  const [cards, setCards] = useState<CardWithTerms[]>(initialCards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFetching, setIsFetching] = useState(false); // Renamed: background fetch state
  const [noMoreCards, setNoMoreCards] = useState(false);
  const [todayCount, setTodayCount] = useState(0);
  const [showNudge, setShowNudge] = useState(false);
  const [hasMounted, setHasMounted] = useState(false); // Prevent hydration mismatch

  // Category picker state
  const [showCategoryPrompt, setShowCategoryPrompt] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const categoryPromptDismissed = useRef(false);
  const cardsViewedTotal = useRef(0);

  // Ref to track if initial background fetch has been triggered
  const initialFetchTriggered = useRef(false);

  // Get auth state to determine tier
  const { user, profile, isAdmin, isLoading: authLoading } = useAuthContext();

  // First-visit state for onboarding hints
  const { isFirstVisit, markComplete: markFirstVisitComplete } = useFirstVisit();

  // Tutorial progress for interactive onboarding
  const { showTutorialCard, isHydrated: tutorialHydrated, syncFromProfile } = useTutorialProgress();

  // Sync tutorial completion state from database profile
  // This fixes the bug where tutorial shows again after clearing localStorage
  useEffect(() => {
    if (profile?.onboarding_completed) {
      syncFromProfile(profile.onboarding_completed);
    }
  }, [profile?.onboarding_completed, syncFromProfile]);

  // Track if user has scrolled to see conversations
  const [hasScrolledToConversations, setHasScrolledToConversations] = useState(false);

  // Scroll observer to detect when conversations section is visible
  useEffect(() => {
    if (!isFirstVisit || hasScrolledToConversations) return;

    const conversationsSection = document.getElementById('conversations-section');
    if (!conversationsSection) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setHasScrolledToConversations(true);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(conversationsSection);
    return () => observer.disconnect();
  }, [isFirstVisit, hasScrolledToConversations]);

  // Preload images for upcoming cards (eliminates image loading delay)
  useImagePreloader(cards, currentIndex, PRELOAD_CONFIG.IMAGE_PRELOAD_AHEAD);

  // Determine user's tier based on auth state
  const userTier: UserTier = useMemo(() => {
    return determineUserTier({
      isLoggedIn: !!user,
      isAdmin: isAdmin,
      subscriptionTier: profile?.subscription_tier ?? null,
      vipExpiresAt: profile?.vip_expires_at ?? null,
    });
  }, [user, isAdmin, profile?.subscription_tier, profile?.vip_expires_at]);

  // Get tier-specific limits
  const dailyLimit = useMemo(() => getDailyLimitForUserTier(userTier), [userTier]);
  const isUnlimited = useMemo(() => isUnlimitedTier(userTier), [userTier]);
  const remaining = useMemo(() => getRemainingCardsForTier(userTier), [userTier, todayCount]);
  const atLimit = useMemo(() => hasReachedLimitForTier(userTier), [userTier, todayCount]);

  // Initialize on mount (after hydration to avoid mismatch)
  useEffect(() => {
    setHasMounted(true);
    setTodayCount(getTodayCount());

    // Check if user already dismissed the category prompt
    const dismissed = localStorage.getItem('ezviet_category_prompt_dismissed');
    if (dismissed === 'true') {
      categoryPromptDismissed.current = true;
    }

    // Load saved category preferences
    const saved = localStorage.getItem(
      BLOCKED_PRACTICE_CONFIG.STORAGE_KEY_SELECTED_CATEGORIES
    );
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSelectedCategories(parsed);
        }
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  // Fetch categories for the picker (only those with at least 1 card)
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch('/api/categories?with_cards=true');
        const data = await res.json();
        if (Array.isArray(data)) {
          setCategories(data);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/7289c88e-7538-4ad4-81fe-c274a1e6ac68', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'FlashcardDeck.tsx:fetchCategories', message: 'categories fetch failed', data: { errorMessage: error instanceof Error ? error.message : String(error) }, timestamp: Date.now(), hypothesisId: 'B' }) }).catch(() => {});
        // #endregion
      }
    }
    fetchCategories();
  }, []);

  // Track cards viewed and show category prompt after threshold
  useEffect(() => {
    if (cards[currentIndex]) {
      cardsViewedTotal.current += 1;

      // Show prompt after threshold, if not already dismissed and categories loaded
      if (
        cardsViewedTotal.current >= BLOCKED_PRACTICE_CONFIG.SHOW_CATEGORY_PICKER_AFTER &&
        !categoryPromptDismissed.current &&
        !showCategoryPrompt &&
        categories.length > 0
      ) {
        setShowCategoryPrompt(true);
      }
    }
  }, [currentIndex, cards, categories.length, showCategoryPrompt]);

  // Handle category selection
  const handleCategorySelect = useCallback((categoryIds: string[]) => {
    setSelectedCategories(categoryIds);
    setShowCategoryPicker(false);
    setShowCategoryPrompt(false);
    categoryPromptDismissed.current = true;
    localStorage.setItem('ezviet_category_prompt_dismissed', 'true');

    // Reload cards with selected categories
    if (categoryIds.length > 0) {
      setCards([]);
      setCurrentIndex(0);
      setNoMoreCards(false);
      // Trigger a fresh fetch with selected categories
      const categorySlugs = categories
        .filter((c) => categoryIds.includes(c.id))
        .map((c) => c.slug)
        .join(',');

      fetch(`/api/cards/blocked?categories=${categorySlugs}&limit=${dailyLimit}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.cards && data.cards.length > 0) {
            setCards(data.cards);
          }
        })
        .catch((err) => console.error('Failed to fetch category cards:', err));
    }
  }, [categories, dailyLimit]);

  const handleCategoryPromptDismiss = useCallback(() => {
    setShowCategoryPrompt(false);
    categoryPromptDismissed.current = true;
    localStorage.setItem('ezviet_category_prompt_dismissed', 'true');
  }, []);

  // Mark current card as seen and update count
  // If user came from a profile (viral sharing), use bypass to not count against limit
  useEffect(() => {
    if (cards[currentIndex]) {
      const profileSource = getProfileSource();
      if (profileSource) {
        // User came from a profile link - mark without counting towards limit
        markCardAsSeenFromProfile(cards[currentIndex].slug);
        // Clear the profile source after first use to prevent abuse
        // (they get one "free" session of cards from profile sharing)
        clearProfileSource();
      } else {
        // Normal flow - mark and count towards limit
        markCardSeen(cards[currentIndex].slug);
      }
      setTodayCount(getTodayCount());
    }
  }, [currentIndex, cards]);

  // Fetch more cards in the background (non-blocking)
  // force: bypasses the noMoreCards check (used when admin status changes mid-session)
  const fetchMoreCards = useCallback(async (force = false) => {
    if (isFetching) return;
    if (atLimit && !isUnlimited) return; // Unlimited users bypass limit check
    if (noMoreCards && !force) return; // Don't fetch unless forced

    setIsFetching(true);
    try {
      // For unlimited users: only exclude currently loaded cards (allows cycling through deck)
      // For limited users: exclude all seen cards from localStorage (enforces progression)
      const excludeList = isUnlimited
        ? cards.map(c => c.slug)
        : getSeenCards();
      const excludeParam = excludeList.length > 0 ? excludeList.join(',') : '';

      const res = await fetch(`/api/cards/blocked?exclude=${excludeParam}&limit=${dailyLimit}`);
      const data = await res.json();

      if (data.cards && data.cards.length > 0) {
        setCards(prev => [...prev, ...data.cards]);
        setNoMoreCards(false);
      } else {
        // No more cards available in the database
        setNoMoreCards(true);
      }
    } catch (error) {
      // Silently ignore network errors (device sleep, offline, etc.)
      if (!isNetworkError(error)) {
        console.error('Failed to fetch more cards:', error);
      }
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/7289c88e-7538-4ad4-81fe-c274a1e6ac68', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'FlashcardDeck.tsx:fetchMoreCards', message: 'cards/blocked fetch failed', data: { errorMessage: error instanceof Error ? error.message : String(error) }, timestamp: Date.now(), hypothesisId: 'C' }) }).catch(() => {});
      // #endregion
    } finally {
      setIsFetching(false);
    }
  }, [isFetching, atLimit, isUnlimited, cards, noMoreCards, dailyLimit]);

  // AGGRESSIVE PRELOADING: Fetch when cards remaining drops below threshold
  // This triggers much earlier than before (8 cards remaining vs 2)
  useEffect(() => {
    const cardsRemaining = cards.length - currentIndex;
    const needsMoreCards = cardsRemaining < PRELOAD_CONFIG.TRIGGER_THRESHOLD;
    const shouldFetch = isUnlimited || (!atLimit && !noMoreCards);

    if (needsMoreCards && shouldFetch) {
      fetchMoreCards();
    }
  }, [currentIndex, cards.length, fetchMoreCards, atLimit, noMoreCards, isUnlimited]);

  // IMMEDIATE BACKGROUND FETCH: Start prefetching as soon as component mounts
  // This ensures we have a large buffer ready before user even starts swiping
  useEffect(() => {
    if (initialFetchTriggered.current) return;
    if (authLoading) return; // Wait for auth to resolve first

    const shouldFetch = isUnlimited || !atLimit;
    const needsBuffer = cards.length < PRELOAD_CONFIG.MIN_BUFFER;

    if (shouldFetch && needsBuffer && !noMoreCards) {
      initialFetchTriggered.current = true;
      // Small delay to not block initial render
      setTimeout(() => fetchMoreCards(), 100);
    }
  }, [authLoading, isUnlimited, atLimit, cards.length, noMoreCards, fetchMoreCards]);

  // When user becomes unlimited (admin/pro), reset noMoreCards and force-fetch
  // This handles the race condition where auth loads after initial render
  // CRITICAL: The initial fetch may have used getSeenCards() (wrong for unlimited users)
  // which excluded all previously seen cards. We must force a new fetch with the
  // correct exclude list (only currently loaded cards).
  useEffect(() => {
    if (isUnlimited && !authLoading) {
      // Reset noMoreCards for unlimited users - they can always cycle through
      setNoMoreCards(false);
      // Force fetch regardless of cardsRemaining - the previous fetch used wrong exclude list
      // Using force=true bypasses the noMoreCards check (closure would still see old value)
      fetchMoreCards(true);
    }
  }, [isUnlimited, authLoading, fetchMoreCards]);

  // Check if at the boundary (last seen card and at limit)
  const isAtBoundary = atLimit && currentIndex === cards.length - 1;

  // Show/hide nudge when at boundary
  useEffect(() => {
    if (isAtBoundary && !isUnlimited) {
      setShowNudge(true);
    } else {
      setShowNudge(false);
    }
  }, [isAtBoundary, isUnlimited]);

  const goToNext = () => {
    if (cards.length === 0) return;
    // Loop to start when at the end
    setCurrentIndex(prev => (prev + 1) % cards.length);
  };

  const goToPrev = () => {
    if (cards.length === 0) return;
    // Loop to end when at the start
    setCurrentIndex(prev => (prev - 1 + cards.length) % cards.length);
  };

  const currentCard = cards[currentIndex];

  // No cards state (only show if not fetching)
  if (!currentCard && !isFetching) {
    return (
      <div className="text-center py-12">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-sm mx-auto">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            No Cards Available
          </h2>
          <p className="text-gray-600">
            Check back soon for new vocabulary!
          </p>
        </div>
      </div>
    );
  }

  // Format remaining display
  const remainingDisplay = isUnlimited ? null : remaining;
  const limitDisplay = isUnlimited ? 'Unlimited' : dailyLimit;

  return (
    <div id="flashcard-deck" className="relative">
      {/* Onboarding confetti overlay */}
      <OnboardingConfetti />

      {/* Feature preview bar (first visit only, hidden during tutorial) */}
      <FeaturePreviewBar isVisible={isFirstVisit && !showTutorialCard} />

      {/* Progress indicator */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm">
          <span className="text-sm text-gray-600">
            {isUnlimited ? (
              `Card ${currentIndex + 1}`
            ) : (
              `Card ${currentIndex + 1} of ${cards.length}`
            )}
          </span>
          {hasMounted && remainingDisplay !== null && remainingDisplay > 0 && !atLimit && (
            <span className="text-xs text-jade-600 font-medium">
              ({remainingDisplay} left)
            </span>
          )}
        </div>
      </div>

      {/* Upgrade nudge - inline version above the card */}
      {showNudge && (
        <div className="mb-4">
          <UpgradeNudge
            currentTier={userTier}
            cardsLearned={todayCount}
            variant="inline"
          />
        </div>
      )}

      {/* Category picker prompt - shown after threshold cards viewed */}
      {showCategoryPrompt && !showCategoryPicker && (
        <CategoryPickerPrompt
          onShowPicker={() => setShowCategoryPicker(true)}
          onDismiss={handleCategoryPromptDismiss}
        />
      )}

      {/* Category picker modal */}
      {showCategoryPicker && (
        <div className="mb-6">
          <CategoryPicker
            categories={categories}
            onSelect={handleCategorySelect}
            onDismiss={() => {
              setShowCategoryPicker(false);
              handleCategoryPromptDismiss();
            }}
          />
        </div>
      )}

      {/* Card stack container */}
      <div className="relative">
        {/* Tutorial card for new users */}
        {tutorialHydrated && showTutorialCard ? (
          <TutorialCard />
        ) : (
          <>
            {/* Stacked card preview (first visit only) - shows cards "behind" */}
            {isFirstVisit && cards.length > 1 && (
              <>
                {/* Second card behind */}
                {cards[currentIndex + 1] && (
                  <div className="absolute inset-0 pointer-events-none transform translate-y-3 translate-x-3 opacity-50 scale-[0.96] animate-subtle-bob">
                    <div className="bg-gradient-to-br from-white to-gray-100 rounded-3xl shadow-xl h-full max-w-sm mx-auto border border-gray-200" />
                  </div>
                )}
                {/* Third card behind */}
                {cards[currentIndex + 2] && (
                  <div className="absolute inset-0 pointer-events-none transform translate-y-6 translate-x-6 opacity-30 scale-[0.93]">
                    <div className="bg-gradient-to-br from-white to-gray-100 rounded-3xl shadow-lg h-full max-w-sm mx-auto border border-gray-200" />
                  </div>
                )}
              </>
            )}

            {/* Current card */}
            {currentCard && (
              <Flashcard
                card={currentCard}
                onSwipeLeft={goToNext}
                onSwipeRight={goToPrev}
                isFirstVisit={isFirstVisit}
                onFirstInteraction={markFirstVisitComplete}
              />
            )}
          </>
        )}
      </div>

      {/* Navigation buttons (desktop) - hidden during tutorial */}
      {!showTutorialCard && (
        <div className="flex justify-center gap-4 mt-8">
          <button
            onClick={goToPrev}
            className="px-6 py-3 rounded-xl font-medium transition-colors bg-white hover:bg-gray-50 text-gray-700 shadow-sm"
          >
            ← Previous
          </button>
          <button
            onClick={goToNext}
            className="px-6 py-3 rounded-xl font-medium transition-colors bg-jade-600 hover:bg-jade-700 text-white shadow-sm"
          >
            Next →
          </button>
        </div>
      )}

      {/* Swipe hint - hidden during tutorial */}
      {!showTutorialCard && (
        <p className="text-center text-gray-400 text-sm mt-4">
          Swipe or use arrow keys to navigate
        </p>
      )}

      {/* Scroll indicator (first visit only, before scrolling to conversations) */}
      {isFirstVisit && !hasScrolledToConversations && (
        <div className="text-center mt-8 animate-bounce">
          <button
            onClick={() => {
              const el = document.getElementById('conversations-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="inline-flex flex-col items-center text-gray-400 hover:text-gray-600 transition-colors"
          >
            <span className="text-xs mb-1">More features below</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
