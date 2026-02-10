'use client';

import type { ConversationPage, DialogueLine, ConversationPanel } from '@/lib/studio/types';
import { migrateDialoguesToPanels } from '@/lib/studio/types';

interface ConversationLayoutProps {
  page: ConversationPage;
}

// Main dispatcher based on layout style
export function ConversationPreview({ page }: ConversationLayoutProps) {
  const layoutStyle = page.layoutStyle || 'chat-bubbles';

  switch (layoutStyle) {
    case 'comic-strip':
      return <ComicStripLayout page={page} />;
    case 'side-by-side':
      return <SideBySideLayout page={page} />;
    case 'illustrated-scene':
      return <IllustratedSceneLayout page={page} />;
    case 'picture-book':
      return <PictureBookLayout page={page} />;
    case 'chat-bubbles':
    default:
      return <ChatBubblesLayout page={page} />;
  }
}

// ============================================================================
// 1. Comic Strip Layout - Vertical panels with image + multiple lines per panel
// ============================================================================
function ComicStripLayout({ page }: ConversationLayoutProps) {
  // Use panels if available, otherwise migrate from dialogues
  const panels = migrateDialoguesToPanels(page);

  return (
    <div className="space-y-1">
      {page.title && (
        <h2 className="mb-4 text-center text-xl font-bold text-gray-900">
          {page.title}
        </h2>
      )}
      <div className="space-y-4">
        {panels.map((panel, index) => (
          <ComicPanelGroup
            key={panel.id || index}
            panel={panel}
            showTranslation={page.showTranslations}
          />
        ))}
      </div>
    </div>
  );
}

