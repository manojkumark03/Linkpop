import { Suspense } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Button,
} from '@acme/ui';

function ErrorContent({ searchParams }: { searchParams: { error?: string } }) {
  const error = searchParams.error;

  const errorMessages: Record<string, string> = {
    Configuration: 'There is a problem with the server configuration.',
    AccessDenied: 'You do not have permission to sign in.',
    Verification: 'The verification token has expired or has already been used.',
    Default: 'An error occurred during authentication.',
  };

  const message = error ? errorMessages[error] || errorMessages.Default : errorMessages.Default;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Authentication Error</CardTitle>
        <CardDescription>Something went wrong</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">{message}</div>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <a href="/auth/login">Back to Sign In</a>
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function AuthErrorPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Suspense fallback={<div>Loading...</div>}>
        <ErrorContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
