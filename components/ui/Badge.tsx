'use client';

import { forwardRef } from 'react';

/**
 * Badge Component
 *
 * Small labels for status, metadata, and categorization.
 * Uses design system tokens for consistent styling.
 *
 * @example
 * <Badge>Default</Badge>
 * <Badge variant="success">Published</Badge>
 * <Badge variant="warning" size="sm">Draft</Badge>
 * <Badge variant="jade" dot>Active</Badge>
 */

type BadgeVariant = 'default' | 'jade' | 'amber' | 'coral' | 'success' | 'warning' | 'error';
type BadgeSize = 'sm' | 'md';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  icon?: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-neutral-100 text-neutral-700 border-neutral-200',
  jade: 'bg-jade-50 text-jade-700 border-jade-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  coral: 'bg-coral-50 text-coral-700 border-coral-200',
  success: 'bg-jade-50 text-jade-700 border-jade-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  error: 'bg-coral-50 text-coral-700 border-coral-200',
};

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-neutral-500',
  jade: 'bg-jade-500',
  amber: 'bg-amber-500',
  coral: 'bg-coral-500',
  success: 'bg-jade-500',
  warning: 'bg-amber-500',
  error: 'bg-coral-500',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      variant = 'default',
      size = 'md',
      dot = false,
      icon,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    return (
      <span
        ref={ref}
        className={`
          inline-flex items-center gap-1.5
          font-medium
          rounded-full
          border
          whitespace-nowrap
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${className}
        `}
        {...props}
      >
        {dot && (
          <span
            className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`}
            aria-hidden="true"
          />
        )}
        {icon && <span className="flex-shrink-0">{icon}</span>}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

/**
 * BadgeGroup - Container for multiple badges
 */
interface BadgeGroupProps extends React.HTMLAttributes<HTMLDivElement> {}

export function BadgeGroup({ className = '', children, ...props }: BadgeGroupProps) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`} {...props}>
      {children}
    </div>
  );
}
