import { BlockType, type Block, type BlockContent } from '@/types/blocks';

export { BlockType };

export const BLOCK_TYPE_CONFIG = {
  [BlockType.MARKDOWN]: {
    name: 'Markdown',
    description: 'Rich text content with formatting',
    icon: 'FileText',
    color: 'text-blue-600',
  },
  [BlockType.BUTTON]: {
    name: 'Button',
    description: 'Customizable button link',
    icon: 'MousePointer2',
    color: 'text-green-600',
  },
  [BlockType.COPY_TEXT]: {
    name: 'Copy Text',
    description: 'Text that users can copy to clipboard',
    icon: 'Copy',
    color: 'text-orange-600',
  },
  [BlockType.EXPAND]: {
    name: 'Expand',
    description: 'Collapsible section with content',
    icon: 'ChevronDown',
    color: 'text-purple-600',
  },
} as const;

export function getBlockTypeConfig(type: BlockType) {
  return BLOCK_TYPE_CONFIG[type];
}

export function createDefaultBlockContent(type: BlockType): BlockContent {
  switch (type) {
    case BlockType.MARKDOWN:
      return {
        text: '# Welcome to your page\n\nStart writing your content here...',
        preview: 'Welcome to your page',
      };

    case BlockType.BUTTON:
      return {
        label: 'Click Me',
        url: 'https://example.com',
        color: 'primary',
        size: 'medium',
        isPrimary: false,
        style: 'filled',
      };

    case BlockType.COPY_TEXT:
      return {
        text: 'hello@example.com',
        label: 'Email Address',
      };

    case BlockType.EXPAND:
      return {
        title: 'Learn More',
        contentType: 'markdown',
        markdown: 'More information goes here...',
        isOpen: false,
      };

    default:
      throw new Error(`Unknown block type: ${type}`);
  }
}

