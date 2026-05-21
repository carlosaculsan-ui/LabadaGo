import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
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

function FloatingInput({ id, label, type = 'text', value, onChange }) {
  return (
    <div className="relative">
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder=" "
        className="peer w-full border-b border-gray-300 bg-transparent pt-5 pb-1.5 text-sm text-gray-900 focus:outline-none focus:border-[#1B6CA8] transition-colors"
      />
      <label
        htmlFor={id}
        className="absolute left-0 top-1 text-xs text-[#1B6CA8] transition-all duration-200 pointer-events-none peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-600 peer-focus:top-1 peer-focus:text-xs peer-focus:text-[#1B6CA8]"
      >
        {label}
      </label>
    </div>
  )
}

function PasswordInput({ id, label, value, onChange }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
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
        onClick={() => setShow(v => !v)}
        className="absolute right-0 bottom-2 text-gray-600 hover:text-gray-600 transition-colors"
      >
        {show ? (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        )}
      </button>
    </div>
  )
}

// ─── Helpers ───────────────────────────────────────────────────────────────

const ROLE_REDIRECT = { customer: '/browse', merchant: '/merchant', rider: '/rider' }

function friendlyError(code) {
  switch (code) {
    case 'auth/user-not-found':     return 'No account found with this email.'
    case 'auth/wrong-password':     return 'Incorrect password. Try again.'
    case 'auth/invalid-credential': return 'Invalid email or password.'
    case 'auth/too-many-requests':  return 'Too many attempts. Try again later.'
    default:                        return null
  }
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function SignIn() {
  const navigate   = useNavigate()
  const { user, role, profileLoading } = useAuth()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState('')
  const [loading,  setLoading]  = useState(false)

  useEffect(() => {
    if (user && !profileLoading) {
      navigate(ROLE_REDIRECT[role] ?? '/browse', { replace: true })
    }
  }, [user, role, profileLoading, navigate])

  async function handleSignIn() {
    setError('')
    setSuccess('')
    if (!email || !password) {
      setError('Enter your email and password.')
      return
    }
    setLoading(true)
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password)
      const snap = await getDoc(doc(db, 'users', user.uid))
      const role = snap.exists() ? snap.data().role : 'customer'
      navigate(ROLE_REDIRECT[role] ?? '/browse', { replace: true })
    } catch (err) {
      setError(friendlyError(err.code) ?? err.message)
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      const { user } = await signInWithPopup(auth, new GoogleAuthProvider())
      const ref  = doc(db, 'users', user.uid)
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
      setError(friendlyError(err.code) ?? err.message)
      setLoading(false)
    }
  }

  async function handleForgotPassword() {
    setError('')
    setSuccess('')
    if (!email) {
      setError('Enter your email address first.')
      return
    }
    try {
      await sendPasswordResetEmail(auth, email)
      setSuccess('Password reset email sent. Check your inbox.')
    } catch (err) {
      setError(friendlyError(err.code) ?? err.message)
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
        <AuthToggle active="signin" />

        {/* Form card */}
        <div className="w-full max-w-md bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] px-10 py-10 mt-6">
          <div className="space-y-6">
            <FloatingInput
              id="email"
              label="Email address"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <div>
              <PasswordInput
                id="password"
                label="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs text-[#1B6CA8] hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            </div>
          </div>

          {/* Feedback pill */}
          {(error || success) && (
            <div className={[
              'mt-5 px-4 py-2 rounded-full text-xs text-center border',
              error
                ? 'bg-red-50 border-red-200 text-red-600'
                : 'bg-green-50 border-green-200 text-green-700',
            ].join(' ')}>
              {error || success}
            </div>
          )}

          <button
            type="button"
            onClick={handleSignIn}
            disabled={loading}
            className="w-full bg-[#1B6CA8] text-white font-heading font-semibold py-3 rounded-xl mt-4 hover:bg-[#0D3F6B] transition-colors text-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="inline-block w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Signing in...
              </>
            ) : 'Sign in'}
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
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleGoogle}
              disabled={loading}
              className="flex items-center justify-center gap-2 bg-white border border-gray-200 rounded-xl py-2.5 hover:bg-gray-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <ImgPlaceholder label="Google logo" className="w-5 h-5 rounded bg-gray-100 border-gray-300" />
              <span className="text-sm font-medium text-gray-700">Google</span>
            </button>
            <button
              type="button"
              className="flex items-center justify-center gap-2 bg-white border border-gray-200 rounded-xl py-2.5 hover:bg-gray-50 transition-colors"
            >
              <ImgPlaceholder label="Facebook logo" className="w-5 h-5 rounded bg-[#E8F0FE] border-blue-200" />
              <span className="text-sm font-medium text-gray-700">Facebook</span>
            </button>
          </div>

          {/* Sign up nudge */}
          <p className="text-center text-xs text-gray-600">
            New to LabadaGo?{' '}
            <button
              type="button"
              onClick={() => navigate('/signup')}
              className="text-[#1B6CA8] font-medium hover:underline"
            >
              Sign up free
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
