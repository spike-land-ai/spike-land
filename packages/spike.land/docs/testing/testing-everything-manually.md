# Spike Land - Complete Manual Testing Guide

**Last Updated:** 2026-02-26 **Production URL:** https://spike.land
**Pre-tested by:** Claude Code with Playwright MCP

---

## Prerequisites

Before testing, ensure you have:

- A modern browser (Chrome, Firefox, Safari, or Edge)
- Test account credentials (GitHub or Google OAuth)
- Admin account credentials (for admin dashboard testing)
- Production URL: https://spike.land

---

## A. Authentication Testing

### A.1 Sign In with GitHub

1. Navigate to https://spike.land
2. Click the user avatar/sign-in button in the top right
3. Select "Sign in with GitHub"
4. Complete GitHub OAuth flow
5. **Expected:** Redirected back to the app, user avatar appears in header

### A.2 Sign In with Google

1. Navigate to https://spike.land
2. Click the user avatar/sign-in button
3. Select "Sign in with Google"
4. Complete Google OAuth flow
5. **Expected:** Redirected back to the app, user avatar appears in header

### A.3 Protected Route Access

1. While logged out, navigate to https://spike.land/apps/pixel
2. **Expected:** Redirected to sign-in page
3. After signing in, try accessing:
   - `/apps/pixel` - Should load image enhancement page
   - `/settings` - Should load settings page
   - `/albums` - Should load albums page
   - `/referrals` - Should load referral dashboard
   - `/my-apps` - Should load My Apps dashboard

### A.4 Sign Out

1. While logged in, click your user avatar
2. Select "Sign Out"
3. **Expected:** Session ends, redirected to home page

### A.5 Session Persistence

1. Sign in to the app
2. Close the browser tab
3. Open a new tab and navigate to https://spike.land/apps/pixel
4. **Expected:** Still logged in, no re-authentication needed

---

## B. Image Enhancement Testing

### B.1 Upload Image

1. Navigate to https://spike.land/apps/pixel
2. Drag and drop an image onto the upload area (or click to select)
3. **Supported formats:** JPEG, PNG, WebP
4. **Max size:** 50MB
5. **Expected:** Image appears in "Your Images" gallery with status

### B.2 Enhance Image (All Tiers)

1. Click on an uploaded image to open detail view
2. Select enhancement tier:
   - **1K (1024px)** - 2 tokens, fast processing
   - **2K (2048px)** - 5 tokens, balanced quality
   - **4K (4096px)** - 10 tokens, maximum quality
3. Click "Enhance" button
4. **Expected:** Job starts processing, progress shown

### B.3 Compare Before/After

1. After enhancement completes, the before/after slider appears
2. Drag the slider left/right to compare
3. **Expected:** Smooth slider movement, clear comparison

### B.4 Download Enhanced Image

1. In the image detail view, locate the Export section
2. Select format (JPEG, PNG, or WebP)
3. Adjust quality slider (for JPEG)
4. Click "Download [Format]"
5. **Expected:** Enhanced image downloads to your device

### B.5 Version History

1. In image detail view, scroll to "Enhancement Versions"
2. Each version shows tier, date, and download option
3. **Expected:** All previous enhancements listed with details

### B.6 Delete Image

1. In the image gallery, click "Delete" on an image
2. Confirm deletion
3. **Expected:** Image removed from gallery

---

## C. Token System Testing

### C.1 Check Token Balance

1. Navigate to https://spike.land/apps/pixel
2. Look at the token balance display (top right area)
3. **Expected:** Shows current token count and "Available balance"

### C.2 Purchase Tokens (One-Time)

1. Navigate to https://spike.land/pricing
2. View available token packs:
   - Starter Pack: 10 tokens - £2.99
   - Basic Pack: 50 tokens - £9.99
   - Pro Pack: 150 tokens - £24.99
   - Power Pack: 500 tokens - £69.99
3. Click "Buy Now" on any pack
4. **Expected:** Redirected to Stripe checkout

### C.3 Stripe Checkout Flow

1. On Stripe checkout page, verify:
   - Correct product name and price shown
   - Your email pre-filled
   - Payment options available
2. You can use Stripe test cards for testing (if in test mode)
3. **Expected:** After purchase, redirected to /apps/pixel with updated balance

### C.4 Verify Low Balance Warnings

1. When token balance is low (<10 tokens), a warning banner should appear
2. The banner should offer a "Get Tokens" button
3. **Expected:** Warning visible, links to pricing page

### C.5 Redeem Voucher Code

1. Look for voucher redemption option (if available in UI)
2. Enter a valid voucher code
3. **Expected:** Tokens added to balance, success message shown

---

## D. Album Testing

### D.1 Create Album

1. Navigate to https://spike.land/apps/pixel/albums
2. Click "New Album" button
3. Enter album name (e.g., "My Test Album")
4. Select privacy setting (Private or Unlisted)
5. Click "Create Album"
6. **Expected:** New album appears in albums list

