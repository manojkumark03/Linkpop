import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Button,
} from '@acme/ui';

export default function SuspendedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Account Suspended</CardTitle>
          <CardDescription>Your account has been suspended</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-destructive/10 text-destructive rounded-md p-4 text-sm">
            <p className="mb-2 font-semibold">Your account is currently suspended.</p>
            <p>If you believe this is an error, please contact support.</p>
          </div>
        </CardContent>
        <CardFooter>
          <Button asChild variant="outline" className="w-full">
            <a href="/api/auth/signout">Sign Out</a>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
