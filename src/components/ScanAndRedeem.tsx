/**
 * Full scan → verify → redeem flow.
 * Used both inside the MerchantDashboard modal and on the standalone StaffScanner page.
 */
import { useState, useCallback } from 'react'
import { CheckCircle2, Loader2, RotateCcw, ScanLine, XCircle } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { formatPrice } from '../lib/format'
import QrScanner from './QrScanner'

type Phase = 'scanning' | 'loading' | 'confirm' | 'busy' | 'done' | 'error' | 'already'

interface VoucherInfo {
  id: string
  title: string
  businessName: string
  dealPrice: number
  code: string
}

function extractCode(raw: string): string | null {
  // Handles full URL like https://gander.vercel.app/redeem/ABC123
  // or just the bare code ABC123
  const m = raw.match(/\/redeem\/([A-Z0-9a-z_-]+)$/)
  if (m) return m[1]
  if (/^[A-Z0-9]{6,}$/i.test(raw.trim())) return raw.trim()
  return null
}

interface Props {
  /** Optional: only show redemption if the voucher belongs to this business */
  businessId?: string
  /** Label shown at the top */
  title?: string
}

export default function ScanAndRedeem({ businessId, title = 'Scan customer QR' }: Props) {
  const [phase, setPhase] = useState<Phase>('scanning')
  const [voucher, setVoucher] = useState<VoucherInfo | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  const handleScan = useCallback(async (raw: string) => {
    const code = extractCode(raw)
    if (!code) return // not a voucher QR, keep scanning

    setPhase('loading')

    if (!isSupabaseConfigured || !supabase) {
      setErrorMsg('Backend not connected — Supabase env vars missing.')
      setPhase('error')
      return
    }

    const { data, error } = await supabase
      .from('vouchers')
      .select('id, title, business_name, deal_price, code, redeemed, business_id')
      .eq('code', code)
      .maybeSingle()

    if (error || !data) {
      setErrorMsg('Voucher not found for code: ' + code)
      setPhase('error')
      return
    }

    if (data.redeemed) {
      setVoucher({
        id: data.id,
        title: data.title,
        businessName: data.business_name,
        dealPrice: Number(data.deal_price),
        code: data.code,
      })
      setPhase('already')
      return
    }

    // Optional: check this voucher is for the right business
    if (businessId && data.business_id && data.business_id !== businessId) {
      setErrorMsg('This voucher is for a different venue.')
      setPhase('error')
      return
    }

    setVoucher({
      id: data.id,
      title: data.title,
      businessName: data.business_name,
      dealPrice: Number(data.deal_price),
      code: data.code,
    })
    setPhase('confirm')
  }, [businessId])

  async function handleRedeem() {
    if (!voucher || !supabase) return
    setPhase('busy')
    const { error } = await supabase
      .from('vouchers')
      .update({ redeemed: true })
      .eq('id', voucher.id)

    if (error) {
      setErrorMsg(error.message)
      setPhase('error')
    } else {
      setPhase('done')
    }
  }

  function reset() {
    setPhase('scanning')
    setVoucher(null)
    setErrorMsg('')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ScanLine size={18} className="text-brand-500" />
        <h3 className="font-semibold text-stone-900">{title}</h3>
      </div>

      {/* Camera */}
      {phase === 'scanning' && (
        <>
          <QrScanner onScan={handleScan} active={phase === 'scanning'} />
          <p className="text-center text-xs text-stone-400">
            Point the camera at the customer's voucher QR code
          </p>
        </>
      )}

      {/* Looking up */}
      {phase === 'loading' && (
        <div className="flex flex-col items-center gap-3 py-10">
          <Loader2 size={32} className="animate-spin text-brand-500" />
          <p className="text-sm text-stone-500">Looking up voucher…</p>
        </div>
      )}

      {/* Confirm redemption */}
      {phase === 'confirm' && voucher && (
        <div className="space-y-3">
          <div className="rounded-2xl border-2 border-brand-200 bg-brand-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">Valid voucher ✓</p>
            <p className="mt-1 text-lg font-semibold text-stone-900">{voucher.title}</p>
            <p className="text-sm text-stone-500">{voucher.businessName}</p>
            <div className="mt-2 flex items-center justify-between">
              <span className="font-mono text-sm font-bold tracking-wider text-brand-700">{voucher.code}</span>
              <span className="text-xl font-bold text-stone-900">{formatPrice(voucher.dealPrice)}</span>
            </div>
          </div>
          <button
            onClick={handleRedeem}
            className="w-full rounded-full bg-emerald-500 py-3 text-sm font-semibold text-white hover:bg-emerald-600"
          >
            Mark as redeemed
          </button>
          <button
            onClick={reset}
            className="w-full rounded-full border border-stone-200 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-50"
          >
            Cancel — scan again
          </button>
        </div>
      )}

      {/* Processing */}
      {phase === 'busy' && (
        <div className="flex flex-col items-center gap-3 py-10">
          <Loader2 size={32} className="animate-spin text-brand-500" />
          <p className="text-sm text-stone-500">Redeeming…</p>
        </div>
      )}

      {/* Success */}
      {phase === 'done' && voucher && (
        <div className="space-y-3">
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 size={48} className="text-emerald-500" />
            <div>
              <p className="font-semibold text-stone-900">Redeemed!</p>
              <p className="text-sm text-stone-500">
                <span className="font-mono font-bold">{voucher.code}</span> — {voucher.title}
              </p>
            </div>
          </div>
          <button
            onClick={reset}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-stone-900 py-3 text-sm font-semibold text-white hover:bg-stone-700"
          >
            <RotateCcw size={15} /> Scan next voucher
          </button>
        </div>
      )}

      {/* Already redeemed */}
      {phase === 'already' && voucher && (
        <div className="space-y-3">
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <XCircle size={48} className="text-stone-400" />
            <div>
              <p className="font-semibold text-stone-900">Already redeemed</p>
              <p className="text-sm text-stone-500">{voucher.title} — {voucher.businessName}</p>
              <p className="mt-1 font-mono text-sm font-bold text-stone-400">{voucher.code}</p>
            </div>
          </div>
          <button
            onClick={reset}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-stone-200 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-50"
          >
            <RotateCcw size={15} /> Scan again
          </button>
        </div>
      )}

      {/* Error */}
      {phase === 'error' && (
        <div className="space-y-3">
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 py-8 text-center">
            <XCircle size={40} className="text-rose-400" />
            <p className="px-4 text-sm text-rose-700">{errorMsg}</p>
          </div>
          <button
            onClick={reset}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-stone-900 py-3 text-sm font-semibold text-white hover:bg-stone-700"
          >
            <RotateCcw size={15} /> Try again
          </button>
        </div>
      )}
    </div>
  )
}
