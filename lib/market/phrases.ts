import type { NegotiationPhrase } from './types';

/**
 * Vietnamese Market Negotiation Phrases
 *
 * 27 authentic phrases used in Vietnamese market haggling.
 * Organized by category and effect type.
 */

export const NEGOTIATION_PHRASES: NegotiationPhrase[] = [
  // === PRICE COMPLAINTS (price_reduce) ===
  {
    id: 'dat-qua',
    vietnamese: 'Đắt quá!',
    english: 'Too expensive!',
    romanization: 'dat kwah',
    effect: 'price_reduce',
    priceImpact: -0.1,
    moodImpact: -0.05,
    culturalTip: 'This is the most common opening move. Vendors expect it!',
    bestUsedWhen: 'Starting a negotiation',
  },
  {
    id: 'mac-qua',
    vietnamese: 'Mắc quá!',
    english: 'Too expensive! (Southern)',
    romanization: 'mak kwah',
    effect: 'price_reduce',
    priceImpact: -0.1,
    moodImpact: -0.03,
    culturalTip: 'Southern Vietnamese dialect. Vendors appreciate when you match their region!',
    bestUsedWhen: 'With Southern vendors',
  },
  {
    id: 'giam-gia',
    vietnamese: 'Giảm giá đi!',
    english: 'Lower the price!',
    romanization: 'zahm zah dee',
    effect: 'price_reduce',
    priceImpact: -0.15,
    moodImpact: -0.1,
    culturalTip: 'Direct but effective. Use after initial pleasantries.',
  },
  {
    id: 'bot-di',
    vietnamese: 'Bớt đi!',
    english: 'Reduce it!',
    romanization: 'but dee',
    effect: 'price_reduce',
    priceImpact: -0.12,
    moodImpact: -0.08,
    culturalTip: 'Casual and friendly way to ask for discount.',
  },
  {
    id: 're-hon',
    vietnamese: 'Rẻ hơn được không?',
    english: 'Can it be cheaper?',
    romanization: 'reh hun duk kohng',
    effect: 'price_reduce',
    priceImpact: -0.08,
    moodImpact: 0,
    culturalTip: 'Polite question form. Good for maintaining rapport.',
    bestUsedWhen: 'You want to stay friendly',
  },

  // === RAPPORT BUILDING (mood_improve) ===
  {
    id: 'dep-qua',
    vietnamese: 'Đẹp quá!',
    english: 'So beautiful!',
    romanization: 'dep kwah',
    effect: 'mood_improve',
    priceImpact: 0,
    moodImpact: 0.15,
    culturalTip: 'Complimenting the goods builds goodwill.',
    bestUsedWhen: 'Opening or after a tense moment',
  },
  {
    id: 'chat-luong-tot',
    vietnamese: 'Chất lượng tốt!',
    english: 'Good quality!',
    romanization: 'chat luung tot',
    effect: 'mood_improve',
    priceImpact: 0.05,
    moodImpact: 0.2,
    culturalTip: 'Shows you appreciate their goods. May slightly raise price.',
  },
  {
    id: 'co-ban-gioi',
    vietnamese: 'Cô bán giỏi quá!',
    english: 'You sell so well!',
    romanization: 'koh ban zoy kwah',
    effect: 'mood_improve',
    priceImpact: -0.05,
    moodImpact: 0.25,
    culturalTip: 'Flattery works! Compliment their selling skills.',
  },
  {
    id: 'cam-on',
    vietnamese: 'Cảm ơn nhiều!',
    english: 'Thank you so much!',
    romanization: 'kahm un nyew',
    effect: 'mood_improve',
    priceImpact: 0,
    moodImpact: 0.1,
    culturalTip: 'Politeness is valued. Use throughout the conversation.',
  },
  {
    id: 'vui-qua',
    vietnamese: 'Vui quá!',
    english: 'So fun/happy!',
    romanization: 'vooey kwah',
    effect: 'mood_improve',
    priceImpact: 0,
    moodImpact: 0.15,
    culturalTip: 'Shows you\'re enjoying the interaction. Vendors love happy customers.',
  },

  // === STRATEGIC MOVES (various effects) ===
  {
    id: 'mua-nhieu',
    vietnamese: 'Tôi mua nhiều!',
    english: "I'll buy a lot!",
    romanization: 'toy moo-a nyew',
    effect: 'price_reduce',
    priceImpact: -0.2,
    moodImpact: 0.1,
    culturalTip: 'Promise of bulk purchase = bigger discount. But you should follow through!',
    bestUsedWhen: 'You actually plan to buy multiple items',
  },
  {
    id: 'khach-quen',
    vietnamese: 'Tôi là khách quen!',
    english: "I'm a regular customer!",
    romanization: 'toy la kak kwen',
    effect: 'price_reduce',
    priceImpact: -0.15,
    moodImpact: 0.05,
    culturalTip: 'Claiming regular status can work, but only if true!',
    bestUsedWhen: 'You\'ve actually visited before',
  },
  {
    id: 'nguoi-viet',
    vietnamese: 'Tôi là người Việt!',
    english: "I'm Vietnamese!",
    romanization: 'toy la nguoy vyet',
    effect: 'price_reduce',
    priceImpact: -0.1,
    moodImpact: 0.1,
    culturalTip: 'Local prices vs tourist prices are real. But vendors can tell!',
  },
  {
    id: 'sinh-vien',
    vietnamese: 'Tôi là sinh viên!',
    english: "I'm a student!",
    romanization: 'toy la sing vyen',
    effect: 'price_reduce',
    priceImpact: -0.1,
    moodImpact: 0.05,
    culturalTip: 'Student discounts exist everywhere in Vietnam!',
  },
  {
    id: 'tien-mat',
    vietnamese: 'Tôi trả tiền mặt!',
    english: "I'll pay cash!",
    romanization: 'toy tra tyen mat',
    effect: 'price_reduce',
    priceImpact: -0.08,
    moodImpact: 0.05,
    culturalTip: 'Cash is king in Vietnamese markets. No card fees!',
  },

  // === WALK AWAY TRIGGERS ===
  {
    id: 'thoi-di',
    vietnamese: 'Thôi, tôi đi!',
    english: 'Forget it, I\'m leaving!',
    romanization: 'toy, toy dee',
    effect: 'walk_away_trigger',
    priceImpact: -0.25,
    moodImpact: -0.2,
    culturalTip: 'The walk-away is a powerful move. Vendors often call you back!',
    bestUsedWhen: 'Price isn\'t budging and you\'re ready to risk it',
  },
  {
    id: 'cho-khac',
    vietnamese: 'Tôi đi chỗ khác!',
    english: "I'll go somewhere else!",
    romanization: 'toy dee cho kak',
    effect: 'walk_away_trigger',
    priceImpact: -0.2,
    moodImpact: -0.15,
    culturalTip: 'Mentioning competition puts pressure on the vendor.',
  },
  {
    id: 're-hon-ben-kia',
    vietnamese: 'Bên kia rẻ hơn!',
    english: 'It\'s cheaper over there!',
    romanization: 'ben kee-a reh hun',
    effect: 'walk_away_trigger',
    priceImpact: -0.15,
    moodImpact: -0.1,
    culturalTip: 'Claiming competitor prices. Risky but effective!',
  },

  // === DEAL CLOSERS ===
  {
    id: 'duoc-roi',
    vietnamese: 'Được rồi!',
    english: 'OK, deal!',
    romanization: 'duk roy',
    effect: 'deal_closer',
    priceImpact: 0,
    moodImpact: 0.3,
    culturalTip: 'Sealing the deal. Say it with a smile!',
  },
  {
    id: 'lay-di',
    vietnamese: 'Lấy đi!',
    english: "I'll take it!",
    romanization: 'lay dee',
    effect: 'deal_closer',
    priceImpact: 0,
    moodImpact: 0.2,
    culturalTip: 'Quick acceptance. Good when you\'ve got a fair price.',
  },
  {
    id: 'dong-y',
    vietnamese: 'Đồng ý!',
    english: 'Agreed!',
    romanization: 'dohng ee',
    effect: 'deal_closer',
    priceImpact: 0,
    moodImpact: 0.25,
    culturalTip: 'Formal agreement. Professional tone.',
  },

  // === INFORMATION SEEKING ===
  {
    id: 'cai-nay-gi',
    vietnamese: 'Cái này là gì?',
    english: 'What is this?',
    romanization: 'kai nay la zee',
    effect: 'info_reveal',
    priceImpact: 0,
    moodImpact: 0.1,
    culturalTip: 'Showing interest. Vendors love to explain their products.',
  },
  {
    id: 'tu-dau',
    vietnamese: 'Từ đâu vậy?',
    english: 'Where is it from?',
    romanization: 'too dow vay',
    effect: 'info_reveal',
    priceImpact: 0,
    moodImpact: 0.1,
    culturalTip: 'Asking about origin shows you care about quality.',
  },
  {
    id: 'lam-sao',
    vietnamese: 'Làm sao dùng?',
    english: 'How do you use it?',
    romanization: 'lahm sow zoong',
    effect: 'info_reveal',
    priceImpact: 0,
    moodImpact: 0.15,
    culturalTip: 'Practical question. Vendors appreciate engaged customers.',
  },

  // === BONUS ITEM REQUESTS ===
  {
    id: 'them-gi',
    vietnamese: 'Thêm gì không?',
    english: 'Any extras?',
    romanization: 'tem zee kohng',
    effect: 'bonus_item',
    priceImpact: 0,
    moodImpact: -0.05,
    culturalTip: 'Asking for freebies. Works better after agreeing on price.',
    bestUsedWhen: 'You\'ve already agreed on a good price',
  },
  {
    id: 'tang-them',
    vietnamese: 'Tặng thêm đi!',
    english: 'Give me something extra!',
    romanization: 'tahng tem dee',
    effect: 'bonus_item',
    priceImpact: 0,
    moodImpact: -0.1,
    culturalTip: 'Direct request for bonus. Bold but sometimes works!',
  },
  {
    id: 'mien-phi',
    vietnamese: 'Có gì miễn phí không?',
    english: 'Anything free?',
    romanization: 'koh zee myen fee kohng',
    effect: 'bonus_item',
    priceImpact: 0,
    moodImpact: -0.05,
    culturalTip: 'Polite way to fish for freebies.',
  },
];

/** Get phrases by effect type */
export function getPhrasesByEffect(effect: NegotiationPhrase['effect']): NegotiationPhrase[] {
  return NEGOTIATION_PHRASES.filter((p) => p.effect === effect);
}

/** Get a random phrase of a given effect */
export function getRandomPhrase(effect: NegotiationPhrase['effect']): NegotiationPhrase | undefined {
  const phrases = getPhrasesByEffect(effect);
  return phrases[Math.floor(Math.random() * phrases.length)];
}

/** Phrase categories for UI grouping */
export const PHRASE_CATEGORIES = {
  price: ['dat-qua', 'mac-qua', 'giam-gia', 'bot-di', 're-hon'],
  rapport: ['dep-qua', 'chat-luong-tot', 'co-ban-gioi', 'cam-on', 'vui-qua'],
  strategy: ['mua-nhieu', 'khach-quen', 'nguoi-viet', 'sinh-vien', 'tien-mat'],
  walkaway: ['thoi-di', 'cho-khac', 're-hon-ben-kia'],
  close: ['duoc-roi', 'lay-di', 'dong-y'],
  info: ['cai-nay-gi', 'tu-dau', 'lam-sao'],
  bonus: ['them-gi', 'tang-them', 'mien-phi'],
} as const;
