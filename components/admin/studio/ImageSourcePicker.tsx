'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Sparkles, FolderOpen, Upload, Loader2, Search, Check, ChevronDown, ZoomIn, ZoomOut, Maximize2, RotateCcw } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { GeneratingLoader } from './GeneratingLoader';
import { resizeImage, type ImageContext, getImageContextDescription } from '@/lib/image-resize';

type AIModel = 'dalle' | 'gemini';

interface ImageSourcePickerProps {
  stylePrompt: string;
  contentPromptSuggestion: string;
  onSelect: (imageUrl: string) => void;
  onClose: () => void;
  /** Callback when user wants to save the edited style prompt as the new default */
  onStylePromptSave?: (newStylePrompt: string) => void;
  /** Image context for auto-resizing uploads. Defaults to 'original' (no resize). */
  imageContext?: ImageContext;
}

type Tab = 'generate' | 'select' | 'upload';
type SortOption = 'newest' | 'oldest' | 'az' | 'za';

interface CardTerm {
  text: string;
  lang: string;
}

interface ExistingCard {
  id: string;
  slug: string;
  image_path: string | null;
  category_id: string | null;
  created_at: string | null;
  card_terms: CardTerm[];
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

// Image Preview Lightbox Component
function ImagePreviewLightbox({
  imageUrl,
  onClose,
}: {
  imageUrl: string;
  onClose: () => void;
}) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const minScale = 0.5;
  const maxScale = 4;
  const zoomStep = 0.25;

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === '+' || e.key === '=') handleZoomIn();
      if (e.key === '-') handleZoomOut();
      if (e.key === '0') handleReset();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Handle wheel zoom
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -zoomStep : zoomStep;
      setScale((s) => Math.min(maxScale, Math.max(minScale, s + delta)));
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  const handleZoomIn = () => setScale((s) => Math.min(maxScale, s + zoomStep));
  const handleZoomOut = () => setScale((s) => Math.max(minScale, s - zoomStep));
  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90"
      onClick={onClose}
    >
      {/* Controls */}
      <div className="absolute left-1/2 top-4 z-10 flex -translate-x-1/2 items-center gap-2 rounded-lg bg-white/10 px-3 py-2 backdrop-blur">
        <button
          onClick={(e) => { e.stopPropagation(); handleZoomOut(); }}
          className="rounded p-1.5 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
          title="Zoom out (-)"
        >
          <ZoomOut className="h-5 w-5" />
        </button>
        <span className="min-w-[4rem] text-center text-sm font-medium text-white">
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); handleZoomIn(); }}
          className="rounded p-1.5 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
          title="Zoom in (+)"
        >
          <ZoomIn className="h-5 w-5" />
        </button>
        <div className="mx-1 h-5 w-px bg-white/30" />
        <button
          onClick={(e) => { e.stopPropagation(); handleReset(); }}
          className="rounded p-1.5 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
          title="Reset (0)"
        >
          <RotateCcw className="h-5 w-5" />
        </button>
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-10 rounded-lg bg-white/10 p-2 text-white/80 backdrop-blur transition-colors hover:bg-white/20 hover:text-white"
      >
        <X className="h-6 w-6" />
      </button>

      {/* Image container */}
      <div
        ref={containerRef}
        className={`relative flex h-full w-full items-center justify-center overflow-hidden ${
          scale > 1 ? 'cursor-grab' : 'cursor-zoom-in'
        } ${isDragging ? 'cursor-grabbing' : ''}`}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img
          src={imageUrl}
          alt="Preview"
          className="max-h-[85vh] max-w-[85vw] select-none rounded-lg shadow-2xl transition-transform duration-150"
          style={{
            transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
          }}
          draggable={false}
          onClick={(e) => {
            e.stopPropagation();
            if (scale < maxScale) handleZoomIn();
          }}
        />
      </div>

      {/* Keyboard hints */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-white/50">
        Scroll to zoom • Drag to pan • ESC to close
      </div>
    </div>
  );
}

