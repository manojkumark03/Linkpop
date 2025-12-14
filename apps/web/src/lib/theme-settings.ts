import type { Prisma } from '@prisma/client';

export type GradientStop = {
  color: string;
  position: number;
};

export type ButtonVariant = 'solid' | 'outline' | 'ghost';
export type BackgroundStyle = 'solid' | 'gradient' | 'image';

export type ThemeSettings = {
  // Basic colors
  backgroundColor?: string;
  textColor?: string;
  buttonColor?: string;
  buttonTextColor?: string;
  buttonRadius?: number;
  fontFamily?: string;
  customCss?: string;
  backgroundImageUrl?: string;
  
  // Advanced appearance
  backgroundStyle?: BackgroundStyle;
  gradientStops?: GradientStop[];
  gradientAngle?: number;
  backgroundOverlayOpacity?: number;
  buttonVariant?: ButtonVariant;
  buttonShadow?: boolean;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
};

export const defaultThemeSettings: Required<
  Pick<
    ThemeSettings,
    'backgroundColor' | 'textColor' | 'buttonColor' | 'buttonTextColor' | 'buttonRadius'
  >
> &
  Pick<
    ThemeSettings,
    | 'fontFamily'
    | 'customCss'
    | 'backgroundImageUrl'
    | 'backgroundStyle'
    | 'gradientStops'
    | 'gradientAngle'
    | 'backgroundOverlayOpacity'
    | 'buttonVariant'
    | 'buttonShadow'
    | 'textTransform'
  > = {
  backgroundColor: '#0b1220',
  textColor: '#ffffff',
  buttonColor: '#ffffff',
  buttonTextColor: '#0b1220',
  buttonRadius: 12,
  fontFamily: undefined,
  customCss: undefined,
  backgroundImageUrl: undefined,
  backgroundStyle: 'solid',
  gradientStops: [
    { color: '#0b1220', position: 0 },
    { color: '#1e293b', position: 100 },
  ],
  gradientAngle: 45,
  backgroundOverlayOpacity: 0.5,
  buttonVariant: 'solid',
  buttonShadow: true,
  textTransform: 'none',
};

export function normalizeThemeSettings(value: Prisma.JsonValue | null | undefined): ThemeSettings {
  if (!value || typeof value !== 'object') return { ...defaultThemeSettings };

  return {
    ...defaultThemeSettings,
    ...(value as Record<string, unknown>),
  } as ThemeSettings;
}
