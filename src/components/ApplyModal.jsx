import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'

const SERVICES = ['Wash & Fold', 'Dry Cleaning', 'Comforters', 'Towels & Linens']
const VEHICLES = ['Motorcycle', 'Bicycle', 'Car']

const CARD_COLORS = ['bg-[#DBEAFE]', 'bg-[#D1FAE5]', 'bg-[#FEE2E2]', 'bg-[#EDE9FE]', 'bg-[#FEF3C7]', 'bg-[#CCFBF1]']

function Field({ label, children, hint }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
    </div>
  )
}

const inputCls = 'w-full px-3.5 py-2.5 rounded-xl border border-[#e5e7eb] text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#1B6CA8]/25 focus:border-[#1B6CA8] transition-all placeholder:text-gray-300'

export default function ApplyModal({ type, onClose }) {
  const navigate   = useNavigate()
  const { user, refreshProfile } = useAuth()

  // merchant fields
  const [shopName,    setShopName]    = useState('')
  const [shopAddress, setShopAddress] = useState('')
  const [gcash,       setGcash]       = useState('')
  const [pricePerKg,  setPricePerKg]  = useState('')
  const [description, setDescription] = useState('')
  const [services,    setServices]    = useState([])

  // rider fields
  const [vehicle,     setVehicle]     = useState('Motorcycle')
  const [plate,       setPlate]       = useState('')
  const [contact,     setContact]     = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState('')
  const [success,    setSuccess]    = useState(false)

  function toggleService(svc) {
    setServices(prev => prev.includes(svc) ? prev.filter(s => s !== svc) : [...prev, svc])
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (type === 'merchant') {
      if (!shopName.trim())    return setError('Shop name is required.')
      if (!shopAddress.trim()) return setError('Shop address is required.')
      if (services.length === 0) return setError('Select at least one service.')
    }
    if (type === 'rider') {
      if (!plate.trim())   return setError('Plate number is required.')
      if (!contact.trim()) return setError('Contact number is required.')
    }

    setSubmitting(true)
    try {
      const userRef = doc(db, 'users', user.uid)
      const appRef  = doc(db, 'applications', user.uid)

      if (type === 'merchant') {
        const shopRef = doc(db, 'shops', user.uid)
        const colorIdx = Math.floor(Math.random() * CARD_COLORS.length)
        await setDoc(shopRef, {
          name:        shopName.trim(),
          address:     shopAddress.trim(),
          gcash:       gcash.trim(),
          pricePerKg:  pricePerKg ? parseInt(pricePerKg, 10) : 65,
          description: description.trim(),
          services,
          detergents:  ['Any'],
          rating:      5.0,
          reviewCount: 0,
          distanceKm:  +(Math.random() * 4 + 0.5).toFixed(1),
          isOpen:      true,
          isSameDay:   false,
          isFeatured:  false,
          color:       CARD_COLORS[colorIdx],
          ownerId:     user.uid,
          createdAt:   serverTimestamp(),
        })
        await setDoc(appRef, {
          type:       'merchant',
          status:     'approved',
          shopName:   shopName.trim(),
          shopAddress: shopAddress.trim(),
          gcash:      gcash.trim(),
          services,
          appliedAt:  serverTimestamp(),
          userId:     user.uid,
        })
        await updateDoc(userRef, { role: 'merchant' })
      }

      if (type === 'rider') {
        await setDoc(appRef, {
          type:      'rider',
          status:    'approved',
          vehicle,
          plate:     plate.trim(),
          contact:   contact.trim(),
          appliedAt: serverTimestamp(),
          userId:    user.uid,
        })
        await updateDoc(userRef, { role: 'rider' })
      }

      await refreshProfile()
      setSuccess(true)
    } catch (err) {
      setError('Something went wrong. Please try again.')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const isMerchant = type === 'merchant'
  const title      = isMerchant ? 'Apply as Merchant' : 'Apply as Rider'
  const dashPath   = isMerchant ? '/merchant' : '/rider'
  const accentColor = isMerchant ? 'text-[#1B6CA8]' : 'text-emerald-600'
  const accentBg    = isMerchant ? 'bg-[#1B6CA8] hover:bg-[#155a8a]' : 'bg-emerald-600 hover:bg-emerald-700'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[480px] max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#e5e7eb] shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isMerchant ? 'bg-[#E8F4FD]' : 'bg-emerald-50'}`}>
              {isMerchant ? (
                <svg className="w-5 h-5 text-[#1B6CA8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  <polyline points="9,22 9,12 15,12 15,22" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </div>
            <h2 className="font-heading font-bold text-gray-900 text-base">{title}</h2>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1">
          {success ? (
            <div className="flex flex-col items-center justify-center px-8 py-12 text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-5 ${isMerchant ? 'bg-[#E8F4FD]' : 'bg-emerald-50'}`}>
                <svg className={`w-8 h-8 ${accentColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="font-heading font-bold text-xl text-gray-900 mb-2">
                {isMerchant ? "You're now a Merchant!" : "You're now a Rider!"}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-8">
                {isMerchant
                  ? 'Your shop has been listed on LabadaGo. Head to your dashboard to manage orders and update your shop profile.'
                  : 'Welcome to the team! Head to your dashboard to start accepting delivery assignments.'}
              </p>
              <button
                onClick={() => { onClose(); navigate(dashPath) }}
                className={`w-full ${accentBg} text-white font-bold py-3.5 rounded-xl transition-colors text-sm`}
              >
                Go to my dashboard →
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">

              {isMerchant ? (
                <>
                  <Field label="Shop name *">
                    <input value={shopName} onChange={e => setShopName(e.target.value)} placeholder="e.g. Sunshine Laundry" className={inputCls} />
                  </Field>
                  <Field label="Shop address *">
                    <input value={shopAddress} onChange={e => setShopAddress(e.target.value)} placeholder="e.g. 12 Rizal St, Barangay Sta. Cruz" className={inputCls} />
                  </Field>
                  <Field label="Services offered *">
                    <div className="grid grid-cols-2 gap-2">
                      {SERVICES.map(svc => (
                        <label key={svc} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border cursor-pointer transition-colors text-sm ${services.includes(svc) ? 'border-[#1B6CA8] bg-[#E8F4FD] text-[#1B6CA8] font-medium' : 'border-[#e5e7eb] text-gray-600 hover:border-[#1B6CA8]/40'}`}>
                          <input type="checkbox" className="hidden" checked={services.includes(svc)} onChange={() => toggleService(svc)} />
                          <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${services.includes(svc) ? 'bg-[#1B6CA8] border-[#1B6CA8]' : 'border-gray-300'}`}>
                            {services.includes(svc) && (
                              <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </span>
                          {svc}
                        </label>
                      ))}
                    </div>
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Starting price (₱/kg)" hint="Leave blank to default to ₱65">
                      <input type="number" value={pricePerKg} onChange={e => setPricePerKg(e.target.value)} placeholder="65" min={1} className={inputCls} />
                    </Field>
                    <Field label="GCash number">
                      <input value={gcash} onChange={e => setGcash(e.target.value)} placeholder="09XXXXXXXXX" className={inputCls} />
                    </Field>
                  </div>
                  <Field label="Short description" hint="Tell customers what makes your shop special">
                    <textarea
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      rows={3}
                      placeholder="e.g. Family-owned shop since 2015. We use premium detergents and guarantee same-day turnaround."
                      className={`${inputCls} resize-none`}
                    />
                  </Field>
                </>
              ) : (
                <>
                  <Field label="Vehicle type *">
                    <div className="flex gap-2">
                      {VEHICLES.map(v => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setVehicle(v)}
                          className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors ${vehicle === v ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-[#e5e7eb] text-gray-600 hover:border-emerald-300'}`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </Field>
                  <Field label="Plate number *">
                    <input value={plate} onChange={e => setPlate(e.target.value)} placeholder="e.g. ABC 1234" className={inputCls} />
                  </Field>
                  <Field label="Contact number *">
                    <input type="tel" value={contact} onChange={e => setContact(e.target.value)} placeholder="e.g. 09171234567" className={inputCls} />
                  </Field>
                </>
              )}

              {error && (
                <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-[#e5e7eb] text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`flex-1 ${accentBg} text-white text-sm font-bold py-3 rounded-xl transition-colors disabled:opacity-50`}
                >
                  {submitting ? 'Submitting…' : 'Submit application'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
