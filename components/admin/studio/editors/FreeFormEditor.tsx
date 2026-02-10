'use client';

import { useState, useMemo, useCallback, ClipboardEvent } from 'react';
import { Bold, Italic, List, ListOrdered, Heading1, Heading2, Image as ImageIcon, Code, Sparkles } from 'lucide-react';
import type { FreeFormPage } from '@/lib/studio/types';
import { ImageSourcePicker } from '../ImageSourcePicker';

interface FreeFormEditorProps {
  page: FreeFormPage;
  stylePrompt: string;
  onUpdate: (page: FreeFormPage) => void;
  onStylePromptSave?: (newStylePrompt: string) => void;
}

// Escape HTML special characters to prevent XSS when inserting into HTML attributes
function escapeHtmlAttribute(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Simple HTML sanitizer for preview (admin-only content)
// Allows only safe tags and removes scripts/events
function sanitizeHTML(html: string): string {
  const allowedTags = ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'h1', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'img', 'a', 'span', 'div'];
  const allowedAttrs = ['src', 'alt', 'href', 'class', 'style'];

  // Create a temporary div to parse HTML
  if (typeof window === 'undefined') return html;

  const doc = new DOMParser().parseFromString(html, 'text/html');

  // Remove script tags and event handlers
  doc.querySelectorAll('script, style').forEach(el => el.remove());

  // Remove event handlers from all elements
  doc.querySelectorAll('*').forEach(el => {
    // Remove all on* attributes
    Array.from(el.attributes).forEach(attr => {
      if (attr.name.startsWith('on') || attr.name === 'javascript:') {
        el.removeAttribute(attr.name);
      }
    });
  });

  return doc.body.innerHTML;
}

// Convert pasted HTML (especially from Google Docs) to clean semantic HTML
function convertPastedHTML(html: string): string {
  if (typeof window === 'undefined') return html;

  const doc = new DOMParser().parseFromString(html, 'text/html');

  // Helper to move all children from one element to another
  const moveChildren = (from: Element, to: Element) => {
    while (from.firstChild) {
      to.appendChild(from.firstChild);
    }
  };

  // Convert inline styles to semantic tags
  doc.querySelectorAll('span, b, i, u').forEach(el => {
    const style = el.getAttribute('style') || '';
    const tagName = el.tagName.toLowerCase();

    const isBold = /font-weight:\s*(bold|[6-9]00)/i.test(style) || tagName === 'b';
    const isItalic = /font-style:\s*italic/i.test(style) || tagName === 'i';

    if ((isBold || isItalic) && el.parentNode) {
      // Build the replacement element(s)
      // For both bold + italic: <strong><em>content</em></strong>
      let wrapper: Element;
      if (isBold && isItalic) {
        const strong = document.createElement('strong');
        const em = document.createElement('em');
        moveChildren(el, em);
        strong.appendChild(em);
        wrapper = strong;
      } else if (isBold) {
        wrapper = document.createElement('strong');
        moveChildren(el, wrapper);
      } else {
        wrapper = document.createElement('em');
        moveChildren(el, wrapper);
      }
      el.parentNode.replaceChild(wrapper, el);
    }
  });

  // Convert heading-like elements (large font sizes to h2/h3)
  doc.querySelectorAll('p, span').forEach(el => {
    const style = el.getAttribute('style') || '';
    const fontSizeMatch = style.match(/font-size:\s*(\d+)/);
    if (fontSizeMatch) {
      const size = parseInt(fontSizeMatch[1], 10);
      if (size >= 24 && el.parentNode) {
        const h2 = document.createElement('h2');
        moveChildren(el, h2);
        el.parentNode.replaceChild(h2, el);
      } else if (size >= 18 && el.parentNode) {
        const h3 = document.createElement('h3');
        moveChildren(el, h3);
        el.parentNode.replaceChild(h3, el);
      }
    }
  });

  // Clean up empty spans - unwrap them
  doc.querySelectorAll('span').forEach(el => {
    if (!el.getAttribute('style') && !el.className && el.parentNode) {
      const parent = el.parentNode;
      while (el.firstChild) {
        parent.insertBefore(el.firstChild, el);
      }
      parent.removeChild(el);
    }
  });

  // Remove Google Docs specific attributes
  doc.querySelectorAll('*').forEach(el => {
    el.removeAttribute('id');
    el.removeAttribute('class');
    el.removeAttribute('style');
    el.removeAttribute('dir');
  });

  let result = doc.body.innerHTML;
  result = result.replace(/<p>\s*<\/p>/gi, '');
  result = result.replace(/(<br\s*\/?>\s*){3,}/gi, '<br><br>');

  return result.trim();
}

