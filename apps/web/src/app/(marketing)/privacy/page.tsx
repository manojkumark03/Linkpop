import type { Metadata } from 'next';
import { siteConfig } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: `Privacy Policy for ${siteConfig.name}. Learn how we collect, use, and protect your personal information.`,
};

export default function PrivacyPage() {
  return (
    <div className="py-24 sm:py-32">
      <div className="container">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Privacy Policy</h1>
          <p className="text-muted-foreground mt-6 text-sm">Last updated: December 13, 2024</p>

          <div className="mt-16 space-y-12">
            <section>
              <h2 className="text-2xl font-bold tracking-tight">1. Information We Collect</h2>
              <div className="text-muted-foreground mt-6 space-y-4">
                <h3 className="text-lg font-semibold">Information You Provide</h3>
                <p>
                  When you create an account with {siteConfig.name}, we collect information you
                  provide directly to us, such as your name, email address, and any other
                  information you choose to include in your profile.
                </p>

                <h3 className="mt-6 text-lg font-semibold">Information We Collect Automatically</h3>
                <p>
                  We may automatically collect certain information about your use of the Service,
                  including your IP address, browser type, device information, pages visited, time
                  spent on pages, and referring website.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold tracking-tight">2. How We Use Your Information</h2>
              <div className="text-muted-foreground mt-6 space-y-4">
                <p>We use the information we collect to:</p>
                <ul className="list-disc space-y-2 pl-6">
                  <li>Provide, maintain, and improve our Service</li>
                  <li>Process transactions and send related information</li>
                  <li>Send technical notices, updates, and support messages</li>
                  <li>Respond to your comments and questions</li>
                  <li>Analyze usage patterns to enhance user experience</li>
                  <li>Prevent fraud and abuse</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold tracking-tight">3. Information Sharing</h2>
              <div className="text-muted-foreground mt-6 space-y-4">
                <p>
                  We do not sell, trade, or otherwise transfer your personal information to third
                  parties without your consent, except as described in this policy. We may share
                  your information in the following circumstances:
                </p>
                <ul className="list-disc space-y-2 pl-6">
                  <li>With service providers who assist us in operating our platform</li>
                  <li>To comply with legal obligations</li>
                  <li>To protect our rights and prevent fraud</li>
                  <li>In connection with a business transfer or merger</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold tracking-tight">4. Data Security</h2>
              <div className="text-muted-foreground mt-6 space-y-4">
                <p>
                  We implement appropriate security measures to protect your personal information
                  against unauthorized access, alteration, disclosure, or destruction. However, no
                  method of transmission over the internet is 100% secure.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold tracking-tight">5. Data Retention</h2>
              <div className="text-muted-foreground mt-6 space-y-4">
                <p>
                  We retain your personal information for as long as necessary to provide the
                  Service and as required by law. You may request deletion of your account and
                  associated data at any time.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold tracking-tight">6. Your Rights</h2>
              <div className="text-muted-foreground mt-6 space-y-4">
                <p>Depending on your location, you may have the following rights:</p>
                <ul className="list-disc space-y-2 pl-6">
                  <li>Access to your personal information</li>
                  <li>Correction of inaccurate information</li>
                  <li>Deletion of your personal information</li>
                  <li>Portability of your data</li>
                  <li>Objection to processing of your data</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold tracking-tight">7. Cookies and Tracking</h2>
              <div className="text-muted-foreground mt-6 space-y-4">
                <p>
                  We use cookies and similar tracking technologies to enhance your experience on our
                  platform. You can control cookie settings through your browser preferences.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold tracking-tight">8. Children's Privacy</h2>
              <div className="text-muted-foreground mt-6 space-y-4">
                <p>
                  Our Service is not intended for children under 13 years of age. We do not
                  knowingly collect personal information from children under 13. If you are a parent
                  and believe your child has provided us with personal information, please contact
                  us.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold tracking-tight">9. International Users</h2>
              <div className="text-muted-foreground mt-6 space-y-4">
                <p>
                  {siteConfig.name} is operated from the United States. If you are accessing our
                  Service from outside the United States, please be aware that your information may
                  be transferred to, stored, and processed in the United States where our servers
                  are located.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold tracking-tight">10. Changes to Privacy Policy</h2>
              <div className="text-muted-foreground mt-6 space-y-4">
                <p>
                  We may update this Privacy Policy from time to time. We will notify you of any
                  changes by posting the new Privacy Policy on this page and updating the "Last
                  updated" date.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold tracking-tight">11. Contact Us</h2>
              <div className="text-muted-foreground mt-6 space-y-4">
                <p>
                  If you have any questions about this Privacy Policy, please contact us at
                  privacy@linkforest.com or through our{' '}
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
