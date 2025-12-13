import type { Metadata } from 'next';
import { siteConfig } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: `Terms of Service for ${siteConfig.name}. Read our terms and conditions for using our platform.`,
};

export default function TermsPage() {
  return (
    <div className="py-24 sm:py-32">
      <div className="container">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Terms of Service</h1>
          <p className="text-muted-foreground mt-6 text-sm">Last updated: December 13, 2024</p>

          <div className="mt-16 space-y-12">
            <section>
              <h2 className="text-2xl font-bold tracking-tight">1. Acceptance of Terms</h2>
              <div className="text-muted-foreground mt-6 space-y-4">
                <p>
                  By accessing and using {siteConfig.name} ("the Service"), you accept and agree to
                  be bound by the terms and provision of this agreement. If you do not agree to
                  abide by the above, please do not use this service.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold tracking-tight">2. Description of Service</h2>
              <div className="text-muted-foreground mt-6 space-y-4">
                <p>
                  {siteConfig.name} is a link-in-bio platform that allows users to create
                  customizable landing pages to share multiple links. The Service includes website
                  creation tools, analytics, and related features.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold tracking-tight">3. User Accounts</h2>
              <div className="text-muted-foreground mt-6 space-y-4">
                <p>
                  To use certain features of the Service, you must register for an account. You are
                  responsible for maintaining the confidentiality of your account information and
                  for all activities that occur under your account.
                </p>
                <p>
                  You agree to notify us immediately of any unauthorized use of your account or any
                  other breach of security.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold tracking-tight">4. Acceptable Use Policy</h2>
              <div className="text-muted-foreground mt-6 space-y-4">
                <p>You agree not to use the Service to:</p>
                <ul className="list-disc space-y-2 pl-6">
                  <li>Violate any applicable laws or regulations</li>
                  <li>Infringe on intellectual property rights</li>
                  <li>Distribute malware or engage in phishing</li>
                  <li>Spam or send unsolicited communications</li>
                  <li>Create content that is harmful, abusive, or offensive</li>
                  <li>Attempt to gain unauthorized access to our systems</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold tracking-tight">5. Content Ownership</h2>
              <div className="text-muted-foreground mt-6 space-y-4">
                <p>
                  You retain ownership of the content you create and share through {siteConfig.name}
                  . By using our Service, you grant us a limited license to host, store, and display
                  your content solely for the purpose of providing the Service.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold tracking-tight">6. Privacy</h2>
              <div className="text-muted-foreground mt-6 space-y-4">
                <p>
                  Your privacy is important to us. Please review our Privacy Policy, which also
                  governs your use of the Service, to understand our practices.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold tracking-tight">7. Payment and Refunds</h2>
              <div className="text-muted-foreground mt-6 space-y-4">
                <p>
                  Paid subscriptions are billed in advance on a monthly or annual basis. All fees
                  are non-refundable except as required by law or as explicitly stated in these
                  terms.
                </p>
                <p>
                  We reserve the right to change our pricing at any time with 30 days' notice to
                  existing subscribers.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold tracking-tight">8. Service Availability</h2>
              <div className="text-muted-foreground mt-6 space-y-4">
                <p>
                  While we strive for 99.9% uptime, we do not guarantee uninterrupted service. We
                  may temporarily suspend the Service for maintenance, updates, or improvements.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold tracking-tight">9. Limitation of Liability</h2>
              <div className="text-muted-foreground mt-6 space-y-4">
                <p>
                  {siteConfig.name} shall not be liable for any indirect, incidental, special,
                  consequential, or punitive damages, including without limitation, loss of profits,
                  data, use, goodwill, or other intangible losses.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold tracking-tight">10. Termination</h2>
              <div className="text-muted-foreground mt-6 space-y-4">
                <p>
                  We may terminate or suspend your account immediately, without prior notice or
                  liability, for any reason whatsoever, including without limitation if you breach
                  the Terms.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold tracking-tight">11. Changes to Terms</h2>
              <div className="text-muted-foreground mt-6 space-y-4">
                <p>
                  We reserve the right, at our sole discretion, to modify or replace these Terms at
                  any time. If a revision is material, we will try to provide at least 30 days'
                  notice prior to any new terms taking effect.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold tracking-tight">12. Contact Information</h2>
              <div className="text-muted-foreground mt-6 space-y-4">
                <p>
                  If you have any questions about these Terms of Service, please contact us at
                  legal@linkpop.com or through our{' '}
                  <a href="/contact" className="text-primary hover:underline">
                    contact form
                  </a>
                  .
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
