import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Vendor,
  VendorItem,
  NegotiationState,
  NegotiationPhrase,
  MarketProgress,
  ConversationMessage,
  NegotiationPhase,
} from '@/lib/market/types';

/**
 * Street Market Simulator Store
 *
 * Manages game state with localStorage persistence.
 * Handles negotiation logic, vendor responses, and player progress.
 */

/** Round price to nearest 10,000 VND for cleaner negotiation */
function roundToNearest10k(price: number): number {
  return Math.round(price / 10000) * 10000;
}

interface MarketState {
  // Current game state
  currentVendor: Vendor | null;
  currentItem: VendorItem | null;
  negotiation: NegotiationState | null;
  progress: MarketProgress;

  // Actions
  selectVendor: (vendor: Vendor) => void;
  selectItem: (item: VendorItem) => void;
  usePhrase: (phrase: NegotiationPhrase) => void;
  makeOffer: (amount: number) => void;
  walkAway: () => void;
  acceptDeal: () => void;
  returnToVendor: () => void;
  resetNegotiation: () => void;
  exitMarket: () => void;
}

const initialProgress: MarketProgress = {
  purchaseCount: 0,
  totalSaved: 0,
  phrasesUsed: [],
  vendorsVisited: [],
  reputation: 0,
  achievements: [],
};

/** Generate a unique message ID */
function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

/** Create a conversation message */
function createMessage(
  sender: 'player' | 'vendor',
  text: string,
  extra?: Partial<ConversationMessage>
): ConversationMessage {
  return {
    id: generateId(),
    sender,
    text,
    timestamp: Date.now(),
    ...extra,
  };
}

/** Calculate vendor's response to a phrase */
function calculatePhraseResponse(
  negotiation: NegotiationState,
  phrase: NegotiationPhrase,
  vendor: Vendor
): { newPrice: number; newMood: number; response: string } {
  const { currentPrice, vendorMood } = negotiation;
  const { personality } = vendor;

  // Calculate price change based on flexibility and phrase impact
  const priceReduction = currentPrice * phrase.priceImpact * personality.flexibility;
  const floorPrice = vendor.items.find((i) => i.id === negotiation.itemId)?.floorPrice ?? currentPrice * 0.5;
  const newPrice = Math.max(floorPrice, roundToNearest10k(currentPrice + priceReduction));

  // Calculate mood change
  const newMood = Math.max(0, Math.min(1, vendorMood + phrase.moodImpact));

  // Generate vendor response based on effect
  const responses = getVendorResponses(phrase.effect, newMood, vendor);
  const response = responses[Math.floor(Math.random() * responses.length)];

  return { newPrice, newMood, response };
}

/** Get vendor response options based on phrase effect and mood */
function getVendorResponses(
  effect: NegotiationPhrase['effect'],
  mood: number,
  vendor: Vendor
): string[] {
  const isHappy = mood > 0.6;
  const isNeutral = mood >= 0.3 && mood <= 0.6;

  switch (effect) {
    case 'price_reduce':
      if (isHappy) return ['Được rồi, bớt cho bạn chút!', 'OK, giảm chút cho bạn!'];
      if (isNeutral) return ['Hmm... được, giảm chút.', 'Thôi được, bớt đây.'];
      return ['Giảm nhiều lắm rồi!', 'Không được nữa đâu!'];

    case 'mood_improve':
      return ['Cảm ơn bạn!', 'Bạn dễ thương quá!', 'Vui ghê!'];

    case 'mood_worsen':
      return ['Ơ...', 'Sao vậy?', 'Thôi, bạn xem lại đi.'];

    case 'info_reveal':
      return [
        `${vendor.backstory?.slice(0, 50) ?? 'Hàng tốt lắm đó!'}...`,
        'Để tôi kể cho bạn nghe...',
      ];

    case 'bonus_item':
      if (isHappy) return ['Được, tặng bạn thêm cái này!', 'OK, cho bạn thêm chút!'];
      return ['Không có đâu!', 'Mua nhiều thì có!'];

    case 'walk_away_trigger':
      return ['Ê! Đợi đã!', 'Khoan! Bạn ơi!', 'Quay lại đi!'];

    case 'deal_closer':
      return ['OK! Deal!', 'Được rồi!', 'Cảm ơn bạn nhiều!'];

    default:
      return vendor.catchphrases;
  }
}

