import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore'
import { MOCK_SHOPS } from '../data/mockShops'
import { db } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'
import CalendarPicker from '../components/CalendarPicker'
import MapPicker from '../components/MapPicker'

// ─── Constants ───────────────────────────────────────────────────────────────

const TIME_SLOTS = ['8AM–10AM', '10AM–12PM', '12PM–2PM', '2PM–4PM', '4PM–6PM']

const SERVICE_TYPES = [
  { id: 'Wash & Fold',     image: '/Wash&Fold.png'     },
  { id: 'Dry Cleaning',    image: '/DryCleaning.png'   },
  { id: 'Comforters',      image: '/Comforters.png'    },
  { id: 'Towels & Linens', image: '/Towels&Linens.png' },
]

const DETERGENTS = [
  { id: 'Ariel',          price: 25 },
  { id: 'Tide',           price: 25 },
  { id: 'Breeze',         price: 20 },
  { id: 'Hypoallergenic', price: 35 },
]
const CONDITIONERS = [
  { id: 'Downy',   price: 20 },
  { id: 'Comfort', price: 20 },
  { id: 'None',    price: 0  },
]

const PAYMENT_METHODS = [
  { id: 'gcash', label: 'GCash',            desc: 'Pay with GCash wallet',    image: '/GCash.png'              },
  { id: 'maya',  label: 'Maya',             desc: 'Pay with Maya wallet',     image: '/Maya.png'               },
  { id: 'cod',   label: 'Cash on Delivery', desc: 'Pay when laundry arrives', image: '/cash-on-delivery.png'   },
]

const PRICE_PER_KG = 50
const PICKUP_FEE   = 49
const DELIVERY_FEE = 49

// ─── Reusable small components ────────────────────────────────────────────────

function SectionTitle({ children }) {
  return (
    <h2 className="font-heading font-bold text-[16px] text-gray-900 mb-5">
      {children}
    </h2>
  )
}

function FieldLabel({ children }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-600 mb-2">
      {children}
    </p>
  )
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex justify-between items-start gap-3 text-sm">
      <span className="text-gray-600">{label}</span>
      <span className="font-medium text-gray-700 text-right">{value}</span>
    </div>
  )
}

function RadioPills({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(({ id, price }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={[
            'flex items-center gap-1.5 text-sm px-3.5 py-1.5 rounded-full border transition-colors',
            value === id
              ? 'bg-[#1B6CA8] text-white border-[#1B6CA8] font-medium'
              : 'border-[#e5e7eb] text-gray-600 hover:border-[#1B6CA8] hover:text-[#1B6CA8]',
          ].join(' ')}
        >
          {id}
          <span className={`text-[11px] ${value === id ? 'text-white/80' : 'text-gray-400'}`}>
            {price === 0 ? 'Free' : `₱${price}`}
          </span>
        </button>
      ))}
    </div>
  )
}

