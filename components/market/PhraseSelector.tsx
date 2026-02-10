'use client';

import { useState } from 'react';
import { Send, MessageCircle, TrendingDown, Heart, DoorOpen, Check, HelpCircle, Gift } from 'lucide-react';
import { NEGOTIATION_PHRASES, PHRASE_CATEGORIES } from '@/lib/market/phrases';
import type { NegotiationPhrase } from '@/lib/market/types';
import { AudioButton } from './AudioButton';

interface PhraseSelectorProps {
  onSelectPhrase: (phrase: NegotiationPhrase) => void;
  onMakeOffer: (amount: number) => void;
  currentPrice: number;
  disabled?: boolean;
}

type CategoryKey = keyof typeof PHRASE_CATEGORIES;

const CATEGORY_INFO: Record<CategoryKey, { label: string; icon: React.ReactNode; color: string }> = {
  price: { label: 'Price', icon: <TrendingDown className="h-4 w-4" />, color: 'text-blue-600' },
  rapport: { label: 'Rapport', icon: <Heart className="h-4 w-4" />, color: 'text-pink-600' },
  strategy: { label: 'Strategy', icon: <MessageCircle className="h-4 w-4" />, color: 'text-purple-600' },
  walkaway: { label: 'Walk Away', icon: <DoorOpen className="h-4 w-4" />, color: 'text-orange-600' },
  close: { label: 'Close Deal', icon: <Check className="h-4 w-4" />, color: 'text-emerald-600' },
  info: { label: 'Ask', icon: <HelpCircle className="h-4 w-4" />, color: 'text-cyan-600' },
  bonus: { label: 'Bonus', icon: <Gift className="h-4 w-4" />, color: 'text-amber-600' },
};

export function PhraseSelector({
  onSelectPhrase,
  onMakeOffer,
  currentPrice,
  disabled,
}: PhraseSelectorProps) {
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('price');
  const [offerAmount, setOfferAmount] = useState('');
  const [showOffer, setShowOffer] = useState(false);

  const categoryPhrases = PHRASE_CATEGORIES[activeCategory]
    .map((id) => NEGOTIATION_PHRASES.find((p) => p.id === id))
    .filter((p): p is NegotiationPhrase => p !== undefined);

  const handleMakeOffer = () => {
    const amount = parseInt(offerAmount.replace(/\D/g, ''), 10);
    if (amount > 0) {
      onMakeOffer(amount);
      setOfferAmount('');
      setShowOffer(false);
    }
  };

  // Round to nearest 10k VND for cleaner offers
  const roundTo10k = (n: number) => Math.round(n / 10000) * 10000;
  const suggestedOffers = [
    roundTo10k(currentPrice * 0.5),
    roundTo10k(currentPrice * 0.7),
    roundTo10k(currentPrice * 0.85),
  ];

  return (
    <div className="space-y-3">
      {/* Category tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {(Object.keys(PHRASE_CATEGORIES) as CategoryKey[]).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            disabled={disabled}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
              activeCategory === cat
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            } ${disabled ? 'opacity-50' : ''}`}
          >
            {CATEGORY_INFO[cat].icon}
            {CATEGORY_INFO[cat].label}
          </button>
        ))}
      </div>

      {/* Phrase buttons */}
      <div className="grid gap-2">
        {categoryPhrases.map((phrase) => (
          <button
            key={phrase.id}
            onClick={() => onSelectPhrase(phrase)}
            disabled={disabled}
            className={`rounded-xl border-2 border-gray-200 bg-white p-3 text-left transition-all hover:border-amber-300 hover:shadow-md ${
              disabled ? 'cursor-not-allowed opacity-50' : ''
            }`}
          >
            <div className="flex items-start gap-3">
              <AudioButton
                text={phrase.vietnamese}
                size="sm"
                variant="filled"
                className="mt-0.5 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">{phrase.vietnamese}</p>
                <p className="text-sm text-gray-500">{phrase.english}</p>
                <p className="text-xs text-gray-400 italic">{phrase.romanization}</p>
                {phrase.culturalTip && (
                  <p className="mt-1 text-xs text-amber-600">💡 {phrase.culturalTip}</p>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Custom offer section */}
      <div className="border-t pt-3">
        {!showOffer ? (
          <button
            onClick={() => setShowOffer(true)}
            disabled={disabled}
            className="w-full rounded-xl border-2 border-dashed border-gray-300 p-3 text-gray-500 transition-all hover:border-emerald-400 hover:text-emerald-600"
          >
            💰 Make a counter-offer...
          </button>
        ) : (
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={offerAmount}
                onChange={(e) => setOfferAmount(e.target.value)}
                placeholder="Enter amount (VND)"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                disabled={disabled}
              />
              <button
                onClick={handleMakeOffer}
                disabled={disabled || !offerAmount}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
            <div className="flex gap-2">
              {suggestedOffers.map((amount) => (
                <button
                  key={amount}
                  onClick={() => setOfferAmount(amount.toString())}
                  disabled={disabled}
                  className="flex-1 rounded-lg bg-gray-100 px-2 py-1 text-sm text-gray-700 hover:bg-gray-200"
                >
                  {amount.toLocaleString()}đ
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
