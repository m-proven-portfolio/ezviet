'use client';

import type { ImageLabelingPage } from '@/lib/studio/types';

interface ImageLabelingPreviewProps {
  page: ImageLabelingPage;
  showRomanization?: boolean;
}

export function ImageLabelingPreview({ page, showRomanization = false }: ImageLabelingPreviewProps) {
  return (
    <div className="mx-auto max-w-2xl">
      {/* Title */}
      {page.title && (
        <h2 className="mb-4 text-center text-xl font-bold text-gray-900">{page.title}</h2>
      )}

      {/* Instructions */}
      {page.instructions && (
        <p className="mb-4 text-center text-sm text-gray-600">{page.instructions}</p>
      )}

      {/* Image with Labels */}
      <div className="relative mb-4">
        {page.backgroundImage ? (
          <>
            <img
              src={page.backgroundImage}
              alt={page.title}
              className="w-full rounded-lg"
            />
            {/* Numbered markers */}
            {page.labels.map((label, index) => (
              <div
                key={label.id}
                className="absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-xs font-bold text-white shadow-md print:h-5 print:w-5 print:text-[10px]"
                style={{ left: `${label.x}%`, top: `${label.y}%` }}
              >
                {index + 1}
              </div>
            ))}
          </>
        ) : (
          <div className="flex h-64 items-center justify-center rounded-lg bg-gray-100">
            <p className="text-gray-400">No image selected</p>
          </div>
        )}
      </div>

      {/* Legend */}
      {page.showLegend && page.labels.length > 0 && (
        <div className="rounded-lg border bg-gray-50 p-4 print:border-gray-300 print:bg-white">
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            {page.labels.map((label, index) => (
              <div key={label.id} className="flex items-start gap-2">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white print:bg-blue-700">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1 text-sm">
                  <span className="font-semibold text-gray-900">
                    {label.vietnamese || '________'}
                  </span>
                  {showRomanization && label.pronunciation && (
                    <span className="ml-1 text-gray-500">/{label.pronunciation}/</span>
                  )}
                  {label.english && (
                    <>
                      <span className="mx-1 text-gray-400">→</span>
                      <span className="text-gray-600">{label.english}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interactive mode indicator (only shown in preview, not print) */}
      {page.interactiveEnabled && (
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400 print:hidden">
          <span>🎮</span>
          <span>Interactive games available online</span>
        </div>
      )}
    </div>
  );
}
