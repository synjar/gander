/** Lightweight event-based toast system — no React context needed. */

export type ToastKind = 'success' | 'levelup' | 'info' | 'error'

export interface ToastItem {
  id: string
  kind: ToastKind
  title: string
  body?: string
}

type Listener = (t: ToastItem) => void
const listeners: Listener[] = []
let counter = 0

export function onToast(fn: Listener): () => void {
  listeners.push(fn)
  return () => {
    const i = listeners.indexOf(fn)
    if (i >= 0) listeners.splice(i, 1)
  }
}

function emit(kind: ToastKind, title: string, body?: string) {
  const item: ToastItem = { id: String(++counter), kind, title, body }
  listeners.forEach((fn) => fn(item))
}

export const toast = {
  success: (title: string, body?: string) => emit('success', title, body),
  info:    (title: string, body?: string) => emit('info',    title, body),
  error:   (title: string, body?: string) => emit('error',   title, body),
  levelUp: (levelName: string, level: number) =>
    emit('levelup', `You reached ${levelName}!`, `Level ${level} — keep exploring to climb higher`),
}
