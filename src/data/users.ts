import type { User } from './types'

export function avatar(seed: string): string {
  const bg = 'ffd5b3,ffdfbf,c0aede,d1d4f9,b6e3f4,ffd1dc'
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
    seed,
  )}&backgroundColor=${bg}`
}

export const currentUserId = 'me'

export const users: User[] = [
  {
    id: 'me',
    name: 'Alex Morgan',
    avatar: avatar('Alex Morgan'),
    level: 3,
    points: 1840,
    bio: 'Borough local with an unhealthy love of small plates and natural wine.',
    joined: 'March 2024',
    neighbourhood: 'Borough',
    reviewCount: 12,
    photoCount: 38,
    followerCount: 64,
    followingCount: 90,
  },
  {
    id: 'u1',
    name: 'Olivia Bennett',
    avatar: avatar('Olivia Bennett'),
    level: 7,
    points: 9420,
    bio: 'Elite reviewer. I eat so you don’t have to guess. London → everywhere.',
    joined: 'June 2019',
    neighbourhood: 'Islington',
    reviewCount: 312,
    photoCount: 1840,
    followerCount: 5400,
    followingCount: 280,
  },
  {
    id: 'u2',
    name: 'Marcus Reid',
    avatar: avatar('Marcus Reid'),
    level: 5,
    points: 4310,
    bio: 'Cocktails, coffee and a good barber. Shoreditch based.',
    joined: 'January 2021',
    neighbourhood: 'Shoreditch',
    reviewCount: 128,
    photoCount: 540,
    followerCount: 1200,
    followingCount: 410,
  },
  {
    id: 'u3',
    name: 'Priya Sharma',
    avatar: avatar('Priya Sharma'),
    level: 6,
    points: 6680,
    bio: 'Spice obsessive and weekend brunch scout. Will queue for good naan.',
    joined: 'September 2020',
    neighbourhood: 'Brixton',
    reviewCount: 204,
    photoCount: 990,
    followerCount: 2600,
    followingCount: 330,
  },
  {
    id: 'u4',
    name: 'Tom Whitfield',
    avatar: avatar('Tom Whitfield'),
    level: 4,
    points: 2880,
    bio: 'Sunday roast connoisseur. Pubs with a fire get bonus points.',
    joined: 'April 2022',
    neighbourhood: 'Clerkenwell',
    reviewCount: 76,
    photoCount: 210,
    followerCount: 430,
    followingCount: 260,
  },
  {
    id: 'u5',
    name: 'Chloe Adeyemi',
    avatar: avatar('Chloe Adeyemi'),
    level: 5,
    points: 5120,
    bio: 'Wellness, workouts and the occasional bottomless brunch to balance it out.',
    joined: 'November 2021',
    neighbourhood: 'Hackney',
    reviewCount: 141,
    photoCount: 720,
    followerCount: 1800,
    followingCount: 520,
  },
  {
    id: 'u6',
    name: 'James Patel',
    avatar: avatar('James Patel'),
    level: 4,
    points: 3050,
    bio: 'Ramen, dim sum and izakaya. Always hungry, often early.',
    joined: 'February 2022',
    neighbourhood: 'Fitzrovia',
    reviewCount: 88,
    photoCount: 300,
    followerCount: 610,
    followingCount: 290,
  },
]

export const usersById: Record<string, User> = Object.fromEntries(
  users.map((u) => [u.id, u]),
)

export const currentUser = usersById[currentUserId]
