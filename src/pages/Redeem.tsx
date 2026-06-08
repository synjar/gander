import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { CheckCircle2, Loader2, ScanLine, XCircle } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

type Status = 'loading' | 'valid' | 'redeemed' | 'invalid' | 'confirming' | 'done' | 'error'

interface VoucherInfo {
  id: string
  title: string
  businessName: string
  dealPrice: number
  code: string
  redeemed: boolean
}

export default function Redeem() {
  const { code } = useParams<{ code: string }>()
  const [status, setStatus] = useState<Status>('loading')
  const [voucher, setVoucher] = useState<VoucherInfo | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!code) { setStatus('invalid'); return }
    if (!isSupabaseConfigured || !supabase) {
      setStatus('error')
      setErrorMsg('Backend not configured — connect Supabase to enable redemption.')
      return
    }

    supabase
      .from('vouchers')
      .select('id, title, business_name, deal_price, code, redeemed')
      .eq('code', code)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error || !data) { setStatus('invalid'); return }
        setVoucher({
          id: data.id,
          title: data.title,
          businessName: data.business_name,
          dealPrice: Number(data.deal_price),
          code: data.code,
          redeemed: data.redeemed,
        })
        setStatus(data.redeemed ? 'redeemed' : 'valid')
      })
  }, [code])

  async function handleRedeem() {
    if (!voucher || !supabase) return
    setStatus('confirming')
    const { error } = await supabase
      .from('vouchers')
      .update({ redeemed: true })
      .eq('id', voucher.id)

    if (error) {
      setErrorMsg(error.message)
      setStatus('error')
    } else {
      setStatus('done')
    }
  }

  const fmt = (n: number) => `£${n.toFixed(2)}`

  return (
    <div className="mx-auto max-w-sm px-4 py-16 text-center">
      {status === 'loading' && (
        <>
          <Loader2 size={40} className="mx-auto animate-spin text-stone-400" />
          <p className="mt-4 text-stone-500">Looking up voucher…</p>
        </>
      )}

      {status === 'invalid' && (
        <>
          <XCircle size={48} className="mx-auto text-red-400" />
          <h1 className="mt-4 font-display text-xl font-semibold text-stone-900">Voucher not found</h1>
          <p className="mt-2 text-stone-500">Code <span className="font-mono font-bold">{code}</span> doesn't exist.</p>
        </>
      )}

      {status === 'redeemed' && (
        <>
          <XCircle size={48} className="mx-auto text-stone-400" />
          <h1 className="mt-4 font-display text-xl font-semibold text-stone-900">Already redeemed</h1>
          <p className="mt-2 text-stone-500">This voucher has already been used.</p>
          <div className="mt-5 rounded-2xl border border-stone-200 bg-stone-50 p-4 text-left">
            <p className="font-semibold text-stone-900">{voucher?.title}</p>
            <p className="text-sm text-stone-500">{voucher?.businessName}</p>
          </div>
        </>
      )}

      {status === 'valid' && voucher && (
        <>
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand-100">
            <ScanLine size={30} className="text-brand-600" />
          </div>
          <h1 className="mt-4 font-display text-xl font-semibold text-stone-900">Valid voucher</h1>
          <div className="mt-5 rounded-2xl border-2 border-brand-200 bg-brand-50 p-5 text-left">
            <p className="font-semibold text-stone-900">{voucher.title}</p>
            <p className="text-sm text-stone-500">{voucher.businessName}</p>
            <p className="mt-2 font-mono text-lg font-bold tracking-wider text-brand-700">{voucher.code}</p>
            <p className="mt-1 text-2xl font-semibold text-stone-900">{fmt(voucher.dealPrice)}</p>
          </div>
          <button
            onClick={handleRedeem}
            className="mt-5 w-full rounded-full bg-brand-500 py-3 text-sm font-semibold text-white hover:bg-brand-600"
          >
            Mark as redeemed
          </button>
          <p className="mt-2 text-xs text-stone-400">Only press this once the customer has received their offer.</p>
        </>
      )}

      {status === 'confirming' && (
        <>
          <Loader2 size={40} className="mx-auto animate-spin text-brand-500" />
          <p className="mt-4 text-stone-500">Marking as redeemed…</p>
        </>
      )}

      {status === 'done' && (
        <>
          <CheckCircle2 size={48} className="mx-auto text-emerald-500" />
          <h1 className="mt-4 font-display text-xl font-semibold text-stone-900">Redeemed!</h1>
          <p className="mt-2 text-stone-500">
            <span className="font-mono font-bold">{code}</span> has been marked as used.
          </p>
          <Link
            to="/business/dashboard"
            className="mt-6 inline-block rounded-full bg-stone-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-stone-700"
          >
            Back to dashboard
          </Link>
        </>
      )}

      {status === 'error' && (
        <>
          <XCircle size={48} className="mx-auto text-red-400" />
          <h1 className="mt-4 font-display text-xl font-semibold text-stone-900">Error</h1>
          <p className="mt-2 text-sm text-stone-500">{errorMsg}</p>
        </>
      )}
    </div>
  )
}
