import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'
import { collection, query, where, onSnapshot, updateDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore'
import { signOut, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth'
import { auth, db } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'

// ─── Static data ──────────────────────────────────────────────────────────────

const NAV_ICONS = {
  dashboard: (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  orders: (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
    </svg>
  ),
  shop: (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/>
    </svg>
  ),
  services: (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z"/>
    </svg>
  ),
  earnings: (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
    </svg>
  ),
  settings: (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ),
}

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard'          },
  { id: 'orders',    label: 'Orders'             },
  { id: 'shop',      label: 'My shop profile'    },
  { id: 'services',  label: 'Services & pricing' },
  { id: 'earnings',  label: 'Earnings'           },
  { id: 'settings',  label: 'Settings'           },
]

const STATUS_OPTIONS = [
  { value: 'ACCEPTED',           label: 'Accepted'           },
  { value: 'PICKUP_EN_ROUTE',    label: 'Pickup en route'    },
  { value: 'PICKED_UP',          label: 'Picked up'          },
  { value: 'ARRIVED_AT_SHOP',    label: 'Arrived at shop'    },
  { value: 'PROCESSING',         label: 'Processing'         },
  { value: 'READY_FOR_DELIVERY', label: 'Ready for delivery' },
  { value: 'DELIVERY_EN_ROUTE',  label: 'Delivery en route'  },
  { value: 'COMPLETED',          label: 'Completed'          },
]

const STATUS_LABEL = {
  PENDING:            'Pending',
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
  PENDING:            'bg-amber-100 text-amber-700',
  ACCEPTED:           'bg-[#DBEAFE] text-[#1B6CA8]',
  PICKUP_EN_ROUTE:    'bg-purple-100 text-purple-700',
  PICKED_UP:          'bg-purple-100 text-purple-700',
  ARRIVED_AT_SHOP:    'bg-purple-100 text-purple-700',
  PROCESSING:         'bg-blue-100 text-blue-700',
  READY_FOR_DELIVERY: 'bg-green-100 text-green-700',
  DELIVERY_EN_ROUTE:  'bg-sky-100 text-sky-700',
  COMPLETED:          'bg-gray-100 text-gray-600',
  CANCELLED:          'bg-red-100 text-red-500',
}

const IN_PROGRESS_STATUSES = new Set([
  'ACCEPTED', 'PICKUP_EN_ROUTE', 'PICKED_UP',
  'ARRIVED_AT_SHOP', 'PROCESSING', 'READY_FOR_DELIVERY', 'DELIVERY_EN_ROUTE',
])

const TABS = ['All', 'Pending', 'In Progress', 'Completed', 'Cancelled']

const SERVICE_TYPES     = ['Wash & Fold', 'Dry Cleaning', 'Comforters', 'Towels & Linens']
const DETERGENTS        = ['Any', 'Ariel', 'Tide', 'Breeze', 'Hypoallergenic']
const AMENITY_OPTIONS   = ['Free pickup', 'Free delivery', 'Folding included', 'Fabric conditioner', 'Ironing available', 'Same-day service', 'Stain treatment', 'Hang drying']
const DEFAULT_SHOP_HOURS = [
  { day: 'Monday–Friday', open: true,  time: '7:00 AM – 6:00 PM' },
  { day: 'Saturday',       open: true,  time: '7:00 AM – 4:00 PM' },
  { day: 'Sunday',         open: false, time: '' },
]

const DATE_FILTERS = [
  { id: 'today', label: 'Today'      },
  { id: 'week',  label: 'This Week'  },
  { id: 'month', label: 'This Month' },
  { id: 'all',   label: 'All Time'   },
]

const DAYS_OF_WEEK = [
  { id: 'monday',    label: 'Monday'    },
  { id: 'tuesday',   label: 'Tuesday'   },
  { id: 'wednesday', label: 'Wednesday' },
  { id: 'thursday',  label: 'Thursday'  },
  { id: 'friday',    label: 'Friday'    },
  { id: 'saturday',  label: 'Saturday'  },
  { id: 'sunday',    label: 'Sunday'    },
]

const DEFAULT_BUSINESS_HOURS = {
  monday:    { open: true,  from: '08:00', to: '18:00' },
  tuesday:   { open: true,  from: '08:00', to: '18:00' },
  wednesday: { open: true,  from: '08:00', to: '18:00' },
  thursday:  { open: true,  from: '08:00', to: '18:00' },
  friday:    { open: true,  from: '08:00', to: '18:00' },
  saturday:  { open: true,  from: '08:00', to: '18:00' },
  sunday:    { open: false, from: '08:00', to: '18:00' },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isToday(ts) {
  if (!ts?.toDate) return false
  const d = ts.toDate()
  const t = new Date()
  return d.getFullYear() === t.getFullYear() &&
         d.getMonth()    === t.getMonth()    &&
         d.getDate()     === t.getDate()
}

function isThisMonth(ts) {
  if (!ts?.toDate) return false
  const d = ts.toDate()
  const t = new Date()
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth()
}

function isThisWeek(ts) {
  if (!ts?.toDate) return false
  const d = ts.toDate()
  const now = new Date()
  const sow = new Date(now)
  sow.setDate(now.getDate() - now.getDay())
  sow.setHours(0, 0, 0, 0)
  return d >= sow
}


// ─── OrderCard ─────────────────────────────────────────────────────────────────

function OrderDetailsModal({ order, onClose }) {
  const displayRef = `LBG-${order.id.substring(0, 8).toUpperCase()}`

  function fmtDate(iso) {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('en-PH', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })
  }

  const addr = order.pickupAddress
  const addressLine = [addr?.street, addr?.landmark].filter(Boolean).join(' · ') || '—'

  const paymentLabel = { gcash: 'GCash', maya: 'Maya', cod: 'Cash on Delivery' }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e7eb] sticky top-0 bg-white z-10 rounded-t-2xl">
          <div>
            <p className="font-heading font-bold text-[15px] text-gray-900">{displayRef}</p>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_PILL[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
              {STATUS_LABEL[order.status] ?? order.status}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">

          {/* Customer */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-400 mb-2">Customer</p>
            <p className="text-sm font-semibold text-gray-900">{order.customerName || '—'}</p>
          </div>

          {/* Pickup & Delivery */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-400 mb-2">Pickup & Delivery</p>
            <div className="space-y-2">
              <div className="flex gap-2">
                <svg className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                  <circle cx="12" cy="9" r="2.5" fill="currentColor" stroke="none"/>
                </svg>
                <p className="text-sm text-gray-700">{addressLine}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[#F4F7FA] rounded-xl p-3">
                  <p className="text-[10px] font-semibold text-gray-400 mb-0.5">Pickup</p>
                  <p className="text-xs font-semibold text-gray-800">{fmtDate(order.pickupDate)}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{order.pickupTime || '—'}</p>
                </div>
                <div className="bg-[#F4F7FA] rounded-xl p-3">
                  <p className="text-[10px] font-semibold text-gray-400 mb-0.5">Delivery</p>
                  <p className="text-xs font-semibold text-gray-800">{fmtDate(order.deliveryDate)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Laundry details */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-400 mb-2">Laundry Details</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Service',     value: order.serviceType ?? '—'        },
                { label: 'Est. weight', value: `${order.estimatedWeight} kg`   },
                { label: 'Detergent',   value: order.detergent ?? '—'          },
                { label: 'Conditioner', value: order.conditioner ?? '—'        },
              ].map(({ label, value }) => (
                <div key={label} className="bg-[#F4F7FA] rounded-xl px-3 py-2.5">
                  <p className="text-[10px] font-semibold text-gray-400 mb-0.5">{label}</p>
                  <p className="text-xs font-semibold text-gray-800">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-400 mb-2">Pricing</p>
            <div className="bg-[#F4F7FA] rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-xs text-gray-600">
                <span>Laundry ({order.estimatedWeight} kg × ₱{order.pricePerKg ?? 50})</span>
                <span className="font-medium text-gray-800">₱{((order.estimatedWeight ?? 0) * (order.pricePerKg ?? 50)).toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span>Pickup fee</span>
                <span className="font-medium text-gray-800">₱{order.pickupFee ?? 49}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span>Delivery fee</span>
                <span className="font-medium text-gray-800">₱{order.deliveryFee ?? 49}</span>
              </div>
              <div className="border-t border-[#e5e7eb] pt-2 flex justify-between text-sm font-bold text-gray-900">
                <span>{order.finalPrice != null ? 'Final total' : 'Estimated total'}</span>
                <span className="text-[#1B6CA8]">₱{(order.finalPrice ?? order.estimatedPrice ?? 0).toFixed(2)}</span>
              </div>
            </div>
            <p className="text-[11px] text-gray-500 mt-2 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <rect x="1" y="4" width="22" height="16" rx="2"/><path strokeLinecap="round" d="M1 10h22"/>
              </svg>
              {paymentLabel[order.paymentMethod] ?? order.paymentMethod ?? '—'}
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}

function OrderCard({ order }) {
  const [selectedStatus, setSelectedStatus] = useState(order.status)
  const [showDetails,    setShowDetails]    = useState(false)

  const isPending    = order.status === 'PENDING'
  const isCompleted  = order.status === 'COMPLETED' || order.status === 'CANCELLED'
  const isInProgress = IN_PROGRESS_STATUSES.has(order.status)
  const displayRef   = `LBG-${order.id.substring(0, 8).toUpperCase()}`

  async function handleAccept() {
    await updateDoc(doc(db, 'orders', order.id), {
      status: 'ACCEPTED', updatedAt: serverTimestamp(),
    })
  }

  async function handleDecline() {
    await updateDoc(doc(db, 'orders', order.id), {
      status: 'CANCELLED', updatedAt: serverTimestamp(),
    })
  }

  async function handleUpdateStatus() {
    await updateDoc(doc(db, 'orders', order.id), {
      status: selectedStatus, updatedAt: serverTimestamp(),
    })
  }

  return (
    <>
    <div className="bg-white rounded-xl border border-[#e5e7eb] p-5 flex flex-col sm:flex-row gap-5">

      {/* Left — order meta */}
      <div className="min-w-[148px]">
        <p className="font-heading font-bold text-[15px] text-gray-900">{displayRef}</p>
        <p className="text-sm text-gray-700 mt-0.5">{order.customerName}</p>
        <p className="text-[11px] text-gray-600 mt-1">
          {order.createdAt?.toDate
            ? order.createdAt.toDate().toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })
            : '—'}
        </p>
      </div>

      {/* Center — service info */}
      <div className="flex-1">
        <div className="flex flex-wrap gap-1.5 mb-2">
          <span className="text-[11px] font-semibold bg-[#E8F4FD] text-[#1B6CA8] px-2 py-0.5 rounded-full">
            {order.serviceType ?? '—'}
          </span>
          <span className="text-[11px] font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
            {order.estimatedWeight} kg
          </span>
          <span className="text-[11px] font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
            {order.detergent}
          </span>
        </div>
        {order.pickupAddress?.street && (
          <p className="text-[11px] text-gray-500 mt-1.5 flex items-center gap-1 leading-snug">
            <svg className="w-3 h-3 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
              <circle cx="12" cy="9" r="2.5" fill="currentColor" stroke="none"/>
            </svg>
            <span className="truncate max-w-[200px]">{order.pickupAddress.street}</span>
          </p>
        )}
        {order.pickupTime && (
          <p className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1">
            <svg className="w-3 h-3 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="9"/><path strokeLinecap="round" d="M12 7v5l3 3"/>
            </svg>
            {order.pickupTime}{order.pickupDate ? ` · ${new Date(order.pickupDate).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}` : ''}
          </p>
        )}
        <button
          onClick={() => setShowDetails(true)}
          className="text-xs text-[#1B6CA8] hover:underline font-medium mt-1"
        >
          View details
        </button>
      </div>

      {/* Right — status + actions */}
      <div className="flex flex-col items-start sm:items-end gap-2 sm:min-w-[176px]">
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${STATUS_PILL[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
          {STATUS_LABEL[order.status] ?? order.status}
        </span>

        {isPending && (
          <div className="flex flex-col gap-1.5 w-full">
            <button
              onClick={handleAccept}
              className="w-full bg-green-500 text-white text-xs font-semibold py-1.5 px-3 rounded-lg hover:bg-green-600 transition-colors"
            >
              Accept
            </button>
            <button
              onClick={handleDecline}
              className="w-full border border-red-400 text-red-500 text-xs font-semibold py-1.5 px-3 rounded-lg hover:bg-red-50 transition-colors"
            >
              Decline
            </button>
          </div>
        )}

        {isInProgress && (
          <div className="flex flex-col gap-1.5 w-full">
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="w-full text-xs border border-[#e5e7eb] rounded-lg px-2 py-1.5 text-gray-700 focus:outline-none focus:border-[#1B6CA8]"
            >
              {STATUS_OPTIONS.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <button
              onClick={handleUpdateStatus}
              className="w-full bg-[#1B6CA8] text-white text-xs font-semibold py-1.5 px-3 rounded-lg hover:bg-[#155a8a] transition-colors"
            >
              Update status
            </button>
          </div>
        )}

        {isCompleted && (
          <button className="border border-gray-300 text-gray-600 text-xs font-semibold py-1.5 px-4 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap">
            View receipt
          </button>
        )}
      </div>

    </div>
    {showDetails && <OrderDetailsModal order={order} onClose={() => setShowDetails(false)} />}
    </>
  )
}

// ─── WeightConfirmCard ─────────────────────────────────────────────────────────

function WeightConfirmCard({ order }) {
  const [actualWeight, setActualWeight] = useState(order.estimatedWeight ?? 5)
  const displayRef = `LBG-${order.id.substring(0, 8).toUpperCase()}`

  async function handleConfirm() {
    const pricePerKg = order.pricePerKg ?? 50
    const finalPrice = (actualWeight * pricePerKg) + (order.pickupFee ?? 49) + (order.deliveryFee ?? 49)
    await updateDoc(doc(db, 'orders', order.id), {
      actualWeight,
      finalPrice,
      updatedAt: serverTimestamp(),
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-6 pb-4 border-b border-[#e5e7eb]">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-600 mb-0.5">Order ID</p>
          <p className="font-heading font-bold text-[15px] text-gray-900">{displayRef}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-600 mb-0.5">Customer</p>
          <p className="text-sm font-medium text-gray-700">{order.customerName}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-600 mb-0.5">Customer estimate</p>
          <p className="text-sm font-medium text-gray-700">{order.estimatedWeight} kg</p>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-700 mb-2">Actual weight (kg)</p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActualWeight(w => Math.max(0.5, +(w - 0.5).toFixed(1)))}
            className="w-9 h-9 rounded-lg border border-[#e5e7eb] flex items-center justify-center text-lg font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            −
          </button>
          <input
            type="number"
            value={actualWeight}
            onChange={e => setActualWeight(+e.target.value)}
            className="w-20 text-center border border-[#e5e7eb] rounded-lg py-2 text-sm font-semibold text-gray-800 focus:outline-none focus:border-[#1B6CA8]"
            min="0.5"
            step="0.5"
          />
          <button
            onClick={() => setActualWeight(w => +(w + 0.5).toFixed(1))}
            className="w-9 h-9 rounded-lg border border-[#e5e7eb] flex items-center justify-center text-lg font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            +
          </button>
          <span className="text-sm text-gray-600 ml-1">kg</span>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-700 mb-2">Scale photo</p>
        <div className="w-full h-24 rounded-xl border-2 border-dashed border-amber-300 bg-amber-50 flex items-center justify-center">
          <span className="text-[10px] font-medium text-amber-500 text-center leading-snug px-4">
            Upload scale photo — merchant uploads proof of actual weight
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={handleConfirm}
          className="bg-[#F5A623] text-gray-900 font-heading font-semibold text-sm py-2.5 px-6 rounded-lg hover:bg-[#e09a1f] transition-colors"
        >
          Confirm weight & update invoice
        </button>
        <p className="text-xs text-gray-600">Customer will be notified with updated price</p>
      </div>
    </div>
  )
}

// ─── EarningsChart ────────────────────────────────────────────────────────────

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const MONTH_FULL  = ['January','February','March','April','May','June','July','August','September','October','November','December']
const CHART_H     = 140

function EarningsChart({ orders, chartHeight = 140 }) {
  const [tooltipIdx,    setTooltipIdx]    = useState(null)
  const [windowOffset,  setWindowOffset]  = useState(0)

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
        {/* Y-axis labels */}
        <div className="flex flex-col justify-between py-px shrink-0 w-9" style={{ height: chartHeight }}>
          {yLabels.map(v => (
            <span key={v} className="text-[9px] text-gray-400 leading-none text-right block">
              {v === 0 ? '₱0' : `₱${v / 1000}k`}
            </span>
          ))}
        </div>

        {/* Chart area */}
        <div className="flex-1 relative" style={{ height: chartHeight }}>
          {/* Horizontal grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
            {yLabels.map((v, i) => (
              <div
                key={v}
                className={`w-full border-dashed border-gray-200 ${i === yLabels.length - 1 ? 'border-b' : 'border-t'}`}
              />
            ))}
          </div>

          {/* Shared tooltip — rendered at chart level so it never leaks outside */}
          {tooltipIdx !== null && (
            <div
              className="absolute top-2 z-20 bg-white border border-[#e5e7eb] rounded-xl shadow-md px-4 py-2.5 whitespace-nowrap pointer-events-none"
              style={{
                left: `${(tooltipIdx + 0.5) * (100 / 6)}%`,
                transform: 'translateX(-50%)',
              }}
            >
              <p className="text-sm font-semibold text-gray-900">{data[tooltipIdx]?.full}</p>
              <p className="text-xs font-bold text-[#F5A623] mt-0.5">
                Earnings : ₱{data[tooltipIdx]?.earnings.toFixed(2)}
              </p>
            </div>
          )}

          {/* Bars */}
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
                      className={`w-full rounded-t-sm ${
                        d.isCurrentMonth ? 'bg-[#F5A623]' : 'bg-gray-300'
                      }`}
                      style={{ height: `${barH}px` }}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* X-axis labels — offset matches y-axis width (36px) + gap (8px) = 44px = pl-11 */}
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

// ─── PillGroup ────────────────────────────────────────────────────────────────

function PillGroup({ options, selected, onChange }) {
  function toggle(opt) {
    onChange(selected.includes(opt)
      ? selected.filter(s => s !== opt)
      : [...selected, opt])
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button
          key={opt}
          type="button"
          onClick={() => toggle(opt)}
          className={`text-sm px-3.5 py-1.5 rounded-full border transition-colors ${
            selected.includes(opt)
              ? 'bg-[#1B6CA8] text-white border-[#1B6CA8]'
              : 'border-[#e5e7eb] text-gray-600 hover:border-gray-400'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

// ─── ServicesTab ─────────────────────────────────────────────────────────────

function ServicesTab({ shopForm, setShopForm, isSaving, saveSuccess, onSave }) {
  if (!shopForm) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 rounded-full border-4 border-gray-200 border-t-[#1B6CA8] animate-spin" />
      </div>
    )
  }

  const [previewService, setPreviewService] = useState(null)

  function field(key, value) {
    setShopForm(f => ({ ...f, [key]: value }))
  }

  function setServicePrice(svc, val) {
    setShopForm(f => {
      const updated = { ...(f.pricesByService ?? {}) }
      if (val === '') { delete updated[svc] } else { updated[svc] = +val }
      return { ...f, pricesByService: updated }
    })
  }

  const selectedServices  = shopForm.services ?? []
  const effectivePreviewSvc = (previewService && selectedServices.includes(previewService))
    ? previewService
    : selectedServices[0] ?? null
  const previewRate   = effectivePreviewSvc
    ? ((shopForm.pricesByService ?? {})[effectivePreviewSvc] ?? (shopForm.pricePerKg ?? 50))
    : (shopForm.pricePerKg ?? 50)
  const condAdd        = shopForm.conditioner ? (shopForm.conditionerPrice ?? 0) : 0
  const estimatedTotal = (5 * previewRate) + (shopForm.pickupFee ?? 49) + (shopForm.deliveryFee ?? 49) + condAdd

  return (
    <div className="space-y-6">
      <h2 className="font-heading font-bold text-[17px] text-gray-900">Services & Pricing</h2>

      <div className="flex flex-col md:flex-row gap-6 md:items-start">

        {/* ── Left: Preview ───────────────────────────────────────────── */}
        <div className="md:w-[240px] md:shrink-0 space-y-4">

          <div className="bg-white rounded-2xl border border-[#e5e7eb] p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400 mb-3">Price Preview</p>
            {selectedServices.length > 1 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {selectedServices.map(svc => (
                  <button
                    key={svc}
                    type="button"
                    onClick={() => setPreviewService(svc)}
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold transition-colors leading-tight ${
                      effectivePreviewSvc === svc
                        ? 'bg-[#1B6CA8] text-white'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {svc}
                  </button>
                ))}
              </div>
            )}
            <p className="text-[11px] text-gray-400 mb-3">
              Estimated for 5 kg{effectivePreviewSvc ? ` · ${effectivePreviewSvc}` : ''}:
            </p>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Laundry service</span>
                <span className="text-xs font-semibold text-gray-800">₱{5 * previewRate}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Pickup fee</span>
                <span className="text-xs font-semibold text-gray-800">₱{shopForm.pickupFee ?? 49}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Delivery fee</span>
                <span className="text-xs font-semibold text-gray-800">₱{shopForm.deliveryFee ?? 49}</span>
              </div>
              {shopForm.conditioner && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Conditioner</span>
                  <span className="text-xs font-semibold text-gray-800">+₱{shopForm.conditionerPrice ?? 0}</span>
                </div>
              )}
              <div className="border-t border-[#e5e7eb] pt-2.5 mt-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-800">Est. total</span>
                  <span className="text-sm font-bold text-[#1B6CA8]">₱{estimatedTotal.toFixed(0)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#e5e7eb] p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400 mb-3">Summary</p>
            <div className="space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Services offered</span>
                <span className="text-xs font-semibold text-gray-700">{(shopForm.services ?? []).length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Detergent options</span>
                <span className="text-xs font-semibold text-gray-700">{(shopForm.detergents ?? []).length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Same-day</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${shopForm.isSameDay ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                  {shopForm.isSameDay ? 'Available' : 'Not offered'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Conditioner</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${shopForm.conditioner ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                  {shopForm.conditioner ? 'Available' : 'Not offered'}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* ── Right: Edit form ─────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-5">

          {/* Services */}
          <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e5e7eb]">
              <h3 className="font-heading font-semibold text-[15px] text-gray-900">Services Offered</h3>
            </div>
            <div className="p-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-600 mb-3">Select all that apply</p>
              <PillGroup
                options={SERVICE_TYPES}
                selected={shopForm.services ?? []}
                onChange={v => field('services', v)}
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e5e7eb]">
              <h3 className="font-heading font-semibold text-[15px] text-gray-900">Pricing</h3>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-600 mb-1">Default rate</p>
                <p className="text-[11px] text-gray-400 mb-2">Applies to any service without a custom rate</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-600 mb-2">Per kg</p>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">₱</span>
                      <input type="number" min={1} value={shopForm.pricePerKg ?? 50}
                        onChange={e => field('pricePerKg', +e.target.value)}
                        className="w-full pl-7 border border-[#e5e7eb] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B6CA8] focus:ring-2 focus:ring-[#1B6CA8]/15" />
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-600 mb-2">Pickup fee</p>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">₱</span>
                      <input type="number" min={0} value={shopForm.pickupFee ?? 49}
                        onChange={e => field('pickupFee', +e.target.value)}
                        className="w-full pl-7 border border-[#e5e7eb] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B6CA8] focus:ring-2 focus:ring-[#1B6CA8]/15" />
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-600 mb-2">Delivery fee</p>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">₱</span>
                      <input type="number" min={0} value={shopForm.deliveryFee ?? 49}
                        onChange={e => field('deliveryFee', +e.target.value)}
                        className="w-full pl-7 border border-[#e5e7eb] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B6CA8] focus:ring-2 focus:ring-[#1B6CA8]/15" />
                    </div>
                  </div>
                </div>
              </div>

              {selectedServices.length > 0 && (
                <div className="border-t border-[#e5e7eb] pt-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-600 mb-1">Per-service rates</p>
                  <p className="text-[11px] text-gray-400 mb-4">Set a custom rate per kg for each service. Leave blank to use the default above.</p>
                  <div className="space-y-3">
                    {selectedServices.map(svc => {
                      const custom = (shopForm.pricesByService ?? {})[svc]
                      return (
                        <div key={svc} className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-700 w-36 shrink-0">{svc}</span>
                          <div className="relative w-28">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">₱</span>
                            <input
                              type="number"
                              min={1}
                              placeholder={String(shopForm.pricePerKg ?? 50)}
                              value={custom ?? ''}
                              onChange={e => setServicePrice(svc, e.target.value)}
                              className="w-full pl-7 border border-[#e5e7eb] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#1B6CA8] focus:ring-2 focus:ring-[#1B6CA8]/15"
                            />
                          </div>
                          <span className="text-xs text-gray-400">/kg</span>
                          {custom != null
                            ? <span className="text-[10px] font-semibold bg-[#E8F4FD] text-[#1B6CA8] px-2 py-0.5 rounded-full">Custom</span>
                            : <span className="text-[10px] text-gray-400">Uses default</span>
                          }
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Profile Price List */}
          <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e5e7eb]">
              <h3 className="font-heading font-semibold text-[15px] text-gray-900">Profile Price List</h3>
              <p className="text-xs text-gray-500 mt-0.5">These rows appear on your public shop profile for customers to see</p>
            </div>
            <div className="p-6 space-y-2">
              {(shopForm.servicePricing ?? []).map((svc, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      value={svc.name}
                      onChange={e => field('servicePricing', (shopForm.servicePricing ?? []).map((x, j) => j === i ? { ...x, name: e.target.value } : x))}
                      placeholder="Service name"
                      className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1B6CA8] focus:ring-1 focus:ring-[#1B6CA8]/15"
                    />
                    <input
                      value={svc.price}
                      onChange={e => field('servicePricing', (shopForm.servicePricing ?? []).map((x, j) => j === i ? { ...x, price: e.target.value } : x))}
                      placeholder="₱65/kg"
                      className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1B6CA8] focus:ring-1 focus:ring-[#1B6CA8]/15"
                    />
                    <input
                      value={svc.desc}
                      onChange={e => field('servicePricing', (shopForm.servicePricing ?? []).map((x, j) => j === i ? { ...x, desc: e.target.value } : x))}
                      placeholder="Short note (optional)"
                      className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1B6CA8] focus:ring-1 focus:ring-[#1B6CA8]/15"
                    />
                  </div>
                  <button type="button"
                    onClick={() => field('servicePricing', (shopForm.servicePricing ?? []).filter((_, j) => j !== i))}
                    className="mt-2 text-gray-400 hover:text-red-500 transition-colors shrink-0">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
              {(shopForm.servicePricing ?? []).length === 0 && (
                <p className="text-xs text-gray-400 italic py-1">No pricing rows yet. Add one below.</p>
              )}
              <button type="button"
                onClick={() => field('servicePricing', [...(shopForm.servicePricing ?? []), { name: '', price: '', desc: '' }])}
                className="text-xs font-semibold text-[#1B6CA8] hover:underline mt-1">
                + Add pricing row
              </button>
            </div>
          </div>

          {/* Detergents & Add-ons */}
          <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e5e7eb]">
              <h3 className="font-heading font-semibold text-[15px] text-gray-900">Detergents & Add-ons</h3>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-600 mb-3">Accepted Detergents</p>
                <PillGroup
                  options={DETERGENTS}
                  selected={shopForm.detergents ?? []}
                  onChange={v => field('detergents', v)}
                />
              </div>
              <div className="border-t border-[#e5e7eb] pt-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Fabric Conditioner</p>
                    <p className="text-xs text-gray-500 mt-0.5">Offer as an optional add-on for customers</p>
                  </div>
                  <button type="button" onClick={() => field('conditioner', !shopForm.conditioner)}
                    className={`relative w-10 h-[22px] rounded-full transition-colors duration-200 shrink-0 ${shopForm.conditioner ? 'bg-emerald-500' : 'bg-gray-200'}`}>
                    <div className={`absolute top-0.5 w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-transform duration-200 ${shopForm.conditioner ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                {shopForm.conditioner && (
                  <div className="flex items-center gap-3 mt-2">
                    <p className="text-xs font-semibold text-gray-700 whitespace-nowrap">Add-on price:</p>
                    <div className="relative w-32">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">₱</span>
                      <input type="number" min={0} value={shopForm.conditionerPrice ?? 0}
                        onChange={e => field('conditionerPrice', +e.target.value)}
                        className="w-full pl-7 border border-[#e5e7eb] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B6CA8] focus:ring-2 focus:ring-[#1B6CA8]/15" />
                    </div>
                    <p className="text-[11px] text-gray-400">(₱0 = free add-on)</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Availability */}
          <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e5e7eb]">
              <h3 className="font-heading font-semibold text-[15px] text-gray-900">Availability</h3>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Same-day service</p>
                  <p className="text-xs text-gray-500 mt-0.5">Accept orders that need to be returned the same day</p>
                </div>
                <button type="button" onClick={() => field('isSameDay', !shopForm.isSameDay)}
                  className={`relative w-10 h-[22px] rounded-full transition-colors duration-200 shrink-0 ${shopForm.isSameDay ? 'bg-emerald-500' : 'bg-gray-200'}`}>
                  <div className={`absolute top-0.5 w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-transform duration-200 ${shopForm.isSameDay ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Save */}
          <div className="flex items-center gap-4">
            <button type="button" onClick={onSave} disabled={isSaving}
              className="bg-[#1B6CA8] text-white font-semibold text-sm py-2.5 px-7 rounded-xl hover:bg-[#155a8a] transition-colors disabled:opacity-60">
              {isSaving ? 'Saving…' : 'Save changes'}
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

        </div>
      </div>
    </div>
  )
}

// ─── ShopProfileTab ───────────────────────────────────────────────────────────

function ShopProfileTab({ shopForm, setShopForm, isSaving, saveSuccess, photoUploading, photoError,
                          onSave, onPhotoUpload, isOpen, shopRating, reviewCount, onGoToServices }) {

  if (!shopForm) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 rounded-full border-4 border-gray-200 border-t-[#1B6CA8] animate-spin" />
      </div>
    )
  }

  function field(key, value) {
    setShopForm(f => ({ ...f, [key]: value }))
  }

  const stars = Math.round(shopRating ?? 0)

  function fmt12(t) {
    if (!t) return ''
    const [h, m] = t.split(':').map(Number)
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
  }

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 bg-[#F4F7FA] py-3 -mt-3 flex items-center justify-between border-b border-[#e5e7eb]/70">
        <h2 className="font-heading font-bold text-[17px] text-gray-900">My Shop Profile</h2>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="bg-[#1B6CA8] text-white font-semibold text-sm py-2 px-5 rounded-xl hover:bg-[#155a8a] transition-colors disabled:opacity-60"
          >
            {isSaving ? 'Saving…' : 'Save changes'}
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
      </div>

      <div className="flex flex-col md:flex-row gap-6 md:items-start">

        {/* ── Left: Preview card ───────────────────────────────────────── */}
        <div className="md:w-[260px] md:shrink-0 space-y-4">
          <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden">

            {/* Cover photo */}
            <div className="relative h-32 bg-gradient-to-br from-[#DBEAFE] to-[#93C5FD] overflow-hidden">
              {shopForm.image && shopForm.image.startsWith('http')
                ? <img src={shopForm.image} alt="Shop cover" className="w-full h-full object-cover" />
                : <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                    <svg className="w-7 h-7 text-[#1B6CA8]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 21h18M3.75 3h16.5M3.75 3a.75.75 0 00-.75.75v15.5c0 .414.336.75.75.75h16.5a.75.75 0 00.75-.75V3.75a.75.75 0 00-.75-.75H3.75z"/>
                    </svg>
                    <p className="text-[10px] text-[#1B6CA8]/40 font-medium">No photo yet</p>
                  </div>
              }
              <label className={`absolute bottom-2 right-2 w-7 h-7 rounded-full bg-white/90 shadow flex items-center justify-center cursor-pointer hover:bg-white transition-colors ${photoUploading ? 'opacity-60 pointer-events-none' : ''}`}>
                {photoUploading
                  ? <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300 border-t-[#1B6CA8] animate-spin" />
                  : <svg className="w-3.5 h-3.5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                    </svg>
                }
                <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && onPhotoUpload(e.target.files[0])} />
              </label>
              <span className={`absolute top-2.5 right-2.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isOpen ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
              }`}>
                {isOpen ? 'Open' : 'Closed'}
              </span>
            </div>

            {/* Info */}
            <div className="p-4">
              <p className="font-heading font-bold text-[15px] text-gray-900 truncate">
                {shopForm.name || 'Your Shop Name'}
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5 truncate">{shopForm.address || 'No address set'}</p>

              {/* Rating */}
              <div className="flex items-center gap-1.5 mt-2">
                <div className="flex">
                  {[1,2,3,4,5].map(n => (
                    <svg key={n} className={`w-3 h-3 ${n <= stars ? 'text-[#F5A623]' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                  ))}
                </div>
                <span className="text-[11px] text-gray-500">{shopRating?.toFixed(1) ?? '—'} ({reviewCount ?? 0} reviews)</span>
              </div>

              {/* Service pills */}
              {shopForm.services?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2.5">
                  {shopForm.services.slice(0, 3).map(s => (
                    <span key={s} className="text-[9px] font-semibold bg-[#E8F4FD] text-[#0C447C] px-2 py-0.5 rounded-full">{s}</span>
                  ))}
                  {shopForm.services.length > 3 && (
                    <span className="text-[9px] font-semibold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">+{shopForm.services.length - 3}</span>
                  )}
                </div>
              )}

              {/* Price */}
              <p className="text-[11px] font-bold text-[#1B6CA8] mt-2.5">₱{shopForm.pricePerKg ?? 50}/kg</p>
            </div>
          </div>

          {/* Account meta */}
          <div className="bg-white rounded-2xl border border-[#e5e7eb] p-4 space-y-2.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400 mb-1">Account</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Same-day service</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${shopForm.isSameDay ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                {shopForm.isSameDay ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">GCash</span>
              <span className="text-xs font-medium text-gray-700">{shopForm.gcash || '—'}</span>
            </div>
          </div>
        </div>

        {/* ── Right: Edit form ─────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-5">

          {/* Shop Identity */}
          <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e5e7eb]">
              <h3 className="font-heading font-semibold text-[15px] text-gray-900">Shop Identity</h3>
            </div>
            <div className="p-6 space-y-4">

              {/* Name */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-600 mb-2">Shop Name</p>
                <input
                  type="text"
                  value={shopForm.name}
                  onChange={e => field('name', e.target.value)}
                  className="w-full border border-[#e5e7eb] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B6CA8] focus:ring-2 focus:ring-[#1B6CA8]/15"
                  placeholder="e.g. Maria's Laundry Shop"
                />
              </div>

              {/* Description */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-600 mb-2">
                  Tagline / Description
                  <span className="ml-2 normal-case font-normal text-gray-400">{(shopForm.description ?? '').length}/200</span>
                </p>
                <textarea
                  value={shopForm.description}
                  onChange={e => field('description', e.target.value.slice(0, 200))}
                  rows={2}
                  className="w-full border border-[#e5e7eb] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B6CA8] focus:ring-2 focus:ring-[#1B6CA8]/15 resize-none"
                  placeholder="A short description customers will see on your shop card…"
                />
              </div>

              {/* About */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-600 mb-2">About (shown in shop profile drawer)</p>
                <textarea
                  value={shopForm.about ?? ''}
                  onChange={e => field('about', e.target.value)}
                  rows={4}
                  className="w-full border border-[#e5e7eb] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B6CA8] focus:ring-2 focus:ring-[#1B6CA8]/15 resize-none"
                  placeholder="Tell customers about your shop — history, what makes you special, your process…"
                />
              </div>

              {photoError && <p className="text-xs text-red-500">{photoError}</p>}
            </div>
          </div>

          {/* Location & Contact */}
          <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e5e7eb]">
              <h3 className="font-heading font-semibold text-[15px] text-gray-900">Location & Contact</h3>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="col-span-1 sm:col-span-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-600 mb-2">Shop Address</p>
                <input
                  type="text"
                  value={shopForm.address}
                  onChange={e => field('address', e.target.value)}
                  className="w-full border border-[#e5e7eb] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B6CA8] focus:ring-2 focus:ring-[#1B6CA8]/15"
                  placeholder="Full address of your laundry shop"
                />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-600 mb-2">Shop Phone</p>
                <input
                  type="tel"
                  value={shopForm.phone ?? ''}
                  onChange={e => field('phone', e.target.value)}
                  className="w-full border border-[#e5e7eb] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B6CA8] focus:ring-2 focus:ring-[#1B6CA8]/15"
                  placeholder="09171234567"
                />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-600 mb-2">Shop Email</p>
                <input
                  type="email"
                  value={shopForm.email ?? ''}
                  onChange={e => field('email', e.target.value)}
                  className="w-full border border-[#e5e7eb] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B6CA8] focus:ring-2 focus:ring-[#1B6CA8]/15"
                  placeholder="shop@email.com"
                />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-600 mb-2">GCash Number</p>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">₱</span>
                  <input
                    type="text"
                    value={shopForm.gcash}
                    onChange={e => field('gcash', e.target.value)}
                    className="w-full pl-7 border border-[#e5e7eb] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B6CA8] focus:ring-2 focus:ring-[#1B6CA8]/15"
                    placeholder="09XX XXX XXXX"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Operating Hours — read-only summary; edit via Settings → Business Hours */}
          <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e5e7eb] flex items-center justify-between">
              <h3 className="font-heading font-semibold text-[15px] text-gray-900">Operating Hours</h3>
              <span className="text-[11px] text-gray-400">Edit in Settings → Business Hours</span>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-x-8 gap-y-1.5">
                {DAYS_OF_WEEK.map(({ id, label }) => {
                  const day = shopForm.businessHours?.[id] ?? { open: false, from: '08:00', to: '18:00' }
                  return (
                    <div key={id} className="flex items-center justify-between py-1 border-b border-[#f3f4f6]">
                      <span className={`text-xs font-medium ${day.open ? 'text-gray-700' : 'text-gray-400'}`}>{label}</span>
                      <span className={`text-xs ${day.open ? 'text-gray-600' : 'text-gray-400 italic'}`}>
                        {day.open ? `${fmt12(day.from)} – ${fmt12(day.to)}` : 'Closed'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Pricing Details — cross-link to Services & Pricing tab */}
          <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e5e7eb] flex items-center justify-between">
              <div>
                <h3 className="font-heading font-semibold text-[15px] text-gray-900">Pricing Details</h3>
                <p className="text-xs text-gray-500 mt-0.5">Individual service prices shown on your public shop profile</p>
              </div>
              <button
                type="button"
                onClick={() => onGoToServices?.()}
                className="text-xs font-semibold text-[#1B6CA8] hover:underline shrink-0"
              >
                Edit in Services & Pricing →
              </button>
            </div>
            <div className="px-6 py-4">
              {(shopForm.servicePricing ?? []).length === 0 ? (
                <p className="text-xs text-gray-400 italic">No pricing rows added yet.</p>
              ) : (
                <div className="divide-y divide-[#f3f4f6]">
                  {(shopForm.servicePricing ?? []).map((svc, i) => (
                    <div key={i} className="flex items-center justify-between py-2 gap-4">
                      <span className="text-sm text-gray-700 font-medium">{svc.name || '—'}</span>
                      <span className="text-sm font-semibold text-[#1B6CA8]">{svc.price || '—'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Amenities */}
          <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e5e7eb]">
              <h3 className="font-heading font-semibold text-[15px] text-gray-900">What's Included</h3>
              <p className="text-xs text-gray-500 mt-0.5">Amenities and features available at your shop</p>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {AMENITY_OPTIONS.map(opt => {
                const checked = (shopForm.amenities ?? []).includes(opt)
                return (
                  <label key={opt} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border cursor-pointer transition-colors text-sm ${checked ? 'border-[#1B6CA8] bg-[#E8F4FD] text-[#1B6CA8] font-medium' : 'border-[#e5e7eb] text-gray-600 hover:border-[#1B6CA8]/40'}`}>
                    <input type="checkbox" className="hidden" checked={checked} onChange={() => field('amenities', checked ? (shopForm.amenities ?? []).filter(a => a !== opt) : [...(shopForm.amenities ?? []), opt])} />
                    <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${checked ? 'bg-[#1B6CA8] border-[#1B6CA8]' : 'border-gray-300'}`}>
                      {checked && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </span>
                    {opt}
                  </label>
                )
              })}
            </div>
          </div>

          {/* Services & Pricing */}
          <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e5e7eb]">
              <h3 className="font-heading font-semibold text-[15px] text-gray-900">Services & Pricing</h3>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-600 mb-3">Services Offered</p>
                <PillGroup
                  options={SERVICE_TYPES}
                  selected={shopForm.services ?? []}
                  onChange={v => field('services', v)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-600 mb-2">Price per kg</p>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">₱</span>
                    <input
                      type="number"
                      min={1}
                      value={shopForm.pricePerKg}
                      onChange={e => field('pricePerKg', +e.target.value)}
                      className="w-full pl-7 border border-[#e5e7eb] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B6CA8] focus:ring-2 focus:ring-[#1B6CA8]/15"
                    />
                  </div>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-600 mb-3">Accepted Detergents</p>
                <PillGroup
                  options={DETERGENTS}
                  selected={shopForm.detergents ?? []}
                  onChange={v => field('detergents', v)}
                />
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e5e7eb]">
              <h3 className="font-heading font-semibold text-[15px] text-gray-900">Preferences</h3>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Same-day service</p>
                  <p className="text-xs text-gray-500 mt-0.5">Accept orders that need to be returned the same day</p>
                </div>
                <button
                  type="button"
                  onClick={() => field('isSameDay', !shopForm.isSameDay)}
                  className={`relative w-10 h-[22px] rounded-full transition-colors duration-200 shrink-0 ${shopForm.isSameDay ? 'bg-emerald-500' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-0.5 w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-transform duration-200 ${shopForm.isSameDay ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

// ─── OrdersTab ────────────────────────────────────────────────────────────────

function OrdersTab({ orders, tab, setTab, dateFilter, setDateFilter }) {
  const [search, setSearch] = useState('')

  const now = new Date()

  function exportCSV() {
    const headers = ['Order ID', 'Customer', 'Date', 'Status', 'Services', 'Weight (kg)', 'Price (₱)']
    const rows = filtered.map(o => [
      `LBG-${o.id.substring(0, 8).toUpperCase()}`,
      o.customerName ?? '—',
      o.createdAt?.toDate?.().toLocaleDateString('en-PH') ?? '—',
      STATUS_LABEL[o.status] ?? o.status,
      (o.services ?? []).join(', '),
      o.confirmedWeight ?? o.estimatedWeight ?? '—',
      (o.finalPrice ?? 0).toFixed(2),
    ])
    const csv = [headers, ...rows]
      .map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `labadago-orders-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function startOfWeek(d) {
    const s = new Date(d)
    s.setDate(d.getDate() - d.getDay())
    s.setHours(0, 0, 0, 0)
    return s
  }

  function matchesDate(o) {
    const d = o.createdAt?.toDate?.()
    if (!d) return true
    if (dateFilter === 'today') {
      return d.getFullYear() === now.getFullYear() &&
             d.getMonth()    === now.getMonth()    &&
             d.getDate()     === now.getDate()
    }
    if (dateFilter === 'week')  return d >= startOfWeek(now)
    if (dateFilter === 'month') return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    return true
  }

  function matchesSearch(o) {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      o.customerName?.toLowerCase().includes(q) ||
      `lbg-${o.id.substring(0, 8).toLowerCase()}`.includes(q)
    )
  }

  function matchesTab(o) {
    if (tab === 'All')         return true
    if (tab === 'Pending')     return o.status === 'PENDING'
    if (tab === 'In Progress') return IN_PROGRESS_STATUSES.has(o.status)
    if (tab === 'Completed')   return o.status === 'COMPLETED'
    if (tab === 'Cancelled')   return o.status === 'CANCELLED'
    return true
  }

  const filtered = orders.filter(o => matchesDate(o) && matchesSearch(o) && matchesTab(o))

  const counts = {
    all:        orders.filter(o => matchesDate(o) && matchesSearch(o)).length,
    pending:    orders.filter(o => matchesDate(o) && matchesSearch(o) && o.status === 'PENDING').length,
    inProgress: orders.filter(o => matchesDate(o) && matchesSearch(o) && IN_PROGRESS_STATUSES.has(o.status)).length,
    completed:  orders.filter(o => matchesDate(o) && matchesSearch(o) && o.status === 'COMPLETED').length,
    cancelled:  orders.filter(o => matchesDate(o) && matchesSearch(o) && o.status === 'CANCELLED').length,
  }

  const TAB_COUNTS = [
    { id: 'All',         count: counts.all        },
    { id: 'Pending',     count: counts.pending    },
    { id: 'In Progress', count: counts.inProgress },
    { id: 'Completed',   count: counts.completed  },
    { id: 'Cancelled',   count: counts.cancelled  },
  ]

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-heading font-bold text-[17px] text-gray-900">Orders</h2>
        {filtered.length > 0 && (
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#1B6CA8] hover:text-[#155a8a] transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
            Export CSV
          </button>
        )}
      </div>

      {/* Status tabs with counts — same layout as Dashboard filter tabs */}
      <div className="flex gap-1 bg-white border border-[#e5e7eb] rounded-xl p-1 shadow-sm overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {TAB_COUNTS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`shrink-0 sm:flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              tab === t.id
                ? 'bg-[#0A2540] text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-700'
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

      {/* Search + date filter */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            type="text"
            placeholder="Search by customer or order ID…"
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

        {/* Date filter pills */}
        <div className="flex gap-1 items-center overflow-x-auto shrink-0" style={{ scrollbarWidth: 'none' }}>
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
          {(search || dateFilter !== 'all' || tab !== 'All') && (
            <button
              onClick={() => { setSearch(''); setDateFilter('all'); setTab('All') }}
              className="ml-1 px-3 py-2 rounded-xl text-xs font-semibold text-red-500 border border-red-200 bg-red-50 hover:bg-red-100 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Orders list */}
      <div className="space-y-3">
        {filtered.map(order => <OrderCard key={order.id} order={order} />)}
        {filtered.length === 0 && (
          <div className="bg-white rounded-2xl border border-[#e5e7eb] px-5 py-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-500">No orders found</p>
              <p className="text-xs text-gray-400">Try adjusting your search or filters</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── SettingsTab ─────────────────────────────────────────────────────────────

function SettingsTab({ user, userProfile, shopForm, setShopForm, shopId,
                       isSaving, saveSuccess, onSaveShop }) {
  const navigate = useNavigate()

  const [notifs,          setNotifs]          = useState(null)
  const [nSaving,         setNSaving]         = useState(false)
  const [nSuccess,        setNSuccess]        = useState(false)
  const notifsLoaded = useRef(false)

  const [pwForm,    setPwForm]    = useState({ current: '', next: '', confirm: '' })
  const [pwSaving,  setPwSaving]  = useState(false)
  const [pwError,   setPwError]   = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)

  const [showDeactivate,   setShowDeactivate]   = useState(false)
  const [deactivateInput,  setDeactivateInput]  = useState('')
  const [deactivating,     setDeactivating]     = useState(false)

  useEffect(() => {
    if (userProfile && !notifsLoaded.current) {
      notifsLoaded.current = true
      setNotifs({
        newOrder:        userProfile.notifications?.newOrder        ?? true,
        orderPickedUp:   userProfile.notifications?.orderPickedUp   ?? true,
        orderCompleted:  userProfile.notifications?.orderCompleted  ?? true,
        orderCancelled:  userProfile.notifications?.orderCancelled  ?? true,
        newReview:       userProfile.notifications?.newReview       ?? true,
      })
    }
  }, [userProfile])

  const isEmailUser = user?.providerData?.some(p => p.providerId === 'password') ?? false
  const initials    = userProfile?.fullName?.split(' ').map(n => n[0]).slice(0, 2).join('') ?? 'M'

  function notifField(key, val) { setNotifs(n => ({ ...n, [key]: val })) }
  function shopField(key, val)  { setShopForm(f => ({ ...f, [key]: val })) }
  function hoursField(day, sub, val) {
    setShopForm(f => ({
      ...f,
      businessHours: {
        ...(f.businessHours ?? DEFAULT_BUSINESS_HOURS),
        [day]: { ...(f.businessHours?.[day] ?? { open: false, from: '08:00', to: '18:00' }), [sub]: val },
      },
    }))
  }

  async function handleSaveNotifs() {
    setNSaving(true)
    try {
      await updateDoc(doc(db, 'users', user.uid), { notifications: notifs, updatedAt: serverTimestamp() })
      setNSuccess(true)
      setTimeout(() => setNSuccess(false), 2500)
    } finally { setNSaving(false) }
  }

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
    } finally { setPwSaving(false) }
  }

  async function handleDeactivate() {
    if (deactivateInput !== 'DEACTIVATE') return
    setDeactivating(true)
    try {
      await updateDoc(doc(db, 'shops', String(shopId)), { isActive: false, updatedAt: serverTimestamp() })
      await signOut(auth)
      navigate('/')
    } finally { setDeactivating(false) }
  }

  const SaveSuccess = () => (
    <div className="flex items-center gap-1.5 text-emerald-600 text-sm font-medium">
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
      </svg>
      Saved!
    </div>
  )

  if (!shopForm) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 rounded-full border-4 border-gray-200 border-t-[#1B6CA8] animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <h2 className="font-heading font-bold text-[17px] text-gray-900">Settings</h2>

      {/* ── Account ──────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e5e7eb]">
          <h3 className="font-heading font-semibold text-[15px] text-gray-900">Account</h3>
        </div>
        <div className="p-6 flex items-center gap-5">
          <div className="w-14 h-14 rounded-full bg-[#F5A623] flex items-center justify-center shrink-0 overflow-hidden">
            {user?.photoURL
              ? <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
              : <span className="text-[#0A2540] font-bold text-lg">{initials}</span>
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 truncate">{userProfile?.fullName ?? '—'}</p>
            <p className="text-sm text-gray-500 mt-0.5 truncate">{user?.email ?? '—'}</p>
          </div>
          <button onClick={() => navigate('/profile')}
            className="shrink-0 text-sm font-semibold text-[#1B6CA8] hover:underline">
            Edit profile →
          </button>
        </div>
      </div>

      {/* ── Security ─────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e5e7eb]">
          <h3 className="font-heading font-semibold text-[15px] text-gray-900">Security</h3>
        </div>
        <div className="p-6">
          {isEmailUser ? (
            <div className="space-y-4 max-w-md">
              {[
                { field: 'current', label: 'Current password', placeholder: 'Enter current password' },
                { field: 'next',    label: 'New password',     placeholder: 'At least 6 characters'  },
                { field: 'confirm', label: 'Confirm new password', placeholder: 'Re-enter new password' },
              ].map(({ field, label, placeholder }) => (
                <div key={field}>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-600 mb-2">{label}</p>
                  <input type="password" value={pwForm[field]}
                    onChange={e => setPwForm(f => ({ ...f, [field]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full border border-[#e5e7eb] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B6CA8] focus:ring-2 focus:ring-[#1B6CA8]/15" />
                </div>
              ))}
              {pwError && <p className="text-sm text-red-500">{pwError}</p>}
              <div className="flex items-center gap-3">
                <button onClick={handleChangePassword} disabled={pwSaving}
                  className="bg-[#1B6CA8] text-white font-semibold text-sm py-2.5 px-6 rounded-xl hover:bg-[#155a8a] transition-colors disabled:opacity-60">
                  {pwSaving ? 'Updating…' : 'Update password'}
                </button>
                {pwSuccess && <SaveSuccess />}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 py-1">
              <div className="w-9 h-9 rounded-xl bg-[#E8F4FD] flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-[#1B6CA8]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Signed in with Google</p>
                <p className="text-xs text-gray-500 mt-0.5">Your password is managed by your Google account.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Notifications ────────────────────────────────────────────────── */}
      {notifs && (
        <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#e5e7eb]">
            <h3 className="font-heading font-semibold text-[15px] text-gray-900">Notifications</h3>
          </div>
          <div className="p-6 space-y-5">
            {[
              { key: 'newOrder',        label: 'New order received',  desc: 'When a customer places a new order at your shop'     },
              { key: 'orderPickedUp',   label: 'Order picked up',     desc: 'When a rider collects laundry from a customer'       },
              { key: 'orderCompleted',  label: 'Order completed',     desc: 'When an order is delivered and marked as complete'   },
              { key: 'orderCancelled',  label: 'Order cancelled',     desc: 'When a customer cancels an order at your shop'       },
              { key: 'newReview',       label: 'New review',          desc: 'When a customer leaves a review for your shop'       },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                </div>
                <button type="button" onClick={() => notifField(key, !notifs[key])}
                  className={`relative w-10 h-[22px] rounded-full transition-colors duration-200 shrink-0 ${notifs[key] ? 'bg-emerald-500' : 'bg-gray-200'}`}>
                  <div className={`absolute top-0.5 w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-transform duration-200 ${notifs[key] ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                </button>
              </div>
            ))}
            <div className="flex items-center gap-4 pt-1 border-t border-[#e5e7eb]">
              <button onClick={handleSaveNotifs} disabled={nSaving}
                className="bg-[#1B6CA8] text-white font-semibold text-sm py-2.5 px-6 rounded-xl hover:bg-[#155a8a] transition-colors disabled:opacity-60">
                {nSaving ? 'Saving…' : 'Save preferences'}
              </button>
              {nSuccess && <SaveSuccess />}
            </div>
          </div>
        </div>
      )}

      {/* ── Business Hours ───────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e5e7eb]">
          <h3 className="font-heading font-semibold text-[15px] text-gray-900">Business Hours</h3>
        </div>
        <div className="p-6 space-y-3">
          {DAYS_OF_WEEK.map(({ id, label }) => {
            const day = shopForm.businessHours?.[id] ?? { open: false, from: '08:00', to: '18:00' }
            return (
              <div key={id} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                <div className="w-32 flex items-center gap-2.5 shrink-0">
                  <button type="button" onClick={() => hoursField(id, 'open', !day.open)}
                    className={`relative w-8 h-[18px] rounded-full transition-colors duration-200 shrink-0 ${day.open ? 'bg-emerald-500' : 'bg-gray-200'}`}>
                    <div className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${day.open ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                  </button>
                  <span className={`text-sm font-medium ${day.open ? 'text-gray-800' : 'text-gray-400'}`}>{label}</span>
                </div>
                {day.open ? (
                  <div className="flex items-center gap-2">
                    <input type="time" value={day.from ?? '08:00'}
                      onChange={e => hoursField(id, 'from', e.target.value)}
                      className="border border-[#e5e7eb] rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:border-[#1B6CA8] bg-white" />
                    <span className="text-xs text-gray-400">to</span>
                    <input type="time" value={day.to ?? '18:00'}
                      onChange={e => hoursField(id, 'to', e.target.value)}
                      className="border border-[#e5e7eb] rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:border-[#1B6CA8] bg-white" />
                  </div>
                ) : (
                  <span className="text-xs text-gray-400 italic">Closed</span>
                )}
              </div>
            )
          })}
          <div className="flex items-center gap-4 pt-3 border-t border-[#e5e7eb]">
            <button onClick={onSaveShop} disabled={isSaving}
              className="bg-[#1B6CA8] text-white font-semibold text-sm py-2.5 px-6 rounded-xl hover:bg-[#155a8a] transition-colors disabled:opacity-60">
              {isSaving ? 'Saving…' : 'Save hours'}
            </button>
            {saveSuccess && <SaveSuccess />}
          </div>
        </div>
      </div>

      {/* ── Service Area ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e5e7eb]">
          <h3 className="font-heading font-semibold text-[15px] text-gray-900">Service Area</h3>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-xs text-gray-500">Maximum distance from your shop for pickup and delivery orders.</p>
          <div className="flex items-center gap-5">
            <input type="range" min="1" max="30" step="1"
              value={shopForm.serviceRadius ?? 10}
              onChange={e => shopField('serviceRadius', +e.target.value)}
              className="flex-1 accent-[#1B6CA8]" />
            <div className="shrink-0 text-center min-w-[56px]">
              <span className="font-heading font-bold text-xl text-[#1B6CA8]">{shopForm.serviceRadius ?? 10}</span>
              <span className="text-xs text-gray-500 ml-1">km</span>
            </div>
          </div>
          <div className="flex gap-2">
            {[5, 10, 15, 20, 25].map(km => (
              <button key={km} type="button" onClick={() => shopField('serviceRadius', km)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                  (shopForm.serviceRadius ?? 10) === km
                    ? 'bg-[#1B6CA8] text-white border-[#1B6CA8]'
                    : 'border-[#e5e7eb] text-gray-600 hover:border-gray-400'
                }`}>
                {km} km
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4 pt-1">
            <button onClick={onSaveShop} disabled={isSaving}
              className="bg-[#1B6CA8] text-white font-semibold text-sm py-2.5 px-6 rounded-xl hover:bg-[#155a8a] transition-colors disabled:opacity-60">
              {isSaving ? 'Saving…' : 'Save area'}
            </button>
            {saveSuccess && <SaveSuccess />}
          </div>
        </div>
      </div>

      {/* ── Danger Zone ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-red-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-red-100 bg-red-50/50">
          <h3 className="font-heading font-semibold text-[15px] text-red-700">Danger Zone</h3>
        </div>
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-800">Deactivate your shop</p>
              <p className="text-xs text-gray-500 mt-1 max-w-sm">
                This will hide your shop from customers and sign you out.
                You can reactivate by contacting support.
              </p>
            </div>
            {!showDeactivate && (
              <button onClick={() => setShowDeactivate(true)}
                className="shrink-0 border border-red-300 text-red-500 text-sm font-semibold py-2 px-4 rounded-xl hover:bg-red-50 transition-colors whitespace-nowrap">
                Deactivate shop
              </button>
            )}
          </div>
          {showDeactivate && (
            <div className="mt-5 p-4 bg-red-50 rounded-xl border border-red-200 space-y-3">
              <p className="text-sm text-red-700 font-medium">
                To confirm, type <span className="font-bold tracking-wider">DEACTIVATE</span> below:
              </p>
              <input type="text" value={deactivateInput}
                onChange={e => setDeactivateInput(e.target.value)}
                placeholder="DEACTIVATE"
                className="w-full border border-red-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-red-500 bg-white" />
              <div className="flex items-center gap-3">
                <button onClick={handleDeactivate}
                  disabled={deactivateInput !== 'DEACTIVATE' || deactivating}
                  className="bg-red-500 text-white font-semibold text-sm py-2.5 px-6 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50">
                  {deactivating ? 'Deactivating…' : 'Confirm deactivation'}
                </button>
                <button onClick={() => { setShowDeactivate(false); setDeactivateInput('') }}
                  className="text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}

// ─── EarningsTab ─────────────────────────────────────────────────────────────

function EarningsTab({ orders, activeServices }) {
  const [detailFilter, setDetailFilter] = useState('all')

  const completed      = orders.filter(o => o.status === 'COMPLETED')
  const totalEarned    = completed.reduce((sum, o) => sum + (o.finalPrice ?? 0), 0)
  const monthCompleted = completed.filter(o => isThisMonth(o.updatedAt ?? o.createdAt))
  const weekCompleted  = completed.filter(o => isThisWeek(o.updatedAt ?? o.createdAt))
  const monthEarned    = monthCompleted.reduce((sum, o) => sum + (o.finalPrice ?? 0), 0)
  const weekEarned     = weekCompleted.reduce((sum, o) => sum + (o.finalPrice ?? 0), 0)
  const avgPerOrder    = completed.length ? totalEarned / completed.length : 0

  const detailOrders =
    detailFilter === 'month' ? monthCompleted :
    detailFilter === 'week'  ? weekCompleted  :
    detailFilter === 'today' ? completed.filter(o => isToday(o.updatedAt ?? o.createdAt)) :
    completed

  const serviceList = (activeServices && activeServices.length > 0) ? activeServices : SERVICE_TYPES
  const byService = serviceList.map(s => {
    const sOrders = detailOrders.filter(o => o.serviceType === s)
    return { service: s, count: sOrders.length, total: sOrders.reduce((sum, o) => sum + (o.finalPrice ?? 0), 0) }
  })
  const maxServiceTotal = Math.max(...byService.map(b => b.total), 1)

  const recentCompleted = [...detailOrders]
    .sort((a, b) => {
      const dA = (a.updatedAt ?? a.createdAt)?.toDate?.() ?? new Date(0)
      const dB = (b.updatedAt ?? b.createdAt)?.toDate?.() ?? new Date(0)
      return dB - dA
    })
    .slice(0, 6)

  const EARNING_STATS = [
    { label: 'All-time earnings', value: `₱${totalEarned.toFixed(2)}`, sub: `${completed.length} completed`,         color: 'text-[#F5A623]'   },
    { label: 'This month',        value: `₱${monthEarned.toFixed(2)}`, sub: `${monthCompleted.length} orders`,       color: 'text-emerald-600' },
    { label: 'This week',         value: `₱${weekEarned.toFixed(2)}`,  sub: `${weekCompleted.length} orders`,        color: 'text-[#1B6CA8]'   },
    { label: 'Avg. per order',    value: `₱${avgPerOrder.toFixed(2)}`, sub: `across ${completed.length} orders`,     color: 'text-violet-600'  },
  ]

  const DETAIL_FILTERS = [
    { id: 'all',   label: 'All Time'   },
    { id: 'month', label: 'This Month' },
    { id: 'week',  label: 'This Week'  },
    { id: 'today', label: 'Today'      },
  ]

  function handleExportCSV() {
    const rows = [
      ['Order ID', 'Customer', 'Service Type', 'Est. Weight (kg)', 'Final Price (PHP)', 'Date'],
      ...detailOrders.map(o => [
        `LBG-${o.id.substring(0, 8).toUpperCase()}`,
        o.customerName ?? '',
        o.serviceType ?? '',
        o.estimatedWeight ?? '',
        (o.finalPrice ?? o.estimatedPrice ?? 0).toFixed(2),
        (o.updatedAt ?? o.createdAt)?.toDate?.()?.toLocaleDateString('en-PH') ?? '',
      ])
    ]
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `labadago-earnings-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <h2 className="font-heading font-bold text-[17px] text-gray-900">Earnings</h2>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {EARNING_STATS.map(stat => (
          <div key={stat.label} className="bg-white rounded-2xl border border-[#e5e7eb] px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400 mb-2">{stat.label}</p>
            <p className={`font-heading font-bold text-2xl leading-tight ${stat.color}`}>{stat.value}</p>
            <p className="text-[11px] text-gray-400 mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Full-width chart */}
      <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e5e7eb] flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#E8F4FD] flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-[#1B6CA8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <h3 className="font-heading font-bold text-[15px] text-gray-900">Monthly Earnings</h3>
        </div>
        <div className="p-6">
          <EarningsChart orders={orders} chartHeight={220} />
        </div>
      </div>

      {/* Filter + export toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1">
          {DETAIL_FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setDetailFilter(f.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                detailFilter === f.id
                  ? 'bg-[#0A2540] text-white'
                  : 'bg-white border border-[#e5e7eb] text-gray-500 hover:text-gray-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button
          onClick={handleExportCSV}
          disabled={detailOrders.length === 0}
          title={detailOrders.length === 0 ? 'No completed orders to export' : `Export ${detailOrders.length} order${detailOrders.length !== 1 ? 's' : ''} as CSV`}
          className="flex items-center gap-2 text-xs font-semibold text-[#1B6CA8] border border-[#1B6CA8]/30 bg-[#E8F4FD] px-4 py-2 rounded-xl hover:bg-[#DBEAFE] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
          </svg>
          {detailOrders.length === 0 ? 'No data to export' : 'Export CSV'}
        </button>
      </div>

      {/* Bottom 2-col */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* By service */}
        <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#e5e7eb]">
            <h3 className="font-heading font-bold text-[15px] text-gray-900">Earnings by Service</h3>
          </div>
          <div className="p-6 space-y-4">
            {byService.map(({ service, count, total }) => (
              <div key={service}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-gray-700">{service}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-gray-400">{count} order{count !== 1 ? 's' : ''}</span>
                    <span className="text-xs font-bold text-gray-800">₱{total.toFixed(2)}</span>
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-[#1B6CA8] transition-all duration-500"
                    style={{ width: `${total > 0 ? (total / maxServiceTotal) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
            {detailOrders.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No completed orders yet</p>
            )}
          </div>
        </div>

        {/* Recent completions */}
        <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#e5e7eb]">
            <h3 className="font-heading font-bold text-[15px] text-gray-900">Recent Completions</h3>
          </div>
          <div className="divide-y divide-[#e5e7eb]">
            {recentCompleted.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8 px-6">No completed orders yet</p>
            ) : recentCompleted.map(order => {
              const ref = `LBG-${order.id.substring(0, 8).toUpperCase()}`
              const ts  = (order.updatedAt ?? order.createdAt)?.toDate?.()
              return (
                <div key={order.id} className="flex items-center justify-between px-6 py-3.5">
                  <div>
                    <p className="text-[13px] font-semibold text-gray-800">{ref}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">{order.customerName} · {order.serviceType}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#1B6CA8]">₱{(order.finalPrice ?? order.estimatedPrice ?? 0).toFixed(2)}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {ts ? ts.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }) : '—'}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MerchantDashboard() {
  const { user, userProfile } = useAuth()
  const navigate = useNavigate()
  const shopId = user?.uid

  const [orders,        setOrders]        = useState([])
  const [ordersLoaded,  setOrdersLoaded]  = useState(false)
  const [isOpen,        setIsOpen]        = useState(true)
  const [shopName,      setShopName]      = useState('')
  const [shopMeta,      setShopMeta]      = useState({})
  const [activeNav,     setActiveNav]     = useState('dashboard')
  const [activeTab,     setActiveTab]     = useState('All')
  const [ordersTab,     setOrdersTab]     = useState('All')
  const [ordersDate,    setOrdersDate]    = useState('all')
  const [menuOpen,      setMenuOpen]      = useState(false)
  const [notifOpen,     setNotifOpen]     = useState(false)
  const [sidebarOpen,   setSidebarOpen]   = useState(false)
  const [shopForm,      setShopForm]      = useState(null)
  const [application,   setApplication]   = useState(null)
  const [isSaving,      setIsSaving]      = useState(false)
  const [saveSuccess,   setSaveSuccess]   = useState(false)
  const [photoUploading,setPhotoUploading]= useState(false)
  const [photoError,    setPhotoError]    = useState('')
  const menuRef         = useRef(null)
  const notifRef        = useRef(null)
  const shopFormLoaded  = useRef(false)

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleLogout() {
    await signOut(auth)
    navigate('/')
  }

  // ── Listen to orders for this shop ────────────────────────────────────────
  useEffect(() => {
    if (!shopId) return

    const q = query(
      collection(db, 'orders'),
      where('shopId', '==', String(shopId))
    )
    const unsubscribe = onSnapshot(q, snap => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setOrdersLoaded(true)
    })

    return unsubscribe
  }, [shopId])

  // ── Listen to shop open/close status ──────────────────────────────────────
  useEffect(() => {
    if (!shopId) return

    const unsubscribe = onSnapshot(
      doc(db, 'shops', String(shopId)),
      snap => {
        if (snap.exists()) {
          const data = snap.data()
          setIsOpen(data.isOpen ?? true)
          setShopName(data.name ?? '')
          setShopMeta({ rating: data.rating, reviewCount: data.reviewCount })
          if (!shopFormLoaded.current) {
            shopFormLoaded.current = true
            setShopForm({
              name:             data.name             ?? '',
              description:      data.description      ?? '',
              about:            data.about            ?? '',
              phone:            data.phone            ?? '',
              email:            data.email            ?? '',
              address:          data.address          ?? '',
              gcash:            data.gcash            ?? '',
              pricePerKg:       data.pricePerKg       ?? 50,
              pickupFee:        data.pickupFee        ?? 49,
              deliveryFee:      data.deliveryFee      ?? 49,
              services:         data.services         ?? [],
              detergents:       data.detergents       ?? ['Any'],
              isSameDay:        data.isSameDay        ?? false,
              conditioner:      data.conditioner      ?? false,
              conditionerPrice: data.conditionerPrice ?? 0,
              businessHours:    data.businessHours    ?? DEFAULT_BUSINESS_HOURS,
              hours:            data.hours            ?? DEFAULT_SHOP_HOURS,
              servicePricing:   data.servicePricing   ?? [],
              amenities:        data.amenities        ?? [],
              serviceRadius:    data.serviceRadius    ?? 10,
              pricesByService:  data.pricesByService  ?? {},
              image:            data.image            ?? null,
            })
          }
        }
      }
    )

    return unsubscribe
  }, [shopId])

  useEffect(() => {
    if (!shopId) return
    getDoc(doc(db, 'applications', String(shopId))).then(snap => {
      if (snap.exists()) setApplication(snap.data())
    })
  }, [shopId])

  async function handleToggleOpen() {
    const newStatus = !isOpen
    setIsOpen(newStatus)
    try {
      await updateDoc(doc(db, 'shops', String(shopId)), {
        isOpen: newStatus, updatedAt: serverTimestamp(),
      })
    } catch {
      setIsOpen(!newStatus)
    }
  }

  async function handleSaveShop() {
    setIsSaving(true)
    try {
      await updateDoc(doc(db, 'shops', String(shopId)), { ...shopForm, updatedAt: serverTimestamp() })
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 4000)
    } finally {
      setIsSaving(false)
    }
  }

  async function handlePhotoUpload(file) {
    setPhotoUploading(true)
    setPhotoError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET)
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: 'POST', body: fd }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message ?? 'Upload failed')
      const url = data.secure_url
      setShopForm(f => ({ ...f, image: url }))
      await updateDoc(doc(db, 'shops', String(shopId)), { image: url, updatedAt: serverTimestamp() })
    } catch (err) {
      setPhotoError(err.message || 'Photo upload failed. Please try again.')
    } finally {
      setPhotoUploading(false)
    }
  }

  // ── Derived stats ─────────────────────────────────────────────────────────
  const todayOrders    = orders.filter(o => isToday(o.createdAt))
  const pendingOrders  = orders.filter(o => o.status === 'PENDING')
  const inProgress     = orders.filter(o => IN_PROGRESS_STATUSES.has(o.status))
  const completedToday = orders.filter(o => o.status === 'COMPLETED' && isToday(o.createdAt))

  const STATS = [
    { label: "Today's orders",   value: todayOrders.length,    tab: 'All',         date: 'today' },
    { label: 'Pending approval', value: pendingOrders.length,  tab: 'Pending',     date: 'all'   },
    { label: 'In progress',      value: inProgress.length,     tab: 'In Progress', date: 'all'   },
    { label: 'Completed today',  value: completedToday.length, tab: 'Completed',   date: 'today' },
  ]

  const completedOrders = orders.filter(o => o.status === 'COMPLETED')
  const allTimeEarned = completedOrders.reduce((sum, o) => sum + (o.finalPrice ?? 0), 0)
  const monthEarned   = completedOrders
    .filter(o => isThisMonth(o.updatedAt ?? o.createdAt))
    .reduce((sum, o) => sum + (o.finalPrice ?? 0), 0)
  const weekEarned    = completedOrders
    .filter(o => isThisWeek(o.updatedAt ?? o.createdAt))
    .reduce((sum, o) => sum + (o.finalPrice ?? 0), 0)
  const todayEarned   = completedOrders
    .filter(o => isToday(o.updatedAt ?? o.createdAt))
    .reduce((sum, o) => sum + (o.finalPrice ?? 0), 0)

  // ── Tab filtering ─────────────────────────────────────────────────────────
  const filteredOrders = orders.filter(o => {
    if (activeTab === 'All')         return true
    if (activeTab === 'Pending')     return o.status === 'PENDING'
    if (activeTab === 'In Progress') return IN_PROGRESS_STATUSES.has(o.status)
    if (activeTab === 'Completed')   return o.status === 'COMPLETED'
    if (activeTab === 'Cancelled')   return o.status === 'CANCELLED'
    return true
  })

  // ── Weight confirmations needed ───────────────────────────────────────────
  const weightPending = orders.filter(
    o => o.actualWeight == null &&
         (o.status === 'ARRIVED_AT_SHOP' || o.status === 'PROCESSING')
  )

  // ── Guard: no shopId ──────────────────────────────────────────────────────
  if (!shopId) {
    return (
      <div className="min-h-screen bg-[#F4F7FA] flex items-center justify-center">
        <div className="bg-white rounded-xl border border-[#e5e7eb] p-10 text-center max-w-sm">
          <p className="font-heading font-bold text-gray-900 text-lg mb-2">Shop not set up yet</p>
          <p className="text-sm text-gray-600">Your shop is not set up yet. Contact support.</p>
        </div>
      </div>
    )
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (!ordersLoaded) {
    return (
      <div className="min-h-screen bg-[#F4F7FA] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-gray-200 border-t-[#1B6CA8] animate-spin" />
        <p className="text-sm text-gray-600">Loading orders...</p>
      </div>
    )
  }

  const initials = userProfile?.fullName?.split(' ').map(n => n[0]).slice(0, 2).join('') ?? 'M'
  const hour     = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  const STAT_STYLES = [
    { num: 'text-white', accent: 'bg-[#1B6CA8]'    },  // blue   — neutral volume count
    { num: 'text-white', accent: 'bg-amber-400'     },  // amber  — action needed
    { num: 'text-white', accent: 'bg-violet-400'    },  // purple — active work
    { num: 'text-white', accent: 'bg-emerald-400'   },  // green  — completed
  ]

  return (
    <div className="flex h-screen bg-[#EDF1F7] overflow-hidden">

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-10 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className={`fixed top-0 left-0 h-screen w-[240px] bg-[#0A2540] flex flex-col z-20 transform transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>

        {/* Logo */}
        <div className="px-5 pt-6 pb-5">
          <button onClick={() => navigate('/')} className="cursor-pointer hover:opacity-85 transition-opacity focus:outline-none">
            <Logo />
          </button>
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/30 mt-2 pl-1">Merchant Portal</p>
        </div>

        {/* Shop card */}
        <div className="mx-4 mb-5 bg-white/8 border border-white/10 rounded-2xl p-4">
          <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/35 mb-1.5">Shop</p>
          <p className="text-[13px] font-bold text-white truncate mb-3">{shopName || 'Your Shop'}</p>
          <button
            onClick={handleToggleOpen}
            className="flex items-center gap-2.5 w-full group"
          >
            <div className={`relative w-9 h-5 rounded-full transition-colors duration-200 shrink-0 ${isOpen ? 'bg-emerald-500/70' : 'bg-white/15'}`}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${isOpen ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </div>
            <span className={`text-[11px] font-medium transition-colors ${isOpen ? 'text-emerald-400' : 'text-white/35'}`}>
              {isOpen ? 'Open for orders' : 'Closed'}
            </span>
          </button>
        </div>

        {/* Nav */}
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

        {/* Application status — pinned to sidebar bottom */}
        {application && (
          <div className="px-4 py-3 border-t border-white/10 shrink-0">
            <button
              onClick={() => navigate('/merchant/application')}
              className="flex items-center gap-2 w-full text-left hover:opacity-80 transition-opacity"
            >
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                application.status === 'approved' ? 'bg-emerald-400' :
                application.status === 'rejected' ? 'bg-red-400' : 'bg-amber-400'
              }`} />
              <span className="text-[11px] text-white/50 leading-tight">
                Application:{' '}
                <span className={`font-semibold ${
                  application.status === 'approved' ? 'text-emerald-400' :
                  application.status === 'rejected' ? 'text-red-400' : 'text-amber-400'
                }`}>
                  {application.status === 'approved' ? 'Approved' :
                   application.status === 'rejected' ? 'Rejected' : 'Under Review'}
                </span>
              </span>
            </button>
          </div>
        )}

      </aside>

      {/* ── Main ────────────────────────────────────────────────────────── */}
      <div className="ml-0 md:ml-[240px] flex-1 flex flex-col overflow-y-auto">

        {/* Top banner — greeting + stats */}
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
                <span className="text-[#F5A623]">{userProfile?.fullName?.split(' ')[0] ?? 'Merchant'}</span>
              </h1>
            </div>
            <div className="flex items-center gap-3">
              {/* Bell */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setNotifOpen(o => !o)}
                  className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/15 transition-colors"
                >
                  <svg className="w-5 h-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                  </svg>
                </button>
                {pendingOrders.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#F5A623] rounded-full text-[9px] font-bold text-[#0A2540] flex items-center justify-center">
                    {pendingOrders.length}
                  </span>
                )}

                {notifOpen && (
                  <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-[#e5e7eb] overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-[#e5e7eb] flex items-center justify-between">
                      <p className="text-sm font-bold text-gray-900">Notifications</p>
                      {pendingOrders.length > 0 && (
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                          {pendingOrders.length} pending
                        </span>
                      )}
                    </div>
                    {pendingOrders.length === 0 ? (
                      <div className="px-4 py-6 text-center">
                        <p className="text-sm text-gray-400">No new notifications</p>
                      </div>
                    ) : (
                      <>
                        <div className="max-h-64 overflow-y-auto divide-y divide-[#f3f4f6]">
                          {pendingOrders.map(order => (
                            <div key={order.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="text-[12px] font-bold text-gray-900">New order from {order.customerName}</p>
                                  <p className="text-[11px] text-gray-500 mt-0.5">
                                    LBG-{order.id.substring(0, 8).toUpperCase()} · {order.serviceType ?? '—'} · {order.estimatedWeight} kg
                                  </p>
                                </div>
                                <span className="text-[10px] text-amber-600 font-semibold whitespace-nowrap bg-amber-50 px-1.5 py-0.5 rounded-full shrink-0">
                                  Pending
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="px-4 py-2.5 border-t border-[#e5e7eb]">
                          <button
                            onClick={() => { setNotifOpen(false); setActiveNav('orders') }}
                            className="w-full text-xs font-semibold text-[#1B6CA8] hover:underline text-center py-0.5"
                          >
                            View all orders →
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Name + avatar with dropdown */}
              <div className="relative flex items-center gap-2.5" ref={menuRef}>
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-white leading-tight">{userProfile?.fullName ?? 'Merchant'}</p>
                  <p className="text-[10px] text-white/40">Shop owner</p>
                </div>
                <button
                  onClick={() => setMenuOpen(o => !o)}
                  className="w-9 h-9 rounded-full overflow-hidden bg-[#F5A623] flex items-center justify-center shrink-0 hover:ring-2 hover:ring-white/30 transition-all focus:outline-none"
                >
                  {user?.photoURL
                    ? <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                    : <span className="text-[#0A2540] text-xs font-bold">{initials}</span>
                  }
                </button>

                {menuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-44 bg-white rounded-2xl shadow-xl border border-[#e5e7eb] overflow-hidden z-50">
                    <button
                      onClick={() => { setMenuOpen(false); navigate('/') }}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                    >
                      <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/>
                      </svg>
                      Home
                    </button>
                    <button
                      onClick={() => { setMenuOpen(false); navigate('/profile') }}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                    >
                      <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                      </svg>
                      My Profile
                    </button>
                    <div className="border-t border-[#e5e7eb]" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors text-left"
                    >
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

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {STATS.map((stat, i) => (
              <button
                key={stat.label}
                type="button"
                onClick={() => { setOrdersTab(stat.tab); setOrdersDate(stat.date); setActiveNav('orders') }}
                className="bg-white/10 border border-white/15 rounded-2xl px-5 py-4 transition-all duration-200 hover:bg-white/[0.16] hover:border-white/30 hover:scale-[1.03] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 text-left cursor-pointer"
              >
                <div className={`w-2 h-2 rounded-full ${STAT_STYLES[i].accent} mb-3`} />
                <p className="font-heading font-bold text-[2.2rem] text-white leading-none">
                  {stat.value}
                </p>
                <p className="text-[11px] text-white/65 mt-2">{stat.label}</p>
              </button>
            ))}
          </div>
        </div>

        <main className="flex-1 p-4 md:p-8 space-y-6">

          {/* ── Dashboard tab ─────────────────────────────────────────── */}
          {activeNav === 'dashboard' && <>

            {/* Orders */}
            <div>
              <h2 className="font-heading font-bold text-[17px] text-gray-900 mb-4">Orders</h2>
              <div className="flex gap-1 bg-white border border-[#e5e7eb] rounded-xl p-1 shadow-sm mb-4 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                {TABS.map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`shrink-0 sm:flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                      activeTab === tab
                        ? 'bg-[#0A2540] text-white shadow-sm'
                        : 'text-gray-400 hover:text-gray-700'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                {filteredOrders.map(order => <OrderCard key={order.id} order={order} />)}
                {filteredOrders.length === 0 && (
                  <div className="bg-white rounded-2xl border border-[#e5e7eb] px-5 py-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-500">No orders here</p>
                      <p className="text-xs text-gray-400">Orders in this category will appear here</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom 2-col */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Weight confirms */}
              <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden">
                <div className="px-6 py-4 border-b border-[#e5e7eb] flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-heading font-bold text-[15px] text-gray-900">Weight Confirmations</h2>
                    <p className="text-[11px] text-gray-400 mt-0.5">Confirm actual kg vs. customer estimate before charging</p>
                  </div>
                  {weightPending.length > 0 && (
                    <span className="ml-auto shrink-0 bg-amber-100 text-amber-700 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                      {weightPending.length} pending
                    </span>
                  )}
                </div>
                <div className="p-6">
                  {weightPending.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-6">All clear — no confirmations needed.</p>
                  ) : (
                    <div className="space-y-8">
                      {weightPending.map(order => <WeightConfirmCard key={order.id} order={order} />)}
                    </div>
                  )}
                </div>
              </div>

              {/* Earnings summary */}
              <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden">
                <div className="px-6 py-4 border-b border-[#e5e7eb] flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#E8F4FD] flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-[#1B6CA8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                  <h2 className="font-heading font-bold text-[15px] text-gray-900">Earnings</h2>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#F4F7FA] rounded-xl px-4 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400 mb-1">All-Time</p>
                      <p className="font-heading font-bold text-lg text-gray-900 leading-none">₱{allTimeEarned.toFixed(2)}</p>
                    </div>
                    <div className="bg-amber-50 rounded-xl px-4 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-amber-600 mb-1">This Month</p>
                      <p className="font-heading font-bold text-lg text-[#F5A623] leading-none">₱{monthEarned.toFixed(2)}</p>
                    </div>
                    <div className="bg-emerald-50 rounded-xl px-4 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-emerald-600 mb-1">This Week</p>
                      <p className="font-heading font-bold text-lg text-emerald-600 leading-none">₱{weekEarned.toFixed(2)}</p>
                    </div>
                    <div className="bg-[#E8F4FD] rounded-xl px-4 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#1B6CA8] mb-1">Today</p>
                      <p className="font-heading font-bold text-lg text-[#1B6CA8] leading-none">₱{todayEarned.toFixed(2)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveNav('earnings')}
                    className="w-full flex items-center justify-center gap-1.5 border border-[#e5e7eb] rounded-xl py-2.5 text-sm font-semibold text-[#1B6CA8] hover:bg-[#E8F4FD] transition-colors"
                  >
                    View full report
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/>
                    </svg>
                  </button>
                </div>
              </div>

            </div>

          </>}

          {/* ── Orders tab ────────────────────────────────────────────── */}
          {activeNav === 'orders' && (
            <OrdersTab
              orders={orders}
              tab={ordersTab}       setTab={setOrdersTab}
              dateFilter={ordersDate} setDateFilter={setOrdersDate}
            />
          )}

          {/* ── My Shop Profile tab ───────────────────────────────────── */}
          {activeNav === 'shop' && (
            <ShopProfileTab
              shopForm={shopForm}
              setShopForm={setShopForm}
              isSaving={isSaving}
              saveSuccess={saveSuccess}
              photoUploading={photoUploading}
              photoError={photoError}
              onSave={handleSaveShop}
              onPhotoUpload={handlePhotoUpload}
              isOpen={isOpen}
              shopRating={shopMeta.rating}
              reviewCount={shopMeta.reviewCount}
              onGoToServices={() => setActiveNav('services')}
            />
          )}

          {/* ── Services & Pricing tab ────────────────────────────────── */}
          {activeNav === 'services' && (
            <ServicesTab
              shopForm={shopForm}
              setShopForm={setShopForm}
              isSaving={isSaving}
              saveSuccess={saveSuccess}
              onSave={handleSaveShop}
            />
          )}

          {/* ── Earnings tab ──────────────────────────────────────────── */}
          {activeNav === 'earnings' && (
            <EarningsTab orders={orders} activeServices={shopForm?.services} />
          )}

          {/* ── Settings tab ──────────────────────────────────────────── */}
          {activeNav === 'settings' && (
            <SettingsTab
              user={user}
              userProfile={userProfile}
              shopForm={shopForm}
              setShopForm={setShopForm}
              shopId={shopId}
              isSaving={isSaving}
              saveSuccess={saveSuccess}
              onSaveShop={handleSaveShop}
            />
          )}

        </main>
      </div>
    </div>
  )
}
