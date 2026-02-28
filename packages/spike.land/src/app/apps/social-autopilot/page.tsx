import type { Metadata } from "next";
import { SocialAutopilotClient } from "./SocialAutopilotClient";

export const metadata: Metadata = {
  title: "Social Autopilot | spike.land",
  description: "Automated social media scheduling & engagement analytics.",
};

export default function SocialAutopilotPage() {
  return <SocialAutopilotClient />;
}