### D.2 Add Images to Album

1. Navigate to https://spike.land/apps/pixel
2. On any image, click "Add to Album" button
3. Select target album from dropdown
4. **Expected:** Image added to album, confirmation shown

### D.3 View Album

1. Navigate to https://spike.land/apps/pixel/albums
2. Click "View Album" on any album
3. **Expected:** Album detail page shows all images in album

### D.4 Share Album (Unlisted Link)

1. In album detail view, look for share options
2. Copy the unlisted share link
3. Open link in incognito/private browser
4. **Expected:** Album viewable without authentication

### D.5 Set Cover Image

1. In album detail view, hover over an image
2. Select "Set as Cover" option
3. **Expected:** Image becomes album cover in listings

### D.6 Delete Album

1. In albums list, click the menu button on an album
2. Select "Delete"
3. Confirm deletion
4. **Expected:** Album removed from list

---

## E. Batch Operations Testing

### E.1 Batch Upload

1. Navigate to https://spike.land/apps/pixel
2. Select multiple images at once (drag multiple or Shift+click)
3. **Expected:** All images upload and appear in gallery

### E.2 Batch Enhancement

1. In image gallery, select multiple images
2. Choose enhancement tier for batch
3. Start batch enhancement
4. **Expected:** All selected images queued for enhancement

### E.3 Bulk Delete

1. In image gallery, select multiple images
2. Click bulk delete option
3. Confirm deletion
4. **Expected:** All selected images removed

---

## F. Referral Program Testing

### F.1 View Referral Link

1. Navigate to https://spike.land/referrals
2. **Expected:** Your unique referral link displayed (e.g.,
   `https://spike.land?ref=XXXXXXXX`)

### F.2 Copy Referral Link

1. On referral page, click "Copy" button
2. **Expected:** Button changes to "Copied!", link in clipboard

### F.3 Social Sharing

1. Click "Share on Twitter" button
2. **Expected:** Twitter share dialog opens with pre-filled message
3. Test Facebook and LinkedIn buttons similarly

### F.4 View Statistics

1. On referral page, view statistics cards:
   - Total Referrals
   - Completed
   - Pending
   - Tokens Earned
2. **Expected:** Accurate counts displayed

### F.5 View Referred Users

1. Scroll to "Your Referrals" section
2. **Expected:** List of users who signed up via your link (or empty state
   message)

---

## G. Admin Dashboard Testing

**Note:** Requires admin role. Regular users will be blocked.

### G.1 Access Control (Admin Only)

1. Log in with a non-admin account
2. Navigate to https://spike.land/admin
3. **Expected:** Access denied or redirect to home

4. Log in with admin account
5. Navigate to https://spike.land/admin
6. **Expected:** Admin dashboard loads successfully

### G.2 Dashboard Overview

1. On /admin, verify metrics cards:
   - Total Users (with admin count)
   - Enhancements (with active jobs)
   - Tokens Purchased (with spent count)
   - Active Vouchers
2. **Expected:** All metrics accurate and updating

### G.3 User Analytics (/admin/analytics)

1. Navigate to User Analytics
2. Verify charts:
   - Daily Registrations (30 days)
   - Auth Provider Breakdown (pie chart)
   - Provider Statistics (bar chart)
3. **Expected:** Charts render with data

### G.4 Token Analytics (/admin/tokens)

1. Navigate to Token Economics
2. Verify token purchase and spending data
3. **Expected:** Revenue and usage metrics displayed

### G.5 System Health Monitoring (/admin/system)

1. Navigate to System Health
2. Verify metrics:
   - Queue Depth (pending + processing jobs)
   - Total Jobs
   - Failure Rate
   - Avg Processing Time
3. View Job Status Breakdown
4. View Recent Failures with error messages
5. **Expected:** Real-time job processing visibility

### G.6 Job Queue Status

1. In System Health, check:
   - COMPLETED jobs count
   - PROCESSING jobs count
   - FAILED jobs count
2. **Expected:** Accurate breakdown of job states

### G.7 Voucher Management (/admin/vouchers)

1. Navigate to Vouchers
2. View existing vouchers in table
3. Click "Create Voucher" to add new voucher
4. Fill in code, type, value, max uses, expiry
5. **Expected:** Voucher created and appears in table

### G.8 User Search (/admin/users)

1. Navigate to User Management
2. Use search to find users by email/name
3. **Expected:** Matching users displayed

---

## H. Legal Pages Testing

### H.1 Terms of Service

1. Navigate to https://spike.land/terms
2. **Expected:** Full Terms of Service document loads
3. Verify table of contents links work
4. Check all sections expand/collapse properly

### H.2 Privacy Policy

1. Navigate to https://spike.land/privacy
2. **Expected:** Full Privacy Policy document loads
3. Verify data collection and retention sections present

### H.3 Cookie Policy

1. Navigate to https://spike.land/cookies
2. **Expected:** Full Cookie Policy document loads
3. Verify cookie types and management info present

---

