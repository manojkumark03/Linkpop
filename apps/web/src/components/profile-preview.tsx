'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { Block } from '@/types/blocks';
import { BlockTypeEnum } from '@/lib/block-types';

interface ProfileInfo {
  slug: string;
  displayName: string | null;
  bio: string | null;
  image: string | null;
  themeSettings: any;
}

interface LinkInfo {
  id: string;
  title: string;
  url: string;
  linkType: 'URL' | 'COPY_FIELD';
  status: string;
  deletedAt: Date | null;
  metadata: any;
}

interface PageInfo {
  id: string;
  title: string;
  slug: string;
  icon: string | null;
}

interface PublicProfilePageProps {
  profile: ProfileInfo;
  elements: any[];
  links?: LinkInfo[];
  showQr?: boolean;
  pages?: PageInfo[];
  className?: string;
}

interface DashboardBuilderProps {
  profileId: string;
  blocks: Block[];
  className?: string;
}

type ProfilePreviewProps = PublicProfilePageProps | DashboardBuilderProps;

export function ProfilePreview(props: ProfilePreviewProps) {
  const [isLoading] = useState(false);

  // Type guard to check if this is the public profile page interface
  const isPublicProfilePage = (props: ProfilePreviewProps): props is PublicProfilePageProps => {
    return 'profile' in props && 'elements' in props;
  };

  // Type guard to check if this is the dashboard builder interface
  const isDashboardBuilder = (props: ProfilePreviewProps): props is DashboardBuilderProps => {
    return 'profileId' in props && 'blocks' in props;
  };

  if (isPublicProfilePage(props)) {
    const { profile, elements, links, showQr, pages, className = '' } = props;

    return (
      <div className={`space-y-4 ${className}`}>
        <div className="mb-6 text-center">
          {profile.image && (
            <Image
              src={profile.image}
              alt={profile.displayName || profile.slug}
              width={80}
              height={80}
              className="mx-auto mb-4 rounded-full"
            />
          )}
          <h1 className="mb-2 text-2xl font-bold">{profile.displayName || profile.slug}</h1>
          {profile.bio && <p className="mb-4 text-gray-600 dark:text-gray-400">{profile.bio}</p>}
        </div>

        {/* Render new block-based elements */}
        {elements && elements.length > 0 && (
          <div className="space-y-3">
            {elements.map((element: any) => {
              // Handle different element types from the mapping
              switch (element.type) {
                case 'SOCIAL':
                  return (
                    <div
                      key={element.id}
                      className="rounded-lg border border-pink-200 bg-pink-50 p-4 text-center"
                    >
                      <div className="text-sm font-medium text-pink-800">
                        {element.content?.displayName ||
                          `Follow me on ${element.content?.platform}`}
                      </div>
                      {element.content?.username && (
                        <div className="mt-1 text-xs text-pink-600">{element.content.username}</div>
                      )}
                    </div>
                  );

                case 'LINK':
                  return (
                    <a
                      key={element.id}
                      href={element.content?.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-lg bg-blue-500 p-4 text-center text-white transition-colors hover:bg-blue-600"
                    >
                      <div className="text-sm font-medium">{element.content?.title}</div>
                    </a>
                  );

                case 'COPY_TEXT':
                  return (
                    <div
                      key={element.id}
                      className="rounded-lg border border-green-200 bg-green-50 p-4 text-center"
                    >
                      <div className="text-sm">{element.content?.text}</div>
                      {element.content?.label && (
                        <div className="mt-1 text-xs text-green-600">{element.content.label}</div>
                      )}
                    </div>
                  );

                case 'MARKDOWN':
                  return (
                    <div key={element.id} className="prose prose-sm max-w-none">
                      <div className="whitespace-pre-wrap text-sm text-gray-800">
                        {element.content?.text}
                      </div>
                    </div>
                  );

                case 'EXPAND':
                  return (
                    <div
                      key={element.id}
                      className="overflow-hidden rounded-lg border border-gray-200"
                    >
                      <div className="bg-gray-50 p-3 text-sm font-medium text-gray-800">
                        {element.content?.title}
                      </div>
                      {element.content?.markdown && (
                        <div className="p-3 text-xs text-gray-600">{element.content.markdown}</div>
                      )}
                    </div>
                  );

                case 'BUTTON':
                  return (
                    <a
                      key={element.id}
                      href={element.content?.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-lg bg-blue-500 p-4 text-center text-white transition-colors hover:bg-blue-600"
                    >
                      <div className="text-sm font-medium">{element.content?.label}</div>
                    </a>
                  );

                default:
                  return (
                    <div key={element.id} className="rounded-lg border border-gray-200 p-4">
                      <div className="text-xs text-gray-500">
                        Unknown element type: {element.type}
                      </div>
                    </div>
                  );
              }
            })}
          </div>
        )}

        {/* Render legacy links */}
        {links && links.length > 0 && (
          <div className="space-y-3">
            {links.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg bg-blue-500 p-4 text-center text-white transition-colors hover:bg-blue-600"
              >
                {link.title}
              </a>
            ))}
          </div>
        )}

        {/* Render pages if provided */}
        {pages && pages.length > 0 && (
          <div className="space-y-3">
            {pages.map((page) => (
              <a
                key={page.id}
                href={`/s/${page.slug}`}
                className="block rounded-lg bg-gray-100 p-4 text-center text-gray-800 transition-colors hover:bg-gray-200"
              >
                {page.icon && <span className="mr-2">{page.icon}</span>}
                {page.title}
              </a>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (isDashboardBuilder(props)) {
    const { profileId, blocks, className = '' } = props;

    if (!profileId || !blocks) {
      return <div className={className}>Invalid props</div>;
    }

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
              <div className="bg-gray-50 p-3 text-sm font-medium text-gray-800">
                {content.title}
              </div>
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

  // Fallback for invalid props
  return <div>Invalid ProfilePreview props</div>;
}
