'use client';

import type { LessonPage } from '@/lib/studio/types';
import { GRID_LAYOUTS, getGridColsClass } from '@/lib/studio/grid-layouts';

interface LessonPagePreviewProps {
  page: LessonPage;
  showRomanization?: boolean;
}

export function LessonPagePreview({ page, showRomanization = false }: LessonPagePreviewProps) {
  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">{page.title}</h1>
        {page.subtitle && (
          <p className="mt-1 text-lg text-gray-600">{page.subtitle}</p>
        )}
      </div>

      {/* Dialogue Section */}
      {page.sections.dialogue && page.dialogue && (
        <DialogueSection dialogue={page.dialogue} />
      )}

      {/* Vocabulary Section */}
      {page.sections.vocabulary && page.vocabulary && (
        <VocabularySection vocabulary={page.vocabulary} showRomanization={showRomanization} />
      )}

      {/* Tastes Section */}
      {page.sections.tastes && page.tastes && (
        <TastesSection tastes={page.tastes} />
      )}

      {/* Cultural Tips Section */}
      {page.sections.culturalTips && page.culturalTips && (
        <CulturalTipsSection culturalTips={page.culturalTips} />
      )}
    </div>
  );
}

function DialogueSection({ dialogue }: { dialogue: NonNullable<LessonPage['dialogue']> }) {
  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4">
      {dialogue.sceneImage && (
        <img
          src={dialogue.sceneImage}
          alt="Scene"
          className="mb-4 w-full rounded-lg object-cover"
          style={{ maxHeight: '200px' }}
        />
      )}

      <div className="space-y-2">
        {dialogue.lines.map((line) => (
          <div
            key={line.id}
            className={`flex ${line.speaker === 'A' ? 'justify-start' : 'justify-end'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-3 py-2 ${
                line.speaker === 'A'
                  ? 'bg-blue-500 text-white'
                  : 'bg-amber-500 text-white'
              }`}
            >
              {line.speakerName && (
                <p className="mb-1 text-xs font-medium opacity-80">
                  {line.speakerName}
                </p>
              )}
              <p className="font-medium">{line.vietnamese}</p>
              {dialogue.showTranslations && (
                <p className="mt-1 text-sm opacity-90">{line.english}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function VocabularySection({ vocabulary, showRomanization }: { vocabulary: NonNullable<LessonPage['vocabulary']>; showRomanization: boolean }) {
  const layoutConfig = GRID_LAYOUTS[vocabulary.layout];

  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4">
      {vocabulary.sectionTitle && (
        <h3 className="mb-3 text-center font-bold text-emerald-800">
          {vocabulary.sectionTitle}
        </h3>
      )}

      <div className={`grid gap-3 ${getGridColsClass(layoutConfig.cols)}`}>
        {vocabulary.cards.map((card) => (
          <div
            key={card.id}
            className="flex flex-col items-center rounded-lg border border-emerald-200 bg-white p-3"
          >
            {card.image ? (
              <img
                src={card.image}
                alt={card.vietnamese}
                className="mb-2 h-16 w-16 object-contain"
              />
            ) : (
              <div className="mb-2 h-16 w-16 rounded bg-gray-100" />
            )}
            <p className="text-sm font-bold text-gray-900">{card.vietnamese}</p>
            {showRomanization && card.pronunciation && (
              <p className="text-xs text-gray-500">{card.pronunciation}</p>
            )}
            <p className="text-xs text-gray-600">{card.english}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function TastesSection({ tastes }: { tastes: NonNullable<LessonPage['tastes']> }) {
  return (
    <div className="rounded-lg border border-purple-200 bg-purple-50/50 p-4">
      {tastes.sectionTitle && (
        <h3 className="mb-3 text-center font-bold text-purple-800">
          {tastes.sectionTitle}
        </h3>
      )}

      {tastes.contentType === 'text' && tastes.textContent && (
        <p className="text-sm text-gray-700">{tastes.textContent}</p>
      )}

      {tastes.contentType === 'images' && tastes.images && (
        <div className="grid grid-cols-3 gap-3">
          {tastes.images.map((img) => (
            <div key={img.id} className="text-center">
              {img.image && (
                <img
                  src={img.image}
                  alt=""
                  className="mb-1 h-20 w-full rounded object-contain"
                />
              )}
              {img.caption && (
                <p className="text-xs text-gray-600">{img.caption}</p>
              )}
              {img.captionVietnamese && (
                <p className="text-xs font-medium text-gray-800">
                  {img.captionVietnamese}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CulturalTipsSection({
  culturalTips,
}: {
  culturalTips: NonNullable<LessonPage['culturalTips']>;
}) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4">
      {culturalTips.sectionTitle && (
        <h3 className="mb-3 text-center font-bold text-amber-800">
          {culturalTips.sectionTitle}
        </h3>
      )}

      <ul className="space-y-2">
        {culturalTips.tips.map((tip, index) => (
          <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
            <span className="text-amber-500">•</span>
            {tip}
          </li>
        ))}
      </ul>

      {culturalTips.footerTip && (
        <div className="mt-4 flex items-start gap-2 rounded bg-amber-100 p-2 text-sm text-amber-800">
          <span>💡</span>
          {culturalTips.footerTip}
        </div>
      )}
    </div>
  );
}
