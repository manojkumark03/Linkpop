import { describe, expect, it } from 'vitest';
import {
  loginSchema,
  registerSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
} from './auth';

describe('Auth Validations', () => {
  describe('loginSchema', () => {
    it('should validate correct login credentials', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: 'Password123',
      });

      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const result = loginSchema.safeParse({
        email: 'invalid-email',
        password: 'Password123',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['email']);
      }
    });

    it('should reject short password', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: 'short',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['password']);
      }
    });
  });

  describe('registerSchema', () => {
    it('should validate correct registration data', () => {
      const result = registerSchema.safeParse({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123',
      });

      expect(result.success).toBe(true);
    });

    it('should reject short name', () => {
      const result = registerSchema.safeParse({
        name: 'J',
        email: 'john@example.com',
        password: 'Password123',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['name']);
      }
    });

    it('should reject password without uppercase', () => {
      const result = registerSchema.safeParse({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((issue) => issue.path[0] === 'password')).toBe(true);
      }
    });

    it('should reject password without lowercase', () => {
      const result = registerSchema.safeParse({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'PASSWORD123',
      });

      expect(result.success).toBe(false);
    });

    it('should reject password without number', () => {
      const result = registerSchema.safeParse({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'PasswordABC',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('passwordResetRequestSchema', () => {
    it('should validate correct email', () => {
      const result = passwordResetRequestSchema.safeParse({
        email: 'test@example.com',
      });

      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const result = passwordResetRequestSchema.safeParse({
        email: 'invalid',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('passwordResetSchema', () => {
    it('should validate correct reset data', () => {
      const result = passwordResetSchema.safeParse({
        token: 'valid-token-string',
        password: 'NewPassword123',
      });

      expect(result.success).toBe(true);
    });

    it('should reject empty token', () => {
      const result = passwordResetSchema.safeParse({
        token: '',
        password: 'NewPassword123',
      });

      expect(result.success).toBe(false);
    });

    it('should reject weak password', () => {
      const result = passwordResetSchema.safeParse({
        token: 'valid-token',
        password: 'weak',
      });

      expect(result.success).toBe(false);
    });
  });
});
