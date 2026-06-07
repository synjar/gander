import { useRef, useState, type ChangeEvent } from 'react'
import { Camera, Check, Loader2, X } from 'lucide-react'
import Modal from './Modal'
import StarInput from './StarInput'
import SmartImage from './SmartImage'
import { useStore } from '../store/StoreContext'
import type { Business } from '../data/types'
import { uploadImage, storageEnabled } from '../lib/storage'

const visitTypes = ['Dinner', 'Lunch', 'Brunch', 'Drinks', 'Breakfast', 'Other']

interface Props {
  open: boolean
  onClose: () => void
  business: Business
}

function SubRating({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (n: number) => void
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-stone-600">{label}</span>
      <StarInput value={value} onChange={onChange} size={22} />
    </div>
  )
}

export default function ReviewModal({ open, onClose, business }: Props) {
  const { addReview } = useStore()
  const [rating, setRating] = useState(0)
  const [food, setFood] = useState(0)
  const [service, setService] = useState(0)
  const [ambience, setAmbience] = useState(0)
  const [value, setValue] = useState(0)
  const [visit, setVisit] = useState('Dinner')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [done, setDone] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function reset() {
    setRating(0)
    setFood(0)
    setService(0)
    setAmbience(0)
    setValue(0)
    setVisit('Dinner')
    setTitle('')
    setBody('')
    setPhotos([])
    setDone(false)
  }

  function close() {
    onClose()
    setTimeout(reset, 250)
  }

  function submit() {
    addReview({
      businessId: business.id,
      rating,
      food: food || undefined,
      service: service || undefined,
      ambience: ambience || undefined,
      value: value || undefined,
      title: title.trim() || undefined,
      body: body.trim(),
      photos,
      visitType: visit,
    })
    setDone(true)
  }

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (storageEnabled) {
      setUploading(true)
      try {
        const url = await uploadImage(file)
        setPhotos((p) => [...p, url])
      } catch {
        setPhotos((p) => [...p, URL.createObjectURL(file)])
      } finally {
        setUploading(false)
      }
    } else {
      setPhotos((p) => [...p, URL.createObjectURL(file)])
    }
  }

  const canSubmit = rating > 0 && body.trim().length >= 10

  return (
    <Modal open={open} onClose={close} title={done ? 'Review posted' : `Review ${business.name}`}>
      {done ? (
        <div className="py-6 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-emerald-600">
            <Check size={30} />
          </div>
          <h3 className="mt-4 font-display text-xl font-semibold text-stone-900">Thanks for sharing!</h3>
          <p className="mx-auto mt-1 max-w-sm text-sm text-stone-500">
            Your review is now live on {business.name} and on your profile. You earned{' '}
            <span className="font-semibold text-brand-600">+50 points</span>.
          </p>
          <button
            onClick={close}
            className="mt-6 w-full rounded-full bg-brand-500 py-3 text-sm font-semibold text-white transition hover:bg-brand-600"
          >
            Done
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="text-center">
            <p className="text-sm text-stone-500">Overall rating</p>
            <div className="mt-2 flex justify-center">
              <StarInput value={rating} onChange={setRating} size={38} />
            </div>
          </div>

          <div className="space-y-2.5 rounded-xl bg-stone-50 p-4">
            <SubRating label="Food" value={food} onChange={setFood} />
            <SubRating label="Service" value={service} onChange={setService} />
            <SubRating label="Ambience" value={ambience} onChange={setAmbience} />
            <SubRating label="Value" value={value} onChange={setValue} />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-700">Type of visit</label>
            <div className="flex flex-wrap gap-2">
              {visitTypes.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVisit(v)}
                  className={
                    'rounded-full px-3 py-1.5 text-sm font-medium transition ' +
                    (visit === v
                      ? 'bg-brand-500 text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200')
                  }
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-700">Title (optional)</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Sum up your experience"
              className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-700">Your review</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              placeholder="What did you order? How was the service and the vibe? Would you go back?"
              className="w-full resize-none rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
            <p className="mt-1 text-xs text-stone-400">{body.trim().length}/10 characters minimum</p>
          </div>

          <div>
            <div className="flex flex-wrap gap-2">
              {photos.map((p, i) => (
                <div key={i} className="relative">
                  <SmartImage src={p} seedFallback={`new-${i}`} className="h-16 w-16 rounded-lg object-cover" />
                  <button
                    type="button"
                    onClick={() => setPhotos((prev) => prev.filter((_, j) => j !== i))}
                    className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-stone-800 text-white"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              {photos.length < 4 && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="grid h-16 w-16 place-items-center rounded-lg border-2 border-dashed border-stone-300 text-stone-400 transition hover:border-brand-300 hover:text-brand-500 disabled:opacity-50"
                >
                  {uploading ? <Loader2 size={20} className="animate-spin" /> : <Camera size={20} />}
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
            </div>
            <p className="mt-1 text-xs text-stone-400">
              {storageEnabled
                ? 'Photos upload to your Gander storage.'
                : 'Add a photo from your device.'}
            </p>
          </div>

          <button
            onClick={submit}
            disabled={!canSubmit}
            className="w-full rounded-full bg-brand-500 py-3 text-sm font-semibold text-white transition enabled:hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Post review
          </button>
        </div>
      )}
    </Modal>
  )
}
