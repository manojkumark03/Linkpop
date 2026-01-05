# Vercel Custom Domain Setup

This guide explains how to set up the Vercel API integration for custom domains.

## Required Environment Variables

Add these to your Vercel project settings (Settings → Environment Variables):

### 1. VERCEL_API_TOKEN

Create a Vercel API token:
1. Go to https://vercel.com/account/tokens
2. Click "Create Token"
3. Give it a name like "Linkpop Custom Domains"
4. Copy the token and add it as `VERCEL_API_TOKEN`
    
**Important**: Keep this token secret! Don't commit it to git.

### 2. VERCEL_PROJECT_ID

Find your project ID:
1. Go to your project settings on Vercel
2. Look for "Project ID" in the General tab
3. Copy it and add as `VERCEL_PROJECT_ID`

Example: `prj_abc123xyz456`

### 3. VERCEL_TEAM_ID (Optional)

Only needed if using a team account:
1. Go to your team settings
2. Find your Team ID
3. Add as `VERCEL_TEAM_ID`

If you're using a personal account, you can skip this.

## How It Works

When a user verifies their custom domain:

1. **DNS Verification**: We check that the domain's CNAME points to your app
2. **Vercel Integration**: We call Vercel's API to add the domain to your project
3. **Database Update**: We mark the domain as verified in the database
4. **SSL Certificate**: Vercel automatically provisions a Let's Encrypt certificate

## API Endpoints Used

- `POST /v10/projects/{projectId}/domains` - Add domain
- `DELETE /v9/projects/{projectId}/domains/{domain}` - Remove domain
- `GET /v9/projects/{projectId}/domains/{domain}` - Check domain status

## Error Handling

The system handles these scenarios:

- **Domain already added**: Proceeds successfully (idempotent)
- **Invalid token**: Returns clear error to user
- **Project not found**: Check your VERCEL_PROJECT_ID
- **Rate limits**: Automatically handled by Vercel

## Testing

1. Add environment variables to Vercel
2. Deploy the changes
3. Try adding a custom domain through the UI
4. Check Vercel dashboard → Domains to see it appear
5. Visit the custom domain to verify it works

## Troubleshooting

### "DEPLOYMENT_NOT_FOUND" Error

This means DNS is pointing correctly but Vercel doesn't know about the domain.
**Solution**: Make sure VERCEL_API_TOKEN and VERCEL_PROJECT_ID are set.

### "Forbidden" Error

Your API token doesn't have permission.
**Solution**: Create a new token with project write access.

### "Domain already in use"

The domain is already added to another Vercel project.
**Solution**: Remove it from the other project first.

## Security Notes

- API token has full project access - keep it secure
- Rate limiting (20 requests/min) prevents abuse
- Only Pro tier users can add custom domains
- DNS must be verified before Vercel integration

## Local Development

For local testing, create a `.env.local` file:

\`\`\`bash
VERCEL_API_TOKEN=your_token_here
VERCEL_PROJECT_ID=prj_your_project_id
VERCEL_TEAM_ID=team_your_team_id  # Optional
\`\`\`

Never commit this file to git (already in .gitignore).
