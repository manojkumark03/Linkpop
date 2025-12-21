export enum BlockType {
  BUTTON = 'BUTTON',
  MARKDOWN = 'MARKDOWN',
  EXPAND = 'EXPAND',
  COPY_TEXT = 'COPY_TEXT',
  PAGE = 'PAGE',
}

export enum BlockParentType {
  PROFILE = 'PROFILE',
  PAGE = 'PAGE',
}

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

export interface ExpandBlockContent {
  title: string;
  contentType: 'markdown' | 'iframe' | 'both';
  markdown?: string;
  iframeUrl?: string;
  isOpen?: boolean;
}

export type PageBlockContent = Record<string, never>;

export type BlockContent =
  | MarkdownBlockContent
  | ButtonBlockContent
  | CopyTextBlockContent
  | ExpandBlockContent
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
