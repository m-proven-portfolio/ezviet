'use client';

import { type CoreTier, getCoreTierConfig } from '@/lib/core-tiers';

interface CoreBadgeProps {
  tier: CoreTier;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

/**
 * CoreBadge - Displays the user's EZViet Core tier badge
 *
 * Sizes:
 * - sm: Inline, compact (for user menu, comments)
 * - md: Standard (for profile cards)
 * - lg: Featured (for profile header)
 */
export function CoreBadge({
  tier,
  size = 'md',
  showLabel = true,
  className = '',
}: CoreBadgeProps) {
  const config = getCoreTierConfig(tier);

  const sizeClasses = {
    sm: {
      container: 'px-2 py-0.5 gap-1',
      icon: 'text-sm',
      label: 'text-xs font-medium',
    },
    md: {
      container: 'px-3 py-1 gap-1.5',
      icon: 'text-base',
      label: 'text-sm font-semibold',
    },
    lg: {
      container: 'px-4 py-2 gap-2',
      icon: 'text-xl',
      label: 'text-base font-bold',
    },
  };

  const sizes = sizeClasses[size];

  return (
    <div
      className={`
        inline-flex items-center rounded-full
        bg-gradient-to-r ${config.bgGradient}
        border ${config.borderColor}
        ${sizes.container}
        ${className}
      `}
    >
      <span className={sizes.icon}>{config.icon}</span>
      {showLabel && (
        <span className={`${config.textColor} ${sizes.label}`}>
          {config.label}
        </span>
      )}
    </div>
  );
}

/**
 * CoreBadgeCompact - Just the icon with tooltip
 */
export function CoreBadgeCompact({
  tier,
  className = '',
}: {
  tier: CoreTier;
  className?: string;
}) {
  const config = getCoreTierConfig(tier);

  return (
    <span
      title={`${config.label} - ${config.description}`}
      className={`
        inline-flex items-center justify-center
        w-6 h-6 rounded-full
        bg-gradient-to-r ${config.bgGradient}
        border ${config.borderColor}
        text-sm cursor-help
        ${className}
      `}
    >
      {config.icon}
    </span>
  );
}
