/**
 * Built-in demo repositories for the /migrate/live page.
 *
 * Each demo showcases a realistic Next.js codebase that exercises
 * different patterns the transform engine handles.
 */

interface DemoFile {
  path: string;
  content: string;
}

interface DemoRepo {
  name: string;
  description: string;
  files: DemoFile[];
}

export const DEMO_REPOS: Record<string, DemoRepo> = {
  "hello-world": {
    name: "Hello World",
    description:
      "Simple Next.js Pages Router app with static/dynamic pages, API routes, and custom _app.",
    files: [
      {
        path: "pages/index.tsx",
        content: `import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import type { InferGetStaticPropsType, GetStaticProps } from "next";
import styles from "../styles/Home.module.css";

interface HomeProps {
  greeting: string;
  buildTime: string;
}

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  return {
    props: {
      greeting: "Welcome to Next.js!",
      buildTime: new Date().toISOString(),
    },
  };
};

export default function Home({
  greeting,
  buildTime,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <>
      <Head>
        <title>Hello World App</title>
        <meta name="description" content="A simple Next.js starter" />
      </Head>
      <main className={styles.main}>
        <Image src="/logo.png" alt="Logo" width={120} height={40} priority />
        <h1>{greeting}</h1>
        <p>Built at {buildTime}</p>
        <nav>
          <Link href="/about">About</Link>
          <Link href="/posts/1">First Post</Link>
        </nav>
      </main>
    </>
  );
}`,
      },
      {
        path: "pages/about.tsx",
        content: `import Head from "next/head";
import Link from "next/link";
import styles from "../styles/About.module.css";

const team = [
  { name: "Alice Chen", role: "Engineering Lead" },
  { name: "Bob Martinez", role: "Designer" },
  { name: "Carol Okonkwo", role: "Product Manager" },
];

export default function About() {
  return (
    <>
      <Head>
        <title>About Us</title>
      </Head>
      <div className={styles.container}>
        <h1>About Us</h1>
        <p>We build tools for the modern web.</p>
        <ul>
          {team.map((member) => (
            <li key={member.name}>
              <strong>{member.name}</strong> — {member.role}
            </li>
          ))}
        </ul>
        <Link href="/">Back home</Link>
      </div>
    </>
  );
}`,
      },
      {
        path: "pages/posts/[id].tsx",
        content: `import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";

interface Post {
  id: number;
  title: string;
  body: string;
  userId: number;
}

export const getServerSideProps: GetServerSideProps<{ post: Post }> = async (
  context
) => {
  const { id } = context.params as { id: string };
  const res = await fetch(
    \`https://jsonplaceholder.typicode.com/posts/\${id}\`
  );

  if (!res.ok) {
    return { notFound: true };
  }

  const post: Post = await res.json();
  return { props: { post } };
};

export default function PostPage({
  post,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>{post.title}</title>
      </Head>
      <article>
        <h1>{post.title}</h1>
        <p>{post.body}</p>
        <footer>
          <button type="button" onClick={() => router.back()}>
            Go back
          </button>
          <Link href="/">Home</Link>
        </footer>
      </article>
    </>
  );
}`,
      },
      {
        path: "pages/api/hello.ts",
        content: `import type { NextApiRequest, NextApiResponse } from "next";

interface HelloResponse {
  message: string;
  timestamp: string;
}

interface ErrorResponse {
  error: string;
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<HelloResponse | ErrorResponse>
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const name = typeof req.query.name === "string" ? req.query.name : "World";

  res.status(200).json({
    message: \`Hello, \${name}!\`,
    timestamp: new Date().toISOString(),
  });
}`,
      },
      {
        path: "pages/_app.tsx",
        content: `import type { AppProps } from "next/app";
import "../styles/globals.css";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <div className="app-wrapper">
      <header>
        <nav>
          <span className="logo">HelloApp</span>
        </nav>
      </header>
      <Component {...pageProps} />
      <footer>
        <p>&copy; {new Date().getFullYear()} HelloApp</p>
      </footer>
    </div>
  );
}

export default MyApp;`,
      },
      {
        path: "next.config.js",
        content: `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["images.unsplash.com"],
  },
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: "/api/:path*",
      },
    ];
  },
  env: {
    NEXT_PUBLIC_APP_NAME: "HelloApp",
  },
};

module.exports = nextConfig;`,
      },
      {
        path: "package.json",
        content: `{
  "name": "hello-world",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "14.2.3",
    "react": "18.3.1",
    "react-dom": "18.3.1"
  },
  "devDependencies": {
    "@types/node": "20.14.2",
    "@types/react": "18.3.3",
    "@types/react-dom": "18.3.0",
    "typescript": "5.4.5"
  }
}`,
      },
    ],
  },

  dashboard: {
    name: "Dashboard",
    description:
      "Next.js App Router dashboard with nested layouts, server components, route handlers, and middleware.",
    files: [
      {
        path: "app/layout.tsx",
        content: `import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Admin Dashboard",
    template: "%s | Dashboard",
  },
  description: "Internal team dashboard for analytics and settings.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="root-container">{children}</div>
      </body>
    </html>
  );
}`,
      },
      {
        path: "app/page.tsx",
        content: `import Link from "next/link";
import styles from "./page.module.css";

interface Metric {
  label: string;
  value: number;
  unit: string;
}

async function fetchMetrics(): Promise<Metric[]> {
  return [
    { label: "Active Users", value: 1_284, unit: "" },
    { label: "Revenue", value: 48_320, unit: "$" },
    { label: "Uptime", value: 99.97, unit: "%" },
    { label: "Avg Latency", value: 42, unit: "ms" },
  ];
}

export default async function HomePage() {
  const metrics = await fetchMetrics();

  return (
    <main className={styles.home}>
      <h1>Welcome back</h1>
      <div className={styles.grid}>
        {metrics.map((m) => (
          <div key={m.label} className={styles.card}>
            <span className={styles.label}>{m.label}</span>
            <span className={styles.value}>
              {m.unit}
              {m.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
      <Link href="/dashboard">Go to Dashboard</Link>
    </main>
  );
}`,
      },
      {
        path: "app/dashboard/layout.tsx",
        content: `import Link from "next/link";
import styles from "./layout.module.css";

const navItems = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/settings", label: "Settings" },
] as const;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.wrapper}>
      <aside className={styles.sidebar}>
        <h2>Dashboard</h2>
        <nav>
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className={styles.navLink}>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <section className={styles.content}>{children}</section>
    </div>
  );
}`,
      },
      {
        path: "app/dashboard/page.tsx",
        content: `import styles from "./page.module.css";

interface Activity {
  id: string;
  user: string;
  action: string;
  timestamp: string;
}

async function getRecentActivity(): Promise<Activity[]> {
  return [
    { id: "1", user: "alice@co.com", action: "Deployed v2.4.1", timestamp: "2 min ago" },
    { id: "2", user: "bob@co.com", action: "Updated billing plan", timestamp: "18 min ago" },
    { id: "3", user: "carol@co.com", action: "Added team member", timestamp: "1 hr ago" },
    { id: "4", user: "dave@co.com", action: "Rotated API keys", timestamp: "3 hr ago" },
  ];
}

export default async function DashboardPage() {
  const activity = await getRecentActivity();

  return (
    <div className={styles.dashboard}>
      <h1>Overview</h1>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>User</th>
            <th>Action</th>
            <th>When</th>
          </tr>
        </thead>
        <tbody>
          {activity.map((row) => (
            <tr key={row.id}>
              <td>{row.user}</td>
              <td>{row.action}</td>
              <td>{row.timestamp}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}`,
      },
      {
        path: "app/dashboard/settings/page.tsx",
        content: `"use client";

import { useState, useCallback } from "react";
import styles from "./page.module.css";

interface Settings {
  notifications: boolean;
  theme: "light" | "dark" | "system";
  timezone: string;
}

const timezones = ["UTC", "America/New_York", "Europe/London", "Asia/Tokyo"];

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    notifications: true,
    theme: "system",
    timezone: "UTC",
  });
  const [saved, setSaved] = useState(false);

  const handleSave = useCallback(() => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, []);

  return (
    <div className={styles.settings}>
      <h1>Settings</h1>
      <label>
        <input
          type="checkbox"
          checked={settings.notifications}
          onChange={(e) =>
            setSettings((s) => ({ ...s, notifications: e.target.checked }))
          }
        />
        Enable notifications
      </label>
      <label>
        Theme
        <select
          value={settings.theme}
          onChange={(e) =>
            setSettings((s) => ({
              ...s,
              theme: e.target.value as Settings["theme"],
            }))
          }
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="system">System</option>
        </select>
      </label>
      <label>
        Timezone
        <select
          value={settings.timezone}
          onChange={(e) =>
            setSettings((s) => ({ ...s, timezone: e.target.value }))
          }
        >
          {timezones.map((tz) => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </select>
      </label>
      <button type="button" onClick={handleSave}>
        Save changes
      </button>
      {saved && <p className={styles.toast}>Settings saved!</p>}
    </div>
  );
}`,
      },
      {
        path: "app/api/data/route.ts",
        content: `import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

interface DataRecord {
  id: string;
  name: string;
  createdAt: string;
}

const store: DataRecord[] = [
  { id: "rec_1", name: "Alpha", createdAt: "2024-01-15T10:00:00Z" },
  { id: "rec_2", name: "Beta", createdAt: "2024-02-20T14:30:00Z" },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit") ?? "10");

  return NextResponse.json({
    data: store.slice(0, limit),
    total: store.length,
  });
}

export async function POST(request: NextRequest) {
  const body: { name?: string } = await request.json();

  if (!body.name || typeof body.name !== "string") {
    return NextResponse.json(
      { error: "name is required" },
      { status: 400 }
    );
  }

  const record: DataRecord = {
    id: \`rec_\${Date.now()}\`,
    name: body.name,
    createdAt: new Date().toISOString(),
  };

  store.push(record);

  return NextResponse.json({ data: record }, { status: 201 });
}`,
      },
      {
        path: "middleware.ts",
        content: `import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/", "/api/data"] as const;

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(\`\${p}/\`)
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const sessionToken = request.cookies.get("session_token")?.value;

  if (!sessionToken) {
    const loginUrl = new URL("/", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const headers = new Headers(request.headers);
  headers.set("x-user-session", sessionToken);

  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/dashboard/:path*"],
};`,
      },
      {
        path: "next.config.js",
        content: `/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.API_URL ?? "http://localhost:3000",
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

module.exports = nextConfig;`,
      },
      {
        path: "package.json",
        content: `{
  "name": "dashboard",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "14.2.3",
    "react": "18.3.1",
    "react-dom": "18.3.1"
  },
  "devDependencies": {
    "@types/node": "20.14.2",
    "@types/react": "18.3.3",
    "@types/react-dom": "18.3.0",
    "typescript": "5.4.5"
  }
}`,
      },
    ],
  },

  ecommerce: {
    name: "E-Commerce Store",
    description:
      "Mixed Pages/App Router e-commerce site with ISR, dynamic params, checkout API, geo middleware, and complex config.",
    files: [
      {
        path: "pages/index.tsx",
        content: `import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import type { InferGetStaticPropsType, GetStaticProps } from "next";
import styles from "../styles/Home.module.css";

interface FeaturedProduct {
  slug: string;
  name: string;
  price: number;
  image: string;
  category: string;
}

export const getStaticProps: GetStaticProps<{
  products: FeaturedProduct[];
}> = async () => {
  const products: FeaturedProduct[] = [
    { slug: "classic-tee", name: "Classic Tee", price: 29.99, image: "/products/tee.jpg", category: "apparel" },
    { slug: "leather-wallet", name: "Leather Wallet", price: 49.99, image: "/products/wallet.jpg", category: "accessories" },
    { slug: "running-shoes", name: "Running Shoes", price: 119.99, image: "/products/shoes.jpg", category: "footwear" },
  ];

  return {
    props: { products },
    revalidate: 60,
  };
};

export default function LandingPage({
  products,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <>
      <Head>
        <title>ShopNext — Modern E-Commerce</title>
        <meta name="description" content="Discover curated products" />
      </Head>
      <main className={styles.landing}>
        <section className={styles.hero}>
          <h1>New Season Arrivals</h1>
          <p>Curated picks refreshed every minute.</p>
        </section>
        <section className={styles.featured}>
          {products.map((p) => (
            <Link
              key={p.slug}
              href={\`/shop/\${p.category}/\${p.slug}\`}
              className={styles.productCard}
            >
              <Image src={p.image} alt={p.name} width={300} height={300} />
              <h3>{p.name}</h3>
              <span>\${p.price.toFixed(2)}</span>
            </Link>
          ))}
        </section>
      </main>
    </>
  );
}`,
      },
      {
        path: "app/shop/[category]/page.tsx",
        content: `import Link from "next/link";
import type { Metadata } from "next";
import styles from "./page.module.css";

interface Product {
  slug: string;
  name: string;
  price: number;
}

interface CategoryData {
  title: string;
  products: Product[];
}

const catalog: Record<string, CategoryData> = {
  apparel: {
    title: "Apparel",
    products: [
      { slug: "classic-tee", name: "Classic Tee", price: 29.99 },
      { slug: "hoodie", name: "Pullover Hoodie", price: 59.99 },
    ],
  },
  accessories: {
    title: "Accessories",
    products: [
      { slug: "leather-wallet", name: "Leather Wallet", price: 49.99 },
      { slug: "sunglasses", name: "Aviator Sunglasses", price: 89.99 },
    ],
  },
  footwear: {
    title: "Footwear",
    products: [
      { slug: "running-shoes", name: "Running Shoes", price: 119.99 },
      { slug: "sandals", name: "Comfort Sandals", price: 39.99 },
    ],
  },
};

export function generateMetadata({
  params,
}: {
  params: { category: string };
}): Metadata {
  const cat = catalog[params.category];
  return {
    title: cat?.title ?? "Category",
    description: \`Browse our \${cat?.title ?? "products"} collection.\`,
  };
}

export default function CategoryPage({
  params,
}: {
  params: { category: string };
}) {
  const data = catalog[params.category];

  if (!data) {
    return <p>Category not found.</p>;
  }

  return (
    <div className={styles.category}>
      <h1>{data.title}</h1>
      <ul>
        {data.products.map((p) => (
          <li key={p.slug}>
            <Link href={\`/shop/\${params.category}/\${p.slug}\`}>
              {p.name} — \${p.price.toFixed(2)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}`,
      },
      {
        path: "app/shop/[category]/[product]/page.tsx",
        content: `import Image from "next/image";
import type { Metadata } from "next";
import styles from "./page.module.css";

interface ProductDetail {
  slug: string;
  name: string;
  price: number;
  description: string;
  image: string;
}

const allProducts: Record<string, Record<string, ProductDetail>> = {
  apparel: {
    "classic-tee": {
      slug: "classic-tee",
      name: "Classic Tee",
      price: 29.99,
      description: "100% organic cotton crew-neck t-shirt.",
      image: "/products/tee.jpg",
    },
  },
  footwear: {
    "running-shoes": {
      slug: "running-shoes",
      name: "Running Shoes",
      price: 119.99,
      description: "Lightweight mesh upper with responsive foam sole.",
      image: "/products/shoes.jpg",
    },
  },
};

export function generateStaticParams() {
  const params: Array<{ category: string; product: string }> = [];
  for (const [category, products] of Object.entries(allProducts)) {
    for (const slug of Object.keys(products)) {
      params.push({ category, product: slug });
    }
  }
  return params;
}

export function generateMetadata({
  params,
}: {
  params: { category: string; product: string };
}): Metadata {
  const item = allProducts[params.category]?.[params.product];
  return {
    title: item?.name ?? "Product",
    description: item?.description ?? "Product details",
  };
}

export default function ProductPage({
  params,
}: {
  params: { category: string; product: string };
}) {
  const item = allProducts[params.category]?.[params.product];

  if (!item) {
    return <p>Product not found.</p>;
  }

  return (
    <div className={styles.product}>
      <Image src={item.image} alt={item.name} width={600} height={600} />
      <div className={styles.details}>
        <h1>{item.name}</h1>
        <p className={styles.price}>\${item.price.toFixed(2)}</p>
        <p>{item.description}</p>
        <button type="button" className={styles.addToCart}>
          Add to Cart
        </button>
      </div>
    </div>
  );
}`,
      },
      {
        path: "pages/api/checkout.ts",
        content: `import type { NextApiRequest, NextApiResponse } from "next";

interface CartItem {
  productId: string;
  quantity: number;
  price: number;
}

interface CheckoutRequest {
  items: CartItem[];
  currency: string;
}

interface CheckoutResponse {
  orderId: string;
  total: number;
  currency: string;
  status: "confirmed";
}

interface ErrorResponse {
  error: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CheckoutResponse | ErrorResponse>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const body = req.body as CheckoutRequest;

  if (!Array.isArray(body.items) || body.items.length === 0) {
    res.status(400).json({ error: "Cart must contain at least one item" });
    return;
  }

  const total = body.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const orderId = \`ord_\${Date.now().toString(36)}\`;

  res.status(200).json({
    orderId,
    total: Math.round(total * 100) / 100,
    currency: body.currency || "USD",
    status: "confirmed",
  });
}`,
      },
      {
        path: "middleware.ts",
        content: `import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const GEO_REDIRECTS: Record<string, string> = {
  DE: "/de",
  FR: "/fr",
  JP: "/jp",
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip geo redirect if user already on a locale prefix or API route
  const skipPrefixes = ["/de", "/fr", "/jp", "/api", "/_next"];
  if (skipPrefixes.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const country = request.geo?.country ?? "";
  const redirectPath = GEO_REDIRECTS[country];

  if (redirectPath && pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = redirectPath;
    return NextResponse.redirect(url);
  }

  // Add security headers to all responses
  const response = NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};`,
      },
      {
        path: "next.config.js",
        content: `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
        pathname: "/s/files/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  i18n: {
    locales: ["en", "de", "fr", "ja"],
    defaultLocale: "en",
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/shop/:path*",
          has: [{ type: "query", key: "ref", value: "(?<ref>.*)" }],
          destination: "/shop/:path*?utm_source=:ref",
        },
      ],
      afterFiles: [
        {
          source: "/legacy-products/:slug",
          destination: "/shop/apparel/:slug",
        },
      ],
    };
  },
  env: {
    NEXT_PUBLIC_STORE_NAME: "ShopNext",
    NEXT_PUBLIC_CURRENCY: "USD",
  },
};

module.exports = nextConfig;`,
      },
      {
        path: "package.json",
        content: `{
  "name": "ecommerce",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "14.2.3",
    "react": "18.3.1",
    "react-dom": "18.3.1"
  },
  "devDependencies": {
    "@types/node": "20.14.2",
    "@types/react": "18.3.3",
    "@types/react-dom": "18.3.0",
    "typescript": "5.4.5"
  }
}`,
      },
    ],
  },
};
