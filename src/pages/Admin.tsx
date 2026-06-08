import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart3,
  Bike,
  Building2,
  CalendarCheck,
  Check,
  Download,
  Eye,
  EyeOff,
  Globe,
  Landmark,
  Loader2,
  MessageSquare,
  PoundSterling,
  RefreshCw,
  Sparkles,
  Star,
  Tag,
  Ticket,
  X,
} from 'lucide-react'
import clsx from 'clsx'
import { businesses, businessesById } from '../data/businesses'
import { cities } from '../data/cities'
import { categories, categoryMap } from '../data/categories'
import { useStore } from '../store/StoreContext'
import { fetchOSMAttractions, fetchOSMVenues, type OsmVenue } from '../lib/overpass'
import { generateReviews } from '../lib/seedReviewGen'
import * as db from '../lib/db'
import { formatPrice, priceLevel } from '../lib/format'
import Stars from '../components/Stars'
import Avatar from '../components/Avatar'
import OutreachPanel from '../components/OutreachPanel'

function StatCard({
  icon: Icon,
  label,
  value,
  tint,
}: {
  icon: typeof Star
  label: string
  value: string | number
  tint: string
}) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4">
      <div className={clsx('grid h-9 w-9 place-items-center rounded-lg', tint)}>
        <Icon size={18} />
      </div>
      <p className="mt-2.5 font-display text-2xl font-semibold text-stone-900">{value}</p>
      <p className="text-xs text-stone-500">{label}</p>
    </div>
  )
}

