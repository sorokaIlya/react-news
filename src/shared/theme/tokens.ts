/**
 * Design tokens — single source of truth for visual primitives.
 *
 * Components must consume from here instead of hardcoding hex values, font
 * sizes, paddings, or border radii. Add a token before reaching for a
 * literal in a stylesheet.
 */

export const colors = {
  primary: '#6C5CE7',
  primaryLight: '#A29BFE',
  background: '#FFFFFF',
  surface: '#F8F9FA',
  surfaceSecondary: '#F0F0F5',
  text: '#1A1A2E',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  border: '#E5E7EB',
  error: '#EF4444',
  like: '#EF4444',
  likeBg: '#FEE2E2',
  white: '#FFFFFF',
  black: '#000000',
  shadow: '#000000',
  overlay: 'rgba(0, 0, 0, 0.05)',
  paidBadge: '#F59E0B',
  paidBadgeBg: '#FEF3C7',
  verified: '#3B82F6',
} as const;

export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radii = {
  none: 0,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

export const typography = {
  h1: { fontSize: 24, fontWeight: '700' as const, lineHeight: 32 },
  h2: { fontSize: 20, fontWeight: '600' as const, lineHeight: 28 },
  h3: { fontSize: 17, fontWeight: '600' as const, lineHeight: 24 },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  bodyMedium: { fontSize: 15, fontWeight: '500' as const, lineHeight: 22 },
  caption: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
  captionMedium: { fontSize: 13, fontWeight: '500' as const, lineHeight: 18 },
  small: { fontSize: 11, fontWeight: '400' as const, lineHeight: 16 },
  smallBold: { fontSize: 11, fontWeight: '700' as const, lineHeight: 16 },
  iconSm: { fontSize: 9, fontWeight: '700' as const, lineHeight: 10 },
  iconMd: { fontSize: 10, fontWeight: '700' as const, lineHeight: 12 },
  iconLg: { fontSize: 18, fontWeight: '400' as const, lineHeight: 22 },
  iconXl: { fontSize: 32, fontWeight: '400' as const, lineHeight: 36 },
  buttonGlyph: { fontSize: 18, fontWeight: '700' as const, lineHeight: 22 },
} as const;

/**
 * Standardised pixel sizes for repeating UI primitives. Avatars and badges
 * appear in multiple components — having a single source prevents drift.
 */
export const sizes = {
  avatar: {
    sm: 32,
    md: 36,
    lg: 44,
  },
  badge: {
    sm: 16,
    md: 18,
  },
  iconButton: 36,
  cover: {
    feed: 200,
    detail: 240,
  },
  inputMaxHeight: 100,
} as const;

export const shadows = {
  sm: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
} as const;

/** Helper: borderRadius for a perfect circle on a square of size `size`. */
export const circle = (size: number) => size / 2;

export type Colors = typeof colors;
export type Spacing = typeof spacing;
export type Radii = typeof radii;
export type Typography = typeof typography;
export type Sizes = typeof sizes;
