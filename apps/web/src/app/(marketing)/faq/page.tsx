import type { Metadata } from 'next';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@acme/ui';
import { siteConfig } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'FAQ',
  description: `Frequently asked questions about ${siteConfig.name}. Find answers to common questions about our platform and features.`,
};

const faqs = [
  {
    question: 'What is Linkforest?',
    answer:
      'Linkforest is a link-in-bio platform that helps you create beautiful, customizable pages to share all your important links in one place. Perfect for creators, influencers, and businesses who want to centralize their online presence.',
  },
  {
    question: 'How do I get started?',
    answer:
      'Getting started is easy! Simply sign up for a free account, claim your unique Linkforest URL, add your links, and customize your page to match your brand. You can be up and running in just a few minutes.',
  },
  {
    question: 'Is Linkforest free?',
    answer:
      'Yes! We offer a free plan that includes 5 custom links, basic themes, click analytics, and mobile responsiveness. We also have Pro and Business plans with advanced features for growing creators and businesses.',
  },
  {
    question: 'Can I change my Linkforest username?',
    answer:
      'Your username can only be changed once within the first 7 days of account creation. After that, it becomes permanent to maintain link consistency for your audience.',
  },
  {
    question: 'What kind of links can I add?',
    answer:
      "You can add any type of link - social media profiles, websites, YouTube videos, Spotify playlists, product pages, blog posts, and more. There's no limit to the creativity!",
  },
  {
    question: 'Do you offer custom domains?',
    answer:
      'Yes! Pro and Business plan users can connect their own custom domain to their Linkforest page. This helps maintain brand consistency and makes your links even easier to remember.',
  },
  {
    question: 'How does the analytics work?',
    answer:
      'Our built-in analytics track clicks on each of your links, showing you total clicks, referrer sources, geographic data, and device types. This helps you understand your audience better.',
  },
  {
    question: 'Can I schedule when links go live?',
    answer:
      "Currently, all links are live immediately when added. However, you can archive or hide links at any time, and we're working on scheduling features for future releases.",
  },
  {
    question: 'Is my data secure?',
    answer:
      'Absolutely! We use enterprise-grade security measures to protect your data, including encryption at rest and in transit. We never sell your data to third parties.',
  },
  {
    question: 'Can I collaborate with a team?',
    answer:
      'Yes! Our Business plan includes team collaboration features that allow multiple people to manage a Linkforest page, perfect for businesses and organizations.',
  },
  {
    question: 'How do I contact support?',
    answer:
      'You can reach our support team by filling out the contact form on our Contact page, emailing hello@linkforest.com, or visiting our Help Center for self-service options.',
  },
  {
    question: 'Can I export my data?',
    answer:
      'Yes! You can export all your data, including analytics and link information, at any time. We believe your data belongs to you.',
  },
];

export default function FAQPage() {
  return (
    <div className="py-24 sm:py-32">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Frequently Asked Questions
          </h1>
          <p className="text-muted-foreground mt-6 text-lg leading-8">
            Find answers to common questions about {siteConfig.name}. Can't find what you're looking
            for?{' '}
            <a href="/contact" className="text-primary hover:underline">
              Get in touch
            </a>
            .
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-3xl">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="mx-auto mt-16 max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight">Still have questions?</h2>
          <p className="text-muted-foreground mt-4">
            Our support team is here to help. Send us a message and we'll get back to you within 24
            hours.
          </p>
          <div className="mt-6">
            <a
              href="/contact"
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center rounded-md px-6 py-3 text-sm font-medium shadow"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
