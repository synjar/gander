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
    label: 'Bars & Pubs',
    icon: 'Wine',
    emoji: '🍸',
    blurb: 'Cocktails, craft ale and rooftops',
  },
  {
    id: 'salons',
    label: 'Hair & Beauty',
    icon: 'Scissors',
    emoji: '💇',
    blurb: 'Cuts, colour and grooming',
  },
  {
    id: 'gyms',
    label: 'Gyms & Fitness',
    icon: 'Dumbbell',
    emoji: '🏋️',
    blurb: 'Classes, weights and studios',
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
