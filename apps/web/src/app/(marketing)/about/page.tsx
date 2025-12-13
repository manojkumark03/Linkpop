import type { Metadata } from 'next';
import { siteConfig } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'About us',
  description: `Learn about ${siteConfig.name}, our mission, and the team behind the platform.`,
};

export default function AboutPage() {
  return (
    <div className="py-24 sm:py-32">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">About {siteConfig.name}</h1>
          <p className="text-muted-foreground mt-6 text-lg leading-8">
            We're on a mission to help creators, influencers, and businesses share their story with
            the world through beautiful link-in-bio pages.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-4xl">
          <div className="space-y-16">
            <section>
              <h2 className="text-2xl font-bold tracking-tight">Our Story</h2>
              <div className="text-muted-foreground mt-6 space-y-6">
                <p>
                  {siteConfig.name} was born out of a simple frustration: sharing multiple links
                  across different platforms was clunky, inconsistent, and didn't do justice to the
                  amazing content creators were producing.
                </p>
                <p>
                  We believed there had to be a better way. A way for creators to showcase all their
                  work in one beautiful, customizable page that truly represented their brand and
                  engaged their audience.
                </p>
                <p>
                  Today, {siteConfig.name} serves thousands of creators worldwide, helping them
                  centralize their online presence and build stronger connections with their
                  audience.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold tracking-tight">Our Mission</h2>
              <div className="text-muted-foreground mt-6 space-y-6">
                <p>
                  To empower creators and businesses with tools that make sharing content
                  effortless, beautiful, and effective.
                </p>
                <p>
                  We believe every creator deserves a platform that reflects the quality of their
                  work and helps them connect with their audience in meaningful ways.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold tracking-tight">Our Values</h2>
              <div className="mt-8 grid gap-8 sm:grid-cols-2">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Creativity First</h3>
                  <p className="text-muted-foreground">
                    We believe in empowering creators with tools that inspire creativity and
                    self-expression.
                  </p>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Privacy & Security</h3>
                  <p className="text-muted-foreground">
                    Your data and your audience belong to you. We build with privacy and security at
                    our core.
                  </p>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Simplicity</h3>
                  <p className="text-muted-foreground">
                    Powerful doesn't have to mean complicated. We design intuitive experiences that
                    get out of your way.
                  </p>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Community</h3>
                  <p className="text-muted-foreground">
                    We're building more than a platform—we're fostering a community of creators who
                    support each other.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold tracking-tight">Join Our Journey</h2>
              <div className="text-muted-foreground mt-6 space-y-6">
                <p>
                  Whether you're a content creator, influencer, small business owner, or just
                  someone with a story to tell, we're here to help you share it with the world.
                </p>
                <p>
                  Ready to get started?{' '}
                  <a href="/auth/register" className="text-primary font-medium hover:underline">
                    Create your free account
                  </a>{' '}
                  and join thousands of creators who trust {siteConfig.name} with their online
                  presence.
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
