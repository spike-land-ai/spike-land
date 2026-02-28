"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { useSession } from "@/lib/auth/client/hooks";
import { useRouter } from "next/navigation";

interface StoreWishlistButtonProps {
  appSlug: string;
}

export function StoreWishlistButton({ appSlug }: StoreWishlistButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [wishlisted, setWishlisted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session) return;
    fetch("/api/store/wishlist")
      .then(r => r.json())
      .then(({ slugs }: { slugs: string[]; }) => {
        setWishlisted(slugs.includes(appSlug));
      })
      .catch(() => {
        // Silently fail
      });
  }, [appSlug, session]);

  async function handleToggle() {
    if (!session) {
      router.push("/api/auth/signin");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/store/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appSlug }),
      });
      if (res.ok) {
        const { wishlisted: w } = (await res.json()) as {
          wishlisted: boolean;
        };
        setWishlisted(w);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
      className={`flex items-center justify-center rounded-xl p-2.5 transition-all ${
        wishlisted
          ? "bg-rose-500/20 text-rose-400 hover:bg-rose-500/30"
          : "bg-white/10 text-zinc-400 hover:bg-white/20 hover:text-white"
      }`}
    >
      <Heart className={`h-5 w-5 ${wishlisted ? "fill-rose-400" : ""}`} />
    </button>
  );
}
