'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getStorageUrl } from '@/lib/utils';
import type { ConversationCardWithLines } from '@/lib/types/conversation';

export default function ConversationsAdminPage() {
  const [conversations, setConversations] = useState<ConversationCardWithLines[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchConversations();
  }, []);

  async function fetchConversations() {
    try {
      const res = await fetch('/api/conversations?limit=50');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setConversations(data.conversations || []);
    } catch (err) {
      setError('Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-48" />
            <div className="h-64 bg-gray-200 rounded" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/admin" className="text-gray-600 hover:text-gray-900 text-sm">
              ← Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mt-4 flex items-center gap-3">
              <span className="text-4xl">💬</span>
              Conversation Flashcards
            </h1>
            <p className="text-gray-600 mt-1">
              Manage interactive Vietnamese conversations
            </p>
          </div>

          <Link
            href="/admin/conversations/new"
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            <span>✨</span>
            Create New
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {conversations.length === 0 ? (
          /* Empty state */
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <span className="text-6xl block mb-4">💬</span>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              No conversations yet
            </h2>
            <p className="text-gray-600 mb-6">
              Create your first interactive conversation flashcard!
            </p>
            <Link
              href="/admin/conversations/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-colors"
            >
              <span>✨</span>
              Create Conversation
            </Link>
          </div>
        ) : (
          /* Grid of conversations */
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="relative h-32">
                  <img
                    src={getStorageUrl('cards-images', conv.scene_image_path)}
                    alt={conv.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <div className="backdrop-blur-md bg-black/40 rounded-lg px-3 py-2">
                      <h3 className="text-white font-bold text-lg truncate drop-shadow-sm">
                        {conv.title}
                      </h3>
                      {conv.title_vi && (
                        <p className="text-white/90 text-sm truncate drop-shadow-sm">
                          {conv.title_vi}
                        </p>
                      )}
                    </div>
                  </div>
                  {!conv.is_published && (
                    <div className="absolute top-2 right-2 px-2 py-1 bg-gray-800/80 text-white text-xs rounded">
                      Draft
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                    <span>💬 {conv.lines?.length || 0} lines</span>
                    <span>•</span>
                    <span>📊 Level {conv.difficulty}</span>
                    {conv.generated_by_ai && (
                      <>
                        <span>•</span>
                        <span className="text-purple-600">✨ AI</span>
                      </>
                    )}
                  </div>

                  {/* Preview first line */}
                  {conv.lines?.[0] && (
                    <div className="bg-gray-50 rounded-lg p-3 text-sm">
                      <p className="text-gray-600 text-xs mb-1">
                        {conv.lines[0].speaker}:
                      </p>
                      <p className="text-gray-800 font-medium truncate">
                        {conv.lines[0].vietnamese}
                      </p>
                    </div>
                  )}

                  <div className="mt-4 flex gap-2">
                    <Link
                      href={`/conversation/${conv.slug}`}
                      className="flex-1 py-2 text-center bg-emerald-100 text-emerald-700 rounded-lg font-medium hover:bg-emerald-200 transition-colors"
                    >
                      View
                    </Link>
                    <Link
                      href={`/admin/conversations/${conv.id}/edit`}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
