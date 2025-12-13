# Security Practices

This document outlines the security measures implemented in this application's authentication system.

## Authentication

### Password Security

- **Hashing**: Passwords are hashed using bcrypt with a cost factor of 12
- **Validation**: Passwords must meet the following requirements:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
- **Storage**: Passwords are never stored in plain text

### Session Management

- **Strategy**: JWT-based sessions with NextAuth.js
- **Duration**: 30-day session lifetime with 24-hour refresh interval
- **Cookies**: Secure, HTTP-only cookies with SameSite protection
  - Production: Uses `__Secure-` and `__Host-` prefixes
  - Development: Standard cookie names for easier testing

### CSRF Protection

- Built-in CSRF token validation via NextAuth.js
- Tokens are HTTP-only and have SameSite protection
- Separate CSRF token for each session

### Rate Limiting

The following endpoints have rate limiting implemented:

- **Registration** (`/api/auth/register`): 5 requests per minute per IP
- **Password Reset Request** (`/api/auth/password-reset/request`): 3 requests per minute per IP
- **Password Reset** (`/api/auth/password-reset/reset`): 5 requests per minute per IP

Note: In-memory rate limiting is used by default. For production with multiple instances, consider implementing Redis-based rate limiting.

## OAuth Integration

- Supports GitHub and Google OAuth providers
- OAuth credentials are stored securely in environment variables
- Account linking is handled automatically for matching email addresses
- OAuth accounts are validated for suspended status

## Account Suspension

- Accounts can be suspended by setting `status` to `DISABLED`
- Suspended accounts:
  - Cannot sign in
  - Cannot reset passwords
  - Are blocked at middleware level

## Password Reset

- Tokens are cryptographically secure (32 random bytes)
- Tokens expire after 1 hour
- One token per user (new token invalidates old ones)
- Tokens are single-use (deleted after successful reset)
- In development, tokens are logged to console instead of emailed

## Middleware Protection

The application uses Next.js middleware to protect routes:

- Public routes: `/auth/*`, `/api/auth/*`
- Admin routes: `/admin/*` (requires ADMIN role)
- Protected routes: `/dashboard/*` (requires authentication)
- Suspended accounts are redirected

## Role-Based Access Control

Two roles are supported:

- **USER**: Default role for all registered users
- **ADMIN**: Elevated privileges, seeded via database seed script

## Environment Variables

Critical environment variables:

- `NEXTAUTH_SECRET`: Must be a cryptographically secure random string
  - Generate using: `openssl rand -base64 32`
  - Never commit this to version control
- `DATABASE_URL`: Connection string for PostgreSQL database
- OAuth credentials: Keep secure and never expose in client-side code

## Email Security

- Password reset emails use secure SMTP
- In development, emails are logged instead of sent
- Email service credentials are stored in environment variables
- Reset links expire after 1 hour

## Best Practices for Production

1. **Environment Variables**
   - Use a secure secrets manager
   - Rotate secrets regularly
   - Never commit `.env` files to version control

2. **Database**
   - Use SSL/TLS connections
   - Enable connection pooling
   - Regular backups with encryption

3. **Rate Limiting**
   - Implement Redis-based rate limiting for multi-instance deployments
   - Monitor and adjust limits based on traffic patterns
   - Consider adding additional rate limits for login attempts

4. **Monitoring**
   - Log all authentication attempts
   - Set up alerts for suspicious activity
   - Monitor rate limit hits

5. **Updates**
   - Keep dependencies updated
   - Subscribe to security advisories for Next.js and NextAuth.js
   - Regular security audits

## Reporting Security Issues

If you discover a security vulnerability, please email security@example.com. Do not open public issues for security vulnerabilities.
