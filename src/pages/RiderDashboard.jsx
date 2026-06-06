import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet'
import {
  collection, query, where, onSnapshot,
  updateDoc, doc, getDoc, serverTimestamp,
} from 'firebase/firestore'
import {
  signOut, updatePassword,
  reauthenticateWithCredential, EmailAuthProvider,
} from 'firebase/auth'
import { auth, db } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'

// ─── Leaflet icons ────────────────────────────────────────────────────────────

const RIDER_ICON = L.divIcon({
  className: '',
  iconSize:   [40, 40],
  iconAnchor: [20, 20],
  html: `<div style="width:40px;height:40px;border-radius:50%;background:#1B6CA8;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 3px 10px rgba(0,0,0,0.35);">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12 2.5L4.5 21l.5.5L12 18.5l7 3 .5-.5L12 2.5z"/></svg>
  </div>`,
})

const DEST_ICON = L.divIcon({
  className: '',
  iconSize:   [40, 48],
  iconAnchor: [20, 48],
  html: `<div style="display:flex;flex-direction:column;align-items:center;">
    <div style="width:40px;height:40px;border-radius:10px;background:#0A2540;display:flex;align-items:center;justify-content:center;border:2.5px solid white;box-shadow:0 3px 10px rgba(0,0,0,0.35);">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
    </div>
    <div style="width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:9px solid #0A2540;margin-top:-1px;"></div>
  </div>`,
})

// ─── Static data ──────────────────────────────────────────────────────────────

const NAV_ICONS = {
  dashboard: (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  ),
  deliveries: (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
    </svg>
  ),
  earnings: (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  profile: (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  ),
}

const NAV_ITEMS = [
  { id: 'dashboard',  label: 'Dashboard'    },
  { id: 'deliveries', label: 'My Deliveries' },
  { id: 'earnings',   label: 'Earnings'      },
  { id: 'profile',    label: 'Profile'       },
]

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const MONTH_FULL  = ['January','February','March','April','May','June','July','August','September','October','November','December']

const ACTIVE_STATUSES = new Set(['PICKUP_EN_ROUTE', 'PICKED_UP', 'DELIVERY_EN_ROUTE'])

const ACTIVE_ACTION = {
  PICKUP_EN_ROUTE:   { label: 'Mark as picked up', next: 'PICKED_UP'       },
  PICKED_UP:         { label: 'Arrived at shop',   next: 'ARRIVED_AT_SHOP' },
  DELIVERY_EN_ROUTE: { label: 'Mark as delivered', next: 'COMPLETED'       },
}

const STATUS_LABEL = {
  ACCEPTED:           'Accepted',
  PICKUP_EN_ROUTE:    'Pickup en route',
  PICKED_UP:          'Picked up',
  ARRIVED_AT_SHOP:    'Arrived at shop',
  PROCESSING:         'Processing',
  READY_FOR_DELIVERY: 'Ready for delivery',
  DELIVERY_EN_ROUTE:  'Delivery en route',
  COMPLETED:          'Completed',
  CANCELLED:          'Cancelled',
}

const STATUS_PILL = {
  ACCEPTED:           'bg-[#DBEAFE] text-[#1B6CA8]',
  PICKUP_EN_ROUTE:    'bg-amber-100 text-amber-700',
  PICKED_UP:          'bg-purple-100 text-purple-700',
  ARRIVED_AT_SHOP:    'bg-purple-100 text-purple-700',
  PROCESSING:         'bg-blue-100 text-blue-700',
  READY_FOR_DELIVERY: 'bg-green-100 text-green-700',
  DELIVERY_EN_ROUTE:  'bg-sky-100 text-sky-700',
  COMPLETED:          'bg-gray-100 text-gray-600',
  CANCELLED:          'bg-red-100 text-red-500',
}

const TIMELINE_STEPS = [
  { key: 'PICKUP_EN_ROUTE',   label: 'Pickup\nen route'  },
  { key: 'PICKED_UP',         label: 'Picked\nup'        },
  { key: 'ARRIVED_AT_SHOP',   label: 'At\nshop'          },
  { key: 'DELIVERY_EN_ROUTE', label: 'En\nroute'         },
  { key: 'COMPLETED',         label: 'Delivered'          },
]

const VEHICLE_TYPES = ['Motorcycle', 'Bicycle', 'E-bike', 'Scooter', 'Car']

const DATE_FILTERS = [
  { id: 'today', label: 'Today'      },
  { id: 'week',  label: 'This Week'  },
  { id: 'month', label: 'This Month' },
  { id: 'all',   label: 'All Time'   },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isToday(ts) {
  if (!ts?.toDate) return false
  const d = ts.toDate(), t = new Date()
  return d.getFullYear() === t.getFullYear() &&
         d.getMonth()    === t.getMonth()    &&
         d.getDate()     === t.getDate()
}

function isThisWeek(ts) {
  if (!ts?.toDate) return false
  const d   = ts.toDate()
  const now = new Date()
  const mon = new Date(now)
  mon.setDate(now.getDate() - now.getDay() + 1)
  mon.setHours(0, 0, 0, 0)
  return d >= mon
}

function isThisMonth(ts) {
  if (!ts?.toDate) return false
  const d = ts.toDate(), t = new Date()
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth()
}

function matchesDateFilter(filter, ts) {
  if (filter === 'all')   return true
  if (filter === 'today') return isToday(ts)
  if (filter === 'week')  return isThisWeek(ts)
  if (filter === 'month') return isThisMonth(ts)
  return true
}

function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()
}

function fmtDate(ts) {
  if (!ts?.toDate) return '—'
  return ts.toDate().toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}

function fmtTime(ts) {
  if (!ts?.toDate) return '—'
  return ts.toDate().toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })
}

const AVATAR_COLORS = [
  'bg-purple-100 text-purple-700',
  'bg-green-100 text-green-700',
  'bg-amber-100 text-amber-700',
  'bg-blue-100 text-blue-700',
  'bg-pink-100 text-pink-700',
]

function avatarColor(id = '') {
  const n = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return AVATAR_COLORS[n % AVATAR_COLORS.length]
}

// ─── StatusTimeline ───────────────────────────────────────────────────────────

function StatusTimeline({ status }) {
  const currentIdx = TIMELINE_STEPS.findIndex(s => s.key === status)
  return (
    <div className="flex items-start gap-0 w-full">
      {TIMELINE_STEPS.map((step, i) => {
        const done    = i < currentIdx
        const active  = i === currentIdx
        const pending = i > currentIdx
        return (
          <div key={step.key} className="flex-1 flex flex-col items-center">
            <div className="flex items-center w-full">
              {i > 0 && (
                <div className={`flex-1 h-0.5 ${done || active ? 'bg-[#1B6CA8]' : 'bg-gray-200'}`} />
              )}
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors ${
                active  ? 'bg-[#1B6CA8] border-[#1B6CA8]' :
                done    ? 'bg-[#1B6CA8] border-[#1B6CA8]' :
                          'bg-white border-gray-200'
              }`}>
                {done ? (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
                  </svg>
                ) : active ? (
                  <div className="w-2 h-2 rounded-full bg-white" />
                ) : null}
              </div>
              {i < TIMELINE_STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 ${done ? 'bg-[#1B6CA8]' : 'bg-gray-200'}`} />
              )}
            </div>
            <p className={`text-center mt-1.5 whitespace-pre-line leading-tight ${
              active  ? 'text-[10px] font-bold text-[#1B6CA8]' :
              done    ? 'text-[10px] font-semibold text-gray-500' :
                        'text-[10px] text-gray-300'
            }`}>
              {step.label}
            </p>
          </div>
        )
      })}
    </div>
  )
}

// ─── EarningsChart ────────────────────────────────────────────────────────────

