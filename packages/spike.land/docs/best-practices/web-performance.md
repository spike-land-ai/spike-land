# Web Performance Optimization Best Practices 2025

A comprehensive guide to optimizing web performance across Core Web Vitals,
image delivery, JavaScript bundling, caching strategies, network optimization,
and measurement tools.

---

## Table of Contents

1. [Core Web Vitals Optimization](#core-web-vitals-optimization)
2. [Image Optimization](#image-optimization)
3. [JavaScript Bundling](#javascript-bundling)
4. [Caching Strategies](#caching-strategies)
5. [Network Optimization](#network-optimization)
6. [Measurement & Monitoring](#measurement--monitoring)
7. [Implementation Checklist](#implementation-checklist)

---

## Core Web Vitals Optimization

### Understanding Core Web Vitals (2025)

Google's Core Web Vitals are three key metrics that measure real user experience
and are used as ranking factors in search results. In March 2024, FID was
officially replaced with INP (Interaction to Next Paint).

#### The Three Core Web Vitals

**1. Largest Contentful Paint (LCP)**

- **Measures:** How long it takes for the main content of a page to load
- **Good Score:** 2.5 seconds or less
- **Impact:** Perceived load speed, directly affects user first impression
- **Why it matters:** Users perceive faster pages as higher quality

**2. Interaction to Next Paint (INP)**

- **Measures:** Delay between user input (click, tap, type) and visible response
- **Good Score:** Below 200 milliseconds
- **Impact:** Page responsiveness to user interactions
- **Replaced:** First Input Delay (FID), which only measured first interaction
- **Why it matters:** INP considers all interactions and reports the worst one,
  giving a more complete picture

**3. Cumulative Layout Shift (CLS)**

- **Measures:** How much visible content moves around while loading
- **Good Score:** Under 0.1
- **Impact:** Visual stability and user experience
- **Why it matters:** Unexpected layout shifts cause misclicks and frustration

### LCP Optimization Strategies

#### 1. Optimize Images and Video

```html
<!-- Use WebP format with fallbacks -->
<picture>
  <source srcset="image.webp" type="image/webp">
  <img src="image.jpg" alt="Description">
</picture>

<!-- Responsive images with srcset -->
<img
  srcset="image-small.jpg 400w, image-medium.jpg 800w, image-large.jpg 1200w"
  sizes="(max-width: 600px) 100vw, (max-width: 1200px) 80vw, 1200px"
  src="image-large.jpg"
  alt="Description"
>

<!-- Lazy loading non-critical images -->
<img src="image.jpg" alt="Description" loading="lazy">
```

#### 2. Reduce Server Response Time

```javascript
// Implement caching strategies
// Use a CDN for global distribution
// Optimize database queries
// Implement server-side caching

// Example: Cache-Control headers
// Cache-Control: public, max-age=3600  // Cache for 1 hour
// Cache-Control: public, max-age=31536000, immutable  // Cache for 1 year (cache busting)
```

#### 3. Eliminate Render-Blocking Resources

```html
<!-- Defer non-critical JavaScript -->
<script src="script.js" defer></script>

<!-- Async for independent scripts -->
<script src="analytics.js" async></script>

<!-- Inline critical CSS -->
<style>
  /* Critical above-the-fold styles */
</style>

<!-- Defer non-critical CSS -->
<link
  rel="stylesheet"
  href="styles.css"
  media="print"
  onload="this.media='all'"
>
```

#### 4. Optimize Web Fonts

```css
/* Preload critical fonts */
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap");

/* Font-display swap for faster text display */
@font-face {
  font-family: "CustomFont";
  src: url("font.woff2") format("woff2");
  font-display: swap; /* Show fallback immediately */
}
```

### INP Optimization Strategies

#### 1. Optimize JavaScript Execution

```javascript
// Break long tasks into smaller chunks
// Task: 500ms of work
// Solution: Split into 50ms chunks with requestIdleCallback

function processLargeData(data) {
  const chunkSize = 100;
  let currentIndex = 0;

  function processChunk() {
    const endIndex = Math.min(currentIndex + chunkSize, data.length);

    for (let i = currentIndex; i < endIndex; i++) {
      // Process item
    }

    currentIndex = endIndex;

    if (currentIndex < data.length) {
      // Schedule next chunk
      if (navigator.scheduling?.isInputPending()) {
        // Yield to browser for input processing
        setTimeout(processChunk, 0);
      } else {
        requestIdleCallback(processChunk);
      }
    }
  }

  processChunk();
}
```

#### 2. Reduce Third-Party Script Impact

```html
<!-- Load third-party scripts with caution -->
<!-- Option 1: Load asynchronously -->
<script async src="third-party.js"></script>

<!-- Option 2: Load after critical content -->
<script defer src="third-party.js"></script>

<!-- Option 3: Lazy load third-party scripts -->
<script>
  // Load analytics only after page interaction
  window.addEventListener("mousemove", loadAnalytics, { once: true });

  function loadAnalytics() {
    const script = document.createElement("script");
    script.src = "analytics.js";
    document.head.appendChild(script);
  }
</script>
```

#### 3. Optimize Event Handlers

```javascript
// Debounce input events
function debounce(fn, delay) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

// Example: Search input
const handleSearch = debounce(event => {
  // Perform search operation
}, 300);

document.getElementById("search").addEventListener("input", handleSearch);

// Throttle scroll events
function throttle(fn, limit) {
  let lastRun = 0;
  return function(...args) {
    const now = Date.now();
    if (now - lastRun >= limit) {
      fn(...args);
      lastRun = now;
    }
  };
}

window.addEventListener(
  "scroll",
  throttle(() => {
    // Handle scroll
  }, 100),
);
```

### CLS Optimization Strategies

#### 1. Set Explicit Dimensions

```html
<!-- Always specify width and height for images -->
<img
  src="image.jpg"
  alt="Description"
  width="800"
  height="600"
  style="aspect-ratio: 800 / 600"
>

<!-- Use aspect-ratio for responsive images -->
<img
  src="image.jpg"
  alt="Description"
  style="aspect-ratio: 16 / 9; width: 100%; height: auto"
>

<!-- Reserve space for video embeds -->
<div style="aspect-ratio: 16 / 9; width: 100%">
  <iframe
    width="100%"
    height="100%"
    src="https://www.youtube.com/embed/VIDEO_ID"
    style="position: absolute; top: 0; left: 0"
  ></iframe>
</div>
```

#### 2. Avoid Layout-Shifting Animations

```css
/* Use transform instead of position changes */
.element {
  /* Causes layout shift */
  /* position: relative; */
  /* left: 10px; */

  /* No layout shift - GPU accelerated */
  transform: translateX(10px);
}

/* Use will-change for performance */
.animated-element {
  will-change: transform;
  animation: slideIn 0.5s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

#### 3. Control Font Loading Behavior

```css
/* Font-display strategies */

/* swap: Show fallback immediately, update when font loads (recommended) */
@font-face {
  font-family: "CustomFont";
  src: url("font.woff2") format("woff2");
  font-display: swap;
}

/* fallback: Hide text 100ms, show fallback if font unavailable (max 3s) */
@font-face {
  font-family: "CustomFont";
  src: url("font.woff2") format("woff2");
  font-display: fallback;
}
```

---

## Image Optimization

### Image Format Selection

| Format   | Best For                | Compression                  | Browser Support             | Notes               |
| -------- | ----------------------- | ---------------------------- | --------------------------- | ------------------- |
| **WebP** | All images              | 25-34% smaller than JPEG/PNG | Modern browsers             | Use with fallback   |
| **AVIF** | Photos & complex images | Best compression ratio       | Chrome, Firefox, Safari 16+ | Future-proof format |
| **JPEG** | Photographs             | Good compression             | All browsers                | Fallback format     |
| **PNG**  | Graphics, transparency  | Lossless                     | All browsers                | Larger file size    |
| **SVG**  | Icons, logos            | Scalable                     | All browsers                | Vector-based        |

### Implementing WebP with Fallback

```html
<!-- Method 1: Picture element (recommended) -->
<picture>
  <source srcset="image.avif" type="image/avif">
  <source srcset="image.webp" type="image/webp">
  <img src="image.jpg" alt="Description" width="800" height="600">
</picture>

<!-- Method 2: Responsive images with WebP -->
<picture>
  <source
    srcset="image-small.webp 400w, image-medium.webp 800w, image-large.webp 1200w"
    sizes="(max-width: 600px) 100vw, (max-width: 1200px) 80vw, 1200px"
    type="image/webp"
  >
  <img
    srcset="image-small.jpg 400w, image-medium.jpg 800w, image-large.jpg 1200w"
    sizes="(max-width: 600px) 100vw, (max-width: 1200px) 80vw, 1200px"
    src="image-large.jpg"
    alt="Description"
    width="1200"
    height="800"
  >
</picture>
```

### Lazy Loading Strategy

```html
<!-- Native lazy loading (supported in all modern browsers) -->
<img
  src="image.jpg"
  alt="Description"
  loading="lazy"
  width="800"
  height="600"
>

<!-- Preload critical images above the fold -->
<link rel="preload" as="image" href="hero-image.jpg">

<!-- Prefetch images for next page -->
<link rel="prefetch" as="image" href="next-page-image.jpg">

<!-- Responsive lazy loading -->
<img
  data-src="image.jpg"
  data-srcset="image-small.jpg 400w, image-medium.jpg 800w, image-large.jpg 1200w"
  data-sizes="(max-width: 600px) 100vw, (max-width: 1200px) 80vw, 1200px"
  alt="Description"
  loading="lazy"
  width="800"
  height="600"
>
```

### Image CDN Best Practices

```javascript
// Example: Using Cloudinary or similar Image CDN
const imageUrl = new URL("https://res.cloudinary.com/demo/image/upload");

// Automatic format selection
imageUrl.searchParams.append("f_auto", "true"); // Auto format based on browser

// Quality optimization
imageUrl.searchParams.append("q_auto", "true"); // Auto quality

// Responsive sizing
imageUrl.searchParams.append("w_auto", "true"); // Responsive width

// Aspect ratio preservation
imageUrl.searchParams.append("ar_16:9", "true");
imageUrl.searchParams.append("c_fill", "true"); // Crop to fill

console.log(imageUrl.toString());
```

### Next.js Image Component

```typescript
// app/page.tsx
import Image from "next/image";

export default function Home() {
  return (
    <>
      {/* Responsive image with automatic optimization */}
      <Image
        src="/hero.jpg"
        alt="Hero image"
        width={1200}
        height={600}
        priority={true} // Preload above-fold images
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
      />

      {/* Lazy load below-fold images */}
      <Image
        src="/product.jpg"
        alt="Product"
        width={400}
        height={300}
        loading="lazy"
      />

      {/* Image with blur placeholder */}
      <Image
        src="/image.jpg"
        alt="Image with placeholder"
        width={800}
        height="600"
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,..." // Generate with tools
      />
    </>
  );
}
```

---

## JavaScript Bundling

### Code Splitting Strategy

```typescript
// Dynamic imports for route-based code splitting
import { lazy, Suspense } from "react";

const HeavyComponent = lazy(() => import("./HeavyComponent"));
const AdminPanel = lazy(() => import("./AdminPanel"));

export default function App() {
  return (
    <Suspense fallback={<Loading />}>
      <HeavyComponent />
      <AdminPanel />
    </Suspense>
  );
}
```

```typescript
// Conditional imports for feature-specific code
async function loadAnalytics() {
  if (shouldLoadAnalytics) {
    const { initAnalytics } = await import("./analytics");
    initAnalytics();
  }
}
```

### Tree Shaking Best Practices

```typescript
// ✅ DO: Named exports for tree shaking
// utils.ts
export function utilityA() {/* ... */}
export function utilityB() {/* ... */}

// main.ts
import { utilityA } from "./utils"; // Only utilityA is bundled

// ❌ DON'T: Default exports with multiple items
// utils.ts
export default {
  utilityA: () => {/* ... */},
  utilityB: () => {/* ... */},
};

// main.ts
import utils from "./utils"; // Both utilities bundled
```

```typescript
// ✅ DO: Use ES6 modules for tree shaking
// With CommonJS, tree shaking is limited
import { flatMap } from "lodash-es"; // Tree shakable

// ❌ DON'T: Use CommonJS for bundled libraries
import { flatMap } from "lodash"; // Not tree shakable
```

```json
// package.json: Mark pure modules for tree shaking
{
  "name": "my-library",
  "sideEffects": false, // No side effects - safe to tree shake
  "main": "dist/index.js",
  "module": "dist/index.es.js"
}

// Or specify which files have side effects
{
  "sideEffects": [
    "./src/polyfills.js",
    "./src/global.css"
  ]
}
```

### Bundling Configuration (Webpack Example)

```javascript
// webpack.config.js
module.exports = {
  mode: "production",

  entry: {
    main: "./src/index.js",
    // Create separate chunks for third-party libraries
    vendor: ["react", "react-dom"],
  },

  output: {
    filename: "[name].[contenthash].js",
    path: __dirname + "/dist",
  },

  optimization: {
    // Split code into reusable chunks
    splitChunks: {
      chunks: "all",
      cacheGroups: {
        // Vendor chunk
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: "vendors",
          priority: 10,
          reuseExistingChunk: true,
        },
        // Common chunk shared between modules
        common: {
          minChunks: 2,
          priority: 5,
          reuseExistingChunk: true,
          name: "common",
        },
      },
    },
    // Extract runtime chunk
    runtimeChunk: "single",
    // Minify JavaScript
    minimize: true,
  },

  module: {
    rules: [
      {
        test: /\.[jt]sx?$/,
        use: "babel-loader",
        exclude: /node_modules/,
      },
    ],
  },
};
```

### Bundle Analysis

```bash
# Install webpack-bundle-analyzer
npm install --save-dev webpack-bundle-analyzer

# View bundle composition
webpack-bundle-analyzer dist/stats.json
```

```javascript
// webpack.config.js
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin;

module.exports = {
  plugins: [
    new BundleAnalyzerPlugin({
      analyzerMode: "static",
      reportFilename: "bundle-report.html",
      openAnalyzer: true,
    }),
  ],
};
```

---

## Caching Strategies

### Browser Cache Configuration

```javascript
// Set-Cookie headers for cache control
// Permanent resources (versioned files)
Cache-Control: public, max-age=31536000, immutable

// Example: Versioned JavaScript/CSS
// style.abc123.css - Can be cached forever due to hash

// Dynamic content
Cache-Control: public, max-age=3600  // 1 hour

// Sensitive content
Cache-Control: private, no-cache  // Private, must revalidate

// HTML (frequently updated)
Cache-Control: public, max-age=0, must-revalidate  // Always check server
```

### Service Worker Caching Strategies

```typescript
// caching-strategies.ts

// Strategy 1: Cache First (Cache, fallback to Network)
// Best for: Static assets, images, fonts
async function cacheFirst(request: Request): Promise<Response> {
  const cache = await caches.open("v1");
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    return new Response("Offline - Resource not cached", { status: 503 });
  }
}

// Strategy 2: Network First (Network, fallback to Cache)
// Best for: HTML, frequently updated content
async function networkFirst(request: Request): Promise<Response> {
  const cache = await caches.open("v1");

  try {
    const response = await fetch(request);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    return new Response("Offline - No cached version", { status: 503 });
  }
}

// Strategy 3: Stale While Revalidate
// Best for: API calls, content that can be slightly outdated
async function staleWhileRevalidate(request: Request): Promise<Response> {
  const cache = await caches.open("v1");
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then(response => {
    cache.put(request, response.clone());
    return response;
  });

  return cached || fetchPromise;
}

// Strategy 4: Network Only
// Best for: Real-time data, API calls requiring fresh data
async function networkOnly(request: Request): Promise<Response> {
  try {
    return await fetch(request);
  } catch (error) {
    return new Response("Offline - Network request failed", { status: 503 });
  }
}

// Service Worker registration
self.addEventListener("fetch", (event: FetchEvent) => {
  const { request } = event;
  const url = new URL(request.url);

  // Static assets: Cache First
  if (url.pathname.match(/\.(js|css|woff2|png|jpg|webp)$/)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // HTML: Network First
  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  // API: Stale While Revalidate
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Default: Network Only
  event.respondWith(networkOnly(request));
});
```

### CDN Cache Strategy

```javascript
// Cloudflare cache configuration example
// Add cache headers through your origin server

// Version 1: Cache static assets
app.use((req, res, next) => {
  if (req.url.match(/\.(js|css|woff2|png|jpg|webp)$/)) {
    // Cache for 1 year - versioned files won't change
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  }
  next();
});

// Version 2: Cache HTML with validation
app.use((req, res, next) => {
  if (req.url.endsWith(".html") || !req.url.includes(".")) {
    // Cache for 1 hour, always validate with server
    res.setHeader("Cache-Control", "public, max-age=3600, must-revalidate");
    // Add ETag for efficient revalidation
    res.setHeader("ETag", calculateETag(content));
  }
  next();
});

// Version 3: Handle cross-origin requests
app.use((req, res, next) => {
  // Enable CORS for CDN resources
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  next();
});
```

### Cache Invalidation Strategies

```typescript
// Method 1: Hash-based cache busting (recommended)
// Build process: main.abc123.js -> Always new hash when content changes
// webpack output:
//   filename: '[name].[contenthash].js'

// Method 2: Query parameters
const scriptUrl = "/main.js?v=" + buildVersion;

// Method 3: Service Worker-based cache invalidation
const CACHE_VERSION = "v1.0.0";

self.addEventListener("install", (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => {
      return cache.addAll(["/index.html", "/main.js", "/styles.css"]);
    }),
  );
});

self.addEventListener("activate", (event: ExtendableEvent) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_VERSION) {
            return caches.delete(cacheName);
          }
        }),
      );
    }),
  );
});
```

---

## Network Optimization

### GZIP/Brotli Compression

```javascript
// Express.js compression
import compression from "compression";

