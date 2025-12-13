import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@acme/ui';
import { requireAdmin } from '@/lib/auth-helpers';

export default async function AdminPage() {
  const admin = await requireAdmin();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground">Manage your application</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <a href="/dashboard">Dashboard</a>
          </Button>
          <Button variant="outline" asChild>
            <a href="/api/auth/signout">Sign Out</a>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Admin Access Granted</CardTitle>
          <CardDescription>You are logged in as an administrator</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">
              This page is only accessible to users with the ADMIN role.
            </p>
            <div className="rounded-md bg-green-50 p-4 dark:bg-green-900/20">
              <p className="text-sm font-medium text-green-800 dark:text-green-400">
                Welcome, {admin.name}!
              </p>
              <p className="text-sm text-green-700 dark:text-green-500">
                You have full administrative access to the system.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Manage users, roles, and suspend accounts
            </p>
            <Button variant="outline" size="sm" asChild className="mt-4">
              <a href="/admin/users">Go to Users</a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Analytics & Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">View system-wide metrics and statistics</p>
            <Button variant="outline" size="sm" asChild className="mt-4">
              <a href="/admin/analytics">View Analytics</a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Billing</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">Monitor subscriptions and revenue</p>
            <Button variant="outline" size="sm" asChild className="mt-4">
              <a href="/admin/billing">View Billing</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
