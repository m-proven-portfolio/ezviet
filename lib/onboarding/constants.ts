// Tutorial step types and constants for onboarding

export const TUTORIAL_STEPS = [
  'welcome',
  'listen',
  'swipe',
  'karaoke',
  'complete',
] as const;

export type TutorialStep = (typeof TUTORIAL_STEPS)[number];

// Step content for the tutorial card
export const STEP_CONTENT: Record<
  TutorialStep,
  {
    title: string;
    subtitle: string;
    instruction: string;
    buttonText?: string;
  }
> = {
  welcome: {
    title: 'Xin chao!',
    subtitle: 'Welcome to EZViet',
    instruction: 'Learn Vietnamese through flashcards, music, and conversations.',
    buttonText: 'Show me how',
  },
  listen: {
    title: 'Hear the pronunciation',
    subtitle: 'Tap the speaker to listen',
    instruction: 'Native speakers help you learn the correct sounds.',
  },
  swipe: {
    title: 'Swipe to explore',
    subtitle: 'Swipe left or right',
    instruction: 'Navigate through cards like flipping through a deck.',
  },
  karaoke: {
    title: 'Sing along!',
    subtitle: 'Tap play for karaoke',
    instruction: 'Learn vocabulary through Vietnamese songs.',
  },
  complete: {
    title: 'Tuyet voi!',
    subtitle: "You're ready!",
    instruction: 'Start learning Vietnamese now.',
    buttonText: 'Start learning',
  },
};

// Celebration messages for each step completion
export const CELEBRATION_MESSAGES: Record<Exclude<TutorialStep, 'welcome'>, string[]> = {
  listen: ['Great ear!', 'Perfect!', 'You got it!'],
  swipe: ["You're a natural!", 'Smooth moves!', 'Easy, right?'],
  karaoke: ['Music unlocked!', 'Sing along!', 'Hat len! (Sing!)'],
  complete: ['Xin chuc mung!', "Let's go!", 'Chuc may man!'],
};

// Confetti intensity per step
export const CONFETTI_CONFIG: Record<
  Exclude<TutorialStep, 'welcome'>,
  { particleCount: number; spread: number; origin?: { y: number } }
> = {
  listen: { particleCount: 40, spread: 50 },
  swipe: { particleCount: 80, spread: 70 },
  karaoke: { particleCount: 120, spread: 90 },
  complete: { particleCount: 200, spread: 120, origin: { y: 0.6 } },
};

// localStorage keys
export const STORAGE_KEYS = {
  TUTORIAL_PROGRESS: 'ezviet_tutorial_progress',
  TUTORIAL_COMPLETED: 'ezviet_tutorial_completed',
  FIRST_VISIT_COMPLETE: 'ezviet_first_visit_complete', // existing key
} as const;

// Helper to get random celebration message
export function getRandomCelebration(step: Exclude<TutorialStep, 'welcome'>): string {
  const messages = CELEBRATION_MESSAGES[step];
  return messages[Math.floor(Math.random() * messages.length)];
}
