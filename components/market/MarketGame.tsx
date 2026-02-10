'use client';

import { useState, useCallback } from 'react';
import { ArrowLeft, Trophy, Coins, Star, RotateCcw } from 'lucide-react';
import { useMarketStore } from '@/lib/stores/marketStore';
import { VENDORS } from '@/lib/market/vendors';
import type { Vendor, VendorItem, NegotiationState, NegotiationPhrase, MarketProgress } from '@/lib/market/types';
import { VendorCard, ItemCard } from './VendorCard';
import { VendorDialogue } from './VendorDialogue';
import { PhraseSelector } from './PhraseSelector';
import { PracticePrompt } from './PracticePrompt';

/**
 * Street Market Simulator - Main Game Component
 *
 * Flow: Market Overview → Select Vendor → Select Item → Negotiate → Complete
 */
export function MarketGame() {
  const {
    currentVendor,
    currentItem,
    negotiation,
    progress,
    selectVendor,
    selectItem,
    usePhrase,
    makeOffer,
    returnToVendor,
    resetNegotiation,
    exitMarket,
  } = useMarketStore();

  // Market overview - no vendor selected
  if (!currentVendor) {
    return <MarketOverview progress={progress} onSelectVendor={selectVendor} />;
  }

  // Vendor selected but no item - show vendor's items
  if (!currentItem || !negotiation) {
    return (
      <VendorView
        vendor={currentVendor}
        onSelectItem={selectItem}
        onBack={exitMarket}
      />
    );
  }

  // Active negotiation
  return (
    <NegotiationView
      vendor={currentVendor}
      item={currentItem}
      negotiation={negotiation}
      progress={progress}
      onUsePhrase={usePhrase}
      onMakeOffer={makeOffer}
      onReturnToVendor={returnToVendor}
      onReset={resetNegotiation}
      onExit={exitMarket}
    />
  );
}

/** Market entrance - shows all vendors */
function MarketOverview({
  progress,
  onSelectVendor,
}: {
  progress: MarketProgress;
  onSelectVendor: (vendor: Vendor) => void;
}) {
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">🏪 Chợ Bến Thành</h1>
        <p className="text-gray-600">Bến Thành Market - Practice your haggling!</p>
      </div>

      {/* Progress stats */}
      <div className="flex justify-center gap-4">
        <StatBadge icon={<Trophy className="h-4 w-4" />} value={progress.purchaseCount} label="Purchases" />
        <StatBadge
          icon={<Coins className="h-4 w-4" />}
          value={`${(progress.totalSaved / 1000).toFixed(0)}k`}
          label="Saved"
        />
        <StatBadge icon={<Star className="h-4 w-4" />} value={progress.reputation} label="Rep" />
      </div>

      {/* Vendor grid */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-gray-800">Choose a vendor:</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {VENDORS.map((vendor) => (
            <VendorCard
              key={vendor.id}
              vendor={vendor}
              onSelect={() => onSelectVendor(vendor)}
              isSelected={progress.vendorsVisited.includes(vendor.id)}
            />
          ))}
        </div>
      </div>

      {/* Cultural tip */}
      <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
        <p className="font-medium">💡 Tip: Vietnamese Market Etiquette</p>
        <p className="mt-1">
          Haggling is expected! Start by asking the price, then express surprise.
          Be friendly but firm. Walking away often gets you the best deal!
        </p>
      </div>
    </div>
  );
}

/** Vendor's stall - shows their items */
function VendorView({
  vendor,
  onSelectItem,
  onBack,
}: {
  vendor: Vendor;
  onSelectItem: (item: VendorItem) => void;
  onBack: () => void;
}) {
  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-5 w-5" />
        Back to market
      </button>

      {/* Vendor header */}
      <div className="flex items-center gap-4 rounded-xl bg-amber-50 p-4">
        <span className="text-5xl">{vendor.avatar}</span>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{vendor.displayName}</h1>
          <p className="text-amber-700">{vendor.specialty}</p>
          <p className="mt-1 text-sm text-gray-600 italic">"{vendor.greeting}"</p>
        </div>
      </div>

      {/* Items for sale */}
      <div>
        <h2 className="mb-3 font-semibold text-gray-800">What would you like to buy?</h2>
        <div className="space-y-2">
          {vendor.items.map((item) => (
            <ItemCard key={item.id} item={item} onSelect={() => onSelectItem(item)} />
          ))}
        </div>
      </div>

      {/* Vendor backstory */}
      {vendor.backstory && (
        <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
          <p className="font-medium text-gray-800">About {vendor.displayName}</p>
          <p className="mt-1">{vendor.backstory}</p>
        </div>
      )}
    </div>
  );
}

