import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'

// ─── Bubble background ─────────────────────────────────────────────────────

const BUBBLES = [
  { w: 240, top: '5%',  left: '6%'  },
  { w: 120, top: '12%', left: '77%' },
  { w: 300, top: '22%', left: '86%' },
  { w: 80,  top: '42%', left: '3%'  },
  { w: 180, top: '57%', left: '90%' },
  { w: 260, top: '70%', left: '12%' },
  { w: 100, top: '80%', left: '57%' },
  { w: 160, top: '88%', left: '37%' },
  { w: 200, top: '15%', left: '48%' },
  { w: 90,  top: '73%', left: '72%' },
]


// ─── Auth tab toggle ───────────────────────────────────────────────────────

function AuthToggle({ active }) {
  const navigate = useNavigate()
  return (
    <div className="relative flex bg-white border border-gray-200 rounded-full p-1 shadow-sm w-52 mt-4">
      <div
        className={[
          'absolute top-1 bottom-1 rounded-full bg-[#EBF4FF] shadow-sm transition-all duration-200',
          active === 'signin' ? 'left-1 right-1/2' : 'left-1/2 right-1',
        ].join(' ')}
      />
      <button
        onClick={() => navigate('/signin')}
        className={[
          'relative z-10 flex-1 py-1.5 text-sm font-semibold rounded-full transition-colors',
          active === 'signin' ? 'text-[#1B6CA8]' : 'text-gray-600',
        ].join(' ')}
      >
        Sign in
      </button>
      <button
        onClick={() => navigate('/signup')}
        className={[
          'relative z-10 flex-1 py-1.5 text-sm font-semibold rounded-full transition-colors',
          active === 'signup' ? 'text-[#1B6CA8]' : 'text-gray-600',
        ].join(' ')}
      >
        Sign up
      </button>
    </div>
  )
}

// ─── Shared helpers ────────────────────────────────────────────────────────


function FloatingInput({ id, label, type = 'text', value, onChange, autoComplete, showEmailIcon }) {
  const hasValue = !!value
  return (
    <div className="relative h-14">
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        placeholder=" "
        className={['peer w-full h-full rounded-full bg-[#0c3059] border border-white/20 text-white pt-5 pb-1.5 text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/30 transition-all', showEmailIcon ? 'pl-5 pr-11' : 'px-5'].join(' ')}
      />
      <label
        htmlFor={id}
        className={[
          'absolute left-5 transition-all duration-200 pointer-events-none',
          hasValue
            ? 'top-1.5 text-xs text-white'
            : 'top-[18px] text-sm text-white/50 peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-white',
        ].join(' ')}
      >
        {label}
      </label>
      {showEmailIcon && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg
            className={['w-[18px] h-[18px] transition-colors duration-200', value ? 'text-orange-400' : 'text-white/40'].join(' ')}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
        </div>
      )}
    </div>
  )
}

