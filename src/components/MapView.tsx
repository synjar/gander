import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export interface MapPoint {
  id: string
  name: string
  lat: number
  lng: number
  slug: string
  rating?: number
  neighbourhood?: string
}

function pin(label?: string): L.DivIcon {
  const inner = label ? `★ ${label}` : '●'
  return L.divIcon({
    className: 'gander-pin',
    html: `<div style="display:flex;align-items:center;gap:2px;background:#f96a16;color:#fff;font:600 12px/1 Inter,system-ui,sans-serif;padding:4px 7px;border-radius:999px;box-shadow:0 1px 5px rgba(0,0,0,.35);white-space:nowrap;border:2px solid #fff;">${inner}</div>`,
    iconSize: [42, 24],
    iconAnchor: [21, 24],
    popupAnchor: [0, -22],
  })
}

function Recenter({
  points,
  center,
  zoom,
}: {
  points: MapPoint[]
  center?: [number, number]
  zoom: number
}) {
  const map = useMap()
  useEffect(() => {
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
  }, [points, center, zoom, map])
  return null
}

interface Props {
  points: MapPoint[]
  className?: string
  interactive?: boolean
  zoom?: number
  center?: [number, number]
}

export default function MapView({ points, className, interactive = true, zoom = 13, center }: Props) {
  const initialCenter: [number, number] = points[0]
    ? [points[0].lat, points[0].lng]
    : center ?? [51.5074, -0.1278]

  return (
    <MapContainer
      center={initialCenter}
      zoom={zoom}
      scrollWheelZoom={false}
      className={className}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      {points.map((p) => (
        <Marker key={p.id} position={[p.lat, p.lng]} icon={pin(p.rating?.toFixed(1))}>
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
      ))}
      <Recenter points={points} center={center} zoom={zoom} />
    </MapContainer>
  )
}
