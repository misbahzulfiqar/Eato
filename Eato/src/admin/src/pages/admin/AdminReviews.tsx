import { useCallback, useEffect, useState } from 'react';
import { admin as adminApi } from '../../api';

type Populated = { _id?: string; name?: string; restaurantName?: string; imageUrl?: string; status?: string };
type ReviewDoc = {
  _id: string;
  rating: number;
  comment?: string;
  createdAt?: string;
  customerId?: Populated;
  restaurantId?: Populated;
  menuItemId?: Populated | null;
  orderId?: Populated | string;
};

function idStr(v: unknown): string {
  if (!v) return '';
  if (typeof v === 'object' && v !== null && '_id' in v) return String((v as { _id: string })._id);
  return String(v);
}

function pickReviewImageUrl(rev: ReviewDoc): string {
  const dish = rev.menuItemId;
  if (dish && typeof dish === 'object' && dish.imageUrl) return String(dish.imageUrl);
  const rest = rev.restaurantId;
  if (rest && typeof rest === 'object' && rest.imageUrl) return String(rest.imageUrl);
  return '';
}

function ReviewPreviewThumb({ url }: { url: string }) {
  const [failed, setFailed] = useState(false);
  const frame =
    'flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-white bg-stone-100 p-1 shadow-md ring-2 ring-amber-100/80 overflow-hidden';
  if (!url || failed) {
    return (
      <div className={`${frame} border-dashed border-stone-300 ring-stone-200`} title="No image">
        <span className="text-sm font-medium text-stone-400">—</span>
      </div>
    );
  }
  return (
    <div className={frame}>
      <img
        src={url}
        alt=""
        className="max-h-full max-w-full object-contain object-center"
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

function clampRating(n: number): number {
  const r = Math.round(Number(n) || 0);
  return Math.min(5, Math.max(1, r || 1));
}

function ratingCardClasses(rating: number): string {
  const r = clampRating(rating);
  const accents: Record<number, string> = {
    5: 'border-l-emerald-500 from-emerald-50/90 via-white to-white',
    4: 'border-l-teal-500 from-teal-50/85 via-white to-white',
    3: 'border-l-amber-400 from-amber-50/80 via-white to-white',
    2: 'border-l-orange-400 from-orange-50/80 via-white to-white',
    1: 'border-l-rose-500 from-rose-50/85 via-white to-white',
  };
  return `rounded-2xl border border-stone-200/90 border-l-[5px] bg-gradient-to-br ${accents[r]} p-5 shadow-sm`;
}

function StarDisplay({ value }: { value: number }) {
  const v = clampRating(value);
  return (
    <div className="flex flex-wrap items-center gap-x-1 gap-y-1">
      <div className="flex items-center gap-0.5" role="img" aria-label={`${v} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((i) => {
          const filled = i <= v;
          return (
            <svg
              key={i}
              viewBox="0 0 24 24"
              className={`h-6 w-6 transition-transform ${filled ? 'scale-100 text-amber-400 drop-shadow-[0_2px_8px_rgba(251,191,36,0.45)]' : 'scale-95 text-stone-200'}`}
              aria-hidden
            >
              <path
                fill="currentColor"
                d="M12 3.2l2.35 4.76 5.26.77-3.8 3.7.9 5.24L12 15.9 7.29 17.67l.9-5.24-3.8-3.7 5.26-.77L12 3.2z"
              />
            </svg>
          );
        })}
      </div>
      <span className="ml-1 rounded-full bg-amber-100/90 px-2.5 py-0.5 text-xs font-bold tabular-nums text-amber-900 ring-1 ring-amber-300/50">
        {v}.0
      </span>
    </div>
  );
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState<ReviewDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const list = await adminApi.reviews();
      setReviews(Array.isArray(list) ? (list as ReviewDoc[]) : []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const remove = async (id: string) => {
    if (!confirm('Remove this review permanently?')) return;
    setError('');
    try {
      await adminApi.deleteReview(id);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed');
    }
  };

  if (loading) return <p className="text-stone-600">Loading…</p>;

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-stone-900">Reviews</h1>
      <p className="mb-6 text-sm text-stone-600">Moderate customer feedback; remove spam or policy violations.</p>
      {error ? <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p> : null}

      <div className="space-y-5">
        {reviews.map((rev) => {
          const rid = idStr(rev._id);
          const cust = rev.customerId;
          const rest = rev.restaurantId;
          const dish = rev.menuItemId;
          const ord = rev.orderId;
          const orderTail = ord ? idStr(ord).slice(-6) : '—';

          return (
            <article key={rid} className={ratingCardClasses(rev.rating)}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex min-w-0 flex-1 gap-4">
                  <div className="flex shrink-0 justify-center pt-0.5 lg:justify-start">
                    <ReviewPreviewThumb url={pickReviewImageUrl(rev)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <StarDisplay value={rev.rating} />
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center rounded-full bg-violet-600/10 px-3 py-1 text-xs font-semibold text-violet-900 ring-1 ring-violet-400/25">
                        {cust?.name || 'Customer'}
                      </span>
                      <span className="text-stone-400">·</span>
                      <span className="inline-flex items-center rounded-full bg-stone-900/5 px-3 py-1 text-xs font-semibold text-stone-800 ring-1 ring-stone-300/40">
                        {rest?.restaurantName || 'Restaurant'}
                      </span>
                      {dish && typeof dish === 'object' && dish.name ? (
                        <>
                          <span className="text-stone-400">·</span>
                          <span className="inline-flex items-center rounded-full bg-sky-600/10 px-3 py-1 text-xs font-semibold text-sky-900 ring-1 ring-sky-400/25">
                            {dish.name}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-stone-400">·</span>
                          <span className="inline-flex items-center rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600 ring-1 ring-stone-200">
                            Restaurant review
                          </span>
                        </>
                      )}
                    </div>
                    <div className="mt-3 rounded-xl border border-stone-100 bg-white/70 px-4 py-3 text-sm leading-relaxed text-stone-800 shadow-inner backdrop-blur-[2px]">
                      {rev.comment ? (
                        <p className="whitespace-pre-wrap">&ldquo;{rev.comment}&rdquo;</p>
                      ) : (
                        <p className="italic text-stone-400">No written comment</p>
                      )}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500">
                      <span>
                        Order <span className="font-mono font-semibold text-stone-700">#{orderTail}</span>
                      </span>
                      {ord && typeof ord === 'object' && ord.status ? (
                        <>
                          <span className="text-stone-300">|</span>
                          <span className="capitalize">Order status: {ord.status}</span>
                        </>
                      ) : null}
                      <span className="text-stone-300">|</span>
                      <time dateTime={rev.createdAt ? new Date(rev.createdAt).toISOString() : undefined}>
                        {rev.createdAt ? new Date(rev.createdAt).toLocaleString() : ''}
                      </time>
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 justify-end border-t border-stone-200/60 pt-3 lg:border-t-0 lg:border-l lg:border-stone-200/60 lg:pl-5 lg:pt-0">
                  <button
                    type="button"
                    onClick={() => remove(rid)}
                    className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold uppercase tracking-wide text-red-800 transition hover:bg-red-100 hover:ring-2 hover:ring-red-200/80"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      {!reviews.length ? <p className="mt-8 text-center text-stone-500">No reviews yet.</p> : null}
    </div>
  );
}