function ComicPanelGroup({
  panel,
  showTranslation,
}: {
  panel: ConversationPanel;
  showTranslation: boolean;
}) {
  return (
    <div className="flex items-start gap-4 rounded-xl bg-gray-50 p-4">
      {/* Panel illustration */}
      <div className="shrink-0">
        {panel.image ? (
          <img
            src={panel.image}
            alt=""
            className="h-32 w-32 rounded-xl border-2 border-white object-cover shadow-md"
          />
        ) : (
          <div className="flex h-32 w-32 items-center justify-center rounded-xl bg-gray-200">
            <div className="text-center text-xs text-gray-400">
              <div className="text-2xl">🗣️</div>
              <span>Scene</span>
            </div>
          </div>
        )}
      </div>

      {/* Speech bubbles stacked */}
      <div className="flex flex-1 flex-col gap-2">
        {panel.lines.map((line, lineIndex) => {
          const speakerLabel =
            line.speaker === 'custom' ? line.speakerName : line.speaker === 'buyer' ? 'Buyer' : 'Seller';
          const bubbleColor =
            line.speaker === 'buyer' ? 'bg-blue-100 border-blue-300' : 'bg-amber-100 border-amber-300';
          const textColor = line.speaker === 'buyer' ? 'text-blue-900' : 'text-amber-900';

          return (
            <div
              key={line.id || lineIndex}
              className={`flex ${line.position === 'right' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] rounded-2xl border-2 ${bubbleColor} px-4 py-2 ${textColor}`}>
                <p className="mb-0.5 text-xs font-semibold uppercase tracking-wide opacity-60">
                  {speakerLabel}
                </p>
                <p className="text-base font-bold leading-snug">{line.vietnamese || '...'}</p>
                {showTranslation && line.english && (
                  <p className="mt-1 text-sm opacity-70">{line.english}</p>
                )}
              </div>
            </div>
          );
        })}
        {panel.lines.length === 0 && (
          <p className="text-sm text-gray-400 italic">No dialogue lines yet</p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 2. Side by Side Layout - Image on one side, dialogue lines on other (alternating)
// ============================================================================
function SideBySideLayout({ page }: ConversationLayoutProps) {
  // Use panels if available, otherwise migrate from dialogues
  const panels = migrateDialoguesToPanels(page);

  return (
    <div>
      {page.title && (
        <h2 className="mb-4 text-center text-xl font-bold text-gray-900">
          {page.title}
        </h2>
      )}
      <div className="space-y-4">
        {panels.map((panel, index) => (
          <SideBySidePanelRow
            key={panel.id || index}
            panel={panel}
            imagePosition={index % 2 === 0 ? 'left' : 'right'}
            showTranslation={page.showTranslations}
          />
        ))}
      </div>
    </div>
  );
}

function SideBySidePanelRow({
  panel,
  imagePosition,
  showTranslation,
}: {
  panel: ConversationPanel;
  imagePosition: 'left' | 'right';
  showTranslation: boolean;
}) {
  const imageElement = (
    <div className="shrink-0">
      {panel.image ? (
        <img
          src={panel.image}
          alt=""
          className="h-36 w-36 rounded-xl object-cover shadow-sm"
        />
      ) : (
        <div className="flex h-36 w-36 items-center justify-center rounded-xl bg-gray-100">
          <span className="text-4xl">🗣️</span>
        </div>
      )}
    </div>
  );

  const textElement = (
    <div className="flex flex-1 flex-col gap-2">
      {panel.lines.map((line, lineIndex) => {
        const speakerLabel =
          line.speaker === 'custom' ? line.speakerName : line.speaker === 'buyer' ? 'Buyer' : 'Seller';
        const bgColor = line.speaker === 'buyer' ? 'bg-blue-50' : 'bg-amber-50';
        const borderColor = line.speaker === 'buyer' ? 'border-blue-200' : 'border-amber-200';
        const textColor = line.speaker === 'buyer' ? 'text-blue-900' : 'text-amber-900';

        return (
          <div
            key={line.id || lineIndex}
            className={`rounded-xl border ${borderColor} ${bgColor} p-3`}
          >
            <p className={`mb-1 text-xs font-semibold uppercase tracking-wide ${textColor} opacity-60`}>
              {speakerLabel}
            </p>
            <p className={`text-base font-bold ${textColor}`}>{line.vietnamese || '...'}</p>
            {showTranslation && line.english && (
              <p className="mt-1 text-sm text-gray-600">{line.english}</p>
            )}
          </div>
        );
      })}
      {panel.lines.length === 0 && (
        <p className="text-sm text-gray-400 italic">No dialogue lines yet</p>
      )}
    </div>
  );

  return (
    <div className="flex items-start gap-4">
      {imagePosition === 'left' ? (
        <>
          {imageElement}
          {textElement}
        </>
      ) : (
        <>
          {textElement}
          {imageElement}
        </>
      )}
    </div>
  );
}

// ============================================================================
// 3. Illustrated Scene Layout - Speech bubbles overlaid on scene image
// ============================================================================
function IllustratedSceneLayout({ page }: ConversationLayoutProps) {
  return (
    <div>
      {page.title && (
        <h2 className="mb-4 text-center text-xl font-bold text-gray-900">
          {page.title}
        </h2>
      )}
      <div className="relative overflow-hidden rounded-2xl">
        {/* Background scene image */}
        {page.sceneImage ? (
          <img
            src={page.sceneImage}
            alt="Scene"
            className="h-auto w-full"
          />
        ) : (
          <div className="flex h-80 w-full items-center justify-center bg-gradient-to-b from-sky-100 to-green-100">
            <span className="text-6xl">🏪</span>
          </div>
        )}

        {/* Overlay speech bubbles */}
        <div className="absolute inset-0 flex flex-col justify-between p-4">
          {page.dialogues.map((line, index) => (
            <OverlayBubble
              key={line.id || index}
              line={line}
              position={line.position}
              showTranslation={page.showTranslations}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function OverlayBubble({
  line,
  position,
  showTranslation,
}: {
  line: DialogueLine;
  position: 'left' | 'right';
  showTranslation: boolean;
}) {
  const bubbleColor =
    line.speaker === 'buyer'
      ? 'bg-blue-500/95 text-white'
      : 'bg-amber-400/95 text-amber-900';
  const speakerLabel =
    line.speaker === 'custom' ? line.speakerName : line.speaker === 'buyer' ? 'Buyer' : 'Seller';

  return (
    <div className={`flex ${position === 'right' ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[60%] rounded-2xl px-4 py-2 shadow-lg ${bubbleColor}`}
        style={{ backdropFilter: 'blur(4px)' }}
      >
        <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
          {speakerLabel}
        </p>
        <p className="text-base font-bold">{line.vietnamese || '...'}</p>
        {showTranslation && line.english && (
          <p className="mt-0.5 text-sm opacity-80">{line.english}</p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 4. Chat Bubbles Layout - Simple messaging style (original improved)
// ============================================================================
function ChatBubblesLayout({ page }: ConversationLayoutProps) {
  return (
    <div>
      {page.title && (
        <h2 className="mb-4 text-center text-xl font-bold text-gray-900">
          {page.title}
        </h2>
      )}
      {page.sceneImage && (
        <img
          src={page.sceneImage}
          alt="Scene"
          className="mb-6 h-48 w-full rounded-xl object-cover"
        />
      )}
      <div className="space-y-4">
        {page.dialogues.map((line, index) => (
          <ChatBubble
            key={line.id || index}
            line={line}
            showTranslation={page.showTranslations}
          />
        ))}
      </div>
    </div>
  );
}

function ChatBubble({
  line,
  showTranslation,
}: {
  line: DialogueLine;
  showTranslation: boolean;
}) {
  const isRight = line.position === 'right';
  const bubbleColor =
    line.speaker === 'buyer' ? 'bg-blue-100 text-blue-900' : 'bg-amber-100 text-amber-900';
  const speakerLabel =
    line.speaker === 'custom' ? line.speakerName : line.speaker === 'buyer' ? 'Buyer' : 'Seller';

  return (
    <div className={`flex ${isRight ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${bubbleColor}`}>
        <p className="text-xs font-semibold uppercase tracking-wide opacity-60">
          {speakerLabel}
        </p>
        <p className="text-base font-bold">{line.vietnamese || '...'}</p>
        {showTranslation && line.english && (
          <p className="mt-1 text-sm opacity-70">{line.english}</p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 5. Picture Book Layout - Full-page image with 1-2 sentences (storybook style)
// ============================================================================
function PictureBookLayout({ page }: ConversationLayoutProps) {
  // For picture book, we use scene image as the main illustration
  // and show just the first 1-2 dialogue lines as simple text below
  const displayLines = page.dialogues.slice(0, 2);

  return (
    <div className="flex flex-col">
      {page.title && (
        <h2 className="mb-4 text-center text-xl font-bold text-gray-900">
          {page.title}
        </h2>
      )}

      {/* Full-page illustration */}
      <div className="mb-4 overflow-hidden rounded-2xl">
        {page.sceneImage ? (
          <img
            src={page.sceneImage}
            alt="Scene"
            className="h-auto w-full object-contain"
          />
        ) : (
          <div className="flex h-64 w-full items-center justify-center bg-gradient-to-b from-sky-100 to-green-100">
            <span className="text-6xl">🖼️</span>
          </div>
        )}
      </div>

      {/* Simple text below - 1-2 sentences */}
      <div className="space-y-3 text-center">
        {displayLines.map((line, index) => (
          <div key={line.id || index}>
            <p className="text-xl font-bold text-gray-900">
              {line.vietnamese || '...'}
            </p>
            {page.showTranslations && line.english && (
              <p className="mt-1 text-base text-gray-600">{line.english}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
