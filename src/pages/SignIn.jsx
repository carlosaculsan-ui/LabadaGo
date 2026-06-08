import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from 'firebase/auth'
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
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


function FloatingInput({ id, label, type = 'text', value, onChange, autoComplete, showEmailIcon, inputMode, error }) {
  const hasValue = !!value
  return (
    <div className="relative h-14">
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        inputMode={inputMode}
        placeholder=" "
        className={[
          'peer w-full h-full rounded-full bg-[#0c3059] border text-white pt-5 pb-1.5 text-sm focus:outline-none focus:ring-2 transition-all',
          error ? 'border-red-400 focus:border-red-400 focus:ring-red-400/30' : 'border-white/20 focus:border-orange-400 focus:ring-orange-400/30',
          showEmailIcon ? 'pl-5 pr-11' : 'px-5',
        ].join(' ')}
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

function PasswordInput({ id, label, value, onChange, autoComplete = 'current-password', error }) {
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
  const [remember, setRemember] = useState(false)
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState('')
  const [loading,     setLoading]     = useState(false)
  const [exiting,     setExiting]     = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})

  function navigateTo(path) {
    setExiting(true)
    setTimeout(() => navigate(path), 280)
  }

  useEffect(() => {
    if (user && !profileLoading) {
      navigate(ROLE_REDIRECT[role] ?? '/browse', { replace: true })
    }
  }, [user, role, profileLoading, navigate])

  async function handleSignIn() {
    setError('')
    setSuccess('')
    const errs = {}
    if (!email) {
      errs.email = 'Email or mobile number is required.'
    } else if (!/^\d/.test(email) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = 'Enter a valid email address.'
    }
    if (!password) errs.password = 'Password is required.'
    if (Object.keys(errs).length) { setFieldErrors(errs); return }
    setFieldErrors({})
    setLoading(true)
    try {
      await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence)
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
          fullName:  user.displayName ?? '',
          email:     user.email ?? '',
          photoURL:  user.photoURL ?? '',
          mobile:    '',
          role:      'customer',
          createdAt: serverTimestamp(),
          isActive:  true,
        })
      } else if (user.photoURL) {
        await updateDoc(ref, { photoURL: user.photoURL })
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
      setFieldErrors(f => ({ ...f, email: 'Enter your email address first.' }))
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
    <div
      className="min-h-screen relative overflow-x-hidden"
      style={{ background: 'linear-gradient(135deg, #0A3358, #1B6CA8, #2980C4, #0A3358)', backgroundSize: '300% 300%', animation: 'gradient-shift 15s ease infinite' }}
    >
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
        <h1 className="sr-only">Sign In — LabadaGo</h1>

        {/* Logo + tagline */}
        <div className="text-center">
          <div>
            <img src="/LabadaGoLogo.png" alt="LabadaGo" className="h-20 w-auto mx-auto" />
          </div>
          <p className="text-sm text-white/70 mt-1.5">Fresh laundry, delivered to your door.</p>
        </div>

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
        {/* Form card */}
        <div className="w-full bg-[#0c2d54] border border-white/30 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.25)] px-10 py-8">
          <div className="mb-6">
            <h2 className="text-white font-heading font-bold text-xl">Welcome back</h2>
            <p className="text-white/50 text-xs mt-0.5">Sign in to continue</p>
          </div>
          <div className="space-y-4">
            <div>
              <FloatingInput
                id="email"
                label="Email or Mobile Number"
                type="text"
                value={email}
                autoComplete="username"
                inputMode={/^\d/.test(email) ? 'tel' : 'email'}
                error={fieldErrors.email}
                onChange={e => { setEmail(e.target.value); setFieldErrors(f => ({ ...f, email: '' })) }}
                showEmailIcon
              />
              {fieldErrors.email && <p className="text-red-400 text-xs mt-1.5 pl-5">{fieldErrors.email}</p>}
            </div>
            <div>
              <PasswordInput
                id="password"
                label="Password"
                value={password}
                error={fieldErrors.password}
                onChange={e => { setPassword(e.target.value); setFieldErrors(f => ({ ...f, password: '' })) }}
              />
              {fieldErrors.password && <p className="text-red-400 text-xs mt-1.5 pl-5">{fieldErrors.password}</p>}
              <div className="flex items-center justify-between mt-2">
                <label className="flex items-center gap-2 cursor-pointer select-none group">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={e => setRemember(e.target.checked)}
                    className="w-3.5 h-3.5 rounded accent-orange-400 cursor-pointer"
                  />
                  <span className="text-xs text-white/70 group-hover:text-white/90 transition-colors">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => navigateTo('/forgot-password')}
                  className="text-xs text-white/70 hover:text-orange-400 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            </div>
          </div>

          {/* Server feedback pill */}
          {(error || success) && (
            <div className={[
              'mt-4 px-4 py-2 rounded-full text-xs text-center border',
              error
                ? 'bg-red-500/20 border-red-400/30 text-red-300'
                : 'bg-green-500/20 border-green-400/30 text-green-300',
            ].join(' ')}>
              {error || success}
            </div>
          )}

          <button
            type="button"
            onClick={handleSignIn}
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#F5A623] to-[#FF6B35] text-white font-heading font-bold py-3 rounded-full mt-5 tracking-wide text-sm hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(245,166,35,0.5)] active:translate-y-0 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="inline-block w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Signing in...
              </>
            ) : 'Sign in'}
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

        {/* Below card — sign up nudge only */}
        <div className="w-full text-center">
          <p className="text-xs text-white/60">
            New to LabadaGo?{' '}
            <button
              type="button"
              onClick={() => navigateTo('/signup')}
              className="text-orange-400 font-medium hover:text-orange-300 hover:drop-shadow-[0_0_8px_rgba(245,166,35,0.6)] transition-all"
            >
              Sign up free
            </button>
          </p>

        </div>
        </motion.div>
        </div>
    </div>
  )
}
