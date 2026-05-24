import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'
import { collection, query, where, onSnapshot, updateDoc, doc, serverTimestamp } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import { auth, db } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'

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
  const d   = ts.toDate()
  const now = new Date()
  const mon = new Date(now)
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RiderDashboard() {
  const navigate = useNavigate()
  const { user, userProfile } = useAuth()

  const [orders,          setOrders]          = useState([])
  const [loaded,          setLoaded]          = useState(false)
  const [availableOrders, setAvailableOrders] = useState([])
  const [refreshKey,      setRefreshKey]      = useState(0)
  const [isAvailable,     setIsAvailable]     = useState(true)
  const [activeNav,       setActiveNav]       = useState('dashboard')
  const [menuOpen,        setMenuOpen]        = useState(false)
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

  // ── Live unclaimed orders ─────────────────────────────────────────────────
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

  // ── Derived data ──────────────────────────────────────────────────────────
  const activeTask     = orders.find(o => ACTIVE_STATUSES.has(o.status)) ?? null
  const upcomingTasks  = orders.filter(o => o.status === 'ACCEPTED')
  const completedToday = orders.filter(o => o.status === 'COMPLETED' && isToday(o.createdAt))
  const completedWeek  = orders.filter(o => o.status === 'COMPLETED' && isThisWeek(o.createdAt))
  const earningsToday  = completedToday.reduce((sum, o) => sum + (o.finalPrice ?? o.estimatedPrice ?? 0), 0)

  const STATS = [
    { label: "Today's deliveries", value: completedToday.length                },
    { label: 'This week',          value: completedWeek.length                 },
    { label: "Today's earnings",   value: `₱${earningsToday.toLocaleString()}` },
    { label: 'Rating',             value: '4.9 ★'                              },
  ]

  const STAT_STYLES = [
    { accent: 'bg-[#F5A623]'   },
    { accent: 'bg-amber-400'   },
    { accent: 'bg-violet-400'  },
    { accent: 'bg-emerald-400' },
  ]

  // ── Loading ───────────────────────────────────────────────────────────────
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
    <div className="flex h-screen bg-[#EDF1F7] overflow-hidden">

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="fixed top-0 left-0 h-screen w-[240px] bg-[#0A2540] flex flex-col z-20">

        {/* Logo */}
        <div className="px-5 pt-6 pb-5">
          <button onClick={() => navigate('/')} className="cursor-pointer hover:opacity-85 transition-opacity focus:outline-none">
            <Logo />
          </button>
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/30 mt-2 pl-1">Rider Portal</p>
        </div>

        {/* Rider card */}
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

      </aside>

      {/* ── Main area ───────────────────────────────────────────────────── */}
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
                <span className="text-[#F5A623]">{userProfile?.fullName?.split(' ')[0] ?? 'Rider'}</span>
              </h1>
            </div>

            <div className="flex items-center gap-3">
              {/* Bell */}
              <div className="relative">
                <button className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/15 transition-colors">
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

              {/* Name + avatar with dropdown */}
              <div className="relative flex items-center gap-2.5" ref={menuRef}>
                <div className="text-right">
                  <p className="text-sm font-semibold text-white leading-tight">{userProfile?.fullName ?? 'Rider'}</p>
                  <p className="text-[10px] text-white/40">Rider</p>
                </div>
                <button
                  onClick={() => setMenuOpen(o => !o)}
                  className="w-9 h-9 rounded-full overflow-hidden bg-[#F5A623] flex items-center justify-center shrink-0 hover:ring-2 hover:ring-white/30 transition-all focus:outline-none"
                >
                  {user?.photoURL
                    ? <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                    : <span className="text-[#0A2540] text-xs font-bold">{riderInitials}</span>
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
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3">
            {STATS.map((stat, i) => (
              <div
                key={stat.label}
                className="bg-white/10 border border-white/15 rounded-2xl px-5 py-4 transition-all duration-200 hover:bg-white/[0.16] hover:border-white/30 hover:scale-[1.03] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20"
              >
                <div className={`w-2 h-2 rounded-full ${STAT_STYLES[i].accent} mb-3`} />
                <p className="font-heading font-bold text-[2.2rem] text-white leading-none">
                  {stat.value}
                </p>
                <p className="text-[11px] text-white/65 mt-2">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <main className="flex-1 p-8 space-y-6">

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
                  <p className="text-sm text-gray-600">
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
                        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-600 mb-1">
                          Order ID
                        </p>
                        <p className="font-heading font-bold text-[18px] text-gray-900">
                          LBG-{activeTask.id.substring(0, 8).toUpperCase()}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-600 mb-2">
                          Customer
                        </p>
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${avatarColor(activeTask.customerId ?? activeTask.id)}`}>
                            {initials(activeTask.customerName)}
                          </div>
                          <span className="text-sm font-medium text-gray-800">{activeTask.customerName}</span>
                        </div>
                      </div>

                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-600 mb-2">
                          Pickup address
                        </p>
                        <div className="flex items-start gap-2">
                          <svg className="w-4 h-4 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                          </svg>
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

                    <div className="min-h-48 rounded-xl border-2 border-dashed border-blue-200 bg-[#E8F4FD] flex flex-col items-center justify-center p-4 gap-3">
                      <svg className="w-8 h-8 text-[#1B6CA8]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                      </svg>
                      <p className="text-xs text-[#1B6CA8]/50 text-center leading-relaxed max-w-[160px]">
                        Live map coming soon
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
                <h2 className="font-heading font-bold text-[17px] text-gray-900">
                  Available orders
                </h2>
                <p className="text-xs text-gray-600 mt-0.5">
                  Unclaimed orders you can pick up
                </p>
              </div>
              {isAvailable && (
                <span className="text-[11px] font-semibold bg-green-100 text-green-700 px-2.5 py-1 rounded-full">
                  {availableOrders.length} available
                </span>
              )}
            </div>

            {!isAvailable ? (
              <div className="py-8 text-center border border-dashed border-gray-200 rounded-xl">
                <p className="text-sm font-medium text-gray-600">
                  You are currently off duty.
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Toggle availability to see orders.
                </p>
              </div>
            ) : availableOrders.length === 0 ? (
              <div className="py-8 text-center border border-dashed border-gray-200 rounded-xl">
                <p className="text-sm font-medium text-gray-600 mb-3">
                  No orders available right now. Check back soon.
                </p>
                <button
                  onClick={() => setRefreshKey(k => k + 1)}
                  className="text-xs font-medium text-[#1B6CA8] border border-[#1B6CA8] px-4 py-1.5 rounded-lg hover:bg-[#F0F7FF] transition-colors"
                >
                  Refresh
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {availableOrders.map(order => (
                  <div
                    key={order.id}
                    className="flex items-center gap-5 border border-[#e5e7eb] rounded-xl p-4 hover:border-[#1B6CA8]/40 transition-colors"
                  >
                    <div className="flex-1 min-w-0 grid grid-cols-4 gap-4 items-center">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-600 mb-0.5">
                          Order
                        </p>
                        <p className="font-heading font-bold text-[14px] text-gray-900">
                          LBG-{order.id.substring(0, 8).toUpperCase()}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-600 mb-0.5">
                          Shop
                        </p>
                        <p className="text-sm text-gray-700 truncate">{order.shopName ?? '—'}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-600 mb-0.5">
                          Pickup
                        </p>
                        <p className="text-sm text-gray-600 truncate">
                          {order.pickupAddress?.street ?? '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-600 mb-0.5">
                          Service
                        </p>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] font-medium bg-[#E8F4FD] text-[#1B6CA8] px-2 py-0.5 rounded-full whitespace-nowrap">
                            {order.serviceType ?? '—'}
                          </span>
                          <span className="text-[11px] text-gray-600 whitespace-nowrap">
                            {order.estimatedWeight} kg
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleClaimOrder(order.id)}
                      className="shrink-0 bg-[#1B6CA8] text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-[#155a8a] transition-colors whitespace-nowrap"
                    >
                      Claim order
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming tasks table */}
          <div className="bg-white rounded-xl border border-[#e5e7eb] p-6">
            <h2 className="font-heading font-bold text-[17px] text-gray-900 mb-5">
              Upcoming tasks
            </h2>

            {upcomingTasks.length === 0 ? (
              <p className="text-sm text-gray-600 py-4">No upcoming tasks assigned yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#e5e7eb]">
                    {['Order ID', 'Customer', 'Pickup address', 'Shop', 'Status', 'Action'].map(col => (
                      <th
                        key={col}
                        className="text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-600 pb-3 pr-4 last:pr-0"
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
                      <td className="py-3.5 pr-4 text-gray-600">
                        {order.pickupAddress?.street ?? '—'}
                      </td>
                      <td className="py-3.5 pr-4 text-gray-600">
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

          {/* Earnings snapshot */}
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
                  <p className={`text-[10px] font-medium ${entry.day === ACTIVE_DAY ? 'text-[#1B6CA8]' : 'text-gray-600'}`}>
                    {entry.amount > 0 ? `₱${entry.amount}` : '—'}
                  </p>
                  <p className={`text-[11px] mt-0.5 ${entry.day === ACTIVE_DAY ? 'text-gray-700 font-semibold' : 'text-gray-600'}`}>
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
