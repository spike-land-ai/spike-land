import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchGallery, type GalleryImage } from "@/api/client";

export function useGallery(opts: { search?: string; tag?: string } = {}) {
  const limit = 50;

  return useInfiniteQuery({
    queryKey: ["gallery", opts.search, opts.tag],
    queryFn: async ({ pageParam }) => {
      return fetchGallery({
        cursor: pageParam,
        limit,
        search: opts.search,
        tag: opts.tag,
      });
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    select: (data) => {
      const images: GalleryImage[] = data.pages.flatMap((p) => p.images);
      const album = data.pages[0]?.album ?? null;
      return { images, album };
    },
  });
}
