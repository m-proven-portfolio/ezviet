'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Eye,
  Download,
  Plus,
  Loader2,
  Save,
  Settings,
  FolderOpen,
  Trash2,
  ChevronRight,
  Pencil,
  Check,
  X,
  Zap,
} from 'lucide-react';
import type { StudioBook, StudioPage, StudioUnit, PageType } from '@/lib/studio/types';
import {
  createEmptyPage,
  createEmptyUnit,
  migrateBookToUnits,
  PAGE_SIZE_DIMENSIONS,
} from '@/lib/studio/types';
import { PageThumbnail } from '@/components/admin/studio/PageThumbnail';
import { AddPageModal } from '@/components/admin/studio/AddPageModal';
import { PageEditor } from '@/components/admin/studio/PageEditor';
import { BookPreview } from '@/components/admin/studio/preview/BookPreview';
import { QuickUnitModal } from '@/components/admin/studio/QuickUnitModal';
import { generateId } from '@/lib/studio/types';

export default function BookEditorPage() {
  const router = useRouter();
  const params = useParams();
  const bookId = params.bookId as string;

  const [book, setBook] = useState<StudioBook | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showQuickUnit, setShowQuickUnit] = useState(false);
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  const [editingUnitTitle, setEditingUnitTitle] = useState('');

  // Load book from localStorage with migration
  useEffect(() => {
    const storedBooks = localStorage.getItem('studio-books');
    if (storedBooks) {
      try {
        const books: StudioBook[] = JSON.parse(storedBooks);
        const foundBook = books.find((b) => b.id === bookId);
        if (foundBook) {
          // Migrate old books to new unit structure
          const migratedBook = migrateBookToUnits(foundBook);

          // Save migration if needed
          if (migratedBook !== foundBook) {
            const updatedBooks = books.map((b) =>
              b.id === bookId ? migratedBook : b
            );
            localStorage.setItem('studio-books', JSON.stringify(updatedBooks));
          }

          setBook(migratedBook);

          // Select first unit
          if (migratedBook.units.length > 0) {
            setSelectedUnitId(migratedBook.units[0].id);
            // Select first page of first unit if exists
            if (migratedBook.units[0].pages.length > 0) {
              setSelectedPageId(migratedBook.units[0].pages[0].id);
            }
          }
        } else {
          router.push('/admin/studio');
        }
      } catch {
        router.push('/admin/studio');
      }
    }
    setLoading(false);
  }, [bookId, router]);

  // Save book to localStorage
  const saveBook = useCallback(
    (updatedBook: StudioBook) => {
      setSaving(true);
      const storedBooks = localStorage.getItem('studio-books');
      let books: StudioBook[] = storedBooks ? JSON.parse(storedBooks) : [];
      books = books.map((b) => (b.id === updatedBook.id ? updatedBook : b));
      localStorage.setItem('studio-books', JSON.stringify(books));
      setBook(updatedBook);
      setTimeout(() => setSaving(false), 300);
    },
    []
  );

  // Get current unit
  const selectedUnit = book?.units.find((u) => u.id === selectedUnitId);

  // Get current page (within selected unit)
  const selectedPage = selectedUnit?.pages.find((p) => p.id === selectedPageId);

  // ============================================================================
  // UNIT OPERATIONS
  // ============================================================================

  const handleAddUnit = () => {
    if (!book) return;
    const newUnit = createEmptyUnit(`Unit ${book.units.length + 1}`, book.units.length);
    const updatedBook = {
      ...book,
      units: [...book.units, newUnit],
      updatedAt: new Date().toISOString(),
    };
    saveBook(updatedBook);
    setSelectedUnitId(newUnit.id);
    setSelectedPageId(null);
  };

  const handleDeleteUnit = (unitId: string) => {
    if (!book) return;
    if (book.units.length <= 1) {
      alert('Cannot delete the last unit. A book must have at least one unit.');
      return;
    }
    if (!confirm('Delete this unit and all its pages?')) return;

    const unitIndex = book.units.findIndex((u) => u.id === unitId);
    const updatedUnits = book.units.filter((u) => u.id !== unitId);

    // Reorder remaining units
    updatedUnits.forEach((u, i) => {
      u.order = i;
    });

    const updatedBook = {
      ...book,
      units: updatedUnits,
      updatedAt: new Date().toISOString(),
    };
    saveBook(updatedBook);

    // Select next unit
    if (selectedUnitId === unitId) {
      if (updatedUnits.length > 0) {
        const newIndex = Math.min(unitIndex, updatedUnits.length - 1);
        setSelectedUnitId(updatedUnits[newIndex].id);
        setSelectedPageId(updatedUnits[newIndex].pages[0]?.id || null);
      }
    }
  };

  const handleRenameUnit = (unitId: string) => {
    if (!book || !editingUnitTitle.trim()) return;
    const updatedBook = {
      ...book,
      units: book.units.map((u) =>
        u.id === unitId ? { ...u, title: editingUnitTitle.trim() } : u
      ),
      updatedAt: new Date().toISOString(),
    };
    saveBook(updatedBook);
    setEditingUnitId(null);
    setEditingUnitTitle('');
  };

  const startEditingUnit = (unit: StudioUnit) => {
    setEditingUnitId(unit.id);
    setEditingUnitTitle(unit.title);
  };

  const handleQuickUnit = (title: string, pages: StudioPage[]) => {
    if (!book) return;

    const newUnit: StudioUnit = {
      id: generateId(),
      title,
      order: book.units.length,
      pages,
    };

    const updatedBook = {
      ...book,
      units: [...book.units, newUnit],
      updatedAt: new Date().toISOString(),
    };
    saveBook(updatedBook);
    setSelectedUnitId(newUnit.id);
    setSelectedPageId(pages[0]?.id || null);
    setShowQuickUnit(false);
  };

  // ============================================================================
  // PAGE OPERATIONS (within selected unit)
  // ============================================================================

  const handleAddPage = (type: PageType) => {
    if (!book || !selectedUnit) return;
    const newPage = createEmptyPage(type, selectedUnit.pages.length);

    const updatedBook = {
      ...book,
      units: book.units.map((u) =>
        u.id === selectedUnitId
          ? { ...u, pages: [...u.pages, newPage] }
          : u
      ),
      updatedAt: new Date().toISOString(),
    };
    saveBook(updatedBook);
    setSelectedPageId(newPage.id);
    setShowAddModal(false);
  };

  const handleUpdatePage = (updatedPage: StudioPage) => {
    if (!book || !selectedUnitId) return;
    const updatedBook = {
      ...book,
      units: book.units.map((u) =>
        u.id === selectedUnitId
          ? {
              ...u,
              pages: u.pages.map((p) => (p.id === updatedPage.id ? updatedPage : p)),
            }
          : u
      ),
      updatedAt: new Date().toISOString(),
    };
    saveBook(updatedBook);
  };

  const handleDeletePage = (pageId: string) => {
    if (!book || !selectedUnit) return;
    if (!confirm('Delete this page?')) return;

    const pageIndex = selectedUnit.pages.findIndex((p) => p.id === pageId);
    const updatedPages = selectedUnit.pages.filter((p) => p.id !== pageId);

    // Reorder remaining pages
    updatedPages.forEach((p, i) => {
      p.order = i;
    });

    const updatedBook = {
      ...book,
      units: book.units.map((u) =>
        u.id === selectedUnitId ? { ...u, pages: updatedPages } : u
      ),
      updatedAt: new Date().toISOString(),
    };
    saveBook(updatedBook);

    // Select next page or previous or none
    if (selectedPageId === pageId) {
      if (updatedPages.length === 0) {
        setSelectedPageId(null);
      } else if (pageIndex < updatedPages.length) {
        setSelectedPageId(updatedPages[pageIndex].id);
      } else {
        setSelectedPageId(updatedPages[updatedPages.length - 1].id);
      }
    }
  };

  const handleMovePage = (pageId: string, direction: 'up' | 'down') => {
    if (!book || !selectedUnit) return;
    const pageIndex = selectedUnit.pages.findIndex((p) => p.id === pageId);
    if (pageIndex === -1) return;

    const newIndex = direction === 'up' ? pageIndex - 1 : pageIndex + 1;
    if (newIndex < 0 || newIndex >= selectedUnit.pages.length) return;

    const newPages = [...selectedUnit.pages];
    [newPages[pageIndex], newPages[newIndex]] = [
      newPages[newIndex],
      newPages[pageIndex],
    ];

    // Update order numbers
    newPages.forEach((p, i) => {
      p.order = i;
    });

    const updatedBook = {
      ...book,
      units: book.units.map((u) =>
        u.id === selectedUnitId ? { ...u, pages: newPages } : u
      ),
      updatedAt: new Date().toISOString(),
    };
    saveBook(updatedBook);
  };

  // ============================================================================
  // BOOK OPERATIONS
  // ============================================================================

  const handleExportPDF = () => {
    setShowPreview(true);
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const handleUpdateSettings = (
    key: keyof StudioBook['settings'],
    value: string
  ) => {
    if (!book) return;
    const updatedBook = {
      ...book,
      settings: { ...book.settings, [key]: value },
      updatedAt: new Date().toISOString(),
    };
    saveBook(updatedBook);
  };

  const handleUpdateTitle = (title: string) => {
    if (!book) return;
    const updatedBook = {
      ...book,
      title,
      updatedAt: new Date().toISOString(),
    };
    saveBook(updatedBook);
  };

  // Get total page count across all units
  const totalPageCount = book?.units.reduce((sum, u) => sum + u.pages.length, 0) || 0;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Book not found</p>
      </div>
    );
  }

  // Preview mode
  if (showPreview) {
    return (
      <BookPreview
        book={book}
        onClose={() => setShowPreview(false)}
        onExport={handleExportPDF}
      />
    );
  }

  return (
    <div className="flex h-screen flex-col bg-gray-100">
      {/* Header */}
      <header className="flex items-center justify-between border-b bg-white px-4 py-3 print:hidden">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/admin/studio')}
            className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <input
            type="text"
            value={book.title}
            onChange={(e) => handleUpdateTitle(e.target.value)}
            className="text-lg font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded px-2 py-1"
          />
          {saving && (
            <span className="flex items-center gap-1 text-sm text-gray-400">
              <Save className="h-4 w-4" />
              Saving...
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-100"
          >
            <Settings className="h-4 w-4" />
            Settings
          </button>
          <button
            onClick={() => setShowPreview(true)}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-100"
          >
            <Eye className="h-4 w-4" />
            Preview
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
          >
            <Download className="h-4 w-4" />
            Export PDF
          </button>
        </div>
      </header>

      {/* Settings Panel */}
      {showSettings && (
        <div className="border-b bg-white px-4 py-3 print:hidden">
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <label className="text-xs font-medium text-gray-500">
                Page Size
              </label>
              <select
                value={book.settings.pageSize}
                onChange={(e) =>
                  handleUpdateSettings('pageSize', e.target.value)
                }
                className="mt-1 block rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              >
                {Object.entries(PAGE_SIZE_DIMENSIONS).map(([key, val]) => (
                  <option key={key} value={key}>
                    {val.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-xs font-medium text-gray-500">
                AI Style Prompt (sticky)
              </label>
              <input
                type="text"
                value={book.settings.stylePrompt}
                onChange={(e) =>
                  handleUpdateSettings('stylePrompt', e.target.value)
                }
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                placeholder="white background, photo shoot studio pro, ultra realistic"
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden print:hidden">
        {/* Left Sidebar - Units and Pages */}
        <aside className="w-64 flex-shrink-0 overflow-y-auto border-r bg-white">
          {/* Units Section */}
          <div className="border-b p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Units
              </h2>
              <span className="text-xs text-gray-400">{book.units.length}</span>
            </div>

            <div className="space-y-1">
              {book.units.map((unit) => (
                <div
                  key={unit.id}
                  className={`group flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer transition-colors ${
                    selectedUnitId === unit.id
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                  onClick={() => {
                    setSelectedUnitId(unit.id);
                    // Select first page of this unit
                    setSelectedPageId(unit.pages[0]?.id || null);
                  }}
                >
                  <FolderOpen className={`h-4 w-4 flex-shrink-0 ${
                    selectedUnitId === unit.id ? 'text-emerald-600' : 'text-gray-400'
                  }`} />

                  {editingUnitId === unit.id ? (
                    <div className="flex flex-1 items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editingUnitTitle}
                        onChange={(e) => setEditingUnitTitle(e.target.value)}
                        className="flex-1 rounded border px-1 py-0.5 text-sm focus:border-emerald-500 focus:outline-none"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRenameUnit(unit.id);
                          if (e.key === 'Escape') setEditingUnitId(null);
                        }}
                      />
                      <button
                        onClick={() => handleRenameUnit(unit.id)}
                        className="p-0.5 text-emerald-600 hover:text-emerald-700"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingUnitId(null)}
                        className="p-0.5 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="flex-1 truncate text-sm font-medium">
                        {unit.title}
                      </span>
                      <span className="text-xs text-gray-400">
                        {unit.pages.length}
                      </span>
                      <div className="hidden group-hover:flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => startEditingUnit(unit)}
                          className="p-0.5 text-gray-400 hover:text-gray-600"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteUnit(unit.id)}
                          className="p-0.5 text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                      <ChevronRight className={`h-4 w-4 transition-transform ${
                        selectedUnitId === unit.id ? 'rotate-90 text-emerald-600' : 'text-gray-300'
                      }`} />
                    </>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-2 flex gap-2">
              <button
                onClick={handleAddUnit}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-300 py-2 text-xs font-medium text-gray-500 transition-colors hover:border-emerald-500 hover:text-emerald-600"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Unit
              </button>
              <button
                onClick={() => setShowQuickUnit(true)}
                className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-yellow-400 to-orange-500 px-3 py-2 text-xs font-medium text-white shadow-sm transition-all hover:shadow-md"
              >
                <Zap className="h-3.5 w-3.5" />
                Quick
              </button>
            </div>
          </div>

          {/* Pages Section (for selected unit) */}
          <div className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Pages {selectedUnit && `(${selectedUnit.title})`}
              </h2>
              <span className="text-xs text-gray-400">
                {selectedUnit?.pages.length || 0}
              </span>
            </div>

            {selectedUnit ? (
              <>
                <div className="space-y-2">
                  {selectedUnit.pages.map((page, index) => (
                    <PageThumbnail
                      key={page.id}
                      page={page}
                      index={index}
                      isSelected={selectedPageId === page.id}
                      onSelect={() => setSelectedPageId(page.id)}
                      onDelete={() => handleDeletePage(page.id)}
                      onMoveUp={() => handleMovePage(page.id, 'up')}
                      onMoveDown={() => handleMovePage(page.id, 'down')}
                      canMoveUp={index > 0}
                      canMoveDown={index < selectedUnit.pages.length - 1}
                    />
                  ))}
                </div>

                <button
                  onClick={() => setShowAddModal(true)}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 py-3 text-sm font-medium text-gray-500 transition-colors hover:border-emerald-500 hover:text-emerald-600"
                >
                  <Plus className="h-4 w-4" />
                  Add Page
                </button>
              </>
            ) : (
              <p className="text-sm text-gray-400">Select a unit first</p>
            )}
          </div>

          {/* Stats footer */}
          <div className="mt-auto border-t p-4">
            <p className="text-xs text-gray-400 text-center">
              {book.units.length} units • {totalPageCount} pages
            </p>
          </div>
        </aside>

        {/* Right Panel - Page Editor */}
        <main className="flex-1 overflow-y-auto p-6">
          {selectedPage ? (
            <PageEditor
              page={selectedPage}
              stylePrompt={book.settings.stylePrompt}
              onUpdate={handleUpdatePage}
              onStylePromptSave={(newStylePrompt) => handleUpdateSettings('stylePrompt', newStylePrompt)}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-gray-400">
              <Plus className="h-16 w-16" />
              <p className="mt-4 text-lg">No page selected</p>
              {selectedUnit ? (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
                >
                  Add your first page to {selectedUnit.title}
                </button>
              ) : (
                <p className="mt-2 text-sm">Select a unit from the sidebar</p>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Add Page Modal */}
      {showAddModal && (
        <AddPageModal
          onSelect={handleAddPage}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {/* Quick Unit Modal */}
      {showQuickUnit && (
        <QuickUnitModal
          onCreateUnit={handleQuickUnit}
          onClose={() => setShowQuickUnit(false)}
        />
      )}
    </div>
  );
}
