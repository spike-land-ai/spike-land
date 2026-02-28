import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Services & Solutions | Spike Land",
  description:
    "AI-powered software development services including AI integration, rapid prototyping, full-stack development, and custom AI products. Transform your ideas into reality.",
  keywords: [
    "AI integration",
    "rapid prototyping",
    "MVP development",
    "full-stack development",
    "LLM agents",
    "RAG implementation",
    "AI products",
    "software development",
  ],
  openGraph: {
    title: "Services & Solutions | Spike Land",
    description:
      "AI-powered software development services including AI integration, rapid prototyping, full-stack development, and custom AI products.",
    type: "website",
  },
};

export default function ServicesLayout(
  { children }: { children: React.ReactNode; },
) {
  return children;
}
