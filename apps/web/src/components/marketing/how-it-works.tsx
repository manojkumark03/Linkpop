'use client';

import { siteConfig } from '@/lib/site-config';

interface Step {
  step: string;
  title: string;
  description: string;
}

interface HowItWorksProps {
  steps?: Step[];
  className?: string;
}

export function HowItWorks({ steps, className }: HowItWorksProps) {
  const displaySteps = steps || siteConfig.howItWorks;

  return (
    <section className={`py-24 sm:py-32 ${className || ''}`}>
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">How it works</h2>
          <p className="text-muted-foreground mt-6 text-lg leading-8">
            Get started with Linkforest in just a few simple steps.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-4xl">
          <div className="space-y-16">
            {displaySteps.map((step, index) => (
              <div key={index} className="relative">
                <div className="flex flex-col md:flex-row md:items-center md:space-x-8">
                  <div className="flex-shrink-0">
                    <div className="bg-primary text-primary-foreground flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold">
                      {step.step}
                    </div>
                  </div>
                  <div className="mt-4 flex-1 md:mt-0">
                    <h3 className="text-xl font-semibold leading-8">{step.title}</h3>
                    <p className="text-muted-foreground mt-2 text-base leading-7">
                      {step.description}
                    </p>
                  </div>
                </div>
                {index < displaySteps.length - 1 && (
                  <div className="bg-border absolute left-8 top-16 h-16 w-px md:left-[4.5rem] md:top-20 md:h-20" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
