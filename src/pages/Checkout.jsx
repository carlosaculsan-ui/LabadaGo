import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'
import CalendarPicker from '../components/CalendarPicker'

// ─── Constants ───────────────────────────────────────────────────────────────

const TIME_SLOTS = ['8AM–10AM', '10AM–12PM', '12PM–2PM', '2PM–4PM', '4PM–6PM']

const SERVICE_TYPES = [
  { id: 'Wash & Fold'     },
  { id: 'Dry Cleaning'    },
  { id: 'Comforters'      },
  { id: 'Towels & Linens' },
]

const DETERGENTS   = ['Ariel', 'Tide', 'Breeze', 'Hypoallergenic']
const CONDITIONERS = ['Downy', 'Comfort', 'None']

const PAYMENT_METHODS = [
  { id: 'gcash', label: 'GCash',            desc: 'Pay with GCash wallet'    },
  { id: 'maya',  label: 'Maya',             desc: 'Pay with Maya wallet'     },
  { id: 'cod',   label: 'Cash on Delivery', desc: 'Pay when laundry arrives' },
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
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={[
            'text-sm px-3.5 py-1.5 rounded-full border transition-colors',
            value === opt
              ? 'bg-[#1B6CA8] text-white border-[#1B6CA8] font-medium'
              : 'border-[#e5e7eb] text-gray-600 hover:border-[#1B6CA8] hover:text-[#1B6CA8]',
          ].join(' ')}
        >
          {opt}
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
  const [street,   setStreet]   = useState('')
  const [landmark, setLandmark] = useState('')

  // Schedule
  const [pickupDate,   setPickupDate]   = useState(null)
  const [pickupTime,   setPickupTime]   = useState(null)
  const [deliveryDate, setDeliveryDate] = useState(null)
  const [deliveryTime, setDeliveryTime] = useState(null)

  // Laundry details
  const [serviceType, setServiceType] = useState(null)
  const [weight,      setWeight]      = useState(3)
  const [detergent,   setDetergent]   = useState('Ariel')
  const [conditioner, setConditioner] = useState('Downy')

  // Payment
  const [payment, setPayment] = useState('gcash')

  // UI state
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState('')

  // Derived prices
  const subtotal    = weight * PRICE_PER_KG
  const total       = subtotal + PICKUP_FEE + DELIVERY_FEE
  const totalPrice  = total

  async function handleConfirm() {
    setError('')

    if (!street)       return setError('Please enter your street address.')
    if (!pickupDate)   return setError('Please select a pickup date.')
    if (!pickupTime)   return setError('Please select a pickup time.')
    if (!deliveryDate) return setError('Please select a delivery date.')
    if (!deliveryTime) return setError('Please select a delivery time.')

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
        conditioner,
        pickupAddress:   { street, landmark },
        pickupDate:      pickupDate.toISOString(),
        pickupTime,
        deliveryDate:    deliveryDate.toISOString(),
        deliveryTime,
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
              <div className="space-y-3">
                <input
                  type="text"
                  value={street}
                  onChange={e => setStreet(e.target.value)}
                  placeholder="Street address"
                  className="w-full border border-[#e5e7eb] rounded-lg px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-600 outline-none focus:ring-2 focus:ring-[#1B6CA8]/25 focus:border-[#1B6CA8] transition-colors"
                />
                <input
                  type="text"
                  value={landmark}
                  onChange={e => setLandmark(e.target.value)}
                  placeholder="Landmark / Unit / Floor (optional)"
                  className="w-full border border-[#e5e7eb] rounded-lg px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-600 outline-none focus:ring-2 focus:ring-[#1B6CA8]/25 focus:border-[#1B6CA8] transition-colors"
                />
              </div>
            </div>

            {/* Section 2 — Schedule */}
            <div className="p-6">
              <SectionTitle>Select pickup &amp; delivery schedule</SectionTitle>
              <div className="grid grid-cols-2 gap-5">

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

                <div>
                  <CalendarPicker
                    label="Delivery date"
                    value={deliveryDate}
                    onChange={setDeliveryDate}
                  />
                  <div className="mt-3">
                    <FieldLabel>Delivery time</FieldLabel>
                    <div className="flex flex-wrap gap-1.5">
                      {TIME_SLOTS.map(slot => (
                        <button
                          key={slot}
                          onClick={() => setDeliveryTime(slot)}
                          className={[
                            'text-xs px-3 py-1.5 rounded-full border transition-colors',
                            deliveryTime === slot
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
                    <ImgPlaceholder
                      label={`Service illustration — ${st.id}`}
                      className="w-14 h-14 mx-auto mb-3 rounded-lg"
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
                    {/* ↓ image placeholder — replace with real payment logo */}
                    <ImgPlaceholder
                      label={`${pm.label} logo`}
                      className="w-10 h-10 mb-3 rounded-lg"
                    />
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

              {/* ↓ image placeholder — replace with shop photo fetched by shop ID */}
              <ImgPlaceholder
                label="Shop photo — 80×80px"
                className="w-20 h-20 mb-4 rounded-xl"
              />

              <div className="space-y-3 mb-1">
                <SummaryRow label="Shop"        value={shopName}              />
                <SummaryRow label="Service"     value={serviceType ?? '—'}    />
                <SummaryRow
                  label={`Est. ${weight} kg × ₱${PRICE_PER_KG}`}
                  value={`₱${subtotal.toLocaleString()}`}
                />
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
                    {/* ↓ image placeholder — replace with payment logo icon */}
                    <ImgPlaceholder
                      label={`${pm.label.split(' ')[0]} logo`}
                      className="w-8 h-8 rounded-lg"
                    />
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
