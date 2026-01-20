# Analytics Testing Report

Use this template to systematically test all analytics functionality.

---

## Test Information

**Test Date:** _________________  
**Tester Name:** _________________  
**Environment:** Production / Staging / Local  
**Database:** PostgreSQL version _________

---

## 1. Click Tracking Tests

### Test 1.1: Shortlink Creation & Click

**Steps:**
1. Create a shortlink with auto-generated code
   - Navigate to dashboard
   - Click "Create Shortlink"
   - Enter URL: `https://example.com`
   - Leave custom code blank
   - Click "Create"

2. Click the generated shortlink
   - Copy the shortened URL
   - Open in new tab/incognito window
   - Verify redirect to destination

3. Check analytics dashboard
   - Return to dashboard
   - Navigate to "Shortlinks" tab
   - Verify click count increased by 1

**Expected Result:**
- Shortlink created successfully
- Redirect works instantly (< 100ms)
- Click appears in analytics within 5 seconds
- Click count increments from 0 to 1

**Actual Result:** ☐ PASS  ☐ FAIL

**Notes:** _________________________________________________

---

### Test 1.2: Bio Link Click Tracking

**Steps:**
1. Create a bio link
   - Navigate to "Linktree" page
   - Add a new link
   - Title: "Test Link"
   - URL: `https://example.com`
   - Save

2. Visit your bio page
   - Go to `yourusername.linkpop.space`
   - Click the "Test Link" button

3. Check analytics
   - Go to Insights > Pages
   - Verify click recorded

**Expected Result:**
- Bio link appears on profile
- Click is recorded in analytics
- Link clicks count increments

**Actual Result:** ☐ PASS  ☐ FAIL

**Notes:** _________________________________________________

---

### Test 1.3: Custom Code Shortlink

**Steps:**
1. Create shortlink with custom code "test123"
2. Click `yourusername.linkpop.space/test123`
3. Verify redirect and analytics

**Expected Result:**
- Custom code accepted
- Redirect works
- Analytics tracked

**Actual Result:** ☐ PASS  ☐ FAIL

**Notes:** _________________________________________________

---

## 2. Geographic Accuracy Tests

### Test 2.1: Local Location Detection

**Steps:**
1. Click a shortlink from your normal location
2. Check analytics dashboard
3. Go to Insights > Geographic Distribution

**Expected Result:**
- Country: _____________ (your actual country)
- City: _____________ (your actual city or nearby)

**Actual Result:**
- Country: _____________
- City: _____________

**Accurate?** ☐ YES  ☐ NO  ☐ CLOSE

**Notes:** _________________________________________________

---

### Test 2.2: VPN Location Detection

**Steps:**
1. Connect to VPN (e.g., NordVPN set to UK)
2. Click a shortlink
3. Check analytics

**Expected Result:**
- Country matches VPN location (e.g., "United Kingdom")
- City matches VPN server city (e.g., "London")

**Actual Result:**
- Country: _____________
- City: _____________

**Matches VPN?** ☐ YES  ☐ NO

**Notes:** _________________________________________________

---

## 3. Device Detection Tests

### Test 3.1: Mobile Device (iOS)

**Steps:**
1. Open shortlink on iPhone (Safari)
2. Check analytics
3. Go to Insights > Devices

**Expected Result:**
- Device Type: mobile
- OS: iOS
- Browser: Mobile Safari (or Safari)

**Actual Result:**
- Device Type: _____________
- OS: _____________
- Browser: _____________

**Correct?** ☐ YES  ☐ NO

**Notes:** _________________________________________________

---

### Test 3.2: Desktop Device (Chrome)

**Steps:**
1. Open shortlink on desktop (Chrome browser)
2. Check analytics

**Expected Result:**
- Device Type: desktop
- OS: Windows / macOS / Linux
- Browser: Chrome

**Actual Result:**
- Device Type: _____________
- OS: _____________
- Browser: _____________

**Correct?** ☐ YES  ☐ NO

**Notes:** _________________________________________________

---

### Test 3.3: Tablet Device

**Steps:**
1. Open shortlink on iPad or Android tablet
2. Check analytics

**Expected Result:**
- Device Type: tablet
- Correct OS and browser

**Actual Result:**
- Device Type: _____________
- OS: _____________
- Browser: _____________

**Correct?** ☐ YES  ☐ NO

**Notes:** _________________________________________________

---

## 4. Referrer Detection Tests

### Test 4.1: Instagram Referrer

**Steps:**
1. Post shortlink in Instagram bio or story
2. Click it from Instagram app
3. Check analytics > Referrers

