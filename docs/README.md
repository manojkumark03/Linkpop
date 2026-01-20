# LinkPop Documentation

Complete documentation for the LinkPop analytics and performance system.

---

## 📚 Documentation Files

### [ANALYTICS_EXPLAINED.md](./ANALYTICS_EXPLAINED.md)
**Complete guide to how analytics work**

Learn about:
- How click tracking works (entry points, data flow)
- Data collection methods (geographic, device, referrer)
- Database schema and table structure
- Metric calculations (CTR, clicks, views)
- Accuracy and limitations
- Privacy and GDPR compliance

**Read this first** if you want to understand how the analytics system works.

---

### [CALCULATION_LOGIC.md](./CALCULATION_LOGIC.md)
**Reference for every metric calculation**

Quick reference for:
- Shortlinks overview (total links, clicks, avg per link)
- Bio pages overview (views, clicks, CTR formula)
- Time-based metrics (today, week, month)
- Geographic distribution calculations
- Device and browser breakdowns
- Chart data and growth rates

**Use this** when implementing new analytics features or debugging calculations.

---

### [TESTING_REPORT.md](./TESTING_REPORT.md)
**Comprehensive testing checklist**

Test all functionality:
- Click tracking (shortlinks and bio links)
- Geographic accuracy (VPN testing)
- Device detection (mobile, desktop, tablet)
- Referrer detection (Instagram, Twitter, direct)
- CTR calculations
- Custom domains
- Error handling

**Use this template** before deploying updates or when QA testing the app.

---

### [PERFORMANCE_OPTIMIZATIONS.md](./PERFORMANCE_OPTIMIZATIONS.md)
**Complete performance optimization guide**

Learn about:
- Database query parallelization (6-7x faster)
- In-memory caching (300x faster repeat loads)
- Edge runtime for instant redirects (11x faster)
- Middleware caching for subdomains (30-50x faster)
- Database indexing strategies
- Performance monitoring and benchmarks

**Read this** to understand performance improvements and best practices.

---

## 🚀 Quick Start

### Understanding Analytics

1. Read [ANALYTICS_EXPLAINED.md](./ANALYTICS_EXPLAINED.md) sections 1-4
2. Review [CALCULATION_LOGIC.md](./CALCULATION_LOGIC.md) for metric formulas
3. Look at `/lib/analytics-tracking.ts` to see implementation

### Testing Analytics

1. Open [TESTING_REPORT.md](./TESTING_REPORT.md)
2. Follow test scenarios one by one
3. Document results and issues

### Improving Performance

1. Read [PERFORMANCE_OPTIMIZATIONS.md](./PERFORMANCE_OPTIMIZATIONS.md) sections 1-4
2. Review `/lib/cache.ts` for caching implementation
3. Check `/lib/insights.ts` for parallel query patterns

---

## 📊 Key Concepts

### Click-Through Rate (CTR)

**Formula:** `CTR = (Link Clicks / Profile Views) × 100`

**Example:**
- 100 people visit your bio page
- 25 people click a link
- CTR = 25%

**Important:** CTR only applies to bio pages, not shortlinks.

**Why?** Shortlinks don't have "views" to calculate against - they redirect immediately.

---

### Analytics Event Types

| Event Type | Description | Tracked At |
|-----------|-------------|------------|
| `view` | Profile page view | `app/[username]/page.tsx` |
| `click` | Link click | Bio links + Shortlinks |

---

### Database Tables

```
users
├── id, username, subscription_tier
└── custom_domain, domain_verified

shortened_urls
├── id, user_id, short_code
└── original_url, clicks, is_active

bio_links
├── id, user_id, title
└── url, position

analytics_events (main tracking)
├── id, user_id, event_type
├── link_id, shortlink_id
├── timestamp, user_agent
├── country, city, latitude, longitude
├── device_type, browser, os
└── referrer, referrer_platform
```

---

## 🔧 Common Tasks

### Adding a New Metric

