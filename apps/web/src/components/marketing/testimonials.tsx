'use client';

import { Card, CardContent } from '@acme/ui';
import { siteConfig } from '@/lib/site-config';

interface Testimonial {
  name: string;
  role: string;
  content: string;
  avatar?: string;
}

interface TestimonialsProps {
  testimonials?: Testimonial[];
  className?: string;
}

export function Testimonials({ testimonials, className }: TestimonialsProps) {
  const displayTestimonials = testimonials || siteConfig.testimonials;

  return (
    <section className={`py-24 sm:py-32 ${className || ''}`}>
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Loved by creators worldwide
          </h2>
          <p className="text-muted-foreground mt-6 text-lg leading-8">
            See what our community of creators, influencers, and businesses have to say about
            Linkforest.
          </p>
        </div>
        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {displayTestimonials.map((testimonial, index) => (
            <Card key={index} className="border-0 shadow-lg">
              <CardContent className="p-8">
                <blockquote className="text-muted-foreground text-base leading-7">
                  "{testimonial.content}"
                </blockquote>
                <figcaption className="mt-6 flex items-center">
                  <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                    <span className="text-primary text-sm font-medium">
                      {testimonial.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </span>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-semibold leading-6">{testimonial.name}</div>
                    <div className="text-muted-foreground text-sm">{testimonial.role}</div>
                  </div>
                </figcaption>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
