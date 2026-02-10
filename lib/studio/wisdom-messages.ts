/**
 * Curated wisdom messages for the image generation loading experience
 * ~300 messages from various philosophical traditions and creative sources
 */

export interface WisdomMessage {
  emoji: string;
  text: string;
  source: string | null;
}

// ============================================================================
// STOICISM - Marcus Aurelius (~25)
// ============================================================================
const MARCUS_AURELIUS: WisdomMessage[] = [
  { emoji: '🏛️', text: '"The impediment to action advances action. What stands in the way becomes the way."', source: 'Marcus Aurelius' },
  { emoji: '🦁', text: '"Waste no more time arguing about what a good man should be. Be one."', source: 'Marcus Aurelius' },
  { emoji: '🌅', text: '"When you arise in the morning, think of what a precious privilege it is to be alive."', source: 'Marcus Aurelius' },
  { emoji: '⚔️', text: '"Very little is needed to make a happy life; it is all within yourself."', source: 'Marcus Aurelius' },
  { emoji: '🎭', text: '"The happiness of your life depends upon the quality of your thoughts."', source: 'Marcus Aurelius' },
  { emoji: '🌊', text: '"You have power over your mind, not outside events. Realize this, and you will find strength."', source: 'Marcus Aurelius' },
  { emoji: '⏰', text: '"It is not death that a man should fear, but never beginning to live."', source: 'Marcus Aurelius' },
  { emoji: '🔥', text: '"The soul becomes dyed with the color of its thoughts."', source: 'Marcus Aurelius' },
  { emoji: '🎯', text: '"Never let the future disturb you. You will meet it with the same weapons of reason."', source: 'Marcus Aurelius' },
  { emoji: '🌟', text: '"Dwell on the beauty of life. Watch the stars, and see yourself running with them."', source: 'Marcus Aurelius' },
  { emoji: '💎', text: '"The object of life is not to be on the side of the majority, but to escape finding oneself in the ranks of the insane."', source: 'Marcus Aurelius' },
  { emoji: '🏔️', text: '"Look well into thyself; there is a source of strength which will always spring up if thou wilt always look."', source: 'Marcus Aurelius' },
  { emoji: '🌿', text: '"Accept the things to which fate binds you, and love the people with whom fate brings you together."', source: 'Marcus Aurelius' },
  { emoji: '⚡', text: '"The best revenge is to be unlike him who performed the injury."', source: 'Marcus Aurelius' },
  { emoji: '🧭', text: '"Everything we hear is an opinion, not a fact. Everything we see is a perspective, not the truth."', source: 'Marcus Aurelius' },
  { emoji: '🌱', text: '"Loss is nothing else but change, and change is Nature\'s delight."', source: 'Marcus Aurelius' },
  { emoji: '🦅', text: '"How much time he gains who does not look to see what his neighbor says or does."', source: 'Marcus Aurelius' },
  { emoji: '🎪', text: '"Remember that very little is needed to make a happy life."', source: 'Marcus Aurelius' },
  { emoji: '🌙', text: '"Think of yourself as dead. You have lived your life. Now take what\'s left and live it properly."', source: 'Marcus Aurelius' },
  { emoji: '🔮', text: '"The universe is change; our life is what our thoughts make it."', source: 'Marcus Aurelius' },
  { emoji: '🏹', text: '"Be tolerant with others and strict with yourself."', source: 'Marcus Aurelius' },
  { emoji: '🌸', text: '"When another blames you or hates you, go to their souls, and see what kind of people they are."', source: 'Marcus Aurelius' },
  { emoji: '⛵', text: '"No man is free who is not master of himself."', source: 'Marcus Aurelius' },
  { emoji: '🗝️', text: '"Begin each day by telling yourself: Today I shall meet with interference, ingratitude, and ill will."', source: 'Marcus Aurelius' },
  { emoji: '🎨', text: '"The art of living is more like wrestling than dancing."', source: 'Marcus Aurelius' },
];