export function FreeFormEditor({
  page,
  stylePrompt,
  onUpdate,
  onStylePromptSave,
}: FreeFormEditorProps) {
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [showHTML, setShowHTML] = useState(false);
  const [showPasteSuccess, setShowPasteSuccess] = useState(false);

  // Sanitize content for preview
  const sanitizedContent = useMemo(() => {
    return sanitizeHTML(page.content || '');
  }, [page.content]);

  // Handle paste with smart formatting conversion
  const handlePaste = useCallback((e: ClipboardEvent<HTMLTextAreaElement>) => {
    const html = e.clipboardData.getData('text/html');
    const text = e.clipboardData.getData('text/plain');

    // If there's HTML content (from Google Docs, Word, etc), convert it
    // Check: has HTML AND (HTML is longer than plain text OR contains formatting tags)
    const hasRichFormatting = html && (
      html.length > text.length * 1.2 || // Lowered threshold from 1.5x
      /<(strong|em|b|i|h[1-6]|ul|ol|li|p)\b/i.test(html)
    );

    if (hasRichFormatting) {
      e.preventDefault();
      const converted = convertPastedHTML(html);

      // Skip if conversion produced empty result
      if (!converted.trim()) {
        return; // Let default paste happen
      }

      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentContent = page.content || ''; // Handle undefined

      const newContent =
        currentContent.substring(0, start) +
        converted +
        currentContent.substring(end);

      onUpdate({ ...page, content: newContent });

      // Show success indicator
      setShowPasteSuccess(true);
      setTimeout(() => setShowPasteSuccess(false), 2000);
    }
    // Otherwise, let the default paste happen (plain text)
  }, [page, onUpdate]);

  const handleImageSelect = (imageUrl: string) => {
    // Insert image at the end of content
    // Escape the URL to prevent XSS via malicious image URLs
    const safeUrl = escapeHtmlAttribute(imageUrl);
    const imgTag = `<img src="${safeUrl}" alt="" class="max-w-full h-auto my-4 mx-auto rounded-lg" />`;
    onUpdate({ ...page, content: page.content + imgTag });
    setShowImagePicker(false);
  };

  // Simple formatting functions
  const wrapSelection = (tag: string) => {
    const textarea = document.getElementById('freeform-content') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = page.content.substring(start, end);

    if (selectedText) {
      const newContent =
        page.content.substring(0, start) +
        `<${tag}>${selectedText}</${tag}>` +
        page.content.substring(end);
      onUpdate({ ...page, content: newContent });
    }
  };

  const insertBlock = (tag: string, placeholder: string) => {
    const newContent = page.content + `\n<${tag}>${placeholder}</${tag}>`;
    onUpdate({ ...page, content: newContent });
  };

  return (
    <div className="mx-auto max-w-4xl rounded-xl bg-white p-6 shadow-sm">
      <h2 className="mb-6 text-lg font-semibold text-gray-900">
        Free Form Editor
      </h2>

      {/* Page Title (optional) */}
      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Page Title (optional)
        </label>
        <input
          type="text"
          value={page.title || ''}
          onChange={(e) => onUpdate({ ...page, title: e.target.value })}
          placeholder="e.g., About the Author"
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-emerald-500 focus:outline-none"
        />
      </div>

      {/* Toolbar */}
      <div className="mb-2 flex flex-wrap items-center gap-1 rounded-t-lg border border-b-0 border-gray-300 bg-gray-50 px-2 py-2">
        <button
          onClick={() => wrapSelection('strong')}
          className="rounded p-1.5 text-gray-600 hover:bg-gray-200"
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          onClick={() => wrapSelection('em')}
          className="rounded p-1.5 text-gray-600 hover:bg-gray-200"
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </button>
        <div className="mx-2 h-5 w-px bg-gray-300" />
        <button
          onClick={() => insertBlock('h2', 'Heading')}
          className="rounded p-1.5 text-gray-600 hover:bg-gray-200"
          title="Heading 1"
        >
          <Heading1 className="h-4 w-4" />
        </button>
        <button
          onClick={() => insertBlock('h3', 'Subheading')}
          className="rounded p-1.5 text-gray-600 hover:bg-gray-200"
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </button>
        <div className="mx-2 h-5 w-px bg-gray-300" />
        <button
          onClick={() => insertBlock('ul', '<li>List item</li>')}
          className="rounded p-1.5 text-gray-600 hover:bg-gray-200"
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </button>
        <button
          onClick={() => insertBlock('ol', '<li>List item</li>')}
          className="rounded p-1.5 text-gray-600 hover:bg-gray-200"
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </button>
        <div className="mx-2 h-5 w-px bg-gray-300" />
        <button
          onClick={() => setShowImagePicker(true)}
          className="rounded p-1.5 text-gray-600 hover:bg-gray-200"
          title="Insert Image"
        >
          <ImageIcon className="h-4 w-4" />
        </button>
        <div className="flex-1" />
        <button
          onClick={() => setShowHTML(!showHTML)}
          className={`rounded px-2 py-1 text-xs font-medium ${
            showHTML ? 'bg-gray-200 text-gray-700' : 'text-gray-500 hover:bg-gray-200'
          }`}
          title="Toggle HTML view"
        >
          <Code className="h-4 w-4" />
        </button>
      </div>

      {/* Content Editor */}
      <div className="relative">
        <textarea
          id="freeform-content"
          value={page.content}
          onChange={(e) => onUpdate({ ...page, content: e.target.value })}
          onPaste={handlePaste}
          placeholder={showHTML
            ? '<p>Start writing HTML here...</p>'
            : 'Start writing here... Use the toolbar to format text, or paste content from Google Docs.'
          }
          rows={16}
          className={`w-full rounded-b-lg border border-gray-300 px-4 py-3 focus:border-emerald-500 focus:outline-none ${
            showHTML ? 'font-mono text-sm' : ''
          }`}
        />
        {showPasteSuccess && (
          <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
            <Sparkles className="h-3 w-3" />
            Formatting preserved!
          </div>
        )}
      </div>

      {/* Smart Paste Tip */}
      <div className="mt-4 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 p-4">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-5 w-5 flex-shrink-0 text-purple-500" />
          <div className="text-sm">
            <p className="font-medium text-purple-900">Smart Paste from Google Docs</p>
            <p className="mt-1 text-purple-700">
              Copy from Google Docs and paste here - bold, italic, headings, and lists are automatically preserved!
            </p>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="mt-3 rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
        <p className="font-medium text-gray-700">More tips:</p>
        <ul className="mt-1 list-inside list-disc">
          <li>Select text and click Bold/Italic to format</li>
          <li>Toggle HTML mode (<Code className="inline h-3 w-3" />) to edit raw HTML directly</li>
        </ul>
      </div>

      {/* Preview - Using iframe sandbox for safe rendering */}
      <div className="mt-8 rounded-lg border bg-gray-50 p-6">
        <h3 className="mb-4 text-sm font-medium text-gray-500">Preview</h3>
        <div className="rounded-lg bg-white p-6 shadow-sm">
          {page.title && (
            <h2 className="mb-4 text-xl font-bold text-gray-900">{page.title}</h2>
          )}
          {sanitizedContent ? (
            <iframe
              srcDoc={`
                <!DOCTYPE html>
                <html>
                <head>
                  <style>
                    body { font-family: system-ui, sans-serif; font-size: 14px; line-height: 1.6; color: #374151; margin: 0; padding: 0; }
                    h1, h2, h3 { color: #111827; margin: 0 0 0.5em; }
                    h2 { font-size: 1.25em; }
                    h3 { font-size: 1.1em; }
                    p { margin: 0 0 1em; }
                    ul, ol { margin: 0 0 1em; padding-left: 1.5em; }
                    img { max-width: 100%; height: auto; border-radius: 8px; margin: 1em 0; }
                    strong, b { font-weight: 600; }
                    em, i { font-style: italic; }
                  </style>
                </head>
                <body>${sanitizedContent}</body>
                </html>
              `}
              sandbox="allow-same-origin"
              className="w-full min-h-[200px] border-0"
              title="Content preview"
            />
          ) : (
            <p className="text-gray-400">No content yet</p>
          )}
        </div>
      </div>

      {/* Image Picker Modal */}
      {showImagePicker && (
        <ImageSourcePicker
          stylePrompt={stylePrompt}
          contentPromptSuggestion="illustration for Vietnamese learning book"
          onSelect={handleImageSelect}
          onClose={() => setShowImagePicker(false)}
          onStylePromptSave={onStylePromptSave}
        />
      )}
    </div>
  );
}
