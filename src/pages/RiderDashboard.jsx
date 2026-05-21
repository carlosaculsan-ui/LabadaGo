import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, query, where, onSnapshot, updateDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'

// ─── Static data ──────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: 'dashboard',  label: 'Dashboard'     },
  { id: 'deliveries', label: 'My deliveries' },
  { id: 'earnings',   label: 'Earnings'      },
  { id: 'profile',    label: 'Profile'       },
]

const EARNINGS_DATA = [
  { day: 'Mon', amount: 180 },
  { day: 'Tue', amount: 240 },
  { day: 'Wed', amount: 90  },
  { day: 'Thu', amount: 310 },
  { day: 'Fri', amount: 420 },
  { day: 'Sat', amount: 380 },
  { day: 'Sun', amount: 0   },
]

const MAX_EARNING = 420
const ACTIVE_DAY  = 'Fri'

const ACTIVE_STATUSES = new Set(['PICKUP_EN_ROUTE', 'PICKED_UP', 'DELIVERY_EN_ROUTE'])

// Button label + next status for each active task state
const ACTIVE_ACTION = {
  PICKUP_EN_ROUTE:   { label: 'Mark as picked up',  next: 'PICKED_UP'  },
  PICKED_UP:         { label: 'Arrived at shop',     next: 'ARRIVED_AT_SHOP' },
  DELIVERY_EN_ROUTE: { label: 'Mark as delivered',   next: 'COMPLETED'  },
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
}

const STATUS_PILL = {
  ACCEPTED:           'bg-[#DBEAFE] text-[#1B6CA8]',
  PICKUP_EN_ROUTE:    'bg-amber-100 text-amber-700',
  PICKED_UP:          'bg-purple-100 text-purple-700',
  READY_FOR_DELIVERY: 'bg-green-100 text-green-700',
  DELIVERY_EN_ROUTE:  'bg-sky-100 text-sky-700',
}

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
  const d    = ts.toDate()
  const now  = new Date()
  const mon  = new Date(now)
  mon.setDate(now.getDate() - now.getDay() + 1)
  mon.setHours(0, 0, 0, 0)
  return d >= mon
}