// ============================================================================
// STOICISM - Seneca (~25)
// ============================================================================
const SENECA: WisdomMessage[] = [
  { emoji: '⏳', text: '"While we wait for life, life passes."', source: 'Seneca' },
  { emoji: '🧠', text: '"We suffer more often in imagination than in reality."', source: 'Seneca' },
  { emoji: '🎭', text: '"Luck is what happens when preparation meets opportunity."', source: 'Seneca' },
  { emoji: '🌊', text: '"Difficulties strengthen the mind, as labor does the body."', source: 'Seneca' },
  { emoji: '📚', text: '"As is a tale, so is life: not how long it is, but how good it is, is what matters."', source: 'Seneca' },
  { emoji: '🔥', text: '"It is not that we have a short time to live, but that we waste a lot of it."', source: 'Seneca' },
  { emoji: '🌟', text: '"True happiness is to enjoy the present, without anxious dependence upon the future."', source: 'Seneca' },
  { emoji: '⚓', text: '"He who is brave is free."', source: 'Seneca' },
  { emoji: '🎯', text: '"If a man knows not to which port he sails, no wind is favorable."', source: 'Seneca' },
  { emoji: '💎', text: '"Wealth is the slave of a wise man and the master of a fool."', source: 'Seneca' },
  { emoji: '🌿', text: '"Begin at once to live, and count each separate day as a separate life."', source: 'Seneca' },
  { emoji: '🏛️', text: '"A gem cannot be polished without friction, nor a man perfected without trials."', source: 'Seneca' },
  { emoji: '🦁', text: '"It is not because things are difficult that we do not dare; it is because we do not dare that they are difficult."', source: 'Seneca' },
  { emoji: '🌅', text: '"Every new beginning comes from some other beginning\'s end."', source: 'Seneca' },
  { emoji: '🗝️', text: '"Sometimes even to live is an act of courage."', source: 'Seneca' },
  { emoji: '🎪', text: '"Life is like a play: it\'s not the length, but the excellence of the acting that matters."', source: 'Seneca' },
  { emoji: '🌙', text: '"The greatest obstacle to living is expectancy, which hangs upon tomorrow."', source: 'Seneca' },
  { emoji: '⚡', text: '"Associate with people who are likely to improve you."', source: 'Seneca' },
  { emoji: '🏔️', text: '"No person has the power to have everything they want, but it is in their power not to want what they don\'t have."', source: 'Seneca' },
  { emoji: '🌱', text: '"Hang on to your youthful enthusiasms—you\'ll be able to use them better when you\'re older."', source: 'Seneca' },
  { emoji: '🦅', text: '"Throw me to the wolves and I will return leading the pack."', source: 'Seneca' },
  { emoji: '🎨', text: '"All art is but imitation of nature."', source: 'Seneca' },
  { emoji: '⛵', text: '"A sword never kills anybody; it is a tool in the killer\'s hand."', source: 'Seneca' },
  { emoji: '🔮', text: '"Religion is regarded by the common people as true, by the wise as false, and by rulers as useful."', source: 'Seneca' },
  { emoji: '🏹', text: '"The mind that is anxious about future events is miserable."', source: 'Seneca' },
];

// ============================================================================
// STOICISM - Epictetus (~20)
// ============================================================================
const EPICTETUS: WisdomMessage[] = [
  { emoji: '🎯', text: '"First say to yourself what you would be; and then do what you have to do."', source: 'Epictetus' },
  { emoji: '🔗', text: '"No great thing is created suddenly."', source: 'Epictetus' },
  { emoji: '🪨', text: '"It\'s not what happens to you, but how you react to it that matters."', source: 'Epictetus' },
  { emoji: '🌊', text: '"We cannot choose our external circumstances, but we can always choose how we respond to them."', source: 'Epictetus' },
  { emoji: '📚', text: '"Only the educated are free."', source: 'Epictetus' },
  { emoji: '🔥', text: '"If you want to improve, be content to be thought foolish and stupid."', source: 'Epictetus' },
  { emoji: '🌟', text: '"Wealth consists not in having great possessions, but in having few wants."', source: 'Epictetus' },
  { emoji: '⚓', text: '"Freedom is the only worthy goal in life."', source: 'Epictetus' },
  { emoji: '💎', text: '"Don\'t explain your philosophy. Embody it."', source: 'Epictetus' },
  { emoji: '🌿', text: '"He is a wise man who does not grieve for the things which he has not, but rejoices for those which he has."', source: 'Epictetus' },
  { emoji: '🏛️', text: '"Make the best use of what is in your power, and take the rest as it happens."', source: 'Epictetus' },
  { emoji: '🦁', text: '"Circumstances don\'t make the man, they only reveal him to himself."', source: 'Epictetus' },
  { emoji: '🌅', text: '"Any person capable of angering you becomes your master."', source: 'Epictetus' },
  { emoji: '🗝️', text: '"The key is to keep company only with people who uplift you."', source: 'Epictetus' },
  { emoji: '🎪', text: '"If you wish to be a writer, write."', source: 'Epictetus' },
  { emoji: '🌙', text: '"Know, first, who you are, and then adorn yourself accordingly."', source: 'Epictetus' },
  { emoji: '⚡', text: '"Caretake this moment. Immerse yourself in its particulars."', source: 'Epictetus' },
  { emoji: '🏔️', text: '"Men are disturbed not by things, but by the views which they take of things."', source: 'Epictetus' },
  { emoji: '🌱', text: '"Progress is not achieved by luck or accident, but by working on yourself daily."', source: 'Epictetus' },
  { emoji: '🦅', text: '"He who laughs at himself never runs out of things to laugh at."', source: 'Epictetus' },
];