1. **Define the calculation** in [CALCULATION_LOGIC.md](./CALCULATION_LOGIC.md)
2. **Write the SQL query** in `/lib/insights.ts`
3. **Add to parallel execution** using `Promise.all()`
4. **Cache the result** with 60-second TTL
5. **Add UI component** to display the metric
6. **Write tests** in [TESTING_REPORT.md](./TESTING_REPORT.md)

### Debugging Analytics

1. **Check if event is being tracked:**
   ```sql
   SELECT * FROM analytics_events 
   WHERE user_id = 'xxx' 
   ORDER BY timestamp DESC 
   LIMIT 10
   ```

2. **Verify click count:**
   ```sql
   SELECT short_code, clicks FROM shortened_urls WHERE user_id = 'xxx'
   ```

3. **Check cache status:**
   ```typescript
   import { getCacheStats } from '@/lib/cache'
   console.log(getCacheStats())
   ```

### Optimizing a Slow Query

1. **Measure current speed:**
   ```typescript
   const start = Date.now()
   const result = await sql`...`
   console.log(`Query took ${Date.now() - start}ms`)
   ```

2. **Add database index:**
   ```sql
   CREATE INDEX idx_name ON table(column);
   ```

3. **Use caching:**
   ```typescript
   return cached('key', async () => {
     return await expensiveQuery()
   }, 60)
   ```

4. **Parallelize with other queries:**
   ```typescript
   const [a, b] = await Promise.all([query1(), query2()])
   ```

---

## 🐛 Troubleshooting

### Analytics not appearing

**Symptom:** Clicks don't show up in dashboard

**Check:**
1. Is `trackAnalyticsEvent()` being called?
2. Are there errors in server logs?
3. Is database connection working?
4. Query: `SELECT COUNT(*) FROM analytics_events WHERE user_id = 'xxx'`

**Solution:** Check `/lib/analytics-tracking.ts` for errors

---

### Wrong geographic location

**Symptom:** Shows wrong city/country

**Causes:**
- VPN usage (shows VPN location) ✅ Expected
- Corporate network (shows HQ location) ✅ Expected  
- Local development (shows localhost) ✅ Expected

**Not a bug** - IP geolocation inherently has these limitations

---

### CTR shows 0% but there are clicks

**Symptom:** Dashboard shows clicks but CTR = 0%

