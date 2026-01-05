# Custom Domain Setup Guide

This guide explains how to set up custom domains for your Linkpop profiles.

## Overview

Custom domains allow you to use your own domain (e.g., `links.yourdomain.com` or `yourdomain.com`) instead of the default `username.linkpop.space` subdomain.

### Prerequisites

- Pro subscription (custom domains are a Pro feature)
- Access to your domain's DNS settings
- Your own registered domain

## How SSL/HTTPS Works

**Good news: SSL certificates are completely automatic!**

- When you add a custom domain to Vercel (where this app runs), Vercel automatically provisions a free Let's Encrypt SSL certificate
- This happens automatically once your DNS is properly configured
- No manual SSL configuration needed
- Certificates auto-renew every 90 days

## Step-by-Step Setup

### Step 1: Add Your Domain in Linkpop

1. Go to Settings → Custom Domain
2. Enter your domain (e.g., `links.example.com` or `example.com`)
3. Click "Save Domain"

### Step 2: Configure DNS Records

You need to add a CNAME record to your domain's DNS settings. Here's how:

#### What is a CNAME Record?

A CNAME record tells the internet that your domain should point to `linkpop.space`. This allows Linkpop to serve your profile on your custom domain.

#### DNS Configuration

Add this record to your DNS provider:

| Type  | Name | Value          | TTL  |
|-------|------|----------------|------|
| CNAME | @    | linkpop.space  | Auto |

**For subdomains** (like `links.example.com`):

| Type  | Name  | Value          | TTL  |
|-------|-------|----------------|------|
| CNAME | links | linkpop.space  | Auto |

### Step 3: Wait for DNS Propagation

- **Typical time**: 5-10 minutes
- **Maximum time**: Up to 48 hours (rare)
- Use the "Auto-check every 30s" feature in Linkpop to automatically verify your DNS

### Step 4: Verify Domain

1. Click "Verify Domain" in the Linkpop settings
2. Wait for verification to complete
3. Once verified, your custom domain is live!

### Step 5: SSL Certificate (Automatic)

After DNS verification:
- Vercel automatically provisions an SSL certificate
- Takes 5-10 minutes
- Your site will be accessible via HTTPS

## DNS Provider-Specific Guides

### Cloudflare

1. Log in to Cloudflare
2. Select your domain
3. Go to "DNS" tab
4. Click "Add record"
5. Type: `CNAME`
6. Name: `@` (for root) or `links` (for subdomain)
7. Target: `linkpop.space`
8. Proxy status: DNS only (gray cloud)
9. Save

### GoDaddy

1. Log in to GoDaddy
2. Go to "My Products" → "DNS"
3. Select your domain
4. Click "Add" under DNS Records
5. Type: `CNAME`
6. Name: `@` (for root) or `links` (for subdomain)
7. Value: `linkpop.space`
8. TTL: 1 hour
9. Save

### Namecheap

1. Log in to Namecheap
2. Go to "Domain List" → "Manage"
3. Select "Advanced DNS"
4. Click "Add New Record"
5. Type: `CNAME Record`
6. Host: `@` (for root) or `links` (for subdomain)
7. Value: `linkpop.space`
8. TTL: Automatic
9. Save

### Google Domains

1. Log in to Google Domains
2. Select your domain
3. Go to "DNS" tab
4. Scroll to "Custom resource records"
5. Name: `@` (for root) or `links` (for subdomain)
6. Type: `CNAME`
7. TTL: `1H`
8. Data: `linkpop.space`
9. Add

## Troubleshooting

### DNS Verification Fails

**Possible causes:**
1. DNS records haven't propagated yet (wait longer)
2. Wrong CNAME value entered
3. Multiple conflicting records (A record + CNAME)

**Solutions:**
- Wait 5-10 minutes and try again
- Check your DNS settings match exactly: `linkpop.space`
- Remove any conflicting A records for the same hostname
- Use [whatsmydns.net](https://www.whatsmydns.net/) to check DNS propagation globally

### "Domain Already in Use" Error

- This domain is already connected to another Linkpop account
- Each domain can only be used once
- Remove it from the other account first

### SSL Certificate Not Working

**After DNS is verified:**
- SSL certificates take 5-10 minutes to provision
- Check if HTTPS works: `https://yourdomain.com`
- Vercel handles this automatically - no action needed
- If it doesn't work after 15 minutes, contact support

### Domain Shows 404 Error

**Possible causes:**
1. Domain not verified yet
2. DNS not fully propagated
3. SSL certificate still provisioning

**Solutions:**
- Ensure "Domain Verified" badge shows in settings
- Wait for DNS propagation
- Try accessing via `http://` first (will redirect to `https://`)

## Technical Details

### How It Works

1. **DNS Resolution**: When someone visits your domain, DNS resolves it to Linkpop's servers
2. **Proxy Routing**: Linkpop's proxy middleware detects your custom domain
3. **Profile Loading**: Your profile is loaded and displayed on your custom domain
4. **SSL**: Vercel provides automatic HTTPS with Let's Encrypt certificates

### Architecture

\`\`\`
User Browser → DNS Lookup → Cloudflare DoH API → Vercel Edge Network 
→ Next.js Middleware (proxy.ts) → Your Profile
\`\`\`

### No Cloudflare API Key Needed

This implementation uses:
- **Cloudflare DNS-over-HTTPS (DoH)**: Free public service, no API key required
- **Vercel SSL**: Automatic Let's Encrypt certificates
- **No paid services required**: Everything uses free tiers

## Frequently Asked Questions

### Can I use a root domain (example.com)?

Yes! Just use `@` as the hostname in your CNAME record.

### Can I use multiple domains?

Currently, each Linkpop account supports one custom domain. Pro users can change it anytime.

### What happens to my subdomain?

Your `username.linkpop.space` subdomain continues to work even after adding a custom domain.

### Do I need to renew SSL certificates?

No! Vercel automatically renews Let's Encrypt certificates every 90 days.

### Can I use Cloudflare's proxy (orange cloud)?

**Recommended: No** (use DNS only mode)

If you want to use Cloudflare's proxy:
- Works with additional configuration
- May require SSL mode set to "Full"
- DNS only (gray cloud) is simpler and recommended

## Need Help?

- Check DNS propagation: [whatsmydns.net](https://www.whatsmydns.net/)
- Test CNAME records: [mxtoolbox.com](https://mxtoolbox.com/CNAMELookup.aspx)
- Contact support if issues persist after 48 hours

## Cost Summary

- **Cloudflare DoH API**: FREE (no API key needed)
- **Vercel SSL Certificates**: FREE (automatic Let's Encrypt)
- **Domain Registration**: Varies by registrar (~$10-15/year)
- **Linkpop Pro Subscription**: Required for custom domain feature

Total ongoing cost: **$0** (beyond your domain registration and Pro subscription)
