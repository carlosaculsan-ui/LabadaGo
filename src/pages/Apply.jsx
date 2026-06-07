import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'

async function uploadToCloudinary(file) {
  const form = new FormData()
  form.append('file', file)
  form.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET)
  const res  = await fetch(`https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/auto/upload`, { method: 'POST', body: form })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message ?? 'Upload failed')
  return data.secure_url
}
import { useAuth } from '../hooks/useAuth'
import MapPicker from '../components/MapPicker'

const SERVICES    = ['Wash & Fold', 'Dry Cleaning', 'Comforters', 'Towels & Linens']
const VEHICLES    = ['Motorcycle', 'Bicycle', 'Car']
const CARD_COLORS = ['bg-[#DBEAFE]', 'bg-[#D1FAE5]', 'bg-[#FEE2E2]', 'bg-[#EDE9FE]', 'bg-[#FEF3C7]', 'bg-[#CCFBF1]']
const AMENITY_OPTIONS = ['Free pickup', 'Free delivery', 'Folding included', 'Fabric conditioner', 'Ironing available', 'Same-day service', 'Stain treatment', 'Hang drying']
const DEFAULT_HOURS = [
  { day: 'Monday–Friday', open: true,  time: '7:00 AM – 6:00 PM' },
  { day: 'Saturday',       open: true,  time: '7:00 AM – 4:00 PM' },
  { day: 'Sunday',         open: false, time: '' },
]

const MERCHANT_STEPS = [
  { label: 'Personal Info',     desc: 'Your basic details'          },
  { label: 'Shop & Documents',  desc: 'Shop info and business docs'  },
  { label: 'Review & Submit',   desc: 'Confirm before sending'       },
]
const RIDER_STEPS = [
  { label: 'Personal Info',     desc: 'Your basic details'          },
  { label: 'Vehicle & Docs',    desc: 'Vehicle info and valid IDs'   },
  { label: 'Review & Submit',   desc: 'Confirm before sending'       },
]

const inputCls = 'w-full px-3.5 py-2.5 rounded-xl border border-[#e5e7eb] text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#1B6CA8]/25 focus:border-[#1B6CA8] transition-all placeholder:text-gray-500'

function Field({ label, children, hint }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-gray-600 mt-1">{hint}</p>}
    </div>
  )
}

