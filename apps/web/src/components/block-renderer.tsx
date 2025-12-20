'use client';

import { useState } from 'react';
import {
  ChevronDown,
  Copy,
  ExternalLink,
  MousePointer2,
  CheckCircle,
  FileText,
  Loader2,
} from 'lucide-react';
import { cn } from '@acme/ui';
import { Button } from '@acme/ui';
import { toast } from '@acme/ui';

import type { Block } from '@/types/blocks';
import { getButtonColorClass } from '@/lib/block-types';

interface BlockRendererProps {
  block: Block;
  isPreview?: boolean;
  isInteractive?: boolean;
  className?: string;
}

export function BlockRenderer({
  block,
  isPreview = false,
  isInteractive = true,
  className,
}: BlockRendererProps) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(block.content.isOpen || false);
  const [iframeLoading, setIframeLoading] = useState(false);

  const handleCopyText = async (text: string) => {
    if (!isInteractive || isPreview) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({
        title: 'Copied!',
        description: 'Text copied to clipboard',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      toast({
        title: 'Copy failed',
        description: 'Unable to copy text to clipboard',
        variant: 'destructive',
      });
    }
  };

  const handleButtonClick = (url: string) => {
    if (!isInteractive) return;

    if (isPreview) {
      // In preview mode, don't actually navigate
      console.log('Button clicked (preview):', url);
      return;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const renderMarkdown = (text: string) => {
    // Simple markdown renderer for basic formatting
    // In a real app, you'd use a proper markdown library like marked or remark
    const lines = text.split('\n');
    return lines.map((line, index) => {
      if (line.startsWith('# ')) {
        return (
          <h1 key={index} className="mb-4 text-2xl font-bold">
            {line.substring(2)}
          </h1>
        );
      } else if (line.startsWith('## ')) {
        return (
          <h2 key={index} className="mb-3 text-xl font-semibold">
            {line.substring(3)}
          </h2>
        );
      } else if (line.startsWith('### ')) {
        return (
          <h3 key={index} className="mb-2 text-lg font-medium">
            {line.substring(4)}
          </h3>
        );
      } else if (line.startsWith('- ')) {
        return (
          <li key={index} className="ml-4">
            {line.substring(2)}
          </li>
        );
      } else if (line.startsWith('**') && line.endsWith('**')) {
        return (
          <p key={index} className="mb-2 font-semibold">
            {line.slice(2, -2)}
          </p>
        );
      } else if (line.trim() === '') {
        return <br key={index} />;
      } else {
        return (
          <p key={index} className="mb-2">
            {line}
          </p>
        );
      }
    });
  };

  switch (block.type) {
    case 'MARKDOWN':
      return (
        <div className={cn('markdown-block block', className)}>
          <div className="prose prose-sm max-w-none">{renderMarkdown(block.content.text)}</div>
        </div>
      );

    case 'BUTTON':
      const buttonStyle = getButtonColorClass(block.content.color);
      const sizeClass = {
        small: 'px-3 py-1.5 text-sm',
        medium: 'px-4 py-2 text-base',
        large: 'px-6 py-3 text-lg',
      }[block.content.size];

      const styleClass =
        block.content.style === 'outline' ? `${buttonStyle} border-2 bg-transparent` : buttonStyle;

      return (
        <div className={cn('button-block block', className)}>
          <Button
            className={cn(
              styleClass,
              sizeClass,
              'w-full transition-all duration-200',
              'hover:scale-105 active:scale-95',
              isPreview && 'pointer-events-none',
            )}
            onClick={() => handleButtonClick(block.content.url)}
            disabled={isPreview || !isInteractive}
          >
            <MousePointer2 className="mr-2 h-4 w-4" />
            {block.content.label}
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </div>
      );

    case 'COPY_TEXT':
      return (
        <div className={cn('copy-text-block block', className)}>
          <div className="relative">
            <div className="flex items-center gap-2 rounded-lg border bg-gray-50 p-3 dark:bg-gray-800">
              <div className="min-w-0 flex-1">
                {block.content.label && (
                  <p className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                    {block.content.label}
                  </p>
                )}
                <p className="break-all font-mono text-sm">{block.content.text}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCopyText(block.content.text)}
                disabled={isPreview || !isInteractive}
                className="shrink-0"
              >
                {copied ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      );

    case 'EXPAND':
      const isOpen = expanded;

      return (
        <div className={cn('expand-block block', className)}>
          <details
            className="group"
            open={isOpen}
            onToggle={(e) => setExpanded(e.currentTarget.open)}
          >
            <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg border bg-gray-50 p-3 transition-colors hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700">
              <h3 className="text-sm font-medium">{block.content.title}</h3>
              <ChevronDown
                className={cn('h-4 w-4 transition-transform duration-200', isOpen && 'rotate-180')}
              />
            </summary>

            <div className="mt-2 rounded-lg border bg-white p-4 dark:bg-gray-900">
              {block.content.contentType === 'markdown' && (
                <div className="prose prose-sm max-w-none">
                  {renderMarkdown(block.content.markdown || '')}
                </div>
              )}

              {block.content.contentType === 'iframe' && (
                <div className="relative">
                  {iframeLoading && (
                    <div className="flex items-center justify-center p-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="ml-2">Loading...</span>
                    </div>
                  )}
                  <iframe
                    src={block.content.iframeUrl}
                    className="h-64 w-full rounded"
                    onLoad={() => setIframeLoading(false)}
                    onError={() => setIframeLoading(false)}
                    style={{ display: iframeLoading ? 'none' : 'block' }}
                    title={block.content.title}
                  />
                </div>
              )}

              {block.content.contentType === 'both' && (
                <div className="space-y-4">
                  {block.content.markdown && (
                    <div className="prose prose-sm max-w-none">
                      {renderMarkdown(block.content.markdown)}
                    </div>
                  )}
                  {block.content.iframeUrl && (
                    <div className="relative">
                      {iframeLoading && (
                        <div className="flex items-center justify-center p-8">
                          <Loader2 className="h-6 w-6 animate-spin" />
                          <span className="ml-2">Loading...</span>
                        </div>
                      )}
                      <iframe
                        src={block.content.iframeUrl}
                        className="h-64 w-full rounded"
                        onLoad={() => setIframeLoading(false)}
                        onError={() => setIframeLoading(false)}
                        style={{ display: iframeLoading ? 'none' : 'block' }}
                        title={block.content.title}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </details>
        </div>
      );

    default:
      return (
        <div
          className={cn(
            'unknown-block block rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20',
            className,
          )}
        >
          <p className="text-sm text-red-600 dark:text-red-400">Unknown block type: {block.type}</p>
        </div>
      );
  }
}

// Multi-block renderer for rendering multiple blocks in sequence
interface BlockListRendererProps {
  blocks: Block[];
  className?: string;
  isPreview?: boolean;
  isInteractive?: boolean;
}

export function BlockListRenderer({
  blocks,
  className,
  isPreview = false,
  isInteractive = true,
}: BlockListRendererProps) {
  if (!blocks || blocks.length === 0) {
    return (
      <div className={cn('py-8 text-center text-gray-500', className)}>
        <FileText className="mx-auto mb-2 h-8 w-8 opacity-50" />
        <p>No content blocks yet</p>
        <p className="text-sm">Add your first block to get started</p>
      </div>
    );
  }

  const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order);

  return (
    <div className={cn('space-y-4', className)}>
      {sortedBlocks.map((block) => (
        <BlockRenderer
          key={block.id}
          block={block}
          isPreview={isPreview}
          isInteractive={isInteractive}
        />
      ))}
    </div>
  );
}
