import { useState } from 'react'
import { doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'

const SERVICES    = ['Wash & Fold', 'Dry Cleaning', 'Comforters', 'Towels & Linens']
const VEHICLES    = ['Motorcycle', 'Bicycle', 'Car']
const CARD_COLORS = ['bg-[#DBEAFE]', 'bg-[#D1FAE5]', 'bg-[#FEE2E2]', 'bg-[#EDE9FE]', 'bg-[#FEF3C7]', 'bg-[#CCFBF1]']

const MERCHANT_STEPS = ['Personal Info', 'Shop & Documents', 'Review & Submit']
const RIDER_STEPS    = ['Personal Info', 'Vehicle & Docs',   'Review & Submit']

const inputCls = 'w-full px-3.5 py-2.5 rounded-xl border border-[#e5e7eb] text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#1B6CA8]/25 focus:border-[#1B6CA8] transition-all placeholder:text-gray-300'

function Field({ label, children, hint }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
    </div>
  )
}

function Stepper({ steps, current, isMerchant }) {
  const activeBg   = isMerchant ? 'bg-[#1B6CA8]' : 'bg-emerald-600'
  const activeLine = isMerchant ? 'bg-[#1B6CA8]' : 'bg-emerald-600'
  const activeRing = isMerchant ? 'ring-[#1B6CA8]/20' : 'ring-emerald-500/20'
  return (
    <div className="flex items-start px-6 pt-5 pb-4 border-b border-[#e5e7eb] bg-gray-50/60">
      {steps.map((label, i) => (
        <div key={i} className={`flex items-center ${i < steps.length - 1 ? 'flex-1' : ''}`}>
          <div className="flex flex-col items-center gap-1.5 shrink-0">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
              i < current  ? `${activeBg} text-white` :
              i === current ? `${activeBg} text-white ring-4 ${activeRing}` :
              'bg-gray-200 text-gray-400'
            }`}>
              {i < current ? (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (i + 1)}
            </div>
            <span className={`text-[10px] font-semibold text-center leading-tight w-16 ${i <= current ? 'text-gray-600' : 'text-gray-400'}`}>
              {label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-px mb-4 mx-2 ${i < current ? activeLine : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

function FileInput({ label, hint, accept, value, onChange, isMerchant }) {
  const filled  = isMerchant ? 'border-[#1B6CA8] bg-[#E8F4FD]' : 'border-emerald-500 bg-emerald-50'
  const iconCls = isMerchant ? 'text-[#1B6CA8]' : 'text-emerald-600'
  return (
    <Field label={label} hint={hint}>
      <label className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${value ? filled : 'border-gray-200 hover:border-gray-300 bg-gray-50'}`}>
        <input type="file" accept={accept} className="hidden" onChange={e => onChange(e.target.files?.[0] ?? null)} />
        <svg className={`w-5 h-5 shrink-0 ${value ? iconCls : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-medium truncate ${value ? 'text-gray-800' : 'text-gray-400'}`}>
            {value ? value.name : 'Click to upload'}
          </p>
          {!value && <p className="text-xs text-gray-400 mt-0.5">PDF, JPG or PNG · max 10 MB</p>}
        </div>
        {value && (
          <svg className={`w-4 h-4 shrink-0 ${iconCls}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </label>
    </Field>
  )
}

function ReviewRow({ label, value }) {
  if (!value) return null
  return (
    <div className="flex gap-3 text-sm">
      <span className="text-gray-400 w-32 shrink-0">{label}</span>
      <span className="text-gray-800 font-medium break-words">{value}</span>
    </div>
  )
}

export default function ApplyModal({ type, onClose }) {
  const { user, refreshProfile } = useAuth()
  const isMerchant = type === 'merchant'
  const steps      = isMerchant ? MERCHANT_STEPS : RIDER_STEPS
  const accentBg   = isMerchant ? 'bg-[#1B6CA8] hover:bg-[#155a8a]' : 'bg-emerald-600 hover:bg-emerald-700'

  const [step,       setStep]       = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [success,    setSuccess]    = useState(false)
  const [error,      setError]      = useState('')

  // Step 1 — Personal Info
  const [fullName, setFullName] = useState(user?.displayName || '')
  const [mobile,   setMobile]   = useState('')
  const [address,  setAddress]  = useState('')

  // Step 2 — Merchant
  const [shopName,    setShopName]    = useState('')
  const [shopAddress, setShopAddress] = useState('')
  const [services,    setServices]    = useState([])
  const [pricePerKg,  setPricePerKg]  = useState('')
  const [gcash,       setGcash]       = useState('')
  const [description, setDescription] = useState('')
  const [bizPermit,   setBizPermit]   = useState(null)

  // Step 2 — Rider
  const [vehicle,  setVehicle]  = useState('Motorcycle')
  const [plate,    setPlate]    = useState('')
  const [contact,  setContact]  = useState('')
  const [license,  setLicense]  = useState(null)
  const [validId,  setValidId]  = useState(null)

  function toggleService(svc) {
    setServices(prev => prev.includes(svc) ? prev.filter(s => s !== svc) : [...prev, svc])
  }

  function validate() {
    setError('')
    if (step === 0) {
      if (!fullName.trim()) { setError('Full name is required.');      return false }
      if (!mobile.trim())   { setError('Mobile number is required.');  return false }
      if (!address.trim())  { setError('Home address is required.');   return false }
    }
    if (step === 1) {
      if (isMerchant) {
        if (!shopName.trim())      { setError('Shop name is required.');              return false }
        if (!shopAddress.trim())   { setError('Shop address is required.');           return false }
        if (!services.length)      { setError('Select at least one service.');        return false }
      } else {
        if (!plate.trim())   { setError('Plate number is required.');   return false }
        if (!contact.trim()) { setError('Contact number is required.'); return false }
      }
    }
    return true
  }

  function next() {
    if (!validate()) return
    setStep(s => s + 1)
  }

  function back() {
    setError('')
    setStep(s => s - 1)
  }

  async function handleSubmit() {
    setError('')
    setSubmitting(true)
    try {
      const userRef = doc(db, 'users', user.uid)
      const appRef  = doc(db, 'applications', user.uid)

      if (isMerchant) {
        const shopRef  = doc(db, 'shops', user.uid)
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
          type:        'merchant',
          status:      'approved',
          fullName:    fullName.trim(),
          mobile:      mobile.trim(),
          address:     address.trim(),
          shopName:    shopName.trim(),
          shopAddress: shopAddress.trim(),
          gcash:       gcash.trim(),
          services,
          bizPermit:   bizPermit?.name ?? null,
          appliedAt:   serverTimestamp(),
          userId:      user.uid,
        })
        await updateDoc(userRef, { role: 'merchant', fullName: fullName.trim(), mobile: mobile.trim() })
      } else {
        await setDoc(appRef, {
          type:      'rider',
          status:    'approved',
          fullName:  fullName.trim(),
          mobile:    mobile.trim(),
          address:   address.trim(),
          vehicle,
          plate:     plate.trim(),
          contact:   contact.trim(),
          license:   license?.name ?? null,
          validId:   validId?.name ?? null,
          appliedAt: serverTimestamp(),
          userId:    user.uid,
        })
        await updateDoc(userRef, { role: 'rider', fullName: fullName.trim(), mobile: mobile.trim() })
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

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[440px] overflow-hidden">
          <div className="flex flex-col items-center text-center px-8 py-12">
            <div className="w-16 h-16 rounded-full bg-amber-50 border-2 border-amber-200 flex items-center justify-center mb-5">
              <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-heading font-bold text-xl text-gray-900 mb-2">Application Submitted!</h3>
            <p className="text-sm text-gray-500 leading-relaxed mb-2">
              Thank you for applying as a{' '}
              <span className="font-semibold text-gray-700">{isMerchant ? 'Merchant' : 'Rider'}</span> on LabadaGo.
            </p>
            <p className="text-sm text-gray-500 leading-relaxed mb-6">
              Our team is currently reviewing your application and documents.
            </p>
            <div className="w-full bg-amber-50 border border-amber-200 rounded-xl px-4 py-3.5 mb-8 text-left">
              <p className="text-xs font-bold text-amber-700 mb-1">Under review</p>
              <p className="text-xs text-amber-600 leading-relaxed">
                You will receive a response within <span className="font-semibold">3–5 business days</span>. We'll notify you via email once a decision has been made.
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-full border border-[#e5e7eb] text-gray-600 text-sm font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[520px] max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isMerchant ? 'bg-[#E8F4FD]' : 'bg-emerald-50'}`}>
              {isMerchant ? (
                <svg className="w-4 h-4 text-[#1B6CA8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  <polyline points="9,22 9,12 15,12 15,22" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </div>
            <h2 className="font-heading font-bold text-gray-900 text-base">
              {isMerchant ? 'Merchant Application' : 'Rider Application'}
            </h2>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Stepper */}
        <Stepper steps={steps} current={step} isMerchant={isMerchant} />

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">

          {/* ── Step 1: Personal Info ── */}
          {step === 0 && (
            <>
              <Field label="Full name *">
                <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="e.g. Juan Dela Cruz" className={inputCls} />
              </Field>
              <Field label="Email address">
                <input value={user?.email ?? ''} disabled className={`${inputCls} bg-gray-50 text-gray-400 cursor-not-allowed border-gray-100`} />
                <p className="text-[11px] text-gray-400 mt-1">Pre-filled from your account — cannot be changed here.</p>
              </Field>
              <Field label="Mobile number *">
                <input type="tel" value={mobile} onChange={e => setMobile(e.target.value)} placeholder="e.g. 09171234567" className={inputCls} />
              </Field>
              <Field label="Home address *">
                <input value={address} onChange={e => setAddress(e.target.value)} placeholder="e.g. 12 Rizal St, Brgy. Sta. Cruz, Manila" className={inputCls} />
              </Field>
            </>
          )}

          {/* ── Step 2: Merchant — Shop & Documents ── */}
          {step === 1 && isMerchant && (
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
                <Field label="Starting price (₱/kg)" hint="Defaults to ₱65">
                  <input type="number" value={pricePerKg} onChange={e => setPricePerKg(e.target.value)} placeholder="65" min={1} className={inputCls} />
                </Field>
                <Field label="GCash number">
                  <input value={gcash} onChange={e => setGcash(e.target.value)} placeholder="09XXXXXXXXX" className={inputCls} />
                </Field>
              </div>
              <Field label="Short description">
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="What makes your shop special?" className={`${inputCls} resize-none`} />
              </Field>
              <FileInput
                label="Business Permit / DTI Certificate"
                hint="Required for verification — PDF, JPG or PNG"
                accept=".pdf,.jpg,.jpeg,.png"
                value={bizPermit}
                onChange={setBizPermit}
                isMerchant={true}
              />
            </>
          )}

          {/* ── Step 2: Rider — Vehicle & Documents ── */}
          {step === 1 && !isMerchant && (
            <>
              <Field label="Vehicle type *">
                <div className="flex gap-2">
                  {VEHICLES.map(v => (
                    <button key={v} type="button" onClick={() => setVehicle(v)}
                      className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors ${vehicle === v ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-[#e5e7eb] text-gray-600 hover:border-emerald-300'}`}>
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
              <FileInput
                label="Driver's License"
                hint="Front side — required for verification"
                accept=".pdf,.jpg,.jpeg,.png"
                value={license}
                onChange={setLicense}
                isMerchant={false}
              />
              <FileInput
                label="Valid Government ID"
                hint="Any valid PH government ID"
                accept=".pdf,.jpg,.jpeg,.png"
                value={validId}
                onChange={setValidId}
                isMerchant={false}
              />
            </>
          )}

          {/* ── Step 3: Review & Submit ── */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-2xl p-5 space-y-2.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Personal Information</p>
                <ReviewRow label="Full Name"   value={fullName} />
                <ReviewRow label="Email"       value={user?.email} />
                <ReviewRow label="Mobile"      value={mobile} />
                <ReviewRow label="Address"     value={address} />
              </div>

              {isMerchant ? (
                <div className="bg-gray-50 rounded-2xl p-5 space-y-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Shop Details</p>
                  <ReviewRow label="Shop Name"    value={shopName} />
                  <ReviewRow label="Shop Address" value={shopAddress} />
                  <ReviewRow label="Services"     value={services.join(', ')} />
                  <ReviewRow label="Price"        value={pricePerKg ? `₱${pricePerKg}/kg` : '₱65/kg (default)'} />
                  <ReviewRow label="GCash"        value={gcash || '—'} />
                  <ReviewRow label="Description"  value={description || null} />
                  <ReviewRow label="Business Permit" value={bizPermit ? `${bizPermit.name} ✓` : 'Not uploaded'} />
                </div>
              ) : (
                <div className="bg-gray-50 rounded-2xl p-5 space-y-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Vehicle Details</p>
                  <ReviewRow label="Vehicle"         value={vehicle} />
                  <ReviewRow label="Plate No."       value={plate} />
                  <ReviewRow label="Contact"         value={contact} />
                  <ReviewRow label="Driver's License" value={license ? `${license.name} ✓` : 'Not uploaded'} />
                  <ReviewRow label="Valid ID"         value={validId  ? `${validId.name} ✓`  : 'Not uploaded'} />
                </div>
              )}

              <p className="text-[11px] text-gray-400 text-center leading-relaxed px-4">
                By submitting, you confirm that all information provided is accurate and truthful.
              </p>
            </div>
          )}

          {error && (
            <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#e5e7eb] flex gap-3 shrink-0">
          {step > 0 ? (
            <button onClick={back} className="flex-1 py-3 rounded-xl border border-[#e5e7eb] text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              ← Back
            </button>
          ) : (
            <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-[#e5e7eb] text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
          )}
          {step < 2 ? (
            <button onClick={next} className={`flex-1 ${accentBg} text-white text-sm font-bold py-3 rounded-xl transition-colors`}>
              Continue →
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting} className={`flex-1 ${accentBg} text-white text-sm font-bold py-3 rounded-xl transition-colors disabled:opacity-50`}>
              {submitting ? 'Submitting…' : 'Submit Application'}
            </button>
          )}
        </div>

      </div>
    </div>
  )
}
