# Authentication System

This application uses NextAuth.js v4 with a comprehensive authentication system supporting email/password credentials, OAuth providers (GitHub, Google), password reset functionality, and role-based access control.

## Features

- ✅ Email/Password authentication with bcrypt hashing
- ✅ OAuth integration (GitHub, Google)
- ✅ Password reset via email tokens
- ✅ Rate limiting on auth endpoints
- ✅ CSRF protection
- ✅ Secure JWT sessions
- ✅ Role-based access control (USER, ADMIN)
- ✅ Account suspension handling
- ✅ Middleware-based route protection

## Setup

### 1. Environment Variables

Copy `.env.example` to `.env` and configure the following:

```bash
# Required
DATABASE_URL="postgresql://user:pass@localhost:5432/dbname"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# Optional OAuth
GITHUB_ID="your-github-oauth-app-id"
GITHUB_SECRET="your-github-oauth-app-secret"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Optional Email (for password reset)
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-password"
EMAIL_FROM="noreply@yourdomain.com"
```

### 2. Database Migration

Run the Prisma migration to set up the database schema:

```bash
pnpm --filter web prisma migrate dev
```

### 3. Seed Admin User

Seed the database with an admin user:

```bash
pnpm --filter web prisma db seed
```

Default admin credentials:

- Email: `admin@acme.com`
- Password: `Admin123!`

**Important:** Change this password in production!

## API Endpoints

### Registration

```
POST /api/auth/register
Body: { name, email, password }
```

### Login

```
POST /api/auth/signin (NextAuth endpoint)
Or use: /auth/login page
```

### Password Reset Request

```
POST /api/auth/password-reset/request
Body: { email }
```

### Password Reset

```
POST /api/auth/password-reset/reset
Body: { token, password }
```

### Logout

```
GET /api/auth/signout
```

## Pages

- `/auth/login` - Login page
- `/auth/register` - Registration page
- `/auth/forgot-password` - Request password reset
- `/auth/reset-password?token=xxx` - Reset password with token
- `/auth/error` - Authentication error page
- `/auth/suspended` - Account suspended notice

## Protected Routes

The middleware automatically protects routes:

- `/dashboard/*` - Requires authentication
- `/admin/*` - Requires ADMIN role
- Public routes: `/auth/*`, `/api/auth/*`

## Usage in Components

### Server Components

```tsx
import { requireAuth, requireAdmin, getCurrentUser } from '@/lib/auth-helpers';

export default async function ProtectedPage() {
  const user = await requireAuth(); // Redirects if not authenticated
  return <div>Hello {user.name}</div>;
}

export default async function AdminPage() {
  const admin = await requireAdmin(); // Redirects if not admin
  return <div>Admin Dashboard</div>;
}
```

### Client Components

```tsx
'use client';
import { useSession, signIn, signOut } from 'next-auth/react';

export default function ClientComponent() {
  const { data: session, status } = useSession();

  if (status === 'loading') return <div>Loading...</div>;
  if (!session) return <button onClick={() => signIn()}>Sign In</button>;

  return (
    <div>
      <p>Signed in as {session.user.email}</p>
      <button onClick={() => signOut()}>Sign Out</button>
    </div>
  );
}
```

## Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

## Rate Limits

- Registration: 5 requests per minute per IP
- Password reset request: 3 requests per minute per IP
- Password reset: 5 requests per minute per IP

## Testing

### Run Unit Tests

```bash
pnpm --filter web test
```

### Run E2E Tests

```bash
pnpm --filter web test:e2e
```

## Security

See [SECURITY.md](./SECURITY.md) for detailed security information and best practices.

## Account Management

### Suspend a User

Update the user's status in the database:

```sql
UPDATE "User" SET status = 'DISABLED' WHERE email = 'user@example.com';
```

Suspended users:

- Cannot log in
- Cannot reset passwords
- Are automatically redirected if already logged in

### Promote User to Admin

```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'user@example.com';
```

## Development Notes

- In development, password reset emails are logged to console instead of being sent
- Rate limiting uses in-memory storage (reset on server restart)
- For production, consider implementing Redis-based rate limiting

## Troubleshooting

### "Invalid credentials" error

- Verify the user exists in the database
- Check that the password meets requirements
- Ensure the account is not suspended

### OAuth not working

- Verify OAuth credentials are set correctly
- Check callback URLs in OAuth provider settings
- Ensure NEXTAUTH_URL matches your domain

### Password reset emails not sending

- Check EMAIL*SERVER*\* environment variables
- Verify SMTP credentials are correct
- In development, check console logs for the reset token

## Production Checklist

- [ ] Generate secure NEXTAUTH_SECRET
- [ ] Change default admin password
- [ ] Configure email service
- [ ] Set up OAuth providers with production URLs
- [ ] Implement Redis-based rate limiting
- [ ] Enable HTTPS (required for secure cookies)
- [ ] Review and update CORS settings
- [ ] Set up monitoring and alerting
- [ ] Regular security audits
