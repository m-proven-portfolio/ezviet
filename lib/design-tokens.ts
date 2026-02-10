/**
 * ═══════════════════════════════════════════════════════════════════════════════
 *                          EZViet Design System
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * A cohesive design language inspired by Vietnamese aesthetics:
 * - The deep greens of rice paddies at dawn
 * - The warm glow of Hội An lanterns
 * - The calm of lotus ponds
 * - The energy of Saigon street life
 *
 * This system enforces visual harmony through:
 * 1. A restrained color palette (one primary, one accent, neutrals)
 * 2. Consistent spacing based on 4px grid
 * 3. Typography that serves language learning
 * 4. Shadows that create depth without weight
 * 5. Animations that delight without distraction
 *
 * ─────────────────────────────────────────────────────────────────────────────────
 */

// ═══════════════════════════════════════════════════════════════════════════════
//                                   COLORS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Core Palette
 *
 * We use HSL for precise control. Each color has semantic meaning:
 * - Jade: Primary actions, progress, learning (growth, nature)
 * - Amber: Achievements, rewards, highlights (lantern warmth)
 * - Coral: Warnings, destructive actions (attention)
 * - Neutral: Everything else (content, surfaces)
 */
export const colors = {
  // ─────────────────────────────────────────────────────────────────────────────
  // JADE (Primary) - The color of growth and learning
  // Inspired by Vietnamese jade and tea leaves
  // ─────────────────────────────────────────────────────────────────────────────
  jade: {
    50: 'hsl(158, 64%, 96%)',   // Surfaces, hover states
    100: 'hsl(158, 58%, 90%)',  // Light backgrounds
    200: 'hsl(160, 52%, 78%)',  // Borders
    300: 'hsl(161, 48%, 64%)',  // Disabled states
    400: 'hsl(162, 45%, 48%)',  // Secondary actions
    500: 'hsl(163, 72%, 38%)',  // ★ PRIMARY - Main actions, links
    600: 'hsl(164, 78%, 31%)',  // Hover state for primary
    700: 'hsl(165, 82%, 25%)',  // Active/pressed state
    800: 'hsl(166, 84%, 20%)',  // Text on light backgrounds
    900: 'hsl(167, 86%, 14%)',  // High contrast text
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // AMBER (Accent) - The color of achievement and warmth
  // Inspired by Hội An lanterns and Vietnamese gold
  // ─────────────────────────────────────────────────────────────────────────────
  amber: {
    50: 'hsl(45, 100%, 96%)',
    100: 'hsl(45, 96%, 89%)',
    200: 'hsl(44, 94%, 78%)',
    300: 'hsl(43, 92%, 65%)',
    400: 'hsl(42, 90%, 55%)',   // ★ Badges, achievements
    500: 'hsl(40, 88%, 48%)',   // Primary accent
    600: 'hsl(38, 90%, 42%)',
    700: 'hsl(35, 92%, 35%)',
    800: 'hsl(32, 90%, 28%)',
    900: 'hsl(28, 88%, 22%)',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // CORAL (Warning/Danger) - Attention and caution
  // Used sparingly for destructive actions and errors
  // ─────────────────────────────────────────────────────────────────────────────
  coral: {
    50: 'hsl(8, 100%, 97%)',
    100: 'hsl(8, 94%, 92%)',
    200: 'hsl(7, 90%, 84%)',
    300: 'hsl(6, 86%, 72%)',
    400: 'hsl(5, 82%, 62%)',    // ★ Warnings
    500: 'hsl(4, 78%, 52%)',    // Errors, destructive
    600: 'hsl(3, 80%, 44%)',
    700: 'hsl(2, 82%, 36%)',
    800: 'hsl(1, 84%, 28%)',
    900: 'hsl(0, 86%, 22%)',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // NEUTRAL (Slate with warm undertone)
  // Everything that isn't a call-to-action
  // ─────────────────────────────────────────────────────────────────────────────
  neutral: {
    0: 'hsl(0, 0%, 100%)',      // Pure white (cards, inputs)
    50: 'hsl(40, 10%, 98%)',    // Page background
    100: 'hsl(40, 8%, 95%)',    // Subtle backgrounds
    200: 'hsl(38, 6%, 90%)',    // Borders, dividers
    300: 'hsl(36, 5%, 80%)',    // Disabled text
    400: 'hsl(34, 4%, 64%)',    // Placeholder text
    500: 'hsl(32, 3%, 48%)',    // Secondary text
    600: 'hsl(30, 4%, 36%)',    // Body text
    700: 'hsl(28, 5%, 26%)',    // Headings
    800: 'hsl(26, 6%, 18%)',    // High emphasis text
    900: 'hsl(24, 8%, 10%)',    // Maximum contrast
  },
} as const;

/**
 * Semantic Color Tokens
 *
 * Use these instead of raw palette colors. They express intent:
 * - What the color DOES, not what it IS
 * - Enables consistent theming and dark mode
 */
export const semantic = {
  // Interactive elements
  interactive: {
    default: colors.jade[500],
    hover: colors.jade[600],
    active: colors.jade[700],
    subtle: colors.jade[50],
    subtleHover: colors.jade[100],
  },

  // Text hierarchy
  text: {
    primary: colors.neutral[800],     // Main content
    secondary: colors.neutral[600],   // Supporting text
    tertiary: colors.neutral[500],    // Captions, metadata
    disabled: colors.neutral[400],    // Inactive elements
    inverse: colors.neutral[0],       // Text on dark backgrounds
    link: colors.jade[600],           // Links in body text
    linkHover: colors.jade[700],
  },

  // Surfaces and backgrounds
  surface: {
    page: colors.neutral[50],         // Page background
    card: colors.neutral[0],          // Card backgrounds
    cardHover: colors.neutral[50],    // Card hover state
    elevated: colors.neutral[0],      // Modals, dropdowns
    overlay: 'hsla(24, 8%, 10%, 0.6)', // Modal overlays
  },

  // Borders
  border: {
    default: colors.neutral[200],
    subtle: colors.neutral[100],
    strong: colors.neutral[300],
    interactive: colors.jade[300],
    focus: colors.jade[500],
  },

  // Feedback states
  feedback: {
    success: colors.jade[500],
    successSubtle: colors.jade[50],
    warning: colors.amber[500],
    warningSubtle: colors.amber[50],
    error: colors.coral[500],
    errorSubtle: colors.coral[50],
    info: colors.jade[400],
    infoSubtle: colors.jade[50],
  },

  // Achievement/gamification (use sparingly!)
  achievement: {
    gold: colors.amber[400],
    goldSubtle: colors.amber[50],
    streak: colors.amber[500],
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
//                                  SPACING
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * 4px base grid system
 *
 * Consistent spacing creates rhythm and reduces decision fatigue.
 * Use these values for margin, padding, and gap.
 */
export const spacing = {
  px: '1px',
  0: '0',
  0.5: '0.125rem',  // 2px
  1: '0.25rem',     // 4px
  1.5: '0.375rem',  // 6px
  2: '0.5rem',      // 8px  ★ Tight spacing (icon gaps)
  3: '0.75rem',     // 12px ★ Default component padding
  4: '1rem',        // 16px ★ Standard spacing
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px ★ Section padding
  8: '2rem',        // 32px ★ Large section gaps
  10: '2.5rem',     // 40px
  12: '3rem',       // 48px ★ Page margins
  16: '4rem',       // 64px
  20: '5rem',       // 80px ★ Hero sections
  24: '6rem',       // 96px
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
//                                 TYPOGRAPHY
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Typography Scale
 *
 * Optimized for language learning:
 * - Clear hierarchy for Vietnamese text
 * - Generous line height for diacritics
 * - Readable sizes on mobile
 */
export const typography = {
  // Font families
  family: {
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji"',
    mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace',
  },

  // Font sizes with line heights (rem/rem)
  // Each size is a tuple: [fontSize, lineHeight]
  size: {
    xs: ['0.75rem', '1rem'],       // 12px/16px - Micro text, timestamps
    sm: ['0.875rem', '1.25rem'],   // 14px/20px - Captions, metadata
    base: ['1rem', '1.5rem'],      // 16px/24px - Body text ★
    lg: ['1.125rem', '1.75rem'],   // 18px/28px - Large body, lead text
    xl: ['1.25rem', '1.875rem'],   // 20px/30px - Section headers
    '2xl': ['1.5rem', '2rem'],     // 24px/32px - Card titles
    '3xl': ['1.875rem', '2.25rem'], // 30px/36px - Page headers
    '4xl': ['2.25rem', '2.5rem'],  // 36px/40px - Hero text
    '5xl': ['3rem', '3rem'],       // 48px/48px - Display
  },

  // Font weights
  weight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },

  // Letter spacing
  tracking: {
    tighter: '-0.02em',
    tight: '-0.01em',
    normal: '0',
    wide: '0.01em',
    wider: '0.02em',
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
//                               BORDER RADIUS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Border Radius Scale
 *
 * Consistent curves create cohesive UI:
 * - Smaller radii for inline elements
 * - Larger radii for cards and containers
 */
export const radius = {
  none: '0',
  sm: '0.25rem',    // 4px  - Badges, small chips
  DEFAULT: '0.5rem', // 8px  - Buttons, inputs ★
  md: '0.75rem',    // 12px - Cards, dropdowns
  lg: '1rem',       // 16px - Large cards, modals
  xl: '1.5rem',     // 24px - Hero images
  '2xl': '2rem',    // 32px - Full-bleed sections
  full: '9999px',   // Pills, avatars
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
//                                  SHADOWS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Shadow Scale
 *
 * Shadows create depth and hierarchy. We use multiple layers
 * for a more natural, sophisticated appearance.
 */
export const shadows = {
  none: 'none',

  // Subtle elevation - cards, containers
  sm: `
    0 1px 2px 0 hsla(24, 8%, 10%, 0.03),
    0 1px 3px 0 hsla(24, 8%, 10%, 0.05)
  `.trim().replace(/\s+/g, ' '),

  // Default elevation - dropdowns, popovers
  DEFAULT: `
    0 2px 4px 0 hsla(24, 8%, 10%, 0.03),
    0 4px 8px 0 hsla(24, 8%, 10%, 0.06),
    0 1px 2px 0 hsla(24, 8%, 10%, 0.04)
  `.trim().replace(/\s+/g, ' '),

  // Medium elevation - modals, dialogs
  md: `
    0 4px 8px 0 hsla(24, 8%, 10%, 0.04),
    0 8px 16px 0 hsla(24, 8%, 10%, 0.06),
    0 2px 4px 0 hsla(24, 8%, 10%, 0.04)
  `.trim().replace(/\s+/g, ' '),

  // High elevation - toasts, notifications
  lg: `
    0 8px 16px 0 hsla(24, 8%, 10%, 0.05),
    0 16px 32px 0 hsla(24, 8%, 10%, 0.08),
    0 4px 8px 0 hsla(24, 8%, 10%, 0.04)
  `.trim().replace(/\s+/g, ' '),

  // Maximum elevation - overlays
  xl: `
    0 16px 32px 0 hsla(24, 8%, 10%, 0.08),
    0 32px 64px 0 hsla(24, 8%, 10%, 0.1),
    0 8px 16px 0 hsla(24, 8%, 10%, 0.04)
  `.trim().replace(/\s+/g, ' '),

  // Inset shadow for inputs
  inner: 'inset 0 1px 2px 0 hsla(24, 8%, 10%, 0.05)',

  // Focus ring
  focus: `0 0 0 3px ${colors.jade[500]}33`,
  focusError: `0 0 0 3px ${colors.coral[500]}33`,
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
//                                 ANIMATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Animation Tokens
 *
 * Consistent motion creates personality. We use Apple's
 * spring-based timing for natural feel.
 */
export const animation = {
  // Duration
  duration: {
    instant: '0ms',
    fast: '100ms',      // Hover states, toggles
    normal: '200ms',    // Most transitions ★
    slow: '300ms',      // Page transitions, modals
    slower: '500ms',    // Complex animations
  },

  // Easing curves
  easing: {
    // Standard - most UI transitions
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',

    // Ease out - elements entering
    out: 'cubic-bezier(0, 0, 0.2, 1)',

    // Ease in - elements leaving
    in: 'cubic-bezier(0.4, 0, 1, 1)',

    // Spring - playful interactions (Apple-style)
    spring: 'cubic-bezier(0.32, 0.72, 0, 1)',

    // Bounce - achievement celebrations
    bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
//                                 Z-INDEX
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Z-Index Scale
 *
 * Layering system to prevent z-index wars.
 */
export const zIndex = {
  behind: -1,
  base: 0,
  raised: 10,        // Cards with hover states
  dropdown: 100,     // Dropdowns, popovers
  sticky: 200,       // Sticky headers
  overlay: 300,      // Modal backdrops
  modal: 400,        // Modals, dialogs
  toast: 500,        // Toasts, notifications
  tooltip: 600,      // Tooltips
  max: 9999,         // Emergency override only
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
//                              BREAKPOINTS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Responsive Breakpoints
 *
 * Mobile-first design. These match Tailwind defaults.
 */
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
//                           COMPONENT RECIPES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Pre-composed styles for common patterns.
 * Use these as starting points for consistency.
 */
export const recipes = {
  // Primary button
  buttonPrimary: {
    backgroundColor: colors.jade[500],
    color: colors.neutral[0],
    borderRadius: radius.DEFAULT,
    padding: `${spacing[3]} ${spacing[6]}`,
    fontWeight: typography.weight.medium,
    boxShadow: shadows.sm,
    transition: `all ${animation.duration.normal} ${animation.easing.default}`,
    hover: {
      backgroundColor: colors.jade[600],
      boxShadow: shadows.DEFAULT,
    },
    active: {
      backgroundColor: colors.jade[700],
      transform: 'scale(0.98)',
    },
  },

  // Secondary button
  buttonSecondary: {
    backgroundColor: 'transparent',
    color: colors.jade[600],
    border: `1px solid ${colors.jade[300]}`,
    borderRadius: radius.DEFAULT,
    padding: `${spacing[3]} ${spacing[6]}`,
    fontWeight: typography.weight.medium,
    transition: `all ${animation.duration.normal} ${animation.easing.default}`,
    hover: {
      backgroundColor: colors.jade[50],
      borderColor: colors.jade[400],
    },
  },

  // Card container
  card: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.md,
    boxShadow: shadows.sm,
    border: `1px solid ${colors.neutral[100]}`,
    transition: `all ${animation.duration.normal} ${animation.easing.default}`,
    hover: {
      boxShadow: shadows.DEFAULT,
      borderColor: colors.neutral[200],
    },
  },

  // Input field
  input: {
    backgroundColor: colors.neutral[0],
    border: `1px solid ${colors.neutral[200]}`,
    borderRadius: radius.DEFAULT,
    padding: `${spacing[3]} ${spacing[4]}`,
    fontSize: typography.size.base[0],
    lineHeight: typography.size.base[1],
    color: colors.neutral[800],
    boxShadow: shadows.inner,
    transition: `all ${animation.duration.fast} ${animation.easing.default}`,
    focus: {
      borderColor: colors.jade[500],
      boxShadow: shadows.focus,
      outline: 'none',
    },
    placeholder: {
      color: colors.neutral[400],
    },
  },

  // Badge/chip
  badge: {
    backgroundColor: colors.neutral[100],
    color: colors.neutral[700],
    borderRadius: radius.full,
    padding: `${spacing[1]} ${spacing[3]}`,
    fontSize: typography.size.xs[0],
    lineHeight: typography.size.xs[1],
    fontWeight: typography.weight.medium,
  },

  // Success badge
  badgeSuccess: {
    backgroundColor: colors.jade[50],
    color: colors.jade[700],
  },

  // Achievement badge
  badgeAchievement: {
    backgroundColor: colors.amber[50],
    color: colors.amber[700],
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
//                            UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get a CSS variable reference
 * @example cssVar('jade-500') => 'var(--color-jade-500)'
 */
export function cssVar(name: string): string {
  return `var(--${name})`;
}

/**
 * Generate focus ring styles
 */
export function focusRing(color = colors.jade[500]): string {
  return `0 0 0 3px ${color}33`;
}

/**
 * Create a color with alpha
 * @example withAlpha(colors.jade[500], 0.5)
 */
export function withAlpha(hslColor: string, alpha: number): string {
  // Convert hsl() to hsla()
  return hslColor.replace('hsl(', 'hsla(').replace(')', `, ${alpha})`);
}

// ═══════════════════════════════════════════════════════════════════════════════
//                              TYPE EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export type ColorScale = typeof colors.jade;
export type SpacingScale = typeof spacing;
export type RadiusScale = typeof radius;
export type ShadowScale = typeof shadows;
export type TypographyScale = typeof typography;
export type SemanticColors = typeof semantic;

// Default export for convenience
const designTokens = {
  colors,
  semantic,
  spacing,
  typography,
  radius,
  shadows,
  animation,
  zIndex,
  breakpoints,
  recipes,
} as const;

export default designTokens;
