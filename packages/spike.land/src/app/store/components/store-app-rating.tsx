import { Star } from "lucide-react";

interface RatingBreakdown {
  5: number;
  4: number;
  3: number;
  2: number;
  1: number;
}

interface StoreAppRatingProps {
  rating: number;
  ratingCount: number;
  showBreakdown?: boolean;
  breakdown?: RatingBreakdown;
}

export function StoreAppRating(
  { rating, ratingCount, showBreakdown, breakdown }: StoreAppRatingProps,
) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.5;

  return (
    <div
      className="flex flex-col gap-2"
      aria-label={`${rating.toFixed(1)} out of 5 stars, ${ratingCount.toLocaleString()} ratings`}
    >
      <div className="flex items-center gap-3">
        <span className="text-4xl font-bold text-white">
          {rating.toFixed(1)}
        </span>
        <div className="flex flex-col gap-1">
          <div className="flex">
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                className={`h-5 w-5 ${
                  i < fullStars
                    ? "fill-amber-400 text-amber-400"
                    : i === fullStars && hasHalf
                    ? "fill-amber-400/50 text-amber-400"
                    : "text-zinc-600"
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-zinc-400">
            {ratingCount.toLocaleString()} ratings
          </span>
        </div>
      </div>
      {showBreakdown && breakdown && (
        <div className="flex flex-col gap-1 w-full max-w-xs">
          {([5, 4, 3, 2, 1] as const).map(star => {
            const pct = ratingCount > 0
              ? Math.round((breakdown[star] / ratingCount) * 100)
              : 0;
            return (
              <div
                key={star}
                className="flex items-center gap-2 text-xs text-zinc-400"
              >
                <span className="w-2">{star}</span>
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                <div className="flex-1 h-1.5 rounded-full bg-zinc-700 overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-8 text-right">{pct}%</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
