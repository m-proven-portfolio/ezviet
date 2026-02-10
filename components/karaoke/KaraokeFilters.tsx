'use client';

import { Search, ChevronDown, X } from 'lucide-react';

export type SortOption = 'newest' | 'oldest' | 'title' | 'duration';

interface KaraokeFiltersProps {
  genres: string[]; // Available genres (only those with songs)
  selectedGenres: string[]; // Multi-select genres
  onGenresChange: (genres: string[]) => void;
  search: string;
  onSearchChange: (search: string) => void;
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
  totalCount: number;
  filteredCount: number;
}

const SORT_LABELS: Record<SortOption, string> = {
  newest: 'Newest',
  oldest: 'Oldest',
  title: 'A-Z',
  duration: 'Duration',
};

export function KaraokeFilters({
  genres,
  selectedGenres,
  onGenresChange,
  search,
  onSearchChange,
  sort,
  onSortChange,
  totalCount,
  filteredCount,
}: KaraokeFiltersProps) {
  // Only show "filtered" state if some (but not all) genres selected, or search active
  const hasPartialGenreFilter = selectedGenres.length > 0 && selectedGenres.length < genres.length;
  const showingFiltered = hasPartialGenreFilter || search;

  // Toggle a genre in the selection
  const toggleGenre = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      onGenresChange(selectedGenres.filter((g) => g !== genre));
    } else {
      onGenresChange([...selectedGenres, genre]);
    }
  };

  // Select all genres (shows all songs, avoids triggering preference restoration)
  const selectAllGenres = () => {
    onGenresChange([...genres]);
  };

  return (
    <div className="space-y-3">
      {/* Genre Pills Row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
        <button
          onClick={selectAllGenres}
          className={`
            shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all
            ${
              selectedGenres.length === 0 || selectedGenres.length === genres.length
                ? 'bg-white text-purple-900'
                : 'bg-white/10 text-white/80 hover:bg-white/20'
            }
          `}
        >
          All
        </button>
        {genres.map((genre) => {
          const isSelected = selectedGenres.includes(genre);
          return (
            <button
              key={genre}
              onClick={() => toggleGenre(genre)}
              className={`
                shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all
                flex items-center gap-1.5
                ${
                  isSelected
                    ? 'bg-white text-purple-900'
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                }
              `}
            >
              {genre}
              {isSelected && <X className="w-3 h-3" />}
            </button>
          );
        })}
      </div>

      {/* Search + Sort Row */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search songs..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/10 rounded-xl
                       text-white placeholder-white/40 focus:outline-none focus:ring-2
                       focus:ring-purple-500 focus:border-transparent text-sm"
          />
        </div>

        {/* Sort Dropdown */}
        <div className="relative">
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="appearance-none pl-3 pr-8 py-2 bg-white/10 border border-white/10
                       rounded-xl text-white text-sm focus:outline-none focus:ring-2
                       focus:ring-purple-500 cursor-pointer"
          >
            {Object.entries(SORT_LABELS).map(([value, label]) => (
              <option key={value} value={value} className="bg-purple-900 text-white">
                {label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
        </div>
      </div>

      {/* Results count (when filtered) */}
      {showingFiltered && (
        <p className="text-white/50 text-xs">
          {hasPartialGenreFilter ? (
            // Genre filter active: don't show "of total" - just show genre count
            <>
              {filteredCount} {filteredCount === 1 ? 'song' : 'songs'} in {selectedGenres.join(', ')}
              {search && ` matching "${search}"`}
            </>
          ) : (
            // Search only: show "X of Y songs matching..."
            <>
              {filteredCount} of {totalCount} songs matching &quot;{search}&quot;
            </>
          )}
        </p>
      )}
    </div>
  );
}
