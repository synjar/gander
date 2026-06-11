import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'

export interface MapPoint {
  id: string
  name: string
  lat: number
  lng: number
  slug: string
  rating?: number
  neighbourhood?: string
  /** Category emoji shown inside the pin (Dianping-style). */
  emoji?: string
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string))
}

/** Classic brand pill — used on single-venue mini maps (e.g. the listing sidebar). */
function pillPin(label?: string): L.DivIcon {
  const inner = label ? `★ ${label}` : '●'
  return L.divIcon({
    className: 'gander-pin',
    html: `<div style="display:flex;align-items:center;gap:2px;background:#f96a16;color:#fff;font:600 12px/1 Inter,system-ui,sans-serif;padding:4px 7px;border-radius:999px;box-shadow:0 1px 5px rgba(0,0,0,.35);white-space:nowrap;border:2px solid #fff;">${inner}</div>`,
    iconSize: [42, 24],
    iconAnchor: [21, 24],
    popupAnchor: [0, -22],
  })
}

/**
 * Dianping-style venue pin: a small white circle with the category emoji.
 * The selected venue grows into a labelled pill so it stands out from the crowd.
 */
function venuePin(p: MapPoint, selected: boolean): L.DivIcon {
  const emoji = p.emoji ?? '📍'
  if (!selected) {
    return L.divIcon({
      className: 'gander-pin',
      html: `<div style="display:grid;place-items:center;width:30px;height:30px;background:#fff;border:1.5px solid #e7e5e4;border-radius:50%;font-size:15px;box-shadow:0 1px 4px rgba(0,0,0,.18)">${emoji}</div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    })
  }
  const name = escapeHtml(p.name.length > 22 ? p.name.slice(0, 21) + '…' : p.name)
  const rating = p.rating ? ` <span style="opacity:.9">★ ${p.rating.toFixed(1)}</span>` : ''
  return L.divIcon({
    className: 'gander-pin-selected',
    html: `<div style="transform:translateX(-50%);display:inline-flex;align-items:center;gap:5px;background:#f96a16;color:#fff;font:600 13px/1 Inter,system-ui,sans-serif;padding:7px 11px;border-radius:999px;box-shadow:0 3px 10px rgba(0,0,0,.35);white-space:nowrap;border:2px solid #fff"><span style="font-size:14px">${emoji}</span>${name}${rating}</div>`,
    iconSize: [0, 36],
    iconAnchor: [0, 36],
  })
}

function userPin(): L.DivIcon {
  return L.divIcon({
    className: 'gander-user-pin',
    html: `<div style="width:16px;height:16px;background:#2563eb;border:3px solid #fff;border-radius:50%;box-shadow:0 0 0 3px rgba(37,99,235,.25),0 1px 4px rgba(0,0,0,.4)"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -10],
  })
}

/**
 * Frames the map on mount, when the user's location arrives, or when the
 * city centre changes — but deliberately NOT when points change, so toggling
 * filters never yanks the viewport around.
 */
function Recenter({
  points,
  center,
  zoom,
  userLocation,
}: {
  points: MapPoint[]
  center?: [number, number]
  zoom: number
  userLocation?: [number, number]
}) {
  const map = useMap()
  const centerKey = center ? `${center[0]},${center[1]}` : ''
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (userLocation) {
      map.setView(userLocation, Math.max(zoom, 14))
      return
    }
    if (points.length === 0) {
      if (center) map.setView(center, zoom)
      return
    }
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 15)
      return
    }
    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number]))
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 })
  }, [map, userLocation, centerKey])
  return null
}

