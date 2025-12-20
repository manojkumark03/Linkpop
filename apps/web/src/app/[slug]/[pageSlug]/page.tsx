import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { prisma } from '@/lib/prisma';
import { normalizeThemeSettings } from '@/lib/theme-settings';
import { PageViewTracker } from '@/components/page-view-tracker';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: { slug: string; pageSlug: string };
}): Promise<Metadata> {
  const page = await prisma.page.findFirst({
    where: {
      slug: params.pageSlug,
      isPublished: true,
      profile: {
        slug: params.slug,
        deletedAt: null,
        status: 'ACTIVE',
      },
    },
    include: {
      profile: {
        select: { displayName: true, slug: true },
      },
    },
  });

  if (!page) {
    return {
      title: 'Page not found',
      robots: { index: false, follow: false },
    };
  }

  const title = `${page.title} - ${page.profile.displayName || '@' + page.profile.slug}`;

  return {
    title,
    description: `Read ${page.title} on ${page.profile.displayName || '@' + page.profile.slug}'s profile`,
    alternates: {
      canonical: `/${page.profile.slug}/${page.slug}`,
    },
  };
}

export default async function MarkdownPage({
  params,
}: {
  params: { slug: string; pageSlug: string };
}) {
  const page = await prisma.page.findFirst({
    where: {
      slug: params.pageSlug,
      isPublished: true,
      profile: {
        slug: params.slug,
        deletedAt: null,
        status: 'ACTIVE',
      },
    },
    include: {
      profile: {
        select: {
          slug: true,
          displayName: true,
          bio: true,
          image: true,
          themeSettings: true,
        },
      },
    },
  });

  if (!page) {
    notFound();
  }

  const theme = normalizeThemeSettings(page.profile.themeSettings);

  return (
    <div
      className="min-h-screen"
      style={{
        background: theme.backgroundColor,
        color: theme.textColor,
        fontFamily: 'var(--font-outfit)',
      }}
    >
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="container mx-auto max-w-4xl px-4 py-6">
          <Link
            href={`/${page.profile.slug}`}
            className="inline-flex items-center text-sm transition-opacity hover:opacity-80"
            style={{ color: theme.textColor }}
          >
            ← Back to {page.profile.displayName || page.profile.slug}
          </Link>
        </div>
      </header>

      {/* Page content */}
      <main className="container mx-auto max-w-4xl px-4 py-12">
        <article className="prose prose-lg prose-invert max-w-none">
          <h1 style={{ color: theme.textColor }}>{page.title}</h1>
          <div
            className="prose-content"
            style={
              {
                color: theme.textColor,
                '--tw-prose-body': theme.textColor,
                '--tw-prose-headings': theme.textColor,
                '--tw-prose-lead': theme.textColor,
                '--tw-prose-links': theme.buttonColor,
                '--tw-prose-bold': theme.textColor,
                '--tw-prose-counters': theme.textColor,
                '--tw-prose-bullets': theme.textColor,
                '--tw-prose-hr': theme.textColor + '40',
                '--tw-prose-quotes': theme.textColor,
                '--tw-prose-quote-borders': theme.textColor + '40',
                '--tw-prose-captions': theme.textColor,
                '--tw-prose-code': theme.textColor,
                '--tw-prose-pre-code': '#ffffff',
                '--tw-prose-pre-bg': '#1f2937',
                '--tw-prose-th-borders': theme.textColor + '40',
                '--tw-prose-td-borders': theme.textColor + '20',
              } as React.CSSProperties
            }
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                // Custom styling for links
                a: ({ node, ...props }) => (
                  <a
                    {...props}
                    className="underline transition-opacity hover:opacity-80"
                    style={{ color: theme.buttonColor }}
                  />
                ),
                // Custom styling for code blocks
                code: ({ node, ...props }) => (
                  <code {...props} className="rounded bg-white/10 px-1 py-0.5 text-sm" />
                ),
                pre: ({ node, ...props }) => (
                  <pre {...props} className="overflow-x-auto rounded-lg bg-gray-800 p-4" />
                ),
              }}
            >
              {page.content}
            </ReactMarkdown>
          </div>
        </article>
      </main>

      {/* Track page view */}
      <PageViewTracker pageId={page.id} />
    </div>
  );
}