function PasswordInput({ id, label, value, onChange, autoComplete = 'new-password', error }) {
  const [show, setShow] = useState(false)
  const hasValue = !!value
  return (
    <div className="relative h-14">
      <input
        id={id}
        type={show && hasValue ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        placeholder=" "
        className={[
          'peer w-full h-full rounded-full bg-[#0c3059] border text-white pl-5 pr-11 pt-5 pb-1.5 text-sm focus:outline-none focus:ring-2 transition-all',
          error ? 'border-red-400 focus:border-red-400 focus:ring-red-400/30' : 'border-white/20 focus:border-orange-400 focus:ring-orange-400/30',
        ].join(' ')}
      />
      <label
        htmlFor={id}
        className="absolute left-5 top-1.5 text-xs text-white transition-all duration-200 pointer-events-none peer-placeholder-shown:top-[18px] peer-placeholder-shown:text-sm peer-placeholder-shown:text-white/50 peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-white"
      >
        {label}
      </label>
      <button
        type="button"
        tabIndex={-1}
        onClick={() => hasValue && setShow(v => !v)}
        className={['absolute right-4 top-1/2 -translate-y-1/2 transition-colors', hasValue ? 'text-orange-400 hover:text-orange-300' : 'text-white/40 cursor-default'].join(' ')}
      >
        {hasValue && !show ? (
          <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        ) : (
          <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
          </svg>
        )}
      </button>
    </div>
  )
}


// ─── Terms modal ───────────────────────────────────────────────────────────

function TermsModal({ onAgree, onDisagree }) {
  const [reachedBottom, setReachedBottom] = useState(false)

  function handleScroll(e) {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    if (scrollTop + clientHeight >= scrollHeight - 12) setReachedBottom(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#0c2d54] border border-white/20 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] flex flex-col max-h-[80vh]">

        {/* Header */}
        <div className="px-7 pt-6 pb-4 border-b border-white/10 shrink-0">
          <h2 className="text-white font-heading font-bold text-lg">Terms of Service &amp; Privacy Policy</h2>
          <p className="text-white/50 text-xs mt-0.5">Please read carefully before creating your account.</p>
        </div>

        {/* Scrollable body */}
        <div onScroll={handleScroll} className="overflow-y-auto px-7 py-5 space-y-5 text-white/70 text-sm leading-relaxed">

          <section>
            <h3 className="text-white font-semibold mb-1.5">1. Acceptance of Terms</h3>
            <p>By creating an account on LabadaGo, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to these terms, please do not register or use our services. We reserve the right to update these terms at any time, and continued use of the platform constitutes acceptance of any changes.</p>
          </section>

          <section>
            <h3 className="text-white font-semibold mb-1.5">2. Description of Service</h3>
            <p>LabadaGo is an on-demand laundry platform that connects customers with laundry service providers (merchants) and delivery personnel (riders). We facilitate the pickup, cleaning, and delivery of laundry items. LabadaGo acts as an intermediary and is not directly responsible for the quality of laundry services provided by third-party merchants.</p>
          </section>

          <section>
            <h3 className="text-white font-semibold mb-1.5">3. Account Registration</h3>
            <p>You must provide accurate, current, and complete information during registration. You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use of your account. LabadaGo will not be liable for any loss resulting from unauthorized use of your account.</p>
          </section>

          <section>
            <h3 className="text-white font-semibold mb-1.5">4. Orders and Payments</h3>
            <p>All orders placed through LabadaGo are subject to availability. Prices are set by individual merchants and may vary. Payment is due at the time of order confirmation. We accept various payment methods as displayed in the app. Refunds and disputes are handled on a case-by-case basis in accordance with our Refund Policy.</p>
          </section>

          <section>
            <h3 className="text-white font-semibold mb-1.5">5. Pickup and Delivery</h3>
            <p>Estimated pickup and delivery times are provided as a courtesy and are not guaranteed. LabadaGo is not liable for delays caused by traffic, weather, or other circumstances beyond our control. You are responsible for ensuring someone is available at the designated address during the scheduled pickup and delivery window.</p>
          </section>

          <section>
            <h3 className="text-white font-semibold mb-1.5">6. Items and Liability</h3>
            <p>LabadaGo and its merchants are not liable for damage to items caused by undisclosed defects, pre-existing conditions, or improper care label instructions provided by the manufacturer. High-value items such as luxury garments, heirlooms, or items with sentimental value are submitted at your own risk. We recommend not submitting irreplaceable items.</p>
          </section>

          <section>
            <h3 className="text-white font-semibold mb-1.5">7. Privacy Policy</h3>
            <p>We collect personal information including your name, email address, mobile number, and location data for the purpose of providing our services. Your data is stored securely and will never be sold to third parties. We may share necessary information with merchants and riders solely to fulfill your orders. By using LabadaGo, you consent to the collection and use of your information as described herein.</p>
          </section>

          <section>
            <h3 className="text-white font-semibold mb-1.5">8. Data Retention</h3>
            <p>We retain your personal data for as long as your account is active or as needed to provide services. You may request deletion of your account and associated data at any time by contacting our support team. Some data may be retained for legal or regulatory compliance purposes even after account deletion.</p>
          </section>

          <section>
            <h3 className="text-white font-semibold mb-1.5">9. Prohibited Conduct</h3>
            <p>You agree not to use LabadaGo for any unlawful purpose, to submit hazardous materials, illegal substances, or items prohibited by Philippine law. Harassment of merchants, riders, or support staff will result in immediate account termination. Fraudulent chargebacks or abuse of the refund system may result in legal action.</p>
          </section>

          <section>
            <h3 className="text-white font-semibold mb-1.5">10. Governing Law</h3>
            <p>These Terms of Service are governed by the laws of the Republic of the Philippines. Any disputes arising from the use of LabadaGo shall be subject to the exclusive jurisdiction of the courts located in the Philippines. By using our service, you consent to the personal jurisdiction of such courts.</p>
          </section>

        </div>

        {/* Footer actions */}
        <div className="px-7 py-5 border-t border-white/10 shrink-0 flex gap-3 items-center">
          <button
            type="button"
            onClick={onDisagree}
            className="flex-1 py-2.5 rounded-full border border-white/20 text-white/70 text-sm font-semibold hover:bg-white/10 transition-colors"
          >
            I Don't Agree
          </button>

          {reachedBottom ? (
            <button
              type="button"
              onClick={onAgree}
              className="flex-1 py-2.5 rounded-full bg-gradient-to-r from-[#F5A623] to-[#FF6B35] text-white text-sm font-semibold hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(245,166,35,0.4)] transition-all duration-200 animate-[fadeIn_0.3s_ease]"
            >
              I Agree
            </button>
          ) : (
            <div className="flex-1 py-2.5 rounded-full border border-white/10 text-white/30 text-sm font-semibold text-center select-none">
              ↓ Scroll to continue
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

// ─── PrivacyModal ──────────────────────────────────────────────────────────

function PrivacyModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#0c2d54] border border-white/20 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] flex flex-col max-h-[80vh]">

        <div className="px-7 pt-6 pb-4 border-b border-white/10 shrink-0">
          <h2 className="text-white font-heading font-bold text-lg">Privacy Policy</h2>
          <p className="text-white/50 text-xs mt-0.5">How LabadaGo collects, uses, and protects your data.</p>
        </div>

        <div className="overflow-y-auto px-7 py-5 space-y-5 text-white/70 text-sm leading-relaxed">
          <section>
            <h3 className="text-white font-semibold mb-1.5">1. Information We Collect</h3>
            <p>We collect personal information including your name, email address, mobile number, and location data for the purpose of providing our services. We may also collect order history, device identifiers, and usage data to improve the platform.</p>
          </section>
          <section>
            <h3 className="text-white font-semibold mb-1.5">2. How We Use Your Information</h3>
            <p>Your data is used to process and fulfill laundry orders, communicate with you about your account and orders, improve our services, and comply with legal obligations. We will never sell your personal information to third parties.</p>
          </section>
          <section>
            <h3 className="text-white font-semibold mb-1.5">3. Information Sharing</h3>
            <p>We may share necessary information with merchants and riders solely to fulfill your orders (e.g., your name and address for pickup). We do not share your data with advertisers or unrelated third parties.</p>
          </section>
          <section>
            <h3 className="text-white font-semibold mb-1.5">4. Data Security</h3>
            <p>Your data is stored securely using industry-standard encryption. We take reasonable measures to protect your information from unauthorized access, alteration, or disclosure.</p>
          </section>
          <section>
            <h3 className="text-white font-semibold mb-1.5">5. Data Retention</h3>
            <p>We retain your personal data for as long as your account is active or as needed to provide services. You may request deletion of your account and associated data at any time by contacting our support team. Some data may be retained for legal or regulatory compliance purposes even after account deletion.</p>
          </section>
          <section>
            <h3 className="text-white font-semibold mb-1.5">6. Your Rights</h3>
            <p>You have the right to access, correct, or delete your personal data. To exercise these rights, contact us through the Help Center. By using LabadaGo, you consent to the collection and use of your information as described herein.</p>
          </section>
          <section>
            <h3 className="text-white font-semibold mb-1.5">7. Governing Law</h3>
            <p>This Privacy Policy is governed by the laws of the Republic of the Philippines and complies with the Data Privacy Act of 2012 (Republic Act No. 10173).</p>
          </section>
        </div>

        <div className="px-7 py-5 border-t border-white/10 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-full bg-white/10 border border-white/20 text-white text-sm font-semibold hover:bg-white/20 transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────

const ROLE_REDIRECT = { customer: '/browse', merchant: '/merchant', rider: '/rider' }

export default function SignUp() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectTo = searchParams.get('redirect') ?? ''
  const safeRedirect = redirectTo.startsWith('/') ? redirectTo : ''
  const { user, role, profileLoading } = useAuth()

  const [fullName,        setFullName]        = useState('')
  const [email,           setEmail]           = useState('')
  const [mobile,          setMobile]          = useState('')
  const [password,        setPassword]        = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [termsAccepted,   setTermsAccepted]   = useState(false)
  const [showTermsModal,   setShowTermsModal]   = useState(false)
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)
  const [error,           setError]           = useState('')
  const [loading,         setLoading]         = useState(false)
  const [exiting,         setExiting]         = useState(false)
  const [fieldErrors,     setFieldErrors]     = useState({})

  function navigateTo(path) {
    setExiting(true)
    setTimeout(() => navigate(path), 280)
  }

  useEffect(() => {
    if (user && !profileLoading) {
      navigate(ROLE_REDIRECT[role] ?? '/browse', { replace: true })
    }
  }, [user, role, profileLoading, navigate])

  async function handleCreateAccount() {
    setError('')
    const errs = {}
    if (!fullName.trim())  errs.fullName = 'Full name is required.'
    if (!email)            errs.email    = 'Email address is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Enter a valid email address.'
    if (!mobile)           errs.mobile   = 'Mobile number is required.'
    else if (!/^\d{10}$/.test(mobile.replace(/\s/g, ''))) errs.mobile = 'Enter a valid 10-digit number.'
    if (!password)         errs.password = 'Password is required.'
    else if (password.length < 6) errs.password = 'Must be at least 6 characters.'
    if (!confirmPassword)  errs.confirmPassword = 'Please confirm your password.'
    else if (password !== confirmPassword) errs.confirmPassword = 'Passwords do not match.'
    if (!termsAccepted)    errs.terms    = 'You must accept the Terms of Service.'
    if (Object.keys(errs).length) { setFieldErrors(errs); return }
    setFieldErrors({})
    setLoading(true)
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(user, { displayName: fullName })
      await setDoc(doc(db, 'users', user.uid), {
        fullName,
        email,
        mobile,
        role: 'customer',
        createdAt: serverTimestamp(),
        isActive: true,
      })

      localStorage.setItem('labadago_show_welcome', fullName)
      navigate(safeRedirect || '/browse', { replace: true })
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setError('')
    setLoading(true)
    try {
      const { user } = await signInWithPopup(auth, new GoogleAuthProvider())
      const ref = doc(db, 'users', user.uid)
      const snap = await getDoc(ref)
      if (!snap.exists()) {
        await setDoc(ref, {
          fullName: user.displayName ?? '',
          email: user.email ?? '',
          mobile: '',
          role: 'customer',
          createdAt: serverTimestamp(),
          isActive: true,
        })
        localStorage.setItem('labadago_show_welcome', user.displayName ?? 'there')
      }
      navigate(safeRedirect || '/browse', { replace: true })
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen relative overflow-x-hidden"
      style={{ background: 'linear-gradient(135deg, #0A3358, #1B6CA8, #2980C4, #0A3358)', backgroundSize: '300% 300%', animation: 'gradient-shift 15s ease infinite' }}
    >
      {showTermsModal && (
        <TermsModal
          onAgree={() => { setTermsAccepted(true); setShowTermsModal(false) }}
          onDisagree={() => { setTermsAccepted(false); setShowTermsModal(false) }}
        />
      )}
      {showPrivacyModal && (
        <PrivacyModal onClose={() => setShowPrivacyModal(false)} />
      )}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {BUBBLES.map((b, i) => (
            <div
              key={i}
              className="absolute rounded-full border border-white pointer-events-none"
              style={{
                width: b.w,
                height: b.w,
                top: b.top,
                left: b.left,
                opacity: 0.12 + (i % 3) * 0.04,
                animation: `${i % 2 === 0 ? 'bubble-float' : 'bubble-drift'} ${5 + (i % 5) * 1.2}s ease-in-out ${-(i * 1.0).toFixed(1)}s infinite`,
                willChange: 'transform',
              }}
            />
          ))}
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-12">

        {/* Logo + tagline */}
        <div className="text-center">
          <div>
            <img src="/LabadaGoLogo.png" alt="LabadaGo" className="h-20 w-auto mx-auto" />
          </div>
          <p className="text-sm text-white/70 mt-1.5">Fresh laundry, delivered to your door.</p>
        </div>

        {/* Form card */}
        <motion.div
          className="w-full max-w-md flex flex-col items-center gap-3 mt-4"
          initial={{ scale: 0.05, opacity: 0, filter: 'blur(24px)' }}
          animate={exiting
            ? { scale: 0.05, opacity: 0, filter: 'blur(24px)' }
            : { scale: 1,    opacity: 1, filter: 'blur(0px)'  }
          }
          transition={exiting
            ? { duration: 0.25, ease: [0.4, 0, 1, 1] }
            : { type: 'spring', stiffness: 320, damping: 22 }
          }
        >
        <div className="w-full bg-[#0c2d54] border border-white/30 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.25)] p-8">

          <div className="mb-6">
            <h2 className="text-white font-heading font-bold text-xl">Create your account</h2>
            <p className="text-white/50 text-xs mt-0.5">Fill in your details to get started</p>
          </div>

          <div className="space-y-4">
            {/* Row 1: Full name | Mobile number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FloatingInput
                  id="fullname"
                  label="Full name *"
                  value={fullName}
                  error={fieldErrors.fullName}
                  onChange={e => { setFullName(e.target.value); setFieldErrors(f => ({ ...f, fullName: '' })) }}
                  autoComplete="name"
                />
                {fieldErrors.fullName && <p className="text-red-400 text-xs mt-1.5 pl-5">{fieldErrors.fullName}</p>}
              </div>

              {/* Mobile number — +63 prefix + floating label input */}
              <div>
                <div className={['flex h-14 bg-[#0c3059] border rounded-full overflow-hidden focus-within:ring-2 transition-all',
                  fieldErrors.mobile ? 'border-red-400 focus-within:border-red-400 focus-within:ring-red-400/30' : 'border-white/20 focus-within:border-orange-400 focus-within:ring-orange-400/30',
                ].join(' ')}>
                  <div className="px-4 flex items-center text-sm font-semibold text-orange-400 shrink-0 border-r border-white/20">
                    +63
                  </div>
                  <div className="relative flex-1 pl-3">
                    <input
                      id="mobile"
                      type="tel"
                      value={mobile}
                      onChange={e => { setMobile(e.target.value); setFieldErrors(f => ({ ...f, mobile: '' })) }}
                      autoComplete="tel-national"
                      placeholder=" "
                      className="peer w-full h-full bg-transparent pt-5 pb-1.5 text-sm text-white focus:outline-none"
                    />
                    <label
                      htmlFor="mobile"
                      className={['absolute left-0 transition-all duration-200 pointer-events-none',
                        mobile ? 'top-1.5 text-xs text-white' : 'top-[18px] text-sm text-white/50 peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-white',
                      ].join(' ')}
                    >
                      Mobile number *
                    </label>
                  </div>
                </div>
                {fieldErrors.mobile && <p className="text-red-400 text-xs mt-1.5 pl-5">{fieldErrors.mobile}</p>}
              </div>
            </div>

            {/* Email — full width */}
            <div>
              <FloatingInput
                id="email"
                label="Email address *"
                type="email"
                value={email}
                error={fieldErrors.email}
                onChange={e => { setEmail(e.target.value); setFieldErrors(f => ({ ...f, email: '' })) }}
                autoComplete="email"
                showEmailIcon
              />
              {fieldErrors.email && <p className="text-red-400 text-xs mt-1.5 pl-5">{fieldErrors.email}</p>}
            </div>

            {/* Row 2: Password | Confirm password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <PasswordInput
                  id="password"
                  label="Password *"
                  value={password}
                  error={fieldErrors.password}
                  onChange={e => { setPassword(e.target.value); setFieldErrors(f => ({ ...f, password: '' })) }}
                />
                {fieldErrors.password && <p className="text-red-400 text-xs mt-1.5 pl-5">{fieldErrors.password}</p>}
              </div>
              <div>
                <PasswordInput
                  id="confirm-password"
                  label="Confirm password *"
                  value={confirmPassword}
                  error={fieldErrors.confirmPassword}
                  onChange={e => { setConfirmPassword(e.target.value); setFieldErrors(f => ({ ...f, confirmPassword: '' })) }}
                />
                {fieldErrors.confirmPassword && <p className="text-red-400 text-xs mt-1.5 pl-5">{fieldErrors.confirmPassword}</p>}
              </div>
            </div>
          </div>

          {/* Terms */}
          <div className="mt-4 flex items-start gap-2.5">
            <input
              id="terms"
              type="checkbox"
              checked={termsAccepted}
              readOnly
              onClick={() => !termsAccepted && setShowTermsModal(true)}
              className="mt-0.5 accent-[#1B6CA8] shrink-0 cursor-pointer"
            />
            <label className="text-xs text-white/60 leading-relaxed">
              I agree to the{' '}
              <button
                type="button"
                onClick={() => setShowTermsModal(true)}
                className="text-orange-400 hover:underline"
              >
                Terms of Service
              </button>
              {' '}and{' '}
              <button
                type="button"
                onClick={() => setShowPrivacyModal(true)}
                className="text-orange-400 hover:underline"
              >
                Privacy Policy
              </button>
            </label>
          </div>

          {fieldErrors.terms && (
            <p className="text-red-400 text-xs mt-2 pl-1">{fieldErrors.terms}</p>
          )}

          {/* Server error pill */}
          {error && (
            <div className="mt-3 px-4 py-2 bg-red-500/20 border border-red-400/30 rounded-full text-xs text-red-300 text-center">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleCreateAccount}
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#F5A623] to-[#FF6B35] text-white font-heading font-bold py-3 rounded-full mt-5 tracking-wide text-sm hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(245,166,35,0.5)] active:translate-y-0 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="inline-block w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Creating account...
              </>
            ) : 'Create account'}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mt-4">
            <div className="flex-1 h-px bg-white/15" />
            <span className="text-white/40 text-xs font-medium">or</span>
            <div className="flex-1 h-px bg-white/15" />
          </div>

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-white/10 border border-white/20 rounded-full py-2.5 hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="text-sm font-medium text-white">Continue with Google</span>
          </button>
        </div>

        {/* Below card — sign in nudge only */}
        <div className="w-full text-center">
          <p className="text-xs text-white/60">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => navigateTo('/signin' + (safeRedirect ? '?redirect=' + encodeURIComponent(safeRedirect) : ''))}
              className="text-orange-400 font-medium hover:text-orange-300 hover:drop-shadow-[0_0_8px_rgba(245,166,35,0.6)] transition-all"
            >
              Sign in
            </button>
          </p>
        </div>
        </motion.div>
        </div>
    </div>
  )
}
