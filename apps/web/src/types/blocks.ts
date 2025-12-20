export enum BlockType {
  MARKDOWN = 'MARKDOWN',
  BUTTON = 'BUTTON',
  COPY_TEXT = 'COPY_TEXT',
  EXPAND = 'EXPAND',
}

export interface BaseBlock {
  id: string;
  type: BlockType;
  order: number;
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
  text: string;
  label?: string;
}

export interface ExpandBlockContent {
  title: string;
  contentType: 'markdown' | 'iframe' | 'both';
  markdown?: string;
  iframeUrl?: string;
  isOpen?: boolean;
}

export type BlockContent =
  | MarkdownBlockContent
  | ButtonBlockContent
  | CopyTextBlockContent
  | ExpandBlockContent;

export interface Block extends BaseBlock {
  content: BlockContent;
  linkId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBlockData {
  linkId: string;
  type: BlockType;
  order: number;
  content: BlockContent;
}

export interface UpdateBlockData {
  order?: number;
  content?: BlockContent;
}

export interface BlockEditorState {
  selectedBlockId: string | null;
  blocks: Block[];
  isPreviewMode: boolean;
}

export interface BlockTemplate {
  name: string;
  description: string;
  blocks: Omit<Block, 'id' | 'linkId' | 'createdAt' | 'updatedAt'>[];
}
