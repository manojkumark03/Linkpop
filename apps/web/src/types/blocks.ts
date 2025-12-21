import type {
  BlockType as PrismaBlockType,
  BlockParentType as PrismaBlockParentType,
} from '@prisma/client';

// Re-export Prisma types for consistency
export type BlockType = PrismaBlockType;
export type BlockParentType = PrismaBlockParentType;

export interface BaseBlock {
  id: string;
  type: BlockType;
  order: number;
  parentId: string;
  parentType: BlockParentType;
  profileId?: string | null;
  pageId?: string | null;
  iconName?: string | null;
  fontColor?: string | null;
  bgColor?: string | null;
}

export interface MarkdownBlockContent {
  text: string;
  preview?: string;
}

export interface ButtonBlockContent {
  label: string;
  url: string;
  color: 'primary' | 'secondary' | string;
  size: 'small' | 'medium' | 'large';
  isPrimary: boolean;
  style: 'filled' | 'outline';
}

export interface CopyTextBlockContent {
  label?: string;
  /** @deprecated use value */
  text?: string;
  value?: string;
}

export interface SocialBlockContent {
  platform:
    | 'twitter'
    | 'linkedin'
    | 'instagram'
    | 'github'
    | 'youtube'
    | 'tiktok'
    | 'facebook'
    | 'discord'
    | 'other';
  username?: string;
  url?: string;
  displayName?: string;
}

export interface LinkBlockContent {
  title: string;
  url: string;
  slug?: string;
}

export interface ExpandBlockContent {
  title?: string;
  contentType?: 'markdown' | 'iframe' | 'both';
  markdown?: string;
  iframeUrl?: string;
  isOpen?: boolean;
}

export type PageBlockContent = Record<string, never> | undefined;

export type BlockContent =
  | MarkdownBlockContent
  | ButtonBlockContent
  | CopyTextBlockContent
  | ExpandBlockContent
  | SocialBlockContent
  | LinkBlockContent
  | PageBlockContent;

export interface PageInfo {
  id: string;
  title: string;
  slug: string;
  icon?: string | null;
  isPublished: boolean;
}

export interface Block extends BaseBlock {
  content: BlockContent;
  createdAt: string;
  updatedAt: string;
  page?: PageInfo | null;
}

export interface CreateBlockData {
  parentType: BlockParentType;
  parentId: string;
  type: BlockType;
  order: number;
  content: BlockContent;
  profileId?: string | null;
  pageId?: string | null;
  iconName?: string | null;
  fontColor?: string | null;
  bgColor?: string | null;
}

export interface UpdateBlockData {
  order?: number;
  content?: BlockContent;
  iconName?: string | null;
  fontColor?: string | null;
  bgColor?: string | null;
}

export interface BlockEditorState {
  selectedBlockId: string | null;
  blocks: Block[];
  isPreviewMode: boolean;
}

export interface BlockTemplate {
  name: string;
  description: string;
  blocks: Omit<Block, 'id' | 'createdAt' | 'updatedAt'>[];
}
