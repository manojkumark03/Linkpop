import type { DeviceType } from '@prisma/client';

export function detectDeviceType(userAgent: string | null | undefined): DeviceType {
  const ua = (userAgent ?? '').toLowerCase();

  if (!ua) return 'UNKNOWN';
  if (/(bot|crawler|spider|crawling)/.test(ua)) return 'BOT';
  if (/(tablet|ipad)/.test(ua)) return 'TABLET';
  if (/(mobi|iphone|android)/.test(ua)) return 'MOBILE';

  return 'DESKTOP';
}
