import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  validateImageUrl, 
  formatGoogleDriveUrl, 
  getImageUrlHelpText,
  getGoogleDriveInstructions,
  getImgbbInstructions 
} from './image-url';

describe('image-url validation', () => {
  describe('validateImageUrl', () => {
    it('should validate valid image URLs', async () => {
      // Mock fetch for successful requests
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'image/jpeg' })
      });

      const result = await validateImageUrl('https://example.com/image.jpg');
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid URL formats', async () => {
      const result = await validateImageUrl('not-a-url');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid URL format');
    });

    it('should reject non-HTTP protocols', async () => {
      const result = await validateImageUrl('ftp://example.com/image.jpg');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('HTTP or HTTPS protocol');
    });

    it('should handle CORS errors gracefully', async () => {
      // Mock fetch to throw CORS error
      global.fetch = vi.fn().mockRejectedValue(new Error('CORS error'));
      
      const result = await validateImageUrl('https://example.com/image.jpg');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('CORS');
    });

    it('should handle 404 errors', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404
      });

      const result = await validateImageUrl('https://example.com/nonexistent.jpg');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('HTTP 404');
    });

    it('should validate common image hosting services', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'image/png' })
      });

      const imgbbResult = await validateImageUrl('https://i.ibb.co/example/image.png');
      expect(imgbbResult.isValid).toBe(true);

      const unsplashResult = await validateImageUrl('https://images.unsplash.com/photo-123');
      expect(unsplashResult.isValid).toBe(true);
    });
  });

  describe('formatGoogleDriveUrl', () => {
    it('should convert Google Drive file URLs to direct links', () => {
      const driveUrl = 'https://drive.google.com/file/d/1abc123xyz/view?usp=sharing';
      const formatted = formatGoogleDriveUrl(driveUrl);
      expect(formatted).toBe('https://drive.google.com/uc?id=1abc123xyz&export=view');
    });

    it('should return null for invalid URLs', () => {
      expect(formatGoogleDriveUrl('invalid-url')).toBeNull();
    });

    it('should return the original URL if not a Google Drive URL', () => {
      const regularUrl = 'https://example.com/image.jpg';
      expect(formatGoogleDriveUrl(regularUrl)).toBe(regularUrl);
    });

    it('should handle already formatted Google Drive URLs', () => {
      const formattedUrl = 'https://drive.google.com/uc?id=1abc123xyz&export=view';
      expect(formatGoogleDriveUrl(formattedUrl)).toBe(formattedUrl);
    });
  });

  describe('help text functions', () => {
    it('should return help text', () => {
      expect(getImageUrlHelpText()).toContain('Google Drive');
      expect(getImageUrlHelpText()).toContain('ImgBB');
    });

    it('should return Google Drive instructions', () => {
      const instructions = getGoogleDriveInstructions();
      expect(instructions).toContain('Google Drive');
      expect(instructions).toContain('Get link');
      expect(instructions).toContain('Anyone with the link');
    });

    it('should return ImgBB instructions', () => {
      const instructions = getImgbbInstructions();
      expect(instructions).toContain('ImgBB');
      expect(instructions).toContain('imgbb.com');
      expect(instructions).toContain('Copy image address');
    });
  });
});