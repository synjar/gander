import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { MapPin, Star, Users } from 'lucide-react'
import { users } from '../data/users'
import { useStore } from '../store/StoreContext'
import { useAuth } from '../auth/AuthContext'
import * as db from '../lib/db'
import type { PublicProfile } from '../lib/db'
import { getLevel, getLevelName, getLevelProgress } from '../lib/xp'
import Avatar from '../components/Avatar'
import LevelBadge from '../components/LevelBadge'
import ReviewCard from '../components/ReviewCard'
import FollowButton from '../components/FollowButton'

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="text-center">
      <p className="font-display text-xl font-semibold text-stone-900">{value}</p>
      <p className="text-xs text-stone-500">{label}</p>
    </div>
  )
}

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>()
  const { allReviews, businessById } = useStore()
  const { user: me, configured } = useAuth()
  const isMe = configured && !me.isGuest && me.id === userId

  // Try Supabase first, fall back to seed user data
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [followerCount, setFollowerCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)

  useEffect(() => {
    if (!userId) return

    // Try backend profile
    db.getProfile(userId).then((p) => {
      if (p) {
        setProfile(p)
      } else {
        // Fall back to seeded user
        const seed = users.find((u) => u.id === userId)
        if (seed) {
          setProfile({
            id: seed.id,
            name: seed.name,
            avatar: seed.avatar,
            level: seed.level,
            points: seed.points,
            bio: seed.bio ?? undefined,
            neighbourhood: seed.neighbourhood ?? undefined,
            joined: 'Founding member',
          })
        }
      }
    })

    db.getFollowerCount(userId).then(setFollowerCount)
    db.getFollowingCount(userId).then(setFollowingCount)
  }, [userId])

  const theirReviews = allReviews.filter((r) => r.authorId === userId)

  if (!userId) return null

  if (!profile) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <Users className="mx-auto text-stone-300" size={40} />
        <p className="mt-3 font-semibold text-stone-700">Reviewer not found</p>
      </div>
    )
  }

  const level = getLevel(profile.points)
  const levelName = getLevelName(level)
  const { progress, toNext, nextLevelName } = getLevelProgress(profile.points)

  return (
    <div>
      <Helmet>
        <title>{profile.name} · Reviewer | Gander</title>
      </Helmet>

      {/* Cover */}
      <div className="h-32 bg-gradient-to-r from-brand-400 via-orange-400 to-amber-400 sm:h-40" />

      <div className="mx-auto max-w-3xl px-4">
        <div className="-mt-10 flex flex-col gap-4 sm:-mt-12 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-3">
            <Avatar name={profile.name} src={profile.avatar} size={84} className="ring-4 ring-white" />
            <div className="pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display text-2xl font-semibold text-stone-900">{profile.name}</h1>
                <LevelBadge level={level} showName />
              </div>
              <p className="flex items-center gap-1 text-sm text-stone-500">
                <MapPin size={13} />
                {profile.neighbourhood ? `${profile.neighbourhood} · ` : ''}
                Joined {profile.joined}
              </p>
            </div>
          </div>

          {isMe ? (
            <Link
              to="/me"
              className="self-start rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 sm:self-auto"
            >
              Edit profile
            </Link>
          ) : (
            <div className="self-start sm:self-auto">
              <FollowButton targetUserId={userId} size="md" />
            </div>
          )}
        </div>

        {profile.bio && <p className="mt-4 max-w-xl text-stone-600">{profile.bio}</p>}

        {/* Stats */}
        <div className="mt-5 flex items-center gap-6">
          <Stat value={theirReviews.length} label="Reviews" />
          <Stat value={followerCount} label="Followers" />
          <Stat value={followingCount} label="Following" />
          <Stat value={profile.points.toLocaleString('en-GB')} label="XP" />
        </div>

        {/* Level progress */}
        <div className="mt-5 rounded-2xl border border-stone-200 bg-white p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-stone-900">{levelName} · Level {level}</span>
            {toNext > 0 && (
              <span className="text-stone-400 text-xs">{toNext} XP to {nextLevelName}</span>
            )}
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-stone-100">
            <div className="h-full rounded-full bg-brand-500 transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Reviews */}
        <div className="mt-6">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-stone-900">
            <Star size={18} className="text-brand-500" />
            Reviews ({theirReviews.length})
          </h2>

          {theirReviews.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-stone-300 py-14 text-center">
              <Star className="mx-auto text-stone-300" size={36} />
              <p className="mt-3 text-stone-500">No reviews yet</p>
            </div>
          ) : (
            <div className="mt-4 divide-y divide-stone-100">
              {theirReviews.map((r) => {
                const biz = businessById(r.businessId)
                return (
                  <div key={r.id} className="pt-2 first:pt-0">
                    {biz && (
                      <Link
                        to={`/b/${biz.slug}`}
                        className="flex items-center gap-1.5 pt-4 text-sm font-semibold text-stone-900 hover:text-brand-600"
                      >
                        <MapPin size={14} className="text-brand-500" />
                        {biz.name}
                        <span className="font-normal text-stone-400">· {biz.neighbourhood}</span>
                      </Link>
                    )}
                    <ReviewCard review={r} />
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="py-8" />
      </div>
    </div>
  )
}
