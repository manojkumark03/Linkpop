'use client';

import { useState, useTransition, useEffect } from 'react';
import {
  Plus,
  Smartphone,
  Eye,
  EyeOff,
  GripVertical,
  Trash2,
  Edit3,
  ChevronUp,
  ChevronDown,
  User,
  Link2,
  Copy,
  FileText,
  ChevronDown as Expand,
  Layers,
} from 'lucide-react';
import { cn } from '@acme/ui';
import { Button } from '@acme/ui';
import { Input } from '@acme/ui';
import { Label } from '@acme/ui';
import { Textarea } from '@acme/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@acme/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@acme/ui';
import { toast } from '@acme/ui';

import type { Block, BlockType, BlockContent, BlockParentType } from '@/types/blocks';
import { BlockTypeEnum, createDefaultBlockContent, reorderBlocks } from '@/lib/block-types';

interface DashboardBuilderProps {
  profileId: string;
  initialBlocks?: Block[];
  onBlocksChange?: (blocks: Block[]) => void;
}

interface ProfileElement {
  id: string;
  type: BlockType;
  content: BlockContent;
  order: number;
  createdAt: string;
  updatedAt: string;
  parentId: string;
  parentType: BlockParentType;
}

const elementTypeIcons = {
  [BlockTypeEnum.SOCIAL]: User,
  [BlockTypeEnum.LINK]: Link2,
  [BlockTypeEnum.COPY_TEXT]: Copy,
  [BlockTypeEnum.MARKDOWN]: FileText,
  [BlockTypeEnum.EXPAND]: Expand,
  [BlockTypeEnum.BUTTON]: Layers,
  [BlockTypeEnum.PAGE]: Layers,
} as const;

const elementTypeLabels = {
  [BlockTypeEnum.SOCIAL]: 'Social',
  [BlockTypeEnum.LINK]: 'Link',
  [BlockTypeEnum.COPY_TEXT]: 'Copy Text',
  [BlockTypeEnum.MARKDOWN]: 'Text',
  [BlockTypeEnum.EXPAND]: 'Expand',
  [BlockTypeEnum.BUTTON]: 'Button',
  [BlockTypeEnum.PAGE]: 'Page',
} as const;

