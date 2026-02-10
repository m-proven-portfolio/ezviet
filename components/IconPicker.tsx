'use client';

import { useState, useMemo, useCallback, useDeferredValue, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import * as LucideIcons from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { CategoryIcon } from './CategoryIcon';
import {
  EMOJI_DATA,
  EMOJI_CATEGORIES,
  LUCIDE_ICON_DATA,
  toPascalCase,
} from '@/lib/icon-picker';

interface IconPickerProps {
  value: string;
  onChange: (value: string) => void;
}

// Number of items per row in the grid
const ITEMS_PER_ROW = 9;
const ITEM_SIZE = 36; // 9 * 4 = 36px (w-9 h-9)
const GAP = 4; // gap-1 = 4px
const ROW_HEIGHT = ITEM_SIZE + GAP;

// Get Lucide icon component by name
function getLucideIcon(name: string): LucideIcon | undefined {
  const pascalName = toPascalCase(name);
  return (LucideIcons as unknown as Record<string, LucideIcon>)[pascalName];
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [activeTab, setActiveTab] = useState<'emoji' | 'lucide'>('emoji');
  const [searchQuery, setSearchQuery] = useState('');
  const parentRef = useRef<HTMLDivElement>(null);

  // Deferred value for search - non-blocking UI updates
  const deferredQuery = useDeferredValue(searchQuery);

  // Determine if current value is emoji or lucide
  const isLucide = value.startsWith('lucide:');
  const currentEmoji = isLucide ? '' : value.startsWith('emoji:') ? value.replace('emoji:', '') : value;
  const currentLucide = isLucide ? value.replace('lucide:', '') : '';

  // Memoized handlers
  const handleEmojiSelect = useCallback(
    (emoji: string) => {
      onChange(`emoji:${emoji}`);
    },
    [onChange]
  );

  const handleLucideSelect = useCallback(
    (iconName: string) => {
      onChange(`lucide:${iconName}`);
    },
    [onChange]
  );

  const handleClear = useCallback(() => {
    onChange('');
  }, [onChange]);

  const handleTabChange = useCallback((tab: 'emoji' | 'lucide') => {
    setActiveTab(tab);
    setSearchQuery('');
  }, []);

  // Filter emojis based on search query - organized by category
  const filteredEmojisByCategory = useMemo(() => {
    if (!deferredQuery.trim()) return EMOJI_DATA;

    const query = deferredQuery.toLowerCase();
    const filtered: typeof EMOJI_DATA = {};

    for (const [category, data] of Object.entries(EMOJI_DATA)) {
      const matchingEmojis = data.emojis.filter((item) =>
        item.keywords.some((keyword) => keyword.includes(query))
      );
      if (matchingEmojis.length > 0) {
        filtered[category] = { emojis: matchingEmojis };
      }
    }

    return filtered;
  }, [deferredQuery]);

  // Flatten emojis for virtualization
  const flatEmojiData = useMemo(() => {
    const items: Array<{ type: 'header'; category: string } | { type: 'emoji'; emoji: string; keywords: string[] }> =
      [];

    for (const category of EMOJI_CATEGORIES) {
      const categoryData = filteredEmojisByCategory[category];
      if (!categoryData) continue;

      items.push({ type: 'header', category });
      for (const emoji of categoryData.emojis) {
        items.push({ type: 'emoji', ...emoji });
      }
    }

    return items;
  }, [filteredEmojisByCategory]);

  // Filter Lucide icons based on search
  const filteredLucideIcons = useMemo(() => {
    if (!deferredQuery.trim()) return LUCIDE_ICON_DATA;
    const query = deferredQuery.toLowerCase();
    return LUCIDE_ICON_DATA.filter(
      (icon) => icon.name.includes(query) || icon.keywords.some((keyword) => keyword.includes(query))
    );
  }, [deferredQuery]);

  // Calculate rows for virtualization (emojis)
  const emojiRows = useMemo(() => {
    const rows: Array<
      | { type: 'header'; category: string }
      | { type: 'emoji-row'; emojis: Array<{ emoji: string; keywords: string[] }> }
    > = [];

    let currentRowEmojis: Array<{ emoji: string; keywords: string[] }> = [];

    for (const item of flatEmojiData) {
      if (item.type === 'header') {
        // Flush current row if any
        if (currentRowEmojis.length > 0) {
          rows.push({ type: 'emoji-row', emojis: currentRowEmojis });
          currentRowEmojis = [];
        }
        rows.push(item);
      } else {
        currentRowEmojis.push(item);
        if (currentRowEmojis.length === ITEMS_PER_ROW) {
          rows.push({ type: 'emoji-row', emojis: currentRowEmojis });
          currentRowEmojis = [];
        }
      }
    }

    // Flush remaining emojis
    if (currentRowEmojis.length > 0) {
      rows.push({ type: 'emoji-row', emojis: currentRowEmojis });
    }

    return rows;
  }, [flatEmojiData]);

  // Calculate rows for Lucide icons
  const lucideRows = useMemo(() => {
    const rows: Array<{ icons: typeof LUCIDE_ICON_DATA }> = [];
    for (let i = 0; i < filteredLucideIcons.length; i += ITEMS_PER_ROW) {
      rows.push({ icons: filteredLucideIcons.slice(i, i + ITEMS_PER_ROW) });
    }
    return rows;
  }, [filteredLucideIcons]);

  // Virtualizer for emoji rows
  const emojiVirtualizer = useVirtualizer({
    count: emojiRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => (emojiRows[index].type === 'header' ? 28 : ROW_HEIGHT),
    overscan: 5,
  });

  // Virtualizer for lucide rows
  const lucideVirtualizer = useVirtualizer({
    count: lucideRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 5,
  });

  return (
    <div className="space-y-4">
      {/* Current selection preview */}
      {value && (
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <CategoryIcon icon={value} size="md" />
          <div className="flex-1">
            <span className="text-sm font-medium text-gray-700">Selected:</span>
            <span className="ml-2 text-sm text-gray-600">
              {isLucide ? currentLucide.replace(/-/g, ' ') : currentEmoji}
            </span>
          </div>
          <button type="button" onClick={handleClear} className="text-gray-400 hover:text-gray-600 text-sm">
            Clear
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          type="button"
          onClick={() => handleTabChange('emoji')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'emoji'
              ? 'border-emerald-500 text-emerald-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Emoji
        </button>
        <button
          type="button"
          onClick={() => handleTabChange('lucide')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'lucide'
              ? 'border-emerald-500 text-emerald-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Icons (Lucide)
        </button>
      </div>

      {/* Search input */}
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
        placeholder={activeTab === 'emoji' ? 'Search emojis (e.g., cat, food, happy)...' : 'Search icons...'}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
      />

      {/* Virtualized icon grid */}
      <div ref={parentRef} className="h-64 overflow-y-auto">
        {activeTab === 'emoji' ? (
          emojiRows.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No emojis found for &quot;{searchQuery}&quot;</p>
          ) : (
            <div
              style={{
                height: `${emojiVirtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {emojiVirtualizer.getVirtualItems().map((virtualRow) => {
                const row = emojiRows[virtualRow.index];

                if (row.type === 'header') {
                  return (
                    <div
                      key={virtualRow.key}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: `${virtualRow.size}px`,
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                      className="text-xs font-semibold text-gray-500 uppercase tracking-wide py-1"
                    >
                      {row.category}
                    </div>
                  );
                }

                return (
                  <div
                    key={virtualRow.key}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                    className="flex gap-1"
                  >
                    {row.emojis.map((item) => (
                      <button
                        key={item.emoji}
                        type="button"
                        onClick={() => handleEmojiSelect(item.emoji)}
                        title={item.keywords.join(', ')}
                        className={`w-9 h-9 text-xl rounded-lg transition-all ${
                          currentEmoji === item.emoji
                            ? 'bg-emerald-100 ring-2 ring-emerald-500 scale-110'
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        {item.emoji}
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          )
        ) : lucideRows.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No icons found for &quot;{searchQuery}&quot;</p>
        ) : (
          <div
            style={{
              height: `${lucideVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {lucideVirtualizer.getVirtualItems().map((virtualRow) => {
              const row = lucideRows[virtualRow.index];

              return (
                <div
                  key={virtualRow.key}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  className="flex gap-1"
                >
                  {row.icons.map((icon) => {
                    const IconComponent = getLucideIcon(icon.name);

                    if (!IconComponent) return null;

                    return (
                      <button
                        key={icon.name}
                        type="button"
                        onClick={() => handleLucideSelect(icon.name)}
                        title={icon.name.replace(/-/g, ' ')}
                        className={`w-9 h-9 rounded-lg transition-all flex items-center justify-center ${
                          currentLucide === icon.name
                            ? 'bg-emerald-100 ring-2 ring-emerald-500 text-emerald-600 scale-110'
                            : 'bg-gray-50 hover:bg-gray-100 text-gray-600'
                        }`}
                      >
                        <IconComponent size={18} />
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
