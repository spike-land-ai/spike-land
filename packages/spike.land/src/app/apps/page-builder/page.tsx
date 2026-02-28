import type { Metadata } from "next";
import { PageBuilderClient } from "./PageBuilderClient";

export const metadata: Metadata = {
  title: "Page Builder | spike.land",
  description: "AI-powered dynamic page creation and visual editor.",
};

export default function PageBuilderPage() {
  return <PageBuilderClient />;
}
