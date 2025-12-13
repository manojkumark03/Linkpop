import type { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@acme/ui';
import { siteConfig } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'Resources',
  description: `Resources and guides to help you make the most of ${siteConfig.name}. Tips, tutorials, and best practices for creators.`,
};

const resources = [
  {
    title: 'Getting Started Guide',
    description: 'Complete walkthrough of setting up your first Linkpop page.',
    href: '/resources/getting-started',
    category: 'Tutorial',
  },
  {
    title: 'Design Best Practices',
    description: 'Learn how to create visually appealing pages that convert.',
    href: '/resources/design-best-practices',
    category: 'Design',
  },
  {
    title: 'Analytics Deep Dive',
    description: 'Understanding your audience through link analytics.',
    href: '/resources/analytics',
    category: 'Analytics',
  },
  {
    title: 'Social Media Integration',
    description: 'Maximizing your social media presence with Linkpop.',
    href: '/resources/social-media',
    category: 'Marketing',
  },
  {
    title: 'SEO for Link-in-Bio',
    description: 'Optimize your page for search engines and discovery.',
    href: '/resources/seo',
    category: 'SEO',
  },
  {
    title: 'Content Strategy',
    description: 'Planning and organizing your links for maximum impact.',
    href: '/resources/content-strategy',
    category: 'Strategy',
  },
  {
    title: 'Monetization Tips',
    description: 'Turn your audience into customers with strategic link placement.',
    href: '/resources/monetization',
    category: 'Business',
  },
  {
    title: 'Creator Case Studies',
    description: 'Real success stories from our community of creators.',
    href: '/resources/case-studies',
    category: 'Case Study',
  },
];

const categories = [
  'All',
  'Tutorial',
  'Design',
  'Analytics',
  'Marketing',
  'SEO',
  'Strategy',
  'Business',
  'Case Study',
];

export default function ResourcesPage() {
  return (
    <div className="py-24 sm:py-32">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Resources & Guides</h1>
          <p className="text-muted-foreground mt-6 text-lg leading-8">
            Everything you need to succeed with {siteConfig.name}. From beginner guides to advanced
            strategies.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-2xl">
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((category) => (
              <button
                key={category}
                className="bg-background hover:bg-accent hover:text-accent-foreground rounded-full border px-4 py-2 text-sm font-medium transition-colors"
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-6xl">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {resources.map((resource, index) => (
              <Card key={index} className="transition-shadow hover:shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{resource.title}</CardTitle>
                    <span className="bg-primary/10 text-primary rounded-full px-2 py-1 text-xs">
                      {resource.category}
                    </span>
                  </div>
                  <CardDescription>{resource.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link
                    href={resource.href}
                    className="text-primary text-sm font-medium hover:underline"
                  >
                    Read more →
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight">Need More Help?</h2>
          <p className="text-muted-foreground mt-4">
            Can't find what you're looking for? Our support team is here to help you succeed.
          </p>
          <div className="mt-6 space-x-4">
            <Link
              href="/contact"
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center rounded-md px-6 py-3 text-sm font-medium shadow"
            >
              Contact Support
            </Link>
            <Link
              href="/faq"
              className="bg-background hover:bg-accent hover:text-accent-foreground inline-flex items-center justify-center rounded-md border px-6 py-3 text-sm font-medium"
            >
              View FAQ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
