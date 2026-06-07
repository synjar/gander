import { Heart } from 'lucide-react'
import clsx from 'clsx'
import { useStore } from '../store/StoreContext'

interface Props {
  id: string
  size?: number
  className?: string
  variant?: 'overlay' | 'plain'
}

export default function FavouriteButton({ id, size = 18, className, variant = 'overlay' }: Props) {
  const { isFavourite, toggleFavourite } = useStore()
  const fav = isFavourite(id)
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        toggleFavourite(id)
      }}
      aria-label={fav ? 'Remove from saved' : 'Save'}
      aria-pressed={fav}
      className={clsx(
        'grid place-items-center rounded-full transition active:scale-90',
        variant === 'overlay' && 'h-9 w-9 bg-white/90 backdrop-blur shadow-sm hover:bg-white',
        variant === 'plain' && 'h-9 w-9 hover:bg-stone-100',
        className,
      )}
    >
      <Heart
        size={size}
        className={clsx(fav ? 'text-rose-500' : 'text-stone-600')}
        fill={fav ? 'currentColor' : 'none'}
      />
    </button>
  )
}
