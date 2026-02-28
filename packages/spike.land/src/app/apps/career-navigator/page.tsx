import type { Metadata } from "next";
import { CareerNavigatorClient } from "./CareerNavigatorClient";

export const metadata: Metadata = {
  title: "Career Navigator | spike.land",
  description: "AI-powered career path planning, skill gap analysis & job matching.",
};

export default function CareerNavigatorPage() {
  return <CareerNavigatorClient />;
}
