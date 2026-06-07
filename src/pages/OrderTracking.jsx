import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import { collection, query, where, getDocs, doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db, auth } from '../lib/firebase'

// ─── Data ─────────────────────────────────────────────────────────────────────

const ORDER_STATUSES = [
  { id: 'PENDING',            label: 'Pending',             desc: 'Your booking has been submitted and is awaiting confirmation.'     },
  { id: 'ACCEPTED',           label: 'Accepted by shop',    desc: 'The shop has confirmed your order and is preparing for pickup.'    },
  { id: 'PICKUP_EN_ROUTE',    label: 'Pickup en route',     desc: 'Your rider is on the way to collect your laundry.'                 },
  { id: 'PICKED_UP',          label: 'Laundry picked up',   desc: 'Your rider has collected your laundry and is heading to the shop.' },
  { id: 'ARRIVED_AT_SHOP',    label: 'Arrived at shop',     desc: 'Your laundry has arrived at the shop and will be sorted.'          },
  { id: 'PROCESSING',         label: 'Washing & drying',    desc: 'Your clothes are being washed, dried, and folded with care.'       },
  { id: 'READY_FOR_DELIVERY', label: 'Ready for delivery',  desc: 'Your laundry is clean, folded, and ready to be delivered.'         },
  { id: 'DELIVERY_EN_ROUTE',  label: 'Delivery en route',   desc: 'Your rider is on the way to deliver your fresh laundry.'           },
  { id: 'COMPLETED',          label: 'Delivered',           desc: 'Your laundry has been delivered. Thank you for using LabadaGo!'   },
]

const STATUS_INDEX = {
  PENDING:            0,
  ACCEPTED:           1,
  PICKUP_EN_ROUTE:    2,
  PICKED_UP:          3,
  ARRIVED_AT_SHOP:    4,
  PROCESSING:         5,
  READY_FOR_DELIVERY: 6,
  DELIVERY_EN_ROUTE:  7,
  COMPLETED:          8,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
}

function fmtPayment(method) {
  return { gcash: 'GCash', maya: 'Maya', cod: 'Cash on Delivery' }[method] ?? method
}

// ─── Shared placeholder component ─────────────────────────────────────────────

function ImgPlaceholder({ label, className }) {
  return (
    <div className={['border border-dashed flex items-center justify-center', className].join(' ')}>
      <span className="text-[7px] font-medium text-gray-600 text-center leading-snug px-1.5">
        {label}
      </span>
    </div>
  )
}

