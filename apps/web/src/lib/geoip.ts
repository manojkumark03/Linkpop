const countryRegex = /^[A-Z]{2}$/;

const cache = new Map<string, { country: string | null; expiresAt: number }>();

function normalizeIp(raw: string): string {
  return raw.trim().replace(/^"|"$/g, '').replace(/\s+/g, '').replace(/:\d+$/, '');
}

export function getClientIpFromHeaders(headers: Headers): string | null {
  const candidates = [
    headers.get('cf-connecting-ip'),
    headers.get('x-real-ip'),
    headers.get('x-client-ip'),
    headers.get('x-forwarded-for'),
  ]
    .filter(Boolean)
    .flatMap((v) => String(v).split(','));

  for (const candidate of candidates) {
    const ip = normalizeIp(candidate);
    if (!ip) continue;
    if (
      ip === '::1' ||
      ip.startsWith('127.') ||
      ip.startsWith('10.') ||
      ip.startsWith('192.168.')
    ) {
      continue;
    }
    if (ip.startsWith('172.')) {
      const second = Number(ip.split('.')[1]);
      if (!Number.isNaN(second) && second >= 16 && second <= 31) continue;
    }
    return ip;
  }

  return null;
}

function getCountryFromHeaders(headers: Headers): string | null {
  const country =
    headers.get('x-vercel-ip-country') ||
    headers.get('cf-ipcountry') ||
    headers.get('cloudflare-ipcountry') ||
    headers.get('x-country');

  if (!country) return null;
  const normalized = country.trim().slice(0, 2).toUpperCase();
  return countryRegex.test(normalized) ? normalized : null;
}

export function shouldSkipAnalytics(headers: Headers): boolean {
  return headers.get('dnt') === '1' || headers.get('sec-gpc') === '1';
}

async function lookupCountryFromIp(ip: string): Promise<string | null> {
  const cached = cache.get(ip);
  if (cached && cached.expiresAt > Date.now()) return cached.country;

  const url = `https://ipapi.co/${encodeURIComponent(ip)}/country/`;

  let country: string | null = null;
  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'text/plain',
        'User-Agent': 'Linkforest Analytics',
      },
      cache: 'no-store',
    });

    if (response.ok) {
      const text = (await response.text()).trim().toUpperCase();
      country = countryRegex.test(text) ? text : null;
    }
  } catch {
    country = null;
  }

  cache.set(ip, {
    country,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
  });

  return country;
}

export async function resolveCountry(headers: Headers): Promise<string | null> {
  const headerCountry = getCountryFromHeaders(headers);
  const ip = getClientIpFromHeaders(headers);

  if (!ip) return headerCountry;

  const ipCountry = await lookupCountryFromIp(ip);
  return ipCountry ?? headerCountry;
}
