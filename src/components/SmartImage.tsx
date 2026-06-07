import { useState, type ImgHTMLAttributes } from 'react'
import { placeholderDataUri } from '../lib/img'

interface Props extends ImgHTMLAttributes<HTMLImageElement> {
  /** Seed used to generate the gradient fallback if the photo fails to load. */
  seedFallback: string
  emoji?: string
}

/**
 * An <img> that degrades to a deterministic gradient placeholder instead of a
 * broken-image icon, so the prototype always looks intentional.
 */
export default function SmartImage({
  seedFallback,
  emoji,
  src,
  alt = '',
  ...rest
}: Props) {
  const [failed, setFailed] = useState(false)
  const finalSrc = failed || !src ? placeholderDataUri(seedFallback, emoji) : src
  return (
    <img
      src={finalSrc}
      alt={alt}
      loading="lazy"
      onError={failed ? undefined : () => setFailed(true)}
      {...rest}
    />
  )
}
