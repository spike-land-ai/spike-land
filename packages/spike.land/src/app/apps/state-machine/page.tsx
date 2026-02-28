import type { Metadata } from "next";
import { StateMachineApp } from "./StateMachineClient";

export const metadata: Metadata = {
  title: "State Machine Studio | spike.land",
  description:
    "Create, visualize, and simulate hierarchical state machines with AI assistance, templates, and live simulation.",
};

export default function StateMachinePage() {
  return <StateMachineApp />;
}
