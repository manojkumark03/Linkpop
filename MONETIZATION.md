# Analytics & Monetization Implementation

This document covers the analytics, monetization, and admin features implemented for the platform.

## Features Implemented

### 1. Analytics Capture

The analytics system tracks user interactions on shared links:

- **Click Tracking**: Every click is recorded with timestamp
- **Geo Location**: Country detection via headers
- **Device Detection**: Device type (Desktop, Mobile, Tablet, Bot)
- **Referrer Tracking**: Referring domain/source
- **User Agent**: Browser and OS information

#### API Endpoints

**POST /api/analytics** - Track a click event

```json
{
  "linkId": "link-id",
  "referrer": "https://twitter.com" // optional, defaults to referer header
}
```

**GET /api/analytics** - Get analytics for a link

```
GET /api/analytics?linkId=<linkId>&days=7
```

Response includes:

- Total clicks in period
- Breakdown by country
- Breakdown by device type
- Breakdown by referrer
- Clicks by day (for charting)

### 2. Analytics Aggregation

The aggregation system provides cached, pre-computed statistics for dashboard performance.

#### API Endpoints

**POST /api/analytics/aggregate** - Trigger aggregation

```json
{
  "profile_ids": ["profile-1", "profile-2"] // optional, aggregates all if not provided
}
```

**GET /api/analytics/aggregate** - Get cached stats

```
GET /api/analytics/aggregate?profileId=<profileId>
```

#### Cron Configuration

For Vercel, add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/analytics/aggregate",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

For other hosts, use a cron job:

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://yourdomain.com/api/analytics/aggregate
```

Set `CRON_SECRET` environment variable to secure the endpoint.

### 3. Admin Panel

#### Pages

**Admin Dashboard** (`/admin`)

- Overview of admin functions
- Links to user management, analytics, and billing

**User Management** (`/admin/users`)

- Search and filter users by name, email, status, and role
- Suspend/activate user accounts
- Promote/demote users to/from admin
- View user profiles and subscription count

**Analytics Overview** (`/admin/analytics`)

- System-wide metrics:
  - Total users and active users
  - Total profiles and links
  - Total clicks with 7d/30d breakdown
  - Subscription statistics
- Geographic distribution
- Device type breakdown
- Recent activity feed

**Billing Management** (`/admin/billing`)

- Subscription statistics by plan
- Subscription status distribution
- Estimated monthly recurring revenue (MRR)
- Churn rate calculation
- Recent subscriptions list with status

#### Admin API Routes

**PATCH /api/admin/users/status**

```json
{
  "userId": "user-id",
  "status": "ACTIVE" | "DISABLED"
}
```

**PATCH /api/admin/users/role**

```json
{
  "userId": "user-id",
  "role": "USER" | "ADMIN"
}
```

### 4. Stripe Integration

The platform integrates with Stripe for subscription management:

- Free tier (default)
- Pro tier ($99/month)
- Business tier ($299/month)

#### API Endpoints

**POST /api/subscribe** - Subscription management

```json
{
  "action": "create-checkout" | "create-billing-portal",
  "plan": "PRO" | "BUSINESS"
}
```

**GET /api/subscribe** - Get current subscription
Returns subscription details and feature flags:

```json
{
  "plan": "PRO",
  "status": "ACTIVE",
  "currentPeriodStart": "2024-01-01T00:00:00Z",
  "currentPeriodEnd": "2024-02-01T00:00:00Z",
  "features": {
    "basicAnalytics": true,
    "advancedAnalytics": true,
    "customDomains": true,
    "scheduledLinks": true,
    "apiAccess": true,
    "teamMembers": false,
    "dedicatedSupport": false,
    "maxLinks": 100
  }
}
```

#### Webhook Handling

**POST /api/subscribe** - Stripe webhook
The endpoint handles these events:

- `customer.subscription.created` - New subscription
- `customer.subscription.updated` - Subscription change
- `customer.subscription.deleted` - Subscription cancelled

Set Stripe webhook endpoint to: `https://yourdomain.com/api/subscribe`

Events are verified using Stripe signature header.

### 5. Feature Flags

Feature flags are tied to subscription tiers:

#### Free Plan

- Basic analytics (click count, 7-day stats)
- Link tracking
- Max 10 links per profile

#### Pro Plan

- All Free features
- Advanced analytics (geo, device, referrer breakdown)
- Custom domains
- Scheduled links (future release)
- API access
- Max 100 links per profile

#### Business Plan

- All Pro features
- Team members
- Custom branding
- Dedicated support
- Unlimited links

Access feature flags via:

