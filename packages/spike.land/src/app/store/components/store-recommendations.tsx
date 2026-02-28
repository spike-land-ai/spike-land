"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { StoreApp } from "@/app/store/data/types";
import { getStoreIcon } from "@/app/store/components/store-icon-map";

interface StoreRecommendationsProps {
  appSlug: string;
}

export function StoreRecommendations({ appSlug }: StoreRecommendationsProps) {
  const [recs, setRecs] = useState<StoreApp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(
      `/api/store/recommendations?appSlug=${encodeURIComponent(appSlug)}&limit=4`,
    )
      .then(r => r.json())
      .then(({ recommendations }: { recommendations: StoreApp[]; }) => setRecs(recommendations))
      .finally(() => setLoading(false));
  }, [appSlug]);

  if (loading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-2">
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className="animate-pulse rounded-xl bg-white/5 h-24 w-40 flex-shrink-0"
          />
        ))}
      </div>
    );
  }

  if (recs.length === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="mb-4 text-xl font-semibold text-white">
        You Might Also Like
      </h2>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {recs.map(app => {
          const IconComponent = getStoreIcon(app.icon);
          return (
            <Link
              key={app.id}
              href={`/store/${app.slug}`}
              className="flex-shrink-0 w-44 rounded-xl bg-white/5 p-4 hover:bg-white/10 transition-colors flex flex-col gap-2"
            >
              <IconComponent className="h-6 w-6 text-blue-400" />
              <div>
                <p className="text-sm font-medium text-white line-clamp-1">
                  {app.name}
                </p>
                <p className="text-xs text-zinc-400 line-clamp-2">
                  {app.tagline}
                </p>
              </div>
              {app.rating !== undefined && (
                <p className="text-xs text-amber-400">
                  &#9733; {app.rating.toFixed(1)}
                </p>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
