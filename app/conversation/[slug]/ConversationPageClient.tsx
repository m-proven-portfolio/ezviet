'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  BarChart3,
  MessageCircle,
  Sparkles,
  Eye,
  ChevronDown,
  ChevronUp,
  ArrowRight,
} from 'lucide-react';
import { ConversationCard } from '@/components/ConversationCard';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { ConversationCardWithLines } from '@/lib/types/conversation';

interface ConversationPageClientProps {
  conversation: ConversationCardWithLines;
}

export function ConversationPageClient({ conversation }: ConversationPageClientProps) {
  const [showAllLines, setShowAllLines] = useState(false);

  return (
    <main className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Navigation - Clean and minimal */}
        <nav className="flex items-center justify-between mb-8">
          <Link
            href="/"
            className="
              inline-flex items-center gap-2
              text-sm text-neutral-600
              hover:text-neutral-900
              transition-colors duration-200
              group
            "
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            <span>Back to Cards</span>
          </Link>

          {conversation.category && (
            <Badge variant="jade" size="sm">
              {conversation.category.name}
            </Badge>
          )}
        </nav>

        {/* Conversation Card */}
        <ConversationCard
          conversation={conversation}
          onSwipeLeft={() => window.history.back()}
          onSwipeRight={() => window.history.back()}
        />

        {/* Metadata - Collapsed into a single elegant line */}
        <div className="mt-6 flex items-center justify-center gap-4 text-sm text-neutral-500">
          <span className="flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5" />
            Level {conversation.difficulty}
          </span>
          <span className="w-1 h-1 rounded-full bg-neutral-300" />
          <span className="flex items-center gap-1.5">
            <MessageCircle className="w-3.5 h-3.5" />
            {conversation.lines?.length || 0} lines
          </span>
          {conversation.generated_by_ai && (
            <>
              <span className="w-1 h-1 rounded-full bg-neutral-300" />
              <span className="flex items-center gap-1.5 text-jade-600">
                <Sparkles className="w-3.5 h-3.5" />
                AI
              </span>
            </>
          )}
        </div>

        {/* Expandable Full Script - Clean accordion style */}
        <Card padding="none" className="mt-6 overflow-hidden">
          <button
            onClick={() => setShowAllLines(!showAllLines)}
            className="
              w-full px-5 py-4
              flex items-center justify-between
              text-left
              hover:bg-neutral-50
              transition-colors duration-200
            "
          >
            <span className="font-medium text-neutral-700">
              Full Script
            </span>
            <div className="flex items-center gap-2 text-neutral-500">
              <span className="text-sm">
                {showAllLines ? 'Hide' : 'Show'}
              </span>
              {showAllLines ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </div>
          </button>

          {/* Animated content area */}
          <div
            className={`
              grid transition-all duration-300 ease-out
              ${showAllLines ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}
            `}
          >
            <div className="overflow-hidden">
              <div className="px-5 pb-5 space-y-5 border-t border-(--border-subtle)">
                {conversation.lines?.map((line) => (
                  <div key={line.id} className="pt-4 first:pt-5">
                    {/* Speaker */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-neutral-800">
                        {line.speaker}
                      </span>
                      {line.speaker_vi && (
                        <span className="text-xs text-neutral-400">
                          ({line.speaker_vi})
                        </span>
                      )}
                    </div>

                    {/* Vietnamese */}
                    <p className="text-neutral-900 font-medium leading-relaxed">
                      {line.vietnamese}
                    </p>

                    {/* Romanization */}
                    {line.romanization && (
                      <p className="text-sm text-neutral-500 italic mt-1">
                        /{line.romanization}/
                      </p>
                    )}

                    {/* English */}
                    <p className="text-sm text-neutral-600 mt-1.5">
                      {line.english}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* View count - Subtle footer info */}
        {(conversation.view_count ?? 0) > 0 && (
          <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-neutral-400">
            <Eye className="w-3 h-3" />
            <span>{conversation.view_count?.toLocaleString()} views</span>
          </div>
        )}

        {/* Primary CTA */}
        <div className="mt-8 text-center">
          <Link href="/">
            <Button
              size="lg"
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="px-8"
            >
              Practice More Cards
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