function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RiderDashboard() {
  const navigate = useNavigate()
  const { user, userProfile } = useAuth()

  const [orders,       setOrders]       = useState([])
  const [loaded,       setLoaded]       = useState(false)
  const [isAvailable,  setIsAvailable]  = useState(true)
  const [activeNav,    setActiveNav]    = useState('dashboard')

  // Sync availability from userProfile
  useEffect(() => {
    if (userProfile?.isAvailable !== undefined) {
      setIsAvailable(userProfile.isAvailable)
    }
  }, [userProfile])

  // ── Live orders for this rider ────────────────────────────────────────────
  useEffect(() => {
    if (!user?.uid) return

    const q = query(
      collection(db, 'orders'),
      where('riderId', '==', user.uid)
    )
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
      await updateDoc(doc(db, 'users', user.uid), {
        isAvailable: newStatus, updatedAt: serverTimestamp(),
      })
    } catch {
      setIsAvailable(!newStatus)
    }
  }

  async function handleAdvanceStatus(order) {
    const action = ACTIVE_ACTION[order.status]
    if (!action) return
    await updateDoc(doc(db, 'orders', order.id), {
      status: action.next, updatedAt: serverTimestamp(),
    })
  }

  // ── Derived data ──────────────────────────────────────────────────────────
  const activeTask     = orders.find(o => ACTIVE_STATUSES.has(o.status)) ?? null
  const upcomingTasks  = orders.filter(o => o.status === 'ACCEPTED')
  const completedToday = orders.filter(o => o.status === 'COMPLETED' && isToday(o.createdAt))
  const completedWeek  = orders.filter(o => o.status === 'COMPLETED' && isThisWeek(o.createdAt))
  const earningsToday  = completedToday.reduce((sum, o) => sum + (o.finalPrice ?? o.estimatedPrice ?? 0), 0)

  const STATS = [
    { label: "Today's deliveries", value: completedToday.length              },
    { label: 'This week',          value: completedWeek.length               },
    { label: "Today's earnings",   value: `₱${earningsToday.toLocaleString()}` },
    { label: 'Rating',             value: '4.9 ★'                            },
  ]

  // ── Loading ───────────────────────────────────────────────────────────────
  if (!loaded) {
    return (
      <div className="min-h-screen bg-[#F4F7FA] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-gray-200 border-t-[#1B6CA8] animate-spin" />
        <p className="text-sm text-gray-500">Loading deliveries...</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-[#F4F7FA] overflow-hidden">

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="fixed top-0 left-0 h-screen w-[220px] bg-[#0D3F6B] flex flex-col z-20">

        <div className="px-5 pt-6 pb-5 border-b border-white/10">
          <div>
            <span className="font-heading font-extrabold text-xl text-white">Labada</span>
            <span className="font-heading font-extrabold text-xl text-[#F5A623]">Go</span>
          </div>
          <p className="text-[10px] text-white/40 mt-0.5 font-medium tracking-wide">Rider portal</p>
        </div>

        <div className="px-5 py-4 border-b border-white/10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-white/40 mb-2">
            Status
          </p>
          <button
            onClick={handleToggleAvailable}
            className={[
              'w-full py-2 px-4 rounded-full text-sm font-semibold transition-colors',
              isAvailable ? 'bg-green-500 text-white' : 'bg-gray-500 text-white',
            ].join(' ')}
          >
            {isAvailable ? 'Available' : 'Off duty'}
          </button>
        </div>

        <nav className="flex-1 py-3 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={[
                'w-full flex items-center gap-3 py-3 text-sm font-medium text-white transition-colors text-left',
                activeNav === item.id
                  ? 'border-l-4 border-[#F5A623] bg-white/10 pl-[17px] pr-5'
                  : 'border-l-4 border-transparent pl-[17px] pr-5 hover:bg-white/5',
              ].join(' ')}
            >
              <ImgPlaceholder label="" className="w-5 h-5 rounded bg-white/10 border-white/20 shrink-0" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="px-5 py-4 border-t border-white/10 flex items-center gap-3">
          <ImgPlaceholder label="Rider photo" className="w-10 h-10 rounded-full bg-white/10 border-white/25 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {userProfile?.fullName ?? 'Rider'}
            </p>
            <p className="text-[11px] text-white/40">Rider</p>
          </div>
        </div>

      </aside>

      {/* ── Main area ───────────────────────────────────────────────────── */}
      <div className="ml-[220px] flex-1 flex flex-col overflow-y-auto">

        <header className="bg-white border-b border-[#e5e7eb] h-16 flex items-center justify-between px-8 sticky top-0 z-10 shrink-0">
          <h1 className="font-heading font-bold text-[18px] text-gray-900">
            Rider Dashboard
          </h1>
          <div className="flex items-center gap-4">
            <p className="text-sm text-gray-400">
              {new Date().toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
            <div className="relative">
              <div className="w-9 h-9 rounded-lg border border-[#e5e7eb] flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
              </div>
              {upcomingTasks.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </div>
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

          {/* Active task card */}
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
                  <p className="text-sm text-gray-400">
                    {upcomingTasks.length > 0
                      ? 'You have upcoming tasks assigned below.'
                      : 'New tasks will appear here when a merchant assigns you.'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-6 mb-5">

                    <div className="space-y-4">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400 mb-1">
                          Order ID
                        </p>
                        <p className="font-heading font-bold text-[18px] text-gray-900">
                          LBG-{activeTask.id.substring(0, 8).toUpperCase()}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400 mb-2">
                          Customer
                        </p>
                        <div className="flex items-center gap-2.5">
                          <ImgPlaceholder
                            label="Customer photo"
                            className="w-8 h-8 rounded-full bg-[#DBEAFE] border-blue-300 shrink-0"
                          />
                          <span className="text-sm font-medium text-gray-800">{activeTask.customerName}</span>
                        </div>
                      </div>

                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400 mb-2">
                          Pickup address
                        </p>
                        <div className="flex items-start gap-2">
                          <ImgPlaceholder
                            label="pin icon"
                            className="w-5 h-5 rounded bg-[#FEE2E2] border-red-300 shrink-0 mt-0.5"
                          />
                          <p className="text-sm text-gray-700">
                            {activeTask.pickupAddress?.street ?? '—'}
                            {activeTask.pickupAddress?.landmark
                              ? `, ${activeTask.pickupAddress.landmark}`
                              : ''}
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

                    <div className="min-h-48 rounded-xl border-2 border-dashed border-blue-200 bg-[#E8F4FD] flex flex-col items-center justify-center p-4">
                      <ImgPlaceholder
                        label="Rider pin"
                        className="w-10 h-10 rounded-lg bg-[#FEF3C7] border-amber-300 mb-3"
                      />
                      <p className="text-xs text-[#1B6CA8] opacity-60 text-center leading-relaxed max-w-[160px]">
                        Live map — customer location. Integrate Google Maps here.
                      </p>
                    </div>

                  </div>

                  <div>
                    <button
                      onClick={() => handleAdvanceStatus(activeTask)}
                      className="w-full bg-[#1B6CA8] text-white font-heading font-semibold py-3 rounded-lg hover:bg-[#155a8a] transition-colors text-sm"
                    >
                      {ACTIVE_ACTION[activeTask.status]?.label ?? 'Update status'}
                    </button>
                    <p className="text-[11px] text-gray-400 text-center mt-2">
                      This will notify the customer and update order status
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Upcoming tasks table */}
          <div className="bg-white rounded-xl border border-[#e5e7eb] p-6">
            <h2 className="font-heading font-bold text-[17px] text-gray-900 mb-5">
              Upcoming tasks
            </h2>

            {upcomingTasks.length === 0 ? (
              <p className="text-sm text-gray-400 py-4">No upcoming tasks assigned yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#e5e7eb]">
                    {['Order ID', 'Customer', 'Pickup address', 'Shop', 'Status', 'Action'].map(col => (
                      <th
                        key={col}
                        className="text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400 pb-3 pr-4 last:pr-0"
                      >
                        {col}
                      </th>
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
                            {initials(order.customerName)}
                          </div>
                          <span className="text-gray-700 whitespace-nowrap">{order.customerName}</span>
                        </div>
                      </td>
                      <td className="py-3.5 pr-4 text-gray-500">
                        {order.pickupAddress?.street ?? '—'}
                      </td>
                      <td className="py-3.5 pr-4 text-gray-500">
                        {order.shopName ?? '—'}
                      </td>
                      <td className="py-3.5 pr-4">
                        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${STATUS_PILL[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {STATUS_LABEL[order.status] ?? order.status}
                        </span>
                      </td>
                      <td className="py-3.5">
                        <button
                          onClick={() => navigate(`/order-tracking?id=${order.id}`)}
                          className="text-xs font-medium px-3 py-1.5 rounded-lg border border-[#1B6CA8] text-[#1B6CA8] hover:bg-[#F0F7FF] transition-colors"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Earnings snapshot — hardcoded, wired separately later */}
          <div className="bg-white rounded-xl border border-[#e5e7eb] p-6">
            <h2 className="font-heading font-bold text-[17px] text-gray-900 mb-6">
              This week's earnings
            </h2>

            <div className="flex items-end gap-2 h-[120px]">
              {EARNINGS_DATA.map(entry => (
                <div
                  key={entry.day}
                  className={`flex-1 rounded-t-sm transition-all ${entry.day === ACTIVE_DAY ? 'bg-[#1B6CA8]' : 'bg-[#BFDBFE]'}`}
                  style={{ height: entry.amount === 0 ? '3px' : `${(entry.amount / MAX_EARNING) * 120}px` }}
                />
              ))}
            </div>

            <div className="flex gap-2 mt-3">
              {EARNINGS_DATA.map(entry => (
                <div key={entry.day} className="flex-1 text-center">
                  <p className={`text-[10px] font-medium ${entry.day === ACTIVE_DAY ? 'text-[#1B6CA8]' : 'text-gray-500'}`}>
                    {entry.amount > 0 ? `₱${entry.amount}` : '—'}
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