// ============================================================================
// BUDDHISM (~50)
// ============================================================================
const BUDDHISM: WisdomMessage[] = [
  { emoji: '🧘', text: '"The mind is everything. What you think you become."', source: 'Buddha' },
  { emoji: '🪷', text: '"Peace comes from within. Do not seek it without."', source: 'Buddha' },
  { emoji: '🌸', text: '"Do not dwell in the past, do not dream of the future, concentrate the mind on the present moment."', source: 'Buddha' },
  { emoji: '💫', text: '"An idea that is developed and put into action is more important than an idea that exists only as an idea."', source: 'Buddha' },
  { emoji: '🕯️', text: '"Three things cannot be hidden: the sun, the moon, and the truth."', source: 'Buddha' },
  { emoji: '🌱', text: '"Every morning we are born again. What we do today matters most."', source: 'Buddha' },
  { emoji: '🌊', text: '"You yourself, as much as anybody in the entire universe, deserve your love and affection."', source: 'Buddha' },
  { emoji: '🔥', text: '"Holding on to anger is like grasping a hot coal with the intent of throwing it at someone else."', source: 'Buddha' },
  { emoji: '🌟', text: '"There is no path to happiness: happiness is the path."', source: 'Buddha' },
  { emoji: '💎', text: '"The root of suffering is attachment."', source: 'Buddha' },
  { emoji: '🌿', text: '"In the end, only three things matter: how much you loved, how gently you lived, and how gracefully you let go."', source: 'Buddha' },
  { emoji: '🏔️', text: '"No one saves us but ourselves. No one can and no one may. We ourselves must walk the path."', source: 'Buddha' },
  { emoji: '🦋', text: '"Nothing is permanent. Everything is subject to change."', source: 'Buddha' },
  { emoji: '🌅', text: '"Work out your own salvation. Do not depend on others."', source: 'Buddha' },
  { emoji: '🎯', text: '"What we think, we become."', source: 'Buddha' },
  { emoji: '⚓', text: '"Better than a thousand hollow words, is one word that brings peace."', source: 'Buddha' },
  { emoji: '🌙', text: '"Doubt everything. Find your own light."', source: 'Buddha' },
  { emoji: '⚡', text: '"A jug fills drop by drop."', source: 'Buddha' },
  { emoji: '🦁', text: '"Conquer yourself and you will conquer the world."', source: 'Buddha' },
  { emoji: '🗝️', text: '"The only real failure in life is not to be true to the best one knows."', source: 'Buddha' },
  { emoji: '🎪', text: '"Health is the greatest gift, contentment the greatest wealth, faithfulness the best relationship."', source: 'Buddha' },
  { emoji: '🌱', text: '"Just as a snake sheds its skin, we must shed our past over and over again."', source: 'Buddha' },
  { emoji: '🔮', text: '"Your work is to discover your world and then with all your heart give yourself to it."', source: 'Buddha' },
  { emoji: '🏹', text: '"If you find no one to support you on the spiritual path, walk alone."', source: 'Buddha' },
  { emoji: '🎨', text: '"Purity or impurity depends on oneself. No one can purify another."', source: 'Buddha' },
  // Zen wisdom
  { emoji: '🍃', text: '"Before enlightenment, chop wood, carry water. After enlightenment, chop wood, carry water."', source: 'Zen Proverb' },
  { emoji: '🌊', text: '"The obstacle is the path."', source: 'Zen Proverb' },
  { emoji: '🏔️', text: '"When you reach the top of the mountain, keep climbing."', source: 'Zen Proverb' },
  { emoji: '🌸', text: '"Sitting quietly, doing nothing, spring comes, and the grass grows by itself."', source: 'Zen Proverb' },
  { emoji: '🍵', text: '"The way out is through."', source: 'Zen Proverb' },
  { emoji: '🪷', text: '"Let go or be dragged."', source: 'Zen Proverb' },
  { emoji: '🌙', text: '"The moon does not fight. It attacks no one. And yet it needs no defense."', source: 'Zen Proverb' },
  { emoji: '💧', text: '"Be like water making its way through cracks."', source: 'Zen Proverb' },
  { emoji: '🎋', text: '"The bamboo that bends is stronger than the oak that resists."', source: 'Zen Proverb' },
  { emoji: '🌺', text: '"A flower does not think of competing with the flower next to it. It just blooms."', source: 'Zen Proverb' },
  { emoji: '🪨', text: '"When you try to stay on the surface of the water, you sink; but when you try to sink, you float."', source: 'Zen Proverb' },
  { emoji: '🌿', text: '"Muddy water is best cleared by leaving it alone."', source: 'Zen Proverb' },
  { emoji: '🔔', text: '"When the student is ready, the teacher will appear."', source: 'Zen Proverb' },
  { emoji: '⛩️', text: '"In the beginner\'s mind there are many possibilities, in the expert\'s mind there are few."', source: 'Shunryu Suzuki' },
  { emoji: '🎎', text: '"Zen is not some kind of excitement, but concentration on our usual everyday routine."', source: 'Shunryu Suzuki' },
  // Thich Nhat Hanh
  { emoji: '🌻', text: '"Smile, breathe, and go slowly."', source: 'Thich Nhat Hanh' },
  { emoji: '🌈', text: '"No mud, no lotus."', source: 'Thich Nhat Hanh' },
  { emoji: '☕', text: '"Drink your tea slowly and reverently, as if it is the axis on which the world revolves."', source: 'Thich Nhat Hanh' },
  { emoji: '🌬️', text: '"Feelings come and go like clouds in a windy sky. Conscious breathing is my anchor."', source: 'Thich Nhat Hanh' },
  { emoji: '👣', text: '"Walk as if you are kissing the Earth with your feet."', source: 'Thich Nhat Hanh' },
  { emoji: '🌷', text: '"Because you are alive, everything is possible."', source: 'Thich Nhat Hanh' },
  { emoji: '🕊️', text: '"Hope is important because it can make the present moment less difficult to bear."', source: 'Thich Nhat Hanh' },
  { emoji: '🌾', text: '"Life is available only in the present moment."', source: 'Thich Nhat Hanh' },
  { emoji: '💚', text: '"Understanding someone\'s suffering is the best gift you can give another person."', source: 'Thich Nhat Hanh' },
  { emoji: '🌼', text: '"The present moment is filled with joy and happiness. If you are attentive, you will see it."', source: 'Thich Nhat Hanh' },
];

