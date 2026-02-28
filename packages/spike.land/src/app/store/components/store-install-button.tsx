"use client";

import { useEffect, useState } from "react";
import { Check, Download } from "lucide-react";
import { useSession } from "@/lib/auth/client/hooks";
import { useRouter } from "next/navigation";

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

interface StoreInstallButtonProps {
  appSlug: string;
  initialCount?: number;
}

export function StoreInstallButton({
  appSlug,
  initialCount = 0,
}: StoreInstallButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [installed, setInstalled] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/store/apps/${appSlug}/install`)
      .then(r => r.json())
      .then(
        ({ count: c, installed: i }: { count: number; installed: boolean; }) => {
          setCount(c || initialCount);
          setInstalled(i);
        },
      )
      .catch(() => {
        // Silently fail — keep initial values
      });
  }, [appSlug, initialCount]);

  async function handleInstall() {
    if (!session) {
      router.push("/api/auth/signin");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/store/apps/${appSlug}/install`, {
        method: "POST",
      });
      if (res.ok) {
        const { count: c } = (await res.json()) as { count: number; };
        setInstalled(true);
        setCount(c);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleInstall}
        disabled={loading || installed}
        className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold transition-all ${
          installed
            ? "bg-emerald-500/20 text-emerald-300 cursor-default"
            : "bg-white text-black hover:bg-white/90"
        }`}
      >
        {installed
          ? (
            <>
              <Check className="h-4 w-4" />
              Installed
            </>
          )
          : loading
          ? (
            "Installing..."
          )
          : (
            "Get"
          )}
      </button>
      {count > 0 && (
        <span className="flex items-center gap-1 text-sm text-zinc-400">
          <Download className="h-3.5 w-3.5" />
          {formatCount(count)}
        </span>
      )}
    </div>
  );
}
