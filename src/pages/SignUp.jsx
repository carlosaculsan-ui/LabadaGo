import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth'
import { doc, setDoc, getDoc, addDoc, updateDoc, collection, serverTimestamp } from 'firebase/firestore'
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

function Bubbles() {
  return (
    <>
      {BUBBLES.map((b, i) => (
        <div
          key={i}
          className="absolute rounded-full border border-[#1B6CA8] opacity-[0.06] pointer-events-none"
          style={{ width: b.w, height: b.w, top: b.top, left: b.left }}
        />
      ))}
    </>
  )
}

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

function ImgPlaceholder({ label, className }) {
  return (
    <div className={['border border-dashed flex items-center justify-center shrink-0', className].join(' ')}>
      {label && (
        <span className="text-[7px] font-medium text-gray-600 text-center leading-snug px-1">
          {label}
        </span>
      )}
    </div>
  )
}

function FloatingInput({ id, label, type = 'text', value, onChange, autoComplete, showEmailIcon }) {
  return (
    <div className="relative h-14">
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        placeholder=" "
        className={['peer w-full border-b border-gray-300 bg-transparent pt-5 pb-1.5 text-sm text-gray-900 focus:outline-none focus:border-[#1B6CA8] transition-colors', showEmailIcon ? 'pr-8' : ''].join(' ')}
      />
      <label
        htmlFor={id}
        className="absolute left-0 top-1 text-xs text-[#1B6CA8] transition-all duration-200 pointer-events-none peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-600 peer-focus:top-1 peer-focus:text-xs peer-focus:text-[#1B6CA8]"
      >
        {label}
      </label>
      {showEmailIcon && (
        <div className="absolute right-0 bottom-2 pointer-events-none">
          <svg
            className={['w-[18px] h-[18px] transition-colors duration-200', value ? 'text-[#1B6CA8]' : 'text-gray-400'].join(' ')}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
        </div>
      )}
    </div>
  )
}

