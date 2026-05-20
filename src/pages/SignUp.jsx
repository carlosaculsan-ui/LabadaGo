import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

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
          active === 'signin' ? 'text-[#1B6CA8]' : 'text-gray-400',
        ].join(' ')}
      >
        Sign in
      </button>
      <button
        onClick={() => navigate('/signup')}
        className={[
          'relative z-10 flex-1 py-1.5 text-sm font-semibold rounded-full transition-colors',
          active === 'signup' ? 'text-[#1B6CA8]' : 'text-gray-400',
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
        <span className="text-[7px] font-medium text-gray-400 text-center leading-snug px-1">
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
        className="absolute left-0 top-1 text-xs text-[#1B6CA8] transition-all duration-200 pointer-events-none peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-400 peer-focus:top-1 peer-focus:text-xs peer-focus:text-[#1B6CA8]"
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
        className="absolute left-0 top-1 text-xs text-[#1B6CA8] transition-all duration-200 pointer-events-none peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-400 peer-focus:top-1 peer-focus:text-xs peer-focus:text-[#1B6CA8]"
      >
        {label}
      </label>
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShow(v => !v)}
        className="absolute right-0 bottom-2 text-gray-400 hover:text-gray-600 transition-colors"
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

// ─── Page ──────────────────────────────────────────────────────────────────

const ROLES = ['Customer', 'Merchant', 'Rider']

export default function SignUp() {
  const navigate = useNavigate()

  const [fullName,        setFullName]        = useState('')
  const [email,           setEmail]           = useState('')
  const [mobile,          setMobile]          = useState('')
  const [password,        setPassword]        = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [selectedRole,    setSelectedRole]    = useState('Customer')
  const [termsAccepted,   setTermsAccepted]   = useState(false)

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
            <span className="font-heading font-extrabold text-4xl text-[#1B6CA8]">Labada</span>
            <span className="font-heading font-extrabold text-4xl text-[#F5A623]">Go</span>
          </div>
          <p className="text-sm text-gray-400 mt-1.5">Fresh laundry, delivered to your door.</p>
        </div>

        {/* Tab toggle */}
        <AuthToggle active="signup" />

        {/* Form card */}
        <div className="w-full max-w-md bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] px-10 py-10 mt-6">

          <div className="space-y-6">
            <FloatingInput
              id="fullname"
              label="Full name"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
            />
            <FloatingInput
              id="email"
              label="Email address"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />

            {/* Mobile number — +63 prefix + floating label input */}
            <div className="flex border-b border-gray-300 focus-within:border-[#1B6CA8] transition-colors">
              <div className="bg-[#F0F7FF] px-3 flex items-end pb-1.5 text-sm font-semibold text-[#1B6CA8] shrink-0 rounded-tl-md">
                +63
              </div>
              <div className="relative flex-1 pl-2">
                <input
                  id="mobile"
                  type="tel"
                  value={mobile}
                  onChange={e => setMobile(e.target.value)}
                  placeholder=" "
                  className="peer w-full bg-transparent pt-5 pb-1.5 text-sm text-gray-900 focus:outline-none"
                />
                <label
                  htmlFor="mobile"
                  className="absolute left-0 top-1 text-xs text-[#1B6CA8] transition-all duration-200 pointer-events-none peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-400 peer-focus:top-1 peer-focus:text-xs peer-focus:text-[#1B6CA8]"
                >
                  Mobile number
                </label>
              </div>
            </div>

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

          {/* Role selector */}
          <div className="mt-7">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400 mb-3">
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
                      : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300 hover:text-gray-600',
                  ].join(' ')}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          {/* Terms */}
          <div className="mt-5 flex items-start gap-2.5">
            <input
              id="terms"
              type="checkbox"
              checked={termsAccepted}
              onChange={e => setTermsAccepted(e.target.checked)}
              className="mt-0.5 accent-[#1B6CA8] shrink-0 cursor-pointer"
            />
            <label htmlFor="terms" className="text-xs text-gray-400 leading-relaxed cursor-pointer">
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

          <button
            type="button"
            className="w-full bg-[#1B6CA8] text-white font-heading font-semibold py-3 rounded-xl mt-6 hover:bg-[#0D3F6B] transition-colors text-sm"
          >
            Create account
          </button>
        </div>

        {/* Below card */}
        <div className="w-full max-w-md mt-6 space-y-4">

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">or continue with</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Social buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className="flex items-center justify-center gap-2 bg-white border border-gray-200 rounded-xl py-2.5 hover:bg-gray-50 transition-colors"
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

          {/* Sign in nudge */}
          <p className="text-center text-xs text-gray-400">
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
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Merchant login →
            </button>
            <button
              type="button"
              onClick={() => navigate('/rider')}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Rider login →
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