const app = express();

// Enable compression for text-based content
app.use(compression({
  // Compress responses larger than 1KB
  threshold: 1024,
  // Compression level: 6 is default, 11 is max (slower)
  level: 6,
  // Only compress these types
  filter: (req, res) => {
    if (req.headers["x-no-compression"]) {
      return false;
    }
    return compression.filter(req, res);
  },
}));

// Nginx configuration for compression
/*
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript
           application/x-javascript application/xml+rss
           application/javascript application/json;
gzip_comp_level 6;
gzip_disable "msie6";

# Brotli compression (modern alternative)
brotli on;
brotli_comp_level 6;
brotli_types text/plain text/css text/xml text/javascript
            application/x-javascript application/xml+rss
            application/javascript application/json;
*/
```

### HTTP/2 Server Push

```javascript
// Express.js with HTTP/2
import fs from "fs";
import spdy from "spdy";

const options = {
  key: fs.readFileSync("./server.key"),
  cert: fs.readFileSync("./server.crt"),
};

// Push critical resources
app.get("/", (req, res) => {
  // Push CSS to client
  if (!res.headersSent) {
    res.push("/styles.css", {
      status: 200,
      method: "GET",
      request: {
        accept: "*/*",
      },
      response: {
        "content-type": "text/css",
      },
    }, (err, pushRes) => {
      if (err) return;
      fs.createReadStream("styles.css").pipe(pushRes);
    });
  }

  res.sendFile("index.html");
});

