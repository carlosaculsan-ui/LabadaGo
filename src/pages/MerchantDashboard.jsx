import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot, updateDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'

// ─── Static data ──────────────────────────────────────────────────────────────

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

function ImgPlaceholder({ label, className }) {
  return (
    <div className={['border border-dashed flex items-center justify-center', className].join(' ')}>
      {label && (
        <span className="text-[7px] font-medium text-gray-400 text-center leading-snug px-1.5">
          {label}
        </span>
      )}
    </div>
  )
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
        <p className="text-[11px] text-gray-400 mt-1">
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
          <button className="border border-gray-300 text-gray-500 text-xs font-semibold py-1.5 px-4 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap">
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
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400 mb-0.5">Order ID</p>
          <p className="font-heading font-bold text-[15px] text-gray-900">{displayRef}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400 mb-0.5">Customer</p>
          <p className="text-sm font-medium text-gray-700">{order.customerName}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400 mb-0.5">Customer estimate</p>
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
          <span className="text-sm text-gray-500 ml-1">kg</span>
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
        <p className="text-xs text-gray-400">Customer will be notified with updated price</p>
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
      snap => { if (snap.exists()) setIsOpen(snap.data().isOpen ?? true) }
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
          <p className="text-sm text-gray-400">Your shop is not set up yet. Contact support.</p>
        </div>
      </div>
    )
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (!ordersLoaded) {
    return (
      <div className="min-h-screen bg-[#F4F7FA] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-gray-200 border-t-[#1B6CA8] animate-spin" />
        <p className="text-sm text-gray-500">Loading orders...</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-[#F4F7FA] overflow-hidden">

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="fixed top-0 left-0 h-screen w-[240px] bg-white border-r border-[#e5e7eb] flex flex-col z-20">

        <div className="px-5 pt-6 pb-5 border-b border-[#e5e7eb]">
          <div>
            <span className="font-heading font-extrabold text-xl text-[#1B6CA8]">Labada</span>
            <span className="font-heading font-extrabold text-xl text-[#F5A623]">Go</span>
          </div>
          <p className="text-[10px] text-gray-400 mt-0.5 font-medium tracking-wide">Merchant portal</p>
        </div>

        <div className="px-5 py-4 border-b border-[#e5e7eb]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-400 mb-2">
            Shop status
          </p>
          <button
            onClick={handleToggleOpen}
            className={[
              'w-full py-2 px-4 rounded-full text-sm font-semibold transition-colors',
              isOpen ? 'bg-green-500 text-white' : 'bg-red-500 text-white',
            ].join(' ')}
          >
            {isOpen ? 'Open' : 'Closed'}
          </button>
        </div>

        <nav className="flex-1 py-3 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={[
                'w-full flex items-center gap-3 py-3 text-sm font-medium transition-colors text-left',
                activeNav === item.id
                  ? 'border-l-4 border-[#1B6CA8] bg-[#EBF4FF] text-[#1B6CA8] pl-[17px] pr-5'
                  : 'border-l-4 border-transparent pl-[17px] pr-5 text-gray-600 hover:bg-gray-50',
              ].join(' ')}
            >
              <ImgPlaceholder label="" className="w-5 h-5 rounded bg-gray-100 border-gray-300 shrink-0" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="px-5 py-4 border-t border-[#e5e7eb] flex items-center gap-3">
          <ImgPlaceholder label="Owner photo" className="w-10 h-10 rounded-full bg-[#EBF4FF] border-blue-200 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">
              {userProfile?.fullName ?? 'Merchant'}
            </p>
            <p className="text-[11px] text-gray-400">Shop owner</p>
          </div>
        </div>

      </aside>

      {/* ── Main area ───────────────────────────────────────────────────── */}
      <div className="ml-[240px] flex-1 flex flex-col overflow-y-auto">

        <header className="bg-white border-b border-[#e5e7eb] h-16 flex items-center justify-between px-8 sticky top-0 z-10 shrink-0">
          <div>
            <h1 className="font-heading font-bold text-[18px] text-gray-900 leading-tight">
              Good morning, {userProfile?.fullName?.split(' ')[0] ?? 'Merchant'}
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {new Date().toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-lg border border-[#e5e7eb] flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
              </div>
              {pendingOrders.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </div>
            <ImgPlaceholder label="Owner avatar" className="w-9 h-9 rounded-full bg-[#EBF4FF] border-blue-200 shrink-0" />
          </div>
        </header>

        <main className="flex-1 p-8 space-y-6">

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-4">
            {STATS.map(stat => (
              <div key={stat.label} className="bg-white rounded-xl border border-[#e5e7eb] p-5">
                <p className="font-heading font-bold text-[1.6rem] text-[#1B6CA8] leading-none">
                  {stat.value}
                </p>
                <p className="text-xs text-gray-400 mt-2">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Orders section */}
          <div className="space-y-4">
            <h2 className="font-heading font-bold text-[17px] text-gray-900">Today's orders</h2>

            <div className="flex border-b border-[#e5e7eb]">
              {TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={[
                    'px-4 py-2.5 text-sm font-medium transition-colors',
                    activeTab === tab
                      ? 'text-[#1B6CA8] border-b-2 border-[#1B6CA8] -mb-px'
                      : 'text-gray-400 hover:text-gray-600',
                  ].join(' ')}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {filteredOrders.map(order => (
                <OrderCard key={order.id} order={order} />
              ))}
              {filteredOrders.length === 0 && (
                <div className="bg-white rounded-xl border border-[#e5e7eb] p-10 text-center">
                  <p className="text-gray-400 text-sm">No orders in this category</p>
                </div>
              )}
            </div>
          </div>

          {/* Weight confirmations */}
          <div className="bg-white rounded-xl border border-[#e5e7eb] flex overflow-hidden">
            <div className="w-1 bg-amber-400 shrink-0" />
            <div className="flex-1 p-6">
              <h2 className="font-heading font-bold text-[17px] text-gray-900 mb-5">
                Weight confirmations needed
              </h2>
              {weightPending.length === 0 ? (
                <p className="text-sm text-gray-400">No weight confirmations needed right now.</p>
              ) : (
                <div className="space-y-8">
                  {weightPending.map(order => (
                    <WeightConfirmCard key={order.id} order={order} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Earnings snapshot — hardcoded, wired separately later */}
          <div className="bg-white rounded-xl border border-[#e5e7eb] p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading font-bold text-[17px] text-gray-900">
                This week's earnings
              </h2>
              <p className="font-heading font-bold text-[1.4rem] text-[#1B6CA8]">
                ₱{TOTAL_WEEKLY.toLocaleString()}
              </p>
            </div>

            <div className="flex items-end gap-2 h-[120px]">
              {EARNINGS_DATA.map(entry => (
                <div
                  key={entry.day}
                  className={`flex-1 rounded-t-sm transition-all ${entry.day === ACTIVE_DAY ? 'bg-[#1B6CA8]' : 'bg-[#BFDBFE]'}`}
                  style={{ height: `${(entry.amount / MAX_EARNING) * 120}px` }}
                />
              ))}
            </div>

            <div className="flex gap-2 mt-3">
              {EARNINGS_DATA.map(entry => (
                <div key={entry.day} className="flex-1 text-center">
                  <p className={`text-[10px] font-medium ${entry.day === ACTIVE_DAY ? 'text-[#1B6CA8]' : 'text-gray-500'}`}>
                    ₱{entry.amount.toLocaleString()}
                  </p>
                  <p className={`text-[11px] mt-0.5 ${entry.day === ACTIVE_DAY ? 'text-gray-700 font-semibold' : 'text-gray-400'}`}>
                    {entry.day}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </main>
      </div>
    </div>
  )
}