/** Glide to the selected venue (zooming in enough to break it out of clusters). */
function PanToSelected({ point }: { point?: MapPoint }) {
  const map = useMap()
  useEffect(() => {
    if (point) {
      map.setView([point.lat, point.lng], Math.max(map.getZoom(), 16), { animate: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [point?.id])
  return null
}

/**
 * Renders the venue markers inside a marker-cluster group so dense areas
 * collapse into a single count bubble that splits apart as you zoom in.
 * Hover shows the name; click selects the venue (or opens it when no
 * selection handler is wired up).
 */
function ClusterLayer({
  points,
  interactive,
  selectedId,
  onSelect,
}: {
  points: MapPoint[]
  interactive: boolean
  selectedId?: string | null
  onSelect?: (id: string) => void
}) {
  const map = useMap()
  const navigate = useNavigate()
  useEffect(() => {
    const group = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 55,
      iconCreateFunction: (cluster) => {
        const n = cluster.getChildCount()
        const size = n < 10 ? 34 : n < 50 ? 42 : 50
        return L.divIcon({
          html: `<div style="display:grid;place-items:center;width:${size}px;height:${size}px;background:#fff;color:#ea5009;font:700 13px/1 Inter,system-ui,sans-serif;border-radius:50%;border:2.5px solid #f96a16;box-shadow:0 2px 8px rgba(0,0,0,.22)">${n}</div>`,
          className: 'gander-cluster',
          iconSize: L.point(size, size),
        })
      },
    })
    for (const p of points) {
      const selected = p.id === selectedId
      const marker = L.marker([p.lat, p.lng], {
        icon: venuePin(p, selected),
        zIndexOffset: selected ? 1000 : 0,
      })
      if (interactive) {
        if (!selected) marker.bindTooltip(escapeHtml(p.name), { direction: 'top', offset: L.point(0, -16) })
        marker.on('click', () => (onSelect ? onSelect(p.id) : navigate(`/b/${p.slug}`)))
      }
      group.addLayer(marker)
    }
    map.addLayer(group)
    return () => {
      map.removeLayer(group)
    }
  }, [points, map, navigate, interactive, selectedId, onSelect])
  return null
}

interface Props {
  points: MapPoint[]
  className?: string
  interactive?: boolean
  zoom?: number
  center?: [number, number]
  /** When provided, the map starts here with a "you are here" marker. */
  userLocation?: [number, number]
  /** Group dense markers into clusters (for the full map page). */
  cluster?: boolean
  /** Controlled selection — the selected venue gets a labelled pill pin. */
  selectedId?: string | null
  /** Marker click handler; when set, clicks select instead of navigating. */
  onSelect?: (id: string) => void
  /** Allow zooming with the scroll wheel (on by default for the map page). */
  wheelZoom?: boolean
}

export default function MapView({
  points,
  className,
  interactive = true,
  zoom = 13,
  center,
  userLocation,
  cluster = false,
  selectedId,
  onSelect,
  wheelZoom = false,
}: Props) {
  const initialCenter: [number, number] = userLocation
    ? userLocation
    : points[0]
      ? [points[0].lat, points[0].lng]
      : center ?? [51.5074, -0.1278]
  const selectedPoint = selectedId ? points.find((p) => p.id === selectedId) : undefined

  return (
    <MapContainer
      center={initialCenter}
      zoom={zoom}
      scrollWheelZoom={wheelZoom}
      zoomControl={!cluster} // full-page map: chips sit top-left; pinch/wheel/dbl-click zoom instead
      className={className}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      {cluster ? (
        <ClusterLayer points={points} interactive={interactive} selectedId={selectedId} onSelect={onSelect} />
      ) : (
        points.map((p) => (
          <Marker key={p.id} position={[p.lat, p.lng]} icon={pillPin(p.rating?.toFixed(1))}>
            {interactive && (
              <Popup>
                <Link to={`/b/${p.slug}`} style={{ color: '#1c1917', textDecoration: 'none' }}>
                  <span style={{ fontWeight: 600, display: 'block' }}>{p.name}</span>
                  <span style={{ color: '#78716c', fontSize: 12 }}>
                    {p.rating ? `★ ${p.rating.toFixed(1)}` : ''}
                    {p.neighbourhood ? ` · ${p.neighbourhood}` : ''}
                  </span>
                  <span style={{ color: '#ea5009', fontSize: 12, fontWeight: 600, display: 'block', marginTop: 4 }}>
                    View page →
                  </span>
                </Link>
              </Popup>
            )}
          </Marker>
        ))
      )}
      {userLocation && (
        <Marker position={userLocation} icon={userPin()}>
          <Popup>You are here</Popup>
        </Marker>
      )}
      <Recenter points={points} center={center} zoom={zoom} userLocation={userLocation} />
      <PanToSelected point={selectedPoint} />
    </MapContainer>
  )
}
