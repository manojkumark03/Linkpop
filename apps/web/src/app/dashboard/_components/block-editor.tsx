'use client';

import { useState, useTransition } from 'react';
import {
  Plus,
  GripVertical,
  Trash2,
  Edit3,
  Eye,
  EyeOff,
  Copy,
  ChevronUp,
  ChevronDown,
  FileText,
  MousePointer2,
} from 'lucide-react';
import { cn } from '@acme/ui';
import { Button } from '@acme/ui';
import { Input } from '@acme/ui';
import { Label } from '@acme/ui';
import { Textarea } from '@acme/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@acme/ui';
import { Switch } from '@acme/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@acme/ui';
import { toast } from '@acme/ui';

import type { Block, BlockType, BlockContent } from '@/types/blocks';
import {
  createDefaultBlockContent,
  validateBlockContent,
  BUTTON_COLORS,
  getButtonColorClass,
  reorderBlocks,
  getBlockTypeConfig,
} from '@/lib/block-types';
import { BlockType as BlockTypeEnum } from '@/lib/block-types';
import { BlockListRenderer } from '@/components/block-renderer';

const blockTypeIcons = {
  FileText,
  MousePointer2,
  Copy,
  ChevronDown,
} as const;

// Block Editor Props
interface BlockEditorProps {
  blocks: Block[];
  onBlocksChange: (blocks: Block[]) => void;
  className?: string;
}

// Block Editor State
interface BlockEditorState {
  selectedBlockId: string | null;
  addBlockOpen: boolean;
  previewMode: boolean;
}

// Block Form Data
interface BlockFormData {
  type: BlockType;
  content: BlockContent;
}