export function validateBlockContent(
  type: BlockType,
  content: BlockContent,
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  switch (type) {
    case BlockType.MARKDOWN:
      if (!content.text || typeof content.text !== 'string' || content.text.trim().length === 0) {
        errors.push('Text content is required');
      }
      break;

    case BlockType.BUTTON:
      if (
        !content.label ||
        typeof content.label !== 'string' ||
        content.label.trim().length === 0
      ) {
        errors.push('Button label is required');
      }
      if (!content.url || typeof content.url !== 'string' || !isValidUrl(content.url)) {
        errors.push('Valid URL is required');
      }
      break;

    case BlockType.COPY_TEXT:
      if (!content.text || typeof content.text !== 'string' || content.text.trim().length === 0) {
        errors.push('Text to copy is required');
      }
      break;

    case BlockType.EXPAND:
      if (
        !content.title ||
        typeof content.title !== 'string' ||
        content.title.trim().length === 0
      ) {
        errors.push('Section title is required');
      }
      if (
        content.contentType === 'markdown' &&
        (!content.markdown || content.markdown.trim().length === 0)
      ) {
        errors.push('Markdown content is required when content type is markdown');
      }
      if (
        content.contentType === 'iframe' &&
        (!content.iframeUrl || !isValidUrl(content.iframeUrl))
      ) {
        errors.push('Valid iframe URL is required when content type is iframe');
      }
      break;
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function isValidUrl(string: string): boolean {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function reorderBlocks(blocks: Block[]): Block[] {
  return blocks
    .sort((a, b) => a.order - b.order)
    .map((block, index) => ({
      ...block,
      order: index,
    }));
}

export function addBlockToList(blocks: Block[], newBlock: Block): Block[] {
  return reorderBlocks([...blocks, newBlock]);
}

export function removeBlockFromList(blocks: Block[], blockId: string): Block[] {
  return reorderBlocks(blocks.filter((block) => block.id !== blockId));
}

export function updateBlockInList(blocks: Block[], updatedBlock: Block): Block[] {
  return blocks.map((block) => (block.id === updatedBlock.id ? updatedBlock : block));
}

export function moveBlockInList(blocks: Block[], blockId: string, newIndex: number): Block[] {
  const blockToMove = blocks.find((block) => block.id === blockId);
  if (!blockToMove) return blocks;

  const otherBlocks = blocks.filter((block) => block.id !== blockId);
  const reorderedBlocks = [...otherBlocks];
  reorderedBlocks.splice(newIndex, 0, blockToMove);

  return reorderBlocks(reorderedBlocks);
}

// Color utilities for button blocks
export const BUTTON_COLORS = [
  { value: 'primary', label: 'Primary', color: 'bg-blue-600 hover:bg-blue-700 text-white' },
  { value: 'secondary', label: 'Secondary', color: 'bg-gray-600 hover:bg-gray-700 text-white' },
  { value: '#000000', label: 'Black', color: 'bg-black hover:bg-gray-800 text-white' },
  {
    value: '#ffffff',
    label: 'White',
    color: 'bg-white hover:bg-gray-50 text-black border border-gray-300',
  },
  { value: '#ef4444', label: 'Red', color: 'bg-red-600 hover:bg-red-700 text-white' },
  { value: '#10b981', label: 'Green', color: 'bg-green-600 hover:bg-green-700 text-white' },
  { value: '#f59e0b', label: 'Amber', color: 'bg-amber-600 hover:bg-amber-700 text-white' },
  { value: '#8b5cf6', label: 'Purple', color: 'bg-purple-600 hover:bg-purple-700 text-white' },
  { value: '#ec4899', label: 'Pink', color: 'bg-pink-600 hover:bg-pink-700 text-white' },
  { value: '#06b6d4', label: 'Cyan', color: 'bg-cyan-600 hover:bg-cyan-700 text-white' },
];

export function getButtonColorClass(color: string): string {
  const preset = BUTTON_COLORS.find((c) => c.value === color);
  return preset ? preset.color : 'bg-gray-600 hover:bg-gray-700 text-white';
}

// Template utilities
export const BLOCK_TEMPLATES = [
  {
    name: 'Contact Section',
    description: 'Email and social links',
    blocks: [
      {
        type: BlockType.MARKDOWN,
        order: 0,
        content: {
          text: '# Get in Touch\n\nFeel free to reach out!',
          preview: 'Get in Touch',
        },
      },
      {
        type: BlockType.BUTTON,
        order: 1,
        content: {
          label: 'Send Email',
          url: 'mailto:hello@example.com',
          color: 'primary',
          size: 'medium',
          isPrimary: true,
          style: 'filled',
        },
      },
      {
        type: BlockType.COPY_TEXT,
        order: 2,
        content: {
          text: 'hello@example.com',
          label: 'Email Address',
        },
      },
    ],
  },
  {
    name: 'App Download',
    description: 'App store buttons',
    blocks: [
      {
        type: BlockType.MARKDOWN,
        order: 0,
        content: {
          text: '# Download Our App',
          preview: 'Download Our App',
        },
      },
      {
        type: BlockType.BUTTON,
        order: 1,
        content: {
          label: '📱 Download for iOS',
          url: 'https://apps.apple.com',
          color: '#000000',
          size: 'large',
          isPrimary: true,
          style: 'filled',
        },
      },
      {
        type: BlockType.BUTTON,
        order: 2,
        content: {
          label: '🤖 Download for Android',
          url: 'https://play.google.com',
          color: '#34a853',
          size: 'large',
          isPrimary: false,
          style: 'filled',
        },
      },
    ],
  },
  {
    name: 'FAQ Section',
    description: 'Collapsible frequently asked questions',
    blocks: [
      {
        type: BlockType.MARKDOWN,
        order: 0,
        content: {
          text: '# Frequently Asked Questions',
          preview: 'FAQ',
        },
      },
      {
        type: BlockType.EXPAND,
        order: 1,
        content: {
          title: 'What is your return policy?',
          contentType: 'markdown',
          markdown: 'We offer a 30-day return policy for all unused items.',
          isOpen: false,
        },
      },
      {
        type: BlockType.EXPAND,
        order: 2,
        content: {
          title: 'How do I track my order?',
          contentType: 'markdown',
          markdown: 'You will receive a tracking number via email once your order ships.',
          isOpen: false,
        },
      },
    ],
  },
] as const;