/** Calculate vendor's counter-offer response */
function calculateOfferResponse(
  offer: number,
  negotiation: NegotiationState,
  vendor: Vendor
): { accepted: boolean; counterOffer: number; response: string; newMood: number } {
  const item = vendor.items.find((i) => i.id === negotiation.itemId);
  if (!item) {
    return {
      accepted: false,
      counterOffer: negotiation.currentPrice,
      response: 'Hmm?',
      newMood: negotiation.vendorMood,
    };
  }

  const { floorPrice, basePrice } = item;
  const { personality } = vendor;
  const { vendorMood, offerCount } = negotiation;

  // Is the offer acceptable?
  const acceptablePrice = floorPrice + (basePrice - floorPrice) * (1 - personality.flexibility) * 0.5;
  const isAcceptable = offer >= acceptablePrice;

  // Mood change based on offer reasonableness
  const offerRatio = offer / negotiation.currentPrice;
  let moodChange = 0;
  if (offerRatio < 0.5) moodChange = -0.2; // Insulting offer
  else if (offerRatio < 0.7) moodChange = -0.1;
  else if (offerRatio >= 0.9) moodChange = 0.1;

  const newMood = Math.max(0, Math.min(1, vendorMood + moodChange));

  if (isAcceptable) {
    return {
      accepted: true,
      counterOffer: offer,
      response: newMood > 0.5 ? 'Được rồi! OK!' : 'Thôi được... lấy đi.',
      newMood,
    };
  }

  // Calculate counter-offer
  const movement = (negotiation.currentPrice - offer) * 0.3 * personality.flexibility;
  const counterOffer = Math.max(floorPrice, roundToNearest10k(negotiation.currentPrice - movement));

  // Patience check
  const isPatient = offerCount < personality.patience;

  let response: string;
  if (!isPatient) {
    response = 'Giá này là cuối cùng rồi!';
  } else if (newMood < 0.3) {
    response = 'Bạn đùa à? ' + counterOffer.toLocaleString() + 'đ thôi!';
  } else {
    response = counterOffer.toLocaleString() + 'đ được không?';
  }

  return { accepted: false, counterOffer, response, newMood };
}

