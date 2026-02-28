"use client";

import { useEffect, useState } from "react";
import { Star, User } from "lucide-react";

interface Review {
  id: string;
  userId: string;
  rating: number;
  body: string;
  createdAt: string;
}

interface StoreReviewsSectionProps {
  appSlug: string;
}

export function StoreReviewsSection({ appSlug }: StoreReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newBody, setNewBody] = useState("");

  useEffect(() => {
    fetch(`/api/store/apps/${appSlug}/reviews`)
      .then(r => r.json())
      .then(
        ({ reviews: r, total: t }: { reviews: Review[]; total: number; }) => {
          setReviews(r);
          setTotal(t);
        },
      )
      .finally(() => setLoading(false));
  }, [appSlug]);

  async function submitReview() {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/store/apps/${appSlug}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: newRating, body: newBody }),
      });
      if (res.ok) {
        const { review } = await res.json() as { review: Review; };
        setReviews(prev => [review, ...prev]);
        setTotal(t => t + 1);
        setShowModal(false);
        setNewBody("");
        setNewRating(5);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className="animate-pulse rounded-xl bg-white/5 p-4 h-24"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Reviews ({total})</h3>
        <button
          onClick={() => setShowModal(true)}
          className="rounded-lg bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/20 transition-colors"
        >
          Write a Review
        </button>
      </div>

      {reviews.length === 0
        ? <p className="text-zinc-400 text-sm">No reviews yet. Be the first!</p>
        : (
          <div className="flex flex-col gap-3">
            {reviews.map(review => (
              <div
                key={review.id}
                className="rounded-xl bg-white/5 p-4 flex flex-col gap-2"
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                    <User className="h-4 w-4 text-zinc-400" />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          className={`h-3.5 w-3.5 ${
                            i < review.rating
                              ? "fill-amber-400 text-amber-400"
                              : "text-zinc-600"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-zinc-500">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-zinc-300">{review.body}</p>
              </div>
            ))}
          </div>
        )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-zinc-900 p-6 flex flex-col gap-4">
            <h3 className="text-lg font-semibold text-white">Write a Review</h3>
            <div className="flex gap-1">
              {Array.from(
                { length: 5 },
                (_, i) => (
                  <button
                    key={i}
                    onClick={() => setNewRating(i + 1)}
                  >
                    <Star
                      className={`h-6 w-6 ${
                        i < newRating
                          ? "fill-amber-400 text-amber-400"
                          : "text-zinc-600"
                      }`}
                    />
                  </button>
                ),
              )}
            </div>
            <textarea
              value={newBody}
              onChange={e => setNewBody(e.target.value)}
              placeholder="Share your experience (min 10 characters)..."
              className="w-full rounded-lg bg-white/5 p-3 text-sm text-white placeholder-zinc-500 resize-none h-32 outline-none border border-white/10 focus:border-white/20"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg px-4 py-2 text-sm text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={submitReview}
                disabled={submitting || newBody.length < 10}
                className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
