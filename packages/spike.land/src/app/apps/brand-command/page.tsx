import type { Metadata } from "next";
import { BrandCommandClient } from "./BrandCommandClient";

export const metadata: Metadata = {
  title: "Brand Command | spike.land",
  description: "Unified brand identity & creative asset management.",
};

export default function BrandCommandPage() {
  return <BrandCommandClient />;
}
