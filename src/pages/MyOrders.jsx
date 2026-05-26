import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { db, auth } from '../lib/firebase'

// ─── Constants ────────────────────────────────────────────────────────────────

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

const ACTIVE_STATUSES = new Set([
  'ACCEPTED', 'PICKUP_EN_ROUTE', 'PICKED_UP',
  'ARRIVED_AT_SHOP', 'PROCESSING', 'READY_FOR_DELIVERY', 'DELIVERY_EN_ROUTE',
])

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function OrderSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-[#e5e7eb] p-5 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-32" />
          <div className="h-3 bg-gray-100 rounded w-24" />
        </div>
        <div className="h-6 bg-gray-200 rounded-full w-28" />
      </div>
      <div className="flex gap-2 mb-4">
        <div className="h-5 bg-gray-100 rounded-full w-24" />
        <div className="h-5 bg-gray-100 rounded-full w-16" />
      </div>
      <div className="flex items-center justify-between pt-4 border-t border-[#e5e7eb]">
        <div className="h-4 bg-gray-200 rounded w-20" />
        <div className="h-8 bg-gray-200 rounded-lg w-24" />
      </div>
    </div>
  )
}

// ─── OrderCard ────────────────────────────────────────────────────────────────

function OrderCard({ order }) {
  const navigate = useNavigate()
  const ref = `LBG-${order.id.substring(0, 8).toUpperCase()}`

  const weight     = order.actualWeight != null ? order.actualWeight : order.estimatedWeight
  const weightNote = order.actualWeight != null ? 'actual' : 'est.'
  const price      = order.finalPrice   != null ? order.finalPrice   : order.estimatedPrice
  const priceNote  = order.finalPrice   != null ? ''                 : 'est.'

  const createdDate = order.createdAt?.toDate
    ? order.createdAt.toDate().toLocaleDateString('en-PH', {
        month: 'short', day: 'numeric', year: 'numeric',
      })
    : '—'

  const isActive    = ACTIVE_STATUSES.has(order.status)
  const isCompleted = order.status === 'COMPLETED'
  const isCancelled = order.status === 'CANCELLED'

  return (
    <div className={[
      'bg-white rounded-xl border p-5 flex flex-col gap-4 transition-shadow hover:shadow-sm',
      isActive ? 'border-[#1B6CA8]/40' : 'border-[#e5e7eb]',
    ].join(' ')}>

      {/* Top row — ref + status */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-heading font-bold text-[15px] text-gray-900 leading-none">{ref}</p>
          <p className="text-xs text-gray-600 mt-1">{createdDate}</p>
        </div>
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap shrink-0 ${STATUS_PILL[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
          {STATUS_LABEL[order.status] ?? order.status}
        </span>
      </div>

      {/* Shop + service chips */}
      <div>
        <p className="text-sm font-medium text-gray-800 mb-2">
          {order.shopName ?? 'Unknown shop'}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {order.serviceType && (
            <span className="text-[11px] font-medium bg-[#E8F4FD] text-[#0C447C] px-2.5 py-0.5 rounded-full">
              {order.serviceType}
            </span>
          )}
          <span className="text-[11px] font-medium bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full">
            {weight} kg ({weightNote})
          </span>
          {order.detergent && (
            <span className="text-[11px] font-medium bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full">
              {order.detergent}
            </span>
          )}
        </div>
      </div>

      {/* Bottom row — price + action */}
      <div className="flex items-center justify-between pt-3 border-t border-[#e5e7eb] mt-auto">
        <div>
          <span className="text-sm font-bold text-gray-800">
            ₱{price?.toLocaleString() ?? '—'}
          </span>
          {priceNote && (
            <span className="text-xs text-gray-600 ml-1">{priceNote}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isCancelled && (
            <span className="text-xs text-gray-600">Order cancelled</span>
          )}
          {isCompleted && (
            <button
              onClick={() => navigate(`/order-tracking?id=${order.id}`)}
              className="text-xs font-medium px-3 py-1.5 rounded-lg border border-[#e5e7eb] text-gray-600 hover:bg-gray-50 transition-colors"
            >
              View receipt
            </button>
          )}
          {!isCancelled && !isCompleted && (
            <button
              onClick={() => navigate(`/order-tracking?id=${order.id}`)}
              className="text-xs font-semibold px-4 py-1.5 rounded-lg bg-[#1B6CA8] text-white hover:bg-[#155a8a] transition-colors"
            >
              Track order
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const TABS = ['All', 'Active', 'Completed', 'Cancelled']

export default function MyOrders() {
  const navigate = useNavigate()
  const [orders,  setOrders]  = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('All')

  useEffect(() => {
    let unsubscribeQuery = null
    let unsubscribeAuth = null

    function subscribe(uid) {
      const q = query(
        collection(db, 'orders'),
        where('customerId', '==', uid),
        orderBy('createdAt', 'desc')
      )
      unsubscribeQuery = onSnapshot(q, snap => {
        setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        setLoading(false)
      }, () => setLoading(false))
    }

    // auth.currentUser is already populated once AuthContext has resolved,
    // so skip the onAuthStateChanged cycle that fires null first on hard refresh
    if (auth.currentUser) {
      subscribe(auth.currentUser.uid)
    } else {
      unsubscribeAuth = onAuthStateChanged(auth, firebaseUser => {
        if (unsubscribeQuery) { unsubscribeQuery(); unsubscribeQuery = null }
        if (!firebaseUser) { setOrders([]); setLoading(false); return }
        subscribe(firebaseUser.uid)
      })
    }

    return () => {
      if (unsubscribeAuth) unsubscribeAuth()
      if (unsubscribeQuery) unsubscribeQuery()
    }
  }, [])

  const filtered = orders.filter(o => {
    if (activeTab === 'All')       return true
    if (activeTab === 'Active')    return ACTIVE_STATUSES.has(o.status)
    if (activeTab === 'Completed') return o.status === 'COMPLETED'
    if (activeTab === 'Cancelled') return o.status === 'CANCELLED'
    return true
  })

  const tabCount = tab => {
    if (tab === 'All')       return orders.length
    if (tab === 'Active')    return orders.filter(o => ACTIVE_STATUSES.has(o.status)).length
    if (tab === 'Completed') return orders.filter(o => o.status === 'COMPLETED').length
    if (tab === 'Cancelled') return orders.filter(o => o.status === 'CANCELLED').length
    return 0
  }

  return (
    <div className="min-h-screen bg-[#F4F7FA]">
      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <h1 className="font-heading font-bold text-[1.75rem] text-gray-900">My Orders</h1>
          <p className="text-sm text-gray-600 mt-1">
            {loading ? 'Loading…' : `${orders.length} order${orders.length !== 1 ? 's' : ''} total`}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#e5e7eb] mb-6">
          {TABS.map(tab => {
            const count = tabCount(tab)
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={[
                  'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors',
                  activeTab === tab
                    ? 'text-[#1B6CA8] border-b-2 border-[#1B6CA8] -mb-px'
                    : 'text-gray-600 hover:text-gray-600',
                ].join(' ')}
              >
                {tab}
                {!loading && count > 0 && (
                  <span className={[
                    'text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center',
                    activeTab === tab ? 'bg-[#DBEAFE] text-[#1B6CA8]' : 'bg-gray-100 text-gray-600',
                  ].join(' ')}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-4">
            <OrderSkeleton />
            <OrderSkeleton />
            <OrderSkeleton />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#e5e7eb] py-20 text-center">
            <p className="text-4xl mb-4">🧺</p>
            <p className="font-heading font-semibold text-gray-700 mb-1">
              {activeTab === 'All' ? 'No orders yet' : `No ${activeTab.toLowerCase()} orders`}
            </p>
            <p className="text-sm text-gray-600 mb-5">
              {activeTab === 'All'
                ? 'Book your first pickup and your orders will appear here.'
                : 'Switch tabs to see other orders.'}
            </p>
            {activeTab === 'All' && (
              <button
                onClick={() => navigate('/browse')}
                className="inline-flex items-center gap-2 bg-[#1B6CA8] text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-[#155a8a] transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Browse shops
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(order => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
