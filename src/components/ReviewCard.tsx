import { Store, ThumbsUp } from 'lucide-react'
import clsx from 'clsx'
import type { Review } from '../data/types'
import { useStore } from '../store/StoreContext'
import Avatar from './Avatar'
import Stars from './Stars'
import LevelBadge from './LevelBadge'
import SmartImage from './SmartImage'

function SubScore({ label, value }: { label: string; value?: number }) {
  if (value == null) return null
  return (
    <span className="text-xs text-stone-500">
      {label} <span className="font-semibold text-stone-700">{value.toFixed(1)}</span>
    </span>
  )
}

export default function ReviewCard({ review: r }: { review: Review }) {
  const { isReviewLiked, toggleReviewLike, responseFor } = useStore()
  const response = responseFor(r.id)
  const liked = isReviewLiked(r.id)
  const likeCount = r.likes + (liked ? 1 : 0)

  return (
    <article className="border-b border-stone-100 py-5 last:border-0">
      <div className="flex items-center gap-3">
        <Avatar name={r.authorName} src={r.authorAvatar} size={44} />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-stone-900">{r.authorName}</span>
            <LevelBadge level={r.authorLevel} />
          </div>
          <div className="flex items-center gap-2 text-xs text-stone-400">
            <span>{r.date}</span>
            {r.visitType && (
              <>
                <span>·</span>
                <span>{r.visitType}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <Stars value={r.rating} size={16} />
        <span className="text-sm font-semibold text-stone-800">{r.rating.toFixed(1)}</span>
      </div>

      {r.title && <h4 className="mt-2 font-semibold text-stone-900">{r.title}</h4>}
      <p className="mt-1 text-[15px] leading-relaxed text-stone-700">{r.body}</p>

      {r.photos.length > 0 && (
        <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
          {r.photos.map((p, i) => (
            <SmartImage
              key={i}
              src={p}
              seedFallback={`${r.id}-${i}`}
              className="h-28 w-28 shrink-0 rounded-xl object-cover sm:h-32 sm:w-32"
            />
          ))}
        </div>
      )}

      {(r.food != null || r.service != null) && (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
          <SubScore label="Food" value={r.food} />
          <SubScore label="Service" value={r.service} />
          <SubScore label="Ambience" value={r.ambience} />
          <SubScore label="Value" value={r.value} />
        </div>
      )}

      <div className="mt-3">
        <button
          type="button"
          onClick={() => toggleReviewLike(r.id)}
          className={clsx(
            'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition',
            liked
              ? 'border-brand-200 bg-brand-50 text-brand-600'
              : 'border-stone-200 text-stone-600 hover:bg-stone-50',
          )}
        >
          <ThumbsUp size={14} fill={liked ? 'currentColor' : 'none'} />
          Helpful{likeCount > 0 ? ` · ${likeCount}` : ''}
        </button>
      </div>

      {response && (
        <div className="mt-3 rounded-xl border border-stone-200 bg-stone-50 p-3.5">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-stone-700">
            <Store size={13} className="text-brand-500" /> Response from the owner
            <span className="font-normal text-stone-400">· {response.date}</span>
          </p>
          <p className="mt-1 text-sm leading-relaxed text-stone-600">{response.text}</p>
        </div>
      )}
    </article>
  )
}
