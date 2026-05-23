import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot, updateDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
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

const EARNINGS_DATA = [
  { day: 'Mon', amount: 1200 },
  { day: 'Tue', amount: 890  },
  { day: 'Wed', amount: 1450 },
  { day: 'Thu', amount: 2100 },
  { day: 'Fri', amount: 1800 },
  { day: 'Sat', amount: 2400 },
  { day: 'Sun', amount: 600  },
]

const MAX_EARNING  = 2400
const ACTIVE_DAY   = 'Wed'
const TOTAL_WEEKLY = EARNINGS_DATA.reduce((sum, d) => sum + d.amount, 0)

const TABS = ['All', 'Pending', 'In Progress', 'Completed', 'Cancelled']

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isToday(ts) {
  if (!ts?.toDate) return false
  const d = ts.toDate()
  const t = new Date()
  return d.getFullYear() === t.getFullYear() &&
         d.getMonth()    === t.getMonth()    &&
         d.getDate()     === t.getDate()
}


// ─── OrderCard ─────────────────────────────────────────────────────────────────

function OrderCard({ order }) {
  const [selectedStatus, setSelectedStatus] = useState(order.status)

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
    <div className="bg-white rounded-xl border border-[#e5e7eb] p-5 flex gap-5">

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
        <button className="text-xs text-[#1B6CA8] hover:underline font-medium">
          View details
        </button>
      </div>

      {/* Right — status + actions */}
      <div className="flex flex-col items-end gap-2 min-w-[176px]">
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MerchantDashboard() {
  const { userProfile } = useAuth()
  const shopId = userProfile?.shopId

  const [orders,       setOrders]       = useState([])
  const [ordersLoaded, setOrdersLoaded] = useState(false)
  const [isOpen,       setIsOpen]       = useState(true)
  const [shopName,     setShopName]     = useState('')
  const [activeNav,    setActiveNav]    = useState('dashboard')
  const [activeTab,    setActiveTab]    = useState('All')

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
        }
      }
    )

    return unsubscribe
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

  // ── Derived stats ─────────────────────────────────────────────────────────
  const todayOrders    = orders.filter(o => isToday(o.createdAt))
  const pendingOrders  = orders.filter(o => o.status === 'PENDING')
  const inProgress     = orders.filter(o => IN_PROGRESS_STATUSES.has(o.status))
  const completedToday = orders.filter(o => o.status === 'COMPLETED' && isToday(o.createdAt))

  const STATS = [
    { label: "Today's orders",   value: todayOrders.length    },
    { label: 'Pending approval', value: pendingOrders.length  },
    { label: 'In progress',      value: inProgress.length     },
    { label: 'Completed today',  value: completedToday.length },
  ]

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
    { num: 'text-[#F5A623]' },
    { num: 'text-amber-300' },
    { num: 'text-violet-400' },
    { num: 'text-emerald-400' },
  ]

  return (
    <div className="flex h-screen bg-[#EDF1F7] overflow-hidden">

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="fixed top-0 left-0 h-screen w-[240px] bg-[#0A2540] flex flex-col z-20">

        {/* Logo */}
        <div className="px-6 pt-7 pb-5">
          <img src="/LabadaGoLogo.png" alt="LabadaGo" className="h-7 w-auto brightness-0 invert" />
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/30 mt-2">Merchant Portal</p>
        </div>

        {/* Shop card */}
        <div className="mx-4 mb-5 bg-white/8 border border-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/35">Your Shop</p>
            <span className="flex items-center gap-1.5 text-[10px] font-bold" style={{ color: isOpen ? '#34d399' : '#f87171' }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: isOpen ? '#34d399' : '#f87171' }} />
              {isOpen ? 'Open' : 'Closed'}
            </span>
          </div>
          <p className="text-[13px] font-bold text-white truncate mb-3">{shopName || 'Your Shop'}</p>
          <button
            onClick={handleToggleOpen}
            className="w-full py-1.5 rounded-lg text-[11px] font-bold transition-all border"
            style={isOpen
              ? { background: 'rgba(248,113,113,0.12)', color: '#f87171', borderColor: 'rgba(248,113,113,0.2)' }
              : { background: 'rgba(52,211,153,0.12)', color: '#34d399', borderColor: 'rgba(52,211,153,0.2)' }
            }
          >
            {isOpen ? 'Close shop' : 'Open shop'}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
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

        {/* Profile */}
        <div className="px-4 py-4 border-t border-white/10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#F5A623] flex items-center justify-center shrink-0">
            <span className="text-[#0A2540] text-xs font-bold">{initials}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{userProfile?.fullName ?? 'Merchant'}</p>
            <p className="text-[10px] text-white/35">Shop owner</p>
          </div>
        </div>

      </aside>

      {/* ── Main ────────────────────────────────────────────────────────── */}
      <div className="ml-[240px] flex-1 flex flex-col overflow-y-auto">

        {/* Top banner — greeting + stats */}
        <div className="bg-[#0A2540] px-8 pt-7 pb-7 shrink-0">
          <div className="flex items-start justify-between mb-7">
            <div>
              <p className="text-white/40 text-xs font-medium mb-1 tracking-wide">
                {new Date().toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
              <h1 className="font-heading font-bold text-[1.6rem] text-white leading-tight">
                {greeting},{' '}
                <span className="text-[#F5A623]">{userProfile?.fullName?.split(' ')[0] ?? 'Merchant'}</span>
              </h1>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <button className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/15 transition-colors">
                  <svg className="w-5 h-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                  </svg>
                </button>
                {pendingOrders.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#F5A623] rounded-full text-[9px] font-bold text-[#0A2540] flex items-center justify-center">
                    {pendingOrders.length}
                  </span>
                )}
              </div>
              <div className="w-9 h-9 rounded-full bg-[#F5A623] flex items-center justify-center shrink-0">
                <span className="text-[#0A2540] text-xs font-bold">{initials}</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3">
            {STATS.map((stat, i) => (
              <div key={stat.label} className="bg-white/8 border border-white/10 rounded-2xl px-5 py-4">
                <p className={`font-heading font-bold text-[2rem] leading-none ${STAT_STYLES[i].num}`}>
                  {stat.value}
                </p>
                <p className="text-[11px] text-white/45 mt-1.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <main className="flex-1 p-8 space-y-6">

          {/* Orders */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading font-bold text-[17px] text-gray-900">Orders</h2>
              <div className="flex gap-1 bg-white border border-[#e5e7eb] rounded-xl p-1 shadow-sm">
                {TABS.map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeTab === tab
                        ? 'bg-[#0A2540] text-white shadow-sm'
                        : 'text-gray-400 hover:text-gray-700'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {filteredOrders.map(order => <OrderCard key={order.id} order={order} />)}
              {filteredOrders.length === 0 && (
                <div className="bg-white rounded-2xl border border-[#e5e7eb] p-12 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-gray-600">No orders here</p>
                  <p className="text-xs text-gray-400 mt-1">Orders in this category will appear here</p>
                </div>
              )}
            </div>
          </div>

          {/* Bottom 2-col */}
          <div className="grid grid-cols-2 gap-6">

            {/* Weight confirms */}
            <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden">
              <div className="px-6 py-4 border-b border-[#e5e7eb] flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"/>
                  </svg>
                </div>
                <h2 className="font-heading font-bold text-[15px] text-gray-900">Weight Confirmations</h2>
                {weightPending.length > 0 && (
                  <span className="ml-auto bg-amber-100 text-amber-700 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
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

            {/* Earnings */}
            <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden">
              <div className="px-6 py-4 border-b border-[#e5e7eb] flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#E8F4FD] flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-[#1B6CA8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <h2 className="font-heading font-bold text-[15px] text-gray-900">This Week</h2>
                <p className="ml-auto font-heading font-bold text-[#1B6CA8] text-[17px]">₱{TOTAL_WEEKLY.toLocaleString()}</p>
              </div>
              <div className="p-6">
                <div className="flex items-end gap-2 h-[96px] mb-2">
                  {EARNINGS_DATA.map(entry => (
                    <div key={entry.day} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className={`w-full rounded-t-md transition-all ${entry.day === ACTIVE_DAY ? 'bg-[#0A2540]' : 'bg-[#DBEAFE]'}`}
                        style={{ height: `${(entry.amount / MAX_EARNING) * 90}px` }}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  {EARNINGS_DATA.map(entry => (
                    <div key={entry.day} className="flex-1 text-center">
                      <p className={`text-[10px] font-semibold ${entry.day === ACTIVE_DAY ? 'text-[#0A2540]' : 'text-gray-300'}`}>
                        {entry.day}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

        </main>
      </div>
    </div>
  )
}
