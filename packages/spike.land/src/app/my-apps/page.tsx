import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export const metadata = {
  title: "My Apps - Spike Land",
  description: "Manage your AI-powered apps",
};

export default async function MyAppsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/?auth=required&callbackUrl=/my-apps");
  }

  redirect("/create");
}