// A clearly labeled image placeholder. bg, border-dashed, centered label.
function ImgPlaceholder({ label, className }) {
  return (
    <div
      className={[
        'bg-gray-100 border border-dashed border-gray-300 rounded-xl',
        'flex items-center justify-center',
        className,
      ].join(' ')}
    >
      <span className="text-[8px] font-medium text-gray-600 text-center leading-snug px-1.5">
        {label}
      </span>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Checkout() {
  const [searchParams] = useSearchParams()
  const navigate  = useNavigate()
  const { user, userProfile } = useAuth()

  const shopName = searchParams.get('shop') || "Ate Linda's Lavanderia"
  const shopId   = searchParams.get('shopId') || null

  // Address
  const [street,        setStreet]        = useState('')
  const [landmark,      setLandmark]      = useState('')
  const [pickupCoords,  setPickupCoords]  = useState(null)

  // Schedule
  const [pickupDate, setPickupDate] = useState(null)
  const [pickupTime, setPickupTime] = useState(null)

  // Delivery is always pickup + 2 days
  const deliveryDate = pickupDate ? new Date(pickupDate.getTime() + 2 * 24 * 60 * 60 * 1000) : null

  // Laundry details
  const [serviceType, setServiceType] = useState('Wash & Fold')
  const [weight,      setWeight]      = useState(3)
  const [detergent,   setDetergent]   = useState('Ariel')
  const [conditioner, setConditioner] = useState('Downy')

  // Payment
  const [payment, setPayment] = useState('gcash')

  // UI state
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState('')
  const [shopImage,  setShopImage]  = useState(null)

  useEffect(() => {
    // Try Firestore first, fall back to mock data
    const mockMatch = MOCK_SHOPS.find(s => s.id === shopId || s.name === shopName)
    if (mockMatch?.image) { setShopImage(mockMatch.image); return }
    if (!shopId) return
    getDoc(doc(db, 'shops', shopId)).then(snap => {
      if (snap.exists()) setShopImage(snap.data().image ?? null)
    })
  }, [shopId, shopName])

  // Derived prices
  const detergentPrice   = DETERGENTS.find(d => d.id === detergent)?.price ?? 0
  const conditionerPrice = CONDITIONERS.find(c => c.id === conditioner)?.price ?? 0
  const subtotal         = weight * PRICE_PER_KG
  const total            = subtotal + PICKUP_FEE + DELIVERY_FEE + detergentPrice + conditionerPrice
  const totalPrice       = total

  async function handleConfirm() {
    setError('')

    if (!street)     return setError('Please enter your pickup address.')
    if (!pickupDate) return setError('Please select a pickup date.')
    if (!pickupTime) return setError('Please select a pickup time.')

    setSubmitting(true)
    try {
      const orderObject = {
        customerId:      user.uid,
        customerName:    userProfile?.fullName ?? user.displayName ?? '',
        shopId,
        shopName,
        status:          'PENDING',
        serviceType,
        estimatedWeight: weight,
        actualWeight:    null,
        detergent,
        detergentPrice,
        conditioner,
        conditionerPrice,
        pickupAddress:   { street, landmark, coords: pickupCoords },
        pickupDate:   pickupDate.toISOString(),
        pickupTime,
        deliveryDate: deliveryDate.toISOString(),
        paymentMethod:   payment,
        estimatedPrice:  totalPrice,
        finalPrice:      null,
        pickupFee:       PICKUP_FEE,
        deliveryFee:     DELIVERY_FEE,
        riderId:         null,
        createdAt:       serverTimestamp(),
        updatedAt:       serverTimestamp(),
      }

      const newDoc = await addDoc(collection(db, 'orders'), orderObject)
      navigate(`/order-tracking?id=${newDoc.id}`, { replace: true })
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-8 py-10">

        {/* Page heading */}
        <div className="mb-7">
          <h1 className="font-heading font-extrabold text-[26px] text-gray-900">
            Book your laundry pickup
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Booking with <span className="font-medium text-gray-600">{shopName}</span>
          </p>
        </div>

        <div className="flex gap-7 items-start">

          {/* ── Left: booking form ─────────────────────────────────────────── */}
          <div className="flex-1 min-w-0 bg-white rounded-xl border border-[#e5e7eb] divide-y divide-[#e5e7eb]">

            {/* Section 1 — Address */}
            <div className="p-6">
              <SectionTitle>Your pickup address</SectionTitle>
              <MapPicker
                label="Pickup location"
                address={street}
                onAddressChange={setStreet}
                onCoordsChange={setPickupCoords}
              />
              <input
                type="text"
                value={landmark}
                onChange={e => setLandmark(e.target.value)}
                placeholder="Landmark / Unit / Floor (optional)"
                className="mt-3 w-full border border-[#e5e7eb] rounded-lg px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-[#1B6CA8]/25 focus:border-[#1B6CA8] transition-colors"
              />
            </div>

            {/* Section 2 — Schedule */}
            <div className="p-6">
              <SectionTitle>Pickup schedule</SectionTitle>
              <div className="grid grid-cols-2 gap-5 items-start">

                <div>
                  <CalendarPicker
                    label="Pickup date"
                    value={pickupDate}
                    onChange={setPickupDate}
                  />
                  <div className="mt-3">
                    <FieldLabel>Pickup time</FieldLabel>
                    <div className="flex flex-wrap gap-1.5">
                      {TIME_SLOTS.map(slot => (
                        <button
                          key={slot}
                          onClick={() => setPickupTime(slot)}
                          className={[
                            'text-xs px-3 py-1.5 rounded-full border transition-colors',
                            pickupTime === slot
                              ? 'bg-[#1B6CA8] text-white border-[#1B6CA8] font-medium'
                              : 'border-[#e5e7eb] text-gray-600 hover:border-[#1B6CA8] hover:text-[#1B6CA8]',
                          ].join(' ')}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Expected delivery info */}
                <div className="border border-[#e5e7eb] rounded-xl p-4 bg-white">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-600 mb-4">
                    Expected delivery
                  </p>
                  {deliveryDate ? (
                    <>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-[#E8F4FD] flex items-center justify-center shrink-0">
                          <svg className="w-5 h-5 text-[#1B6CA8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-heading font-bold text-gray-900 text-sm">
                            {deliveryDate.toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric' })}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">2 days after pickup</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        Your clean laundry will be delivered on this date. The rider will contact you before arrival.
                      </p>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                      <svg className="w-8 h-8 text-gray-200 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-xs text-gray-400">Select a pickup date to see your estimated delivery date.</p>
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Section 3 — Laundry details */}
            <div className="p-6">
              <SectionTitle>Laundry details</SectionTitle>

              {/* Service type cards */}
              <FieldLabel>Service type</FieldLabel>
              <div className="grid grid-cols-4 gap-3 mb-6">
                {SERVICE_TYPES.map(st => (
                  <button
                    key={st.id}
                    onClick={() => setServiceType(st.id)}
                    className={[
                      'py-4 px-2 rounded-xl border text-center transition-colors',
                      serviceType === st.id
                        ? 'border-[#1B6CA8] bg-[#F0F7FF]'
                        : 'border-[#e5e7eb] hover:border-gray-300',
                    ].join(' ')}
                  >
                    {/* ↓ image placeholder — replace with real service illustration */}
                    <img
                      src={st.image}
                      alt={st.id}
                      className="w-24 h-24 mx-auto mb-3 rounded-lg object-contain"
                    />
                    <span className={[
                      'text-[11px] font-semibold leading-tight block',
                      serviceType === st.id ? 'text-[#1B6CA8]' : 'text-gray-600',
                    ].join(' ')}>
                      {st.id}
                    </span>
                  </button>
                ))}
              </div>

              {/* Weight stepper */}
              <FieldLabel>Estimated weight</FieldLabel>
              <div className="flex items-center gap-3 mb-6">
                <button
                  onClick={() => setWeight(w => Math.max(1, w - 1))}
                  className="w-9 h-9 rounded-lg border border-[#e5e7eb] flex items-center justify-center text-gray-600 text-lg hover:border-[#1B6CA8] hover:text-[#1B6CA8] transition-colors select-none"
                >
                  −
                </button>
                <span className="font-heading font-bold text-xl text-gray-900 w-8 text-center tabular-nums">
                  {weight}
                </span>
                <button
                  onClick={() => setWeight(w => Math.min(30, w + 1))}
                  className="w-9 h-9 rounded-lg border border-[#e5e7eb] flex items-center justify-center text-gray-600 text-lg hover:border-[#1B6CA8] hover:text-[#1B6CA8] transition-colors select-none"
                >
                  +
                </button>
                <span className="text-sm text-gray-600">kg</span>
              </div>

              {/* Detergent */}
              <div className="mb-4">
                <FieldLabel>Detergent preference</FieldLabel>
                <RadioPills options={DETERGENTS} value={detergent} onChange={setDetergent} />
              </div>

              {/* Fabric conditioner */}
              <div>
                <FieldLabel>Fabric conditioner</FieldLabel>
                <RadioPills options={CONDITIONERS} value={conditioner} onChange={setConditioner} />
              </div>
            </div>

            {/* Section 4 — Payment */}
            <div className="p-6">
              <SectionTitle>Payment method</SectionTitle>
              <div className="grid grid-cols-3 gap-3">
                {PAYMENT_METHODS.map(pm => (
                  <button
                    key={pm.id}
                    onClick={() => setPayment(pm.id)}
                    className={[
                      'text-left p-4 rounded-xl border transition-all',
                      payment === pm.id
                        ? 'border-[#1B6CA8] bg-[#F0F7FF]'
                        : 'border-[#e5e7eb] hover:border-gray-300',
                    ].join(' ')}
                  >
                    <img src={pm.image} alt={pm.label} className={`mb-3 rounded-xl object-contain ${pm.id === 'gcash' ? 'w-[77px] h-[77px]' : 'w-16 h-16'}`} />
                    <p className="text-sm font-semibold text-gray-900">{pm.label}</p>
                    <p className="text-[11px] text-gray-600 mt-0.5 leading-snug">{pm.desc}</p>
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* ── Right: sticky price summary ────────────────────────────────── */}
          <div className="w-80 shrink-0 sticky top-20 self-start">
            <div className="bg-white rounded-xl border border-[#e5e7eb] p-6">

              <h2 className="font-heading font-bold text-lg text-gray-900 mb-5">
                Order summary
              </h2>

              {shopImage
                ? <img src={shopImage} alt={shopName} className="w-20 h-20 mb-4 rounded-xl object-cover" />
                : <div className="w-20 h-20 mb-4 rounded-xl bg-gray-100" />
              }

              <div className="space-y-3 mb-1">
                <SummaryRow label="Shop"        value={shopName}              />
                <SummaryRow label="Service"     value={serviceType ?? '—'}    />
                <SummaryRow
                  label={`Est. ${weight} kg × ₱${PRICE_PER_KG}`}
                  value={`₱${subtotal.toLocaleString()}`}
                />
                <SummaryRow label="Detergent"    value={detergentPrice > 0   ? `₱${detergentPrice}`   : 'Free'} />
                {conditioner !== 'None' && (
                  <SummaryRow label="Conditioner" value={`₱${conditionerPrice}`} />
                )}
                <SummaryRow label="Pickup fee"   value={`₱${PICKUP_FEE}`}    />
                <SummaryRow label="Delivery fee" value={`₱${DELIVERY_FEE}`}  />
              </div>

              <hr className="border-[#e5e7eb] my-4" />

              <div className="flex justify-between items-baseline">
                <span className="font-heading font-bold text-[15px] text-gray-900">Total</span>
                <span className="font-heading font-extrabold text-2xl text-[#1B6CA8]">
                  ₱{total.toLocaleString()}
                </span>
              </div>

              <p className="text-[11px] text-gray-600 mt-2 mb-5 leading-relaxed">
                Final price adjusted after shop weighs your laundry.
              </p>

              {error && (
                <div className="mb-3 px-4 py-2 bg-red-50 border border-red-200 rounded-full text-xs text-red-600 text-center">
                  {error}
                </div>
              )}

              <button
                onClick={handleConfirm}
                disabled={submitting}
                className="w-full bg-[#1B6CA8] text-white font-semibold py-3 rounded-lg hover:bg-[#155a8a] transition-colors text-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <span className="inline-block w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Confirming...
                  </>
                ) : 'Confirm booking'}
              </button>

              {/* Payment method echo — shows which method is active */}
              <div className="flex items-center justify-center gap-3 mt-4">
                {PAYMENT_METHODS.map(pm => (
                  <div
                    key={pm.id}
                    className={`transition-opacity ${payment === pm.id ? 'opacity-100' : 'opacity-20'}`}
                  >
                    <img src={pm.image} alt={pm.label} className="w-8 h-8 rounded-lg object-contain" />
                  </div>
                ))}
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