/** Active negotiation screen */
function NegotiationView({
  vendor,
  item,
  negotiation,
  progress,
  onUsePhrase,
  onMakeOffer,
  onReturnToVendor,
  onReset,
  onExit,
}: {
  vendor: Vendor;
  item: VendorItem;
  negotiation: NegotiationState;
  progress: MarketProgress;
  onUsePhrase: (phrase: NegotiationPhrase) => void;
  onMakeOffer: (amount: number) => void;
  onReturnToVendor: () => void;
  onReset: () => void;
  onExit: () => void;
}) {
  const isDone = negotiation.phase === 'deal_made' || negotiation.phase === 'deal_failed';
  const isWalkingAway = negotiation.phase === 'vendor_callback';
  const saved = negotiation.startingPrice - negotiation.currentPrice;

  // Practice prompt state
  const [practicePhrase, setPracticePhrase] = useState<NegotiationPhrase | null>(null);
  const [showPracticePrompt, setShowPracticePrompt] = useState(false);

  // Wrap phrase selection to show practice prompt after a delay
  const handleUsePhrase = useCallback(
    (phrase: NegotiationPhrase) => {
      onUsePhrase(phrase);

      // Show practice prompt after vendor responds (1.5s delay)
      // Don't show for walk-away or deal-closer phrases
      if (phrase.effect !== 'walk_away_trigger' && phrase.effect !== 'deal_closer') {
        setTimeout(() => {
          setPracticePhrase(phrase);
          setShowPracticePrompt(true);
        }, 1500);
      }
    },
    [onUsePhrase]
  );

  const handlePracticeComplete = useCallback((practiced: boolean) => {
    // Could track practice stats here in the future
    console.log('Practice completed:', practiced);
  }, []);

  const handleClosePractice = useCallback(() => {
    setShowPracticePrompt(false);
    setPracticePhrase(null);
  }, []);

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4">
      {/* Item being negotiated */}
      <div className="flex items-center gap-3 rounded-xl bg-white border border-gray-200 p-3">
        <span className="text-4xl">{item.image}</span>
        <div className="flex-1">
          <p className="font-semibold text-gray-900">{item.nameVietnamese}</p>
          <p className="text-sm text-gray-500">{item.name}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400 line-through">
            {item.basePrice.toLocaleString()}đ
          </p>
          <p className="text-lg font-bold text-emerald-600">
            {negotiation.currentPrice.toLocaleString()}đ
          </p>
          {saved > 0 && (
            <p className="text-xs text-emerald-500">
              -{((saved / item.basePrice) * 100).toFixed(0)}%
            </p>
          )}
        </div>
      </div>

      {/* Conversation */}
      <VendorDialogue
        messages={negotiation.messages}
        vendor={vendor}
        currentPrice={negotiation.currentPrice}
      />

      {/* Walk-away callback UI */}
      {isWalkingAway && (
        <div className="rounded-xl bg-orange-50 border-2 border-orange-200 p-4 text-center">
          <p className="font-medium text-orange-800">
            {vendor.displayName} is calling you back! 🗣️
          </p>
          <p className="text-sm text-orange-600 mt-1">
            New offer: {negotiation.currentPrice.toLocaleString()}đ
          </p>
          <div className="mt-3 flex justify-center gap-3">
            <button
              onClick={onReturnToVendor}
              className="rounded-lg bg-orange-500 px-4 py-2 text-white hover:bg-orange-600"
            >
              Go back
            </button>
            <button
              onClick={onExit}
              className="rounded-lg bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
            >
              Keep walking
            </button>
          </div>
        </div>
      )}

      {/* Deal complete UI */}
      {isDone && (
        <div
          className={`rounded-xl p-4 text-center ${
            negotiation.phase === 'deal_made'
              ? 'bg-emerald-50 border-2 border-emerald-200'
              : 'bg-gray-50 border-2 border-gray-200'
          }`}
        >
          {negotiation.phase === 'deal_made' ? (
            <>
              <p className="text-2xl">🎉</p>
              <p className="font-bold text-emerald-800">Deal Complete!</p>
              <p className="text-sm text-emerald-600">
                You saved {saved.toLocaleString()}đ ({((saved / item.basePrice) * 100).toFixed(0)}% off)
              </p>
            </>
          ) : (
            <>
              <p className="text-2xl">👋</p>
              <p className="font-bold text-gray-800">No Deal</p>
              <p className="text-sm text-gray-600">Maybe next time!</p>
            </>
          )}
          <div className="mt-3 flex justify-center gap-3">
            <button
              onClick={onReset}
              className="flex items-center gap-2 rounded-lg bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
            >
              <RotateCcw className="h-4 w-4" />
              Try again
            </button>
            <button
              onClick={onExit}
              className="rounded-lg bg-amber-500 px-4 py-2 text-white hover:bg-amber-600"
            >
              Back to market
            </button>
          </div>
        </div>
      )}

      {/* Phrase selector - only when actively negotiating */}
      {!isDone && !isWalkingAway && (
        <PhraseSelector
          onSelectPhrase={handleUsePhrase}
          onMakeOffer={onMakeOffer}
          currentPrice={negotiation.currentPrice}
          disabled={isDone}
        />
      )}

      {/* Phrases used tracker */}
      <div className="text-center text-xs text-gray-400">
        Phrases learned: {progress.phrasesUsed.length}/27
      </div>

      {/* Practice prompt overlay */}
      {showPracticePrompt && practicePhrase && (
        <PracticePrompt
          phrase={practicePhrase}
          onClose={handleClosePractice}
          onPracticeComplete={handlePracticeComplete}
        />
      )}
    </div>
  );
}

/** Small stat badge for progress display */
function StatBadge({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5">
      <span className="text-amber-600">{icon}</span>
      <span className="font-semibold text-gray-900">{value}</span>
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  );
}