export function BlockEditor({ blocks, onBlocksChange, className }: BlockEditorProps) {
  const [state, setState] = useState<BlockEditorState>({
    selectedBlockId: null,
    addBlockOpen: false,
    previewMode: false,
  });

  const [isPending, startTransition] = useTransition();

  // Get selected block
  const selectedBlock = state.selectedBlockId
    ? blocks.find((b) => b.id === state.selectedBlockId)
    : null;

  // Add new block
  const handleAddBlock = (type: BlockType) => {
    const newBlock: Block = {
      id: `temp-${Date.now()}`, // Temporary ID, will be replaced on server
      pageId: '', // Will be set by parent component
      type,
      order: blocks.length,
      content: createDefaultBlockContent(type),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedBlocks = reorderBlocks([...blocks, newBlock]);
    onBlocksChange(updatedBlocks);
    setState((prev) => ({ ...prev, selectedBlockId: newBlock.id, addBlockOpen: false }));
  };

  // Delete block
  const handleDeleteBlock = (blockId: string) => {
    const updatedBlocks = blocks.filter((b) => b.id !== blockId);
    onBlocksChange(reorderBlocks(updatedBlocks));

    if (state.selectedBlockId === blockId) {
      setState((prev) => ({ ...prev, selectedBlockId: null }));
    }

    toast({
      title: 'Block deleted',
      description: 'The block has been removed',
    });
  };

  // Update block content
  const handleUpdateBlock = (blockId: string, updates: Partial<Block>) => {
    const updatedBlocks = blocks.map((block) =>
      block.id === blockId ? { ...block, ...updates, updatedAt: new Date().toISOString() } : block,
    );
    onBlocksChange(updatedBlocks);
  };

  // Move block up/down
  const handleMoveBlock = (blockId: string, direction: 'up' | 'down') => {
    const currentIndex = blocks.findIndex((b) => b.id === blockId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= blocks.length) return;

    const updatedBlocks = [...blocks];
    const [movedBlock] = updatedBlocks.splice(currentIndex, 1);
    updatedBlocks.splice(newIndex, 0, movedBlock);

    onBlocksChange(reorderBlocks(updatedBlocks));
  };

  // Select block
  const handleSelectBlock = (blockId: string) => {
    setState((prev) => ({ ...prev, selectedBlockId: blockId }));
  };

  // Toggle preview mode
  const togglePreview = () => {
    setState((prev) => ({ ...prev, previewMode: !prev.previewMode }));
  };

  // Block Manager Component
  const BlockManager = () => (
    <div className="flex h-full w-80 flex-col border-r border-gray-200 dark:border-gray-700">
      <div className="border-b border-gray-200 p-4 dark:border-gray-700">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Blocks</h3>
          <Button size="sm" onClick={() => setState((prev) => ({ ...prev, addBlockOpen: true }))}>
            <Plus className="mr-2 h-4 w-4" />
            Add Block
          </Button>
        </div>

        {/* Add Block Dialog */}
        {state.addBlockOpen && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-sm">Add New Block</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.values(BlockTypeEnum).map((type) => {
                const config = getBlockTypeConfig(type);
                const IconComponent =
                  blockTypeIcons[config.icon as keyof typeof blockTypeIcons] ?? FileText;

                return (
                  <Button
                    key={type}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleAddBlock(type)}
                  >
                    <IconComponent className={cn('mr-2 h-4 w-4', config.color)} />
                    <div className="text-left">
                      <div className="font-medium">{config.name}</div>
                      <div className="text-xs text-gray-500">{config.description}</div>
                    </div>
                  </Button>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Block List */}
      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {blocks.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <FileText className="mx-auto mb-2 h-8 w-8 opacity-50" />
            <p className="text-sm">No blocks yet</p>
            <p className="text-xs">Add your first block to get started</p>
          </div>
        ) : (
          blocks
            .sort((a, b) => a.order - b.order)
            .map((block) => {
              const config = getBlockTypeConfig(block.type);
              const IconComponent =
                blockTypeIcons[config.icon as keyof typeof blockTypeIcons] ?? FileText;

              return (
                <div
                  key={block.id}
                  className={cn(
                    'group flex cursor-pointer items-center gap-2 rounded-lg border p-3 transition-all',
                    state.selectedBlockId === block.id
                      ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
                      : 'border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700',
                  )}
                  onClick={() => handleSelectBlock(block.id)}
                >
                  <GripVertical className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                  <IconComponent className={cn('h-4 w-4', config.color)} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{config.name}</div>
                    <div className="truncate text-xs text-gray-500">
                      {block.type === 'MARKDOWN' && (block.content as any).text?.slice(0, 30)}
                      {block.type === 'BUTTON' && `Button: ${(block.content as any).label}`}
                      {block.type === 'COPY_TEXT' &&
                        `Text: ${(block.content as any).text?.slice(0, 20)}`}
                      {block.type === 'EXPAND' && `Expand: ${(block.content as any).title}`}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveBlock(block.id, 'up');
                      }}
                      disabled={blocks.findIndex((b) => b.id === block.id) === 0}
                    >
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveBlock(block.id, 'down');
                      }}
                      disabled={blocks.findIndex((b) => b.id === block.id) === blocks.length - 1}
                    >
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteBlock(block.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3 text-red-500" />
                    </Button>
                  </div>
                </div>
              );
            })
        )}
      </div>
    </div>
  );

  // Block Editor Form Component
  const BlockEditorForm = () => {
    if (!selectedBlock) {
      return (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center text-gray-500">
            <Edit3 className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p className="text-lg font-medium">Select a block to edit</p>
            <p className="text-sm">Choose a block from the left panel to modify its content</p>
          </div>
        </div>
      );
    }

    const handleContentChange = (updates: Partial<BlockContent>) => {
      handleUpdateBlock(selectedBlock.id, {
        content: { ...selectedBlock.content, ...updates },
      });
    };

    return (
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          <div className="mb-6">
            <h3 className="mb-2 text-lg font-semibold">
              Edit {getBlockTypeConfig(selectedBlock.type).name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {getBlockTypeConfig(selectedBlock.type).description}
            </p>
          </div>

          {/* Block-specific forms */}
          {selectedBlock.type === 'MARKDOWN' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="markdown-text">Content</Label>
                <Textarea
                  id="markdown-text"
                  value={(selectedBlock.content as any).text || ''}
                  onChange={(e) => handleContentChange({ text: e.target.value })}
                  placeholder="Enter your markdown content..."
                  rows={12}
                  className="font-mono"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Supports basic markdown: # headers, **bold**, - lists, etc.
                </p>
              </div>
            </div>
          )}

          {selectedBlock.type === 'BUTTON' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="button-label">Button Label</Label>
                <Input
                  id="button-label"
                  value={(selectedBlock.content as any).label || ''}
                  onChange={(e) => handleContentChange({ label: e.target.value })}
                  placeholder="Click me"
                />
              </div>

              <div>
                <Label htmlFor="button-url">URL</Label>
                <Input
                  id="button-url"
                  value={(selectedBlock.content as any).url || ''}
                  onChange={(e) => handleContentChange({ url: e.target.value })}
                  placeholder="https://example.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="button-color">Color</Label>
                  <Select
                    value={(selectedBlock.content as any).color || 'primary'}
                    onValueChange={(value) => handleContentChange({ color: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BUTTON_COLORS.map((color) => (
                        <SelectItem key={color.value} value={color.value}>
                          <div className="flex items-center gap-2">
                            <div className={cn('h-4 w-4 rounded', color.color)} />
                            {color.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="button-size">Size</Label>
                  <Select
                    value={(selectedBlock.content as any).size || 'medium'}
                    onValueChange={(value) =>
                      handleContentChange({ size: value as 'small' | 'medium' | 'large' })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="button-style">Style</Label>
                  <Select
                    value={(selectedBlock.content as any).style || 'filled'}
                    onValueChange={(value) =>
                      handleContentChange({ style: value as 'filled' | 'outline' })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="filled">Filled</SelectItem>
                      <SelectItem value="outline">Outline</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-end">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="button-primary"
                      checked={(selectedBlock.content as any).isPrimary || false}
                      onCheckedChange={(checked) => handleContentChange({ isPrimary: checked })}
                    />
                    <Label htmlFor="button-primary">Primary CTA</Label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedBlock.type === 'COPY_TEXT' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="copy-text">Text to Copy</Label>
                <Input
                  id="copy-text"
                  value={(selectedBlock.content as any).text || ''}
                  onChange={(e) => handleContentChange({ text: e.target.value })}
                  placeholder="hello@example.com"
                />
              </div>

              <div>
                <Label htmlFor="copy-label">Label (Optional)</Label>
                <Input
                  id="copy-label"
                  value={(selectedBlock.content as any).label || ''}
                  onChange={(e) => handleContentChange({ label: e.target.value })}
                  placeholder="Email Address"
                />
              </div>
            </div>
          )}

          {selectedBlock.type === 'EXPAND' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="expand-title">Section Title</Label>
                <Input
                  id="expand-title"
                  value={(selectedBlock.content as any).title || ''}
                  onChange={(e) => handleContentChange({ title: e.target.value })}
                  placeholder="Learn More"
                />
              </div>

              <div>
                <Label htmlFor="expand-content-type">Content Type</Label>
                <Select
                  value={(selectedBlock.content as any).contentType || 'markdown'}
                  onValueChange={(value) =>
                    handleContentChange({ contentType: value as 'markdown' | 'iframe' | 'both' })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="markdown">Markdown Text</SelectItem>
                    <SelectItem value="iframe">Embedded iframe</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {((selectedBlock.content as any).contentType === 'markdown' ||
                (selectedBlock.content as any).contentType === 'both') && (
                <div>
                  <Label htmlFor="expand-markdown">Markdown Content</Label>
                  <Textarea
                    id="expand-markdown"
                    value={(selectedBlock.content as any).markdown || ''}
                    onChange={(e) => handleContentChange({ markdown: e.target.value })}
                    placeholder="Enter your content..."
                    rows={6}
                  />
                </div>
              )}

              {((selectedBlock.content as any).contentType === 'iframe' ||
                (selectedBlock.content as any).contentType === 'both') && (
                <div>
                  <Label htmlFor="expand-iframe">iframe URL</Label>
                  <Input
                    id="expand-iframe"
                    value={(selectedBlock.content as any).iframeUrl || ''}
                    onChange={(e) => handleContentChange({ iframeUrl: e.target.value })}
                    placeholder="https://calendly.com/your-link"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Common iframe URLs: Calendly, Typeform, Stripe Checkout, etc.
                  </p>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Switch
                  id="expand-open"
                  checked={(selectedBlock.content as any).isOpen || false}
                  onCheckedChange={(checked) => handleContentChange({ isOpen: checked })}
                />
                <Label htmlFor="expand-open">Open by default</Label>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Live Preview Component
  const LivePreview = () => (
    <div className="flex h-full w-80 flex-col border-l border-gray-200 dark:border-gray-700">
      <div className="border-b border-gray-200 p-4 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Preview</h3>
          <Button size="sm" variant="outline" onClick={togglePreview}>
            {state.previewMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {state.previewMode ? 'Edit Mode' : 'Preview Mode'}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-50 p-4 dark:bg-gray-900">
        {blocks.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <Eye className="mx-auto mb-2 h-8 w-8 opacity-50" />
            <p className="text-sm">Preview will appear here</p>
            <p className="text-xs">Add blocks to see how they'll look</p>
          </div>
        ) : (
          <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
            <BlockListRenderer
              blocks={blocks}
              isPreview={state.previewMode}
              isInteractive={!state.previewMode}
            />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className={cn('flex h-full bg-white dark:bg-gray-800', className)}>
      {/* Block Manager */}
      <BlockManager />

      {/* Block Editor */}
      <div className="flex flex-1 flex-col">
        <div className="border-b border-gray-200 p-4 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Block Editor</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {blocks.length} block{blocks.length !== 1 ? 's' : ''}
              </p>
            </div>

            {selectedBlock && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeleteBlock(selectedBlock.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            )}
          </div>
        </div>

        <BlockEditorForm />
      </div>

      {/* Live Preview */}
      <LivePreview />
    </div>
  );
}
