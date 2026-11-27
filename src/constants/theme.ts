import { Platform } from 'react-native';

/**
 * Kozé palette. High contrast by design: users may have low vision,
 * cognitive impairments, or use the app under stress.
 */
export const Colors = {
  light: {
    text: '#111418',
    textSecondary: '#4A5160',
    background: '#F7F5F0',
    surface: '#FFFFFF',
    border: '#D9D5CC',
    accent: '#1F6FEB',
    accentText: '#FFFFFF',
    folder: '#FFF1C9',
    danger: '#C62828',
  },
  dark: {
    text: '#F4F2EE',
    textSecondary: '#B4BAC5',
    background: '#121418',
    surface: '#1D2026',
    border: '#343842',
    accent: '#5B9BFF',
    accentText: '#0B0D10',
    folder: '#4A3F1E',
    danger: '#FF6B6B',
  },
} as const;

export type Palette = { [K in keyof typeof Colors.light]: string };

export const Spacing = {
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
} as const;

export const Radius = {
  tile: 16,
  bar: 20,
} as const;

/** Minimum touch target. Well above the 44pt HIG minimum on purpose. */
export const MinTouch = 64;

export const Fonts = Platform.select({
  ios: { rounded: 'ui-rounded' },
  default: { rounded: 'normal' },
});
