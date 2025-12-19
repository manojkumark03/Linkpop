import type { NextRequest } from 'next/server';

const COUNTRY_HEADER_CANDIDATES = [
  'x-vercel-ip-country',
  'cf-ipcountry',
  'cloudflare-ipcountry',
  'cloudfront-viewer-country',
  'fly-client-country',
  'x-appengine-country',
  'x-country-code',
];

export function normalizeCountryCode(value: string | null | undefined): string | null {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const code = trimmed.slice(0, 2).toUpperCase();

  // Cloudflare may return "T1" for Tor and "XX" for unknown.
  if (code === 'T1' || code === 'XX') return null;

  if (!/^[A-Z]{2}$/.test(code)) return null;

  return code;
}

export function getCountryFromHeaders(headers: Headers): string | null {
  for (const key of COUNTRY_HEADER_CANDIDATES) {
    const normalized = normalizeCountryCode(headers.get(key));
    if (normalized) return normalized;
  }

  return null;
}

export function getCountryFromRequest(request: NextRequest | Request): string | null {
  // NextRequest exposes request.geo when running on platforms that support geolocation.
  const geoCountry = normalizeCountryCode((request as NextRequest).geo?.country);
  if (geoCountry) return geoCountry;

  return getCountryFromHeaders(request.headers);
}
