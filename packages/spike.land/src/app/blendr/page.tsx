import { auth } from "@/lib/auth";
import { BlendrClient } from "./BlendrClient";

export default async function BlendrPage() {
  const session = await auth();

  // Allow anonymous access - pass isAnonymous flag to client
  return <BlendrClient isAnonymous={!session} />;
}
