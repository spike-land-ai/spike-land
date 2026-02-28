"use client";

import { GalleryFilters } from "@/components/gallery/GalleryFilters";
import { GalleryGrid } from "@/components/gallery/GalleryGrid";
import type { PublicImage } from "@/components/gallery/types";
import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

interface ApiResponse {
  items: PublicImage[];
  pagination: {
    page: number;
    totalPages: number;
  };
}

export function GalleryClient() {
  const [images, setImages] = useState<PublicImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [activeTags, setActiveTags] = useState<string[]>([]);

  // Derived from loaded images for now
  // Memoized to prevent O(N) calculation on every render (e.g. loading state changes)
  const allTags = useMemo(() => {
    return Array.from(new Set(images.flatMap(img => img.tags))).slice(0, 20);
  }, [images]);

  // Memoized to prevent array creation on every render
  const visibleTags = useMemo(() => {
    return allTags.concat(activeTags.filter(t => !allTags.includes(t)));
  }, [allTags, activeTags]);

  const fetchImages = useCallback(
    async (pageNum: number, tags: string[] = []) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", pageNum.toString());
        if (tags.length) params.set("tags", tags.join(","));

        const res = await fetch(`/api/gallery/public?${params.toString()}`);
        const data: ApiResponse = await res.json();

        if (pageNum === 1) {
          setImages(data.items);
        } else {
          setImages(prev => [...prev, ...data.items]);
        }

        setHasMore(pageNum < data.pagination.totalPages);
      } catch (err) {
        logger.error("Failed to fetch gallery images", err);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchImages(1, activeTags);
    setPage(1);
  }, [activeTags, fetchImages]); // Re-fetch when filter changes

  const loadMore = useCallback(() => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchImages(nextPage, activeTags);
  }, [page, activeTags, fetchImages]);

  const toggleTag = useCallback((tag: string) => {
    setActiveTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  }, []);

  const handleClear = useCallback(() => setActiveTags([]), []);

  return (
    <div className="space-y-8">
      {/* Filters only show if we have some data or existing filters */}
      {(allTags.length > 0 || activeTags.length > 0) && (
        <GalleryFilters
          tags={visibleTags} // Ensure active tags are visible
          activeTags={activeTags}
          onToggleTag={toggleTag}
          onClear={handleClear}
        />
      )}

      <GalleryGrid images={images} />

      {loading && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && hasMore && images.length > 0 && (
        <div className="flex justify-center py-8">
          <Button onClick={loadMore} variant="secondary" size="lg">
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}