spdy.createServer(options, app).listen(3000);
```

### Resource Preloading

```html
<!-- Preload: High priority, current page -->
<!-- Use for critical resources needed immediately -->
<link rel="preload" as="font" href="/fonts/main.woff2" crossorigin>
<link rel="preload" as="script" href="/critical.js">
<link rel="preload" as="style" href="/critical.css">
<link rel="preload" as="image" href="/hero-image.jpg">

<!-- Prefetch: Low priority, future navigation -->
<!-- Use for resources likely needed on next page -->
<link rel="prefetch" as="image" href="/next-page-image.jpg">
<link rel="prefetch" as="script" href="/next-page-bundle.js">

<!-- DNS Prefetch: Resolve domain early -->
<link rel="dns-prefetch" href="//cdn.example.com">

<!-- Preconnect: Establish connection (DNS + TCP + TLS) -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

<!-- Prerender: Load entire page in background -->
<link rel="prerender" href="/next-page.html">
```

### Connection Optimization

```typescript
// Reduce connection overhead with connection hints
// Link the font file with preconnect
fetch("https://fonts.googleapis.com/css2?family=Inter:wght@400;700")
  .then(res => res.text())
  .then(css => {
    const style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);
  });

// Critical resource priority hints
const priorityHints = `
  <!-- High priority -->
  <link rel="preload" as="font" href="/fonts/main.woff2" fetchpriority="high">

  <!-- Low priority for below-fold content -->
  <img src="below-fold.jpg" fetchpriority="low" loading="lazy">
`;
```

---

## Measurement & Monitoring

### Core Web Vitals Measurement

```typescript
// Using the web-vitals library (recommended)
import { getCLS, getFCP, getFID, getLCP, getTTFB } from "web-vitals";

