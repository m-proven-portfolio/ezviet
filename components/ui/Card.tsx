'use client';

import { forwardRef } from 'react';

/**
 * Card Component
 *
 * A versatile container with consistent styling from the design system.
 * Supports different padding sizes, hover effects, and interactive states.
 *
 * @example
 * <Card>Basic card content</Card>
 * <Card hover>Card with hover lift effect</Card>
 * <Card padding="lg" className="custom-class">Large padding card</Card>
 */

type CardPadding = 'none' | 'sm' | 'md' | 'lg';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: CardPadding;
  hover?: boolean;
  as?: 'div' | 'article' | 'section';
}

const paddingStyles: Record<CardPadding, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4 sm:p-5',
  lg: 'p-5 sm:p-6',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      padding = 'md',
      hover = false,
      as: Component = 'div',
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    return (
      <Component
        ref={ref}
        className={`
          bg-[var(--surface-card)]
          border border-[var(--border-subtle)]
          rounded-xl
          shadow-sm
          transition-all duration-200 ease-out
          ${hover ? 'hover:shadow-md hover:-translate-y-0.5 hover:border-[var(--border-default)] cursor-pointer' : ''}
          ${paddingStyles[padding]}
          ${className}
        `}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Card.displayName = 'Card';

/**
 * CardHeader - Semantic header section for cards
 */
interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function CardHeader({
  title,
  subtitle,
  action,
  className = '',
  children,
  ...props
}: CardHeaderProps) {
  return (
    <div
      className={`flex items-start justify-between gap-4 ${className}`}
      {...props}
    >
      {(title || subtitle) ? (
        <div className="flex-1 min-w-0">
          {title && (
            <h3 className="text-lg font-semibold text-[var(--text-primary)] truncate">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      ) : children}
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

/**
 * CardContent - Main content area
 */
interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CardContent({ className = '', children, ...props }: CardContentProps) {
  return (
    <div className={`mt-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

/**
 * CardFooter - Footer section for actions
 */
interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  border?: boolean;
}

export function CardFooter({ border = true, className = '', children, ...props }: CardFooterProps) {
  return (
    <div
      className={`
        mt-4 pt-4 flex items-center gap-3
        ${border ? 'border-t border-[var(--border-subtle)]' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}
