'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, BookOpen, Loader2, Trash2, Edit } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { StudioBook } from '@/lib/studio/types';
import { createEmptyBook, getTotalPageCount } from '@/lib/studio/types';

export default function BookStudioPage() {
  const router = useRouter();
  const [books, setBooks] = useState<StudioBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newBookTitle, setNewBookTitle] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  // Track if initial load from localStorage is complete to avoid race condition
  const [hasInitialized, setHasInitialized] = useState(false);

  // Fetch books on mount
  useEffect(() => {
    async function fetchBooks() {
      const supabase = createClient();

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push('/');
        return;
      }
      setUserId(user.id);

      // Fetch studio books from localStorage for now (can migrate to DB later)
      const storedBooks = localStorage.getItem('studio-books');
      if (storedBooks) {
        try {
          setBooks(JSON.parse(storedBooks));
        } catch {
          setBooks([]);
        }
      }
      setLoading(false);
      setHasInitialized(true);
    }

    fetchBooks();
  }, [router]);

  // Save books to localStorage whenever they change
  // Only persist after initial load is complete to avoid race condition
  useEffect(() => {
    if (hasInitialized) {
      localStorage.setItem('studio-books', JSON.stringify(books));
    }
  }, [books, hasInitialized]);

  const handleCreateBook = async () => {
    if (!newBookTitle.trim() || !userId) return;

    setCreating(true);
    const newBook = createEmptyBook(newBookTitle.trim(), userId);
    setBooks((prev) => [...prev, newBook]);
    setShowCreateModal(false);
    setNewBookTitle('');
    setCreating(false);

    // Navigate to the new book editor
    router.push(`/admin/studio/${newBook.id}`);
  };

  const handleDeleteBook = (bookId: string) => {
    if (confirm('Are you sure you want to delete this book?')) {
      setBooks((prev) => prev.filter((b) => b.id !== bookId));
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-emerald-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Book Studio</h1>
              <p className="text-sm text-gray-500">
                Create beautiful Vietnamese learning books
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white transition-colors hover:bg-emerald-700"
          >
            <Plus className="h-5 w-5" />
            New Book
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl p-6">
        {books.length === 0 ? (
          // Empty State
          <div className="mt-20 text-center">
            <BookOpen className="mx-auto h-16 w-16 text-gray-300" />
            <h2 className="mt-4 text-xl font-semibold text-gray-700">
              No books yet
            </h2>
            <p className="mt-2 text-gray-500">
              Create your first book to get started
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 font-medium text-white transition-colors hover:bg-emerald-700"
            >
              <Plus className="h-5 w-5" />
              Create Book
            </button>
          </div>
        ) : (
          // Book Grid
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {books.map((book) => (
              <div
                key={book.id}
                className="group relative overflow-hidden rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                {/* Book Cover Preview */}
                <div className="flex h-40 items-center justify-center bg-gradient-to-br from-emerald-100 to-emerald-200">
                  {book.coverImage ? (
                    <img
                      src={book.coverImage}
                      alt={book.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <BookOpen className="h-16 w-16 text-emerald-400" />
                  )}
                </div>

                {/* Book Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900">{book.title}</h3>
                  {book.subtitle && (
                    <p className="mt-1 text-sm text-gray-500">{book.subtitle}</p>
                  )}
                  <p className="mt-2 text-xs text-gray-400">
                    {book.units?.length || 0} unit{(book.units?.length || 0) !== 1 ? 's' : ''}{' '}
                    &bull; {getTotalPageCount(book)} page{getTotalPageCount(book) !== 1 ? 's' : ''}{' '}
                    &bull; {book.settings.pageSize.toUpperCase()}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex border-t">
                  <button
                    onClick={() => router.push(`/admin/studio/${book.id}`)}
                    className="flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium text-emerald-600 transition-colors hover:bg-emerald-50"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </button>
                  <div className="w-px bg-gray-200" />
                  <button
                    onClick={() => handleDeleteBook(book.id)}
                    className="flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Book Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-gray-900">
              Create New Book
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Give your book a title to get started. You can change it later.
            </p>

            <input
              type="text"
              value={newBookTitle}
              onChange={(e) => setNewBookTitle(e.target.value)}
              placeholder="e.g., Unit 6: Fruits"
              className="mt-4 w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateBook();
                if (e.key === 'Escape') setShowCreateModal(false);
              }}
            />

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewBookTitle('');
                }}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateBook}
                disabled={!newBookTitle.trim() || creating}
                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Create Book
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
