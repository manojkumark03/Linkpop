import { type NextRequest } from 'next/server';
import type { DeviceType } from '@prisma/client';

export function getClientInfo(request: NextRequest) {
  const userAgent = request.headers.get('user-agent');
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const referer = request.headers.get('referer');
  
  const ip = forwarded?.split(',')[0] || realIp || '127.0.0.1';
  const referrer = referer || undefined;

  // Simple device type detection
  const deviceType = detectDeviceType(userAgent);
  
  // For a more sophisticated implementation, you might use a geo-IP service
  const country = undefined; // Would need to look up IP to country

  return {
    userAgent: userAgent || undefined,
    ipAddress: ip,
    country,
    referrer,
    deviceType,
  };
}

function detectDeviceType(userAgent?: string | null): DeviceType {
  if (!userAgent) return 'UNKNOWN';
  
  const ua = userAgent.toLowerCase();
  
  if (ua.includes('mobile')) {
    return 'MOBILE';
  }
  
  if (ua.includes('tablet') || ua.includes('ipad')) {
    return 'TABLET';
  }
  
  if (ua.includes('bot') || ua.includes('spider') || ua.includes('crawler')) {
    return 'BOT';
  }
  
  if (ua.includes('mozilla') && ua.includes('gecko')) {
    return 'DESKTOP';
  }
  
  return 'UNKNOWN';
}