export function ImageSourcePicker({
  stylePrompt,
  contentPromptSuggestion,
  onSelect,
  onClose,
  onStylePromptSave,
  imageContext = 'original',
}: ImageSourcePickerProps) {
  const [activeTab, setActiveTab] = useState<Tab>('select');
  const [contentPrompt, setContentPrompt] = useState(contentPromptSuggestion);
  const [generating, setGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // AI model selection and editable style prompt
  const [selectedModel, setSelectedModel] = useState<AIModel>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('imageSourcePicker_model');
      if (saved === 'dalle' || saved === 'gemini') return saved;
    }
    return 'dalle';
  });
  const [editableStylePrompt, setEditableStylePrompt] = useState(stylePrompt);
  const [stylePromptModified, setStylePromptModified] = useState(false);

  // For selecting from existing cards
  const [cards, setCards] = useState<ExistingCard[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCards, setLoadingCards] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  // Persist category & sort preferences in localStorage for convenience
  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('imageSourcePicker_category') || 'all';
    }
    return 'all';
  });
  const [sortBy, setSortBy] = useState<SortOption>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('imageSourcePicker_sort');
      if (saved && ['newest', 'oldest', 'az', 'za'].includes(saved)) {
        return saved as SortOption;
      }
    }
    return 'newest';
  });
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  // For upload
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // For image preview/zoom
  const [showPreview, setShowPreview] = useState(false);

  // Debounce search query (300ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Persist category selection to localStorage
  useEffect(() => {
    localStorage.setItem('imageSourcePicker_category', selectedCategory);
  }, [selectedCategory]);

  // Persist sort preference to localStorage
  useEffect(() => {
    localStorage.setItem('imageSourcePicker_sort', sortBy);
  }, [sortBy]);

  // Persist AI model preference to localStorage
  useEffect(() => {
    localStorage.setItem('imageSourcePicker_model', selectedModel);
  }, [selectedModel]);

  // Track if style prompt has been modified from the original
  useEffect(() => {
    setStylePromptModified(editableStylePrompt !== stylePrompt);
  }, [editableStylePrompt, stylePrompt]);

  // Load categories once
  useEffect(() => {
    loadCategories();
  }, []);

  // Load cards when tab, filters, or debounced search changes
  useEffect(() => {
    if (activeTab === 'select') {
      setCards([]);
      setPage(0);
      setHasMore(true);
      loadCards(0, true);
    }
  }, [activeTab, selectedCategory, sortBy, debouncedQuery]);

  const loadCategories = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  // Use server-side search API for comprehensive search
  const loadCards = useCallback(async (pageNum: number, reset: boolean = false) => {
    setLoadingCards(true);
    try {
      const params = new URLSearchParams({
        page: String(pageNum),
        category: selectedCategory,
        sort: sortBy,
      });

      if (debouncedQuery) {
        params.set('q', debouncedQuery);
      }

      const response = await fetch(`/api/studio/search-cards?${params}`);

      if (!response.ok) {
        throw new Error('Failed to search cards');
      }

      const data = await response.json();
      const newCards = data.cards || [];
      setHasMore(data.hasMore);

      if (reset) {
        setCards(newCards);
      } else {
        setCards(prev => [...prev, ...newCards]);
      }
    } catch (err) {
      console.error('Failed to load cards:', err);
      setError('Failed to load existing cards');
    } finally {
      setLoadingCards(false);
    }
  }, [selectedCategory, sortBy, debouncedQuery]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadCards(nextPage, false);
  };

  const handleGenerate = async () => {
    if (!contentPrompt.trim()) return;

    setGenerating(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const fullPrompt = `${editableStylePrompt}, ${contentPrompt}`;

      // Choose API based on selected model
      const apiEndpoint = selectedModel === 'gemini'
        ? '/api/generate/image-gemini'
        : '/api/studio/generate-image';

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: fullPrompt }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate image');
      }

      const data = await response.json();
      setGeneratedImage(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate image');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveStylePrompt = () => {
    if (onStylePromptSave && stylePromptModified) {
      onStylePromptSave(editableStylePrompt);
      setStylePromptModified(false);
    }
  };

  const handleResetStylePrompt = () => {
    setEditableStylePrompt(stylePrompt);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      // Auto-resize image based on context
      const resizedFile = await resizeImage(file, imageContext);

      const supabase = createClient();

      // Generate unique filename
      const ext = resizedFile.name.split('.').pop();
      const filename = `studio-${Date.now()}.${ext}`;
      const path = `studio/${filename}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('book-assets')
        .upload(path, resizedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('book-assets')
        .getPublicUrl(path);

      onSelect(urlData.publicUrl);
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload image. Make sure the book-assets bucket exists.');
    } finally {
      setUploading(false);
    }
  };

  const handleSelectCard = (card: ExistingCard) => {
    if (!card.image_path) return;

    const supabase = createClient();
    const { data } = supabase.storage
      .from('cards-images')
      .getPublicUrl(card.image_path);

    onSelect(data.publicUrl);
  };

  // Get English and Vietnamese text from card terms
  const getCardText = (card: ExistingCard) => {
    const enTerm = card.card_terms.find(t => t.lang === 'en');
    const viTerm = card.card_terms.find(t => t.lang === 'vi');
    return {
      english: enTerm?.text || '',
      vietnamese: viTerm?.text || '',
    };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Add Image</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('generate')}
            className={`flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'generate'
                ? 'border-b-2 border-emerald-500 text-emerald-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            Generate with AI
          </button>
          <button
            onClick={() => setActiveTab('select')}
            className={`flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'select'
                ? 'border-b-2 border-emerald-500 text-emerald-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <FolderOpen className="h-4 w-4" />
            Select from Cards
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'upload'
                ? 'border-b-2 border-emerald-500 text-emerald-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Upload className="h-4 w-4" />
            Upload
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Generate Tab */}
          {activeTab === 'generate' && (
            <div>
              {/* AI Model Selector */}
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  AI Model
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedModel('dalle')}
                    className={`flex-1 rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all ${
                      selectedModel === 'dalle'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span className="block font-semibold">DALL-E 3</span>
                    <span className="block text-xs opacity-70">OpenAI • Artistic</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedModel('gemini')}
                    className={`flex-1 rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all ${
                      selectedModel === 'gemini'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span className="block font-semibold">Gemini</span>
                    <span className="block text-xs opacity-70">Google • Realistic</span>
                  </button>
                </div>
              </div>

              {/* Editable Style Prompt */}
              <div className="mb-4">
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    Style Prompt
                  </label>
                  <div className="flex items-center gap-2">
                    {stylePromptModified && (
                      <>
                        <button
                          type="button"
                          onClick={handleResetStylePrompt}
                          className="text-xs text-gray-500 hover:text-gray-700"
                        >
                          Reset
                        </button>
                        {onStylePromptSave && (
                          <button
                            type="button"
                            onClick={handleSaveStylePrompt}
                            className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 hover:bg-amber-200"
                          >
                            Save as Default
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
                <textarea
                  value={editableStylePrompt}
                  onChange={(e) => setEditableStylePrompt(e.target.value)}
                  placeholder="Style instructions for the AI..."
                  rows={2}
                  className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none ${
                    stylePromptModified
                      ? 'border-amber-300 bg-amber-50 focus:border-amber-500'
                      : 'border-gray-300 focus:border-emerald-500'
                  }`}
                />
                <p className="mt-1 text-xs text-gray-500">
                  This prompt is combined with your content prompt below
                </p>
              </div>

              {/* Content Prompt */}
              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Content Prompt
                </label>
                <textarea
                  value={contentPrompt}
                  onChange={(e) => setContentPrompt(e.target.value)}
                  placeholder="Describe what you want to generate..."
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {error && (
                <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* Show inspiring loader while generating */}
              {generating && (
                <div className="mb-4">
                  <GeneratingLoader />
                </div>
              )}

              {generatedImage && !generating && (
                <div className="mb-4">
                  <p className="mb-2 text-sm font-medium text-gray-700">Generated Image:</p>
                  <div className="group relative">
                    <img
                      src={generatedImage}
                      alt="Generated"
                      className="h-48 w-full cursor-pointer rounded-lg object-contain bg-gray-100 transition-opacity group-hover:opacity-90"
                      onClick={() => setShowPreview(true)}
                    />
                    {/* Zoom overlay */}
                    <button
                      onClick={() => setShowPreview(true)}
                      className="absolute right-2 top-2 rounded-lg bg-black/50 p-2 text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100"
                      title="View full size"
                    >
                      <Maximize2 className="h-4 w-4" />
                    </button>
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                      <span className="rounded-full bg-black/50 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">
                        Click to zoom
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3">
                {generatedImage && !generating ? (
                  <>
                    <button
                      onClick={handleGenerate}
                      disabled={generating}
                      className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
                    >
                      Regenerate
                    </button>
                    <button
                      onClick={() => onSelect(generatedImage)}
                      className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                    >
                      Use This Image
                    </button>
                  </>
                ) : !generating && (
                  <button
                    onClick={handleGenerate}
                    disabled={generating || !contentPrompt.trim()}
                    className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    <Sparkles className="h-4 w-4" />
                    Generate Image
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Select Tab */}
          {activeTab === 'select' && (
            <div>
              {/* Filters Row */}
              <div className="mb-4 flex flex-wrap gap-3">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search cards..."
                    className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Category Filter */}
                <div className="relative">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="appearance-none rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-8 text-sm focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="all">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </div>

                {/* Sort */}
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="appearance-none rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-8 text-sm focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="az">A → Z</option>
                    <option value="za">Z → A</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              {/* Cards count */}
              <div className="mb-2 text-xs text-gray-500">
                {cards.length} cards{searchQuery && ` matching "${searchQuery}"`}
                {loadingCards && ' (searching...)'}
              </div>

              {/* Cards Grid */}
              {loadingCards && cards.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : cards.length === 0 ? (
                <div className="py-12 text-center text-gray-500">
                  {searchQuery ? 'No cards match your search' : 'No cards found with images'}
                </div>
              ) : (
                <>
                  <div className="grid max-h-72 grid-cols-4 gap-3 overflow-y-auto">
                    {cards.map((card) => {
                      const { english } = getCardText(card);
                      return (
                        <button
                          key={card.id}
                          onClick={() => handleSelectCard(card)}
                          className={`relative overflow-hidden rounded-lg border-2 transition-all ${
                            selectedCard === card.id
                              ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {card.image_path && (
                            <img
                              src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/cards-images/${card.image_path}`}
                              alt={english || card.slug}
                              className="h-20 w-full object-cover"
                            />
                          )}
                          <p className="truncate bg-white px-2 py-1 text-xs">
                            {english || card.slug}
                          </p>
                          {selectedCard === card.id && (
                            <div className="absolute right-1 top-1 rounded-full bg-emerald-500 p-0.5">
                              <Check className="h-3 w-3 text-white" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Load More */}
                  {hasMore && (
                    <div className="mt-4 text-center">
                      <button
                        onClick={loadMore}
                        disabled={loadingCards}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      >
                        {loadingCards ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          'Load More Cards'
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Upload Tab */}
          {activeTab === 'upload' && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 py-12 transition-colors hover:border-emerald-500 hover:bg-emerald-50"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
                    <p className="mt-3 text-sm text-gray-600">Uploading...</p>
                  </>
                ) : (
                  <>
                    <Upload className="h-10 w-10 text-gray-400" />
                    <p className="mt-3 text-sm font-medium text-gray-700">
                      Click to upload an image
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      PNG, JPG, or GIF up to 5MB
                    </p>
                    {imageContext !== 'original' && (
                      <p className="mt-2 text-xs text-emerald-600">
                        Auto-resized to {getImageContextDescription(imageContext)}
                      </p>
                    )}
                  </>
                )}
              </div>

              {error && (
                <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Image Preview Lightbox */}
      {showPreview && generatedImage && (
        <ImagePreviewLightbox
          imageUrl={generatedImage}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}
