import type { Metadata } from "next";
import { BeUniqClient } from "./BeUniqClient";

export const metadata: Metadata = {
  title: "beUniq | spike.land",
  description:
    "Answer yes/no questions until your combination is one nobody else has chosen. A game powered by AVL profile trees.",
};

export default function BeUniqPage() {
  return <BeUniqClient />;
}