// Report Core Web Vitals
getCLS(console.log); // Cumulative Layout Shift
getFID(console.log); // First Input Delay (deprecated)
getFCP(console.log); // First Contentful Paint
getLCP(console.log); // Largest Contentful Paint
getTTFB(console.log); // Time to First Byte

// Send to analytics service
function sendVital(vital) {
  // Send to your analytics endpoint
  fetch("/api/vitals", {
    method: "POST",
    body: JSON.stringify(vital),
    keepalive: true, // Send even if page unloads
  });
}

getCLS(sendVital);
getLCP(sendVital);
```

### Real User Monitoring (RUM) Implementation

```typescript
// RUM data collection
class RUMCollector {
  private metrics: PerformanceMetric[] = [];

  constructor() {
    this.setupObservers();
  }

  private setupObservers() {
    // Observe all performance entries
    const observer = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        this.recordMetric({
          name: entry.name,
          type: entry.entryType,
          duration: entry.duration,
          startTime: entry.startTime,
          value: (entry as any).value,
        });
      }
    });

    observer.observe({
      entryTypes: [
        "navigation",
        "resource",
        "paint",
        "largest-contentful-paint",
        "layout-shift",
      ],
    });
  }

  private recordMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);

    // Send in batches
    if (this.metrics.length >= 10) {
      this.flush();
    }
  }

  private flush() {
    if (this.metrics.length === 0) return;

    fetch("/api/rum", {
      method: "POST",
      body: JSON.stringify({
        metrics: this.metrics,
        url: window.location.href,
        userAgent: navigator.userAgent,
      }),
      keepalive: true,
    });

    this.metrics = [];
  }
}

