import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Link2,
  Zap,
  BarChart3,
  Shield,
  Check,
  ArrowRight,
  Users,
  Globe,
  Palette,
} from "lucide-react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { GlobalNavbar } from "@/components/global-navbar";

export const metadata = {
  title: "Linkpop - Unlimited Links & Bios for Marketers",
  description:
    "The all-in-one platform for URL shortening and bio link pages. Track, manage, and grow your online presence.",
};

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-background">
      <GlobalNavbar user={user} />

      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-20 pb-16 md:pt-32 md:pb-24">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Zap className="size-4" />
            Your Marketing Swiss Army Knife
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-balance">
            Unlimited Links & Bios for Marketers
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
            Shorten URLs, build bio pages, and track every click with analytics
            & screen recordings.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button size="lg" asChild className="w-full sm:w-auto">
              <Link href="/signup">
                Get Started Free
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="w-full sm:w-auto bg-transparent"
            >
              <Link href="/pricing">View Pricing</Link>
            </Button>
          </div>

          <div className="pt-8 text-sm text-muted-foreground">
            No credit card required · Free forever · Upgrade anytime
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">
              Everything you need to succeed
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed for creators, marketers, and businesses
              of all sizes
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardContent className="pt-6">
                <Link2 className="size-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  Smart URL Shortener
                </h3>
                <p className="text-muted-foreground">
                  Create memorable short links with custom codes. Perfect for
                  social media, campaigns, and sharing.
                </p>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardContent className="pt-6">
                <Palette className="size-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  Beautiful Bio Pages
                </h3>
                <p className="text-muted-foreground">
                  Design stunning link-in-bio pages with themes, custom colors,
                  and advanced block types.
                </p>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardContent className="pt-6">
                <BarChart3 className="size-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  Powerful Analytics
                </h3>
                <p className="text-muted-foreground">
                  Track every click with detailed insights. Understand your
                  audience and optimize performance.
                </p>
              </CardContent>
            </Card>

            {/* Feature 4 */}
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardContent className="pt-6">
                <Globe className="size-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Custom Domains</h3>
                <p className="text-muted-foreground">
                  Use your own domain for links and bio pages. Build trust and
                  strengthen your brand.
                </p>
              </CardContent>
            </Card>

            {/* Feature 5 */}
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardContent className="pt-6">
                <Shield className="size-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  Enterprise Security
                </h3>
                <p className="text-muted-foreground">
                  Your data is protected with enterprise-grade security, rate
                  limiting, and encryption.
                </p>
              </CardContent>
            </Card>

            {/* Feature 6 */}
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardContent className="pt-6">
                <Users className="size-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  Made for Creators
                </h3>
                <p className="text-muted-foreground">
                  Built specifically for content creators, influencers, and
                  businesses who need more.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="container mx-auto px-4 py-16 md:py-24 border-y">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Trusted by thousands worldwide
            </h2>
            <p className="text-lg text-muted-foreground">
              Join creators and businesses who are growing with Linkpop
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">50K+</div>
              <div className="text-muted-foreground">Active users</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">10M+</div>
              <div className="text-muted-foreground">Links created</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">99.9%</div>
              <div className="text-muted-foreground">Uptime SLA</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto">
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="pt-12 pb-12 text-center space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold">
                Ready to amplify your links?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Join thousands of creators and businesses using Linkpop to
                manage their online presence
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Button size="lg" asChild className="w-full sm:w-auto">
                  <Link href="/signup">
                    Start for Free
                    <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="w-full sm:w-auto bg-transparent"
                >
                  <Link href="/pricing">See Plans</Link>
                </Button>
              </div>
              <div className="pt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Check className="size-4 text-primary" />
                  No credit card required
                </div>
                <div className="flex items-center gap-2">
                  <Check className="size-4 text-primary" />
                  Free forever plan
                </div>
                <div className="flex items-center gap-2">
                  <Check className="size-4 text-primary" />
                  Cancel anytime
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Link2 className="size-5 text-primary" />
              <span className="font-semibold">Linkpop</span>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2025 Linkpop. All rights reserved.
            </div>
            <div className="flex items-center gap-6 text-sm">
              <Link
                href="/pricing"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Pricing
              </Link>
              <a
                href="#"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Privacy
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Terms
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
