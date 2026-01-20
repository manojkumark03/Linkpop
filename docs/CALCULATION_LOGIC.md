# Analytics Calculation Logic

Complete reference for every metric calculation in the LinkPop analytics system.

---

## Table of Contents

1. [Shortlinks Overview Metrics](#shortlinks-overview-metrics)
2. [Bio Pages Overview Metrics](#bio-pages-overview-metrics)
3. [Time-Based Metrics](#time-based-metrics)
4. [Geographic Distribution](#geographic-distribution)
5. [Device & Browser Analytics](#device--browser-analytics)
6. [Referrer Analytics](#referrer-analytics)
7. [Individual Link Analytics](#individual-link-analytics)
8. [Chart Data](#chart-data)

---

## Shortlinks Overview Metrics

### Total Links

**Definition:** Count of all shortened URLs created by user (active and inactive)

**SQL Query:**
```sql
SELECT COUNT(*) as total
FROM shortened_urls
WHERE user_id = ?
```

**TypeScript:**
```typescript
const totalLinks = Number(result[0].total)
```

**Example:** User has created 47 shortlinks → Display: `47`

---

### Total Clicks

**Definition:** Sum of all clicks across all shortened URLs

**SQL Query:**
```sql
SELECT COALESCE(SUM(clicks), 0) as total
FROM shortened_urls
WHERE user_id = ?
```

**TypeScript:**
```typescript
const totalClicks = Number(result[0].total)
```

**Notes:**
- `COALESCE` handles case where user has no links (returns 0 instead of NULL)
- `clicks` column is incremented on each click for performance
- Includes both active and inactive links

**Example:** 3 links with 100, 50, 25 clicks → Display: `175`

---

### Average Clicks Per Link

**Definition:** Average number of clicks per shortlink

**Calculation:**
```typescript
const avgClicksPerLink = totalLinks > 0 
  ? (totalClicks / totalLinks).toFixed(1)
  : 0
```

**Example:**
- Total Links: 10
- Total Clicks: 235
- Avg: 235 / 10 = 23.5 clicks per link

**Display:** `23.5`

**Edge Cases:**
- Zero links: Display `0` (avoid division by zero)
- New account: Display `0.0`

---

## Bio Pages Overview Metrics

### Profile Views

**Definition:** Number of times someone visited the bio page (username.linkpop.space)

**SQL Query:**
```sql
SELECT COUNT(*) as total
FROM analytics_events
WHERE user_id = ?
  AND event_type = 'view'
  AND link_id IS NULL
  AND shortlink_id IS NULL
  AND timestamp >= ?
  AND timestamp <= ?
```

**Notes:**
- `event_type = 'view'` identifies page views
- `link_id IS NULL AND shortlink_id IS NULL` ensures it's a profile view, not a link click
- Date range filters based on subscription tier (90 days free, 365 days pro)

**Example:** Display `1,234 views`

---

### Total Link Clicks

**Definition:** Total clicks on bio page links (not including shortlinks)

**SQL Query:**
```sql
SELECT COUNT(*) as total
FROM analytics_events a
INNER JOIN bio_links bl ON a.link_id = bl.id
WHERE bl.user_id = ?
  AND a.event_type = 'click'
  AND a.timestamp >= ?
  AND a.timestamp <= ?
```

**Notes:**
- Joins with `bio_links` to ensure link belongs to user
- Only counts clicks within date retention period

**Example:** Display `342 clicks`

---

### Click-Through Rate (CTR)

**Definition:** Percentage of profile visitors who clicked at least one link

**Formula:**
```
CTR = (Total Link Clicks / Profile Views) × 100
```

**TypeScript:**
```typescript
const ctr = profileViews > 0 
  ? ((linkClicks / profileViews) * 100).toFixed(1)
  : 0
```

**Example 1:**
- Profile Views: 1000
- Link Clicks: 250
- CTR = (250 / 1000) × 100 = 25%
- Display: `25.0%`

**Example 2:**
- Profile Views: 500
- Link Clicks: 75
- CTR = (75 / 500) × 100 = 15%
- Display: `15.0%`

**Example 3 (Edge Case):**
- Profile Views: 0
- Link Clicks: 0
- CTR = 0%
- Display: `0.0%`

**Interpretation:**
- 25% CTR = Great! 1 in 4 visitors click a link
- 15% CTR = Good! 1 in 7 visitors engaged
- 5% CTR = Low engagement, consider improving page design

**Important:** CTR only makes sense for bio pages. Shortlinks don't have "views" to calculate against.

---

## Time-Based Metrics

### Clicks Today

**Definition:** Clicks that occurred since midnight today (user's timezone)

**SQL Query:**
```sql
SELECT COUNT(*) as total
FROM analytics_events
WHERE user_id = ?
  AND event_type = 'click'
  AND timestamp >= CURRENT_DATE
```

**Notes:**
- `CURRENT_DATE` is midnight in server timezone (UTC)
- For user timezone support, add timezone conversion

**Example:** `23 clicks today`

---

### Clicks This Week

**Definition:** Clicks in the last 7 days

**SQL Query:**
```sql
SELECT COUNT(*) as total
FROM analytics_events
WHERE user_id = ?
  AND event_type = 'click'
  AND timestamp >= CURRENT_DATE - INTERVAL '7 days'
```

**Calculation:**
```typescript
const clicksThisWeek = Number(result[0].total)
```

**Example:** `156 clicks this week`

---

### Clicks This Month

**Definition:** Clicks since the 1st of current month

**SQL Query:**
```sql
SELECT COUNT(*) as total
FROM analytics_events
WHERE user_id = ?
  AND event_type = 'click'
  AND timestamp >= DATE_TRUNC('month', CURRENT_DATE)
```

**Notes:**
- `DATE_TRUNC('month', CURRENT_DATE)` returns first day of month at midnight

**Example:** 
- Today: January 15
- Query returns clicks from January 1 00:00 to now
- Display: `487 clicks this month`

---

## Geographic Distribution

### Clicks by Country

**Definition:** Number of clicks from each country

**SQL Query:**
```sql
SELECT 
  country, 
  COUNT(*) as clicks,
  ROUND((COUNT(*) * 100.0 / SUM(COUNT(*)) OVER ()), 1) as percentage
FROM analytics_events
WHERE user_id = ?
  AND event_type = 'click'
  AND country IS NOT NULL
  AND timestamp >= ?
  AND timestamp <= ?
GROUP BY country
ORDER BY clicks DESC
LIMIT 20
```

**TypeScript Calculation:**
```typescript
interface CountryStats {
  country: string
  clicks: number
  percentage: number
}

const totalClicksForPercentage = results.reduce((sum, r) => sum + r.clicks, 0)

const countriesWithPercentage = results.map(row => ({
  country: row.country,
  clicks: Number(row.clicks),
  percentage: Number(((row.clicks / totalClicksForPercentage) * 100).toFixed(1))
}))
```

**Example Display:**
```
United States     1,234 clicks (45.2%)
United Kingdom      567 clicks (20.8%)
Canada              432 clicks (15.8%)
Australia           234 clicks ( 8.6%)
Germany             123 clicks ( 4.5%)
Other               140 clicks ( 5.1%)
```

---

### Clicks by City

**Definition:** Number of clicks from each city (within a country)

**SQL Query:**
```sql
SELECT 
  country,
  city,
  COUNT(*) as clicks
FROM analytics_events
WHERE user_id = ?
  AND event_type = 'click'
  AND city IS NOT NULL
  AND timestamp >= ?
  AND timestamp <= ?
GROUP BY country, city
ORDER BY clicks DESC
LIMIT 20
```

**Example:**
```
San Francisco, US    234 clicks
New York, US         189 clicks
London, GB           156 clicks
```

---

## Device & Browser Analytics

### Device Type Distribution

**Definition:** Breakdown of clicks by device type

**SQL Query:**
```sql
SELECT 
  device_type,
  COUNT(*) as clicks,
  ROUND((COUNT(*) * 100.0 / SUM(COUNT(*)) OVER ()), 1) as percentage
FROM analytics_events
WHERE user_id = ?
  AND event_type = 'click'
  AND timestamp >= ?
  AND timestamp <= ?
GROUP BY device_type
ORDER BY clicks DESC
```

**Example Display:**
```
Mobile     1,456 clicks (67.3%)
Desktop      543 clicks (25.1%)
Tablet       165 clicks ( 7.6%)
```

**Notes:**
- `device_type` values: "mobile", "desktop", "tablet", or NULL
- NULL values treated as "unknown"

---

### Browser Distribution

**Definition:** Clicks by browser

**SQL Query:**
```sql
SELECT 
  browser,
  COUNT(*) as clicks,
  ROUND((COUNT(*) * 100.0 / SUM(COUNT(*)) OVER ()), 1) as percentage
FROM analytics_events
WHERE user_id = ?
  AND event_type = 'click'
  AND browser IS NOT NULL
  AND timestamp >= ?
  AND timestamp <= ?
GROUP BY browser
ORDER BY clicks DESC
LIMIT 10
```

**Example:**
```
Chrome               987 clicks (52.3%)
Safari               456 clicks (24.2%)
Mobile Safari        234 clicks (12.4%)
Firefox              123 clicks ( 6.5%)
Edge                  89 clicks ( 4.7%)
```

---

### Operating System Distribution

**Definition:** Clicks by operating system

**SQL Query:**
```sql
SELECT 
  os,
  COUNT(*) as clicks
FROM analytics_events
WHERE user_id = ?
  AND event_type = 'click'
  AND os IS NOT NULL
  AND timestamp >= ?
  AND timestamp <= ?
GROUP BY os
ORDER BY clicks DESC
```

**Example:**
```
iOS          678 clicks (38.2%)
Windows      543 clicks (30.6%)
Android      432 clicks (24.3%)
macOS        123 clicks ( 6.9%)
```

---

## Referrer Analytics

### Traffic Sources

**Definition:** Where clicks came from

**SQL Query:**
```sql
SELECT 
  referrer_platform as source,
  COUNT(*) as clicks,
  ROUND((COUNT(*) * 100.0 / SUM(COUNT(*)) OVER ()), 1) as percentage
FROM analytics_events
WHERE user_id = ?
  AND event_type = 'click'
  AND timestamp >= ?
  AND timestamp <= ?
GROUP BY referrer_platform
ORDER BY clicks DESC
```

**Example Display:**
```
Instagram    567 clicks (34.2%)
Direct       432 clicks (26.1%)
Twitter      234 clicks (14.1%)
Facebook     189 clicks (11.4%)
Google       123 clicks ( 7.4%)
Other        113 clicks ( 6.8%)
```

**Platform Values:**
- `direct` - Typed URL, bookmark, QR code, or no referrer
- `instagram`, `facebook`, `twitter`, etc. - Social media
- `google`, `bing`, etc. - Search engines
- `other` - Unknown or unrecognized source

---

## Individual Link Analytics

### Shortlink Details

**Definition:** Stats for a single shortened URL

**SQL Query:**
```sql
-- Basic stats from shortened_urls table
SELECT 
  id,
  short_code,
  original_url,
  title,
  clicks,
  created_at,
  is_active
FROM shortened_urls
WHERE id = ? AND user_id = ?
```

**Click History:**
```sql
SELECT 
  DATE(timestamp) as date,
  COUNT(*) as clicks
FROM analytics_events
WHERE shortlink_id = ?
  AND event_type = 'click'
  AND timestamp >= ?
GROUP BY DATE(timestamp)
ORDER BY date DESC
```

---

### Bio Link Details

**Definition:** Stats for a single bio page link

**SQL Query:**
```sql
-- Get link info
SELECT id, title, url, position
FROM bio_links
WHERE id = ? AND user_id = ?

-- Get click count
SELECT COUNT(*) as clicks
FROM analytics_events
WHERE link_id = ?
  AND event_type = 'click'
  AND timestamp >= ?
```

---

## Chart Data

### Clicks Over Time (Daily)

**Definition:** Daily click counts for chart visualization

**SQL Query:**
```sql
SELECT 
  DATE(timestamp) as date,
  COUNT(*) as clicks,
  COUNT(*) FILTER (WHERE shortlink_id IS NOT NULL) as shortlink_clicks,
  COUNT(*) FILTER (WHERE link_id IS NOT NULL) as biolink_clicks
FROM analytics_events
WHERE user_id = ?
  AND event_type = 'click'
  AND timestamp >= ?
  AND timestamp <= ?
GROUP BY DATE(timestamp)
ORDER BY date ASC
```

**TypeScript:**
```typescript
interface DailyClicks {
  date: string        // "2024-01-15"
  clicks: number      // 45
  shortlink_clicks: number  // 23
  biolink_clicks: number    // 22
}

const chartData: DailyClicks[] = results.map(row => ({
  date: row.date,
  clicks: Number(row.clicks),
  shortlink_clicks: Number(row.shortlink_clicks),
  biolink_clicks: Number(row.biolink_clicks)
}))
```

**Display:** Line chart or bar chart showing clicks per day

---

### Growth Rate

**Definition:** Percentage change in clicks compared to previous period

**Calculation:**
```typescript
function calculateGrowthRate(currentPeriod: number, previousPeriod: number): string {
  if (previousPeriod === 0) {
    return currentPeriod > 0 ? "+100%" : "0%"
  }
  
  const growth = ((currentPeriod - previousPeriod) / previousPeriod) * 100
  const sign = growth > 0 ? "+" : ""
  return `${sign}${growth.toFixed(1)}%`
}
```

**Example:**
- Last week: 100 clicks
- This week: 125 clicks
- Growth: ((125 - 100) / 100) × 100 = +25%
- Display: `+25.0%`

---

## Known Issues & Limitations

### 1. CTR for Shortlinks

**Issue:** Shortlinks don't have a meaningful CTR because there's no "view" event to measure against.

**Wrong Calculation (DO NOT USE):**
```typescript
// WRONG: This doesn't make sense
const ctr = totalLinks > 0 ? (totalClicks / totalLinks / totalLinks) * 100 : 0
```

**Correct Approach:**
- Don't show CTR for shortlinks
- Show "Average Clicks Per Link" instead

---

### 2. Same User Multiple Clicks

**Issue:** No session tracking means same user clicking 10 times = 10 clicks

**Impact:** Metrics may be inflated

**Mitigation:** Document this limitation in analytics dashboard

---

### 3. Bot Clicks

**Issue:** Bots and preview fetches (Telegram, Discord, WhatsApp) count as clicks

**Impact:** Numbers may be higher than real human clicks

**Future Fix:** Implement bot detection using user-agent patterns

---

### 4. VPN Users

**Issue:** VPN users show VPN server location, not real location

**Impact:** Geographic data may be misleading

**No Fix:** This is inherent to IP-based geolocation

---

## Summary Formula Reference

Quick reference for all key calculations:

```typescript
// Shortlinks
totalLinks = COUNT(shortened_urls)
totalClicks = SUM(shortened_urls.clicks)
avgClicksPerLink = totalClicks / totalLinks

// Bio Pages
profileViews = COUNT(analytics_events WHERE event_type='view')
linkClicks = COUNT(analytics_events WHERE event_type='click' AND link_id IS NOT NULL)
ctr = (linkClicks / profileViews) * 100

// Geography
countryPercentage = (countryClicks / totalClicks) * 100

// Growth
growthRate = ((current - previous) / previous) * 100

// Time ranges
today = timestamp >= CURRENT_DATE
thisWeek = timestamp >= CURRENT_DATE - INTERVAL '7 days'
thisMonth = timestamp >= DATE_TRUNC('month', CURRENT_DATE)
```

---

## Testing Calculations

To verify calculations are correct:

1. **Create test data:**
   ```sql
   -- 10 profile views, 2 link clicks
   INSERT INTO analytics_events (user_id, event_type, link_id) VALUES
     ('user123', 'view', NULL),  -- x10
     ('user123', 'click', 'link1'), -- x2
   ```

2. **Expected CTR:**
   ```
   CTR = (2 / 10) × 100 = 20%
   ```

3. **Verify in dashboard:** Should show `20.0%`

4. **Test edge cases:**
   - 0 views, 0 clicks → CTR = 0%
   - 100 views, 0 clicks → CTR = 0%
   - 0 views, 5 clicks → CTR = 0% (avoid division by zero)
