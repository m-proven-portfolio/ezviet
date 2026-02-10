'use client';

interface FeaturePreviewBarProps {
  isVisible: boolean;
}

/**
 * Feature preview bar shown to first-time visitors.
 * Highlights the main features: Cards, Songs, Conversations.
 * Each item scrolls to its respective section.
 */
export function FeaturePreviewBar({ isVisible }: FeaturePreviewBarProps) {
  if (!isVisible) return null;

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="mb-6 animate-fadeIn">
      <div className="flex items-center justify-center gap-2 sm:gap-4 flex-wrap">
        <button
          onClick={() => scrollToSection('flashcard-deck')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/60 backdrop-blur-sm border border-gray-200/50 text-sm text-gray-700 hover:bg-white/80 transition-all shadow-sm"
        >
          <span>🎴</span>
          <span className="hidden sm:inline">Swipe</span> Cards
        </button>
        <button
          onClick={() => scrollToSection('flashcard-deck')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/60 backdrop-blur-sm border border-gray-200/50 text-sm text-gray-700 hover:bg-white/80 transition-all shadow-sm"
        >
          <span>🎤</span>
          <span className="hidden sm:inline">Sing</span> Along
        </button>
        <button
          onClick={() => scrollToSection('conversations-section')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/60 backdrop-blur-sm border border-gray-200/50 text-sm text-gray-700 hover:bg-white/80 transition-all shadow-sm"
        >
          <span>💬</span>
          Conversations
        </button>
      </div>
    </div>
  );
}