// Initialize RUM collection
new RUMCollector();
```

### Lighthouse Measurement

```bash
# Run Lighthouse from CLI
npx lighthouse https://example.com --output-path=./report.html

# Programmatically run Lighthouse
npx lighthouse https://example.com \
  --chrome-flags="--headless" \
  --output-path=./report.json \
  --output=json
```

```typescript
// Parse Lighthouse results
interface LighthouseScore {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
}

function parseLighthouseReport(report: any): LighthouseScore {
  return {
    performance: Math.round(report.categories.performance.score * 100),
    accessibility: Math.round(report.categories.accessibility.score * 100),
    bestPractices: Math.round(report.categories["best-practices"].score * 100),
    seo: Math.round(report.categories.seo.score * 100),
  };
}
```

### Difference Between Lab and Field Data

| Aspect           | Lab Data (Lighthouse)                  | Field Data (RUM)      |
| ---------------- | -------------------------------------- | --------------------- |
| **Source**       | Synthetic tests on controlled hardware | Real user devices     |
| **Environment**  | Fixed device/connection                | Variable conditions   |
| **Interactions** | Simulated or none                      | Real user behavior    |
| **INP/FID**      | Approximation (Total Blocking Time)    | Accurate measurements |
| **When to use**  | Development/debugging                  | Production monitoring |
| **Tools**        | Lighthouse, WebPageTest                | Analytics SDKs, CrUX  |

### Google CrUX (Chrome User Experience Report)

```bash
# Install Google Analytics library
npm install @react-google-analytics/core