function PasswordInput({ id, label, value, onChange, autoComplete = 'new-password' }) {
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
        className="peer w-full border-b border-gray-300 bg-transparent pt-5 pb-1.5 pr-8 text-sm text-gray-900 focus:outline-none focus:border-[#1B6CA8] transition-colors"
      />
      <label
        htmlFor={id}
        className="absolute left-0 top-1 text-xs text-[#1B6CA8] transition-all duration-200 pointer-events-none peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-600 peer-focus:top-1 peer-focus:text-xs peer-focus:text-[#1B6CA8]"
      >
        {label}
      </label>
      <button
        type="button"
        tabIndex={-1}
        onClick={() => hasValue && setShow(v => !v)}
        className={['absolute right-0 bottom-2 transition-colors', hasValue ? 'text-[#1B6CA8] hover:text-[#0D3F6B]' : 'text-gray-400 cursor-default'].join(' ')}
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

// ─── Page ──────────────────────────────────────────────────────────────────

const ROLES = ['Customer', 'Merchant', 'Rider']

const ROLE_REDIRECT = { customer: '/browse', merchant: '/merchant', rider: '/rider' }

export default function SignUp() {
  const navigate = useNavigate()
  const { user, role, profileLoading } = useAuth()

  const [fullName,        setFullName]        = useState('')
  const [email,           setEmail]           = useState('')
  const [mobile,          setMobile]          = useState('')
  const [password,        setPassword]        = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [selectedRole,    setSelectedRole]    = useState('Customer')
  const [termsAccepted,   setTermsAccepted]   = useState(false)
  const [error,           setError]           = useState('')
  const [loading,         setLoading]         = useState(false)

  useEffect(() => {
    if (user && !profileLoading) {
      navigate(ROLE_REDIRECT[role] ?? '/browse', { replace: true })
    }
  }, [user, role, profileLoading, navigate])

  async function handleCreateAccount() {
    setError('')

    if (!fullName || !email || !mobile || !password || !confirmPassword) {
      setError('Please fill in all fields.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (!termsAccepted) {
      setError('You must accept the Terms of Service and Privacy Policy.')
      return
    }

    setLoading(true)
    try {
      const role = selectedRole.toLowerCase()
      const { user } = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(user, { displayName: fullName })
      await setDoc(doc(db, 'users', user.uid), {
        fullName,
        email,
        mobile,
        role,
        createdAt: serverTimestamp(),
        isActive: true,
      })

      if (role === 'merchant') {
        const shopRef = await addDoc(collection(db, 'shops'), {
          name: `${fullName}'s Laundry Shop`,
          address: '',
          rating: 0,
          pricePerKg: 50,
          services: [],
          detergents: [],
          isOpen: false,
          isSameDay: false,
          isFeatured: false,
          ownerId: user.uid,
          geoPoint: null,
          photoURL: null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
        await updateDoc(doc(db, 'users', user.uid), { shopId: shopRef.id })
      }

      navigate(ROLE_REDIRECT[role] ?? '/browse', { replace: true })
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
      }
      navigate('/browse', { replace: true })
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#EEF5FB]">

      {/* Fixed bubble background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <Bubbles />
      </div>

      {/* Scrollable content layer */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-12">

        {/* Logo + tagline */}
        <div className="text-center">
          <div>
            <img src="/LabadaGoLogo.png" alt="LabadaGo" className="h-20 w-auto mx-auto" />
          </div>
          <p className="text-sm text-gray-600 mt-1.5">Fresh laundry, delivered to your door.</p>
        </div>

        {/* Tab toggle */}
        <AuthToggle active="signup" />

        {/* Form card */}
        <div className="w-full max-w-md bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] p-8 mt-6">

          <div className="space-y-4">
            {/* Row 1: Full name | Mobile number */}
            <div className="grid grid-cols-2 gap-4">
              <FloatingInput
                id="fullname"
                label="Full name"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                autoComplete="name"
              />

              {/* Mobile number — +63 prefix + floating label input */}
              <div className="flex h-14 border-b border-gray-300 focus-within:border-[#1B6CA8] transition-colors">
                <div className="bg-[#F0F7FF] px-3 flex items-end pb-1.5 text-sm font-semibold text-[#1B6CA8] shrink-0 rounded-tl-md">
                  +63
                </div>
                <div className="relative flex-1 pl-2">
                  <input
                    id="mobile"
                    type="tel"
                    value={mobile}
                    onChange={e => setMobile(e.target.value)}
                    autoComplete="tel-national"
                    placeholder=" "
                    className="peer w-full bg-transparent pt-5 pb-1.5 text-sm text-gray-900 focus:outline-none"
                  />
                  <label
                    htmlFor="mobile"
                    className="absolute left-0 top-1 text-xs text-[#1B6CA8] transition-all duration-200 pointer-events-none peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-600 peer-focus:top-1 peer-focus:text-xs peer-focus:text-[#1B6CA8]"
                  >
                    Mobile number
                  </label>
                </div>
              </div>
            </div>

            {/* Email — full width */}
            <FloatingInput
              id="email"
              label="Email address"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              showEmailIcon
            />

            {/* Row 2: Password | Confirm password */}
            <div className="grid grid-cols-2 gap-4">
              <PasswordInput
                id="password"
                label="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <PasswordInput
                id="confirm-password"
                label="Confirm password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          {/* Role selector */}
          <div className="mt-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-600 mb-3">
              I am a...
            </p>
            <div className="flex gap-2">
              {ROLES.map(role => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setSelectedRole(role)}
                  className={[
                    'flex-1 py-1.5 rounded-full text-sm font-semibold transition-colors border',
                    selectedRole === role
                      ? 'bg-[#1B6CA8] text-white border-[#1B6CA8]'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:text-gray-600',
                  ].join(' ')}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          {/* Terms */}
          <div className="mt-4 flex items-start gap-2.5">
            <input
              id="terms"
              type="checkbox"
              checked={termsAccepted}
              onChange={e => setTermsAccepted(e.target.checked)}
              className="mt-0.5 accent-[#1B6CA8] shrink-0 cursor-pointer"
            />
            <label htmlFor="terms" className="text-xs text-gray-600 leading-relaxed cursor-pointer">
              I agree to the{' '}
              <button type="button" className="text-[#1B6CA8] hover:underline">
                Terms of Service
              </button>
              {' '}and{' '}
              <button type="button" className="text-[#1B6CA8] hover:underline">
                Privacy Policy
              </button>
            </label>
          </div>

          {/* Error pill */}
          {error && (
            <div className="mt-4 px-4 py-2 bg-red-50 border border-red-200 rounded-full text-xs text-red-600 text-center">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleCreateAccount}
            disabled={loading}
            className="w-full bg-[#1B6CA8] text-white font-heading font-semibold py-3 rounded-xl mt-4 hover:bg-[#0D3F6B] transition-colors text-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span
                  className="inline-block w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"
                />
                Creating account...
              </>
            ) : 'Create account'}
          </button>
        </div>

        {/* Below card */}
        <div className="w-full max-w-md mt-6 space-y-4">

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-600">or continue with</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Social buttons */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 rounded-xl py-2.5 hover:bg-gray-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="text-sm font-medium text-gray-700">Continue with Google</span>
          </button>

          {/* Sign in nudge */}
          <p className="text-center text-xs text-gray-600">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => navigate('/signin')}
              className="text-[#1B6CA8] font-medium hover:underline"
            >
              Sign in
            </button>
          </p>

          {/* Dashboard links */}
          <div className="flex justify-center gap-6">
            <button
              type="button"
              onClick={() => navigate('/merchant')}
              className="text-xs text-gray-600 hover:text-gray-600 transition-colors"
            >
              Merchant login →
            </button>
            <button
              type="button"
              onClick={() => navigate('/rider')}
              className="text-xs text-gray-600 hover:text-gray-600 transition-colors"
            >
              Rider login →
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
