import { useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  images: string[]
  index: number
  onClose: () => void
  onChange: (i: number) => void
}

export default function Lightbox({ images, index, onClose, onChange }: Props) {
  const hasPrev = index > 0
  const hasNext = index < images.length - 1

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && hasPrev) onChange(index - 1)
      if (e.key === 'ArrowRight' && hasNext) onChange(index + 1)
    },
    [onClose, onChange, index, hasPrev, hasNext],
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = prev
    }
  }, [handleKey])

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/96"
      onClick={onClose}
      role="dialog"
      aria-modal
      aria-label="Photo viewer"
    >
      {/* Counter */}
      <span className="absolute left-4 top-4 rounded-full bg-black/50 px-3 py-1 text-sm text-white/80 select-none">
        {index + 1} / {images.length}
      </span>

      {/* Close */}
      <button
        onClick={(e) => { e.stopPropagation(); onClose() }}
        className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2.5 text-white transition hover:bg-white/25"
        aria-label="Close lightbox"
      >
        <X size={20} />
      </button>

      {/* Prev */}
      {hasPrev && (
        <button
          onClick={(e) => { e.stopPropagation(); onChange(index - 1) }}
          className="absolute left-4 z-10 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/25"
          aria-label="Previous photo"
        >
          <ChevronLeft size={24} />
        </button>
      )}

      {/* Image */}
      <img
        key={images[index]}
        src={images[index]}
        alt={`Photo ${index + 1} of ${images.length}`}
        className="max-h-[90vh] max-w-[90vw] select-none rounded-lg object-contain shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        draggable={false}
      />

      {/* Next */}
      {hasNext && (
        <button
          onClick={(e) => { e.stopPropagation(); onChange(index + 1) }}
          className="absolute right-4 z-10 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/25"
          aria-label="Next photo"
        >
          <ChevronRight size={24} />
        </button>
      )}

      {/* Dot navigation */}
      {images.length > 1 && (
        <div className="absolute bottom-6 flex items-center gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); onChange(i) }}
              className={`rounded-full transition-all ${
                i === index
                  ? 'h-2 w-6 bg-white'
                  : 'h-2 w-2 bg-white/40 hover:bg-white/70'
              }`}
              aria-label={`Photo ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>,
    document.body,
  )
}
