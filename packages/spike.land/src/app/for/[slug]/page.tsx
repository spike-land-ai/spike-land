import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getPersonaBySlug, PERSONAS } from "@/lib/onboarding/personas";
import { getLandingPageBySlug } from "@/lib/onboarding/landing-pages";

import { PersonaLanding } from "./PersonaLanding";

interface PageProps {
  params: Promise<{ slug: string; }>;
}

export function generateStaticParams() {
  return PERSONAS.map(p => ({ slug: p.slug }));
}

export async function generateMetadata(
  { params }: PageProps,
): Promise<Metadata> {
  const { slug } = await params;
  const persona = getPersonaBySlug(slug);
  const landing = getLandingPageBySlug(slug);

  if (!persona || !landing) {
    return { title: "Not Found" };
  }

  return {
    title: `${landing.headline} | SPIKE LAND`,
    description: landing.subheadline,
    openGraph: {
      title: `${landing.headline} | SPIKE LAND`,
      description: landing.subheadline,
      type: "website",
      siteName: "SPIKE LAND",
    },
    twitter: {
      card: "summary_large_image",
      title: `${landing.headline} | SPIKE LAND`,
      description: landing.subheadline,
    },
  };
}

export default async function ForPersonaPage({ params }: PageProps) {
  const { slug } = await params;
  const persona = getPersonaBySlug(slug);
  const landing = getLandingPageBySlug(slug);

  if (!persona || !landing) {
    notFound();
  }

  return <PersonaLanding persona={persona} landing={landing} />;
}
