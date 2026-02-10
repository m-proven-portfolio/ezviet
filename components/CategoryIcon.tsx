'use client';

import * as LucideIcons from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface CategoryIconProps {
  icon: string | null | undefined;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

// Map size to pixels
const sizeMap = {
  sm: { container: 'w-8 h-8', icon: 16, text: 'text-lg' },
  md: { container: 'w-10 h-10', icon: 20, text: 'text-xl' },
  lg: { container: 'w-12 h-12', icon: 24, text: 'text-2xl' },
  xl: { container: 'w-16 h-16', icon: 32, text: 'text-3xl' },
};

/**
 * Renders a category icon - either emoji or Lucide icon
 * Format: "emoji:🍎" or "lucide:apple" or just "🍎" (legacy emoji)
 */
export function CategoryIcon({ icon, size = 'md', className = '' }: CategoryIconProps) {
  const sizeConfig = sizeMap[size];

  // Default fallback
  if (!icon) {
    return (
      <div className={`${sizeConfig.container} bg-gray-100 rounded-xl flex items-center justify-center ${sizeConfig.text} ${className}`}>
        📁
      </div>
    );
  }

  // Check if it's a Lucide icon
  if (icon.startsWith('lucide:')) {
    const iconName = icon.replace('lucide:', '');
    // Convert kebab-case to PascalCase for Lucide
    const pascalName = iconName
      .split('-')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');

    const IconComponent = (LucideIcons as unknown as Record<string, LucideIcon>)[pascalName];

    if (IconComponent) {
      return (
        <div className={`${sizeConfig.container} bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 ${className}`}>
          <IconComponent size={sizeConfig.icon} />
        </div>
      );
    }
    // Fallback if icon not found
    return (
      <div className={`${sizeConfig.container} bg-gray-100 rounded-xl flex items-center justify-center ${sizeConfig.text} ${className}`}>
        📁
      </div>
    );
  }

  // Handle emoji format (either "emoji:🍎" or just "🍎")
  const emoji = icon.startsWith('emoji:') ? icon.replace('emoji:', '') : icon;

  return (
    <div className={`${sizeConfig.container} bg-gray-100 rounded-xl flex items-center justify-center ${sizeConfig.text} ${className}`}>
      {emoji}
    </div>
  );
}

/**
 * Get display-friendly icon name
 */
export function getIconDisplayName(icon: string | null | undefined): string {
  if (!icon) return 'No icon';
  if (icon.startsWith('lucide:')) {
    return icon.replace('lucide:', '').split('-').join(' ');
  }
  return icon.startsWith('emoji:') ? icon.replace('emoji:', '') : icon;
}

/**
 * Map Lucide icon names to similar emoji for native <select> elements
 */
const LUCIDE_TO_EMOJI: Record<string, string> = {
  'heart': '❤️',
  'star': '⭐',
  'home': '🏠',
  'user': '👤',
  'users': '👥',
  'settings': '⚙️',
  'search': '🔍',
  'mail': '✉️',
  'phone': '📞',
  'camera': '📷',
  'music': '🎵',
  'video': '🎬',
  'book': '📖',
  'bookmark': '🔖',
  'calendar': '📅',
  'clock': '🕐',
  'map': '🗺️',
  'map-pin': '📍',
  'sun': '☀️',
  'moon': '🌙',
  'cloud': '☁️',
  'zap': '⚡',
  'flame': '🔥',
  'droplet': '💧',
  'leaf': '🍃',
  'tree': '🌳',
  'flower': '🌸',
  'gift': '🎁',
  'shopping-cart': '🛒',
  'shopping-bag': '🛍️',
  'credit-card': '💳',
  'dollar-sign': '💵',
  'trophy': '🏆',
  'medal': '🏅',
  'flag': '🚩',
  'bell': '🔔',
  'lock': '🔒',
  'key': '🔑',
  'eye': '👁️',
  'thumbs-up': '👍',
  'thumbs-down': '👎',
  'smile': '😊',
  'frown': '☹️',
  'coffee': '☕',
  'utensils': '🍴',
  'wine': '🍷',
  'beer': '🍺',
  'pizza': '🍕',
  'apple': '🍎',
  'car': '🚗',
  'plane': '✈️',
  'train': '🚂',
  'bike': '🚲',
  'globe': '🌍',
  'compass': '🧭',
  'anchor': '⚓',
  'rocket': '🚀',
  'gamepad': '🎮',
  'headphones': '🎧',
  'mic': '🎤',
  'pen': '✏️',
  'pencil': '✏️',
  'brush': '🖌️',
  'palette': '🎨',
  'scissors': '✂️',
  'trash': '🗑️',
  'folder': '📁',
  'file': '📄',
  'image': '🖼️',
  'film': '🎞️',
  'tv': '📺',
  'monitor': '🖥️',
  'smartphone': '📱',
  'tablet': '📱',
  'laptop': '💻',
  'printer': '🖨️',
  'wifi': '📶',
  'battery': '🔋',
  'plug': '🔌',
  'lightbulb': '💡',
  'tool': '🔧',
  'wrench': '🔧',
  'hammer': '🔨',
  'shield': '🛡️',
  'target': '🎯',
  'award': '🏆',
  'crown': '👑',
  'gem': '💎',
  'ring': '💍',
};

/**
 * Get icon for use in native <select> options (text only, no SVG)
 * Returns emoji directly, or maps Lucide icons to similar emoji
 */
export function getIconForSelect(icon: string | null | undefined): string {
  if (!icon) return '📁';

  // Handle lucide icons - map to emoji equivalents
  if (icon.startsWith('lucide:')) {
    const iconName = icon.replace('lucide:', '').trim();
    return LUCIDE_TO_EMOJI[iconName] || '◆';
  }

  // Handle emoji: prefix (with or without space after colon)
  if (icon.startsWith('emoji:')) {
    return icon.replace('emoji:', '').trim();
  }

  return icon;
}