// ============================================================================
// THE KYBALION / HERMETIC WISDOM (~20)
// ============================================================================
const KYBALION: WisdomMessage[] = [
  { emoji: '🔮', text: '"The All is Mind; the Universe is Mental."', source: 'The Kybalion' },
  { emoji: '✨', text: '"As above, so below; as below, so above."', source: 'The Kybalion' },
  { emoji: '🌀', text: '"Nothing rests; everything moves; everything vibrates."', source: 'The Kybalion' },
  { emoji: '♾️', text: '"Everything flows, out and in; all things rise and fall."', source: 'The Kybalion' },
  { emoji: '⚖️', text: '"Every cause has its effect; every effect has its cause."', source: 'The Kybalion' },
  { emoji: '🌓', text: '"Everything is dual; opposites are identical in nature, but different in degree."', source: 'The Kybalion' },
  { emoji: '🔄', text: '"The pendulum swing manifests in everything; the swing to the right is the swing to the left."', source: 'The Kybalion' },
  { emoji: '⚡', text: '"Gender is in everything; everything has masculine and feminine principles."', source: 'The Kybalion' },
  { emoji: '🌌', text: '"The Universe exists by virtue of these Laws, which form its framework."', source: 'The Kybalion' },
  { emoji: '🧿', text: '"Mind may be transmuted from state to state; degree to degree."', source: 'The Kybalion' },
  { emoji: '🎭', text: '"The wise ones serve on the higher planes, but rule on the lower."', source: 'The Kybalion' },
  { emoji: '🌟', text: '"To change your mood, change your vibration."', source: 'The Kybalion' },
  { emoji: '🏛️', text: '"The lips of wisdom are closed, except to the ears of understanding."', source: 'The Kybalion' },
  { emoji: '💎', text: '"Where fall the footsteps of the Master, the ears of those ready for teaching open wide."', source: 'The Kybalion' },
  { emoji: '🔥', text: '"True Hermetic Transmutation is a Mental Art."', source: 'The Kybalion' },
  { emoji: '🌊', text: '"Rhythm may be neutralized by an application of the Art of Polarization."', source: 'The Kybalion' },
  { emoji: '🗝️', text: '"The half-wise, recognizing the unreality of the Universe, imagine that they may defy its Laws."', source: 'The Kybalion' },
  { emoji: '⛵', text: '"The truly wise, knowing the nature of the Universe, use Law against laws."', source: 'The Kybalion' },
  { emoji: '🌙', text: '"Understanding the Principle of Polarity, one may change their own polarity."', source: 'The Kybalion' },
  { emoji: '🎯', text: '"THE ALL is in All, and All is in THE ALL."', source: 'The Kybalion' },
];

