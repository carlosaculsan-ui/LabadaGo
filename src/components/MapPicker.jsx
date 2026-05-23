import { useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet's broken default icons in Vite
const markerIcon = new L.Icon({
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize:    [25, 41],
  iconAnchor:  [12, 41],
  shadowSize:  [41, 41],
})

const MANILA = [14.5995, 120.9842]

async function reverseGeocode(lat, lng) {
  try {
    const res  = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'Accept-Language': 'en' } }
    )
    const data = await res.json()
    return data.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
  }
}

function ClickHandler({ onMapClick }) {
  useMapEvents({ click: e => onMapClick(e.latlng) })
  return null
}

export default function MapPicker({ label = 'Pickup address', address, onAddressChange, onCoordsChange }) {
  const [position,  setPosition]  = useState(null)
  const [detecting, setDetecting] = useState(false)
  const [geocoding, setGeocoding] = useState(false)
  const mapRef = useRef(null)

  async function placeMarker(latlng) {
    setPosition(latlng)
    onCoordsChange?.(latlng)
    setGeocoding(true)
    const addr = await reverseGeocode(latlng.lat, latlng.lng)
    onAddressChange(addr)
    setGeocoding(false)
  }

  function handleAutoDetect() {
    if (!navigator.geolocation) return
    setDetecting(true)
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const latlng = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        mapRef.current?.flyTo(latlng, 16, { animate: true })
        await placeMarker(latlng)
        setDetecting(false)
      },
      () => setDetecting(false),
      { timeout: 10000 }
    )
  }

  const inputCls = 'w-full border border-[#e5e7eb] rounded-lg px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-[#1B6CA8]/25 focus:border-[#1B6CA8] transition-colors'

  return (
    <div className="space-y-3">

      {/* Label + auto-detect button row */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-600">{label}</p>
        <button
          type="button"
          onClick={handleAutoDetect}
          disabled={detecting}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#1B6CA8] hover:text-[#155a8a] disabled:opacity-50 transition-colors"
        >
          {detecting ? (
            <span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-[#1B6CA8]/30 border-t-[#1B6CA8] animate-spin" />
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0013 3.06V1h-2v2.06A8.994 8.994 0 003.06 11H1v2h2.06A8.994 8.994 0 0011 20.94V23h2v-2.06A8.994 8.994 0 0020.94 13H23v-2h-2.06z" />
            </svg>
          )}
          {detecting ? 'Detecting…' : 'Auto-detect location'}
        </button>
      </div>

      {/* Map */}
      <div className="rounded-xl overflow-hidden border border-[#e5e7eb] h-[220px] z-0">
        <MapContainer
          center={MANILA}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <ClickHandler onMapClick={placeMarker} />
          {position && <Marker position={position} icon={markerIcon} />}
        </MapContainer>
      </div>

      <p className="text-[11px] text-gray-400">
        {position ? 'Drag the map or click again to adjust.' : 'Click anywhere on the map to drop a pin.'}
      </p>

      {/* Editable address field */}
      <div className="relative">
        <input
          type="text"
          value={address}
          onChange={e => onAddressChange(e.target.value)}
          placeholder="Address will appear here after selecting on map"
          className={inputCls}
        />
        {geocoding && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 inline-block w-4 h-4 rounded-full border-2 border-[#1B6CA8]/30 border-t-[#1B6CA8] animate-spin" />
        )}
      </div>

    </div>
  )
}
