'use client';

import Link from 'next/link';
import { getStorageUrl } from '@/lib/utils';
import type { ConversationCardWithLines } from '@/lib/types/conversation';

interface ConversationsSectionProps {
  conversations: ConversationCardWithLines[];
}

export function ConversationsSection({ conversations }: ConversationsSectionProps) {
  if (conversations.length === 0) {
    return null;
  }

  return (
    <section id="conversations-section" className="mt-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span>💬</span>
            Conversations
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            Learn Vietnamese through real-life dialogues
          </p>
        </div>
        <Link
          href="/conversations"
          className="text-amber-600 hover:text-amber-700 font-medium text-sm"
        >
          View all →
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {conversations.slice(0, 6).map((conv) => (
          <Link
            key={conv.id}
            href={`/conversation/${conv.slug}`}
            className="group bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-all"
          >
            {/* Scene Image */}
            <div className="relative h-32 overflow-hidden">
              <img
                src={getStorageUrl('cards-images', conv.scene_image_path)}
                alt={conv.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3">
                <h3 className="text-white font-bold truncate">
                  {conv.title}
                </h3>
                {conv.title_vi && (
                  <p className="text-white/80 text-sm truncate">
                    {conv.title_vi}
                  </p>
                )}
              </div>
              {/* Line count badge */}
              <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 text-white text-xs rounded-full backdrop-blur-sm">
                💬 {conv.lines?.length || 0}
              </div>
            </div>

            {/* First line preview */}
            {conv.lines?.[0] && (
              <div className="p-3">
                <p className="text-sm text-gray-800 font-medium truncate">
                  {conv.lines[0].vietnamese}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {conv.lines[0].english}
                </p>
              </div>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
