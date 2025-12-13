import type { Prisma } from '@prisma/client';

export type ThemeSettings = {
  backgroundColor?: string;
  textColor?: string;
  buttonColor?: string;
  buttonTextColor?: string;
  buttonRadius?: number;
  fontFamily?: string;
  customCss?: string;
};

export const defaultThemeSettings: Required<
  Pick<
    ThemeSettings,
    'backgroundColor' | 'textColor' | 'buttonColor' | 'buttonTextColor' | 'buttonRadius'
  >
> &
  Pick<ThemeSettings, 'fontFamily' | 'customCss'> = {
  backgroundColor: '#0b1220',
  textColor: '#ffffff',
  buttonColor: '#ffffff',
  buttonTextColor: '#0b1220',
  buttonRadius: 12,
  fontFamily: undefined,
  customCss: undefined,
};

export function normalizeThemeSettings(value: Prisma.JsonValue | null | undefined): ThemeSettings {
  if (!value || typeof value !== 'object') return { ...defaultThemeSettings };

  return {
    ...defaultThemeSettings,
    ...(value as Record<string, unknown>),
  } as ThemeSettings;
}
