'use client';

import { useMemo, useState, type CSSProperties } from 'react';
import * as LucideIcons from 'lucide-react';
import {
  ChevronDown,
  CheckCircle,
  Copy,
  ExternalLink,
  FileText,
  Loader2,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@acme/ui';
import { Button } from '@acme/ui';
import { toast } from '@acme/ui';

import type {
  Block,
  ButtonBlockContent,
  CopyTextBlockContent,
  ExpandBlockContent,
  MarkdownBlockContent,
} from '@/types/blocks';
import { getButtonColorClass } from '@/lib/block-types';

interface BlockRendererProps {
  block: Block;
  isPreview?: boolean;
  isInteractive?: boolean;
  className?: string;
}

const LEGACY_ICON_NAME_MAP: Record<string, string> = {
  github: 'Github',
  twitter: 'Twitter',
  linkedin: 'Linkedin',
  instagram: 'Instagram',
  youtube: 'Youtube',
  website: 'Globe',
  globe: 'Globe',
  link: 'Link',
};

function resolveLucideIcon(iconName?: string | null): LucideIcon | null {
  if (!iconName) return null;

  const normalized = LEGACY_ICON_NAME_MAP[iconName.toLowerCase()] ?? iconName;
  const Icon = (LucideIcons as Record<string, unknown>)[normalized];
  return typeof Icon === 'function' ? (Icon as LucideIcon) : null;
}

function isHexColor(color: string) {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color);
}