export function DashboardBuilder({
  profileId,
  initialBlocks = [],
  onBlocksChange,
}: DashboardBuilderProps) {
  const [blocks, setBlocks] = useState<ProfileElement[]>(() => {
    return initialBlocks
      .filter((block) => block.parentType === 'PROFILE')
      .map((block) => ({
        id: block.id,
        type: block.type,
        content: block.content,
        order: block.order,
        createdAt: block.createdAt,
        updatedAt: block.updatedAt,
        parentId: block.parentId,
        parentType: block.parentType,
      }))
      .sort((a, b) => a.order - b.order);
  });

  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [isPending, startTransition] = useTransition();

  const selectedBlock = selectedBlockId ? blocks.find((b) => b.id === selectedBlockId) : null;

  // Auto-select first block if none selected
  useEffect(() => {
    if (!selectedBlockId && blocks.length > 0) {
      setSelectedBlockId(blocks[0].id);
    }
  }, [blocks, selectedBlockId]);

  // Notify parent of changes
  useEffect(() => {
    if (onBlocksChange) {
      const fullBlocks = blocks.map((block) => ({
        ...block,
        parentId: profileId,
        parentType: 'PROFILE' as const,
        profileId,
        pageId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
      onBlocksChange(fullBlocks);
    }
  }, [blocks, profileId, onBlocksChange]);

  const handleAddBlock = (type: BlockType) => {
    const now = new Date().toISOString();
    const newBlock: ProfileElement = {
      id: `temp-${Date.now()}`,
      type,
      content: createDefaultBlockContent(type),
      order: blocks.length,
      createdAt: now,
      updatedAt: now,
      parentId: profileId,
      parentType: 'PROFILE' as BlockParentType,
    };

    const updatedBlocks = reorderBlocks([...blocks, newBlock]);
    setBlocks(updatedBlocks);
    setSelectedBlockId(newBlock.id);

    toast({
      title: 'Element added',
      description: `Added ${elementTypeLabels[type]} element`,
    });
  };

  const handleDeleteBlock = (blockId: string) => {
    const updatedBlocks = blocks.filter((b) => b.id !== blockId);
    setBlocks(reorderBlocks(updatedBlocks));

    if (selectedBlockId === blockId) {
      setSelectedBlockId(null);
    }

    toast({
      title: 'Element deleted',
      description: 'The element has been removed',
    });
  };

  const handleUpdateBlock = (blockId: string, updates: Partial<ProfileElement>) => {
    const updatedBlocks = blocks.map((block) =>
      block.id === blockId ? { ...block, ...updates } : block,
    );
    setBlocks(updatedBlocks);
  };

  const handleMoveBlock = (blockId: string, direction: 'up' | 'down') => {
    const currentIndex = blocks.findIndex((b) => b.id === blockId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= blocks.length) return;

    const updatedBlocks = [...blocks];
    const [movedBlock] = updatedBlocks.splice(currentIndex, 1);
    updatedBlocks.splice(newIndex, 0, movedBlock);

    setBlocks(reorderBlocks(updatedBlocks));
  };

  const handleContentChange = (updates: Partial<BlockContent>) => {
    if (!selectedBlockId) return;

    handleUpdateBlock(selectedBlockId, {
      content: { ...selectedBlock!.content, ...updates } as BlockContent,
    });
  };

  // Left Panel - Element List and Editor
  const LeftPanel = () => (
    <div className="flex h-full w-80 flex-col border-r border-gray-200 dark:border-gray-700">
      {/* Add Element Buttons */}
      <div className="border-b border-gray-200 p-4 dark:border-gray-700">
        <h3 className="mb-4 text-lg font-semibold">Add Elements</h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            BlockTypeEnum.SOCIAL,
            BlockTypeEnum.LINK,
            BlockTypeEnum.COPY_TEXT,
            BlockTypeEnum.EXPAND,
            BlockTypeEnum.MARKDOWN,
            BlockTypeEnum.BUTTON,
          ].map((type) => {
            const IconComponent = elementTypeIcons[type];
            return (
              <Button
                key={type}
                variant="outline"
                size="sm"
                onClick={() => handleAddBlock(type)}
                className="flex h-auto flex-col py-3"
              >
                <IconComponent className="mb-1 h-4 w-4" />
                <span className="text-xs">{elementTypeLabels[type]}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Elements List */}
      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {blocks.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <Plus className="mx-auto mb-2 h-8 w-8 opacity-50" />
            <p className="text-sm">No elements yet</p>
            <p className="text-xs">Add your first element to get started</p>
          </div>
        ) : (
          blocks.map((block, index) => {
            const IconComponent = elementTypeIcons[block.type];
            const isSelected = selectedBlockId === block.id;

            return (
              <div
                key={block.id}
                className={cn(
                  'group flex cursor-pointer items-center gap-2 rounded-lg border p-3 transition-all',
                  isSelected
                    ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
                    : 'border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700',
                )}
                onClick={() => setSelectedBlockId(block.id)}
              >
                <GripVertical className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                <IconComponent className="h-4 w-4 text-gray-600" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">
                    {elementTypeLabels[block.type]}
                  </div>
                  <div className="truncate text-xs text-gray-500">
                    {block.type === BlockTypeEnum.SOCIAL &&
                      `${(block.content as any).platform || 'Social'}`}
                    {block.type === BlockTypeEnum.LINK &&
                      `${(block.content as any).title || 'Link'}`}
                    {block.type === BlockTypeEnum.COPY_TEXT &&
                      `${(block.content as any).text || 'Copy'}`}
                    {block.type === BlockTypeEnum.MARKDOWN && 'Text content'}
                    {block.type === BlockTypeEnum.EXPAND &&
                      `${(block.content as any).title || 'Expand'}`}
                    {block.type === BlockTypeEnum.BUTTON &&
                      `${(block.content as any).label || 'Button'}`}
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
                    disabled={index === 0}
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
                    disabled={index === blocks.length - 1}
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

  // Middle Panel - Editor
  const MiddlePanel = () => (
    <div className="flex-1 overflow-y-auto">
      <div className="border-b border-gray-200 p-4 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Element Editor</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {selectedBlock ? 'Edit your selected element' : 'Select an element to edit'}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {!selectedBlock ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center text-gray-500">
              <Edit3 className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p className="text-lg font-medium">Select an element to edit</p>
              <p className="text-sm">Choose an element from the left panel to modify its content</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h4 className="mb-2 text-lg font-semibold">
                Edit {elementTypeLabels[selectedBlock.type]}
              </h4>
            </div>

            {/* SOCIAL FORM */}
            {selectedBlock.type === BlockTypeEnum.SOCIAL && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="social-platform">Platform</Label>
                  <Select
                    value={(selectedBlock.content as any).platform || 'twitter'}
                    onValueChange={(value) => handleContentChange({ platform: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="twitter">Twitter/X</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="github">GitHub</SelectItem>
                      <SelectItem value="youtube">YouTube</SelectItem>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                      <SelectItem value="facebook">Facebook</SelectItem>
                      <SelectItem value="discord">Discord</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="social-display-name">Display Name</Label>
                  <Input
                    id="social-display-name"
                    value={(selectedBlock.content as any).displayName || ''}
                    onChange={(e) => handleContentChange({ displayName: e.target.value })}
                    placeholder="Follow me on Twitter"
                  />
                </div>

                <div>
                  <Label htmlFor="social-username">Username</Label>
                  <Input
                    id="social-username"
                    value={(selectedBlock.content as any).username || ''}
                    onChange={(e) => handleContentChange({ username: e.target.value })}
                    placeholder="@username"
                  />
                </div>

                <div>
                  <Label htmlFor="social-url">URL</Label>
                  <Input
                    id="social-url"
                    value={(selectedBlock.content as any).url || ''}
                    onChange={(e) => handleContentChange({ url: e.target.value })}
                    placeholder="https://twitter.com/username"
                  />
                </div>
              </div>
            )}

            {/* LINK FORM */}
            {selectedBlock.type === BlockTypeEnum.LINK && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="link-title">Title</Label>
                  <Input
                    id="link-title"
                    value={(selectedBlock.content as any).title || ''}
                    onChange={(e) => handleContentChange({ title: e.target.value })}
                    placeholder="My Website"
                  />
                </div>

                <div>
                  <Label htmlFor="link-url">URL</Label>
                  <Input
                    id="link-url"
                    value={(selectedBlock.content as any).url || ''}
                    onChange={(e) => handleContentChange({ url: e.target.value })}
                    placeholder="https://example.com"
                  />
                </div>

                <div>
                  <Label htmlFor="link-slug">Custom Slug (Optional)</Label>
                  <Input
                    id="link-slug"
                    value={(selectedBlock.content as any).slug || ''}
                    onChange={(e) => handleContentChange({ slug: e.target.value })}
                    placeholder="my-website"
                  />
                </div>
              </div>
            )}

            {/* COPY TEXT FORM */}
            {selectedBlock.type === BlockTypeEnum.COPY_TEXT && (
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

            {/* MARKDOWN FORM */}
            {selectedBlock.type === BlockTypeEnum.MARKDOWN && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="markdown-text">Content</Label>
                  <Textarea
                    id="markdown-text"
                    value={(selectedBlock.content as any).text || ''}
                    onChange={(e) => handleContentChange({ text: e.target.value })}
                    placeholder="Enter your text content..."
                    rows={8}
                  />
                </div>
              </div>
            )}

            {/* EXPAND FORM */}
            {selectedBlock.type === BlockTypeEnum.EXPAND && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="expand-title">Title</Label>
                  <Input
                    id="expand-title"
                    value={(selectedBlock.content as any).title || ''}
                    onChange={(e) => handleContentChange({ title: e.target.value })}
                    placeholder="Learn More"
                  />
                </div>

                <div>
                  <Label htmlFor="expand-content">Content</Label>
                  <Textarea
                    id="expand-content"
                    value={(selectedBlock.content as any).markdown || ''}
                    onChange={(e) => handleContentChange({ markdown: e.target.value })}
                    placeholder="Expandable content..."
                    rows={6}
                  />
                </div>
              </div>
            )}

            {/* BUTTON FORM */}
            {selectedBlock.type === BlockTypeEnum.BUTTON && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="button-label">Label</Label>
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
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // Right Panel - Live Preview
  const RightPanel = () => (
    <div className="flex h-full w-80 flex-col border-l border-gray-200 dark:border-gray-700">
      <div className="border-b border-gray-200 p-4 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Live Preview</h3>
          <Button size="sm" variant="outline" onClick={() => setPreviewMode(!previewMode)}>
            {previewMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {previewMode ? 'Edit' : 'Preview'}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-50 p-4 dark:bg-gray-900">
        {/* iPhone Mockup */}
        <div className="mx-auto max-w-[280px]">
          <div className="relative rounded-[2.5rem] bg-black p-2 shadow-2xl">
            <div className="overflow-hidden rounded-[2rem] bg-white">
              {/* iPhone Status Bar */}
              <div className="flex items-center justify-between bg-black px-4 py-1 text-xs text-white">
                <span>9:41</span>
                <div className="flex gap-1">
                  <div className="h-2 w-4 rounded-sm bg-white"></div>
                  <div className="h-2 w-6 rounded-sm bg-white"></div>
                </div>
              </div>

              {/* Profile Preview */}
              <div className="min-h-[500px] space-y-4 p-6">
                {blocks.length === 0 ? (
                  <div className="py-12 text-center text-gray-500">
                    <Smartphone className="mx-auto mb-2 h-8 w-8 opacity-50" />
                    <p className="text-sm">Preview will appear here</p>
                    <p className="text-xs">Add elements to see live preview</p>
                  </div>
                ) : (
                  blocks
                    .sort((a, b) => a.order - b.order)
                    .map((block) => {
                      const content = block.content as any;

                      switch (block.type) {
                        case BlockTypeEnum.SOCIAL:
                          return (
                            <div key={block.id} className="rounded-lg bg-gray-100 p-3 text-center">
                              <div className="text-sm font-medium">
                                {content.displayName || `Follow me on ${content.platform}`}
                              </div>
                              {content.username && (
                                <div className="text-xs text-gray-600">{content.username}</div>
                              )}
                            </div>
                          );

                        case BlockTypeEnum.LINK:
                          return (
                            <div
                              key={block.id}
                              className="rounded-lg bg-blue-500 p-3 text-center text-white"
                            >
                              <div className="text-sm font-medium">{content.title}</div>
                            </div>
                          );

                        case BlockTypeEnum.COPY_TEXT:
                          return (
                            <div
                              key={block.id}
                              className="rounded-lg border border-green-200 bg-green-100 p-3 text-center"
                            >
                              <div className="text-sm">{content.text}</div>
                              {content.label && (
                                <div className="mt-1 text-xs text-green-600">{content.label}</div>
                              )}
                            </div>
                          );

                        case BlockTypeEnum.MARKDOWN:
                          return (
                            <div key={block.id} className="prose prose-sm max-w-none">
                              <div className="whitespace-pre-wrap text-sm">{content.text}</div>
                            </div>
                          );

                        case BlockTypeEnum.EXPAND:
                          return (
                            <div key={block.id} className="rounded-lg border border-gray-200">
                              <div className="bg-gray-50 p-3 text-sm font-medium">
                                {content.title}
                              </div>
                              <div className="p-3 text-xs text-gray-600">{content.markdown}</div>
                            </div>
                          );

                        case BlockTypeEnum.BUTTON:
                          return (
                            <div
                              key={block.id}
                              className="rounded-lg bg-blue-500 p-3 text-center text-white"
                            >
                              <div className="text-sm font-medium">{content.label}</div>
                            </div>
                          );

                        default:
                          return null;
                      }
                    })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-full bg-white dark:bg-gray-800">
      <LeftPanel />
      <MiddlePanel />
      <RightPanel />
    </div>
  );
}
