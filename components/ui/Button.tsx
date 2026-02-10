'use client';

import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Button Component
 *
 * A polished, accessible button with multiple variants.
 * Uses the EZViet design system tokens for consistency.
 *
 * @example
 * <Button>Default</Button>
 * <Button variant="secondary">Secondary</Button>
 * <Button variant="ghost" size="sm">Ghost Small</Button>
 * <Button isLoading>Loading...</Button>
 */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: `
    bg-jade-500 text-white
    hover:bg-jade-600
    active:bg-jade-700
    focus-visible:ring-jade-500/30
    shadow-sm hover:shadow-md
  `,
  secondary: `
    bg-transparent text-jade-600
    border border-jade-300
    hover:bg-jade-50 hover:border-jade-400
    active:bg-jade-100
    focus-visible:ring-jade-500/30
  `,
  ghost: `
    bg-transparent text-neutral-600
    hover:bg-neutral-100 hover:text-neutral-800
    active:bg-neutral-200
    focus-visible:ring-neutral-500/30
  `,
  danger: `
    bg-coral-500 text-white
    hover:bg-coral-600
    active:bg-coral-700
    focus-visible:ring-coral-500/30
    shadow-sm hover:shadow-md
  `,
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm gap-1.5 rounded-md',
  md: 'px-4 py-2.5 text-sm gap-2 rounded-lg',
  lg: 'px-6 py-3 text-base gap-2 rounded-xl',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={`
          inline-flex items-center justify-center
          font-medium
          transition-all duration-200 ease-out
          focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
          active:scale-[0.98]
          select-none
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
