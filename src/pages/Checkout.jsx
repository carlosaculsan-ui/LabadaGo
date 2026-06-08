import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { collection, setDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore'
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
  { id: 'Standard (No preference)', price: 0  },
  { id: 'Ariel',                    price: 25 },
  { id: 'Hypoallergenic',           price: 35 },
]
const CONDITIONERS = [
  { id: 'Downy',   price: 20 },
  { id: 'Comfort', price: 20 },
  { id: 'None',    price: 0  },
]

const PAYMENT_METHODS = [
  { id: 'gcash', label: 'GCash',            desc: 'Pay with GCash wallet',    image: '/GCash.png'            },
  { id: 'maya',  label: 'Maya',             desc: 'Pay with Maya wallet',     image: '/Maya.png'             },
  { id: 'cod',   label: 'Cash on Delivery', desc: 'Pay when laundry arrives', image: '/cash-on-delivery.png' },
]

const PRICE_PER_KG = 50
const PICKUP_FEE   = 49
const DELIVERY_FEE = 49

// ─── Reusable small components ────────────────────────────────────────────────

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

function StepIndicator({ current }) {
  const STEP_LABELS = ['Where & When', 'Your Laundry', 'Review & Pay']
  return (
    <div className="flex items-start">
      {STEP_LABELS.map((label, i) => {
        const num         = i + 1
        const isCompleted = num < current
        const isActive    = num === current
        return (
          <div key={i} className="flex-1 flex flex-col items-center relative">
            {i > 0 && (
              <motion.div
                className="absolute left-0 right-1/2 top-[15px] h-0.5"
                animate={{ backgroundColor: num <= current ? '#1B6CA8' : '#e5e7eb' }}
                transition={{ duration: 0.4 }}
              />
            )}
            {i < STEP_LABELS.length - 1 && (
              <motion.div
                className="absolute left-1/2 right-0 top-[15px] h-0.5"
                animate={{ backgroundColor: isCompleted ? '#1B6CA8' : '#e5e7eb' }}
                transition={{ duration: 0.4 }}
              />
            )}

            <motion.div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold relative z-10 border-2"
              animate={{
                backgroundColor: isCompleted ? '#1B6CA8' : '#ffffff',
                borderColor:     isCompleted || isActive ? '#1B6CA8' : '#e5e7eb',
                scale:           isActive ? 1.1 : 1,
              }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <AnimatePresence mode="wait" initial={false}>
                {isCompleted ? (
                  <motion.svg
                    key="check"
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth={2.5}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
                  >
                    <motion.path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.25, delay: 0.05 }}
                    />
                  </motion.svg>
                ) : (
                  <motion.span
                    key="num"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    style={{ color: isActive ? '#1B6CA8' : '#9ca3af' }}
                  >
                    {num}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>

            <span className={`text-[11px] font-semibold mt-2 text-center leading-tight transition-colors duration-300 ${isActive ? 'text-[#1B6CA8]' : isCompleted ? 'text-gray-600' : 'text-gray-400'}`}>
              {label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function SectionCard({ icon, title, children }) {
  return (
    <div className="bg-white rounded-xl border border-[#e5e7eb] overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 bg-[#F4F7FA] border-b border-[#e5e7eb]">
        <div className="w-7 h-7 rounded-lg bg-[#1B6CA8] flex items-center justify-center shrink-0">
          {icon}
        </div>
        <span className="font-heading font-bold text-[15px] text-gray-900">{title}</span>
      </div>
      <div className="p-6">
        {children}
      </div>
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

  const defaultAddr  = userProfile?.addresses?.find(a => a.isDefault)
  const didPrefill   = useRef(false)
  const [prefilledLabel, setPrefilledLabel] = useState(null)

  // Address
  const [street,        setStreet]        = useState('')
  const [landmark,      setLandmark]      = useState('')
  const [pickupCoords,  setPickupCoords]  = useState(null)

  // Schedule
  const [pickupDate, setPickupDate] = useState(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d })
  const [pickupTime, setPickupTime] = useState(null)

  // Delivery is always pickup + 2 days
  const deliveryDate = pickupDate ? new Date(pickupDate.getTime() + 2 * 24 * 60 * 60 * 1000) : null

  // Laundry details
  const [serviceType, setServiceType] = useState('Wash & Fold')
  const [weight,      setWeight]      = useState(3)
  const [detergent,   setDetergent]   = useState('Standard (No preference)')
  const [conditioner, setConditioner] = useState('None')

  // Payment
  const [payment, setPayment] = useState('gcash')

  // UI state
  const [submitting, setSubmitting] = useState(false)
  const [errors,     setErrors]     = useState({})
  const [shopImage,  setShopImage]  = useState(null)
  const [step,       setStep]       = useState(1)
  const [pricePerKg,       setPricePerKg]       = useState(PRICE_PER_KG)
  const [shopRating,       setShopRating]       = useState(null)
  const [shopReviewCount,  setShopReviewCount]  = useState(null)

  useEffect(() => {
    // Try Firestore first, fall back to mock data
    const mockMatch = MOCK_SHOPS.find(s => s.id === shopId || s.name === shopName)
    if (mockMatch) {
      if (mockMatch.image)       setShopImage(mockMatch.image)
      if (mockMatch.pricePerKg)  setPricePerKg(mockMatch.pricePerKg)
      if (mockMatch.rating)      setShopRating(mockMatch.rating)
      if (mockMatch.reviewCount) setShopReviewCount(mockMatch.reviewCount)
      return
    }
    if (!shopId) return
    getDoc(doc(db, 'shops', shopId)).then(snap => {
      if (snap.exists()) {
        const data = snap.data()
        setShopImage(data.image ?? null)
        setPricePerKg(data.pricePerKg ?? PRICE_PER_KG)
        if (data.rating)      setShopRating(data.rating)
        if (data.reviewCount) setShopReviewCount(data.reviewCount)
      }
    })
  }, [shopId, shopName])

  useEffect(() => {
    if (didPrefill.current || !defaultAddr) return
    didPrefill.current = true
    const parts = [defaultAddr.line1, defaultAddr.barangay, defaultAddr.city].filter(Boolean)
    setStreet(parts.join(', '))
    if (defaultAddr.notes) setLandmark(defaultAddr.notes)
    setPrefilledLabel(defaultAddr.label)
  }, [defaultAddr])

  // Derived prices
  const detergentPrice   = DETERGENTS.find(d => d.id === detergent)?.price ?? 0
  const conditionerPrice = CONDITIONERS.find(c => c.id === conditioner)?.price ?? 0
  const subtotal         = weight * pricePerKg
  const total            = subtotal + PICKUP_FEE + DELIVERY_FEE + detergentPrice + conditionerPrice
  const totalPrice       = total

  function handlePickupDateChange(d) {
    setPickupDate(d)
    setErrors(e => { const n = { ...e }; delete n.pickupDate; return n })
  }

  function handlePickupTimeChange(slot) {
    setPickupTime(slot)
    setErrors(e => { const n = { ...e }; delete n.pickupTime; return n })
  }

  async function handleConfirm() {
    const newErrors = {}
    if (!street)     newErrors.street     = 'Please enter your pickup address.'
    if (!pickupDate) newErrors.pickupDate = 'Please select a pickup date.'
    if (!pickupTime) newErrors.pickupTime = 'Please select a pickup time.'
    if (Object.keys(newErrors).length) { setErrors(newErrors); return }
    setErrors({})

    setSubmitting(true)
    try {
      const orderObject = {
        customerId:      user.uid,
        customerName:    userProfile?.fullName ?? user.displayName ?? '',
        shopId,
        shopName,
        pricePerKg,
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

      const newRef    = doc(collection(db, 'orders'))
      const orderRef  = `LBG-${newRef.id.substring(0, 8).toUpperCase()}`
      await setDoc(newRef, { ...orderObject, orderRef })
      navigate(`/order-tracking?id=${newRef.id}`, { replace: true, state: { justBooked: true } })
    } catch (err) {
      setErrors({ submit: err.message })
      setSubmitting(false)
    }
  }

  function handleNext() {
    if (step === 1) {
      const newErrors = {}
      if (!street)     newErrors.street     = 'Please enter your pickup address.'
      if (!pickupDate) newErrors.pickupDate = 'Please select a pickup date.'
      if (!pickupTime) newErrors.pickupTime = 'Please select a pickup time.'
      if (Object.keys(newErrors).length) { setErrors(newErrors); return }
      setErrors({})
      setStep(2)
    } else if (step === 2) {
      setStep(3)
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleBack() {
    setErrors({})
    setStep(s => s - 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-10">

        {/* Back link */}
        <button
          onClick={() => navigate('/browse')}
          className="text-sm text-[#1B6CA8] hover:underline underline-offset-2 mb-5 flex items-center gap-1.5"
        >
          ← Back to shops
        </button>

        {/* Page heading */}
        <div className="mb-7">
          <h1 className="font-heading font-extrabold text-[26px] text-gray-900">
            Book your laundry pickup
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Booking with <span className="font-medium text-gray-600">{shopName}</span>
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-5 md:gap-7 md:items-start">

          {/* ── Left: step form ─────────────────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* Step indicator */}
            <div className="bg-white rounded-xl border border-[#e5e7eb] p-5">
              <StepIndicator current={step} />
            </div>

            {/* ── Step 1: Where & When ──────────────────────────────────── */}
            {step === 1 && (
              <>
                <SectionCard
                  icon={
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                      <circle cx="12" cy="9" r="2.5" fill="white" stroke="none"/>
                    </svg>
                  }
                  title="Your pickup address"
                >
                  <MapPicker
                    label="Pickup location"
                    address={street}
                    onAddressChange={v => { setStreet(v); if (v) setErrors(e => { const n = { ...e }; delete n.street; return n }) }}
                    onCoordsChange={setPickupCoords}
                  />
                  {street.trim() && (
                    <div className="mt-2 flex items-center gap-1.5 text-green-600">
                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-xs font-medium">
                        {prefilledLabel ? `Pre-filled from your saved ${prefilledLabel} address` : 'Address set'}
                      </span>
                    </div>
                  )}
                  <input
                    type="text"
                    value={landmark}
                    onChange={e => setLandmark(e.target.value)}
                    placeholder="Landmark / Unit / Floor (optional)"
                    className="mt-3 w-full border border-[#e5e7eb] rounded-lg px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-[#1B6CA8]/25 focus:border-[#1B6CA8] transition-colors"
                  />
                </SectionCard>

                <SectionCard
                  icon={
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                  }
                  title="Pickup schedule"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                    <div>
                      <CalendarPicker
                        label="Pickup date"
                        value={pickupDate}
                        onChange={handlePickupDateChange}
                      />
                      <div className="mt-3">
                        <FieldLabel>Pickup time</FieldLabel>
                        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
                          {TIME_SLOTS.map(slot => (
                            <button
                              key={slot}
                              onClick={() => handlePickupTimeChange(slot)}
                              className={[
                                'text-xs px-3 py-1.5 rounded-full border transition-colors shrink-0 whitespace-nowrap',
                                pickupTime === slot
                                  ? 'bg-[#1B6CA8] text-white border-[#1B6CA8] font-medium'
                                  : 'border-[#e5e7eb] text-gray-600 cursor-pointer hover:border-[#1B6CA8] hover:text-[#1B6CA8] hover:bg-[#EEF5FB]',
                              ].join(' ')}
                            >
                              {slot}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

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
                </SectionCard>

                {Object.values(errors).length > 0 && (
                  <div className="space-y-1.5">
                    {Object.values(errors).map((msg, i) => (
                      <div key={i} className="px-4 py-2 bg-red-50 border border-red-200 rounded-full text-xs text-red-600 text-center">
                        {msg}
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex sm:justify-end">
                  <button
                    onClick={handleNext}
                    className="w-full sm:w-auto bg-[#1B6CA8] text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-[#155a8a] transition-colors flex items-center justify-center gap-2"
                  >
                    Next: Your Laundry
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </button>
                </div>
              </>
            )}

            {/* ── Step 2: Your Laundry ──────────────────────────────────── */}
            {step === 2 && (
              <>
                <SectionCard
                  icon={
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.75" className="w-4 h-4">
                      <rect x="3" y="3" width="18" height="18" rx="3" strokeLinecap="round"/>
                      <circle cx="12" cy="13" r="4"/>
                      <path strokeLinecap="round" d="M7 7h2"/>
                    </svg>
                  }
                  title="Laundry details"
                >
                  <FieldLabel>Service type</FieldLabel>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
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
                    <span className="text-xs text-gray-400 ml-1">avg. load is 3–5 kg</span>
                  </div>
                  <p className="text-xs text-gray-400 -mt-4 mb-6">
                    Just estimate — the shop confirms the exact weight and adjusts the final price before pickup.
                  </p>

                  <div className="mb-4">
                    <FieldLabel>Detergent preference</FieldLabel>
                    <RadioPills options={DETERGENTS} value={detergent} onChange={setDetergent} />
                  </div>

                  <div>
                    <FieldLabel>Fabric conditioner</FieldLabel>
                    <RadioPills options={CONDITIONERS} value={conditioner} onChange={setConditioner} />
                  </div>
                </SectionCard>

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between sm:items-center">
                  <button
                    onClick={handleBack}
                    className="w-full sm:w-auto text-sm font-semibold text-gray-600 px-5 py-2.5 rounded-lg border border-[#e5e7eb] hover:border-gray-300 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                    </svg>
                    Where & When
                  </button>
                  <button
                    onClick={handleNext}
                    className="w-full sm:w-auto bg-[#1B6CA8] text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-[#155a8a] transition-colors flex items-center justify-center gap-2"
                  >
                    Next: Review & Pay
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </button>
                </div>
              </>
            )}

            {/* ── Step 3: Review & Pay ──────────────────────────────────── */}
            {step === 3 && (
              <>
                <SectionCard
                  icon={
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                    </svg>
                  }
                  title="Order review"
                >
                  <div className="space-y-5">

                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400 mb-2.5">Pickup details</p>
                      <div className="space-y-2.5">
                        <div className="flex items-start justify-between gap-4 text-sm">
                          <span className="text-gray-500 shrink-0">Address</span>
                          <span className="font-medium text-gray-800 text-right">
                            {street}{landmark ? `, ${landmark}` : ''}
                          </span>
                        </div>
                        <div className="flex items-start justify-between gap-4 text-sm">
                          <span className="text-gray-500 shrink-0">Pickup date</span>
                          <span className="font-medium text-gray-800 text-right">
                            {pickupDate?.toLocaleDateString('en-PH', { weekday: 'short', month: 'long', day: 'numeric' })}
                          </span>
                        </div>
                        <div className="flex items-start justify-between gap-4 text-sm">
                          <span className="text-gray-500 shrink-0">Pickup time</span>
                          <span className="font-medium text-gray-800">{pickupTime}</span>
                        </div>
                        <div className="flex items-start justify-between gap-4 text-sm">
                          <span className="text-gray-500 shrink-0">Expected delivery</span>
                          <span className="font-medium text-gray-800 text-right">
                            {deliveryDate?.toLocaleDateString('en-PH', { weekday: 'short', month: 'long', day: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <hr className="border-[#f0f0f0]" />

                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400 mb-2.5">Laundry preferences</p>
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between gap-4 text-sm">
                          <span className="text-gray-500">Service</span>
                          <span className="font-medium text-gray-800">{serviceType}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 text-sm">
                          <span className="text-gray-500">Est. weight</span>
                          <span className="font-medium text-gray-800">{weight} kg × ₱{pricePerKg} = ₱{subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 text-sm">
                          <span className="text-gray-500">Detergent</span>
                          <span className="font-medium text-gray-800">
                            {detergent}{detergentPrice > 0 ? ` (+₱${detergentPrice})` : ' (free)'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4 text-sm">
                          <span className="text-gray-500">Conditioner</span>
                          <span className="font-medium text-gray-800">
                            {conditioner}{conditionerPrice > 0 ? ` (+₱${conditionerPrice})` : ' (free)'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <hr className="border-[#f0f0f0]" />

                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400">Total</span>
                      <span className="font-heading font-extrabold text-lg text-[#1B6CA8]">₱{total.toLocaleString()}</span>
                    </div>

                    <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-3 -mx-0">
                      <svg viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" className="w-3.5 h-3.5 shrink-0 mt-0.5">
                        <circle cx="12" cy="12" r="10"/>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01"/>
                      </svg>
                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        Want to change anything? Use the ← back button to edit your selections.
                      </p>
                    </div>

                  </div>
                </SectionCard>

                <SectionCard
                  icon={
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-4 h-4">
                      <rect x="1" y="4" width="22" height="16" rx="2"/>
                      <path strokeLinecap="round" d="M1 10h22"/>
                    </svg>
                  }
                  title="Payment method"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                </SectionCard>

                {Object.values(errors).length > 0 && (
                  <div className="space-y-1.5">
                    {Object.values(errors).map((msg, i) => (
                      <div key={i} className="px-4 py-2 bg-red-50 border border-red-200 rounded-full text-xs text-red-600 text-center">
                        {msg}
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between sm:items-center">
                  <button
                    onClick={handleBack}
                    className="w-full sm:w-auto text-sm font-semibold text-gray-600 px-5 py-2.5 rounded-lg border border-[#e5e7eb] hover:border-gray-300 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                    </svg>
                    Your Laundry
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={submitting}
                    className="w-full sm:w-auto bg-[#1B6CA8] text-white font-semibold py-2.5 px-6 rounded-lg hover:bg-[#155a8a] transition-colors text-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <span className="inline-block w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        Confirming...
                      </>
                    ) : 'Confirm booking'}
                  </button>
                </div>
              </>
            )}

          </div>

          {/* ── Right: sticky price summary ────────────────────────────────── */}
          <div className="w-full md:w-80 shrink-0 md:sticky md:top-20 md:self-start">
            <div className="bg-white rounded-xl border border-[#e5e7eb] p-6">

              <h2 className="font-heading font-bold text-lg text-gray-900 mb-5">
                Order summary
              </h2>

              {typeof shopImage === 'string' && shopImage.startsWith('http')
                ? <img src={shopImage} alt={shopName} className="w-20 h-20 mb-4 rounded-xl object-cover" />
                : <div className="w-20 h-20 mb-4 rounded-xl bg-gray-100" />
              }

              {shopRating && (
                <div className="flex items-center gap-1.5 mb-4">
                  {[1,2,3,4,5].map(n => (
                    <svg key={n} className={`w-3.5 h-3.5 ${n <= Math.round(shopRating) ? 'text-[#F5A623]' : 'text-gray-200'}`} viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                  <span className="text-xs font-semibold text-gray-700">{shopRating}</span>
                  {shopReviewCount && <span className="text-xs text-gray-400">· {shopReviewCount} reviews</span>}
                </div>
              )}

              <div className="space-y-3 mb-1">
                <SummaryRow label="Shop"        value={shopName}              />
                <SummaryRow label="Service"     value={serviceType ?? '—'}    />
                <SummaryRow
                  label={`Est. ${weight} kg × ₱${pricePerKg}`}
                  value={`₱${subtotal.toLocaleString()}`}
                />
                <SummaryRow label="Detergent"    value={detergentPrice > 0 ? `${detergent} · ₱${detergentPrice}` : detergent} />
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

              <div className="mt-3 mb-5 flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <svg viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" className="w-4 h-4 shrink-0 mt-0.5">
                  <circle cx="12" cy="12" r="10"/>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01"/>
                </svg>
                <p className="text-[12px] text-amber-800 leading-relaxed">
                  Final price is adjusted after the shop weighs your actual laundry.
                </p>
              </div>

              {step === 3 && (
                <>
                  {Object.values(errors).length > 0 && (
                    <div className="mb-3 space-y-1.5">
                      {Object.values(errors).map((msg, i) => (
                        <div key={i} className="px-4 py-2 bg-red-50 border border-red-200 rounded-full text-xs text-red-600 text-center">
                          {msg}
                        </div>
                      ))}
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
                </>
              )}

            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
