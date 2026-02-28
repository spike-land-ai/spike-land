import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — Free to Start, Built to Scale | spike.land",
  description:
    "Deploy apps, use MCP developer tools, and build with the platform — all free. Paid plans coming soon for teams that need more.",
  openGraph: {
    title: "Pricing — Free to Start, Built to Scale | spike.land",
    description:
      "Deploy apps, use MCP developer tools, and build with the platform — all free. Paid plans coming soon for teams.",
    type: "website",
    url: "https://spike.land/pricing",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pricing — Free to Start, Built to Scale | spike.land",
    description:
      "Deploy apps, use MCP developer tools, and build with the platform — all free. Paid plans coming soon for teams.",
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
