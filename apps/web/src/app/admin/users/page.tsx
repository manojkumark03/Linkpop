import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from '@acme/ui';
import { requireAdmin } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { UserModeration } from './_components/user-moderation';

export default async function UserManagementPage({
  searchParams,
}: {
  searchParams: { search?: string; status?: string; role?: string; page?: string };
}) {
  await requireAdmin();

  const searchTerm = searchParams.search || '';
  const statusFilter = searchParams.status || '';
  const roleFilter = searchParams.role || '';
  const page = parseInt(searchParams.page || '1', 10);
  const pageSize = 20;

  // Build where clause
  const where: any = {
    deletedAt: null,
  };

  if (searchTerm) {
    where.OR = [
      { name: { contains: searchTerm, mode: 'insensitive' } },
      { email: { contains: searchTerm, mode: 'insensitive' } },
    ];
  }

  if (statusFilter && statusFilter !== 'all') {
    where.status = statusFilter;
  }

  if (roleFilter && roleFilter !== 'all') {
    where.role = roleFilter;
  }

  // Get total count
  const total = await prisma.user.count({ where });

  // Get users
  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      _count: {
        select: {
          profiles: true,
          subscriptions: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage users and their accounts</p>
        </div>
        <Button variant="outline" asChild>
          <a href="/admin">Back to Admin</a>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <form method="get" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <label className="text-sm font-medium">Search by name or email</label>
                <Input
                  type="text"
                  name="search"
                  placeholder="Search..."
                  defaultValue={searchTerm}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <select
                  name="status"
                  defaultValue={statusFilter || 'all'}
                  className="mt-1 w-full rounded-md border px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
                >
                  <option value="all">All</option>
                  <option value="ACTIVE">Active</option>
                  <option value="DISABLED">Disabled</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Role</label>
                <select
                  name="role"
                  defaultValue={roleFilter || 'all'}
                  className="mt-1 w-full rounded-md border px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
                >
                  <option value="all">All</option>
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button type="submit" className="w-full">
                  Search
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Users ({total})</CardTitle>
          <CardDescription>
            Showing {users.length} of {total} users
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-muted-foreground text-sm">No users found.</p>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="rounded-lg border p-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">{user.name || 'Unnamed User'}</h3>
                      <p className="text-muted-foreground text-sm">{user.email}</p>
                      <div className="mt-2 flex gap-2">
                        <span
                          className={`inline-block rounded px-2 py-1 text-xs font-medium ${
                            user.role === 'ADMIN'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                          }`}
                        >
                          {user.role}
                        </span>
                        <span
                          className={`inline-block rounded px-2 py-1 text-xs font-medium ${
                            user.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}
                        >
                          {user.status}
                        </span>
                      </div>
                      <p className="text-muted-foreground mt-2 text-xs">
                        Profiles: {user._count.profiles} | Subscriptions:{' '}
                        {user._count.subscriptions}
                      </p>
                    </div>
                    <UserModeration
                      userId={user.id}
                      currentStatus={user.status}
                      currentRole={user.role}
                      userName={user.name || user.email || 'User'}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {page > 1 && (
            <Button variant="outline" asChild>
              <a
                href={`?search=${searchTerm}&status=${statusFilter}&role=${roleFilter}&page=${page - 1}`}
              >
                Previous
              </a>
            </Button>
          )}
          <span className="text-muted-foreground text-sm">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Button variant="outline" asChild>
              <a
                href={`?search=${searchTerm}&status=${statusFilter}&role=${roleFilter}&page=${page + 1}`}
              >
                Next
              </a>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