**Check:**
1. Is this for shortlinks? (Shortlinks don't have CTR)
2. Are there profile views? (CTR requires views > 0)

**Formula:** CTR = (clicks / views) × 100

If views = 0, then CTR = 0% (even with clicks)

---

### Slow dashboard load

**Symptom:** Insights page takes > 1 second

**Check:**
1. Are queries running in parallel? (Should be)
2. Is caching enabled? (Check `/lib/insights.ts`)
3. Are database indexes present?

**Solution:**
```typescript
// Verify cache is working
import { getCacheStats } from '@/lib/cache'
console.log(getCacheStats())  // Should show cache hits
```

---

## 📈 Performance Metrics

### Target Performance

| Metric | Target | Actual |
|--------|--------|--------|
| Shortlink redirect | < 100ms | ~30ms ✅ |
| Insights first load | < 500ms | ~300ms ✅ |
| Insights cached load | < 10ms | ~1ms ✅ |
| Subdomain lookup | < 50ms | ~1ms (cached) ✅ |

### Monitoring

Add to your monitoring dashboard:

```typescript
// Response time
console.log(`[v0] Request completed in ${duration}ms`)

// Cache hit rate
const hitRate = (cacheHits / (cacheHits + cacheMisses) * 100).toFixed(1)
console.log(`[v0] Cache hit rate: ${hitRate}%`)

// Query count
console.log(`[v0] Executed ${queryCount} database queries`)
```

---

## 🔐 Security & Privacy

### Data We Collect

- ✅ IP address (stored, not shown to end users)
- ✅ City/Country (derived from IP)
- ✅ Browser and device type
- ✅ Referrer URL
- ✅ Click timestamps

### Data We DON'T Collect

- ❌ Names or emails
- ❌ User accounts (for visitors)
- ❌ Tracking cookies
- ❌ Cross-site tracking

### GDPR Compliance

- **Data retention:** 90 days (free) / 365 days (pro)
- **Right to deletion:** Contact support
- **No tracking cookies:** Analytics work without cookies
- **Privacy policy:** Recommend users add one

**Sample Privacy Text:**
```
We collect anonymous analytics including geographic location 
(city/country), device type, and referrer sources. Data is 
automatically deleted after [90/365] days.
```

---

## 🚦 Best Practices

### DO ✅

- Use parallel queries with `Promise.all()`
- Cache expensive operations with `/lib/cache.ts`
- Fire-and-forget non-critical updates
- Use Edge runtime when possible
- Add database indexes for WHERE/JOIN columns
- Log performance metrics
- Test thoroughly before deploying

### DON'T ❌

- Run queries sequentially (use parallel)
- Skip caching (causes repeated DB hits)
- Block redirects with analytics (fire-and-forget)
- Use Node.js runtime for redirects (use Edge)
- Fetch all rows then filter (filter in SQL)
- Ignore slow queries (optimize them)
- Deploy without testing (use testing report)

---

## 📞 Support

### Need Help?

1. **Read relevant docs** - Most questions are answered here
2. **Check troubleshooting section** - Common issues listed above
3. **Review code** - Look at implementation in `/lib/` folder
4. **Check logs** - Server logs show errors and performance
5. **Open support ticket** - vercel.com/help

### Reporting Bugs

Include:
1. What you were trying to do
2. What happened (actual result)
3. What should have happened (expected result)
4. Error messages or logs
5. Steps to reproduce

---

## 📝 Contributing

### Adding Documentation

1. Write clear, concise explanations
2. Include code examples
3. Add SQL queries with comments
4. Provide before/after comparisons
5. Update this README with links

### Code Style

```typescript
// Good: Descriptive names
const totalClicks = Number(result[0].total)

// Bad: Unclear names
const x = Number(r[0].t)

// Good: Comments explain why
// Cache for 60 seconds to reduce DB load
return cached('key', fn, 60)

// Bad: No context
return cached('key', fn, 60)
```

---

## 🎯 Roadmap

### Completed ✅

- [x] Parallel database queries
- [x] In-memory caching
- [x] Edge runtime redirects
- [x] Middleware caching
- [x] Comprehensive documentation
- [x] Testing report template

### Planned 🚧

- [ ] Redis/Upstash distributed caching
- [ ] Bot detection and filtering
- [ ] Session tracking (unique visitors)
- [ ] Real-time analytics dashboard
- [ ] Export to CSV
- [ ] A/B testing for links
- [ ] Custom events tracking

---

## 📚 Additional Resources

### External Documentation

- [Vercel Edge Functions](https://vercel.com/docs/functions/edge-functions)
- [PostgreSQL Performance Tips](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [UAParser.js](https://github.com/faisalman/ua-parser-js)
- [Vercel Geo Headers](https://vercel.com/docs/edge-network/headers#x-vercel-ip-country)

### Related Files

```
/lib/
  analytics-tracking.ts  - Main tracking logic
  insights.ts           - Metrics calculations
  cache.ts              - Caching implementation
  db.ts                 - Database connection

/app/
  l/[slug]/route.ts     - Shortlink redirects
  api/insights/         - Analytics API routes

/components/
  shortlinks-analytics.tsx  - Shortlinks dashboard
  pages-analytics.tsx       - Bio pages dashboard
  insights-dashboard.tsx    - Main insights view

/docs/
  ANALYTICS_EXPLAINED.md        - How analytics work
  CALCULATION_LOGIC.md          - Metric formulas
  TESTING_REPORT.md             - Testing checklist
  PERFORMANCE_OPTIMIZATIONS.md  - Performance guide
  README.md                     - This file
```

---

**Last Updated:** January 2026  
**Version:** 2.0  
**Maintained By:** LinkPop Team
