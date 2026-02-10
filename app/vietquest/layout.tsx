import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'VietQuest - Learn Vietnamese Through Adventure',
  description: 'A narrative travel RPG where Vietnamese is the control system. Survive and thrive in Vietnam before you ever arrive.',
};

/**
 * VietQuest Layout
 *
 * Dedicated layout for the game that hides the main app header/footer
 * for a fully immersive experience.
 */
export default function VietQuestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-900">
      {children}
    </div>
  );
}
