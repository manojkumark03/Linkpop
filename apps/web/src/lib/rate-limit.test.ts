import { describe, expect, it, beforeEach } from 'vitest';
import { rateLimit, clearRateLimit } from './rate-limit';

describe('Rate Limit', () => {
  beforeEach(() => {
    clearRateLimit('test-identifier');
  });

  it('should allow requests within limit', () => {
    const config = { interval: 60000, maxRequests: 3 };

    expect(rateLimit('test-identifier', config)).toBe(true);
    expect(rateLimit('test-identifier', config)).toBe(true);
    expect(rateLimit('test-identifier', config)).toBe(true);
  });

  it('should block requests exceeding limit', () => {
    const config = { interval: 60000, maxRequests: 2 };

    expect(rateLimit('test-identifier', config)).toBe(true);
    expect(rateLimit('test-identifier', config)).toBe(true);
    expect(rateLimit('test-identifier', config)).toBe(false);
  });

  it('should track different identifiers separately', () => {
    const config = { interval: 60000, maxRequests: 1 };

    expect(rateLimit('identifier-1', config)).toBe(true);
    expect(rateLimit('identifier-2', config)).toBe(true);
    expect(rateLimit('identifier-1', config)).toBe(false);
    expect(rateLimit('identifier-2', config)).toBe(false);
  });

  it('should reset after interval', async () => {
    const config = { interval: 100, maxRequests: 1 };

    expect(rateLimit('test-identifier', config)).toBe(true);
    expect(rateLimit('test-identifier', config)).toBe(false);

    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(rateLimit('test-identifier', config)).toBe(true);
  });

  it('should clear rate limit manually', () => {
    const config = { interval: 60000, maxRequests: 1 };

    expect(rateLimit('test-identifier', config)).toBe(true);
    expect(rateLimit('test-identifier', config)).toBe(false);

    clearRateLimit('test-identifier');

    expect(rateLimit('test-identifier', config)).toBe(true);
  });
});