// ============================================================================
// TAOISM - Lao Tzu & Chuang Tzu (~30)
// ============================================================================
const TAOISM: WisdomMessage[] = [
  { emoji: '☯️', text: '"The journey of a thousand miles begins with a single step."', source: 'Lao Tzu' },
  { emoji: '💧', text: '"Nothing is softer or more flexible than water, yet nothing can resist it."', source: 'Lao Tzu' },
  { emoji: '🌊', text: '"Be like water. Flow around obstacles."', source: 'Lao Tzu' },
  { emoji: '🎋', text: '"Nature does not hurry, yet everything is accomplished."', source: 'Lao Tzu' },
  { emoji: '🌿', text: '"When I let go of what I am, I become what I might be."', source: 'Lao Tzu' },
  { emoji: '🏔️', text: '"The wise man is one who knows what he does not know."', source: 'Lao Tzu' },
  { emoji: '🌙', text: '"Silence is a source of great strength."', source: 'Lao Tzu' },
  { emoji: '🌸', text: '"Simplicity, patience, compassion—these are your greatest treasures."', source: 'Lao Tzu' },
  { emoji: '🎯', text: '"He who knows others is wise. He who knows himself is enlightened."', source: 'Lao Tzu' },
  { emoji: '🌅', text: '"A good traveler has no fixed plans and is not intent on arriving."', source: 'Lao Tzu' },
  { emoji: '🔥', text: '"The flame that burns twice as bright burns half as long."', source: 'Lao Tzu' },
  { emoji: '🌟', text: '"When you are content to simply be yourself, everyone will respect you."', source: 'Lao Tzu' },
  { emoji: '💎', text: '"The truth is not always beautiful, nor beautiful words the truth."', source: 'Lao Tzu' },
  { emoji: '🦋', text: '"New beginnings are often disguised as painful endings."', source: 'Lao Tzu' },
  { emoji: '⚓', text: '"Life is a series of natural and spontaneous changes. Don\'t resist them."', source: 'Lao Tzu' },
  { emoji: '🗝️', text: '"If you do not change direction, you may end up where you are heading."', source: 'Lao Tzu' },
  { emoji: '🌱', text: '"Care about what other people think and you will always be their prisoner."', source: 'Lao Tzu' },
  { emoji: '🎪', text: '"To lead people, walk behind them."', source: 'Lao Tzu' },
  { emoji: '⚡', text: '"Act without expectation."', source: 'Lao Tzu' },
  { emoji: '🦁', text: '"Mastering others is strength. Mastering yourself is true power."', source: 'Lao Tzu' },
  // Chuang Tzu
  { emoji: '🦋', text: '"Once upon a time, I dreamt I was a butterfly. Now I do not know whether I am a man dreaming I am a butterfly, or a butterfly dreaming I am a man."', source: 'Chuang Tzu' },
  { emoji: '🌊', text: '"Flow with whatever may happen and let your mind be free."', source: 'Chuang Tzu' },
  { emoji: '🎨', text: '"Happiness is the absence of striving for happiness."', source: 'Chuang Tzu' },
  { emoji: '🏞️', text: '"The fish trap exists because of the fish. Once you\'ve gotten the fish, you can forget the trap."', source: 'Chuang Tzu' },
  { emoji: '🌌', text: '"Great wisdom is generous; petty wisdom is contentious."', source: 'Chuang Tzu' },
  { emoji: '🎭', text: '"We cling to our own point of view, as though everything depended on it."', source: 'Chuang Tzu' },
  { emoji: '🌺', text: '"To a mind that is still, the whole universe surrenders."', source: 'Chuang Tzu' },
  { emoji: '🔮', text: '"The true man of old knew nothing of loving life or hating death."', source: 'Chuang Tzu' },
  { emoji: '🍃', text: '"Easy is right. Begin right and you are easy. Continue easy and you are right."', source: 'Chuang Tzu' },
  { emoji: '🌈', text: '"The perfect man uses his mind as a mirror. It grasps nothing. It refuses nothing."', source: 'Chuang Tzu' },
];