function Spinner({ text }) {
  return (
    <div className="min-h-screen bg-[#F4F7FA] flex flex-col items-center justify-center gap-3">
      <div className="w-10 h-10 rounded-full border-4 border-gray-200 border-t-[#1B6CA8] animate-spin" />
      {text && <p className="text-sm text-gray-600">{text}</p>}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OrderTracking() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const orderId    = searchParams.get('id')
  const location   = useLocation()
  const justBooked = location.state?.justBooked === true

  const [order,      setOrder]      = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [manualId,   setManualId]   = useState('')

  function handleLookup() {
    const id = manualId.trim()
    if (!id) return
    navigate(`/order-tracking?id=${id}`, { replace: true })
  }

  useEffect(() => {
    if (orderId) {
      const unsubscribe = onSnapshot(
        doc(db, 'orders', orderId),
        (snap) => {
          if (!snap.exists()) {
            setError('Order not found.')
            setLoading(false)
            return
          }
          const data = snap.data()
          if (data.customerId !== auth.currentUser?.uid) {
            navigate('/', { replace: true })
            return
          }
          setOrder(data)
          setLoading(false)
        },
        () => {
          setError('Could not load order. You may not have permission to view it.')
          setLoading(false)
        }
      )
      return unsubscribe
    }

    // No orderId: find the most recent non-completed order for this user
    const uid = auth.currentUser?.uid
    if (!uid) {
      setLoading(false)
      return
    }

    getDocs(query(
      collection(db, 'orders'),
      where('customerId', '==', uid)
    )).then(snap => {
      const activeDoc = snap.docs
        .sort((a, b) => (b.data().createdAt?.seconds ?? 0) - (a.data().createdAt?.seconds ?? 0))
        .find(d => !['COMPLETED', 'CANCELLED'].includes(d.data().status))
      if (activeDoc) {
        navigate(`/order-tracking?id=${activeDoc.id}`, { replace: true })
      } else {
        setLoading(false)
      }
    }).catch(() => {
      setLoading(false)
    })
  }, [orderId, navigate])

  async function handleCancel() {
    setCancelling(true)
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status:    'CANCELLED',
        updatedAt: serverTimestamp(),
      })
      navigate('/browse', { replace: true })
    } catch {
      setCancelling(false)
    }
  }

  if (loading) return <Spinner text="Loading your order..." />

  if (error) {
    return (
      <div className="min-h-screen bg-[#F4F7FA]">
        <div className="max-w-lg mx-auto px-4 pt-10 pb-16">
          <h1 className="font-heading font-bold text-2xl text-gray-900 mb-1">Track your order</h1>
          <p className="text-sm text-gray-500 mb-8">Enter your order ID to see real-time status.</p>
          <div className="bg-white rounded-xl border border-[#e5e7eb] p-6 text-center">
            <p className="font-heading font-bold text-gray-900 text-base mb-2">Something went wrong</p>
            <p className="text-sm text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="bg-[#1B6CA8] text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-[#155a8a] transition-colors"
            >
              Go home
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#F4F7FA]">
        <div className="max-w-lg mx-auto px-4 pt-10 pb-16">
          <h1 className="font-heading font-bold text-2xl text-gray-900 mb-1">Track your order</h1>
          <p className="text-sm text-gray-500 mb-8">Enter your order ID to see real-time status.</p>

          <div className="bg-white rounded-xl border border-[#e5e7eb] p-6 mb-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-500 mb-3">Order ID</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualId}
                onChange={e => setManualId(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLookup()}
                placeholder="Paste your order ID here"
                className="flex-1 px-4 py-2.5 rounded-lg border border-[#e5e7eb] text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-[#1B6CA8]/30 focus:border-[#1B6CA8] transition-all"
              />
              <button
                onClick={handleLookup}
                className="px-4 py-2.5 bg-[#1B6CA8] text-white text-sm font-semibold rounded-lg hover:bg-[#155a8a] transition-colors shrink-0"
              >
                Track
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">You can find your order ID in your booking confirmation.</p>
          </div>

          <div className="bg-white rounded-xl border border-[#e5e7eb] p-6 text-center">
            <p className="font-heading font-bold text-gray-900 text-base mb-2">No active order found</p>
            <p className="text-sm text-gray-600 mb-5">
              You don't have an active order to track right now.
            </p>
            <button
              onClick={() => navigate('/browse')}
              className="bg-[#1B6CA8] text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-[#155a8a] transition-colors"
            >
              Browse shops
            </button>
          </div>
        </div>
      </div>
    )
  }

  const activeIndex  = STATUS_INDEX[order.status] ?? 0
  const activeStatus = ORDER_STATUSES[activeIndex]
  const displayPrice = order.finalPrice ?? order.estimatedPrice
  const weightLabel  = order.actualWeight != null
    ? `${order.actualWeight} kg`
    : `${order.estimatedWeight} kg (estimated)`
  const orderRef = `LBG-${orderId.substring(0, 8).toUpperCase()}`

  return (
    <div className="min-h-screen bg-[#F4F7FA]">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-10">
        <h1 className="font-heading font-bold text-2xl text-gray-900 mb-6">Track your order</h1>
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">

          {/* ── Left column ───────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* Confirmation note — only on the direct post-booking navigation */}
            {justBooked && (
              <div className="flex items-center gap-2.5 bg-green-50 border border-green-200 rounded-xl px-5 py-3">
                <svg className="w-4 h-4 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-sm text-green-800">
                  Booking confirmed! A confirmation has been sent to your registered email.
                </p>
              </div>
            )}

            {/* Section 1 — Order header */}
            <div className="bg-white rounded-xl border border-[#e5e7eb] p-6">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h1 className="font-heading font-bold text-[22px] text-gray-900 leading-tight">
                    Order #{orderRef}
                  </h1>
                  <p className="text-sm text-gray-600 mt-1">
                    {order.createdAt?.toDate
                      ? order.createdAt.toDate().toLocaleString('en-PH', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
                      : 'Just placed'}
                  </p>
                </div>
                <span className="bg-[#1B6CA8] text-white text-sm font-semibold px-4 py-1.5 rounded-full shrink-0">
                  {activeStatus?.label ?? order.status}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br from-[#2179BE] to-[#0C447C] shadow-sm">
                  <span className="text-[13px] font-bold text-white leading-none tracking-wide">
                    {(() => {
                      const parts = (order.shopName || '').trim().split(/\s+/).filter(Boolean)
                      if (parts.length === 0) return '?'
                      if (parts.length === 1) return parts[0][0].toUpperCase()
                      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
                    })()}
                  </span>
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-gray-800">{order.shopName}</p>
                </div>
              </div>
            </div>

            {/* Section 2 — Progress tracker */}
            <div className="bg-white rounded-xl border border-[#e5e7eb] p-6">
              <h2 className="font-heading font-bold text-[16px] text-gray-900 mb-6">
                Order progress
              </h2>

              <div>
                {ORDER_STATUSES.map((status, idx) => {
                  const isCompleted = idx < activeIndex
                  const isActive    = idx === activeIndex
                  const isLast      = idx === ORDER_STATUSES.length - 1

                  return (
                    <div key={status.id} className="flex gap-4">

                      {/* Circle + connecting line */}
                      <div className="flex flex-col items-center">
                        <div className={[
                          'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                          isCompleted
                            ? 'bg-[#1B6CA8]'
                            : isActive
                            ? 'bg-[#F5A623] animate-pulse'
                            : 'bg-gray-200',
                        ].join(' ')}>
                          {isCompleted && (
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        {!isLast && (
                          <div className={[
                            'w-0.5 flex-1 min-h-8 mt-1',
                            idx < activeIndex ? 'bg-[#1B6CA8]' : 'bg-gray-200',
                          ].join(' ')} />
                        )}
                      </div>

                      {/* Content */}
                      <div className={[
                        'flex-1 flex justify-between items-start gap-4',
                        !isLast ? 'pb-5' : '',
                      ].join(' ')}>
                        <div className="flex-1">
                          <p className={[
                            'font-heading text-[14px]',
                            isCompleted || isActive ? 'font-bold text-gray-900' : 'font-semibold text-gray-600',
                          ].join(' ')}>
                            {status.label}
                          </p>
                          <p className={[
                            'text-xs mt-0.5 leading-relaxed',
                            isCompleted || isActive ? 'text-gray-600' : 'text-gray-600',
                          ].join(' ')}>
                            {status.desc}
                          </p>
                        </div>
                      </div>

                    </div>
                  )
                })}
              </div>
            </div>

            {/* Section 3 — Order details */}
            <div className="bg-white rounded-xl border border-[#e5e7eb] p-6">
              <h2 className="font-heading font-bold text-[16px] text-gray-900 mb-5">
                Order details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-600 mb-3">
                    Laundry details
                  </p>
                  <div className="space-y-2">
                    {[
                      ['Service',     order.serviceType ?? '—'],
                      ['Weight',      weightLabel            ],
                      ['Detergent',   order.detergent ?? '—' ],
                      ['Conditioner', order.conditioner ?? '—'],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between text-sm">
                        <span className="text-gray-600">{label}</span>
                        <span className="font-medium text-gray-700">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-600 mb-3">
                    Schedule
                  </p>
                  <div className="space-y-2">
                    {[
                      ['Pickup',   `${fmtDate(order.pickupDate)} · ${order.pickupTime ?? '—'}`    ],
                      ['Delivery', `${fmtDate(order.deliveryDate)} · ${order.deliveryTime ?? 'TBD'}` ],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between text-sm">
                        <span className="text-gray-600">{label}</span>
                        <span className="font-medium text-gray-700 text-right">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <hr className="border-[#e5e7eb] my-4" />

              {/* Weight confirmation */}
              <div className="flex items-center gap-2">
                <ImgPlaceholder
                  label="warning icon"
                  className="w-5 h-5 rounded bg-[#FEF3C7] border-amber-300 shrink-0"
                />
                <p className="text-sm text-amber-600">
                  <span className="font-semibold">Weight confirmation: </span>
                  {order.actualWeight != null
                    ? `Confirmed — ${order.actualWeight} kg`
                    : 'Pending — shop will update after weighing'}
                </p>
              </div>
            </div>

            {/* Section 4 — Price breakdown */}
            <div className="bg-white rounded-xl border border-[#e5e7eb] p-6">
              <h2 className="font-heading font-bold text-[16px] text-gray-900 mb-5">
                Price breakdown
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    Est. {order.estimatedWeight} kg × ₱{order.pricePerKg ?? 50}
                  </span>
                  <span className="font-medium text-gray-700">
                    ₱{(order.estimatedWeight * (order.pricePerKg ?? 50)).toLocaleString()}
                  </span>
                </div>
                {order.detergentPrice > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Detergent ({order.detergent})</span>
                    <span className="font-medium text-gray-700">₱{order.detergentPrice}</span>
                  </div>
                )}
                {order.conditioner !== 'None' && order.conditionerPrice > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Conditioner ({order.conditioner})</span>
                    <span className="font-medium text-gray-700">₱{order.conditionerPrice}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Pickup fee</span>
                  <span className="font-medium text-gray-700">₱{order.pickupFee}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Delivery fee</span>
                  <span className="font-medium text-gray-700">₱{order.deliveryFee}</span>
                </div>
              </div>
              <hr className="border-[#e5e7eb] my-4" />
              <div className="flex justify-between items-baseline">
                <span className="font-heading font-bold text-[15px] text-gray-900">
                  {order.finalPrice != null ? 'Final total' : 'Estimated total'}
                </span>
                <span className="font-bold text-2xl text-[#1B6CA8]">
                  ₱{displayPrice?.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <p className="text-[11px] text-gray-600 leading-relaxed">
                  {order.finalPrice != null
                    ? 'This is the final confirmed price.'
                    : 'Final price adjusted after the shop weighs your actual laundry.'}
                </p>
                <span className="text-[11px] font-medium text-gray-600">{fmtPayment(order.paymentMethod)}</span>
              </div>
            </div>

          </div>

          {/* ── Right column ──────────────────────────────────────────────── */}
          <div className="w-full md:w-96 shrink-0 md:sticky md:top-20 md:self-start space-y-4">

            {/* Order status summary card */}
            <div className="rounded-xl border border-[#e5e7eb] bg-white p-6">

              {/* Current step */}
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-[#F5A623]/15 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-[#D97706]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400 mb-0.5">Current status</p>
                  <p className="font-heading font-bold text-gray-900 text-[15px] leading-tight">{activeStatus?.label}</p>
                </div>
              </div>

              <p className="text-xs text-gray-500 leading-relaxed mb-5">{activeStatus?.desc}</p>

              {/* Progress bar */}
              <div className="mb-2">
                <div className="flex justify-between text-[10px] text-gray-400 mb-1.5">
                  <span>Step {activeIndex + 1} of {ORDER_STATUSES.length}</span>
                  <span>{Math.round((activeIndex / (ORDER_STATUSES.length - 1)) * 100)}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#1B6CA8] rounded-full transition-all duration-500"
                    style={{ width: `${(activeIndex / (ORDER_STATUSES.length - 1)) * 100}%` }}
                  />
                </div>
              </div>

              {/* Next step */}
              {activeIndex < ORDER_STATUSES.length - 1 && (
                <div className="mt-4 bg-[#F4F7FA] rounded-xl px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400 mb-0.5">Up next</p>
                  <p className="text-sm font-semibold text-gray-700">{ORDER_STATUSES[activeIndex + 1].label}</p>
                </div>
              )}

              {/* Live tracking teaser — only when rider is active */}
              {['PICKUP_EN_ROUTE', 'DELIVERY_EN_ROUTE'].includes(order.status) && (
                <div className="mt-4 flex items-center gap-3 border border-dashed border-[#1B6CA8]/40 rounded-xl p-4 bg-[#F0F7FF]">
                  <div className="w-9 h-9 rounded-xl bg-[#E8F4FD] flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#1B6CA8" strokeWidth="1.75" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                      <circle cx="12" cy="9" r="2.5" fill="#1B6CA8" stroke="none"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1B6CA8]">Live tracking coming soon</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-snug">Real-time rider location will appear here.</p>
                  </div>
                </div>
              )}

            </div>

            {/* Rider info card */}
            <div className="bg-white rounded-xl border border-[#e5e7eb] p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-600 mb-4">
                Your rider
              </p>
              {order.riderId ? (
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <ImgPlaceholder
                      label="Rider photo"
                      className="w-12 h-12 rounded-full bg-gray-100 border-gray-300 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-heading font-bold text-[15px] text-gray-900">Assigned</p>
                      <p className="text-xs text-gray-600">Rider</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <button className="text-sm font-medium px-4 py-1.5 rounded-lg border border-[#1B6CA8] text-[#1B6CA8] hover:bg-[#F0F7FF] transition-colors">
                      Call rider
                    </button>
                    <button className="text-sm font-medium px-4 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:border-gray-400 transition-colors">
                      Message
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700">No rider assigned yet</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-snug">
                      {['PENDING', 'ACCEPTED'].includes(order.status)
                        ? 'Assigned once the shop confirms your pickup'
                        : 'Details will appear here shortly'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Estimated arrival */}
            <div className="bg-white rounded-xl border border-[#e5e7eb] p-5">
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-5 h-5 text-[#1B6CA8] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="font-heading font-semibold text-[15px] text-gray-900">
                  Pickup window: {order.pickupTime ?? '—'}
                </p>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed pl-7">
                {fmtDate(order.pickupDate)}
              </p>
            </div>

            {/* Cancel order — only when PENDING */}
            {order.status === 'PENDING' && (
              <div className="text-center py-2">
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="text-sm text-[#DC2626] hover:underline underline-offset-2 transition-colors disabled:opacity-50"
                >
                  {cancelling ? 'Cancelling...' : 'Cancel order'}
                </button>
                <p className="text-[11px] text-gray-600 mt-1">(Only available before pickup)</p>
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  )
}