function ChartCard({
  title,
  rows,
  colour,
}: {
  title: string
  rows: { label: string; value: number }[]
  colour: string
}) {
  const max = Math.max(1, ...rows.map((r) => r.value))
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5">
      <h3 className="font-semibold text-stone-900">{title}</h3>
      <div className="mt-3 space-y-2">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center gap-3">
            <span className="w-24 shrink-0 truncate text-sm text-stone-600">{r.label}</span>
            <div className="h-2.5 flex-1 rounded-full bg-stone-100">
              <div
                className={clsx('h-full rounded-full', colour)}
                style={{ width: `${(r.value / max) * 100}%` }}
              />
            </div>
            <span className="w-8 shrink-0 text-right text-sm font-semibold text-stone-700">
              {r.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── OSM Import panel ─────────────────────────────────────────────────────────

const OSM_CITIES = cities.filter((c) =>
  ['west-sussex', 'london', 'manchester', 'birmingham'].includes(c.id),
)

function ImportPanel() {
  const { importBusinesses } = useStore()

  const [cityId, setCityId]               = useState('west-sussex')
  const [fetchState, setFetchState]       = useState<'idle' | 'fetching' | 'done' | 'importing'>('idle')
  const [fetchError, setFetchError]       = useState<string | null>(null)
  const [venues, setVenues]               = useState<OsmVenue[]>([])
  const [existingIds, setExistingIds]     = useState<Set<string>>(new Set())
  const [selected, setSelected]           = useState<Set<string>>(new Set())
  const [importResult, setImportResult]   = useState<{ inserted: number; updated: number; skippedClaimed: number } | null>(null)
  const [selectMode, setSelectMode]       = useState<'new' | 'all'>('new')

  const handleFetch = useCallback(async () => {
    setFetchState('fetching')
    setFetchError(null)
    setVenues([])
    setSelected(new Set())
    setImportResult(null)
    try {
      const [{ venues: fetched, error }, existIds] = await Promise.all([
        fetchOSMVenues(cityId, 500),
        db.getImportedOsmIds(cityId),
      ])
      if (error) { setFetchError(error); setFetchState('idle'); return }
      setVenues(fetched)
      setExistingIds(existIds)
      // Auto-select only new venues by default
      setSelected(new Set(fetched.filter((v) => !existIds.has(v.osmId)).map((v) => v.osmId)))
      setFetchState('done')
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : String(e))
      setFetchState('idle')
    }
  }, [cityId])

  const handleImport = useCallback(async () => {
    const toImport = venues.filter((v) => selected.has(v.osmId))
    if (toImport.length === 0) return
    setFetchState('importing')
    try {
      const result = await importBusinesses(toImport)
      setImportResult(result)
      const existIds = await db.getImportedOsmIds(cityId)
      setExistingIds(existIds)
      setSelected(new Set())
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : String(e))
    } finally {
      setFetchState('done')
    }
  }, [venues, selected, importBusinesses, cityId])

  // When select mode changes, recompute selection
  const handleSelectModeChange = useCallback((mode: 'new' | 'all') => {
    setSelectMode(mode)
    if (mode === 'all') {
      setSelected(new Set(venues.map((v) => v.osmId)))
    } else {
      setSelected(new Set(venues.filter((v) => !existingIds.has(v.osmId)).map((v) => v.osmId)))
    }
  }, [venues, existingIds])

  const toggleAll = useCallback(() => {
    const pool = selectMode === 'all'
      ? venues.map((v) => v.osmId)
      : venues.filter((v) => !existingIds.has(v.osmId)).map((v) => v.osmId)
    if (selected.size === pool.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(pool))
    }
  }, [venues, existingIds, selected])

  const newCount   = venues.filter((v) => !existingIds.has(v.osmId)).length
  const alreadyCount = venues.filter((v) => existingIds.has(v.osmId)).length

  return (
    <section className="mt-4 rounded-2xl border border-stone-200 bg-white p-5">
      <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-stone-900">
        <Globe size={18} className="text-brand-500" /> OpenStreetMap import
      </h2>
      <p className="mt-0.5 text-xs text-stone-500">
        Pull real venues from OpenStreetMap and add them as unclaimed stub listings.
        Business owners can later claim their listing to unlock the merchant dashboard.
      </p>

      {/* Controls */}
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-stone-600">Area</label>
          <select
            value={cityId}
            onChange={(e) => { setCityId(e.target.value); setVenues([]); setFetchState('idle') }}
            className="rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
          >
            {OSM_CITIES.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <button
          onClick={handleFetch}
          disabled={fetchState === 'fetching' || fetchState === 'importing'}
          className="flex items-center gap-2 rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-50"
        >
          {fetchState === 'fetching'
            ? <><Loader2 size={15} className="animate-spin" /> Fetching…</>
            : <><Globe size={15} /> Fetch from OpenStreetMap</>}
        </button>

        {(fetchState === 'done' || fetchState === 'importing') && selected.size > 0 && (
          <button
            onClick={handleImport}
            disabled={fetchState === 'importing'}
            className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
          >
            {fetchState === 'importing'
              ? <><Loader2 size={15} className="animate-spin" /> Importing…</>
              : <><Download size={15} /> {selected.size} selected — import / update</>}
          </button>
        )}
      </div>

      {fetchError && (
        <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{fetchError}</p>
      )}

      {importResult && (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
          <span className="flex items-center gap-1.5"><Check size={14} /> Done</span>
          {importResult.inserted > 0 && <span>{importResult.inserted} new venues added</span>}
          {importResult.updated  > 0 && <span>{importResult.updated} existing venues refreshed</span>}
          {importResult.skippedClaimed > 0 && (
            <span className="text-amber-600">{importResult.skippedClaimed} claimed listings left untouched</span>
          )}
        </div>
      )}

      {/* Preview table */}
      {venues.length > 0 && (
        <div className="mt-4">
          <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500">
            <span>{venues.length} venues fetched</span>
            <span className="text-emerald-600">{newCount} new</span>
            {alreadyCount > 0 && <span className="text-stone-400">{alreadyCount} already in DB</span>}
            {alreadyCount > 0 && (
              <div className="ml-auto flex gap-1 rounded-lg border border-stone-200 p-0.5">
                {(['new', 'all'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => handleSelectModeChange(m)}
                    className={clsx(
                      'rounded-md px-2.5 py-1 text-xs font-medium transition',
                      selectMode === m ? 'bg-stone-900 text-white' : 'text-stone-500 hover:text-stone-800',
                    )}
                  >
                    {m === 'new' ? 'New only' : 'All (re-import)'}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="mt-2 max-h-96 overflow-y-auto rounded-xl border border-stone-200">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-stone-50 text-left text-xs text-stone-500">
                <tr>
                  <th className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selected.size > 0 && selected.size === (selectMode === 'all' ? venues.length : newCount)}
                      onChange={toggleAll}
                      className="rounded"
                    />
                  </th>
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Category</th>
                  <th className="px-3 py-2 font-medium">Town</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {venues.map((v) => {
                  const already = existingIds.has(v.osmId)
                  const isSelected = selected.has(v.osmId)
                  return (
                    <tr
                      key={v.osmId}
                      className={clsx(
                        'transition',
                        already ? 'bg-stone-50/60' : 'hover:bg-stone-50',
                      )}
                    >
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            setSelected((prev) => {
                              const next = new Set(prev)
                              if (next.has(v.osmId)) next.delete(v.osmId)
                              else next.add(v.osmId)
                              return next
                            })
                          }}
                          className="rounded"
                        />
                      </td>
                      <td className="px-3 py-2 font-medium text-stone-900">{v.name}</td>
                      <td className="px-3 py-2 capitalize text-stone-500">
                        {categoryMap[v.category]?.label ?? v.category}
                      </td>
                      <td className="px-3 py-2 text-stone-500">{v.neighbourhood}</td>
                      <td className="px-3 py-2">
                        {already ? (
                          <span className="rounded-full bg-sky-50 px-2 py-0.5 text-xs text-sky-600">In DB</span>
                        ) : (
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-600">New</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  )
}

// ─── Attractions import panel ─────────────────────────────────────────────────

const FETCH_STEP_LABELS = [
  'museums & galleries',
  'historic sites',
  'marinas & reserves',
  'piers & landmarks',
  'beaches',
]

function AttractionsPanel() {
  const { importBusinesses } = useStore()

  const [cityId, setCityId]             = useState('west-sussex')
  const [fetchState, setFetchState]     = useState<'idle' | 'fetching' | 'done' | 'importing'>('idle')
  const [fetchError, setFetchError]     = useState<string | null>(null)
  const [fetchProgress, setFetchProgress] = useState<{ done: number; total: number } | null>(null)
  const [venues, setVenues]             = useState<OsmVenue[]>([])
  const [existingIds, setExistingIds]   = useState<Set<string>>(new Set())
  const [selected, setSelected]         = useState<Set<string>>(new Set())
  const [importResult, setImportResult] = useState<{ inserted: number; updated: number; skippedClaimed: number } | null>(null)
  const [selectMode, setSelectMode]     = useState<'new' | 'all'>('new')

  const handleFetch = useCallback(async () => {
    setFetchState('fetching')
    setFetchError(null)
    setFetchProgress(null)
    setVenues([])
    setSelected(new Set())
    setImportResult(null)
    try {
      const [{ venues: fetched, error }, existIds] = await Promise.all([
        fetchOSMAttractions(cityId, 300, (done, total) => setFetchProgress({ done, total })),
        db.getImportedOsmIds(cityId),
      ])
      setFetchProgress(null)
      if (error) { setFetchError(error); setFetchState('idle'); return }
      setVenues(fetched)
      setExistingIds(existIds)
      setSelected(new Set(fetched.filter((v) => !existIds.has(v.osmId)).map((v) => v.osmId)))
      setFetchState('done')
    } catch (e) {
      setFetchProgress(null)
      setFetchError(e instanceof Error ? e.message : String(e))
      setFetchState('idle')
    }
  }, [cityId])

  const handleImport = useCallback(async () => {
    const toImport = venues.filter((v) => selected.has(v.osmId))
    if (toImport.length === 0) return
    setFetchState('importing')
    try {
      const result = await importBusinesses(toImport)
      setImportResult(result)
      const existIds = await db.getImportedOsmIds(cityId)
      setExistingIds(existIds)
      setSelected(new Set())
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : String(e))
    } finally {
      setFetchState('done')
    }
  }, [venues, selected, importBusinesses, cityId])

  const handleSelectModeChange = useCallback((mode: 'new' | 'all') => {
    setSelectMode(mode)
    if (mode === 'all') {
      setSelected(new Set(venues.map((v) => v.osmId)))
    } else {
      setSelected(new Set(venues.filter((v) => !existingIds.has(v.osmId)).map((v) => v.osmId)))
    }
  }, [venues, existingIds])

  const toggleAll = useCallback(() => {
    const pool = selectMode === 'all'
      ? venues.map((v) => v.osmId)
      : venues.filter((v) => !existingIds.has(v.osmId)).map((v) => v.osmId)
    if (selected.size === pool.length) setSelected(new Set())
    else setSelected(new Set(pool))
  }, [venues, existingIds, selected, selectMode])

  const newCount     = venues.filter((v) => !existingIds.has(v.osmId)).length
  const alreadyCount = venues.filter((v) => existingIds.has(v.osmId)).length

  return (
    <section className="mt-4 rounded-2xl border border-stone-200 bg-white p-5">
      <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-stone-900">
        <Landmark size={18} className="text-teal-500" /> Attractions import
      </h2>
      <p className="mt-0.5 text-xs text-stone-500">
        Pull parks, piers, museums, castles and landmarks from OpenStreetMap.
        These are listed as publicly managed attractions — not claimable by merchants.
      </p>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-stone-600">Area</label>
          <select
            value={cityId}
            onChange={(e) => { setCityId(e.target.value); setVenues([]); setFetchState('idle') }}
            className="rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-teal-400"
          >
            {OSM_CITIES.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <button
          onClick={handleFetch}
          disabled={fetchState === 'fetching' || fetchState === 'importing'}
          className="flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
        >
          {fetchState === 'fetching'
            ? <><Loader2 size={15} className="animate-spin" /> Fetching…</>
            : <><Globe size={15} /> Fetch attractions from OSM</>}
        </button>

        {(fetchState === 'done' || fetchState === 'importing') && selected.size > 0 && (
          <button
            onClick={handleImport}
            disabled={fetchState === 'importing'}
            className="flex items-center gap-2 rounded-xl bg-teal-500 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-600 disabled:opacity-50"
          >
            {fetchState === 'importing'
              ? <><Loader2 size={15} className="animate-spin" /> Importing…</>
              : <><Download size={15} /> {selected.size} selected — import / update</>}
          </button>
        )}
      </div>

      {/* Progress bar — shown while sub-queries run sequentially */}
      {fetchState === 'fetching' && fetchProgress && (
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-xs text-stone-500">
            <span>
              {fetchProgress.done < fetchProgress.total
                ? <>Fetching <span className="font-medium text-teal-700">{FETCH_STEP_LABELS[fetchProgress.done]}</span>…</>
                : 'Finishing up…'}
            </span>
            <span>{fetchProgress.done} / {fetchProgress.total}</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
            <div
              className="h-full rounded-full bg-teal-500 transition-all duration-300"
              style={{ width: `${(fetchProgress.done / fetchProgress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {fetchError && (
        <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{fetchError}</p>
      )}

      {importResult && (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
          <span className="flex items-center gap-1.5"><Check size={14} /> Done</span>
          {importResult.inserted > 0 && <span>{importResult.inserted} new attractions added</span>}
          {importResult.updated  > 0 && <span>{importResult.updated} refreshed</span>}
        </div>
      )}

      {venues.length > 0 && (
        <div className="mt-4">
          <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500">
            <span>{venues.length} attractions fetched</span>
            <span className="text-emerald-600">{newCount} new</span>
            {alreadyCount > 0 && <span className="text-stone-400">{alreadyCount} already in DB</span>}
            {alreadyCount > 0 && (
              <div className="ml-auto flex gap-1 rounded-lg border border-stone-200 p-0.5">
                {(['new', 'all'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => handleSelectModeChange(m)}
                    className={clsx(
                      'rounded-md px-2.5 py-1 text-xs font-medium transition',
                      selectMode === m ? 'bg-stone-900 text-white' : 'text-stone-500 hover:text-stone-800',
                    )}
                  >
                    {m === 'new' ? 'New only' : 'All (re-import)'}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="mt-2 max-h-96 overflow-y-auto rounded-xl border border-stone-200">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-stone-50 text-left text-xs text-stone-500">
                <tr>
                  <th className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selected.size > 0 && selected.size === (selectMode === 'all' ? venues.length : newCount)}
                      onChange={toggleAll}
                      className="rounded"
                    />
                  </th>
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Type</th>
                  <th className="px-3 py-2 font-medium">Area</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {venues.map((v) => {
                  const already    = existingIds.has(v.osmId)
                  const isSelected = selected.has(v.osmId)
                  return (
                    <tr
                      key={v.osmId}
                      className={clsx('transition', already ? 'bg-stone-50/60' : 'hover:bg-stone-50')}
                    >
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            setSelected((prev) => {
                              const next = new Set(prev)
                              if (next.has(v.osmId)) next.delete(v.osmId)
                              else next.add(v.osmId)
                              return next
                            })
                          }}
                          className="rounded"
                        />
                      </td>
                      <td className="px-3 py-2 font-medium text-stone-900">{v.name}</td>
                      <td className="px-3 py-2 text-stone-500">{v.cuisine ?? 'Attraction'}</td>
                      <td className="px-3 py-2 text-stone-500">{v.neighbourhood}</td>
                      <td className="px-3 py-2">
                        {already ? (
                          <span className="rounded-full bg-sky-50 px-2 py-0.5 text-xs text-sky-600">In DB</span>
                        ) : (
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-600">New</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  )
}

// ─── Seed Reviews panel ───────────────────────────────────────────────────────

function ReviewsPanel() {
  const { importedBusinesses } = useStore()
  const [state, setState]           = useState<'idle' | 'working' | 'done'>('idle')
  const [progress, setProgress]     = useState('')
  const [result, setResult]         = useState<{ inserted: number } | null>(null)
  const [error, setError]           = useState<string | null>(null)
  const [regenerate, setRegenerate] = useState(false)

  const handleGenerate = useCallback(async () => {
    if (importedBusinesses.length === 0) return
    setState('working')
    setError(null)
    setResult(null)

    try {
      // If regenerating, wipe existing seed reviews first
      if (regenerate) {
        setProgress('Clearing existing seed reviews…')
        await db.deleteSeedReviews(importedBusinesses.map((b) => b.id))
      }

      // Generate reviews in batches of 50 to avoid huge payloads
      const BATCH = 50
      let totalInserted = 0
      for (let i = 0; i < importedBusinesses.length; i += BATCH) {
        const batch = importedBusinesses.slice(i, i + BATCH)
        setProgress(`Generating reviews… ${Math.min(i + BATCH, importedBusinesses.length)} / ${importedBusinesses.length} venues`)
        const reviews = batch.flatMap(generateReviews)
        const { inserted } = await db.bulkSeedReviews(reviews)
        totalInserted += inserted
      }

      setResult({ inserted: totalInserted })
      setState('done')
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setState('idle')
    }
  }, [importedBusinesses, regenerate])

  return (
    <section className="mt-4 rounded-2xl border border-stone-200 bg-white p-5">
      <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-stone-900">
        <Sparkles size={18} className="text-brand-500" /> Seed reviews
      </h2>
      <p className="mt-0.5 text-xs text-stone-500">
        Auto-generate 2–6 realistic reviews per imported venue. Reviews are varied by
        rating, writing style and venue type — no two businesses get the same text.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span className="text-sm text-stone-600">
          {importedBusinesses.length} imported venues loaded
        </span>

        <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-600">
          <input
            type="checkbox"
            checked={regenerate}
            onChange={(e) => setRegenerate(e.target.checked)}
            className="rounded"
          />
          Re-generate (wipe existing seed reviews first)
        </label>

        <button
          onClick={handleGenerate}
          disabled={state === 'working' || importedBusinesses.length === 0}
          className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
        >
          {state === 'working'
            ? <><Loader2 size={15} className="animate-spin" /> Working…</>
            : regenerate
              ? <><RefreshCw size={15} /> Regenerate reviews</>
              : <><Sparkles size={15} /> Generate reviews</>}
        </button>
      </div>

      {state === 'working' && (
        <p className="mt-3 text-xs text-stone-500">{progress}</p>
      )}

      {error && (
        <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>
      )}

      {result && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
          <Check size={14} />
          {result.inserted > 0
            ? `${result.inserted} reviews inserted across ${importedBusinesses.length} venues.`
            : 'All venues already have seed reviews. Enable "Re-generate" to replace them.'}
        </div>
      )}
    </section>
  )
}

// ─── Main Admin page ──────────────────────────────────────────────────────────

export default function Admin() {
  const {
    allReviews,
    allDeals,
    bookings,
    vouchers,
    orders,
    submissions,
    isReviewHidden,
    toggleReviewHidden,
    isBusinessHidden,
    toggleBusinessHidden,
    approveSubmission,
    rejectSubmission,
  } = useStore()

  const [subTab, setSubTab] = useState<'pending' | 'approved' | 'rejected'>('pending')
  const [rejectNote, setRejectNote] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const filteredSubs = submissions.filter((s) => s.status === subTab)
  const pendingCount = submissions.filter((s) => s.status === 'pending').length

  async function handleApprove(id: string) {
    setActionError(null)
    setBusy(id)
    try {
      await approveSubmission(id)
    } catch (err) {
      console.error(err)
      setActionError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(null)
    }
  }

  async function handleReject(id: string) {
    setActionError(null)
    setBusy(id)
    try {
      await rejectSubmission(id, rejectNote[id])
    } catch (err) {
      console.error(err)
      setActionError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(null)
    }
  }

  const revenue =
    vouchers.reduce((s, v) => s + v.dealPrice, 0) + orders.reduce((s, o) => s + o.total, 0)
  const avgRating = businesses.reduce((s, b) => s + b.rating, 0) / businesses.length

  const byCity = cities.map((c) => ({
    label: c.name,
    value: businesses.filter((b) => b.cityId === c.id).length,
  }))
  const byCategory = categories.map((c) => ({
    label: c.label,
    value: businesses.filter((b) => b.category === c.id).length,
  }))
  const ratingBands = [
    { label: '4.5★ +', test: (r: number) => r >= 4.5 },
    { label: '4.0–4.5', test: (r: number) => r >= 4 && r < 4.5 },
    { label: '3.5–4.0', test: (r: number) => r >= 3.5 && r < 4 },
    { label: 'Under 3.5', test: (r: number) => r < 3.5 },
  ].map((b) => ({ label: b.label, value: businesses.filter((x) => b.test(x.rating)).length }))

  const recentReviews = allReviews.slice(0, 8)

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-stone-900 text-white">
            <BarChart3 size={18} />
          </span>
          <div>
            <h1 className="font-display text-xl font-semibold text-stone-900">Admin console</h1>
            <p className="text-xs text-stone-500">Gander platform overview · internal</p>
          </div>
        </div>
        <Link to="/" className="text-sm font-medium text-brand-600 hover:underline">
          ← Back to app
        </Link>
      </div>

      {/* Stats */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        <StatCard icon={Building2} label="Venues" value={businesses.length} tint="bg-stone-100 text-stone-700" />
        <StatCard icon={MessageSquare} label="Reviews" value={allReviews.length} tint="bg-sky-100 text-sky-700" />
        <StatCard icon={Tag} label="Deals" value={allDeals.length} tint="bg-emerald-100 text-emerald-700" />
        <StatCard icon={Star} label="Avg rating" value={avgRating.toFixed(2)} tint="bg-amber-100 text-amber-700" />
        <StatCard icon={CalendarCheck} label="Bookings" value={bookings.length} tint="bg-violet-100 text-violet-700" />
        <StatCard icon={Ticket} label="Vouchers" value={vouchers.length} tint="bg-rose-100 text-rose-700" />
        <StatCard icon={Bike} label="Orders" value={orders.length} tint="bg-orange-100 text-orange-700" />
        <StatCard icon={PoundSterling} label="Revenue" value={formatPrice(revenue)} tint="bg-brand-100 text-brand-700" />
      </div>

      {/* Charts */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <ChartCard title="Venues by city" rows={byCity} colour="bg-brand-400" />
        <ChartCard title="Venues by category" rows={byCategory} colour="bg-sky-400" />
        <ChartCard title="Ratings distribution" rows={ratingBands} colour="bg-amber-400" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.1fr]">
        {/* Moderation: reviews */}
        <section className="rounded-2xl border border-stone-200 bg-white p-5">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-stone-900">
            <MessageSquare size={18} className="text-brand-500" /> Recent reviews
          </h2>
          <p className="mt-0.5 text-xs text-stone-500">Hide anything that breaks the guidelines.</p>
          <div className="mt-2 divide-y divide-stone-100">
            {recentReviews.map((r) => {
              const hidden = isReviewHidden(r.id)
              const biz = businessesById[r.businessId]
              return (
                <div key={r.id} className={clsx('flex gap-3 py-3', hidden && 'opacity-50')}>
                  <Avatar name={r.authorName} src={r.authorAvatar} size={36} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-stone-900">{r.authorName}</span>
                      <Stars value={r.rating} size={12} />
                      {biz && <span className="truncate text-xs text-stone-400">· {biz.name}</span>}
                    </div>
                    <p className="line-clamp-2 text-sm text-stone-600">{r.body}</p>
                  </div>
                  <button
                    onClick={() => toggleReviewHidden(r.id)}
                    className={clsx(
                      'flex h-8 shrink-0 items-center gap-1 self-start rounded-full border px-2.5 text-xs font-medium transition',
                      hidden
                        ? 'border-stone-200 text-stone-500 hover:bg-stone-50'
                        : 'border-rose-200 text-rose-600 hover:bg-rose-50',
                    )}
                  >
                    {hidden ? <Eye size={13} /> : <EyeOff size={13} />}
                    {hidden ? 'Show' : 'Hide'}
                  </button>
                </div>
              )
            })}
          </div>
        </section>

        {/* Moderation: venues */}
        <section className="rounded-2xl border border-stone-200 bg-white p-5">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-stone-900">
            <Building2 size={18} className="text-brand-500" /> Venues
          </h2>
          <p className="mt-0.5 text-xs text-stone-500">
            {businesses.length} venues · hidden venues are removed from discovery.
          </p>
          <div className="mt-2 max-h-[28rem] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white text-left text-xs text-stone-400">
                <tr>
                  <th className="py-2 font-medium">Venue</th>
                  <th className="py-2 font-medium">City</th>
                  <th className="py-2 text-right font-medium">Rating</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {businesses.map((b) => {
                  const hidden = isBusinessHidden(b.id)
                  return (
                    <tr key={b.id} className={clsx(hidden && 'opacity-50')}>
                      <td className="py-2 pr-2">
                        <Link to={`/b/${b.slug}`} className="font-medium text-stone-900 hover:text-brand-600">
                          {b.name}
                        </Link>
                        <div className="text-xs text-stone-400">
                          {categoryMap[b.category].label} · {priceLevel(b.priceLevel)}
                        </div>
                      </td>
                      <td className="py-2 pr-2 text-stone-500">{b.city}</td>
                      <td className="py-2 text-right">
                        <span className="font-semibold text-stone-800">{b.rating.toFixed(1)}</span>
                        <span className="ml-1 text-xs text-stone-400">({b.reviewCount})</span>
                      </td>
                      <td className="py-2 pl-2 text-right">
                        <button
                          onClick={() => toggleBusinessHidden(b.id)}
                          className={clsx(
                            'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition',
                            hidden
                              ? 'border-stone-200 text-stone-500 hover:bg-stone-50'
                              : 'border-rose-200 text-rose-600 hover:bg-rose-50',
                          )}
                        >
                          {hidden ? <Eye size={12} /> : <EyeOff size={12} />}
                          {hidden ? 'Show' : 'Hide'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Business applications */}
      <section className="mt-4 rounded-2xl border border-stone-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-stone-900">
            <Building2 size={18} className="text-brand-500" /> Business applications
            {pendingCount > 0 && (
              <span className="rounded-full bg-brand-500 px-2 py-0.5 text-xs font-semibold text-white">
                {pendingCount} pending
              </span>
            )}
          </h2>
          <div className="flex gap-1 rounded-xl border border-stone-200 p-0.5 text-sm">
            {(['pending', 'approved', 'rejected'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setSubTab(t)}
                className={clsx(
                  'rounded-lg px-3 py-1.5 font-medium capitalize transition',
                  subTab === t ? 'bg-stone-900 text-white' : 'text-stone-500 hover:text-stone-800',
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {actionError && (
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <X size={15} className="mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold">Action failed: </span>{actionError}
              <span className="ml-2 text-xs text-rose-500">(Check Supabase RLS policies)</span>
            </div>
          </div>
        )}

        {filteredSubs.length === 0 ? (
          <p className="mt-4 text-sm text-stone-400">No {subTab} applications.</p>
        ) : (
          <div className="mt-3 divide-y divide-stone-100">
            {filteredSubs.map((s) => (
              <div key={s.id} className="py-4">
                <div className="flex flex-wrap items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                    <Building2 size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-stone-900">{s.name}</p>
                    <p className="text-sm text-stone-500">
                      {s.neighbourhood}, {s.city} · {s.category} · {'£'.repeat(s.priceLevel)}
                    </p>
                    <p className="text-xs text-stone-400">{s.address}, {s.postcode}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-stone-600">{s.shortDescription || s.description}</p>
                    <p className="mt-1 text-xs text-stone-400">
                      Contact: {s.submitterEmail} · Submitted {new Date(s.submittedAt).toLocaleDateString('en-GB')}
                    </p>
                  </div>
                  {s.status === 'pending' && (
                    <div className="flex shrink-0 flex-col gap-2">
                      <button
                        onClick={() => handleApprove(s.id)}
                        disabled={busy === s.id}
                        className="flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
                      >
                        {busy === s.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(s.id)}
                        disabled={busy === s.id}
                        className="flex items-center gap-1.5 rounded-full border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                      >
                        <X size={12} /> Reject
                      </button>
                    </div>
                  )}
                  {s.status === 'approved' && (
                    <Link to={`/b/${s.slug}`} className="shrink-0 text-xs font-medium text-brand-600 hover:underline">
                      View listing →
                    </Link>
                  )}
                </div>
                {s.status === 'pending' && (
                  <input
                    value={rejectNote[s.id] ?? ''}
                    onChange={(e) => setRejectNote((prev) => ({ ...prev, [s.id]: e.target.value }))}
                    placeholder="Optional rejection note…"
                    className="mt-2 w-full rounded-lg border border-stone-200 px-3 py-2 text-xs outline-none focus:border-brand-400"
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* OSM Import — businesses */}
      <ImportPanel />

      {/* OSM Import — attractions */}
      <AttractionsPanel />

      {/* Seed reviews */}
      <ReviewsPanel />

      {/* Business outreach (Worthing etc.) */}
      <OutreachPanel />
    </div>
  )
}
