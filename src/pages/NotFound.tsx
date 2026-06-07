import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <span className="font-display text-6xl font-semibold text-brand-500">404</span>
      <h1 className="mt-3 text-xl font-semibold text-stone-900">We couldn’t find that page</h1>
      <p className="mt-2 text-stone-500">
        It may have moved, or the link might be out of date.
      </p>
      <Link
        to="/"
        className="mt-6 rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600"
      >
        Back to Discover
      </Link>
    </div>
  )
}