**Expected Result:**
- Referrer Platform: "instagram"

**Actual Result:** _____________

**Correct?** ☐ YES  ☐ NO

**Notes:** _________________________________________________

---

### Test 4.2: Twitter/X Referrer

**Steps:**
1. Tweet the shortlink
2. Click it from Twitter
3. Check analytics

**Expected Result:**
- Referrer Platform: "twitter"

**Actual Result:** _____________

**Correct?** ☐ YES  ☐ NO

**Notes:** _________________________________________________

---

### Test 4.3: Direct Navigation

**Steps:**
1. Type shortlink URL directly in browser address bar
2. Press Enter
3. Check analytics

**Expected Result:**
- Referrer Platform: "direct"

**Actual Result:** _____________

**Correct?** ☐ YES  ☐ NO

**Notes:** _________________________________________________

---

### Test 4.4: Google Search

**Steps:**
1. Google search for your shortlink (or paste in Google)
2. Click result from Google
3. Check analytics

**Expected Result:**
- Referrer Platform: "google"

**Actual Result:** _____________

**Correct?** ☐ YES  ☐ NO

**Notes:** _________________________________________________

---

## 5. CTR Calculation (Bio Pages Only)

### Test 5.1: Basic CTR Calculation

**Setup:**
1. Reset analytics (or use new account)
2. Visit bio page 10 times (incognito windows)
3. Click a link 2 times
4. Check analytics dashboard

**Expected CTR:**
```
Profile Views: 10
Link Clicks: 2
CTR = (2 / 10) × 100 = 20%
```

**Actual Result:**
- Profile Views: _____________
- Link Clicks: _____________
- CTR Shown: _____________%

**Calculation Correct?** ☐ YES  ☐ NO

**Notes:** _________________________________________________

---

### Test 5.2: Zero Views CTR

**Setup:**
1. Create brand new bio link (never clicked)
2. Check analytics

**Expected CTR:**
```
Profile Views: 0
Link Clicks: 0
CTR = 0%
```

**Actual Result:** _____________%

**Correct?** ☐ YES  ☐ NO

---

## 6. Shortlink Creation Edge Cases

### Test 6.1: Auto-Generated Code

**Steps:**
1. Create shortlink without custom code
2. Verify code is 6-8 characters
3. Verify it doesn't conflict with reserved routes

**Expected Result:**
- Code generated automatically
- Code is alphanumeric
- Link works immediately

**Actual Result:** ☐ PASS  ☐ FAIL

**Generated Code:** _____________

**Notes:** _________________________________________________

---

### Test 6.2: Duplicate Custom Code

**Steps:**
1. Create shortlink with code "duplicate123"
2. Try to create another with same code "duplicate123"

**Expected Result:**
- Second creation fails
- Error message: "This code is taken. Try: duplicate123456" (or similar)
- Suggestion provided

**Actual Result:** ☐ PASS  ☐ FAIL

**Error Message:** _____________________________________________

---

### Test 6.3: Reserved Code

**Steps:**
1. Try to create shortlink with code "api"
2. Try codes: "dashboard", "login", "signup"

**Expected Result:**
- All fail with error
- Error message: "This code is reserved"
- Suggestion provided

**Actual Result:** ☐ PASS  ☐ FAIL

**Error Message:** _____________________________________________

---

### Test 6.4: Invalid URL

