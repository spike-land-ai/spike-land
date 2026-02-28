import type { Metadata } from "next";
import { ContentHubClient } from "./ContentHubClient";

export const metadata: Metadata = {
  title: "Content Hub | spike.land",
  description: "Blog publishing & newsletter management platform.",
};

export default function ContentHubPage() {
  return <ContentHubClient />;
}