# Query CrUX data via PageSpeed Insights API
curl "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://example.com&key=YOUR_API_KEY"
```

```typescript
// Integrate with Google Search Console
// Monitor Core Web Vitals trends over time in GSC:
// 1. Go to Google Search Console
// 2. Navigate to Experience → Core Web Vitals
// 3. View performance trends
// 4. Click issues to see affected URLs
```

---

## Implementation Checklist

### Phase 1: Core Web Vitals (Week 1-2)

- [ ] **LCP Optimization**
  - [ ] Optimize images (convert to WebP, use srcset)
  - [ ] Defer non-critical CSS/JS
  - [ ] Implement server-side caching
  - [ ] Use CDN for content delivery
  - [ ] Target: < 2.5s

- [ ] **INP Optimization**
  - [ ] Identify slow event handlers
  - [ ] Break long tasks into chunks (< 50ms)
  - [ ] Defer non-critical JavaScript
  - [ ] Use debouncing/throttling for events
  - [ ] Target: < 200ms

- [ ] **CLS Optimization**
  - [ ] Set image/video dimensions
  - [ ] Avoid layout-shifting fonts
  - [ ] Use transform instead of position changes
  - [ ] Reserve space for ads/embeds
  - [ ] Target: < 0.1

### Phase 2: Image & Assets (Week 2-3)

- [ ] **Image Optimization**
  - [ ] Convert images to WebP with fallback
  - [ ] Implement lazy loading
  - [ ] Use responsive images (srcset)
  - [ ] Preload critical images
  - [ ] Setup Image CDN

- [ ] **JavaScript Bundling**
  - [ ] Implement code splitting
  - [ ] Enable tree shaking
  - [ ] Analyze bundle size
  - [ ] Minify production builds
  - [ ] Target: Reduce by 30%+

### Phase 3: Caching (Week 3-4)

- [ ] **Browser Cache**
  - [ ] Set appropriate Cache-Control headers
  - [ ] Implement cache busting (content hashing)
  - [ ] Configure ETags

- [ ] **Service Worker**
  - [ ] Implement caching strategies
  - [ ] Choose strategy per route (Cache-First, Network-First, etc.)
  - [ ] Handle offline scenarios

- [ ] **CDN Cache**
  - [ ] Configure CDN cache rules
  - [ ] Set cache expiration
  - [ ] Test cache invalidation

### Phase 4: Monitoring (Week 4+)

- [ ] **Setup Monitoring**
  - [ ] Implement RUM collection
  - [ ] Connect Google Analytics
  - [ ] Monitor Core Web Vitals dashboard
  - [ ] Set up alerts for regressions

- [ ] **Testing**
  - [ ] Run Lighthouse monthly
  - [ ] Use PageSpeed Insights
  - [ ] Monitor Google Search Console
  - [ ] Test on real devices/networks

---

## Quick Reference: Performance Targets

### Optimal Scores (2025)

| Metric   | Target  | Good  | Fair  | Poor    |
| -------- | ------- | ----- | ----- | ------- |
| **LCP**  | < 2.5s  | 2.5s  | 4.0s  | > 4.0s  |
| **INP**  | < 200ms | 200ms | 500ms | > 500ms |
| **CLS**  | < 0.1   | 0.1   | 0.25  | > 0.25  |
| **FCP**  | < 1.8s  | 1.8s  | 3.0s  | > 3.0s  |
| **TTFB** | < 600ms | 600ms | 1.8s  | > 1.8s  |

### Performance Budget Example

```json
{
  "bundles": [
    {
      "name": "main",
      "size": "150kb",
      "gzip": "45kb"
    },
    {
      "name": "vendor",
      "size": "100kb",
      "gzip": "35kb"
    }
  ],
  "metrics": {
    "LCP": "2.5s",
    "INP": "200ms",
    "CLS": "0.1",
    "FCP": "1.8s"
  }
}
```

---

## Common Issues & Solutions

### Issue: Large Images Delaying LCP

**Solution:**

- Convert to WebP format
- Implement lazy loading for below-fold
- Preload critical images
- Use responsive images

### Issue: JavaScript Causing INP > 200ms

**Solution:**

- Break long tasks into chunks
- Defer non-critical JavaScript
- Use Web Workers for heavy computation
- Optimize event handlers with debouncing

### Issue: Layout Shifts After Load

**Solution:**

- Set explicit dimensions for images/videos
- Reserve space for dynamic content
- Use CSS transforms instead of position
- Implement proper font-display strategy

### Issue: Service Worker Not Caching

**Solution:**

- Check cache storage quota
- Verify CORS headers on CDN resources
- Test with opaque responses (use stale-while-revalidate)
- Clear cache and reinstall

---

## Tools & Resources

### Measurement Tools

- **Lighthouse**: Built into Chrome DevTools
- **WebPageTest**: https://webpagetest.org
- **PageSpeed Insights**: https://pagespeed.web.dev
- **web-vitals library**: NPM package for RUM
- **Chrome User Experience Report (CrUX)**: Google API

### Image Optimization

- **TinyPNG/TinyJPG**: Online compression
- **ImageOptim**: macOS tool
- **ImageMagick**: CLI tool
- **Cloudinary**: Image CDN with auto-optimization

### Monitoring & Analytics

- **Google Analytics 4**: Standard analytics
- **Vercel Analytics**: Built-in performance monitoring
- **LogRocket**: Session replay + RUM
- **DataDog**: Comprehensive APM

### Performance Budgets

- **size-limit**: Check bundle size
- **Bundle Analyzer**: Webpack plugin
- **Import Cost**: IDE extension

---

## References & Sources

This document synthesizes best practices from:

- [Google Search Central - Core Web Vitals](https://developers.google.com/search/docs/appearance/core-web-vitals)
- [OWDT - How to improve Core Web Vitals 2025](https://owdt.com/insight/how-to-improve-core-web-vitals/)
- [NitroPack - Core Web Vitals Issues Guide](https://nitropack.io/blog/post/core-web-vitals-issues)
- [Request Metrics - High Performance Images Guide](https://requestmetrics.com/web-performance/high-performance-images/)
- [KeyCDN - Tree Shaking Guide](https://www.keycdn.com/blog/tree-shaking)
- [LogRocket - Tree Shaking and Code Splitting](https://blog.logrocket.com/tree-shaking-and-code-splitting-in-webpack/)
- [web.dev - Service Worker Caching](https://web.dev/articles/service-worker-caching-and-http-caching)
- [MDN - Using Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers)
- [Chrome Developers - Workbox Caching Strategies](https://developer.chrome.com/docs/workbox/caching-strategies-overview)
- [HubSpot - GZIP Compression](https://blog.hubspot.com/website/gzip-compression)
- [CatchMetrics - Next.js Performance with HTTP/2](http://www.catchmetrics.io/blog/boosting-nextjs-performance-with-http-2-and-compression)
- [web.dev - Measuring Web Vitals](https://web.dev/articles/vitals-measurement-getting-started)
- [RUMvision - Lighthouse vs RUM Data](https://www.rumvision.com/blog/understanding-the-difference-between-core-web-vitals-tools/)
- [Request Metrics - Unified Performance Monitoring](https://requestmetrics.com/blog/product/unified-web-performance/)
- [DebugBear - Real User Monitoring Tools](https://www.debugbear.com/software/best-real-user-monitoring-tools)

---

**Last Updated:** December 2025 **Target Audience:** Full-stack developers,
DevOps engineers, performance specialists **Difficulty Level:** Intermediate to
Advanced
