import { describe, it, expect } from 'vitest';
import { normalizeThemeSettings } from '../theme-settings';

describe('normalizeThemeSettings', () => {
  it('should return default settings when value is null', () => {
    const result = normalizeThemeSettings(null);
    expect(result.backgroundColor).toBe('#0b1220');
    expect(result.textColor).toBe('#ffffff');
    expect(result.buttonColor).toBe('#ffffff');
    expect(result.buttonTextColor).toBe('#0b1220');
    expect(result.buttonRadius).toBe(12);
    expect(result.backgroundStyle).toBe('solid');
    expect(result.buttonVariant).toBe('solid');
    expect(result.buttonShadow).toBe(true);
    expect(result.textTransform).toBe('none');
  });

  it('should return default settings when value is undefined', () => {
    const result = normalizeThemeSettings(undefined);
    expect(result.backgroundColor).toBe('#0b1220');
    expect(result.textColor).toBe('#ffffff');
    expect(result.buttonColor).toBe('#ffffff');
    expect(result.buttonTextColor).toBe('#0b1220');
    expect(result.buttonRadius).toBe(12);
    expect(result.backgroundStyle).toBe('solid');
  });

  it('should return default settings when value is not an object', () => {
    const result = normalizeThemeSettings('invalid' as any);
    expect(result.backgroundColor).toBe('#0b1220');
    expect(result.textColor).toBe('#ffffff');
    expect(result.buttonColor).toBe('#ffffff');
    expect(result.buttonTextColor).toBe('#0b1220');
    expect(result.buttonRadius).toBe(12);
  });

  it('should merge provided values with defaults', () => {
    const input = {
      backgroundColor: '#ff0000',
      textColor: '#00ff00',
      fontFamily: 'Inter',
      customCss: '/* custom */',
    };
    
    const result = normalizeThemeSettings(input);
    
    expect(result.backgroundColor).toBe('#ff0000');
    expect(result.textColor).toBe('#00ff00');
    expect(result.fontFamily).toBe('Inter');
    expect(result.customCss).toBe('/* custom */');
    expect(result.buttonColor).toBe('#ffffff'); // default
    expect(result.buttonTextColor).toBe('#0b1220'); // default
    expect(result.buttonRadius).toBe(12); // default
  });

  it('should handle advanced theme settings', () => {
    const input = {
      backgroundStyle: 'gradient',
      gradientStops: [
        { color: '#ff0000', position: 0 },
        { color: '#0000ff', position: 100 },
      ],
      gradientAngle: 90,
      buttonVariant: 'outline',
      buttonShadow: false,
      textTransform: 'uppercase',
    };
    
    const result = normalizeThemeSettings(input);
    
    expect(result.backgroundStyle).toBe('gradient');
    expect(result.gradientStops).toEqual([
      { color: '#ff0000', position: 0 },
      { color: '#0000ff', position: 100 },
    ]);
    expect(result.gradientAngle).toBe(90);
    expect(result.buttonVariant).toBe('outline');
    expect(result.buttonShadow).toBe(false);
    expect(result.textTransform).toBe('uppercase');
  });

  it('should handle partial gradient configurations', () => {
    const input = {
      backgroundStyle: 'gradient',
      gradientStops: [
        { color: '#ff0000', position: 0 },
      ],
    };
    
    const result = normalizeThemeSettings(input);
    
    expect(result.backgroundStyle).toBe('gradient');
    expect(result.gradientStops).toEqual([
      { color: '#ff0000', position: 0 },
    ]);
    expect(result.gradientAngle).toBe(45); // default
  });

  it('should validate gradient stops positions', () => {
    const input = {
      gradientStops: [
        { color: '#ff0000', position: -10 }, // invalid position
        { color: '#00ff00', position: 50 },
        { color: '#0000ff', position: 150 }, // invalid position
      ],
    };
    
    const result = normalizeThemeSettings(input);
    
    expect(result.gradientStops).toEqual([
      { color: '#ff0000', position: -10 }, // should preserve invalid values
      { color: '#00ff00', position: 50 },
      { color: '#0000ff', position: 150 },
    ]);
  });

  it('should handle mixed legacy and new theme settings', () => {
    const input = {
      backgroundColor: '#123456', // legacy
      backgroundImageUrl: 'https://example.com/image.jpg', // legacy
      backgroundStyle: 'image', // new
      buttonVariant: 'ghost', // new
      customCss: '/* legacy */', // legacy
    };
    
    const result = normalizeThemeSettings(input);
    
    expect(result.backgroundColor).toBe('#123456');
    expect(result.backgroundImageUrl).toBe('https://example.com/image.jpg');
    expect(result.backgroundStyle).toBe('image');
    expect(result.buttonVariant).toBe('ghost');
    expect(result.customCss).toBe('/* legacy */');
    expect(result.backgroundOverlayOpacity).toBe(0.5); // default
  });
});