// ============================================================================
// VIETNAMESE PROVERBS - Thành Ngữ (~30)
// ============================================================================
const VIETNAMESE: WisdomMessage[] = [
  { emoji: '🐉', text: '"Con rồng cháu tiên" — Children of the dragon, grandchildren of the fairy.', source: 'Vietnamese Proverb' },
  { emoji: '🍜', text: '"Good things take time, like a perfect bowl of phở."', source: null },
  { emoji: '🏮', text: '"Patience lights the lantern of success."', source: null },
  { emoji: '🎋', text: '"Uống nước nhớ nguồn" — When drinking water, remember the source.', source: 'Vietnamese Proverb' },
  { emoji: '🌾', text: '"Có công mài sắt, có ngày nên kim" — With enough grinding, an iron rod becomes a needle.', source: 'Vietnamese Proverb' },
  { emoji: '🐢', text: '"Chậm mà chắc" — Slow but sure.', source: 'Vietnamese Proverb' },
  { emoji: '🌸', text: '"Đẹp như tranh" — Beautiful as a painting.', source: null },
  { emoji: '🎨', text: '"Nghệ thuật không có giới hạn" — Art has no limits.', source: null },
  { emoji: '🌅', text: '"Một cây làm chẳng nên non, ba cây chụm lại nên hòn núi cao" — One tree cannot make a mountain.', source: 'Vietnamese Proverb' },
  { emoji: '💎', text: '"Tốt gỗ hơn tốt nước sơn" — Good wood is better than good paint.', source: 'Vietnamese Proverb' },
  { emoji: '🦁', text: '"Có chí thì nên" — Where there\'s a will, there\'s a way.', source: 'Vietnamese Proverb' },
  { emoji: '🌊', text: '"Nước chảy đá mòn" — Water drops wear away stone.', source: 'Vietnamese Proverb' },
  { emoji: '🌱', text: '"Học ăn, học nói, học gói, học mở" — Learn to eat, speak, wrap, and unwrap.', source: 'Vietnamese Proverb' },
  { emoji: '🔥', text: '"Lửa thử vàng, gian nan thử sức" — Fire tests gold, hardship tests strength.', source: 'Vietnamese Proverb' },
  { emoji: '🎯', text: '"Đi một ngày đàng, học một sàng khôn" — Travel one day, learn a basket of wisdom.', source: 'Vietnamese Proverb' },
  { emoji: '🌙', text: '"Trăng quầng thì hạn, trăng tán thì mưa" — Observe nature to know the weather.', source: 'Vietnamese Proverb' },
  { emoji: '🏡', text: '"Nhà sạch thì mát, bát sạch ngon cơm" — Clean house, cool breeze; clean bowl, tasty rice.', source: 'Vietnamese Proverb' },
  { emoji: '🌿', text: '"Thuốc đắng dã tật" — Bitter medicine cures illness.', source: 'Vietnamese Proverb' },
  { emoji: '🦅', text: '"Ăn quả nhớ kẻ trồng cây" — When eating fruit, remember who planted the tree.', source: 'Vietnamese Proverb' },
  { emoji: '⭐', text: '"Kiến tha lâu cũng đầy tổ" — Ants carrying long enough will fill the nest.', source: 'Vietnamese Proverb' },
  { emoji: '🎭', text: '"Học thầy không tày học bạn" — Learning from friends equals learning from teachers.', source: 'Vietnamese Proverb' },
  { emoji: '🌻', text: '"Hoa nở rồi tàn, nhưng cây vẫn xanh" — Flowers bloom and wilt, but trees stay green.', source: null },
  { emoji: '🐟', text: '"Cá không ăn muối cá ươn" — Fish without salt will spoil.', source: 'Vietnamese Proverb' },
  { emoji: '🌴', text: '"Đất lành chim đậu" — Good land attracts birds.', source: 'Vietnamese Proverb' },
  { emoji: '💫', text: '"Góp gió thành bão" — Gather wind to make a storm.', source: 'Vietnamese Proverb' },
  { emoji: '🎋', text: '"Tre già măng mọc" — Old bamboo dies, new bamboo grows.', source: 'Vietnamese Proverb' },
  { emoji: '🌺', text: '"Creating with heart, learning Vietnamese words."', source: null },
  { emoji: '☀️', text: '"Sáng nắng chiều mưa" — Morning sun, afternoon rain. Embrace change.', source: null },
  { emoji: '🎨', text: '"Học một biết mười" — Learn one, know ten.', source: 'Vietnamese Proverb' },
  { emoji: '🌟', text: '"Năng nhặt chặt bị" — Diligent picking fills the bag.', source: 'Vietnamese Proverb' },
];

