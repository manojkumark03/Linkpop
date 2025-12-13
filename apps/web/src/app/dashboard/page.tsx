import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@acme/ui';
import { requireAuth } from '@/lib/auth-helpers';

export default async function DashboardPage() {
  const user = await requireAuth();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to your protected dashboard</p>
        </div>
        <Button variant="outline" asChild>
          <a href="/api/auth/signout">Sign Out</a>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="font-medium">Name:</span> {user.name}
            </div>
            <div>
              <span className="font-medium">Email:</span> {user.email}
            </div>
            <div>
              <span className="font-medium">Role:</span>{' '}
              <span className={user.role === 'ADMIN' ? 'text-primary' : ''}>{user.role}</span>
            </div>
            <div>
              <span className="font-medium">Status:</span>{' '}
              <span className={user.status === 'ACTIVE' ? 'text-green-600' : 'text-red-600'}>
                {user.status}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full" asChild>
              <a href="/">Home</a>
            </Button>
            {user.role === 'ADMIN' && (
              <Button variant="outline" className="w-full" asChild>
                <a href="/admin">Admin Panel</a>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
