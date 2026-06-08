import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Heart, MapPin, MessageCircle, PenLine, Share2, TrendingUp, UserPlus, Users } from 'lucide-react'
import clsx from 'clsx'
import { seedFeed } from '../data/feed'
import { businessesById } from '../data/businesses'
import { currentUser, users } from '../data/users'
import type { FeedPost } from '../data/types'
import { useStore } from '../store/StoreContext'
import { useAuth } from '../auth/AuthContext'
import * as db from '../lib/db'
import type { LeaderboardEntry } from '../lib/db'
import Avatar from '../components/Avatar'
import Stars from '../components/Stars'
import SmartImage from '../components/SmartImage'
import LevelBadge from '../components/LevelBadge'

// In demo mode, simulate the logged-in user following Olivia & Priya
const DEMO_FOLLOWING_IDS = new Set(['u1', 'u3'])

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
        <Link to={`/u/${post.userId}`} className="shrink-0">
          <Avatar name={post.userName} src={post.userAvatar} size={44} className="hover:ring-2 hover:ring-brand-300 transition" />
        </Link>
        <div className="min-w-0">
          <p className="text-sm text-stone-600">
            <Link to={`/u/${post.userId}`} className="font-semibold text-stone-900 hover:text-brand-600">
              {post.userName}
            </Link>{' '}
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

type FeedFilter = 'all' | 'following'

export default function Feed() {
  const { user, configured } = useAuth()
  const isRealUser = configured && !user.isGuest

  const [filter, setFilter] = useState<FeedFilter>('all')
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    db.getLeaderboard(5).then((entries) => {
      setLeaderboard(entries)
    })
  }, [])

  useEffect(() => {
    if (!isRealUser || !user.id) return
    db.getFollowing(user.id).then((ids) => setFollowingIds(new Set(ids)))
  }, [isRealUser, user.id])

  // Seed-user fallback for the leaderboard when Supabase isn't connected
  const demoLeaderboard = useMemo<LeaderboardEntry[]>(
    () =>
      [...users]
        .filter((u) => u.id !== 'me')
        .sort((a, b) => b.points - a.points)
        .slice(0, 5)
        .map((u) => ({ id: u.id, name: u.name, avatar: u.avatar, level: u.level, points: u.points })),
    [],
  )
  const visibleLeaderboard = leaderboard.length > 0 ? leaderboard : demoLeaderboard

  const allPosts = seedFeed
  // Determine which set of user IDs to filter by for the Following tab
  const effectiveFollowingIds = isRealUser ? followingIds : DEMO_FOLLOWING_IDS
  const visiblePosts = useMemo(() => {
    if (filter !== 'following') return allPosts
    if (effectiveFollowingIds.size === 0) return []
    return allPosts.filter((p) => effectiveFollowingIds.has(p.userId))
  }, [filter, effectiveFollowingIds])

  // label is display text; query must match actual business tag strings in the seed data
  const tags = [
    { label: '#SundayRoast',      query: 'Sunday roast' },
    { label: '#BottomlessBrunch', query: 'Bottomless brunch' },
    { label: '#DimSum',           query: 'Dim sum' },
    { label: '#DateNight',        query: 'Date night' },
    { label: '#SkinFade',         query: 'Skin fade' },
    { label: '#Rooftop',          query: 'Rooftop' },
  ]

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="font-display text-2xl font-semibold text-stone-900 sm:text-3xl">Community feed</h1>
      <p className="mt-1 text-sm text-stone-500">See what Gander reviewers are discovering around town.</p>

      {/* Filter tabs */}
      <div className="mt-4 flex gap-1 border-b border-stone-200">
        {(['all', 'following'] as FeedFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={clsx(
              'relative flex items-center gap-1.5 px-4 py-3 text-sm font-semibold transition',
              filter === f ? 'text-brand-600' : 'text-stone-500 hover:text-stone-800',
            )}
          >
            {f === 'following' && <Users size={14} />}
            {f === 'all' ? 'For you' : 'Following'}
            {filter === f && (
              <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand-500" />
            )}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_18rem]">
        <div className="space-y-4">
          <Composer />
          {visiblePosts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-300 py-16 text-center">
              <UserPlus className="mx-auto text-stone-300" size={38} />
              <p className="mt-3 font-semibold text-stone-700">No one to follow yet</p>
              <p className="mt-1 text-sm text-stone-500">
                Follow reviewers from the leaderboard to see their posts here.
              </p>
            </div>
          ) : (
            visiblePosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))
          )}
        </div>

        <aside className="hidden space-y-5 lg:block">
          <div className="sticky top-24 space-y-5">
            <div className="rounded-2xl bg-white p-5 card-shadow ring-1 ring-stone-100">
              <h3 className="flex items-center gap-1.5 font-semibold text-stone-900">
                <TrendingUp size={16} className="text-brand-500" /> Top reviewers
              </h3>
              <ul className="mt-3 space-y-3">
                {visibleLeaderboard.map((u, i) => (
                  <li key={u.id}>
                    <Link
                      to={`/u/${u.id}`}
                      className="flex items-center gap-3 rounded-xl p-1 transition hover:bg-stone-50"
                    >
                      <span className="w-4 text-sm font-bold text-stone-400">{i + 1}</span>
                      <Avatar name={u.name} src={u.avatar} size={36} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-stone-900 hover:text-brand-600">
                          {u.name}
                        </p>
                        <p className="text-xs text-stone-400">
                          {u.points.toLocaleString('en-GB')} pts
                        </p>
                      </div>
                      <LevelBadge level={u.level} />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl bg-white p-5 card-shadow ring-1 ring-stone-100">
              <h3 className="font-semibold text-stone-900">Trending tags</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {tags.map((t) => (
                  <Link
                    key={t.label}
                    to={`/search?q=${encodeURIComponent(t.query)}`}
                    className="rounded-full bg-stone-100 px-3 py-1.5 text-xs font-medium text-stone-600 hover:bg-brand-50 hover:text-brand-600"
                  >
                    {t.label}
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
