'use client';

import { forwardRef } from 'react';

/**
 * Input Component
 *
 * A polished, accessible text input with label and error states.
 * Uses CSS variables for automatic dark mode support.
 *
 * @example
 * <Input label="Email" placeholder="you@example.com" />
 * <Input label="Password" type="password" error="Required" />
 * <Input leftIcon={<Search />} placeholder="Search..." />
 * <Input inputSize="lg" label="Large input" />
 */

type InputSize = 'sm' | 'md' | 'lg';
type InputVariant = 'default' | 'filled';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  hint?: string;
  variant?: InputVariant;
  inputSize?: InputSize;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const sizeStyles: Record<InputSize, { input: string; icon: string }> = {
  sm: {
    input: 'px-3 py-1.5 text-sm rounded-md',
    icon: 'w-4 h-4',
  },
  md: {
    input: 'px-4 py-2.5 text-sm rounded-lg',
    icon: 'w-4 h-4',
  },
  lg: {
    input: 'px-4 py-3 text-base rounded-xl',
    icon: 'w-5 h-5',
  },
};

const variantStyles: Record<InputVariant, string> = {
  default: `
    bg-(--surface-card) border border-(--border-default)
    focus:border-(--border-focus) focus:shadow-[0_0_0_3px_rgba(16,185,129,0.15)]
  `,
  filled: `
    bg-neutral-100 border border-transparent
    focus:bg-(--surface-card) focus:border-(--border-focus) focus:shadow-[0_0_0_3px_rgba(16,185,129,0.15)]
  `,
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      variant = 'default',
      inputSize = 'md',
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
    const hasError = Boolean(error);

    return (
      <div className={`${fullWidth ? 'w-full' : ''}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-(--text-primary) mb-1.5"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div
              className={`
                absolute left-3 top-1/2 -translate-y-1/2
                text-(--text-tertiary)
                ${sizeStyles[inputSize].icon}
              `}
            >
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={`
              w-full
              text-(--text-primary)
              placeholder:text-(--text-disabled)
              transition-all duration-200 ease-out
              focus:outline-none
              disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-neutral-100
              ${variantStyles[variant]}
              ${sizeStyles[inputSize].input}
              ${leftIcon ? 'pl-10' : ''}
              ${rightIcon ? 'pr-10' : ''}
              ${hasError ? 'border-coral-500 focus:border-coral-500 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.15)]' : ''}
              ${className}
            `}
            aria-invalid={hasError}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            {...props}
          />

          {rightIcon && (
            <div
              className={`
                absolute right-3 top-1/2 -translate-y-1/2
                text-(--text-tertiary)
                ${sizeStyles[inputSize].icon}
              `}
            >
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <p
            id={`${inputId}-error`}
            className="mt-1.5 text-sm text-coral-600"
            role="alert"
          >
            {error}
          </p>
        )}

        {hint && !error && (
          <p
            id={`${inputId}-hint`}
            className="mt-1.5 text-sm text-(--text-tertiary)"
          >
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
