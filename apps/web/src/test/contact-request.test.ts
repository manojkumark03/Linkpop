import { describe, it, expect, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  email: z.string().email('Invalid email address'),
  message: z
    .string()
    .min(10, 'Message must be at least 10 characters')
    .max(2000, 'Message is too long'),
  consent: z.boolean().refine((val) => val === true, 'Consent is required'),
  metadata: z
    .object({
      userAgent: z.string().optional(),
      referrer: z.string().optional(),
      timestamp: z.string().optional(),
    })
    .optional(),
});

describe('ContactRequest', () => {
  let testRequest: any;

  beforeEach(async () => {
    // Clean up any existing test data
    await prisma.contactRequest.deleteMany({
      where: {
        email: 'test@example.com',
      },
    });
  });

  describe('Prisma Model', () => {
    it('should create a ContactRequest with valid data', async () => {
      const contactRequest = await prisma.contactRequest.create({
        data: {
          name: 'Test User',
          email: 'test@example.com',
          message: 'This is a test message to verify the contact form works correctly.',
          metadata: {
            userAgent: 'Mozilla/5.0',
            referrer: 'https://linkforest.com',
            timestamp: new Date().toISOString(),
          },
        },
      });

      expect(contactRequest.id).toBeDefined();
      expect(contactRequest.name).toBe('Test User');
      expect(contactRequest.email).toBe('test@example.com');
      expect(contactRequest.message).toBe(
        'This is a test message to verify the contact form works correctly.',
      );
      expect(contactRequest.metadata).toMatchObject({
        userAgent: 'Mozilla/5.0',
        referrer: 'https://linkforest.com',
      });
      expect(contactRequest.createdAt).toBeInstanceOf(Date);
    });

    it('should enforce name length constraints', async () => {
      await expect(
        prisma.contactRequest.create({
          data: {
            name: '', // Empty name should fail
            email: 'test@example.com',
            message: 'This is a test message.',
          },
        }),
      ).rejects.toThrow();
    });

    it('should enforce email validation', async () => {
      await expect(
        prisma.contactRequest.create({
          data: {
            name: 'Test User',
            email: 'invalid-email', // Invalid email should fail
            message: 'This is a test message.',
          },
        }),
      ).rejects.toThrow();
    });

    it('should enforce message length constraints', async () => {
      await expect(
        prisma.contactRequest.create({
          data: {
            name: 'Test User',
            email: 'test@example.com',
            message: 'Too short', // Message too short
          },
        }),
      ).rejects.toThrow();
    });
  });

  describe('Validation Schema', () => {
    it('should validate correct contact form data', () => {
      const validData = {
        name: 'Test User',
        email: 'test@example.com',
        message: 'This is a test message to verify the contact form works correctly.',
        consent: true,
        metadata: {
          userAgent: 'Mozilla/5.0',
          referrer: 'https://linkforest.com',
          timestamp: new Date().toISOString(),
        },
      };

      const result = contactSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Test User');
        expect(result.data.email).toBe('test@example.com');
        expect(result.data.consent).toBe(true);
      }
    });

    it('should reject empty name', () => {
      const invalidData = {
        name: '',
        email: 'test@example.com',
        message: 'This is a test message to verify the contact form works correctly.',
        consent: true,
      };

      const result = contactSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Name is required');
      }
    });

    it('should reject invalid email', () => {
      const invalidData = {
        name: 'Test User',
        email: 'invalid-email',
        message: 'This is a test message to verify the contact form works correctly.',
        consent: true,
      };

      const result = contactSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Invalid email address');
      }
    });

    it('should reject short message', () => {
      const invalidData = {
        name: 'Test User',
        email: 'test@example.com',
        message: 'Too short',
        consent: true,
      };

      const result = contactSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Message must be at least 10 characters');
      }
    });

    it('should reject unaccepted consent', () => {
      const invalidData = {
        name: 'Test User',
        email: 'test@example.com',
        message: 'This is a test message to verify the contact form works correctly.',
        consent: false,
      };

      const result = contactSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Consent is required');
      }
    });

    it('should handle optional metadata', () => {
      const dataWithPartialMetadata = {
        name: 'Test User',
        email: 'test@example.com',
        message: 'This is a test message to verify the contact form works correctly.',
        consent: true,
        metadata: {
          userAgent: 'Mozilla/5.0',
          // Missing optional fields
        },
      };

      const result = contactSchema.safeParse(dataWithPartialMetadata);
      expect(result.success).toBe(true);
    });
  });

  describe('API Integration', () => {
    it('should create and retrieve contact requests', async () => {
      // Create a contact request
      const contactRequest = await prisma.contactRequest.create({
        data: {
          name: 'Integration Test User',
          email: 'integration@example.com',
          message:
            'This is an integration test message to verify the contact form works correctly.',
          metadata: {
            userAgent: 'Test Browser',
            referrer: 'https://linkforest.com/contact',
          },
        },
      });

      expect(contactRequest.id).toBeDefined();

      // Retrieve the contact request
      const retrieved = await prisma.contactRequest.findUnique({
        where: { id: contactRequest.id },
      });

      expect(retrieved).not.toBeNull();
      expect(retrieved?.name).toBe('Integration Test User');
      expect(retrieved?.email).toBe('integration@example.com');
      expect(retrieved?.message).toBe(
        'This is an integration test message to verify the contact form works correctly.',
      );

      // Clean up
      await prisma.contactRequest.delete({
        where: { id: contactRequest.id },
      });
    });
  });
});