## I. My Apps Platform Testing

### I.1 View Apps List

1. Navigate to https://spike.land/my-apps
2. **Expected:** Grid of your apps (or empty state)

### I.2 Create New App

1. Click "Create New App" button
2. Follow the creation wizard:
   - Enter app name and description
   - Add requirements
   - Configure settings
3. **Expected:** App created and appears in list

### I.3 App Status Badges

1. View apps in list
2. **Expected:** Each app shows status badge (DRAFT, ACTIVE, etc.)

---

## J. Production Monitoring

### J.1 Checking Vercel Logs

1. Go to https://vercel.com/dashboard
2. Select the spike.land project
3. Click "Deployments" tab
4. Select the production deployment
5. Click "Functions" or "Logs" tab
6. **Expected:** Server logs visible, filter by time/type

### J.2 Error Tracking

1. In Vercel dashboard, look for:
   - Function errors
   - Build errors
   - Runtime exceptions
2. Check for 500-series errors in logs
3. **Expected:** Errors visible with stack traces

### J.3 Performance Monitoring

1. In Vercel dashboard, check:
   - Speed Insights
   - Web Analytics
2. Look for Core Web Vitals:
   - LCP (Largest Contentful Paint)
   - FID (First Input Delay)
   - CLS (Cumulative Layout Shift)
3. **Expected:** Performance metrics available

---

## Known Issues & Workarounds

### Issue 1: Job Cancellation Error

**Status:** Bug identified, fix in progress **Error:**
`invalid input value for enum "JobStatus": "CANCELLED"` **Impact:** Cannot
cancel processing jobs **Workaround:** Wait for job to complete or fail

### Issue 2: Enhancement Pipeline Stuck

**Status:** Under investigation **Symptoms:** Jobs stuck in "PROCESSING" state,
never complete **Cause:** Gemini API timeouts (120000ms) **Impact:** New
enhancements may not complete **Workaround:** Check System Health for job status

### Issue 3: React Hydration Warnings

**Status:** Low priority **Error:** `Minified React error #418` **Impact:**
Console warnings, no user-facing issues **Cause:** Text content mismatch between
server and client

### Issue 4: 405 Method Not Allowed Errors

**Status:** Under investigation **Symptoms:** Console errors on page loads
**Impact:** May affect some API functionality **Note:** Pages still render
correctly

---

## Test Results Summary

| Feature Area                   | Status  | Notes                                |
| ------------------------------ | ------- | ------------------------------------ |
| Authentication (GitHub/Google) | PASS    | OAuth flows work correctly           |
| Protected Routes               | PASS    | Proper redirects                     |
| Image Upload                   | PASS    | Drag-drop and click work             |
| Enhancement Tiers              | PARTIAL | Jobs not completing (pipeline issue) |
| Before/After Slider            | PASS    | Works when enhancements complete     |
| Token Balance Display          | PASS    | Accurate display                     |
| Stripe Checkout                | PASS    | Redirects to Stripe correctly        |
| Album CRUD                     | PASS    | Create, view, delete work            |
| Album Sharing                  | PASS    | Unlisted links work                  |
| Referral Link                  | PASS    | Copy and share work                  |
| Referral Stats                 | PASS    | Statistics display correctly         |
| Admin Dashboard                | PASS    | All sections accessible              |
| System Health                  | PASS    | Job monitoring works                 |
| Voucher Management             | PASS    | Create and manage vouchers           |
| Legal Pages                    | PASS    | All content renders                  |
| My Apps                        | PASS    | Empty state and create work          |

---

## K. Storybook Pages Testing

The platform includes 46 storybook pages that serve as both visual
documentation and interactive testing resources for UI components.

### K.1 Accessing Storybook Pages

1. Storybook pages are located under `src/app/` across various app routes
2. These pages render components in isolation with example props
3. They can be used for visual regression testing and manual QA

### K.2 Coverage

| Area             | Storybook Pages | Notes                            |
| ---------------- | --------------- | -------------------------------- |
| First-party apps | 12              | Added 2026-02-26 with unit tests |
| UI components    | ~20             | shadcn/ui component demos        |
| Landing sections | ~8              | Marketing page sections          |
| Admin components | ~6              | Dashboard widgets                |
| **Total**        | **46**          |                                  |

### K.3 Using Storybook Pages for Testing

- Each storybook page renders the component with representative data
- Check that components render without console errors
- Verify responsive behavior at different viewport sizes
- Use as a reference when verifying component behavior after refactoring

---

## Appendix: Quick Links

- **Production:** https://spike.land
- **Pricing:** https://spike.land/pricing
- **Enhance:** https://spike.land/apps/pixel
- **Albums:** https://spike.land/apps/pixel/albums
- **Referrals:** https://spike.land/referrals
- **Admin:** https://spike.land/admin
- **Settings:** https://spike.land/settings
- **Terms:** https://spike.land/terms
- **Privacy:** https://spike.land/privacy
- **Cookies:** https://spike.land/cookies
