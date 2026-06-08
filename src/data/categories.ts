import type { Category, CategoryId } from './types'

export const categories: Category[] = [
  {
    id: 'restaurants',
    label: 'Restaurants',
    icon: 'UtensilsCrossed',
    emoji: '🍽️',
    blurb: 'From Sunday roasts to small plates',
  },
  {
    id: 'cafes',
    label: 'Cafés',
    icon: 'Coffee',
    emoji: '☕',
    blurb: 'Flat whites and weekend brunch',
  },
  {
    id: 'bars',
    label: 'Bars & Cocktails',
    icon: 'Wine',
    emoji: '🍸',
    blurb: 'Cocktails, natural wine and rooftops',
  },
  {
    id: 'pubs',
    label: 'Pubs',
    icon: 'Beer',
    emoji: '🍺',
    blurb: 'Proper pubs, real ales and Sunday roasts',
  },
  {
    id: 'salons',
    label: 'Hair Salons',
    icon: 'Scissors',
    emoji: '💇',
    blurb: 'Cuts, colour and blowdries',
  },
  {
    id: 'beauty',
    label: 'Beauty & Nails',
    icon: 'Sparkles',
    emoji: '💅',
    blurb: 'Nail bars, lashes, brows and barbershops',
  },
  {
    id: 'gyms',
    label: 'Gyms',
    icon: 'Dumbbell',
    emoji: '🏋️',
    blurb: 'Weights, cardio and strength training',
  },
  {
    id: 'fitness',
    label: 'Fitness Studios',
    icon: 'PersonStanding',
    emoji: '🧘',
    blurb: 'Yoga, pilates, dance and spin',
  },
  {
    id: 'spas',
    label: 'Spas & Wellness',
    icon: 'Flower2',
    emoji: '💆',
    blurb: 'Massage, facials and saunas',
  },
  {
    id: 'hotels',
    label: 'Hotels & Stays',
    icon: 'BedDouble',
    emoji: '🛏️',
    blurb: 'Boutique boltholes and city stays',
  },
  {
    id: 'shopping',
    label: 'Shopping',
    icon: 'ShoppingBag',
    emoji: '🛍️',
    blurb: 'Independent boutiques, markets and gifts',
  },
  {
    id: 'activities',
    label: 'Activities',
    icon: 'Lightbulb',
    emoji: '🎯',
    blurb: 'Cooking classes, workshops and experiences',
  },
  {
    id: 'entertainment',
    label: 'Entertainment',
    icon: 'Clapperboard',
    emoji: '🎬',
    blurb: 'Cinema, bowling, escape rooms and arcades',
  },
  {
    id: 'nightlife',
    label: 'Nightlife',
    icon: 'Music',
    emoji: '🎵',
    blurb: 'Clubs, live music and comedy nights',
  },
]

export const categoryMap: Record<CategoryId, Category> = Object.fromEntries(
  categories.map((c) => [c.id, c]),
) as Record<CategoryId, Category>

export const neighbourhoods: string[] = [
  'Soho',
  'Shoreditch',
  'Camden',
  'Covent Garden',
  'Notting Hill',
  'Borough',
  'Islington',
  'Mayfair',
  'Brixton',
  'Hackney',
  'Peckham',
  'Clerkenwell',
  'Fitzrovia',
  'Bloomsbury',
]
