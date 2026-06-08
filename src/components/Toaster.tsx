import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle2, Info, AlertCircle, X, Trophy } from 'lucide-react'
import clsx from 'clsx'
import { onToast, type ToastItem } from '../lib/toast'

const ICONS = {
  success: CheckCircle2,
  info:    Info,
  error:   AlertCircle,
  levelup: Trophy,
}

const STYLES = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  info:    'border-blue-200 bg-blue-50 text-blue-900',
  error:   'border-red-200 bg-red-50 text-red-900',
  levelup: 'border-amber-300 bg-amber-50 text-amber-900',
}

const ICON_STYLES = {
  success: 'text-emerald-500',
  info:    'text-blue-500',
  error:   'text-red-500',
  levelup: 'text-amber-500',
}

const AUTO_DISMISS_MS = 4500

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const Icon = ICONS[item.kind]

  useEffect(() => {
    const t = setTimeout(onDismiss, AUTO_DISMISS_MS)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div
      className={clsx(
        'flex w-full max-w-sm items-start gap-3 rounded-2xl border p-4 shadow-lg shadow-black/10 animate-in slide-in-from-bottom-4 fade-in duration-300',
        STYLES[item.kind],
      )}
    >
      <Icon size={20} className={clsx('mt-0.5 shrink-0', ICON_STYLES[item.kind])} />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{item.title}</p>
        {item.body && <p className="mt-0.5 text-sm opacity-80">{item.body}</p>}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 rounded-lg p-0.5 opacity-60 hover:opacity-100"
      >
        <X size={16} />
      </button>
    </div>
  )
}

export default function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    return onToast((item) => {
      setToasts((prev) => [...prev, item])
    })
  }, [])

  const dismiss = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id))

  if (toasts.length === 0) return null

  return createPortal(
    <div className="pointer-events-none fixed bottom-6 right-4 z-[200] flex flex-col items-end gap-2 sm:right-6">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastCard item={t} onDismiss={() => dismiss(t.id)} />
        </div>
      ))}
    </div>,
    document.body,
  )
}
