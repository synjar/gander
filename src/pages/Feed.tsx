import { Link } from 'react-router-dom'
import { Heart, MapPin, MessageCircle, PenLine, Share2, TrendingUp } from 'lucide-react'
import clsx from 'clsx'
import { seedFeed } from '../data/feed'
import { businessesById } from '../data/businesses'
import { users, currentUser } from '../data/users'
import type { FeedPost } from '../data/types'
import { useStore } from '../store/StoreContext'
import Avatar from '../components/Avatar'
import Stars from '../components/Stars'
import SmartImage from '../components/SmartImage'
import LevelBadge from '../components/LevelBadge'

const actionText: Record<FeedPost['type'], string> = {
  review: 'reviewed',
  checkin: 'checked in at',
  photo: 'added photos of',
  list: 'shared a list featuring',
}

function PostCard({ post }: { post: FeedPost }) {
  const { isPostLiked, togglePostLike } = useStore()
  const liked = isPostLiked(post.id)
  const likes = post.likes + (liked ? 1 : 0)
  const biz = businessesById[post.businessId]

  return (
    <article className="rounded-2xl bg-white p-4 card-shadow ring-1 ring-stone-100 sm:p-5">
      <div className="flex items-center gap-3">
        <Avatar name={post.userName} src={post.userAvatar} size={44} />
        <div className="min-w-0">
          <p className="text-sm text-stone-600">
            <span className="font-semibold text-stone-900">{post.userName}</span>{' '}
            <LevelBadge level={post.userLevel} className="align-middle" />{' '}
            {actionText[post.type]}{' '}
            <Link
              to={biz ? `/b/${biz.slug}` : '#'}
              className="font-semibold text-brand-600 hover:underline"
            >
              {post.businessName}
            </Link>
          </p>
          <p className="flex items-center gap-1 text-xs text-stone-400">
            <MapPin size={11} /> {post.neighbourhood} · {post.time}
          </p>
        </div>
      </div>

      {post.rating != null && (
        <div className="mt-3">
          <Stars value={post.rating} size={16} />
        </div>
      )}

      <p className="mt-2.5 text-[15px] leading-relaxed text-stone-700">{post.text}</p>

      {post.photos.length > 0 && (
        <div
          className={clsx(
            'mt-3 grid gap-2 overflow-hidden rounded-xl',
            post.photos.length === 1 ? 'grid-cols-1' : 'grid-cols-2',
          )}
        >
          {post.photos.map((p, i) => (
            <SmartImage
              key={i}
              src={p}
              seedFallback={`${post.id}-${i}`}
              className={clsx(
                'w-full object-cover',
                post.photos.length === 1 ? 'aspect-[16/10]' : 'aspect-square',
              )}
            />
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center gap-1 border-t border-stone-100 pt-3 text-sm text-stone-500">
        <button
          onClick={() => togglePostLike(post.id)}
          className={clsx(
            'flex items-center gap-1.5 rounded-full px-3 py-1.5 font-medium transition hover:bg-stone-50',
            liked && 'text-rose-500',
          )}
        >
          <Heart size={17} fill={liked ? 'currentColor' : 'none'} />
          {likes}
        </button>
        <button className="flex items-center gap-1.5 rounded-full px-3 py-1.5 font-medium transition hover:bg-stone-50">
          <MessageCircle size={17} /> {post.comments}
        </button>
        <button className="ml-auto flex items-center gap-1.5 rounded-full px-3 py-1.5 font-medium transition hover:bg-stone-50">
          <Share2 size={16} /> Share
        </button>
      </div>
    </article>
  )
}

function Composer() {
  return (
    <Link
      to="/search"
      className="flex items-center gap-3 rounded-2xl bg-white p-4 card-shadow ring-1 ring-stone-100"
    >
      <Avatar name={currentUser.name} src={currentUser.avatar} size={40} />
      <span className="flex-1 rounded-full bg-stone-100 px-4 py-2.5 text-sm text-stone-400">
        Share a place you love…
      </span>
      <span className="hidden items-center gap-1.5 rounded-full bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white sm:flex">
        <PenLine size={15} /> Post
      </span>
    </Link>
  )
}

export default function Feed() {
  const leaderboard = [...users]
    .filter((u) => u.id !== 'me')
    .sort((a, b) => b.points - a.points)
    .slice(0, 5)

  const tags = ['#SundayRoast', '#BottomlessBrunch', '#DimSum', '#NaturalWine', '#SkinFade', '#RooftopBars']

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="font-display text-2xl font-semibold text-stone-900 sm:text-3xl">Community feed</h1>
      <p className="mt-1 text-sm text-stone-500">See what Gander reviewers are discovering around town.</p>

      <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_18rem]">
        <div className="space-y-4">
          <Composer />
          {seedFeed.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>

        <aside className="hidden space-y-5 lg:block">
          <div className="sticky top-24 space-y-5">
            <div className="rounded-2xl bg-white p-5 card-shadow ring-1 ring-stone-100">
              <h3 className="flex items-center gap-1.5 font-semibold text-stone-900">
                <TrendingUp size={16} className="text-brand-500" /> Top reviewers
              </h3>
              <ul className="mt-3 space-y-3">
                {leaderboard.map((u, i) => (
                  <li key={u.id} className="flex items-center gap-3">
                    <span className="w-4 text-sm font-bold text-stone-400">{i + 1}</span>
                    <Avatar name={u.name} src={u.avatar} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-stone-900">{u.name}</p>
                      <p className="text-xs text-stone-400">
                        {u.reviewCount} reviews · {u.points.toLocaleString('en-GB')} pts
                      </p>
                    </div>
                    <LevelBadge level={u.level} />
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl bg-white p-5 card-shadow ring-1 ring-stone-100">
              <h3 className="font-semibold text-stone-900">Trending tags</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {tags.map((t) => (
                  <Link
                    key={t}
                    to={`/search?q=${encodeURIComponent(t.replace('#', ''))}`}
                    className="rounded-full bg-stone-100 px-3 py-1.5 text-xs font-medium text-stone-600 hover:bg-brand-50 hover:text-brand-600"
                  >
                    {t}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