// ============================================================================
// CREATIVE & FUN MESSAGES (~50)
// ============================================================================
const CREATIVE: WisdomMessage[] = [
  { emoji: '🎨', text: 'Art is being woven from digital threads...', source: null },
  { emoji: '🌟', text: 'Stars are aligning for your creation...', source: null },
  { emoji: '🔥', text: 'Pixels are dancing into existence...', source: null },
  { emoji: '🌈', text: 'Colors are finding their perfect harmony...', source: null },
  { emoji: '⚡', text: 'Lightning strikes the canvas of imagination...', source: null },
  { emoji: '🎭', text: 'The muse whispers to the machine...', source: null },
  { emoji: '🦋', text: 'Transformation in progress...', source: null },
  { emoji: '🌌', text: 'Nebulas of creativity condensing...', source: null },
  { emoji: '✨', text: 'Sprinkling digital stardust...', source: null },
  { emoji: '🎪', text: 'The circus of imagination performs...', source: null },
  { emoji: '🌊', text: 'Waves of inspiration crashing into form...', source: null },
  { emoji: '🔮', text: 'The crystal ball reveals your vision...', source: null },
  { emoji: '🎵', text: 'Visual symphonies composing themselves...', source: null },
  { emoji: '🚀', text: 'Launching imagination into orbit...', source: null },
  { emoji: '🌺', text: 'Digital flowers blooming on your canvas...', source: null },
  { emoji: '⭐', text: 'Catching falling stars for your image...', source: null },
  { emoji: '🎁', text: 'Wrapping pixels in creativity...', source: null },
  { emoji: '🌙', text: 'Moonlight painting your vision...', source: null },
  { emoji: '🎯', text: 'Precision and imagination converging...', source: null },
  { emoji: '💎', text: 'Polishing digital diamonds...', source: null },
  { emoji: '🌿', text: 'Growing visual gardens...', source: null },
  { emoji: '🎨', text: 'Mixing the palette of possibilities...', source: null },
  { emoji: '🌅', text: 'Digital dawn breaking over your creation...', source: null },
  { emoji: '🔬', text: 'Zooming into the quantum realm of art...', source: null },
  { emoji: '🎭', text: 'Drama and beauty intertwining...', source: null },
  { emoji: '🌠', text: 'Shooting stars spelling your vision...', source: null },
  { emoji: '🎪', text: 'The greatest show in AI is performing...', source: null },
  { emoji: '🦄', text: 'Unicorns are prancing across the canvas...', source: null },
  { emoji: '🌋', text: 'Creativity erupting from the core...', source: null },
  { emoji: '🎸', text: 'Rock and roll pixels assembling...', source: null },
  { emoji: '🌊', text: 'Surfing the wave of imagination...', source: null },
  { emoji: '🏰', text: 'Building castles in the digital sky...', source: null },
  { emoji: '🎯', text: 'Aiming for visual perfection...', source: null },
  { emoji: '🌸', text: 'Cherry blossoms of data floating down...', source: null },
  { emoji: '⚗️', text: 'Alchemizing ideas into images...', source: null },
  { emoji: '🎩', text: 'Magic happening behind the curtain...', source: null },
  { emoji: '🌍', text: 'Rendering a world from your words...', source: null },
  { emoji: '🎬', text: 'Directing the scene of your imagination...', source: null },
  { emoji: '🔭', text: 'Telescoping into distant visual galaxies...', source: null },
  { emoji: '🎹', text: 'Playing the keys of creation...', source: null },
  { emoji: '🌪️', text: 'Tornado of creativity swirling...', source: null },
  { emoji: '🎨', text: 'Bob Ross would be proud... happy little pixels.', source: null },
  { emoji: '🤖', text: 'Beep boop... creating beauty...', source: null },
  { emoji: '🧙', text: 'Wizard mode: ACTIVATED', source: null },
  { emoji: '🎯', text: 'Targeting maximum awesomeness...', source: null },
  { emoji: '🌈', text: 'Following the rainbow to your treasure...', source: null },
  { emoji: '⚡', text: 'Channeling creative lightning...', source: null },
  { emoji: '🎭', text: 'The AI dreams in full color...', source: null },
  { emoji: '🚀', text: 'T-minus pixels until liftoff...', source: null },
  { emoji: '🌟', text: 'Polishing starlight into imagery...', source: null },
];

