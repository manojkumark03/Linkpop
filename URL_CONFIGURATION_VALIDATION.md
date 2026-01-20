# URL Configuration Validation Guide

This document outlines all the edge cases and configurations for the LinkPop shortlink and domain system.

## Shortlink URL Format Changes

### Old Format (Deprecated)
- `linkpop.space/slug` - Root domain shortlinks (no longer used)

### New Format (Current)
- Username Subdomain: `username.linkpop.space/slug` (default)
- Custom Domain: `customdomain.com/slug` (when verified and enabled)

## Configuration Scenarios

### Scenario 1: User with NO Custom Domain
- **Shortlink URL**: `username.linkpop.space/slug`
- **Profile URL**: `username.linkpop.space`
- **Status**: Shortlinks use username subdomain
- **Files Affected**: url-list.tsx, shortlinks-analytics.tsx, insights-dashboard.tsx, url-shortener-form.tsx

### Scenario 2: User with Custom Domain (Not Verified)
- **Custom Domain**: Configured but `domain_verified = false`
- **Shortlink URL**: `username.linkpop.space/slug` (fallback)
- **Profile URL**: `username.linkpop.space` (fallback)
- **Status**: Waiting for verification
- **Files Affected**: custom-domain-management.tsx, dashboard-nav.tsx

### Scenario 3: User with Custom Domain (Verified, Shortlinks Disabled)
- **Custom Domain**: Verified, `use_domain_for_shortlinks = false`
- **Shortlink URL**: `username.linkpop.space/slug` (still uses subdomain)
- **Profile URL**: `customdomain.com` (displays bio page)
- **Root Domain Mode**: Can be "bio" or "redirect"
- **Files Affected**: shortlinks-analytics.tsx, url-list.tsx, custom-domain-management.tsx

### Scenario 4: User with Custom Domain (Verified, Shortlinks Enabled)
- **Custom Domain**: Verified, `use_domain_for_shortlinks = true`
- **Shortlink URL**: `customdomain.com/slug`
- **Profile URL**: `customdomain.com`
- **Root Domain Mode**: Can be "bio" or "redirect"
- **Files Affected**: All URL display components

### Scenario 5: User Deletes Custom Domain
- **Previous Domain**: Removed
- **domain_verified**: Reset to `false`
- **use_domain_for_shortlinks**: Reset to `true`
- **root_domain_mode**: Reset to `"bio"`
- **root_domain_redirect_url**: Reset to `null`
- **Result**: Reverts to username subdomain format
- **Files Affected**: custom-domain-management.tsx, lib/profile.tsx

## Critical Files to Check

### URL Display Components
1. **components/url-list.tsx** - Shortlinks table display
2. **components/shortlinks-analytics.tsx** - Analytics with shortlink URLs
3. **components/insights-dashboard.tsx** - Top shortlinks display
4. **components/url-shortener-form.tsx** - New shortlink creation feedback
5. **components/dashboard-nav.tsx** - Profile link in navigation
6. **components/linktree-editor.tsx** - Profile URL display
7. **components/linktree-profile-settings.tsx** - Profile settings display

### Domain Management
1. **components/custom-domain-management.tsx** - Domain configuration UI
2. **lib/profile.tsx** - Domain update and deletion logic
3. **app/api/profile/route.ts** - Profile update endpoint
4. **app/api/domains/verify/route.ts** - Domain verification endpoint
5. **proxy.ts** - Middleware for domain routing

## Validation Checklist

### For Each Component
- [ ] Uses `getDisplayUrl()` or equivalent for shortlinks
- [ ] Respects `custom_domain` field
- [ ] Respects `domain_verified` field
- [ ] Respects `use_domain_for_shortlinks` field
- [ ] Shows correct URL in preview/analytics
- [ ] Links are clickable and correct
- [ ] Works with all domain states (verified/unverified)

### For Custom Domain Deletion
- [ ] `custom_domain` is set to NULL
- [ ] `domain_verified` is set to false
- [ ] `use_domain_for_shortlinks` is reset to true
- [ ] `root_domain_mode` is reset to "bio"
- [ ] `root_domain_redirect_url` is cleared
- [ ] All URLs immediately revert to username subdomain format

### For Custom Domain Addition
- [ ] User can set custom domain
- [ ] `domain_verified` starts as false
- [ ] User must verify domain via DNS/CNAME
- [ ] After verification, user can enable for shortlinks
- [ ] User can choose root domain behavior (bio or redirect)

## Database Fields Reference

\`\`\`sql
-- User table fields related to domains and shortlinks
custom_domain VARCHAR(255) -- The custom domain name
domain_verified BOOLEAN -- Whether domain is verified
use_domain_for_shortlinks BOOLEAN -- Whether to use custom domain for shortlinks
root_domain_mode VARCHAR(20) -- 'bio' or 'redirect'
root_domain_redirect_url TEXT -- URL to redirect root domain to
\`\`\`

## URL Generation Examples

### Example 1: User "john" with no custom domain
\`\`\`
Short Code: my-link
Shortlink URL: https://john.linkpop.space/my-link
Profile URL: https://john.linkpop.space
\`\`\`

### Example 2: User "john" with custom domain "johnsmith.com" (verified, enabled)
\`\`\`
Short Code: my-link
Shortlink URL: https://johnsmith.com/my-link
Profile URL: https://johnsmith.com
Root Domain Behavior: Displays bio page
\`\`\`

### Example 3: User "john" with custom domain "johnsmith.com" (verified, disabled for shortlinks)
\`\`\`
Short Code: my-link
Shortlink URL: https://john.linkpop.space/my-link
Profile URL: https://johnsmith.com
Root Domain Behavior: Redirects to configured URL or bio page
\`\`\`

## Testing Commands

### Test Shortlink Generation
\`\`\`javascript
// In browser console
fetch('/api/urls', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    destination_url: 'https://example.com',
    title: 'Test Link'
  })
})
.then(r => r.json())
.then(data => console.log('Created shortlink:', data))
\`\`\`

### Test Domain Configuration
\`\`\`javascript
// In browser console
fetch('/api/profile', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    custom_domain: 'mydomain.com',
    use_domain_for_shortlinks: true
  })
})
.then(r => r.json())
.then(data => console.log('Updated profile:', data))
\`\`\`

## Known Limitations

1. All shortlinks created before domain verification will still use `username.linkpop.space` format
2. Root domain cannot be both bio page and redirect - choose one
3. Custom domain requires Pro tier subscription
4. Custom domain deletion is irreversible on user's side (domain config is cleared)
5. Domain verification requires correct DNS/CNAME setup
