"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback } from "react";

export function useAuthRedirect() {
  const pathname = usePathname();
  const router = useRouter();

  const redirectToSignIn = useCallback(() => {
    const callbackUrl = encodeURIComponent(pathname);
    router.push(`/auth/signin?callbackUrl=${callbackUrl}`);
  }, [pathname, router]);

  return { redirectToSignIn };
}