export function BlockRenderer({
  block,
  isPreview = false,
  isInteractive = true,
  className,
}: BlockRendererProps) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(
    block.type === 'EXPAND' ? ((block.content as ExpandBlockContent).isOpen ?? false) : false,
  );
  const [iframeLoading, setIframeLoading] = useState(false);

  const Icon = useMemo(() => resolveLucideIcon(block.iconName), [block.iconName]);

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
    } catch {
      toast({
        title: 'Copy failed',
        description: 'Unable to copy text to clipboard',
        variant: 'destructive',
      });
    }
  };

  const renderMarkdown = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, index) => {
      if (line.startsWith('# ')) {
        return (
          <h1 key={index} className="mb-4 text-2xl font-bold">
            {line.substring(2)}
          </h1>
        );
      }
      if (line.startsWith('## ')) {
        return (
          <h2 key={index} className="mb-3 text-xl font-semibold">
            {line.substring(3)}
          </h2>
        );
      }
      if (line.startsWith('### ')) {
        return (
          <h3 key={index} className="mb-2 text-lg font-medium">
            {line.substring(4)}
          </h3>
        );
      }
      if (line.startsWith('- ')) {
        return (
          <li key={index} className="ml-4">
            {line.substring(2)}
          </li>
        );
      }
      if (line.startsWith('**') && line.endsWith('**')) {
        return (
          <p key={index} className="mb-2 font-semibold">
            {line.slice(2, -2)}
          </p>
        );
      }
      if (line.trim() === '') {
        return <br key={index} />;
      }

      return (
        <p key={index} className="mb-2">
          {line}
        </p>
      );
    });
  };

  const markdownStyle: CSSProperties = {
    color: block.fontColor ?? undefined,
    backgroundColor: block.bgColor ?? undefined,
  };

  switch (block.type) {
    case 'MARKDOWN': {
      const content = block.content as MarkdownBlockContent;

      return (
        <div className={cn('markdown-block block', className)} style={markdownStyle}>
          <div
            className={cn('prose prose-sm max-w-none', block.bgColor ? 'rounded-lg px-4 py-3' : '')}
          >
            {renderMarkdown(content.text)}
          </div>
        </div>
      );
    }

    case 'BUTTON': {
      const content = block.content as ButtonBlockContent;

      const isHex = isHexColor(content.color);
      const classFromPreset = isHex ? '' : getButtonColorClass(content.color);

      const sizeClass =
        {
          small: 'px-3 py-2 text-sm',
          medium: 'px-4 py-3 text-base',
          large: 'px-6 py-4 text-lg',
        }[content.size] ?? 'px-4 py-3 text-base';

      const style: CSSProperties | undefined = isHex
        ? { backgroundColor: content.color, color: '#ffffff' }
        : undefined;

      const href = `/api/buttons/${block.id}/click`;

      return (
        <div className={cn('button-block block', className)}>
          <Button
            asChild
            className={cn(
              'w-full justify-center rounded-lg font-medium transition-all duration-200',
              'hover:scale-[1.01] active:scale-[0.99]',
              sizeClass,
              classFromPreset,
              isPreview && 'pointer-events-none',
            )}
            style={style}
          >
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                if (isPreview || !isInteractive) e.preventDefault();
              }}
            >
              {Icon ? <Icon className="h-4 w-4" /> : null}
              <span className="truncate">{content.label}</span>
              <ExternalLink className="h-4 w-4 opacity-60" />
            </a>
          </Button>
        </div>
      );
    }

    case 'COPY_TEXT': {
      const content = block.content as CopyTextBlockContent;
      const value = (content.value ?? content.text ?? '').toString();

      return (
        <div className={cn('copy-text-block block', className)}>
          <div
            className="flex items-center gap-3 rounded-lg border p-3"
            style={
              block.bgColor || block.fontColor
                ? {
                    backgroundColor: block.bgColor ?? undefined,
                    color: block.fontColor ?? undefined,
                  }
                : undefined
            }
          >
            {Icon ? (
              <div className="rounded-lg bg-black/5 p-2 dark:bg-white/10">
                <Icon className="h-4 w-4" />
              </div>
            ) : null}

            <div className="min-w-0 flex-1">
              {content.label ? (
                <p className="mb-1 text-xs font-medium opacity-70">{content.label}</p>
              ) : null}
              <p className="break-all font-mono text-sm">{value}</p>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => handleCopyText(value)}
              disabled={isPreview || !isInteractive}
              className="shrink-0"
            >
              {copied ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      );
    }

    case 'EXPAND': {
      const content = block.content as ExpandBlockContent;
      const isOpen = expanded;

      const containerStyle: CSSProperties | undefined =
        block.bgColor || block.fontColor
          ? { backgroundColor: block.bgColor ?? undefined, color: block.fontColor ?? undefined }
          : undefined;

      return (
        <div className={cn('expand-block block', className)}>
          <details
            className="group rounded-lg border"
            style={containerStyle}
            open={isOpen}
            onToggle={(e) => setExpanded(e.currentTarget.open)}
          >
            <summary
              className={cn(
                'flex cursor-pointer list-none items-center justify-between rounded-lg p-3 transition-colors',
                !block.bgColor && 'bg-muted/40 hover:bg-muted/60',
              )}
            >
              <h3 className="text-sm font-medium">{content.title}</h3>
              <ChevronDown
                className={cn('h-4 w-4 transition-transform duration-200', isOpen && 'rotate-180')}
              />
            </summary>

            <div className={cn('px-4 pb-4', !block.bgColor && 'bg-background')}>
              {content.contentType === 'markdown' ? (
                <div className="prose prose-sm max-w-none pt-3">{renderMarkdown(content.markdown || '')}</div>
              ) : null}

              {content.contentType === 'iframe' ? (
                <div className="relative pt-3">
                  {iframeLoading ? (
                    <div className="flex items-center justify-center p-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="ml-2">Loading...</span>
                    </div>
                  ) : null}

                  <iframe
                    src={content.iframeUrl ?? ''}
                    className="h-64 w-full rounded"
                    onLoad={() => setIframeLoading(false)}
                    onError={() => setIframeLoading(false)}
                    style={{ display: iframeLoading ? 'none' : 'block' }}
                    title={content.title}
                  />
                </div>
              ) : null}

              {content.contentType === 'both' ? (
                <div className="space-y-4 pt-3">
                  {content.markdown ? (
                    <div className="prose prose-sm max-w-none">{renderMarkdown(content.markdown)}</div>
                  ) : null}

                  {content.iframeUrl ? (
                    <div className="relative">
                      {iframeLoading ? (
                        <div className="flex items-center justify-center p-8">
                          <Loader2 className="h-6 w-6 animate-spin" />
                          <span className="ml-2">Loading...</span>
                        </div>
                      ) : null}

                      <iframe
                        src={content.iframeUrl}
                        className="h-64 w-full rounded"
                        onLoad={() => setIframeLoading(false)}
                        onError={() => setIframeLoading(false)}
                        style={{ display: iframeLoading ? 'none' : 'block' }}
                        title={content.title}
                      />
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </details>
        </div>
      );
    }

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
