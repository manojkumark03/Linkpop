'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from '@acme/ui';

import { Button } from '@acme/ui';
import { Input } from '@acme/ui';
import { Label } from '@acme/ui';
import { Textarea } from '@acme/ui';
import { Checkbox } from '@acme/ui';

const contactFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  email: z.string().email('Invalid email address'),
  message: z
    .string()
    .min(10, 'Message must be at least 10 characters')
    .max(2000, 'Message is too long'),
  consent: z
    .boolean()
    .refine((val) => val === true, 'You must agree to our terms and privacy policy'),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

interface ContactFormProps {
  className?: string;
}

export function ContactForm({ className }: ContactFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    mode: 'onChange',
  });

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          metadata: {
            userAgent: navigator.userAgent,
            referrer: document.referrer,
            timestamp: new Date().toISOString(),
          },
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Message sent!',
          description: result.message,
        });
        reset();
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Something went wrong. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Contact form error:', error);
      toast({
        title: 'Error',
        description: 'Network error. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={`space-y-6 ${className || ''}`}>
      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          type="text"
          placeholder="Your full name"
          {...register('name')}
          className={errors.name ? 'border-red-500' : ''}
        />
        {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          placeholder="your@email.com"
          {...register('email')}
          className={errors.email ? 'border-red-500' : ''}
        />
        {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Message *</Label>
        <Textarea
          id="message"
          placeholder="Tell us how we can help you..."
          rows={5}
          {...register('message')}
          className={errors.message ? 'border-red-500' : ''}
        />
        {errors.message && <p className="text-sm text-red-500">{errors.message.message}</p>}
        <p className="text-muted-foreground text-sm">
          {2000 - (register('message')?.value?.length || 0)} characters remaining
        </p>
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox
          id="consent"
          {...register('consent')}
          className={errors.consent ? 'border-red-500' : ''}
        />
        <div className="grid gap-1.5 leading-none">
          <Label
            htmlFor="consent"
            className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            I agree to the{' '}
            <a href="/terms" className="text-primary hover:underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </a>
            *
          </Label>
          {errors.consent && <p className="text-sm text-red-500">{errors.consent.message}</p>}
        </div>
      </div>

      <Button type="submit" disabled={!isValid || isSubmitting} className="w-full">
        {isSubmitting ? 'Sending...' : 'Send message'}
      </Button>
    </form>
  );
}
