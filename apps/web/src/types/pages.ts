/**
 * Shared type definitions for the Pages feature
 * These types ensure consistency across frontend, API routes, and validation
 */

// TypeScript types derived from Zod schemas (imported from validation schemas)
export type { CreatePageInput, UpdatePageInput } from '@/lib/validations/pages';

// Database model types (what Prisma returns)
export type Page = {
  id: string;
  profileId: string;
  slug: string;
  title: string;
  content: string;
  icon: string | null;
  isPublished: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
};

// Form state types used in UI components
export type PageFormData = {
  title: string;
  slug: string;
  content: string;
  icon: string | null;
  isPublished: boolean;
};

// API response types
export type PageCreateResponse = {
  ok: boolean;
  page?: Page;
  error?: string;
  details?: unknown;
};

export type PageUpdateResponse = {
  ok: boolean;
  page?: Page;
  error?: string;
  details?: unknown;
};

export type PageListResponse = {
  ok: boolean;
  pages?: Page[];
  error?: string;
};

export type PageDeleteResponse = {
  ok: boolean;
  error?: string;
};

// Utility type for pages with computed fields (for UI display)
export type DisplayPage = Page & {
  url: string; // Computed: /{profileSlug}/{pageSlug}
  excerpt: string; // Computed: truncated content for display
};

// Props for PagesManager component
export type PagesManagerProps = {
  profileId: string;
  initialPages: Page[];
};

// Props for individual page display components
export type PageItemProps = {
  page: Page;
  onEdit: (page: Page) => void;
  onDelete: (pageId: string) => void;
  onTogglePublish: (pageId: string, published: boolean) => void;
};

// Form component props
export type PageFormProps = {
  title: string;
  setTitle: (value: string) => void;
  slug: string;
  setSlug: (value: string) => void;
  content: string;
  setContent: (value: string) => void;
  icon: string | null;
  setIcon: (value: string | null) => void;
  isPublished: boolean;
  setIsPublished: (value: boolean) => void;
  previewMode: boolean;
  setPreviewMode: (value: boolean) => void;
  onSubmit: () => void;
  submitting: boolean;
  onCancel: () => void;
  sampleContent?: string;
  isEditing?: boolean;
};

// Validation result types for better error handling
export type ValidationResult<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: string;
  details?: unknown;
};

// Page operation types
export type PageOperation = 'create' | 'update' | 'delete' | 'toggle';

// Page analytics types (for future enhancement)
export type PageViewStats = {
  pageId: string;
  title: string;
  slug: string;
  icon: string | null;
  views: number;
  lastViewed: Date | null;
};