function FileInput({ label, hint, accept, value, onChange, isMerchant }) {
  const [previewUrl, setPreviewUrl] = useState(null)

  useEffect(() => {
    if (!value) { setPreviewUrl(null); return }
    const url = URL.createObjectURL(value)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [value])

  const isImage = value?.type?.startsWith('image/')

  return (
    <Field label={label} hint={hint}>
      {value ? (
        <div className="rounded-xl overflow-hidden border-2 border-[#1B6CA8]">
          {isImage && previewUrl && (
            <a href={previewUrl} target="_blank" rel="noreferrer">
              <img src={previewUrl} alt="Preview" className="w-full h-36 object-cover hover:opacity-95 transition-opacity" />
            </a>
          )}
          <div className="flex items-center gap-3 px-4 py-2.5 bg-[#E8F4FD]">
            <svg className="w-4 h-4 shrink-0 text-[#1B6CA8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-xs font-medium truncate text-[#1B6CA8] flex-1">{value.name}</p>
            {!isImage && previewUrl && (
              <a href={previewUrl} target="_blank" rel="noreferrer"
                className="text-xs font-semibold text-[#1B6CA8] hover:underline shrink-0">
                View
              </a>
            )}
            <button type="button" onClick={() => onChange(null)} title="Remove file"
              className="shrink-0 text-[#1B6CA8]/50 hover:text-red-500 transition-colors ml-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        <label className="flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 border-dashed cursor-pointer transition-colors border-gray-200 hover:border-gray-300 bg-gray-50">
          <input type="file" accept={accept} className="hidden" onChange={e => onChange(e.target.files?.[0] ?? null)} />
          <svg className="w-5 h-5 shrink-0 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-700">Click to upload</p>
            <p className="text-xs text-gray-600 mt-0.5">PDF, JPG or PNG · max 10 MB</p>
          </div>
        </label>
      )}
    </Field>
  )
}

function ReviewRow({ label, value }) {
  if (!value) return null
  return (
    <div className="flex gap-4 text-sm py-1">
      <span className="text-gray-600 w-36 shrink-0">{label}</span>
      <span className="text-gray-800 font-medium break-words">{value}</span>
    </div>
  )
}

export default function Apply() {
  const { type }       = useParams()
  const navigate       = useNavigate()
  const { user, refreshProfile } = useAuth()
  const isMerchant     = type === 'merchant'
  const steps          = isMerchant ? MERCHANT_STEPS : RIDER_STEPS
  const accentBg       = 'bg-[#1B6CA8] hover:bg-[#155a8a]'
  const accentText     = 'text-[#1B6CA8]'
  const accentLight    = 'bg-[#E8F4FD]'

  const [step,       setStep]       = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [success,    setSuccess]    = useState(false)
  const [error,      setError]      = useState('')

  // Step 1 — Personal Info
  const [firstName,     setFirstName]     = useState('')
  const [middleInitial, setMiddleInitial] = useState('')
  const [lastName,      setLastName]      = useState('')
  const [age,           setAge]           = useState('')
  const [sex,           setSex]           = useState('')
  const [mobile,        setMobile]        = useState('')
  const [address,       setAddress]       = useState('')
  const [homeCoords,    setHomeCoords]    = useState(null)

  // Step 2 — Merchant
  const [shopName,       setShopName]       = useState('')
  const [shopAddress,    setShopAddress]    = useState('')
  const [shopCoords,     setShopCoords]     = useState(null)
  const [shopFrontPhoto, setShopFrontPhoto] = useState(null)
  const [photoPreview,   setPhotoPreview]   = useState(null)
  const [services,       setServices]       = useState([])
  const [pricePerKg,     setPricePerKg]     = useState('')
  const [gcash,          setGcash]          = useState('')
  const [about,          setAbout]          = useState('')
  const [shopPhone,      setShopPhone]      = useState('')
  const [shopEmail,      setShopEmail]      = useState('')
  const [hours,          setHours]          = useState(DEFAULT_HOURS)
  const [servicePricing, setServicePricing] = useState([{ name: '', price: '', desc: '' }])
  const [amenities,      setAmenities]      = useState([])
  const [bizPermit,      setBizPermit]      = useState(null)

  // Step 2 — Rider
  const [vehicle,      setVehicle]      = useState('Motorcycle')
  const [plate,        setPlate]        = useState('')
  const [vehicleModel, setVehicleModel] = useState('')
  const [license,      setLicense]      = useState(null)
  const [validId,      setValidId]      = useState(null)

  function toggleService(svc) {
    setServices(prev => prev.includes(svc) ? prev.filter(s => s !== svc) : [...prev, svc])
  }

  function validate() {
    setError('')
    if (step === 0) {
      if (!firstName.trim()) { setError('First name is required.');    return false }
      if (!lastName.trim())  { setError('Last name is required.');     return false }
      if (!age)              { setError('Age is required.');           return false }
      if (!sex)              { setError('Please select your sex.');    return false }
      if (!mobile.trim())    { setError('Mobile number is required.'); return false }
      if (!address.trim())   { setError('Home address is required.');  return false }
    }
    if (step === 1) {
      if (isMerchant) {
        if (!shopName.trim())    { setError('Shop name is required.');              return false }
        if (!shopAddress.trim()) { setError('Shop address is required.');           return false }
        if (!shopFrontPhoto)     { setError('Please upload a shop front photo.');   return false }
        if (!services.length)    { setError('Select at least one service.');        return false }
      } else {
        if (vehicle !== 'Bicycle' && !plate.trim()) { setError('Plate number is required.'); return false }
      }
    }
    return true
  }

  function next()  { if (validate()) setStep(s => s + 1) }
  function back()  { setError(''); setStep(s => s - 1) }

  async function handleSubmit() {
    setError('')
    setSubmitting(true)
    // TODO: re-enable validation before production
    try {
      const userRef = doc(db, 'users', user.uid)
      const appRef  = doc(db, 'applications', user.uid)

      if (isMerchant) {
        if (!shopFrontPhoto) throw new Error('Please upload a shop front photo.')
        const shopRef  = doc(db, 'shops', user.uid)
        const colorIdx = Math.floor(Math.random() * CARD_COLORS.length)

        const shopImageUrl  = await uploadToCloudinary(shopFrontPhoto)
        const bizPermitUrl  = bizPermit ? await uploadToCloudinary(bizPermit) : null

        const builtHours = hours.map(h => ({ day: h.day, time: h.open ? h.time.trim() || 'Closed' : 'Closed' }))
        const builtPricing = servicePricing.filter(s => s.name.trim()).map(s => ({ name: s.name.trim(), price: s.price.trim(), desc: s.desc.trim() }))

        await setDoc(shopRef, {
          name:           shopName.trim(),
          address:        shopAddress.trim(),
          coords:         shopCoords ?? null,
          image:          shopImageUrl,
          gcash:          gcash.trim(),
          pricePerKg:     pricePerKg ? parseInt(pricePerKg, 10) : 65,
          about:          about.trim(),
          phone:          shopPhone.trim(),
          email:          shopEmail.trim(),
          hours:          builtHours,
          servicePricing: builtPricing,
          amenities,
          services,
          detergents:     ['Any'],
          rating:         5.0,
          reviewCount:    0,
          distanceKm:     +(Math.random() * 4 + 0.5).toFixed(1),
          isOpen:         true,
          isSameDay:      false,
          isFeatured:     false,
          color:          CARD_COLORS[colorIdx],
          ownerId:        user.uid,
          createdAt:      serverTimestamp(),
        })
        const fullName = [firstName, middleInitial, lastName].filter(Boolean).join(' ').trim()
        await setDoc(appRef, {
          type: 'merchant', status: 'approved',
          firstName: firstName.trim(), middleInitial: middleInitial.trim(), lastName: lastName.trim(),
          fullName, age: parseInt(age, 10), sex,
          mobile: mobile.trim(), address: address.trim(),
          shopName: shopName.trim(), shopAddress: shopAddress.trim(),
          gcash: gcash.trim(), services, bizPermit: bizPermitUrl,
          appliedAt: serverTimestamp(), userId: user.uid,
        })
        await updateDoc(userRef, { role: 'merchant', shopId: user.uid, fullName, mobile: mobile.trim() })
      } else {
        const licenseUrl = license ? await uploadToCloudinary(license) : null
        const validIdUrl = validId ? await uploadToCloudinary(validId) : null
        const fullName = [firstName, middleInitial, lastName].filter(Boolean).join(' ').trim()
        await setDoc(appRef, {
          type: 'rider', status: 'approved',
          firstName: firstName.trim(), middleInitial: middleInitial.trim(), lastName: lastName.trim(),
          fullName, age: parseInt(age, 10), sex,
          mobile: mobile.trim(), address: address.trim(),
          vehicle, plate: plate.trim(), vehicleModel: vehicleModel.trim(),
          license: licenseUrl, validId: validIdUrl,
          appliedAt: serverTimestamp(), userId: user.uid,
        })
        await updateDoc(userRef, {
          role: 'rider', fullName, mobile: mobile.trim(),
          phone: mobile.trim(), vehicleType: vehicle, plateNumber: plate.trim(),
          vehicleModel: vehicleModel.trim(),
          ...(licenseUrl ? { licenseURL: licenseUrl } : {}),
          ...(validIdUrl ? { govIdURL:   validIdUrl } : {}),
        })
      }

      await refreshProfile()
      setSuccess(true)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  // ── Main application page ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F4F7FA] flex">

      {/* Left sidebar — step tracker */}
      <aside className="hidden md:flex w-72 shrink-0 bg-[#0A3358] min-h-screen px-8 py-12 flex-col">
        <div className="mb-10">
          <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${isMerchant ? 'text-[#F5A623]' : 'text-white/70'}`}>
            {isMerchant ? 'Merchant Application' : 'Rider Application'}
          </p>
          <h1 className="font-heading font-bold text-white text-xl leading-snug">
            Join LabadaGo
          </h1>
        </div>

        <div className="flex flex-col gap-0 flex-1">
          {steps.map((s, i) => {
            const done    = i < step
            const current = i === step
            return (
              <div key={i} className="flex gap-4">
                {/* Line + circle column */}
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-sm border-2 transition-all ${
                    done    ? 'bg-[#1B6CA8] border-[#1B6CA8] text-white' :
                    current ? 'bg-white border-white text-[#0A3358]' :
                    'bg-transparent border-white/20 text-white/30'
                  }`}>
                    {done ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (i + 1)}
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`w-px flex-1 my-1 ${done ? 'bg-[#1B6CA8]' : 'bg-white/10'}`} style={{ minHeight: 80 }} />
                  )}
                </div>

                {/* Labels */}
                <div className="pb-16">
                  <p className={`text-sm font-semibold leading-none mb-1 ${current ? 'text-white' : done ? 'text-white/70' : 'text-white/30'}`}>
                    {s.label}
                  </p>
                  <p className={`text-xs leading-relaxed ${current ? 'text-white/80' : 'text-white/40'}`}>
                    {s.desc}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        <button
          onClick={() => navigate('/partner')}
          className="text-xs text-white/30 hover:text-white/60 transition-colors text-left mt-auto"
        >
          ← Back to Partner page
        </button>
      </aside>

      {/* Right — form content */}
      <main className="flex-1 px-4 md:px-12 py-6 md:py-12 overflow-y-auto">
        <div className="max-w-[560px]">

          <h2 className="font-heading font-bold text-2xl text-gray-900 mb-1">
            {steps[step].label}
          </h2>
          <p className="text-sm text-gray-700 mb-8">{steps[step].desc}</p>

          <div className="space-y-5">

            {/* ── Step 1: Personal Info ── */}
            {step === 0 && (
              <>
                {isMerchant ? (
                  <div className="bg-[#E8F4FD] border border-[#1B6CA8]/20 rounded-xl px-4 py-3.5">
                    <p className="text-xs font-bold text-[#1B6CA8] mb-1.5">Before you start</p>
                    <p className="text-xs text-[#1B6CA8]/80 mb-1.5">Have these ready before filling out the form:</p>
                    <ul className="space-y-1 text-xs text-[#1B6CA8]/80">
                      <li className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-[#1B6CA8] shrink-0" />Business Permit or DTI Certificate — PDF, JPG or PNG</li>
                      <li className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-[#1B6CA8] shrink-0" />Shop front photo — clear exterior shot</li>
                      <li className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-[#1B6CA8] shrink-0" />GCash number — for receiving customer payments</li>
                    </ul>
                  </div>
                ) : (
                  <div className="bg-[#E8F4FD] border border-[#1B6CA8]/20 rounded-xl px-4 py-3.5">
                    <p className="text-xs font-bold text-[#1B6CA8] mb-1.5">Before you start</p>
                    <p className="text-xs text-[#1B6CA8]/80 mb-1.5">Have these ready before filling out the form:</p>
                    <ul className="space-y-1 text-xs text-[#1B6CA8]/80">
                      <li className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-[#1B6CA8] shrink-0" />Driver's License — front side, clear photo</li>
                      <li className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-[#1B6CA8] shrink-0" />Valid Government ID — any PH government ID</li>
                      <li className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-[#1B6CA8] shrink-0" />Vehicle plate number — motorcycle or car only</li>
                    </ul>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Field label="First name *">
                    <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Enter first name" className={inputCls} />
                  </Field>
                  <Field label="Middle initial">
                    <input value={middleInitial} onChange={e => setMiddleInitial(e.target.value)} placeholder="Enter initial" maxLength={4} className={inputCls} />
                  </Field>
                  <Field label="Last name *">
                    <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Enter last name" className={inputCls} />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Age *">
                    <input type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="e.g. 25" min={18} max={80} className={inputCls} />
                  </Field>
                  <Field label="Sex *">
                    <div className="flex gap-2">
                      {['Male', 'Female'].map(opt => (
                        <button key={opt} type="button" onClick={() => setSex(opt)}
                          className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors ${sex === opt ? 'border-[#1B6CA8] bg-[#E8F4FD] text-[#1B6CA8]' : 'border-[#e5e7eb] text-gray-600 hover:border-gray-300'}`}>
                          {opt}
                        </button>
                      ))}
                    </div>
                  </Field>
                </div>
                <Field label="Email address">
                  <input value={user?.email ?? ''} disabled className={`${inputCls} bg-gray-50 text-gray-600 cursor-not-allowed border-gray-100`} />
                  <p className="text-[11px] text-gray-600 mt-1">Pre-filled from your account — cannot be changed here.</p>
                </Field>
                <Field label="Mobile number *">
                  <input type="tel" value={mobile} onChange={e => setMobile(e.target.value)} placeholder="e.g. 09171234567" className={inputCls} />
                </Field>
                <MapPicker
                  label="Home address *"
                  address={address}
                  onAddressChange={setAddress}
                  onCoordsChange={setHomeCoords}
                />
              </>
            )}

            {/* ── Step 2: Merchant — Shop & Documents ── */}
            {step === 1 && isMerchant && (
              <>
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
                  <svg className="w-3.5 h-3.5 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs text-amber-700">This step covers shop info, hours, services, and documents — takes about 5 minutes.</p>
                </div>
                <Field label="Shop name *">
                  <input value={shopName} onChange={e => setShopName(e.target.value)} placeholder="e.g. Sunshine Laundry" className={inputCls} />
                </Field>
                <MapPicker
                  label="Shop address *"
                  address={shopAddress}
                  onAddressChange={setShopAddress}
                  onCoordsChange={setShopCoords}
                />
                <Field label="Shop front photo *" hint="This will be your shop's cover photo on LabadaGo">
                  <label className="block cursor-pointer">
                    <input
                      type="file" accept="image/*" className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0] ?? null
                        setShopFrontPhoto(file)
                        if (file) {
                          const reader = new FileReader()
                          reader.onload = ev => setPhotoPreview(ev.target.result)
                          reader.readAsDataURL(file)
                        } else {
                          setPhotoPreview(null)
                        }
                      }}
                    />
                    {photoPreview ? (
                      <div className="rounded-xl overflow-hidden border border-[#1B6CA8] group relative">
                        <img src={photoPreview} alt="Shop front" className="w-full h-48 object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-white text-sm font-semibold">Click to change photo</span>
                        </div>
                        <div className="px-3 py-2 bg-[#E8F4FD] flex items-center gap-2">
                          <svg className="w-3.5 h-3.5 text-[#1B6CA8] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          <p className="text-xs text-[#1B6CA8] font-medium truncate">{shopFrontPhoto.name}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 border-dashed border-gray-200 hover:border-gray-300 bg-gray-50 transition-colors">
                        <svg className="w-5 h-5 text-gray-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <div>
                          <p className="text-sm text-gray-700 font-medium">Upload shop front photo</p>
                          <p className="text-xs text-gray-600 mt-0.5">JPG or PNG · recommended 800×600px</p>
                        </div>
                      </div>
                    )}
                  </label>
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
                <Field label="About your shop" hint="Shown on your shop profile — what makes your shop special?">
                  <textarea value={about} onChange={e => setAbout(e.target.value)} rows={3} placeholder="e.g. Family-owned laundry shop with over 10 years of experience…" className={`${inputCls} resize-none`} />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Shop phone number">
                    <input type="tel" value={shopPhone} onChange={e => setShopPhone(e.target.value)} placeholder="e.g. 09171234567" className={inputCls} />
                  </Field>
                  <Field label="Shop email">
                    <input type="email" value={shopEmail} onChange={e => setShopEmail(e.target.value)} placeholder="shop@email.com" className={inputCls} />
                  </Field>
                </div>

                {/* Operating Hours */}
                <Field label="Operating hours">
                  <div className="space-y-2 mt-1">
                    {hours.map((h, i) => (
                      <div key={h.day} className="flex items-center gap-3 p-3 rounded-xl border border-[#e5e7eb] bg-white">
                        <button
                          type="button"
                          onClick={() => setHours(prev => prev.map((x, j) => j === i ? { ...x, open: !x.open } : x))}
                          className={`w-10 h-5 rounded-full transition-colors shrink-0 ${h.open ? 'bg-[#1B6CA8]' : 'bg-gray-200'}`}
                        >
                          <span className={`block w-4 h-4 rounded-full bg-white shadow transition-transform mx-0.5 ${h.open ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                        <span className="text-sm text-gray-700 w-28 shrink-0">{h.day}</span>
                        {h.open ? (
                          <input
                            value={h.time}
                            onChange={e => setHours(prev => prev.map((x, j) => j === i ? { ...x, time: e.target.value } : x))}
                            placeholder="e.g. 7:00 AM – 6:00 PM"
                            className="flex-1 px-2.5 py-1.5 rounded-lg border border-[#e5e7eb] text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#1B6CA8]/30 focus:border-[#1B6CA8]"
                          />
                        ) : (
                          <span className="text-sm text-red-500 font-medium">Closed</span>
                        )}
                      </div>
                    ))}
                  </div>
                </Field>

                {/* Services & Pricing */}
                <Field label="Services & Pricing" hint="Add individual service prices shown on your profile">
                  <div className="space-y-2 mt-1">
                    {servicePricing.map((svc, i) => (
                      <div key={i} className="flex gap-2 items-start">
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <input
                            value={svc.name}
                            onChange={e => setServicePricing(prev => prev.map((x, j) => j === i ? { ...x, name: e.target.value } : x))}
                            placeholder="Service name"
                            className={inputCls}
                          />
                          <input
                            value={svc.price}
                            onChange={e => setServicePricing(prev => prev.map((x, j) => j === i ? { ...x, price: e.target.value } : x))}
                            placeholder="₱65/kg"
                            className={inputCls}
                          />
                          <input
                            value={svc.desc}
                            onChange={e => setServicePricing(prev => prev.map((x, j) => j === i ? { ...x, desc: e.target.value } : x))}
                            placeholder="Short note (optional)"
                            className={inputCls}
                          />
                        </div>
                        {servicePricing.length > 1 && (
                          <button type="button" onClick={() => setServicePricing(prev => prev.filter((_, j) => j !== i))}
                            className="mt-2 text-gray-400 hover:text-red-500 transition-colors shrink-0">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                    <button type="button"
                      onClick={() => setServicePricing(prev => [...prev, { name: '', price: '', desc: '' }])}
                      className="text-xs font-semibold text-[#1B6CA8] hover:underline mt-1">
                      + Add another service
                    </button>
                  </div>
                </Field>

                {/* Amenities */}
                <Field label="What's included" hint="Select amenities available at your shop">
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {AMENITY_OPTIONS.map(opt => (
                      <label key={opt} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border cursor-pointer transition-colors text-sm ${amenities.includes(opt) ? 'border-[#1B6CA8] bg-[#E8F4FD] text-[#1B6CA8] font-medium' : 'border-[#e5e7eb] text-gray-600 hover:border-[#1B6CA8]/40'}`}>
                        <input type="checkbox" className="hidden" checked={amenities.includes(opt)} onChange={() => setAmenities(prev => prev.includes(opt) ? prev.filter(a => a !== opt) : [...prev, opt])} />
                        <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${amenities.includes(opt) ? 'bg-[#1B6CA8] border-[#1B6CA8]' : 'border-gray-300'}`}>
                          {amenities.includes(opt) && (
                            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </span>
                        {opt}
                      </label>
                    ))}
                  </div>
                </Field>

                <FileInput
                  label="Business Permit / DTI Certificate"
                  hint="Required for verification — PDF, JPG or PNG"
                  accept=".pdf,.jpg,.jpeg,.png"
                  value={bizPermit} onChange={setBizPermit} isMerchant={true}
                />
              </>
            )}

            {/* ── Step 2: Rider — Vehicle & Docs ── */}
            {step === 1 && !isMerchant && (
              <>
                <Field label="Vehicle type *">
                  <div className="flex gap-2">
                    {VEHICLES.map(v => (
                      <button key={v} type="button" onClick={() => setVehicle(v)}
                        className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors ${vehicle === v ? 'border-[#1B6CA8] bg-[#E8F4FD] text-[#1B6CA8]' : 'border-[#e5e7eb] text-gray-600 hover:border-[#1B6CA8]/40'}`}>
                        {v}
                      </button>
                    ))}
                  </div>
                </Field>
                {vehicle !== 'Bicycle' && (
                  <Field label="Plate number *">
                    <input value={plate} onChange={e => setPlate(e.target.value)} placeholder="e.g. ABC 1234" className={inputCls} />
                  </Field>
                )}
                <Field label="Model & color">
                  <input value={vehicleModel} onChange={e => setVehicleModel(e.target.value)} placeholder="e.g. Honda Click · Red" className={inputCls} />
                </Field>
                <FileInput
                  label="Driver's License *"
                  hint="Front side — required for verification"
                  accept=".pdf,.jpg,.jpeg,.png"
                  value={license} onChange={setLicense} isMerchant={false}
                />
                <FileInput
                  label="Valid Government ID *"
                  hint="Any valid PH government ID"
                  accept=".pdf,.jpg,.jpeg,.png"
                  value={validId} onChange={setValidId} isMerchant={false}
                />
              </>
            )}

            {/* ── Step 3: Review & Submit ── */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="bg-white border border-[#e5e7eb] rounded-2xl p-6 space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-4">Personal Information</p>
                  <ReviewRow label="First Name"      value={firstName} />
                  <ReviewRow label="Middle Initial"  value={middleInitial || '—'} />
                  <ReviewRow label="Last Name"       value={lastName} />
                  <ReviewRow label="Age"             value={age} />
                  <ReviewRow label="Sex"             value={sex} />
                  <ReviewRow label="Email"           value={user?.email} />
                  <ReviewRow label="Mobile"          value={mobile} />
                  <ReviewRow label="Address"         value={address} />
                </div>

                {isMerchant ? (
                  <div className="bg-white border border-[#e5e7eb] rounded-2xl p-6 space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-4">Shop Details</p>
                    {photoPreview && (
                      <img src={photoPreview} alt="Shop front" className="w-full h-36 object-cover rounded-xl mb-2" />
                    )}
                    <ReviewRow label="Shop Name"       value={shopName} />
                    <ReviewRow label="Shop Address"    value={shopAddress} />
                    <ReviewRow label="Front Photo"     value={shopFrontPhoto ? `${shopFrontPhoto.name} ✓` : 'Not uploaded'} />
                    <ReviewRow label="Services"        value={services.join(', ')} />
                    <ReviewRow label="Price"           value={pricePerKg ? `₱${pricePerKg}/kg` : '₱65/kg (default)'} />
                    <ReviewRow label="GCash"           value={gcash || '—'} />
                    <ReviewRow label="Phone"           value={shopPhone || '—'} />
                    <ReviewRow label="Email"           value={shopEmail || '—'} />
                    <ReviewRow label="About"           value={about || null} />
                    <ReviewRow label="Hours"           value={hours.map(h => `${h.day}: ${h.open ? h.time || '—' : 'Closed'}`).join(' | ')} />
                    <ReviewRow label="Pricing items"   value={servicePricing.filter(s => s.name.trim()).length > 0 ? servicePricing.filter(s => s.name.trim()).map(s => `${s.name} ${s.price}`).join(', ') : '—'} />
                    <ReviewRow label="Amenities"       value={amenities.length > 0 ? amenities.join(', ') : '—'} />
                    <ReviewRow label="Business Permit" value={bizPermit ? `${bizPermit.name} ✓` : 'Not uploaded'} />
                  </div>
                ) : (
                  <div className="bg-white border border-[#e5e7eb] rounded-2xl p-6 space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-4">Vehicle Details</p>
                    <ReviewRow label="Vehicle"          value={vehicle} />
                    <ReviewRow label="Plate No."        value={plate || '—'} />
                    <ReviewRow label="Model & Color"    value={vehicleModel || '—'} />
                    <ReviewRow label="Driver's License" value={license ? `${license.name} ✓` : 'Not uploaded'} />
                    <ReviewRow label="Valid ID"         value={validId  ? `${validId.name} ✓`  : 'Not uploaded'} />
                  </div>
                )}

                <p className="text-xs text-gray-600 leading-relaxed">
                  By submitting, you confirm that all information provided is accurate and truthful.
                </p>
              </div>
            )}

            {error && (
              <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>
            )}
          </div>

          {/* Navigation buttons */}
          <div className="flex gap-3 mt-10">
            {step > 0 ? (
              <button onClick={back} className="flex-1 py-3.5 rounded-xl border border-[#e5e7eb] text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                ← Back
              </button>
            ) : (
              <button onClick={() => navigate('/partner')} className="flex-1 py-3.5 rounded-xl border border-[#e5e7eb] text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
            )}
            {step < 2 ? (
              <button onClick={next} className={`flex-1 ${accentBg} text-white text-sm font-bold py-3.5 rounded-xl transition-colors`}>
                Continue →
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={submitting} className={`flex-1 ${accentBg} text-white text-sm font-bold py-3.5 rounded-xl transition-colors disabled:opacity-50`}>
                {submitting ? 'Uploading & submitting…' : 'Submit Application'}
              </button>
            )}
          </div>

        </div>
      </main>

      {/* ── Success modal ───────────────────────────────────────────────── */}
      {success && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-white/30 backdrop-blur-md" />
          <div className="relative bg-white rounded-3xl shadow-xl border border-[#e5e7eb] w-full max-w-[440px] px-10 py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-50 border-2 border-amber-200 flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="font-heading font-bold text-2xl text-gray-900 mb-2">Application Submitted!</h2>
            <p className="text-sm text-gray-700 leading-relaxed mb-6">
              Thank you for applying as a <span className="font-semibold text-gray-700">{isMerchant ? 'Merchant' : 'Rider'}</span> on LabadaGo. Our team is reviewing your application and documents.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 mb-8 text-left">
              <p className="text-xs font-bold text-amber-700 mb-1">Under review</p>
              <p className="text-xs text-amber-600 leading-relaxed">
                You will receive a response within <span className="font-semibold">3–5 business days</span>. We'll notify you via email once a decision has been made.
              </p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="w-full border border-[#e5e7eb] text-gray-600 text-sm font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
