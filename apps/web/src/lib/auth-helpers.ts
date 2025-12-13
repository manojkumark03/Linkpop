import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from './auth';

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth/login');
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireAuth();
  if (user.role !== 'ADMIN') {
    redirect('/');
  }
  return user;
}

export async function checkUserStatus() {
  const user = await getCurrentUser();
  if (user?.status === 'DISABLED') {
    redirect('/auth/suspended');
  }
  return user;
}
