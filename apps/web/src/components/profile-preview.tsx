'use client';

import { useState, useEffect } from 'react';
import type { Block } from '@/types/blocks';
import { BlockTypeEnum } from '@/lib/block-types';

interface ProfilePreviewProps {
  profileId: string;
  blocks: Block[];
  className?: string;
}

export function ProfilePreview({ profileId, blocks, className = '' }: ProfilePreviewProps) {
  const [isLoading, setIsLoading] = useState(false);

  const profileElements = blocks
    .filter((block) => block.parentType === 'PROFILE' && block.parentId === profileId)
    .sort((a, b) => a.order - b.order);

  const renderElement = (block: Block) => {
    const content = block.content as any;

    switch (block.type) {
      case BlockTypeEnum.SOCIAL:
        return (
          <div
            key={block.id}
            className="rounded-lg border border-pink-200 bg-pink-50 p-4 text-center"
          >
            <div className="text-sm font-medium text-pink-800">
              {content.displayName || `Follow me on ${content.platform}`}
            </div>
            {content.username && (
              <div className="mt-1 text-xs text-pink-600">{content.username}</div>
            )}
            {content.url && (
              <div className="mt-1 break-all text-xs text-pink-500">{content.url}</div>
            )}
          </div>
        );

      case BlockTypeEnum.LINK:
        return (
          <a
            key={block.id}
            href={content.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-lg bg-blue-500 p-4 text-center text-white transition-colors hover:bg-blue-600"
          >
            <div className="text-sm font-medium">{content.title}</div>
            {content.slug && <div className="mt-1 text-xs text-blue-100">{content.slug}</div>}
          </a>
        );

      case BlockTypeEnum.COPY_TEXT:
        return (
          <div
            key={block.id}
            className="cursor-pointer rounded-lg border border-green-200 bg-green-50 p-4 text-center transition-colors hover:bg-green-100"
            onClick={() => {
              navigator.clipboard.writeText(content.value || content.text || '');
            }}
          >
            <div className="text-sm">{content.value || content.text}</div>
            {content.label && <div className="mt-1 text-xs text-green-600">{content.label}</div>}
            <div className="mt-1 text-xs text-green-500">Click to copy</div>
          </div>
        );

      case BlockTypeEnum.MARKDOWN:
        return (
          <div key={block.id} className="prose prose-sm max-w-none">
            <div className="whitespace-pre-wrap text-sm text-gray-800">{content.text}</div>
          </div>
        );

      case BlockTypeEnum.EXPAND:
        return (
          <div key={block.id} className="overflow-hidden rounded-lg border border-gray-200">
            <div className="bg-gray-50 p-3 text-sm font-medium text-gray-800">{content.title}</div>
            {content.markdown && (
              <div className="p-3 text-xs text-gray-600">{content.markdown}</div>
            )}
          </div>
        );

      case BlockTypeEnum.BUTTON:
        return (
          <a
            key={block.id}
            href={content.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`block rounded-lg p-4 text-center transition-colors ${
              content.style === 'outline'
                ? 'border-2 border-blue-500 text-blue-500 hover:bg-blue-50'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            <div className="text-sm font-medium">{content.label}</div>
          </a>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {profileElements.length === 0 ? (
        <div className="py-12 text-center text-gray-500">
          <div className="text-sm">No elements added yet</div>
          <div className="text-xs">Add your first element to get started</div>
        </div>
      ) : (
        profileElements.map(renderElement)
      )}
    </div>
  );
}
