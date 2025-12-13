'use client';

import * as React from 'react';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@acme/ui';

type Props = {
  children: React.ReactNode;
  onError?: (error: Error, info: React.ErrorInfo) => void;
  fallback?: React.ReactNode;
};

type State = { error?: Error };

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: undefined };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.props.onError?.(error, info);
  }

  reset = () => {
    this.setState({ error: undefined });
  };

  render() {
    if (!this.state.error) return this.props.children;

    if (this.props.fallback) return this.props.fallback;

    return (
      <Card>
        <CardHeader>
          <CardTitle>Something went wrong</CardTitle>
          <CardDescription>{this.state.error.message}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button type="button" onClick={this.reset}>
            Try again
          </Button>
        </CardContent>
      </Card>
    );
  }
}