// ============================================================================
// GENERAL WISDOM & MOTIVATION (~40)
// ============================================================================
const GENERAL_WISDOM: WisdomMessage[] = [
  { emoji: '💡', text: '"Creativity takes courage."', source: 'Henri Matisse' },
  { emoji: '🎨', text: '"Every artist was first an amateur."', source: 'Ralph Waldo Emerson' },
  { emoji: '🌟', text: '"The only way to do great work is to love what you do."', source: 'Steve Jobs' },
  { emoji: '🔥', text: '"Imagination is the beginning of creation."', source: 'George Bernard Shaw' },
  { emoji: '💎', text: '"Simplicity is the ultimate sophistication."', source: 'Leonardo da Vinci' },
  { emoji: '🌊', text: '"Art is not what you see, but what you make others see."', source: 'Edgar Degas' },
  { emoji: '🎯', text: '"Vision without execution is hallucination."', source: 'Thomas Edison' },
  { emoji: '⚡', text: '"Great things are done by a series of small things brought together."', source: 'Vincent van Gogh' },
  { emoji: '🌱', text: '"The secret of getting ahead is getting started."', source: 'Mark Twain' },
  { emoji: '🦁', text: '"Be yourself; everyone else is already taken."', source: 'Oscar Wilde' },
  { emoji: '🌅', text: '"Every moment is a fresh beginning."', source: 'T.S. Eliot' },
  { emoji: '🎭', text: '"Life imitates art far more than art imitates life."', source: 'Oscar Wilde' },
  { emoji: '🏔️', text: '"The mountains are calling and I must go."', source: 'John Muir' },
  { emoji: '🌿', text: '"In every walk with nature, one receives far more than they seek."', source: 'John Muir' },
  { emoji: '💫', text: '"We are all in the gutter, but some of us are looking at the stars."', source: 'Oscar Wilde' },
  { emoji: '🎪', text: '"Life is either a daring adventure or nothing at all."', source: 'Helen Keller' },
  { emoji: '🌙', text: '"The future belongs to those who believe in the beauty of their dreams."', source: 'Eleanor Roosevelt' },
  { emoji: '⭐', text: '"Shoot for the moon. Even if you miss, you\'ll land among the stars."', source: 'Les Brown' },
  { emoji: '🎨', text: '"Color is a power which directly influences the soul."', source: 'Wassily Kandinsky' },
  { emoji: '🌸', text: '"To be an artist is to believe in life."', source: 'Henry Moore' },
  { emoji: '🔮', text: '"The chief enemy of creativity is good sense."', source: 'Pablo Picasso' },
  { emoji: '🦋', text: '"Just when the caterpillar thought the world was over, it became a butterfly."', source: 'Proverb' },
  { emoji: '🌈', text: '"Try to be a rainbow in someone\'s cloud."', source: 'Maya Angelou' },
  { emoji: '🎵', text: '"Where words fail, music speaks."', source: 'Hans Christian Andersen' },
  { emoji: '📚', text: '"A room without books is like a body without a soul."', source: 'Cicero' },
  { emoji: '🌻', text: '"Keep your face always toward the sunshine—and shadows will fall behind you."', source: 'Walt Whitman' },
  { emoji: '⚓', text: '"I am not afraid of storms, for I am learning how to sail my ship."', source: 'Louisa May Alcott' },
  { emoji: '🗝️', text: '"The only impossible journey is the one you never begin."', source: 'Tony Robbins' },
  { emoji: '🎯', text: '"Success is not final, failure is not fatal: it is the courage to continue that counts."', source: 'Winston Churchill' },
  { emoji: '🌊', text: '"In the middle of difficulty lies opportunity."', source: 'Albert Einstein' },
  { emoji: '🎭', text: '"All the world\'s a stage."', source: 'Shakespeare' },
  { emoji: '💪', text: '"What doesn\'t kill you makes you stronger."', source: 'Friedrich Nietzsche' },
  { emoji: '🌟', text: '"Strive not to be a success, but rather to be of value."', source: 'Albert Einstein' },
  { emoji: '🎨', text: '"Have no fear of perfection—you\'ll never reach it."', source: 'Salvador Dalí' },
  { emoji: '🌿', text: '"Growth is the only evidence of life."', source: 'John Henry Newman' },
  { emoji: '⚡', text: '"Innovation distinguishes between a leader and a follower."', source: 'Steve Jobs' },
  { emoji: '🌅', text: '"Each day provides its own gifts."', source: 'Marcus Aurelius' },
  { emoji: '🦅', text: '"The bird fights its way out of the egg. The egg is the world."', source: 'Hermann Hesse' },
  { emoji: '💎', text: '"It is during our darkest moments that we must focus to see the light."', source: 'Aristotle' },
  { emoji: '🎪', text: '"Life is what happens when you\'re busy making other plans."', source: 'John Lennon' },
];

// ============================================================================
// COMBINE ALL MESSAGES
// ============================================================================
export const WISDOM_MESSAGES: WisdomMessage[] = [
  ...MARCUS_AURELIUS,
  ...SENECA,
  ...EPICTETUS,
  ...BUDDHISM,
  ...KYBALION,
  ...TAOISM,
  ...VIETNAMESE,
  ...CREATIVE,
  ...GENERAL_WISDOM,
];

// Utility to get a random message
export function getRandomWisdomMessage(): WisdomMessage {
  return WISDOM_MESSAGES[Math.floor(Math.random() * WISDOM_MESSAGES.length)];
}

// Utility to get message count
export function getWisdomMessageCount(): number {
  return WISDOM_MESSAGES.length;
}
