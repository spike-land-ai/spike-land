import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Community Guidelines | spike.land",
  description:
    "Join the spike.land community. Guidelines for contributing, getting support, and engaging with fellow developers building with AI and MCP tools.",
  openGraph: {
    title: "Community Guidelines | spike.land",
    description:
      "Join the spike.land community. Guidelines for contributing, getting support, and building with AI.",
    type: "website",
    url: "https://spike.land/community",
  },
  twitter: {
    card: "summary_large_image",
    title: "Community Guidelines | spike.land",
    description:
      "Join the spike.land community. Guidelines for contributing, getting support, and building with AI.",
  },
};

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
