import { useState, useRef, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import leafletCSS from 'leaflet/dist/leaflet.css?inline'

const LEAFLET_STYLE_ID = 'leaflet-dynamic-css'

function mountLeafletCSS() {
  const el = document.getElementById(LEAFLET_STYLE_ID)
  if (el) {
    el.dataset.refs = String(Number(el.dataset.refs || 0) + 1)
  } else {
    const style = document.createElement('style')
    style.id = LEAFLET_STYLE_ID
    style.textContent = leafletCSS
    style.dataset.refs = '1'
    document.head.appendChild(style)
  }
}

function unmountLeafletCSS() {
  const el = document.getElementById(LEAFLET_STYLE_ID)
  if (!el) return
  const refs = Number(el.dataset.refs || 1) - 1
  if (refs <= 0) el.remove()
  else el.dataset.refs = String(refs)
}

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

async function forwardGeocode(query) {
  try {
    const res  = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=ph&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } }
    )
    return await res.json()
  } catch {
    return []
  }
}

export default function MapPicker({ label = 'Pickup address', address, onAddressChange, onCoordsChange }) {
  const [position,     setPosition]     = useState(null)
  const [detecting,    setDetecting]    = useState(false)
  const [geocoding,    setGeocoding]    = useState(false)
  const [suggestions,  setSuggestions]  = useState([])
  const [searching,    setSearching]    = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const mapRef      = useRef(null)
  const debounceRef = useRef(null)
  const wrapperRef  = useRef(null)

  useEffect(() => {
    mountLeafletCSS()
    return unmountLeafletCSS
  }, [])

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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

  function handleAddressInput(e) {
    const val = e.target.value
    onAddressChange(val)
    clearTimeout(debounceRef.current)
    if (val.trim().length < 3) { setSuggestions([]); setShowDropdown(false); return }
    setSearching(true)
    debounceRef.current = setTimeout(async () => {
      const results = await forwardGeocode(val)
      setSuggestions(results)
      setShowDropdown(results.length > 0)
      setSearching(false)
    }, 400)
  }

  async function selectSuggestion(place) {
    const latlng = { lat: parseFloat(place.lat), lng: parseFloat(place.lon) }
    setSuggestions([])
    setShowDropdown(false)
    onAddressChange(place.display_name)
    setPosition(latlng)
    onCoordsChange?.(latlng)
    mapRef.current?.flyTo(latlng, 16, { animate: true })
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
        {position ? 'Pin placed. Click the map or select a new result below to adjust.' : 'Search and select a result below, or click directly on the map to drop a pin.'}
      </p>

      {/* Editable address field + suggestions */}
      <div className="relative" ref={wrapperRef}>
        <input
          type="text"
          value={address}
          onChange={handleAddressInput}
          onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
          placeholder="Search for an address, then select a result"
          className={inputCls}
        />
        {(geocoding || searching) && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 inline-block w-4 h-4 rounded-full border-2 border-[#1B6CA8]/30 border-t-[#1B6CA8] animate-spin" />
        )}
        {showDropdown && (
          <ul className="absolute z-[9999] left-0 right-0 top-full mt-1 bg-white border border-[#e5e7eb] rounded-xl shadow-lg overflow-hidden">
            {suggestions.map((place, i) => (
              <li key={i}>
                <button
                  type="button"
                  onMouseDown={() => selectSuggestion(place)}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-[#F4F7FA] flex items-start gap-2.5 border-b border-[#f3f4f6] last:border-0"
                >
                  <svg className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[#1B6CA8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="leading-snug">{place.display_name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

    </div>
  )
}
