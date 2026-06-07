import { useMemo, useState } from 'react'
import { Bike, Check, Minus, Plus } from 'lucide-react'
import Modal from './Modal'
import type { Business } from '../data/types'
import { formatPrice } from '../lib/format'
import { useStore } from '../store/StoreContext'
import PaymentForm from './PaymentForm'

interface Props {
  open: boolean
  onClose: () => void
  business: Business
}

const DELIVERY_FEE = 2.49

export default function OrderModal({ open, onClose, business }: Props) {
  const dishes = useMemo(
    () =>
      business.popularDishes && business.popularDishes.length
        ? business.popularDishes
        : [
            { name: 'Signature dish', price: 12 },
            { name: 'House special', price: 10 },
            { name: 'Side & a drink', price: 6 },
          ],
    [business],
  )
  const { placeOrder } = useStore()
  const [qty, setQty] = useState<Record<string, number>>({})
  const [placed, setPlaced] = useState(false)
  const [paying, setPaying] = useState(false)

  const subtotal = dishes.reduce((s, d) => s + (qty[d.name] ?? 0) * d.price, 0)
  const itemCount = Object.values(qty).reduce((s, n) => s + n, 0)
  const total = subtotal + (subtotal > 0 ? DELIVERY_FEE : 0)

  function setItem(name: string, delta: number) {
    setQty((prev) => {
      const next = Math.max(0, (prev[name] ?? 0) + delta)
      return { ...prev, [name]: next }
    })
  }

  function close() {
    onClose()
    setTimeout(() => {
      setPlaced(false)
      setPaying(false)
      setQty({})
    }, 250)
  }

  return (
    <Modal open={open} onClose={close} title={placed ? 'Order placed' : paying ? 'Payment' : `Order from ${business.name}`}>
      {placed ? (
        <div className="py-6 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-emerald-600">
            <Check size={30} />
          </div>
          <h3 className="mt-4 font-display text-xl font-semibold text-stone-900">On its way!</h3>
          <p className="mx-auto mt-1 max-w-xs text-sm text-stone-500">
            Your order from {business.name} is being prepared. Estimated delivery in{' '}
            <span className="font-semibold text-stone-800">30–40 mins</span>.
          </p>
          <button
            onClick={close}
            className="mt-6 w-full rounded-full bg-brand-500 py-3 text-sm font-semibold text-white transition hover:bg-brand-600"
          >
            Done
          </button>
        </div>
      ) : paying ? (
        <PaymentForm
          amount={total}
          onPaid={() => {
            placeOrder({
              businessId: business.id,
              businessName: business.name,
              total,
              items: itemCount,
            })
            setPlaced(true)
            setPaying(false)
          }}
          onCancel={() => setPaying(false)}
        />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700">
            <Bike size={16} /> Delivery to <span className="font-semibold">SE1 · ~35 mins</span>
          </div>

          <div className="divide-y divide-stone-100">
            {dishes.map((d) => (
              <div key={d.name} className="flex items-center justify-between py-3">
                <div className="min-w-0 pr-3">
                  <p className="font-medium text-stone-900">{d.name}</p>
                  {d.description && <p className="text-xs text-stone-500">{d.description}</p>}
                  <p className="mt-0.5 text-sm font-semibold text-stone-700">{formatPrice(d.price)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setItem(d.name, -1)}
                    disabled={!qty[d.name]}
                    className="grid h-8 w-8 place-items-center rounded-full border border-stone-200 text-stone-600 disabled:opacity-30"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-5 text-center text-sm font-semibold">{qty[d.name] ?? 0}</span>
                  <button
                    type="button"
                    onClick={() => setItem(d.name, 1)}
                    className="grid h-8 w-8 place-items-center rounded-full border border-stone-200 text-stone-600 hover:bg-stone-50"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {subtotal > 0 && (
            <div className="space-y-1 border-t border-stone-100 pt-3 text-sm">
              <div className="flex justify-between text-stone-500">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-stone-500">
                <span>Delivery</span>
                <span>{formatPrice(DELIVERY_FEE)}</span>
              </div>
              <div className="flex justify-between pt-1 text-base font-semibold text-stone-900">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
          )}

          <button
            onClick={() => setPaying(true)}
            disabled={itemCount === 0}
            className="w-full rounded-full bg-brand-500 py-3 text-sm font-semibold text-white transition enabled:hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {itemCount === 0
              ? 'Add items to your basket'
              : `Place order · ${formatPrice(total)}`}
          </button>
        </div>
      )}
    </Modal>
  )
}
