'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface CardType {
  id: string;
  name: string;
  description: string;
  icon: string;
  gradient: string;
  href: string;
  preview: React.ReactNode;
  badge?: string;
  disabled?: boolean;
}

const cardTypes: CardType[] = [
  {
    id: 'flashcard',
    name: 'Vocabulary Flashcard',
    description: 'Single word or phrase with image, audio, and translation. Perfect for building vocabulary.',
    icon: '📝',
    gradient: 'from-emerald-500 to-teal-600',
    href: '/admin/cards/new/flashcard',
    preview: (
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 h-full flex flex-col items-center justify-center">
        <div className="text-2xl font-bold text-gray-800 mb-1">chuối</div>
        <div className="text-sm text-gray-500 mb-3">/chwoy/</div>
        <div className="w-16 h-16 bg-white rounded-xl shadow-sm flex items-center justify-center text-3xl mb-3">
          🍌
        </div>
        <div className="text-gray-700">banana</div>
      </div>
    ),
  },
  {
    id: 'conversation',
    name: 'Conversation',
    description: 'Interactive dialogue with multiple speakers. Teaches phrases in real-world context.',
    icon: '💬',
    gradient: 'from-amber-500 to-orange-600',
    href: '/admin/conversations/new',
    preview: (
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 h-full flex flex-col justify-center gap-2">
        <div className="flex justify-start">
          <div className="bg-gray-200 rounded-2xl rounded-bl-sm px-3 py-2 max-w-[80%]">
            <div className="text-xs text-gray-500 mb-1">Customer</div>
            <div className="text-sm text-gray-800">Cho tôi một ly cà phê</div>
          </div>
        </div>
        <div className="flex justify-end">
          <div className="bg-amber-200 rounded-2xl rounded-br-sm px-3 py-2 max-w-[80%]">
            <div className="text-xs text-amber-700 mb-1">Barista</div>
            <div className="text-sm text-gray-800">Dạ, cà phê đen hay sữa?</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'picture-quiz',
    name: 'Picture Quiz',
    description: 'Label objects in an image. Great for visual learners and object vocabulary.',
    icon: '🖼️',
    gradient: 'from-purple-500 to-indigo-600',
    href: '/admin/cards/new/picture-quiz',
    badge: 'Coming Soon',
    disabled: true,
    preview: (
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4 h-full flex flex-col items-center justify-center relative">
        <div className="w-full h-20 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-lg mb-2 relative">
          <div className="absolute top-2 left-3 w-4 h-4 bg-purple-500 rounded-full border-2 border-white shadow text-[8px] text-white flex items-center justify-center">1</div>
          <div className="absolute top-6 right-4 w-4 h-4 bg-purple-500 rounded-full border-2 border-white shadow text-[8px] text-white flex items-center justify-center">2</div>
          <div className="absolute bottom-2 left-1/2 w-4 h-4 bg-purple-500 rounded-full border-2 border-white shadow text-[8px] text-white flex items-center justify-center">3</div>
        </div>
        <div className="text-xs text-gray-500">Tap to identify objects</div>
      </div>
    ),
  },
  {
    id: 'story',
    name: 'Story Card',
    description: 'Short illustrated stories with vocabulary highlights. Builds reading comprehension.',
    icon: '📖',
    gradient: 'from-rose-500 to-pink-600',
    href: '/admin/cards/new/story',
    badge: 'Coming Soon',
    disabled: true,
    preview: (
      <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl p-4 h-full flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-4xl">📚</div>
        </div>
        <div className="text-xs text-gray-600 leading-relaxed">
          <span className="bg-rose-200 px-1 rounded">Lan</span> đi chợ mua{' '}
          <span className="bg-rose-200 px-1 rounded">trái cây</span>...
        </div>
      </div>
    ),
  },
];

export default function NewCardTypeSelectorPage() {
  const router = useRouter();
  const [hoveredType, setHoveredType] = useState<string | null>(null);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <Link href="/admin" className="text-gray-500 hover:text-gray-700 text-sm inline-flex items-center gap-1 mb-4">
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Create New Card
          </h1>
          <p className="text-xl text-gray-600">
            What would you like to teach today?
          </p>
        </div>

        {/* Card Type Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {cardTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => !type.disabled && router.push(type.href)}
              onMouseEnter={() => setHoveredType(type.id)}
              onMouseLeave={() => setHoveredType(null)}
              disabled={type.disabled}
              className={`
                relative text-left rounded-2xl overflow-hidden transition-all duration-300
                ${type.disabled
                  ? 'opacity-60 cursor-not-allowed'
                  : 'hover:shadow-2xl hover:-translate-y-1 cursor-pointer'
                }
                ${hoveredType === type.id ? 'ring-4 ring-offset-2' : ''}
                bg-white shadow-lg
              `}
              style={{
                ['--tw-ring-color' as string]: type.disabled ? 'transparent' : undefined,
              }}
            >
              {/* Badge */}
              {type.badge && (
                <div className="absolute top-4 right-4 z-10">
                  <span className="px-3 py-1 bg-gray-900 text-white text-xs font-medium rounded-full">
                    {type.badge}
                  </span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row">
                {/* Left: Info */}
                <div className="flex-1 p-6">
                  {/* Icon & Name */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`
                      w-12 h-12 rounded-xl bg-gradient-to-br ${type.gradient}
                      flex items-center justify-center text-2xl shadow-lg
                      ${!type.disabled && hoveredType === type.id ? 'scale-110' : ''}
                      transition-transform duration-300
                    `}>
                      {type.icon}
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {type.name}
                    </h2>
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">
                    {type.description}
                  </p>

                  {/* CTA */}
                  {!type.disabled && (
                    <div className={`
                      inline-flex items-center gap-2 text-sm font-semibold
                      bg-gradient-to-r ${type.gradient} bg-clip-text text-transparent
                    `}>
                      Create {type.name}
                      <span className={`
                        transition-transform duration-300
                        ${hoveredType === type.id ? 'translate-x-1' : ''}
                      `}>
                        →
                      </span>
                    </div>
                  )}
                </div>

                {/* Right: Preview */}
                <div className="w-full sm:w-48 h-40 sm:h-auto p-3">
                  {type.preview}
                </div>
              </div>

              {/* Hover gradient overlay */}
              {!type.disabled && (
                <div className={`
                  absolute inset-0 bg-gradient-to-r ${type.gradient} opacity-0
                  transition-opacity duration-300 pointer-events-none
                  ${hoveredType === type.id ? 'opacity-[0.03]' : ''}
                `} />
              )}
            </button>
          ))}
        </div>

        {/* Quick tip */}
        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm">
            💡 <strong>Tip:</strong> Start with Vocabulary Flashcards to build a foundation,
            then add Conversations to teach phrases in context.
          </p>
        </div>

        {/* Stats teaser */}
        <div className="mt-8 grid grid-cols-3 gap-4 max-w-lg mx-auto">
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-600">~30s</div>
            <div className="text-xs text-gray-500">to create a card</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-600">AI</div>
            <div className="text-xs text-gray-500">auto-translation</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">TTS</div>
            <div className="text-xs text-gray-500">auto-audio</div>
          </div>
        </div>
      </div>
    </main>
  );
}
