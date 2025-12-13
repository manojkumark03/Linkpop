import type { Metadata } from 'next';
import { ContactForm } from '@/components/marketing/contact-form';
import { siteConfig } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'Contact us',
  description: `Get in touch with the ${siteConfig.name} team. We're here to help and answer any question you might have.`,
};

export default function ContactPage() {
  return (
    <div className="py-24 sm:py-32">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Get in touch</h1>
          <p className="text-muted-foreground mt-6 text-lg leading-8">
            We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-2xl">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <ContactForm />
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold">Contact information</h3>
                <div className="mt-4 space-y-4">
                  <div>
                    <p className="text-muted-foreground text-sm">Email</p>
                    <p className="font-medium">hello@linkpop.com</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Response time</p>
                    <p className="font-medium">Within 24 hours</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold">Other ways to reach us</h3>
                <ul className="text-muted-foreground mt-4 space-y-2 text-sm">
                  <li>
                    • Help Center:{' '}
                    <a href="/help" className="text-primary hover:underline">
                      linkpop.com/help
                    </a>
                  </li>
                  <li>
                    • Community:{' '}
                    <a href="/community" className="text-primary hover:underline">
                      community.linkpop.com
                    </a>
                  </li>
                  <li>
                    • Status:{' '}
                    <a href="/status" className="text-primary hover:underline">
                      status.linkpop.com
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
