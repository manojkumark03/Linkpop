import { redirect } from 'next/navigation';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';

interface ResetPasswordPageProps {
  searchParams: { token?: string };
}

export default function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const token = searchParams.token;

  if (!token) {
    redirect('/auth/forgot-password');
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <ResetPasswordForm token={token} />
    </div>
  );
}