function EarningsChart({ orders, chartHeight = 140 }) {
  const [tooltipIdx,   setTooltipIdx]   = useState(null)
  const [windowOffset, setWindowOffset] = useState(0)

  const now = new Date()

  const months = Array.from({ length: 6 }, (_, i) =>
    new Date(now.getFullYear(), now.getMonth() - 5 + i + windowOffset * 6, 1)
  )

  const data = months.map(md => {
    const y = md.getFullYear(), m = md.getMonth()
    const isCurrentMonth = y === now.getFullYear() && m === now.getMonth()
    const isFuture = md > new Date(now.getFullYear(), now.getMonth(), 1)
    const earnings = orders
      .filter(o => {
        if (o.status !== 'COMPLETED') return false
        const d = o.updatedAt?.toDate?.() ?? o.createdAt?.toDate?.()
        return d && d.getFullYear() === y && d.getMonth() === m
      })
      .reduce((sum, o) => sum + (o.finalPrice ?? 0), 0)
    return { short: MONTH_SHORT[m], full: MONTH_FULL[m], earnings, isCurrentMonth, isFuture }
  })

  const rawMax  = Math.max(...data.map(d => d.earnings))
  const yMax    = Math.max(Math.ceil(rawMax / 4000) * 4000, 16000)
  const yLabels = [yMax, yMax * 0.75, yMax * 0.5, yMax * 0.25, 0]
  const windowLabel = `${MONTH_FULL[months[0].getMonth()]} – ${MONTH_FULL[months[5].getMonth()]} ${months[5].getFullYear()}`

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="font-heading font-semibold text-[13px] text-gray-800">
          Monthly Earnings ({windowLabel})
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => setWindowOffset(o => o - 1)}
            className="w-7 h-7 rounded-lg border border-[#e5e7eb] flex items-center justify-center text-gray-500 hover:text-gray-900 hover:border-gray-400 transition-colors font-bold text-sm leading-none"
          >
            ‹
          </button>
          <button
            onClick={() => setWindowOffset(o => o + 1)}
            className="w-7 h-7 rounded-lg border border-[#e5e7eb] flex items-center justify-center text-gray-500 hover:text-gray-900 hover:border-gray-400 transition-colors font-bold text-sm leading-none"
          >
            ›
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="flex flex-col justify-between py-px shrink-0 w-9" style={{ height: chartHeight }}>
          {yLabels.map(v => (
            <span key={v} className="text-[9px] text-gray-400 leading-none text-right block">
              {v === 0 ? '₱0' : `₱${v / 1000}k`}
            </span>
          ))}
        </div>

        <div className="flex-1 relative" style={{ height: chartHeight }}>
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
            {yLabels.map((v, i) => (
              <div key={v} className={`w-full border-dashed border-gray-200 ${i === yLabels.length - 1 ? 'border-b' : 'border-t'}`} />
            ))}
          </div>

          {tooltipIdx !== null && (
            <div
              className="absolute top-2 z-20 bg-white border border-[#e5e7eb] rounded-xl shadow-md px-4 py-2.5 whitespace-nowrap pointer-events-none"
              style={{ left: `${(tooltipIdx + 0.5) * (100 / 6)}%`, transform: 'translateX(-50%)' }}
            >
              <p className="text-sm font-semibold text-gray-900">{data[tooltipIdx]?.full}</p>
              <p className="text-xs font-bold text-[#F5A623] mt-0.5">
                Earnings : ₱{data[tooltipIdx]?.earnings.toFixed(2)}
              </p>
            </div>
          )}

          <div className="absolute inset-0 flex gap-1.5 px-0.5">
            {data.map((d, i) => {
              const barH = !d.isFuture && d.earnings > 0
                ? Math.max((d.earnings / yMax) * (chartHeight - 6), 4)
                : 0
              return (
                <div
                  key={d.short}
                  className={`flex-1 flex flex-col justify-end relative cursor-pointer rounded-sm transition-colors ${
                    tooltipIdx === i ? 'bg-[#DBEAFE]' : 'hover:bg-gray-100'
                  }`}
                  onMouseEnter={() => setTooltipIdx(i)}
                  onMouseLeave={() => setTooltipIdx(null)}
                >
                  {!d.isFuture && barH > 0 && (
                    <div
                      className={`w-full rounded-t-sm ${d.isCurrentMonth ? 'bg-[#F5A623]' : 'bg-gray-300'}`}
                      style={{ height: `${barH}px` }}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="flex pl-11 mt-2">
        {data.map(d => (
          <div key={d.short} className="flex-1 text-center">
            <span className="text-[10px] text-gray-400">{d.short}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── DeliveryMapModal ─────────────────────────────────────────────────────────

function MapFitter({ positions }) {
  const map = useMap()
  useEffect(() => {
    if (positions.length >= 2) {
      map.fitBounds(L.latLngBounds(positions), { padding: [50, 50] })
    } else if (positions.length === 1) {
      map.setView(positions[0], 15)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, positions.length])
  return null
}

function DeliveryMapModal({ order, onArrive, onClose }) {
  const isPickup    = order.status === 'PICKUP_EN_ROUTE'
  const destination = isPickup
    ? order.pickupAddress
    : (order.deliveryAddress ?? order.pickupAddress)

  const [riderPos,    setRiderPos]    = useState(null)
  const [destPos,     setDestPos]     = useState(null)
  const [destLabel,   setDestLabel]   = useState('')
  const [route,       setRoute]       = useState([])
  const [distanceKm,  setDistanceKm]  = useState(null)
  const [durationMin, setDurationMin] = useState(null)
  const [geoError,    setGeoError]    = useState('')

  // Geocode destination once on open
  useEffect(() => {
    if (!destination) return
    const q = [destination.street, destination.landmark, 'Philippines']
      .filter(Boolean).join(', ')
    fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`,
      { headers: { 'Accept-Language': 'en' } }
    )
      .then(r => r.json())
      .then(data => {
        if (data[0]) {
          setDestPos([parseFloat(data[0].lat), parseFloat(data[0].lon)])
          setDestLabel(data[0].display_name)
        }
      })
      .catch(() => {})
  }, [])

  // Watch rider GPS continuously
  useEffect(() => {
    if (!navigator.geolocation) { setGeoError('Geolocation is not supported.'); return }
    const id = navigator.geolocation.watchPosition(
      pos => setRiderPos([pos.coords.latitude, pos.coords.longitude]),
      ()  => setGeoError('Enable GPS permission to use navigation.'),
      { enableHighAccuracy: true, maximumAge: 4000, timeout: 10000 }
    )
    return () => navigator.geolocation.clearWatch(id)
  }, [])

  // Re-fetch route whenever rider position updates
  useEffect(() => {
    if (!riderPos || !destPos) return
    fetch(
      `https://router.project-osrm.org/route/v1/driving/` +
      `${riderPos[1]},${riderPos[0]};${destPos[1]},${destPos[0]}` +
      `?overview=full&geometries=geojson`
    )
      .then(r => r.json())
      .then(data => {
        const r = data.routes?.[0]
        if (!r) return
        setDistanceKm((r.distance / 1000).toFixed(1))
        setDurationMin(Math.ceil(r.duration / 60))
        setRoute(r.geometry.coordinates.map(([lng, lat]) => [lat, lng]))
      })
      .catch(() => {})
  }, [riderPos, destPos])

  const allPos = [riderPos, destPos].filter(Boolean)
  const center = riderPos ?? destPos ?? [14.5995, 120.9842]

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="px-5 pt-5 pb-3">
          <h2 className="font-heading font-bold text-[17px] text-gray-900">
            {isPickup ? 'Navigating to customer' : 'Delivering to customer'}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">Live route updates as you move</p>
        </div>

        {/* Map */}
        <div className="h-[300px]">
          {geoError && !destPos ? (
            <div className="h-full bg-gray-50 flex items-center justify-center px-8">
              <p className="text-sm text-red-500 text-center">{geoError}</p>
            </div>
          ) : (
            <MapContainer center={center} zoom={14} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              {route.length > 0 && (
                <Polyline
                  positions={route}
                  pathOptions={{ color: '#F5A623', weight: 5, opacity: 0.9 }}
                />
              )}
              {riderPos && <Marker position={riderPos} icon={RIDER_ICON} />}
              {destPos  && <Marker position={destPos}  icon={DEST_ICON}  />}
              <MapFitter positions={allPos} />
            </MapContainer>
          )}
        </div>

        {/* Stats row */}
        <div className="px-5 py-4 border-b border-[#e5e7eb] flex items-start gap-6">
          <div className="shrink-0">
            <p className="font-heading font-bold text-[1.7rem] text-gray-900 leading-none">
              {distanceKm ?? '—'}
            </p>
            <p className="text-[10px] font-bold tracking-widest text-gray-400 mt-1 uppercase">KM Away</p>
          </div>
          <div className="shrink-0">
            <p className="font-heading font-bold text-[1.7rem] text-[#F5A623] leading-none">
              {durationMin != null ? `${durationMin} min` : '—'}
            </p>
            <p className="text-[10px] font-bold tracking-widest text-gray-400 mt-1 uppercase">Est. Arrival</p>
          </div>
          {destLabel && (
            <div className="flex-1 min-w-0 flex items-start gap-1.5 mt-1">
              <svg className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/>
              </svg>
              <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{destLabel}</p>
            </div>
          )}
          {!distanceKm && !geoError && (
            <p className="text-sm text-gray-400 mt-1">Locating you…</p>
          )}
        </div>

        {/* Actions */}
        <div className="px-5 py-4 flex gap-3">
          <button
            onClick={onArrive}
            className="flex-1 bg-[#F5A623] hover:bg-[#e09415] text-white font-heading font-semibold py-3 rounded-xl transition-colors text-sm"
          >
            {isPickup ? "I've Arrived — Start Pickup" : "I've Arrived — Confirm Delivery"}
          </button>
          <button
            onClick={onClose}
            className="px-5 border border-[#e5e7eb] text-gray-600 font-semibold text-sm rounded-xl hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  )
}

// ─── DeliveriesTab ────────────────────────────────────────────────────────────

function DeliveriesTab({ orders, availableOrders, isAvailable, onAdvanceStatus, onClaimOrder, onNavigate, refreshKey, setRefreshKey }) {
  const [tab,        setTab]        = useState('All')
  const [search,     setSearch]     = useState('')
  const [dateFilter, setDateFilter] = useState('all')

  const myOrders = orders.filter(o => o.riderId)

  function matchesTab(o) {
    if (tab === 'All')       return true
    if (tab === 'Active')    return ACTIVE_STATUSES.has(o.status) || o.status === 'ACCEPTED'
    if (tab === 'Completed') return o.status === 'COMPLETED'
    if (tab === 'Cancelled') return o.status === 'CANCELLED'
    return true
  }

  function matchesSearch(o) {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      o.customerName?.toLowerCase().includes(q) ||
      `lbg-${o.id.substring(0, 8).toLowerCase()}`.includes(q) ||
      o.shopName?.toLowerCase().includes(q)
    )
  }

  const filtered = myOrders
    .filter(o => matchesTab(o) && matchesSearch(o) && matchesDateFilter(dateFilter, o.createdAt))
    .sort((a, b) => {
      const ta = (a.createdAt?.toDate?.() ?? new Date(0)).getTime()
      const tb = (b.createdAt?.toDate?.() ?? new Date(0)).getTime()
      return tb - ta
    })

  const counts = {
    all:       myOrders.length,
    active:    myOrders.filter(o => ACTIVE_STATUSES.has(o.status) || o.status === 'ACCEPTED').length,
    completed: myOrders.filter(o => o.status === 'COMPLETED').length,
    cancelled: myOrders.filter(o => o.status === 'CANCELLED').length,
  }

  const TAB_COUNTS = [
    { id: 'All',       count: counts.all       },
    { id: 'Active',    count: counts.active    },
    { id: 'Completed', count: counts.completed },
    { id: 'Cancelled', count: counts.cancelled },
  ]

  return (
    <div className="space-y-5">
      <h2 className="font-heading font-bold text-[17px] text-gray-900">My Deliveries</h2>

      {/* Available to claim */}
      {isAvailable && availableOrders.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#e5e7eb] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
                </svg>
              </div>
              <h3 className="font-heading font-bold text-[15px] text-gray-900">Available to Claim</h3>
            </div>
            <span className="text-[11px] font-bold bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full">
              {availableOrders.length} open
            </span>
          </div>
          <div className="divide-y divide-[#e5e7eb]">
            {availableOrders.map(order => (
              <div key={order.id} className="flex items-center gap-5 px-6 py-4">
                <div className="flex-1 min-w-0 grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-500 mb-0.5">Order</p>
                    <p className="font-heading font-bold text-[13px] text-gray-900">LBG-{order.id.substring(0, 8).toUpperCase()}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-500 mb-0.5">Shop</p>
                    <p className="text-sm text-gray-700 truncate">{order.shopName ?? '—'}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-500 mb-0.5">Pickup</p>
                    <p className="text-sm text-gray-600 truncate">{order.pickupAddress?.street ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-500 mb-0.5">Est. earn</p>
                    <p className="text-sm font-semibold text-[#1B6CA8]">
                      ₱{((order.estimatedWeight ?? 5) * (order.pricePerKg ?? 50) + (order.deliveryFee ?? 49)).toLocaleString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onClaimOrder(order.id)}
                  className="shrink-0 bg-[#1B6CA8] text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-[#155a8a] transition-colors whitespace-nowrap"
                >
                  Claim
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter bar */}
      <div className="flex gap-1 bg-white border border-[#e5e7eb] rounded-xl p-1 shadow-sm">
        {TAB_COUNTS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              tab === t.id ? 'bg-[#0A2540] text-white shadow-sm' : 'text-gray-400 hover:text-gray-700'
            }`}
          >
            {t.id}
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none ${
              tab === t.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
            }`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search + date */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            type="text"
            placeholder="Search by customer, order ID, or shop…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-[#e5e7eb] rounded-xl text-sm focus:outline-none focus:border-[#1B6CA8] focus:ring-2 focus:ring-[#1B6CA8]/15"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          )}
        </div>
        <div className="flex gap-1">
          {DATE_FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setDateFilter(f.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                dateFilter === f.id
                  ? 'bg-[#0A2540] text-white'
                  : 'bg-white border border-[#e5e7eb] text-gray-500 hover:text-gray-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders list */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="bg-white rounded-2xl border border-[#e5e7eb] px-5 py-10 text-center">
            <p className="text-sm font-semibold text-gray-500">No deliveries found</p>
            <p className="text-xs text-gray-400 mt-1">Try adjusting your filters</p>
          </div>
        )}

        {filtered.map(order => {
          const isActive    = ACTIVE_STATUSES.has(order.status) || order.status === 'ACCEPTED'
          const isDone      = order.status === 'COMPLETED'
          const isCancelled = order.status === 'CANCELLED'
          const earned      = order.finalPrice ?? order.estimatedPrice ?? 0
          const ref         = `LBG-${order.id.substring(0, 8).toUpperCase()}`
          const action      = ACTIVE_ACTION[order.status]

          if (isActive) {
            return (
              <div key={order.id} className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e7eb]">
                  <div className="flex items-center gap-3">
                    <p className="font-heading font-bold text-[15px] text-gray-900">{ref}</p>
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${STATUS_PILL[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_LABEL[order.status] ?? order.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400">{fmtDate(order.createdAt)} · {fmtTime(order.createdAt)}</p>
                </div>

                <div className="px-6 py-5 space-y-5">
                  {/* Timeline */}
                  <StatusTimeline status={order.status} />

                  {/* Details grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-500 mb-1">Customer</p>
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${avatarColor(order.customerId ?? order.id)}`}>
                          {initials(order.customerName ?? '')}
                        </div>
                        <span className="text-sm font-medium text-gray-800">{order.customerName ?? '—'}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-500 mb-1">Shop</p>
                      <p className="text-sm text-gray-700">{order.shopName ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-500 mb-1">Service</p>
                      <p className="text-sm text-gray-700">{order.serviceType ?? '—'} · {order.estimatedWeight ?? '—'} kg</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-500 mb-1">Pickup address</p>
                      <p className="text-sm text-gray-700">
                        {order.pickupAddress?.street ?? '—'}
                        {order.pickupAddress?.landmark ? `, ${order.pickupAddress.landmark}` : ''}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-500 mb-1">Est. earnings</p>
                      <p className="text-sm font-bold text-[#1B6CA8]">₱{earned.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {(order.status === 'PICKUP_EN_ROUTE' || order.status === 'DELIVERY_EN_ROUTE') && (
                      <button
                        onClick={() => onNavigate(order)}
                        className="flex items-center gap-1.5 bg-[#F5A623] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#e09415] transition-colors whitespace-nowrap"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
                        </svg>
                        Navigate
                      </button>
                    )}
                    {action && (
                      <button
                        onClick={() => onAdvanceStatus(order)}
                        className="flex-1 bg-[#1B6CA8] text-white font-heading font-semibold py-2.5 rounded-xl hover:bg-[#155a8a] transition-colors text-sm"
                      >
                        {action.label}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          }

          return (
            <div key={order.id} className="bg-white rounded-2xl border border-[#e5e7eb] flex items-center gap-5 px-6 py-4">
              <div className="flex-1 min-w-0 grid grid-cols-2 md:grid-cols-5 gap-4 items-center">
                <div>
                  <p className="font-heading font-bold text-[13px] text-gray-900">{ref}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{fmtDate(order.createdAt)}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-500 mb-0.5">Customer</p>
                  <p className="text-sm text-gray-700 truncate">{order.customerName ?? '—'}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-500 mb-0.5">Shop</p>
                  <p className="text-sm text-gray-600 truncate">{order.shopName ?? '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-500 mb-0.5">Service</p>
                  <p className="text-sm text-gray-600">{order.serviceType ?? '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-500 mb-0.5">
                    {isDone ? 'Earned' : 'Amount'}
                  </p>
                  <p className={`text-sm font-bold ${isDone ? 'text-emerald-600' : 'text-gray-400'}`}>
                    {isDone ? `₱${earned.toLocaleString()}` : '—'}
                  </p>
                </div>
              </div>
              <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap shrink-0 ${STATUS_PILL[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                {STATUS_LABEL[order.status] ?? order.status}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── EarningsTab ──────────────────────────────────────────────────────────────

function EarningsTab({ orders }) {
  const [dateFilter, setDateFilter] = useState('month')

  const completed = orders.filter(o => o.status === 'COMPLETED')

  const totalAll   = completed.reduce((s, o) => s + (o.finalPrice ?? 0), 0)
  const totalMonth = completed.filter(o => isThisMonth(o.updatedAt ?? o.createdAt)).reduce((s, o) => s + (o.finalPrice ?? 0), 0)
  const totalWeek  = completed.filter(o => isThisWeek(o.updatedAt ?? o.createdAt)).reduce((s, o) => s + (o.finalPrice ?? 0), 0)
  const totalToday = completed.filter(o => isToday(o.updatedAt ?? o.createdAt)).reduce((s, o) => s + (o.finalPrice ?? 0), 0)

  const SUMMARY = [
    { label: 'All time',   value: totalAll,   accent: 'bg-[#F5A623]'  },
    { label: 'This month', value: totalMonth, accent: 'bg-violet-400' },
    { label: 'This week',  value: totalWeek,  accent: 'bg-sky-400'    },
    { label: 'Today',      value: totalToday, accent: 'bg-emerald-400' },
  ]

  const filteredDeliveries = completed
    .filter(o => matchesDateFilter(dateFilter, o.updatedAt ?? o.createdAt))
    .sort((a, b) => {
      const ta = (a.updatedAt ?? a.createdAt)?.toDate?.()?.getTime() ?? 0
      const tb = (b.updatedAt ?? b.createdAt)?.toDate?.()?.getTime() ?? 0
      return tb - ta
    })

  const periodTotal = filteredDeliveries.reduce((s, o) => s + (o.finalPrice ?? 0), 0)

  return (
    <div className="space-y-6">
      <h2 className="font-heading font-bold text-[17px] text-gray-900">Earnings</h2>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {SUMMARY.map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-[#e5e7eb] p-5">
            <div className={`w-2 h-2 rounded-full ${s.accent} mb-3`} />
            <p className="font-heading font-bold text-[1.7rem] text-gray-900 leading-none">
              ₱{s.value.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-gray-500 mt-2">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Large chart */}
      <div className="bg-white rounded-2xl border border-[#e5e7eb] p-6">
        <EarningsChart orders={orders} chartHeight={220} />
      </div>

      {/* Per-delivery breakdown */}
      <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e5e7eb] flex items-center justify-between">
          <div>
            <h3 className="font-heading font-bold text-[15px] text-gray-900">Delivery Breakdown</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {filteredDeliveries.length} deliveries · ₱{periodTotal.toLocaleString()} total
            </p>
          </div>
          <div className="flex gap-1">
            {DATE_FILTERS.map(f => (
              <button
                key={f.id}
                onClick={() => setDateFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  dateFilter === f.id
                    ? 'bg-[#0A2540] text-white'
                    : 'bg-gray-50 border border-[#e5e7eb] text-gray-500 hover:text-gray-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {filteredDeliveries.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">No completed deliveries in this period.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e5e7eb] bg-gray-50/60">
                {['Date', 'Order ID', 'Customer', 'Shop', 'Service', 'Weight', 'Earned'].map(col => (
                  <th key={col} className="text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-500 px-6 py-3 first:pl-6">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e7eb]">
              {filteredDeliveries.map(order => {
                const ts = order.updatedAt ?? order.createdAt
                return (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-3.5 text-gray-500 whitespace-nowrap text-xs">{fmtDate(ts)}</td>
                    <td className="px-6 py-3.5 font-heading font-semibold text-gray-800 text-[13px] whitespace-nowrap">
                      LBG-{order.id.substring(0, 8).toUpperCase()}
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${avatarColor(order.id)}`}>
                          {initials(order.customerName ?? '')}
                        </div>
                        <span className="text-gray-700 whitespace-nowrap">{order.customerName ?? '—'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-gray-600 whitespace-nowrap">{order.shopName ?? '—'}</td>
                    <td className="px-6 py-3.5">
                      <span className="text-[11px] font-medium bg-[#E8F4FD] text-[#1B6CA8] px-2 py-0.5 rounded-full whitespace-nowrap">
                        {order.serviceType ?? '—'}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-gray-600">{order.actualWeight ?? order.estimatedWeight ?? '—'} kg</td>
                    <td className="px-6 py-3.5 font-heading font-bold text-emerald-600 whitespace-nowrap">
                      ₱{(order.finalPrice ?? 0).toLocaleString()}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-[#e5e7eb] bg-gray-50/60">
                <td colSpan={6} className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wide">Period total</td>
                <td className="px-6 py-3.5 font-heading font-bold text-[#1B6CA8]">₱{periodTotal.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  )
}

// ─── ProfileTab ───────────────────────────────────────────────────────────────

function ProfileTab({ user, userProfile, refreshProfile }) {
  const formLoaded = useRef(false)

  const [form, setForm] = useState({
    fullName:       '',
    phone:          '',
    emergencyName:  '',
    emergencyPhone: '',
    vehicleType:    '',
    plateNumber:    '',
    vehicleModel:   '',
  })
  const [saving,         setSaving]         = useState(false)
  const [saveSuccess,    setSaveSuccess]    = useState(false)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [photoError,     setPhotoError]     = useState('')
  const [photoURL,       setPhotoURL]       = useState('')

  const [govIdURL,     setGovIdURL]     = useState('')
  const [licenseURL,   setLicenseURL]   = useState('')
  const [docUploading, setDocUploading] = useState({ govId: false, license: false })
  const [docError,     setDocError]     = useState('')

  const [pwForm,      setPwForm]      = useState({ current: '', next: '', confirm: '' })
  const [pwSaving,    setPwSaving]    = useState(false)
  const [pwError,     setPwError]     = useState('')
  const [pwSuccess,   setPwSuccess]   = useState(false)
  const [application, setApplication] = useState(null)

  useEffect(() => {
    getDoc(doc(db, 'applications', user.uid)).then(snap => {
      if (snap.exists()) setApplication(snap.data())
    })
  }, [user.uid])

  useEffect(() => {
    if (userProfile && !formLoaded.current) {
      formLoaded.current = true
      setForm({
        fullName:       userProfile.fullName       ?? '',
        phone:          userProfile.phone          ?? '',
        emergencyName:  userProfile.emergencyName  ?? '',
        emergencyPhone: userProfile.emergencyPhone ?? '',
        vehicleType:    userProfile.vehicleType    ?? '',
        plateNumber:    userProfile.plateNumber    ?? '',
        vehicleModel:   userProfile.vehicleModel   ?? '',
      })
      setPhotoURL(userProfile.riderPhotoURL ?? '')
      setGovIdURL(userProfile.govIdURL     ?? '')
      setLicenseURL(userProfile.licenseURL ?? '')
    }
  }, [userProfile])

  function field(key, value) { setForm(f => ({ ...f, [key]: value })) }

  async function handleSave() {
    setSaving(true)
    try {
      await updateDoc(doc(db, 'users', user.uid), { ...form, updatedAt: serverTimestamp() })
      await refreshProfile()
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2500)
    } finally {
      setSaving(false)
    }
  }

  async function handlePhotoUpload(file) {
    setPhotoUploading(true)
    setPhotoError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET)
      const res  = await fetch(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: 'POST', body: fd }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message ?? 'Upload failed')
      const url = data.secure_url
      setPhotoURL(url)
      await updateDoc(doc(db, 'users', user.uid), { riderPhotoURL: url, updatedAt: serverTimestamp() })
      await refreshProfile()
    } catch (err) {
      setPhotoError(err.message || 'Photo upload failed. Please try again.')
    } finally {
      setPhotoUploading(false)
    }
  }

  async function handleDocUpload(file, docType) {
    setDocUploading(s => ({ ...s, [docType]: true }))
    setDocError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET)
      const res  = await fetch(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: 'POST', body: fd }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message ?? 'Upload failed')
      const url   = data.secure_url
      const field = docType === 'govId' ? 'govIdURL' : 'licenseURL'
      if (docType === 'govId') setGovIdURL(url)
      else                     setLicenseURL(url)
      await updateDoc(doc(db, 'users', user.uid), { [field]: url, updatedAt: serverTimestamp() })
      await refreshProfile()
    } catch (err) {
      setDocError(err.message || 'Document upload failed. Please try again.')
    } finally {
      setDocUploading(s => ({ ...s, [docType]: false }))
    }
  }

  const isEmailUser = user?.providerData?.some(p => p.providerId === 'password') ?? false

  async function handleChangePassword() {
    setPwError('')
    if (pwForm.next !== pwForm.confirm) { setPwError('New passwords do not match.'); return }
    if (pwForm.next.length < 6)         { setPwError('Password must be at least 6 characters.'); return }
    setPwSaving(true)
    try {
      const cred = EmailAuthProvider.credential(user.email, pwForm.current)
      await reauthenticateWithCredential(user, cred)
      await updatePassword(user, pwForm.next)
      setPwSuccess(true)
      setPwForm({ current: '', next: '', confirm: '' })
      setTimeout(() => setPwSuccess(false), 3000)
    } catch (err) {
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setPwError('Current password is incorrect.')
      } else if (err.code === 'auth/requires-recent-login') {
        setPwError('Session expired — please sign out and sign back in.')
      } else {
        setPwError('Failed to change password. Please try again.')
      }
    } finally {
      setPwSaving(false)
    }
  }

  const riderInitials = (form.fullName || userProfile?.fullName || 'R')
    .split(' ').map(n => n[0]).slice(0, 2).join('')
  const rating      = userProfile?.rating ?? null
  const ratingStars = Math.round(rating ?? 0)
  const totalDone   = userProfile?.totalDeliveries ?? 0

  return (
    <div className="space-y-6">
      <h2 className="font-heading font-bold text-[17px] text-gray-900">Profile</h2>

      <div className="flex gap-6 items-start">

        {/* ── Left: Preview card ───────────────────────────────────────── */}
        <div className="w-[240px] shrink-0 space-y-4">

          {/* Profile card */}
          <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden">
            {/* Photo banner */}
            <div className="relative h-24 bg-gradient-to-br from-[#0A2540] to-[#1B6CA8] flex items-end justify-center pb-0">
              <div className="absolute bottom-0 translate-y-1/2 left-1/2 -translate-x-1/2">
                <div className="relative w-16 h-16 rounded-full border-4 border-white shadow overflow-hidden bg-[#F5A623] flex items-center justify-center">
                  {photoURL
                    ? <img src={photoURL} alt="Profile" className="w-full h-full object-cover" />
                    : <span className="text-[#0A2540] font-bold text-lg">{riderInitials}</span>
                  }
                  <label className={`absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity cursor-pointer rounded-full ${photoUploading ? 'opacity-100' : ''}`}>
                    {photoUploading
                      ? <div className="w-5 h-5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                      : <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                        </svg>
                    }
                    <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && handlePhotoUpload(e.target.files[0])} />
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-10 pb-5 px-4 text-center">
              <p className="font-heading font-bold text-[15px] text-gray-900">{form.fullName || 'Your Name'}</p>
              <p className="text-xs text-gray-400 mt-0.5">{user?.email}</p>

              {rating !== null && (
                <div className="flex items-center justify-center gap-1.5 mt-2">
                  <div className="flex">
                    {[1,2,3,4,5].map(n => (
                      <svg key={n} className={`w-3 h-3 ${n <= ratingStars ? 'text-[#F5A623]' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                    ))}
                  </div>
                  <span className="text-[11px] text-gray-500">{rating.toFixed(1)}</span>
                </div>
              )}

              <div className="mt-3 flex items-center justify-center gap-4 text-center">
                <div>
                  <p className="font-heading font-bold text-[18px] text-[#1B6CA8]">{totalDone}</p>
                  <p className="text-[10px] text-gray-400">Deliveries</p>
                </div>
              </div>

              {form.vehicleType && (
                <div className="mt-3 flex items-center justify-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"/>
                  </svg>
                  <span className="text-[11px] text-gray-500">{form.vehicleType}{form.plateNumber ? ` · ${form.plateNumber}` : ''}</span>
                </div>
              )}
            </div>

            {photoError && <p className="text-xs text-red-500 text-center px-4 pb-3">{photoError}</p>}
          </div>

          {/* Account meta */}
          <div className="bg-white rounded-2xl border border-[#e5e7eb] p-4 space-y-2.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400 mb-1">Account</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Email</span>
              <span className="text-xs font-medium text-gray-700 truncate max-w-[130px]">{user?.email ?? '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Role</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#DBEAFE] text-[#1B6CA8]">Rider</span>
            </div>
          </div>
        </div>

        {/* ── Right: Edit form ─────────────────────────────────────────── */}
        <div className="flex-1 space-y-5">

          {/* Personal info */}
          <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e5e7eb]">
              <h3 className="font-heading font-semibold text-[15px] text-gray-900">Personal Information</h3>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-600 mb-2">Full Name</p>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={e => field('fullName', e.target.value)}
                  className="w-full border border-[#e5e7eb] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B6CA8] focus:ring-2 focus:ring-[#1B6CA8]/15"
                  placeholder="Your full name"
                />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-600 mb-2">Phone Number</p>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => field('phone', e.target.value)}
                  className="w-full border border-[#e5e7eb] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B6CA8] focus:ring-2 focus:ring-[#1B6CA8]/15"
                  placeholder="09XX XXX XXXX"
                />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-600 mb-2">Email</p>
                <input
                  type="email"
                  value={user?.email ?? ''}
                  readOnly
                  className="w-full border border-[#e5e7eb] rounded-lg px-4 py-2.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Emergency contact */}
          <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e5e7eb]">
              <h3 className="font-heading font-semibold text-[15px] text-gray-900">Emergency Contact</h3>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-600 mb-2">Contact Name</p>
                <input
                  type="text"
                  value={form.emergencyName}
                  onChange={e => field('emergencyName', e.target.value)}
                  className="w-full border border-[#e5e7eb] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B6CA8] focus:ring-2 focus:ring-[#1B6CA8]/15"
                  placeholder="e.g. Maria Santos"
                />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-600 mb-2">Contact Number</p>
                <input
                  type="tel"
                  value={form.emergencyPhone}
                  onChange={e => field('emergencyPhone', e.target.value)}
                  className="w-full border border-[#e5e7eb] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B6CA8] focus:ring-2 focus:ring-[#1B6CA8]/15"
                  placeholder="09XX XXX XXXX"
                />
              </div>
            </div>
          </div>

          {/* Vehicle info */}
          <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e5e7eb]">
              <h3 className="font-heading font-semibold text-[15px] text-gray-900">Vehicle Information</h3>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-600 mb-2">Vehicle Type</p>
                <select
                  value={form.vehicleType}
                  onChange={e => field('vehicleType', e.target.value)}
                  className="w-full border border-[#e5e7eb] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B6CA8] focus:ring-2 focus:ring-[#1B6CA8]/15 bg-white"
                >
                  <option value="">Select type…</option>
                  {VEHICLE_TYPES.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-600 mb-2">Plate Number</p>
                <input
                  type="text"
                  value={form.plateNumber}
                  onChange={e => field('plateNumber', e.target.value.toUpperCase())}
                  className="w-full border border-[#e5e7eb] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B6CA8] focus:ring-2 focus:ring-[#1B6CA8]/15 uppercase"
                  placeholder="ABC 1234"
                />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-600 mb-2">Model / Color</p>
                <input
                  type="text"
                  value={form.vehicleModel}
                  onChange={e => field('vehicleModel', e.target.value)}
                  className="w-full border border-[#e5e7eb] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B6CA8] focus:ring-2 focus:ring-[#1B6CA8]/15"
                  placeholder="e.g. Honda Click · Red"
                />
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e5e7eb]">
              <h3 className="font-heading font-semibold text-[15px] text-gray-900">Documents</h3>
              <p className="text-xs text-gray-400 mt-0.5">Used for verification — visible to Labada admins only</p>
            </div>
            <div className="p-6 grid grid-cols-2 gap-5">
              {[
                { key: 'govId',   label: 'Government ID',   url: govIdURL   },
                { key: 'license', label: "Driver's License", url: licenseURL },
              ].map(({ key, label, url }) => (
                <div key={key}>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-600 mb-2">{label}</p>
                  {url ? (
                    <div className="relative rounded-xl overflow-hidden border border-[#e5e7eb] aspect-video">
                      <img src={url} alt={label} className="w-full h-full object-cover" />
                      <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                        <span className="text-white text-xs font-semibold bg-black/50 px-3 py-1.5 rounded-lg">
                          {docUploading[key] ? 'Uploading…' : 'Replace'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={docUploading[key]}
                          onChange={e => e.target.files[0] && handleDocUpload(e.target.files[0], key)}
                        />
                      </label>
                    </div>
                  ) : (
                    <label className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-8 cursor-pointer transition-colors ${
                      docUploading[key] ? 'border-[#1B6CA8]/40 bg-[#F0F7FF]' : 'border-gray-200 hover:border-[#1B6CA8]/50 hover:bg-gray-50/50'
                    }`}>
                      {docUploading[key] ? (
                        <div className="w-5 h-5 rounded-full border-2 border-[#1B6CA8]/30 border-t-[#1B6CA8] animate-spin" />
                      ) : (
                        <>
                          <svg className="w-7 h-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                          </svg>
                          <span className="text-xs text-gray-400">Upload {label}</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={docUploading[key]}
                        onChange={e => e.target.files[0] && handleDocUpload(e.target.files[0], key)}
                      />
                    </label>
                  )}
                </div>
              ))}
            </div>
            {docError && <p className="text-xs text-red-500 px-6 pb-4">{docError}</p>}
          </div>

          {/* Save */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#1B6CA8] text-white font-semibold text-sm py-2.5 px-7 rounded-xl hover:bg-[#155a8a] transition-colors disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            {saveSuccess && (
              <div className="flex items-center gap-1.5 text-emerald-600 text-sm font-medium">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
                </svg>
                Saved!
              </div>
            )}
          </div>

          {/* Change password */}
          {isEmailUser && (
            <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden">
              <div className="px-6 py-4 border-b border-[#e5e7eb]">
                <h3 className="font-heading font-semibold text-[15px] text-gray-900">Change Password</h3>
              </div>
              <div className="p-6 space-y-4">
                {[
                  { key: 'current', label: 'Current password',    autoComplete: 'current-password', placeholder: 'Enter current password'  },
                  { key: 'next',    label: 'New password',         autoComplete: 'new-password',     placeholder: 'Enter new password'      },
                  { key: 'confirm', label: 'Confirm new password', autoComplete: 'new-password',     placeholder: 'Confirm new password'    },
                ].map(({ key, label, autoComplete, placeholder }) => (
                  <div key={key}>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-600 mb-2">{label}</p>
                    <input
                      type="password"
                      autoComplete={autoComplete}
                      value={pwForm[key]}
                      onChange={e => setPwForm(f => ({ ...f, [key]: e.target.value }))}
                      className="w-full border border-[#e5e7eb] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B6CA8] focus:ring-2 focus:ring-[#1B6CA8]/15"
                      placeholder={placeholder}
                    />
                  </div>
                ))}
                {pwError   && <p className="text-xs text-red-500">{pwError}</p>}
                {pwSuccess && (
                  <p className="text-xs text-emerald-600 font-medium flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
                    </svg>
                    Password updated!
                  </p>
                )}
                <button
                  onClick={handleChangePassword}
                  disabled={pwSaving}
                  className="bg-gray-800 text-white font-semibold text-sm py-2.5 px-6 rounded-xl hover:bg-gray-700 transition-colors disabled:opacity-60"
                >
                  {pwSaving ? 'Updating…' : 'Update password'}
                </button>
              </div>
            </div>
          )}

          {/* Application status */}
          {application && (
            <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden">
              <div className="px-6 py-4 border-b border-[#e5e7eb] flex items-center justify-between">
                <h3 className="font-heading font-semibold text-[15px] text-gray-900">My Application</h3>
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                  application.status === 'approved' ? 'bg-green-100 text-green-700' :
                  application.status === 'rejected' ? 'bg-red-100 text-red-500'    :
                  'bg-amber-100 text-amber-700'
                }`}>
                  {application.status === 'approved' ? 'Approved' :
                   application.status === 'rejected' ? 'Rejected' : 'Under Review'}
                </span>
              </div>
              <div className="p-6 space-y-5">
                {/* Step tracker */}
                <div className="flex items-center">
                  {[
                    { label: 'Submitted',    active: true                                                          },
                    { label: 'Under Review', active: application.status !== 'pending'                             },
                    { label: application.status === 'rejected' ? 'Rejected' : 'Approved',
                      active: application.status === 'approved' || application.status === 'rejected',
                      rejected: application.status === 'rejected' },
                  ].map((s, i, arr) => (
                    <div key={s.label} className="flex items-center flex-1 last:flex-none">
                      <div className="flex flex-col items-center gap-1 shrink-0">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          s.active ? (s.rejected ? 'bg-red-400' : 'bg-[#1B6CA8]') : 'bg-gray-200'
                        }`}>
                          {s.active ? (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              {s.rejected
                                ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                                : <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>}
                            </svg>
                          ) : (
                            <span className="text-[9px] font-bold text-gray-400">{i + 1}</span>
                          )}
                        </div>
                        <span className={`text-[10px] font-medium whitespace-nowrap ${s.active ? 'text-gray-700' : 'text-gray-300'}`}>
                          {s.label}
                        </span>
                      </div>
                      {i < arr.length - 1 && (
                        <div className={`flex-1 h-0.5 mx-2 mb-3 ${s.active ? 'bg-[#1B6CA8]' : 'bg-gray-200'}`} />
                      )}
                    </div>
                  ))}
                </div>
                {/* Meta */}
                <div className="space-y-1.5 text-sm border-t border-[#f3f4f6] pt-4">
                  {application.appliedAt && (
                    <div className="flex gap-4">
                      <span className="text-gray-500 w-24 shrink-0">Submitted</span>
                      <span className="text-gray-800 font-medium">{fmtDate(application.appliedAt)}</span>
                    </div>
                  )}
                  {application.vehicle && (
                    <div className="flex gap-4">
                      <span className="text-gray-500 w-24 shrink-0">Vehicle</span>
                      <span className="text-gray-800 font-medium">
                        {application.vehicle}{application.plate ? ` · ${application.plate}` : ''}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RiderDashboard() {
  const navigate = useNavigate()
  const { user, userProfile, refreshProfile } = useAuth()

  const [orders,          setOrders]          = useState([])
  const [loaded,          setLoaded]          = useState(false)
  const [availableOrders, setAvailableOrders] = useState([])
  const [refreshKey,      setRefreshKey]      = useState(0)
  const [isAvailable,     setIsAvailable]     = useState(true)
  const [activeNav,       setActiveNav]       = useState('dashboard')
  const [menuOpen,        setMenuOpen]        = useState(false)
  const [sidebarOpen,     setSidebarOpen]     = useState(false)
  const [mapOrder,        setMapOrder]        = useState(null)
  const menuRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleLogout() {
    await signOut(auth)
    navigate('/')
  }

  useEffect(() => {
    if (userProfile?.isAvailable !== undefined) setIsAvailable(userProfile.isAvailable)
  }, [userProfile])

  useEffect(() => {
    if (!user?.uid) return
    const q = query(collection(db, 'orders'), where('riderId', '==', user.uid))
    const unsubscribe = onSnapshot(q, snap => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoaded(true)
    })
    return unsubscribe
  }, [user?.uid])

  async function handleToggleAvailable() {
    const newStatus = !isAvailable
    setIsAvailable(newStatus)
    try {
      await updateDoc(doc(db, 'users', user.uid), { isAvailable: newStatus, updatedAt: serverTimestamp() })
    } catch {
      setIsAvailable(!newStatus)
    }
  }

  useEffect(() => {
    if (!user?.uid) return
    const q = query(
      collection(db, 'orders'),
      where('status', '==', 'ACCEPTED'),
      where('riderId', '==', null)
    )
    const unsubscribe = onSnapshot(q, snap => {
      setAvailableOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsubscribe
  }, [user?.uid, refreshKey])

  async function handleClaimOrder(orderId) {
    await updateDoc(doc(db, 'orders', orderId), {
      riderId: user.uid,
      riderName: userProfile?.fullName ?? '',
      status: 'PICKUP_EN_ROUTE',
      updatedAt: serverTimestamp(),
    })
  }

  async function handleAdvanceStatus(order) {
    const action = ACTIVE_ACTION[order.status]
    if (!action) return
    await updateDoc(doc(db, 'orders', order.id), {
      status: action.next, updatedAt: serverTimestamp(),
    })
  }

  // ── Derived ───────────────────────────────────────────────────────────────
  const activeTask     = orders.find(o => ACTIVE_STATUSES.has(o.status)) ?? null
  const upcomingTasks  = orders.filter(o => o.status === 'ACCEPTED')
  const completedToday = orders.filter(o => o.status === 'COMPLETED' && isToday(o.createdAt))
  const completedWeek  = orders.filter(o => o.status === 'COMPLETED' && isThisWeek(o.createdAt))
  const earningsToday  = completedToday.reduce((sum, o) => sum + (o.finalPrice ?? o.estimatedPrice ?? 0), 0)

  const STATS = [
    { label: "Today's deliveries", value: completedToday.length                },
    { label: 'This week',          value: completedWeek.length                 },
    { label: "Today's earnings",   value: `₱${earningsToday.toLocaleString()}` },
    { label: 'Rating',             value: userProfile?.rating ? `${userProfile.rating.toFixed(1)} ★` : 'New' },
  ]

  const STAT_STYLES = [
    { accent: 'bg-[#F5A623]'   },
    { accent: 'bg-amber-400'   },
    { accent: 'bg-violet-400'  },
    { accent: 'bg-emerald-400' },
  ]

  if (!loaded) {
    return (
      <div className="min-h-screen bg-[#EDF1F7] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-gray-200 border-t-[#1B6CA8] animate-spin" />
        <p className="text-sm text-gray-600">Loading deliveries...</p>
      </div>
    )
  }

  const riderInitials = userProfile?.fullName?.split(' ').map(n => n[0]).slice(0, 2).join('') ?? 'R'
  const hour     = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <>
    <div className="flex h-screen bg-[#EDF1F7] overflow-hidden">

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-10 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <aside className={`fixed top-0 left-0 h-screen w-[240px] bg-[#0A2540] flex flex-col z-20 transform transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>

        <div className="px-5 pt-6 pb-5">
          <button onClick={() => navigate('/')} className="cursor-pointer hover:opacity-85 transition-opacity focus:outline-none">
            <Logo />
          </button>
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/30 mt-2 pl-1">Rider Portal</p>
        </div>

        <div className="mx-4 mb-5 bg-white/8 border border-white/10 rounded-2xl p-4">
          <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/35 mb-1.5">Rider</p>
          <p className="text-[13px] font-bold text-white truncate mb-3">{userProfile?.fullName ?? 'Rider'}</p>
          <button onClick={handleToggleAvailable} className="flex items-center gap-2.5 w-full group">
            <div className={`relative w-9 h-5 rounded-full transition-colors duration-200 shrink-0 ${isAvailable ? 'bg-emerald-500/70' : 'bg-white/15'}`}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${isAvailable ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </div>
            <span className={`text-[11px] font-medium transition-colors ${isAvailable ? 'text-emerald-400' : 'text-white/35'}`}>
              {isAvailable ? 'Available' : 'Off duty'}
            </span>
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveNav(item.id); setSidebarOpen(false) }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                activeNav === item.id
                  ? 'bg-white text-[#0A2540] font-semibold shadow-sm'
                  : 'text-white/50 hover:text-white hover:bg-white/8'
              }`}
            >
              {NAV_ICONS[item.id]}
              {item.label}
            </button>
          ))}
        </nav>

      </aside>

      {/* ── Main area ───────────────────────────────────────────────────── */}
      <div className="ml-0 md:ml-[240px] flex-1 flex flex-col overflow-y-auto">

        {/* Top banner */}
        <div className="bg-[#0A2540] px-4 md:px-8 pt-5 md:pt-7 pb-5 md:pb-7 shrink-0">
          <div className="flex items-start justify-between mb-5 md:mb-7">
            {/* Mobile hamburger */}
            <button onClick={() => setSidebarOpen(o => !o)} className="md:hidden w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/15 transition-colors shrink-0 mr-3 self-center">
              <svg className="w-5 h-5 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-start justify-between flex-1">
            <div>
              <p className="text-white/40 text-xs font-medium mb-1 tracking-wide">
                {new Date().toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
              <h1 className="font-heading font-bold text-[1.6rem] text-white leading-tight">
                {greeting},{' '}
                <span className="text-[#F5A623]">{userProfile?.fullName?.split(' ')[0] ?? 'Rider'}</span>
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <button onClick={() => setActiveNav('deliveries')} className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/15 transition-colors">
                  <svg className="w-5 h-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                  </svg>
                </button>
                {(upcomingTasks.length > 0 || (isAvailable && availableOrders.length > 0)) && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#F5A623] rounded-full text-[9px] font-bold text-[#0A2540] flex items-center justify-center">
                    {upcomingTasks.length + (isAvailable ? availableOrders.length : 0)}
                  </span>
                )}
              </div>

              <div className="relative flex items-center gap-2.5" ref={menuRef}>
                <div className="text-right">
                  <p className="text-sm font-semibold text-white leading-tight">{userProfile?.fullName ?? 'Rider'}</p>
                  <p className="text-[10px] text-white/40">Rider</p>
                </div>
                <button
                  onClick={() => setMenuOpen(o => !o)}
                  className="w-9 h-9 rounded-full overflow-hidden bg-[#F5A623] flex items-center justify-center shrink-0 hover:ring-2 hover:ring-white/30 transition-all focus:outline-none"
                >
                  {userProfile?.riderPhotoURL
                    ? <img src={userProfile.riderPhotoURL} alt="" className="w-full h-full object-cover" />
                    : <span className="text-[#0A2540] text-xs font-bold">{riderInitials}</span>
                  }
                </button>

                {menuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-44 bg-white rounded-2xl shadow-xl border border-[#e5e7eb] overflow-hidden z-50">
                    <button onClick={() => { setMenuOpen(false); navigate('/') }}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left">
                      <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/>
                      </svg>
                      Home
                    </button>
                    <button onClick={() => { setMenuOpen(false); setActiveNav('profile'); setMenuOpen(false) }}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left">
                      <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                      </svg>
                      My Profile
                    </button>
                    <div className="border-t border-[#e5e7eb]" />
                    <button onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors text-left">
                      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                      </svg>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
            </div>{/* end flex-1 inner wrapper */}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {STATS.map((stat, i) => (
              <div
                key={stat.label}
                className="bg-white/10 border border-white/15 rounded-2xl px-5 py-4 transition-all duration-200 hover:bg-white/[0.16] hover:border-white/30 hover:scale-[1.03] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20"
              >
                <div className={`w-2 h-2 rounded-full ${STAT_STYLES[i].accent} mb-3`} />
                <p className="font-heading font-bold text-[2.2rem] text-white leading-none">{stat.value}</p>
                <p className="text-[11px] text-white/65 mt-2">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <main className="flex-1 p-4 md:p-8 space-y-6">

          {/* ── Dashboard tab ─────────────────────────────────────────── */}
          {activeNav === 'dashboard' && <>

            {/* Active task */}
            <div className="bg-white rounded-xl border border-[#e5e7eb] flex overflow-hidden">
              <div className="w-1 bg-[#1B6CA8] shrink-0" />
              <div className="flex-1 p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-heading font-bold text-[17px] text-gray-900">Current task</h2>
                  {activeTask && (
                    <span className="bg-[#FEF3C7] text-amber-700 text-xs font-semibold px-3 py-1 rounded-full">
                      {STATUS_LABEL[activeTask.status] ?? activeTask.status}
                    </span>
                  )}
                </div>

                {!activeTask ? (
                  <div className="py-10 text-center">
                    <p className="font-heading font-semibold text-gray-700 mb-1">No active deliveries</p>
                    <p className="text-sm text-gray-600">
                      {upcomingTasks.length > 0
                        ? 'You have upcoming tasks assigned below.'
                        : 'New tasks will appear here when a merchant assigns you.'}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="mb-6">
                      <StatusTimeline status={activeTask.status} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-5">
                      <div className="space-y-4">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-600 mb-1">Order ID</p>
                          <p className="font-heading font-bold text-[18px] text-gray-900">
                            LBG-{activeTask.id.substring(0, 8).toUpperCase()}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-600 mb-2">Customer</p>
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${avatarColor(activeTask.customerId ?? activeTask.id)}`}>
                              {initials(activeTask.customerName ?? '')}
                            </div>
                            <span className="text-sm font-medium text-gray-800">{activeTask.customerName}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-600 mb-2">Pickup address</p>
                          <div className="flex items-start gap-2">
                            <svg className="w-4 h-4 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                            </svg>
                            <p className="text-sm text-gray-700">
                              {activeTask.pickupAddress?.street ?? '—'}
                              {activeTask.pickupAddress?.landmark ? `, ${activeTask.pickupAddress.landmark}` : ''}
                            </p>
                          </div>
                        </div>
                        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                          <p className="text-xs text-amber-700 leading-relaxed">
                            {activeTask.status === 'PICKUP_EN_ROUTE'
                              ? 'Collect laundry bag, take a photo as proof'
                              : activeTask.status === 'PICKED_UP'
                              ? 'Drop laundry off at the shop'
                              : 'Deliver clean laundry to the customer'}
                          </p>
                        </div>
                      </div>
                      {(activeTask.status === 'PICKUP_EN_ROUTE' || activeTask.status === 'DELIVERY_EN_ROUTE') ? (
                        <button
                          onClick={() => setMapOrder(activeTask)}
                          className="min-h-48 w-full rounded-xl bg-[#0A2540] flex flex-col items-center justify-center gap-3 hover:bg-[#0d2e52] transition-colors group"
                        >
                          <div className="w-14 h-14 rounded-full bg-[#F5A623] flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
                            </svg>
                          </div>
                          <div className="text-center">
                            <p className="text-white font-heading font-semibold text-sm">Open Navigation</p>
                            <p className="text-white/40 text-xs mt-0.5">Live GPS · Route · ETA</p>
                          </div>
                        </button>
                      ) : (
                        <div className="min-h-48 rounded-xl border-2 border-dashed border-blue-200 bg-[#E8F4FD] flex flex-col items-center justify-center p-4 gap-3">
                          <svg className="w-8 h-8 text-[#1B6CA8]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                          </svg>
                          <p className="text-xs text-[#1B6CA8]/50 text-center leading-relaxed max-w-[160px]">Navigation available when en route</p>
                        </div>
                      )}
                    </div>
                    <div>
                      <button
                        onClick={() => handleAdvanceStatus(activeTask)}
                        className="w-full bg-[#1B6CA8] text-white font-heading font-semibold py-3 rounded-lg hover:bg-[#155a8a] transition-colors text-sm"
                      >
                        {ACTIVE_ACTION[activeTask.status]?.label ?? 'Update status'}
                      </button>
                      <p className="text-[11px] text-gray-600 text-center mt-2">
                        This will notify the customer and update order status
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Available orders */}
            <div className="bg-white rounded-xl border border-[#e5e7eb] p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-heading font-bold text-[17px] text-gray-900">Available orders</h2>
                  <p className="text-xs text-gray-600 mt-0.5">Unclaimed orders you can pick up</p>
                </div>
                {isAvailable && (
                  <span className="text-[11px] font-semibold bg-green-100 text-green-700 px-2.5 py-1 rounded-full">
                    {availableOrders.length} available
                  </span>
                )}
              </div>

              {!isAvailable ? (
                <div className="py-8 text-center border border-dashed border-gray-200 rounded-xl">
                  <p className="text-sm font-medium text-gray-600">You are currently off duty.</p>
                  <p className="text-xs text-gray-600 mt-1">Toggle availability to see orders.</p>
                </div>
              ) : availableOrders.length === 0 ? (
                <div className="py-8 text-center border border-dashed border-gray-200 rounded-xl">
                  <p className="text-sm font-medium text-gray-600 mb-3">No orders available right now. Check back soon.</p>
                  <button onClick={() => setRefreshKey(k => k + 1)}
                    className="text-xs font-medium text-[#1B6CA8] border border-[#1B6CA8] px-4 py-1.5 rounded-lg hover:bg-[#F0F7FF] transition-colors">
                    Refresh
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableOrders.map(order => (
                    <div key={order.id} className="flex items-center gap-5 border border-[#e5e7eb] rounded-xl p-4 hover:border-[#1B6CA8]/40 transition-colors">
                      <div className="flex-1 min-w-0 grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-600 mb-0.5">Order</p>
                          <p className="font-heading font-bold text-[14px] text-gray-900">LBG-{order.id.substring(0, 8).toUpperCase()}</p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-600 mb-0.5">Shop</p>
                          <p className="text-sm text-gray-700 truncate">{order.shopName ?? '—'}</p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-600 mb-0.5">Pickup</p>
                          <p className="text-sm text-gray-600 truncate">{order.pickupAddress?.street ?? '—'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-600 mb-0.5">Service</p>
                          <span className="text-[11px] font-medium bg-[#E8F4FD] text-[#1B6CA8] px-2 py-0.5 rounded-full whitespace-nowrap">
                            {order.serviceType ?? '—'}
                          </span>
                        </div>
                      </div>
                      <button onClick={() => handleClaimOrder(order.id)}
                        className="shrink-0 bg-[#1B6CA8] text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-[#155a8a] transition-colors whitespace-nowrap">
                        Claim order
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming tasks */}
            <div className="bg-white rounded-xl border border-[#e5e7eb] p-6">
              <h2 className="font-heading font-bold text-[17px] text-gray-900 mb-5">Upcoming tasks</h2>
              {upcomingTasks.length === 0 ? (
                <p className="text-sm text-gray-600 py-4">No upcoming tasks assigned yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#e5e7eb]">
                      {['Order ID', 'Customer', 'Pickup address', 'Shop', 'Status', 'Action'].map(col => (
                        <th key={col} className="text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-600 pb-3 pr-4 last:pr-0">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e5e7eb]">
                    {upcomingTasks.map(order => (
                      <tr key={order.id}>
                        <td className="py-3.5 pr-4 font-heading font-semibold text-gray-800 text-[13px] whitespace-nowrap">
                          LBG-{order.id.substring(0, 8).toUpperCase()}
                        </td>
                        <td className="py-3.5 pr-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${avatarColor(order.id)}`}>
                              {initials(order.customerName ?? '')}
                            </div>
                            <span className="text-gray-700 whitespace-nowrap">{order.customerName}</span>
                          </div>
                        </td>
                        <td className="py-3.5 pr-4 text-gray-600">{order.pickupAddress?.street ?? '—'}</td>
                        <td className="py-3.5 pr-4 text-gray-600">{order.shopName ?? '—'}</td>
                        <td className="py-3.5 pr-4">
                          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${STATUS_PILL[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                            {STATUS_LABEL[order.status] ?? order.status}
                          </span>
                        </td>
                        <td className="py-3.5">
                          <button onClick={() => handleAdvanceStatus(order)}
                            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-[#1B6CA8] text-white hover:bg-[#155a8a] transition-colors">
                            Start pickup
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

          </>}

          {/* ── My Deliveries tab ─────────────────────────────────────── */}
          {activeNav === 'deliveries' && (
            <DeliveriesTab
              orders={orders}
              availableOrders={availableOrders}
              isAvailable={isAvailable}
              onAdvanceStatus={handleAdvanceStatus}
              onClaimOrder={handleClaimOrder}
              onNavigate={setMapOrder}
              refreshKey={refreshKey}
              setRefreshKey={setRefreshKey}
            />
          )}

          {/* ── Earnings tab ──────────────────────────────────────────── */}
          {activeNav === 'earnings' && (
            <EarningsTab orders={orders} />
          )}

          {/* ── Profile tab ───────────────────────────────────────────── */}
          {activeNav === 'profile' && (
            <ProfileTab
              user={user}
              userProfile={userProfile}
              refreshProfile={refreshProfile}
            />
          )}

        </main>
      </div>
    </div>

    {mapOrder && (
      <DeliveryMapModal
        order={mapOrder}
        onArrive={() => { handleAdvanceStatus(mapOrder); setMapOrder(null) }}
        onClose={() => setMapOrder(null)}
      />
    )}
    </>
  )
}
