/**
 * Street Market Simulator Types
 *
 * Core type definitions for the Vietnamese market haggling game.
 * Players learn negotiation phrases by using them in realistic scenarios.
 */

/** Effect that a phrase has on the negotiation */
export type PhraseEffect =
  | 'price_reduce'      // Vendor lowers price
  | 'price_increase'    // Vendor raises price (offended)
  | 'mood_improve'      // Vendor becomes friendlier
  | 'mood_worsen'       // Vendor becomes less patient
  | 'info_reveal'       // Vendor reveals item info/story
  | 'bonus_item'        // Vendor offers something extra
  | 'walk_away_trigger' // Triggers walk-away sequence
  | 'deal_closer';      // High chance of accepting offer

/** A Vietnamese phrase the player can use */
export interface NegotiationPhrase {
  id: string;
  vietnamese: string;
  english: string;
  romanization: string;
  effect: PhraseEffect;
  /** How much this affects price (negative = discount) */
  priceImpact: number;
  /** How much this affects vendor mood (-1 to 1) */
  moodImpact: number;
  /** Cultural note shown after using */
  culturalTip?: string;
  /** When this phrase is most effective */
  bestUsedWhen?: string;
}

/** Vendor personality traits that affect negotiation */
export interface VendorPersonality {
  /** How many failed attempts before they refuse (1-5) */
  patience: number;
  /** How much they're willing to discount (0.1-0.5 = 10-50%) */
  flexibility: number;
  /** How much they talk/share stories (0-1) */
  chattiness: number;
  /** Their base mood (0-1, affects initial friendliness) */
  baseMood: number;
}

/** An item a vendor sells */
export interface VendorItem {
  id: string;
  name: string;
  nameVietnamese: string;
  /** Base price in VND */
  basePrice: number;
  /** Lowest they'll actually go */
  floorPrice: number;
  /** Image URL or emoji */
  image: string;
  /** Item description */
  description?: string;
}

/** A vendor in the market */
export interface Vendor {
  id: string;
  name: string;
  /** Vietnamese honorific + name */
  displayName: string;
  /** What they sell */
  specialty: string;
  /** Avatar emoji or image */
  avatar: string;
  /** Greeting when player approaches */
  greeting: string;
  /** Personality traits */
  personality: VendorPersonality;
  /** Items they sell */
  items: VendorItem[];
  /** Cultural background/story */
  backstory?: string;
  /** Phrases they commonly use */
  catchphrases: string[];
}

/** Current state of a negotiation */
export interface NegotiationState {
  vendorId: string;
  itemId: string;
  /** Current offered price */
  currentPrice: number;
  /** Starting price vendor quoted */
  startingPrice: number;
  /** Vendor's current mood (0-1) */
  vendorMood: number;
  /** How many offers have been made */
  offerCount: number;
  /** Whether player has tried to walk away */
  hasWalkedAway: boolean;
  /** Conversation history */
  messages: ConversationMessage[];
  /** Current phase */
  phase: NegotiationPhase;
}

export type NegotiationPhase =
  | 'browsing'      // Looking at vendor's items
  | 'negotiating'   // Active haggling
  | 'walking_away'  // Player triggered walk-away
  | 'vendor_callback' // Vendor calling player back
  | 'deal_made'     // Successfully purchased
  | 'deal_failed';  // Vendor refused or player left

/** A message in the conversation */
export interface ConversationMessage {
  id: string;
  sender: 'player' | 'vendor';
  text: string;
  textVietnamese?: string;
  timestamp: number;
  /** If player used a phrase */
  phraseId?: string;
  /** If this was a price offer */
  priceOffer?: number;
}

/** Player's overall market progress */
export interface MarketProgress {
  /** Total successful purchases */
  purchaseCount: number;
  /** Total money saved through haggling */
  totalSaved: number;
  /** Phrases the player has used */
  phrasesUsed: string[];
  /** Vendors the player has interacted with */
  vendorsVisited: string[];
  /** Reputation score (affects initial prices) */
  reputation: number;
  /** Achievements unlocked */
  achievements: string[];
}

/** Market store state */
export interface MarketStore {
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
  resetNegotiation: () => void;
  exitMarket: () => void;
}
