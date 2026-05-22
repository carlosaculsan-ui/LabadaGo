import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '../lib/firebase'

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

function FloatingInput({ id, label, value, onChange, error }) {
  const hasValue = !!value
  return (
    <div className="relative h-14">
      <input
        id={id}
        type="email"
        value={value}
        onChange={onChange}
        autoComplete="email"
        placeholder=" "
        className={[
          'peer w-full h-full rounded-full bg-[#0c3059] border text-white pl-5 pr-11 pt-5 pb-1.5 text-sm focus:outline-none focus:ring-2 transition-all',
          error
            ? 'border-red-400 focus:border-red-400 focus:ring-red-400/30'
            : 'border-white/20 focus:border-orange-400 focus:ring-orange-400/30',
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
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
        <svg
          className={['w-[18px] h-[18px] transition-colors duration-200', value ? 'text-orange-400' : 'text-white/40'].join(' ')}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
        </svg>
      </div>
    </div>
  )
}

export default function ForgotPassword() {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState('')

  async function handleSubmit() {
    setError('')
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email address.')
      return
    }
    setLoading(true)
    try {
      await sendPasswordResetEmail(auth, email)
    } catch {
      // Silently succeed to avoid email enumeration
    } finally {
      setLoading(false)
      setSent(true)
    }
  }

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0A3358, #1B6CA8, #2980C4, #0A3358)', backgroundSize: '300% 300%', animation: 'gradient-shift 15s ease infinite' }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {BUBBLES.map((b, i) => (
          <div
            key={i}
            className="absolute rounded-full border border-white pointer-events-none"
            style={{
              width: b.w, height: b.w, top: b.top, left: b.left,
              opacity: 0.12 + (i % 3) * 0.04,
              animation: `${i % 2 === 0 ? 'bubble-float' : 'bubble-drift'} ${5 + (i % 5) * 1.2}s ease-in-out ${-(i * 1.0).toFixed(1)}s infinite`,
              willChange: 'transform',
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-12">
        <h1 className="sr-only">Forgot Password — LabadaGo</h1>

        <div className="text-center">
          <img src="/LabadaGoLogo.png" alt="LabadaGo" className="h-20 w-auto mx-auto" />
          <p className="text-sm text-white/70 mt-1.5">Fresh laundry, delivered to your door.</p>
        </div>

        <motion.div
          className="w-full max-w-md flex flex-col items-center gap-3 mt-4"
          initial={{ scale: 0.05, opacity: 0, filter: 'blur(24px)' }}
          animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
          transition={{ type: 'spring', stiffness: 320, damping: 22 }}
        >
          <div className="w-full bg-[#0c2d54] border border-white/30 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.25)] px-10 py-8">

            {!sent ? (
              <>
                <div className="mb-6">
                  <h2 className="text-white font-heading font-bold text-xl">Forgot your password?</h2>
                  <p className="text-white/50 text-xs mt-0.5">Enter your email and we'll send you a reset link.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <FloatingInput
                      id="email"
                      label="Email address"
                      value={email}
                      error={error}
                      onChange={e => { setEmail(e.target.value); setError('') }}
                    />
                    {error && <p className="text-red-400 text-xs mt-1.5 pl-5">{error}</p>}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#F5A623] to-[#FF6B35] text-white font-heading font-bold py-3 rounded-full mt-5 tracking-wide text-sm hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(245,166,35,0.5)] active:translate-y-0 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="inline-block w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Sending...
                    </>
                  ) : 'Send reset link'}
                </button>
              </>
            ) : (
              <div className="text-center py-2">
                <div className="w-14 h-14 rounded-full bg-green-500/20 border border-green-400/30 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-white font-heading font-bold text-xl mb-2">Check your inbox</h2>
                <p className="text-white/60 text-sm leading-relaxed">
                  If <span className="text-white font-medium">{email}</span> is registered, a reset link is on its way.
                </p>
              </div>
            )}

          </div>

          <div className="w-full text-center">
            <p className="text-xs text-white/60">
              Remember your password?{' '}
              <Link
                to="/signin"
                className="text-orange-400 font-medium hover:text-orange-300 hover:drop-shadow-[0_0_8px_rgba(245,166,35,0.6)] transition-all"
              >
                Sign in
              </Link>
            </p>
          </div>

        </motion.div>
      </div>
    </div>
  )
}
