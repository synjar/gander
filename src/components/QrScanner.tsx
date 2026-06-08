import { useEffect, useId, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { CameraOff } from 'lucide-react'

interface Props {
  /** Called with the raw decoded text when a QR is detected. Fires once then
   *  pauses for `pauseMs` before scanning again (prevents duplicate fires). */
  onScan: (text: string) => void
  /** How long to pause between successful scans. Default 2 s. */
  pauseMs?: number
  active: boolean
}

export default function QrScanner({ onScan, active, pauseMs = 2000 }: Props) {
  const uid = useId().replace(/:/g, '')
  const elId = `qr-${uid}`
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const pausedRef = useRef(false)
  const [camError, setCamError] = useState<string | null>(null)

  useEffect(() => {
    if (!active) return
    setCamError(null)

    // small delay so the div is definitely mounted
    const tid = window.setTimeout(() => {
      const scanner = new Html5Qrcode(elId, { verbose: false })
      scannerRef.current = scanner

      scanner
        .start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decoded) => {
            if (pausedRef.current) return
            pausedRef.current = true
            onScan(decoded)
            window.setTimeout(() => { pausedRef.current = false }, pauseMs)
          },
          undefined,
        )
        .catch((err: unknown) => {
          const msg = String(err)
          if (msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('notallowed')) {
            setCamError('Camera permission denied. Please allow camera access and try again.')
          } else {
            setCamError('Could not start camera: ' + msg)
          }
        })
    }, 80)

    return () => {
      clearTimeout(tid)
      scannerRef.current?.stop().catch(() => {})
      scannerRef.current = null
    }
  }, [active, elId, onScan, pauseMs])

  if (camError) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-6 py-10 text-center">
        <CameraOff size={32} className="text-rose-400" />
        <p className="text-sm text-rose-700">{camError}</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-stone-900">
      <div id={elId} className="w-full" />
    </div>
  )
}
