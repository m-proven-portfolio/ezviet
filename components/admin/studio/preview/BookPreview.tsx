'use client';

import { useState } from 'react';
import { X, Download, Printer, Type } from 'lucide-react';
import type { StudioBook, StudioPage, PageSize } from '@/lib/studio/types';
import { PAGE_SIZE_DIMENSIONS } from '@/lib/studio/types';
import { GRID_LAYOUTS, getGridColsClass } from '@/lib/studio/grid-layouts';
import { ConversationPreview } from './ConversationLayouts';
import { ImageLabelingPreview } from './ImageLabelingPreview';
import { LessonPagePreview } from './LessonPagePreview';

interface BookPreviewProps {
  book: StudioBook;
  onClose: () => void;
  onExport: () => void;
}

export function BookPreview({ book, onClose, onExport }: BookPreviewProps) {
  const pageSize = PAGE_SIZE_DIMENSIONS[book.settings.pageSize];
  const [showRomanization, setShowRomanization] = useState(
    book.settings.showRomanization ?? false
  );

  // Flatten all pages from all units (with backward compatibility for legacy books)
  const allPages: StudioPage[] = book.units
    ? book.units.flatMap((unit) => unit.pages)
    : book.pages || [];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-900">
      {/* Header (hidden when printing) */}
      <header className="flex items-center justify-between bg-gray-800 px-6 py-3 print:hidden">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold text-white">{book.title}</h1>
          <span className="rounded bg-gray-700 px-2 py-0.5 text-xs text-gray-300">
            {pageSize.label}
          </span>
          {book.units && (
            <span className="rounded bg-gray-700 px-2 py-0.5 text-xs text-gray-300">
              {book.units.length} units
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowRomanization(!showRomanization)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              showRomanization
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            title={showRomanization ? 'Hide pronunciation' : 'Show pronunciation'}
          >
            <Type className="h-4 w-4" />
            {showRomanization ? 'Romanization ON' : 'Romanization OFF'}
          </button>
          <button
            onClick={onExport}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            <Printer className="h-4 w-4" />
            Print / Export PDF
          </button>
        </div>
      </header>

      {/* Preview Area */}
      <div className="flex-1 overflow-y-auto p-8 print:p-0">
        <div className="mx-auto print:mx-0">
          {allPages.map((page, index) => (
            <div
              key={page.id}
              className="mb-8 print:mb-0 print:break-after-page"
            >
              {/* Page number indicator (hidden in print) */}
              <div className="mb-2 text-center text-xs text-gray-500 print:hidden">
                Page {index + 1} of {allPages.length}
              </div>

              {/* Page content */}
              <div
                className="studio-page mx-auto bg-white shadow-lg print:shadow-none"
                style={{
                  width: pageSize.width,
                  minHeight: pageSize.height,
                  padding: '20mm',
                }}
              >
                <PagePreview page={page} showRomanization={showRomanization} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: ${pageSize.width} ${pageSize.height};
            margin: 15mm; /* Use @page margin instead of inline padding */
          }

          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          .print\\:hidden {
            display: none !important;
          }

          .print\\:break-after-page {
            break-after: page;
            page-break-after: always; /* Legacy browser support */
          }

          /* Page container - remove inline padding, let @page margin handle it */
          .studio-page {
            width: 100% !important;
            height: auto !important;
            min-height: unset !important;
            padding: 0 !important; /* Remove inline padding in print */
            box-sizing: border-box !important;
          }

          /* Compact spacing for print */
          .space-y-6 > * + * {
            margin-top: 0.75rem !important; /* Reduce from 1.5rem to 0.75rem */
          }
          .space-y-4 > * + * {
            margin-top: 0.5rem !important; /* Reduce from 1rem to 0.5rem */
          }
          .gap-4 {
            gap: 0.5rem !important; /* Reduce grid gaps */
          }
          .gap-3 {
            gap: 0.375rem !important;
          }
          .mb-6 {
            margin-bottom: 0.75rem !important;
          }
          .mb-8 {
            margin-bottom: 1rem !important;
          }
          .p-4 {
            padding: 0.5rem !important;
          }

          /* Smaller images for print */
          .h-24 {
            height: 4rem !important; /* Reduce from 6rem to 4rem */
          }
          .w-24 {
            width: 4rem !important;
          }
          .h-64 {
            height: 10rem !important; /* Reduce intro illustrations */
          }

          /* Smaller text for print density */
          .text-4xl {
            font-size: 1.75rem !important;
          }
          .text-2xl {
            font-size: 1.25rem !important;
          }
          .text-lg {
            font-size: 0.95rem !important;
          }

          /* Prevent content blocks from splitting across pages */
          img, figure, .rounded-lg, table {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}

// Individual page preview renderer
function PagePreview({ page, showRomanization }: { page: StudioPage; showRomanization: boolean }) {
  switch (page.type) {
    case 'intro':
      return <IntroPreview page={page} />;
    case 'vocabulary-grid':
      return <VocabularyGridPreview page={page} showRomanization={showRomanization} />;
    case 'conversation':
      return <ConversationPreview page={page} />;
    case 'cultural-tips':
      return <CulturalTipsPreview page={page} />;
    case 'revision':
      return <RevisionPreview page={page} showRomanization={showRomanization} />;
    case 'lexics':
      return <LexicsPreview page={page} showRomanization={showRomanization} />;
    case 'free-form':
      return <FreeFormPreview page={page} />;
    case 'image-labeling':
      return <ImageLabelingPreview page={page} showRomanization={showRomanization} />;
    case 'lesson':
      return <LessonPagePreview page={page} showRomanization={showRomanization} />;
    default:
      return <div className="text-gray-500">Unknown page type</div>;
  }
}

// Intro Page Preview
function IntroPreview({ page }: { page: StudioPage & { type: 'intro' } }) {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      {page.illustration && (
        <img
          src={page.illustration}
          alt=""
          className="mb-8 h-64 w-auto max-w-full rounded-lg object-contain"
        />
      )}
      {page.unitNumber && (
        <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-emerald-600">
          {page.unitNumber}
        </p>
      )}
      <h1 className="text-4xl font-bold text-gray-900">{page.title}</h1>
      {page.titleVietnamese && (
        <p className="mt-2 text-2xl text-gray-600">({page.titleVietnamese})</p>
      )}
      {page.subtitle && (
        <p className="mt-6 max-w-md text-lg text-gray-500">{page.subtitle}</p>
      )}
    </div>
  );
}

// Vocabulary Grid Preview
function VocabularyGridPreview({ page, showRomanization }: { page: StudioPage & { type: 'vocabulary-grid' }; showRomanization: boolean }) {
  // Get layout config (default to 2x3 for backward compatibility)
  const layout = page.layout || '2x3';
  const layoutConfig = GRID_LAYOUTS[layout];

  return (
    <div>
      <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">
        {page.title}
      </h2>
      <div className={`grid gap-4 ${getGridColsClass(layoutConfig.cols)}`}>
        {page.cards.slice(0, layoutConfig.maxCards).map((card, index) => (
          <div
            key={card.id || index}
            className="flex flex-col items-center rounded-lg border border-gray-200 bg-gray-50 p-4"
          >
            {card.image ? (
              <img
                src={card.image}
                alt={card.vietnamese}
                className="mb-3 h-24 w-24 object-contain"
              />
            ) : (
              <div className="mb-3 h-24 w-24 rounded bg-gray-200" />
            )}
            <p className="text-lg font-bold text-gray-900">{card.vietnamese || '—'}</p>
            {showRomanization && card.pronunciation && (
              <p className="text-sm text-gray-500">{card.pronunciation}</p>
            )}
            <p className="text-sm text-gray-600">{card.english || '—'}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ConversationPreview is now imported from './ConversationLayouts'

// Cultural Tips Preview
function CulturalTipsPreview({ page }: { page: StudioPage & { type: 'cultural-tips' } }) {
  return (
    <div>
      <h2 className="mb-4 text-center text-2xl font-bold text-gray-900">
        {page.title}
      </h2>
      {page.headerImage && (
        <img
          src={page.headerImage}
          alt=""
          className="mb-6 w-full rounded-lg"
        />
      )}
      <div className="space-y-4">
        {page.sections.map((section, index) => (
          <div
            key={section.id || index}
            className="rounded-lg border border-amber-200 bg-amber-50 p-4"
          >
            <h3 className="mb-2 font-bold text-amber-900">{section.title}</h3>
            <ul className="space-y-1">
              {section.bullets.map((bullet, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-amber-800">
                  <span className="text-amber-500">•</span>
                  {bullet}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {page.footerTip && (
        <div className="mt-6 flex items-start gap-2 rounded-lg bg-blue-50 p-4 text-sm text-blue-700">
          <span className="text-blue-500">💡</span>
          {page.footerTip}
        </div>
      )}
    </div>
  );
}

// Revision Preview
function RevisionPreview({ page, showRomanization }: { page: StudioPage & { type: 'revision' }; showRomanization: boolean }) {
  return (
    <div>
      <h2 className="mb-4 text-center text-2xl font-bold text-gray-900">
        {page.title}
      </h2>
      {page.headerImage && (
        <img
          src={page.headerImage}
          alt=""
          className="mx-auto mb-4 h-24 object-contain"
        />
      )}
      <p className="mb-2 text-center text-lg text-gray-700">{page.prompt}</p>
      {showRomanization && page.promptRomanization && (
        <p className="mb-6 text-center text-sm text-gray-500">
          {page.promptRomanization}
        </p>
      )}
      <div className="mx-auto grid max-w-md grid-cols-4 gap-3">
        {page.answers.map((answer, index) => (
          <div
            key={answer.id || index}
            className="flex flex-col items-center rounded-lg border bg-gray-50 p-3"
          >
            {answer.image && (
              <img
                src={answer.image}
                alt=""
                className="mb-2 h-12 w-12 object-contain"
              />
            )}
            <p className="text-center text-sm">{answer.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Lexics Preview
function LexicsPreview({ page, showRomanization }: { page: StudioPage & { type: 'lexics' }; showRomanization: boolean }) {
  return (
    <div>
      <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">
        {page.title}
      </h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-gray-300 text-left">
            <th className="pb-2 font-bold">Vietnamese</th>
            {showRomanization && <th className="pb-2 font-bold">Pronunciation</th>}
            <th className="pb-2 font-bold">English</th>
          </tr>
        </thead>
        <tbody>
          {page.words.map((word, index) => (
            <tr key={word.id || index} className="border-b border-gray-200">
              <td className="py-2 font-semibold">{word.vietnamese}</td>
              {showRomanization && <td className="py-2 text-gray-500">{word.pronunciation}</td>}
              <td className="py-2">{word.english}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Free Form Preview
function FreeFormPreview({ page }: { page: StudioPage & { type: 'free-form' } }) {
  // Simple sanitization for preview (admin-only content)
  const sanitizeHTML = (html: string): string => {
    if (typeof window === 'undefined') return html;
    const doc = new DOMParser().parseFromString(html, 'text/html');
    doc.querySelectorAll('script, style').forEach(el => el.remove());
    doc.querySelectorAll('*').forEach(el => {
      Array.from(el.attributes).forEach(attr => {
        if (attr.name.startsWith('on')) el.removeAttribute(attr.name);
      });
    });
    return doc.body.innerHTML;
  };

  return (
    <div>
      {page.title && (
        <h2 className="mb-4 text-2xl font-bold text-gray-900">{page.title}</h2>
      )}
      <div
        className="prose prose-sm max-w-none"
        style={{
          /* Safe to use here as content is admin-created and sanitized */
        }}
      >
        <iframe
          srcDoc={`
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: system-ui, sans-serif; font-size: 14px; line-height: 1.6; color: #374151; margin: 0; }
                h1, h2, h3 { color: #111827; margin: 0 0 0.5em; }
                p { margin: 0 0 1em; }
                ul, ol { margin: 0 0 1em; padding-left: 1.5em; }
                img { max-width: 100%; height: auto; border-radius: 8px; }
              </style>
            </head>
            <body>${sanitizeHTML(page.content)}</body>
            </html>
          `}
          sandbox="allow-same-origin"
          className="w-full min-h-[300px] border-0"
          title="Free form content"
        />
      </div>
    </div>
  );
}