export const useMarketStore = create<MarketState>()(
  persist(
    (set, get) => ({
      currentVendor: null,
      currentItem: null,
      negotiation: null,
      progress: initialProgress,

      selectVendor: (vendor) => {
        const { progress } = get();

        // Track visited vendors
        const vendorsVisited = progress.vendorsVisited.includes(vendor.id)
          ? progress.vendorsVisited
          : [...progress.vendorsVisited, vendor.id];

        set({
          currentVendor: vendor,
          currentItem: null,
          negotiation: null,
          progress: { ...progress, vendorsVisited },
        });
      },

      selectItem: (item) => {
        const { currentVendor } = get();
        if (!currentVendor) return;

        // Start negotiation
        const startingPrice = item.basePrice;
        const negotiation: NegotiationState = {
          vendorId: currentVendor.id,
          itemId: item.id,
          currentPrice: startingPrice,
          startingPrice,
          vendorMood: currentVendor.personality.baseMood,
          offerCount: 0,
          hasWalkedAway: false,
          phase: 'negotiating',
          messages: [
            createMessage('vendor', currentVendor.greeting, { textVietnamese: currentVendor.greeting }),
            createMessage(
              'vendor',
              `${item.nameVietnamese}? ${startingPrice.toLocaleString()}đ cho bạn!`,
              { priceOffer: startingPrice }
            ),
          ],
        };

        set({ currentItem: item, negotiation });
      },

      usePhrase: (phrase) => {
        const { negotiation, currentVendor, progress } = get();
        if (!negotiation || !currentVendor) return;

        // Handle walk-away trigger
        if (phrase.effect === 'walk_away_trigger') {
          get().walkAway();
          return;
        }

        // Handle deal closer
        if (phrase.effect === 'deal_closer') {
          get().acceptDeal();
          return;
        }

        // Calculate response
        const { newPrice, newMood, response } = calculatePhraseResponse(
          negotiation,
          phrase,
          currentVendor
        );

        // Track phrase usage
        const phrasesUsed = progress.phrasesUsed.includes(phrase.id)
          ? progress.phrasesUsed
          : [...progress.phrasesUsed, phrase.id];

        // Add messages
        const messages: ConversationMessage[] = [
          ...negotiation.messages,
          createMessage('player', phrase.english, {
            textVietnamese: phrase.vietnamese,
            phraseId: phrase.id,
          }),
          createMessage('vendor', response, {
            priceOffer: newPrice !== negotiation.currentPrice ? newPrice : undefined,
          }),
        ];

        set({
          negotiation: {
            ...negotiation,
            currentPrice: newPrice,
            vendorMood: newMood,
            messages,
          },
          progress: { ...progress, phrasesUsed },
        });
      },

      makeOffer: (amount) => {
        const { negotiation, currentVendor } = get();
        if (!negotiation || !currentVendor) return;

        const { accepted, counterOffer, response, newMood } = calculateOfferResponse(
          amount,
          negotiation,
          currentVendor
        );

        const messages: ConversationMessage[] = [
          ...negotiation.messages,
          createMessage('player', `${amount.toLocaleString()}đ?`, { priceOffer: amount }),
          createMessage('vendor', response, {
            priceOffer: accepted ? amount : counterOffer,
          }),
        ];

        if (accepted) {
          set({
            negotiation: {
              ...negotiation,
              currentPrice: amount,
              vendorMood: newMood,
              phase: 'deal_made',
              messages,
            },
          });
          // Auto-complete the deal
          setTimeout(() => get().acceptDeal(), 500);
        } else {
          set({
            negotiation: {
              ...negotiation,
              currentPrice: counterOffer,
              vendorMood: newMood,
              offerCount: negotiation.offerCount + 1,
              messages,
            },
          });
        }
      },

      walkAway: () => {
        const { negotiation, currentVendor } = get();
        if (!negotiation || !currentVendor) return;

        // Vendor might call you back with a better offer
        const willCallback = currentVendor.personality.flexibility > 0.3 && negotiation.vendorMood > 0.2;

        if (willCallback) {
          const item = currentVendor.items.find((i) => i.id === negotiation.itemId);
          const floorPrice = item?.floorPrice ?? negotiation.currentPrice * 0.6;
          const newPrice = roundToNearest10k(
            negotiation.currentPrice - (negotiation.currentPrice - floorPrice) * 0.5
          );

          const messages: ConversationMessage[] = [
            ...negotiation.messages,
            createMessage('player', 'Thôi, tôi đi!', { textVietnamese: 'Thôi, tôi đi!' }),
            createMessage('vendor', `Ê! Đợi đã! ${newPrice.toLocaleString()}đ được không?`, {
              priceOffer: newPrice,
            }),
          ];

          set({
            negotiation: {
              ...negotiation,
              currentPrice: newPrice,
              hasWalkedAway: true,
              phase: 'vendor_callback',
              messages,
            },
          });
        } else {
          set({
            negotiation: {
              ...negotiation,
              hasWalkedAway: true,
              phase: 'deal_failed',
              messages: [
                ...negotiation.messages,
                createMessage('player', 'Thôi, tôi đi!'),
                createMessage('vendor', 'Tùy bạn thôi!'),
              ],
            },
          });
        }
      },

      returnToVendor: () => {
        const { negotiation } = get();
        if (!negotiation || negotiation.phase !== 'vendor_callback') return;

        set({
          negotiation: {
            ...negotiation,
            phase: 'negotiating',
            messages: [
              ...negotiation.messages,
              createMessage('player', 'OK, quay lại...'),
            ],
          },
        });
      },

      acceptDeal: () => {
        const { negotiation, currentItem, progress } = get();
        if (!negotiation || !currentItem) return;

        const saved = negotiation.startingPrice - negotiation.currentPrice;

        set({
          negotiation: {
            ...negotiation,
            phase: 'deal_made',
            messages: [
              ...negotiation.messages,
              createMessage('player', 'Được rồi!'),
              createMessage('vendor', 'Cảm ơn bạn! Hẹn gặp lại!'),
            ],
          },
          progress: {
            ...progress,
            purchaseCount: progress.purchaseCount + 1,
            totalSaved: progress.totalSaved + saved,
            reputation: Math.min(100, progress.reputation + Math.floor(saved / 10000)),
          },
        });
      },

      resetNegotiation: () => {
        set({
          currentItem: null,
          negotiation: null,
        });
      },

      exitMarket: () => {
        set({
          currentVendor: null,
          currentItem: null,
          negotiation: null,
        });
      },
    }),
    {
      name: 'ezviet-market-progress',
      partialize: (state) => ({ progress: state.progress }),
    }
  )
);
