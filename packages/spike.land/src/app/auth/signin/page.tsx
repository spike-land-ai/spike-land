import { redirect } from "next/navigation";

/**
 * Legacy sign-in page — redirects to home with auth dialog trigger.
 * Preserves backward compatibility for bookmarks and external links.
 */
export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const callbackUrl = typeof params.callbackUrl === "string" ? params.callbackUrl : undefined;
  const target = callbackUrl
    ? `/?auth=required&callbackUrl=${encodeURIComponent(callbackUrl)}`
    : "/?auth=required";
  redirect(target);
}
