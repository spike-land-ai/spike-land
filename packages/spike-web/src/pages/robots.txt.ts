import type { APIRoute } from "astro";

export const GET: APIRoute = () => {
  return new Response(
    `User-agent: *
Allow: /
Disallow: /dashboard
Disallow: /login
Disallow: /callback
Sitemap: https://spike.land/sitemap-index.xml
`,
    { headers: { "Content-Type": "text/plain" } },
  );
};