**Steps:**
1. Try to create shortlink with URL: "not-a-valid-url"
2. Try with "example.com" (no https://)

**Expected Result:**
- Both fail
- Error: "Please enter a valid URL (must start with http:// or https://)"

**Actual Result:** ☐ PASS  ☐ FAIL

**Error Message:** _____________________________________________

---

### Test 6.5: Very Long URL

**Steps:**
1. Create shortlink with 2000+ character URL
2. Click the shortlink
3. Verify redirect works

**Expected Result:**
- Shortlink created successfully
- Redirect works despite long URL

**Actual Result:** ☐ PASS  ☐ FAIL

**Notes:** _________________________________________________

---

## 7. Custom Domain Tests

### Test 7.1: Add Custom Domain

**Steps:**
1. Navigate to Dashboard > Domains
2. Enter domain: "yourdomain.com"
3. Click "Add Domain"

**Expected Result:**
- Domain added successfully
- DNS instructions shown
- CNAME record displayed clearly

**Actual Result:** ☐ PASS  ☐ FAIL

**Notes:** _________________________________________________

---

### Test 7.2: DNS Verification

**Steps:**
1. Add CNAME record at your registrar:
   ```
   CNAME: yourdomain.com → cname.vercel-dns.com
   ```
2. Wait 2-5 minutes
3. Click "Verify DNS" button

**Expected Result:**
- DNS verified successfully
- Status changes to "Deploying..."
- Progress indicator shown

**Actual Result:** ☐ PASS  ☐ FAIL

**Time to verify:** _____________ minutes

**Notes:** _________________________________________________

---

### Test 7.3: Domain Activation

**Steps:**
1. After DNS verification, wait 10-40 minutes
2. Click "Test Domain" button periodically
3. Check when domain becomes active

**Expected Result:**
- Domain becomes active
- Status changes to "Active"
- `https://yourdomain.com` loads bio page

**Actual Result:** ☐ PASS  ☐ FAIL

**Time to activate:** _____________ minutes

**Notes:** _________________________________________________

---

### Test 7.4: Domain Shortlinks

**Steps:**
1. Create shortlink with code "test"
2. Enable "Use custom domain for shortlinks"
3. Visit `https://yourdomain.com/test`

**Expected Result:**
- Shortlink works on custom domain
- Redirects to destination
- Analytics tracked correctly

**Actual Result:** ☐ PASS  ☐ FAIL

**Notes:** _________________________________________________

---

## 8. Performance Tests

### Test 8.1: Redirect Speed

**Steps:**
1. Use browser DevTools Network tab
2. Click a shortlink
3. Measure time from request to redirect

**Expected Result:**
- Redirect completes in < 100ms (production)
- Redirect completes in < 500ms (local)

**Actual Result:** _____________ ms

**Acceptable?** ☐ YES  ☐ NO

---

### Test 8.2: Analytics Dashboard Load Time

**Steps:**
1. Clear browser cache
2. Navigate to Dashboard > Insights
3. Measure page load time

**Expected Result:**
- Page loads in < 2 seconds (with data)
- No visible lag

**Actual Result:** _____________ seconds

**Acceptable?** ☐ YES  ☐ NO

---

### Test 8.3: Concurrent Clicks

**Steps:**
1. Create a shortlink
2. Open 10 browser tabs simultaneously
3. Click shortlink in all tabs at once
4. Check analytics

**Expected Result:**
- All 10 clicks recorded
- No errors or lost clicks
- Click count = 10

**Actual Result:** _____________ clicks recorded

**All recorded?** ☐ YES  ☐ NO

---

## 9. Error Handling Tests

### Test 9.1: Invalid Shortcode

**Steps:**
1. Try to access `/l/nonexistent123`

**Expected Result:**
- 404 error
- Message: "Short link not found"

**Actual Result:** ☐ PASS  ☐ FAIL

---

### Test 9.2: Database Connection Loss

**Steps:**
1. Simulate database connection error
2. Try to click shortlink

**Expected Result:**
- 503 Service Unavailable
- Error logged to console
- User sees friendly error message

**Actual Result:** ☐ PASS  ☐ FAIL

---

### Test 9.3: Analytics Tracking Failure

**Steps:**
1. Simulate analytics_events table error
2. Click shortlink

**Expected Result:**
- Redirect still works (non-blocking)
- Error logged but user unaffected
- Click count still increments

**Actual Result:** ☐ PASS  ☐ FAIL

---

## 10. UTM Parameter Tests

### Test 10.1: UTM Tracking

**Steps:**
1. Click shortlink with UTM parameters:
   ```
   /test?utm_source=instagram&utm_medium=social&utm_campaign=launch
   ```
2. Check analytics > Detailed

**Expected Result:**
- UTM parameters recorded correctly
- Source: instagram
- Medium: social
- Campaign: launch

**Actual Result:**
- Source: _____________
- Medium: _____________
- Campaign: _____________

**Correct?** ☐ YES  ☐ NO

---

## Summary

**Total Tests:** 35  
**Tests Passed:** _____ / 35  
**Tests Failed:** _____ / 35  
**Pass Rate:** _____%

---

## Critical Issues Found

List any critical bugs or issues that prevent core functionality:

1. _________________________________________________
2. _________________________________________________
3. _________________________________________________

---

## Minor Issues Found

List any minor bugs or cosmetic issues:

1. _________________________________________________
2. _________________________________________________
3. _________________________________________________

---

## Recommendations

Suggested improvements or fixes:

1. _________________________________________________
2. _________________________________________________
3. _________________________________________________

---

## Sign-Off

**Tester Signature:** _________________________  
**Date:** _________________________  
**Status:** ☐ Approved for Production  ☐ Needs Fixes
