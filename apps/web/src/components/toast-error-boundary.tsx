'use client';

import * as React from 'react';
import { toast } from '@acme/ui';

import { ErrorBoundary } from './error-boundary';

export function ToastErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      onError={(error) => {
        toast({
          title: 'Something went wrong',
          description: error.message,
          variant: 'destructive',
        });
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
