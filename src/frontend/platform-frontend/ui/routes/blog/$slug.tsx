import { useParams, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BlogPostView } from "@spike-land-ai/block-website/ui";

const SITE_URL = "https://spike.land";

function injectJsonLd(id: string, content: string) {
  let el = document.getElementById(id) as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement("script");
    el.id = id;
    el.type = "application/ld+json";
    document.head.appendChild(el);
  }
  el.textContent = content;
}

export function BlogPostPage() {
  const { slug } = useParams({ strict: false });
  const [postTitle, setPostTitle] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/blog/${slug}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { title?: string } | null) => {
        if (data?.title) setPostTitle(data.title);
      })
      .catch(() => {});
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    const name = postTitle ?? slug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
    injectJsonLd(
      "jsonld-breadcrumbs",
      JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
          { "@type": "ListItem", position: 3, name, item: `${SITE_URL}/blog/${slug}` },
        ],
      }),
    );
  }, [slug, postTitle]);

  return <BlogPostView slug={slug as string} linkComponent={Link} />;
}