```typescript
import { getFeatureFlags, hasFeature } from '@/lib/feature-flags';

const flags = getFeatureFlags(userSubscriptionPlan);
if (hasFeature(userSubscriptionPlan, 'customDomains')) {
  // Show custom domains feature
}
```

### 6. Upgrade Prompts

The dashboard includes upgrade prompts when users reach feature limits:

- Link creation limit prompts
- Advanced analytics lock (Pro tier)
- Custom domain setup (Pro tier)

### 7. User Billing Page

**Dashboard Billing** (`/dashboard/billing`)

- Display current plan and status
- Show feature comparison table
- Upgrade/downgrade buttons
- Manage billing portal access
- Usage statistics

## Environment Variables

Add to `.env.local`:

```bash
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Analytics Aggregation
CRON_SECRET=your_secure_cron_secret

# Vercel (automatic)
VERCEL_ENV=production
```

## Vercel Deployment

1. **Add Environment Variables**
   - Go to Project Settings > Environment Variables
   - Add `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - Add `CRON_SECRET`

2. **Configure Webhook**
   - In Stripe Dashboard, go to Webhooks
   - Add endpoint: `https://yourdomain.com/api/subscribe`
   - Select events:
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
   - Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

3. **Setup Cron Jobs** (Vercel Enterprise)
   - Create or update `vercel.json`:

   ```json
   {
     "crons": [
       {
         "path": "/api/analytics/aggregate",
         "schedule": "0 */6 * * *"
       }
     ]
   }
   ```

   - Deploy

## Testing

### Run Unit Tests

```bash
pnpm test
```

### Run E2E Tests

```bash
pnpm test:e2e
```

### Test Analytics

```bash
# Track a click
curl -X POST http://localhost:3000/api/analytics \
  -H "Content-Type: application/json" \
  -d '{"linkId":"test-link-id"}'

# Get analytics
curl http://localhost:3000/api/analytics?linkId=test-link-id&days=7
```

### Test Aggregation

```bash
curl -X POST http://localhost:3000/api/analytics/aggregate \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json"
```

### Test Subscriptions

```bash
# Get subscription info
curl http://localhost:3000/api/subscribe

# Create checkout session
curl -X POST http://localhost:3000/api/subscribe \
  -H "Content-Type: application/json" \
  -d '{"action":"create-checkout","plan":"PRO"}'
```

## Database Migrations

The schema includes new fields for analytics and subscriptions:

```bash
# Generate Prisma client
pnpm --filter web prisma generate

# Create migration
pnpm --filter web prisma migrate dev --name add_analytics_monetization

# Apply migration
pnpm --filter web prisma migrate deploy
```

## Rate Limiting

Analytics endpoints use the existing rate limiting system:

- `/api/analytics` POST: 100 requests/minute per IP
- `/api/subscribe` POST: 10 requests/minute per IP

## Security Considerations

1. **Stripe Webhook Security**
   - Verify webhook signatures
   - Check STRIPE_WEBHOOK_SECRET is set in production

2. **Analytics Data Privacy**
   - Country data from IP headers (not stored)
   - User agents stored but not personally identifiable
   - No personal data in referrer tracking

3. **Admin Access**
   - Requires ADMIN role
   - Protected by middleware authentication
   - Admins cannot suspend themselves
   - Admins cannot demote themselves

4. **Cron Job Security**
   - Requires CRON_SECRET bearer token
   - Enable only for authorized origins
   - Rotate secret regularly

## Monitoring & Debugging

### Check Analytics Data

```bash
# In database
SELECT COUNT(*) FROM "Analytics";
SELECT * FROM "Analytics" ORDER BY "clicked_at" DESC LIMIT 10;
```

### Check Subscriptions

```bash
# In database
SELECT * FROM "Subscription" WHERE user_id = 'user-id';
```

### Monitor Stripe Webhooks

- Stripe Dashboard > Webhooks > Select endpoint
- View recent events and retry failed ones

### Check Cron Execution

- Vercel Dashboard > Deployments > Functions
- Look for `/api/analytics/aggregate` execution logs

## Future Enhancements

1. **Advanced Analytics**
   - Conversion tracking
   - UTM parameter parsing
   - Custom events
   - A/B testing

2. **Scheduled Links**
   - Queue links for future publication
   - Link scheduling UI
   - Auto-publish functionality

3. **Custom Domains**
   - Domain verification
   - SSL certificate setup
   - Custom domain routing

4. **Team Management**
   - Invite team members
   - Role-based access control
   - Audit logs

5. **API Improvements**
   - OAuth2 for third-party apps
   - WebhooksData exports
   - Batch operations

## Support

For issues or questions:

1. Check logs: `vercel logs <project-name>`
2. Review Stripe dashboard for webhook errors
3. Check database migrations status
4. Verify environment variables are set
