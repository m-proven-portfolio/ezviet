import type { Vendor } from './types';

/**
 * Bến Thành Market Vendors
 *
 * 5 distinct vendors with unique personalities and merchandise.
 * Each has different flexibility and patience for haggling.
 */

export const VENDORS: Vendor[] = [
  {
    id: 'ba-hai',
    name: 'Bà Hai',
    displayName: 'Bà Hai',
    specialty: 'Fruits',
    avatar: '👵',
    greeting: 'Ôi, cháu ơi! Trái cây tươi đây! Mua đi cháu!',
    personality: {
      patience: 4,
      flexibility: 0.4,
      chattiness: 0.8,
      baseMood: 0.7,
    },
    backstory: 'Bà Hai has been selling fruits at Bến Thành for 40 years. She knows everyone and loves to chat about her grandchildren.',
    catchphrases: [
      'Ôi, cháu ơi!',
      'Ngon lắm đó!',
      'Bà bán rẻ cho cháu!',
      'Trái cây tươi mỗi ngày!',
    ],
    items: [
      {
        id: 'xoai',
        name: 'Mango',
        nameVietnamese: 'Xoài',
        basePrice: 80000,
        floorPrice: 50000,
        image: '🥭',
        description: 'Sweet Cát Chu mangoes from Đồng Tháp',
      },
      {
        id: 'chom-chom',
        name: 'Rambutan',
        nameVietnamese: 'Chôm chôm',
        basePrice: 60000,
        floorPrice: 35000,
        image: '🔴',
        description: 'Fresh rambutans, hairy but sweet inside',
      },
      {
        id: 'sau-rieng',
        name: 'Durian',
        nameVietnamese: 'Sầu riêng',
        basePrice: 200000,
        floorPrice: 120000,
        image: '🍈',
        description: 'The infamous "king of fruits" - love it or hate it!',
      },
    ],
  },
  {
    id: 'chi-lan',
    name: 'Chị Lan',
    displayName: 'Chị Lan',
    specialty: 'Clothing',
    avatar: '👩',
    greeting: 'Em ơi! Áo đẹp nè! Mặc thử đi em!',
    personality: {
      patience: 3,
      flexibility: 0.35,
      chattiness: 0.6,
      baseMood: 0.6,
    },
    backstory: 'Chị Lan sources her clothes from factories in District 5. She has a keen eye for fashion trends.',
    catchphrases: [
      'Đẹp lắm em!',
      'Mặc vô xinh lắm!',
      'Hàng chất lượng đó!',
      'Giá tốt nhất rồi!',
    ],
    items: [
      {
        id: 'ao-dai',
        name: 'Áo Dài',
        nameVietnamese: 'Áo dài',
        basePrice: 500000,
        floorPrice: 300000,
        image: '👗',
        description: 'Traditional Vietnamese dress, perfect for special occasions',
      },
      {
        id: 'non-la',
        name: 'Conical Hat',
        nameVietnamese: 'Nón lá',
        basePrice: 100000,
        floorPrice: 50000,
        image: '👒',
        description: 'Iconic Vietnamese palm leaf hat',
      },
      {
        id: 'ao-ba-ba',
        name: 'Bà Ba Shirt',
        nameVietnamese: 'Áo bà ba',
        basePrice: 150000,
        floorPrice: 80000,
        image: '👕',
        description: 'Traditional Southern Vietnamese blouse',
      },
    ],
  },
  {
    id: 'anh-tuan',
    name: 'Anh Tuấn',
    displayName: 'Anh Tuấn',
    specialty: 'Electronics',
    avatar: '👨',
    greeting: 'Chào bạn! Cần gì không? Hàng xịn đây!',
    personality: {
      patience: 2,
      flexibility: 0.25,
      chattiness: 0.4,
      baseMood: 0.5,
    },
    backstory: 'Anh Tuấn is tech-savvy and runs a tight ship. He knows his products inside out but doesn\'t have time for small talk.',
    catchphrases: [
      'Hàng xịn đó!',
      'Bảo hành 1 năm!',
      'Giá này tốt lắm rồi!',
      'Không có rẻ hơn đâu!',
    ],
    items: [
      {
        id: 'tai-nghe',
        name: 'Earphones',
        nameVietnamese: 'Tai nghe',
        basePrice: 200000,
        floorPrice: 150000,
        image: '🎧',
        description: 'Good quality earphones, various brands',
      },
      {
        id: 'sac-du-phong',
        name: 'Power Bank',
        nameVietnamese: 'Sạc dự phòng',
        basePrice: 300000,
        floorPrice: 220000,
        image: '🔋',
        description: '10000mAh portable charger',
      },
      {
        id: 'op-dien-thoai',
        name: 'Phone Case',
        nameVietnamese: 'Ốp điện thoại',
        basePrice: 80000,
        floorPrice: 40000,
        image: '📱',
        description: 'Protective cases for various phone models',
      },
    ],
  },
  {
    id: 'co-mai',
    name: 'Cô Mai',
    displayName: 'Cô Mai',
    specialty: 'Coffee & Tea',
    avatar: '👩‍🦱',
    greeting: 'Chào cháu! Uống cà phê không? Cô có trà ngon lắm!',
    personality: {
      patience: 5,
      flexibility: 0.45,
      chattiness: 0.9,
      baseMood: 0.8,
    },
    backstory: 'Cô Mai grew up on a coffee plantation in Buôn Ma Thuột. She\'s passionate about Vietnamese coffee culture.',
    catchphrases: [
      'Cà phê Việt Nam số một!',
      'Cháu thử đi!',
      'Thơm lắm!',
      'Cô tặng cháu chút nữa!',
    ],
    items: [
      {
        id: 'ca-phe-robusta',
        name: 'Robusta Coffee',
        nameVietnamese: 'Cà phê Robusta',
        basePrice: 120000,
        floorPrice: 70000,
        image: '☕',
        description: 'Strong Vietnamese robusta beans from the Central Highlands',
      },
      {
        id: 'tra-sen',
        name: 'Lotus Tea',
        nameVietnamese: 'Trà sen',
        basePrice: 150000,
        floorPrice: 90000,
        image: '🍵',
        description: 'Fragrant lotus flower tea, perfect for hot summer days',
      },
      {
        id: 'phin',
        name: 'Coffee Filter',
        nameVietnamese: 'Phin cà phê',
        basePrice: 50000,
        floorPrice: 25000,
        image: '🫖',
        description: 'Traditional Vietnamese drip coffee filter',
      },
    ],
  },
  {
    id: 'chu-nam',
    name: 'Chú Nam',
    displayName: 'Chú Nam',
    specialty: 'Souvenirs',
    avatar: '👴',
    greeting: 'Welcome! Quà lưu niệm đẹp nè! Good price for you!',
    personality: {
      patience: 3,
      flexibility: 0.5,
      chattiness: 0.5,
      baseMood: 0.55,
    },
    backstory: 'Chú Nam speaks multiple languages from dealing with tourists for 30 years. He\'s a tough negotiator but fair.',
    catchphrases: [
      'Special price for you!',
      'Very good quality!',
      'Chú bán rẻ cho!',
      'Last price, I promise!',
    ],
    items: [
      {
        id: 'tranh-son-mai',
        name: 'Lacquer Painting',
        nameVietnamese: 'Tranh sơn mài',
        basePrice: 400000,
        floorPrice: 200000,
        image: '🖼️',
        description: 'Beautiful Vietnamese lacquerware art',
      },
      {
        id: 'gom-bat-trang',
        name: 'Bát Tràng Ceramic',
        nameVietnamese: 'Gốm Bát Tràng',
        basePrice: 250000,
        floorPrice: 120000,
        image: '🏺',
        description: 'Traditional ceramics from famous Bát Tràng village',
      },
      {
        id: 'moc-khoa',
        name: 'Keychain',
        nameVietnamese: 'Móc khóa',
        basePrice: 30000,
        floorPrice: 10000,
        image: '🔑',
        description: 'Cute Vietnamese-themed keychains',
      },
    ],
  },
];

/** Get a vendor by ID */
export function getVendorById(id: string): Vendor | undefined {
  return VENDORS.find((v) => v.id === id);
}

/** Get vendor's item by ID */
export function getVendorItem(vendorId: string, itemId: string) {
  const vendor = getVendorById(vendorId);
  return vendor?.items.find((i) => i.id === itemId);
}
