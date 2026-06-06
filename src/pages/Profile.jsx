import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, updateDoc } from 'firebase/firestore'
import { sendPasswordResetEmail, signOut } from 'firebase/auth'
import { db, auth } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'

const BUBBLES = [
  { w: 240, top: '5%',  left: '6%'  },
  { w: 120, top: '12%', left: '77%' },
  { w: 300, top: '22%', left: '86%' },
  { w: 80,  top: '42%', left: '3%'  },
  { w: 180, top: '57%', left: '90%' },
  { w: 260, top: '70%', left: '12%' },
  { w: 100, top: '80%', left: '57%' },
  { w: 160, top: '88%', left: '37%' },
]

export default function Profile() {
  const navigate = useNavigate()
  const { user, userProfile, role, refreshProfile } = useAuth()

  const [fullName, setFullName] = useState(
    userProfile?.fullName || user?.displayName || ''
  )
  const [mobile,   setMobile]   = useState(userProfile?.mobile ?? '')
  const [saving,       setSaving]       = useState(false)
  const [saveMsg,      setSaveMsg]      = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetMsg,     setResetMsg]     = useState('')

  const initials = (userProfile?.fullName || user?.displayName || user?.email || '?')
    .split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

  async function handleSave() {
    setSaving(true)
    setSaveMsg('')
    try {
      await updateDoc(doc(db, 'users', user.uid), { fullName, mobile })
      await refreshProfile()
      setSaveMsg('Changes saved.')
    } catch {
      setSaveMsg('Failed to save. Try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handlePasswordReset() {
    setResetMsg('')
    setResetLoading(true)
    try {
      await sendPasswordResetEmail(auth, user.email)
      setResetMsg('Reset link sent to your email.')
    } catch {
      setResetMsg('Failed to send reset email.')
    } finally {
      setResetLoading(false)
    }
  }

  async function handleSignOut() {
    await signOut(auth)
    navigate('/', { replace: true })
  }

  return (
    <>
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0A3358, #1B6CA8, #2980C4, #0A3358)', backgroundSize: '300% 300%', animation: 'gradient-shift 15s ease infinite' }}
    >
      {/* Bubbles */}
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

      <div className="relative z-10 max-w-[620px] mx-auto px-6 py-12">

        {/* Avatar + name header */}
        <div className="flex flex-col items-center text-center mb-10">
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt={fullName}
              className="w-24 h-24 rounded-full object-cover border-4 border-white/30 shadow-xl mb-4"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-[#F5A623] flex items-center justify-center border-4 border-white/30 shadow-xl mb-4">
              <span className="text-2xl font-bold text-white">{initials}</span>
            </div>
          )}
          <h1 className="font-heading font-bold text-2xl text-white">
            {userProfile?.fullName || user?.displayName || 'My Profile'}
          </h1>
          <p className="text-white/60 text-sm mt-1">{user?.email}</p>
        </div>

        {/* Account info */}
        <div className="bg-[#0c2d54] border border-white/20 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] px-8 py-7 mb-4">
          <h2 className="text-white font-semibold text-sm mb-5">Account information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">Full name</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#0c3059] border border-white/20 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">Email address</label>
              <input
                type="email"
                value={user?.email ?? ''}
                disabled
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/40 text-sm cursor-not-allowed"
              />
              <p className="text-[11px] text-white/30 mt-1 pl-1">Email cannot be changed.</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">Mobile number</label>
              <input
                type="tel"
                value={mobile}
                onChange={e => setMobile(e.target.value)}
                placeholder="e.g. 09171234567"
                className="w-full px-4 py-2.5 rounded-xl bg-[#0c3059] border border-white/20 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400 transition-all"
              />
            </div>
          </div>
          <div className="flex items-center gap-4 mt-6">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-gradient-to-r from-[#F5A623] to-[#FF6B35] text-white text-sm font-bold px-6 py-2.5 rounded-xl hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(245,166,35,0.4)] transition-all duration-200 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            {saveMsg && (
              <p className={`text-xs ${saveMsg.includes('Failed') ? 'text-red-400' : 'text-green-400'}`}>
                {saveMsg}
              </p>
            )}
          </div>
        </div>

        {/* Password */}
        <div className="bg-[#0c2d54] border border-white/20 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] px-8 py-7 mb-4">
          <h2 className="text-white font-semibold text-sm mb-1">Password</h2>
          <p className="text-white/40 text-xs mb-4">
            We'll send a reset link to <span className="text-white/70">{user?.email}</span>.
          </p>
          <div className="flex items-center gap-4">
            <button
              onClick={handlePasswordReset}
              disabled={resetLoading}
              className="border border-white/30 text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resetLoading ? 'Sending…' : 'Send reset link'}
            </button>
            {resetMsg && (
              <p className={`text-xs ${resetMsg.includes('Failed') ? 'text-red-400' : 'text-green-400'}`}>
                {resetMsg}
              </p>
            )}
          </div>
        </div>

        {/* Sign out */}
        <div className="bg-[#0c2d54] border border-white/20 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] px-8 py-7">
          <h2 className="text-white font-semibold text-sm mb-1">Sign out</h2>
          <p className="text-white/40 text-xs mb-4">You'll be returned to the home page.</p>
          <button
            onClick={handleSignOut}
            className="border border-red-400/40 text-red-400 text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-red-400/10 transition-colors"
          >
            Sign out
          </button>
        </div>

        {/* Role badge — only shown if user is a merchant or rider */}
        {(role === 'merchant' || role === 'rider') && (
          <div className="bg-[#0c2d54] border border-white/20 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] px-8 py-7">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-white font-semibold text-sm mb-1">Your role</h2>
                <p className="text-white/40 text-xs">You're registered as a partner on LabadaGo.</p>
              </div>
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${role === 'merchant' ? 'bg-[#1B6CA8]/30 text-[#60B4FF] border border-[#1B6CA8]/40' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                {role === 'merchant' ? '🏪 Merchant' : '🛵 Rider'}
              </span>
            </div>
            <button
              onClick={() => navigate(role === 'merchant' ? '/merchant' : '/rider')}
              className="mt-4 border border-white/20 text-white/70 text-sm font-medium px-5 py-2 rounded-xl hover:bg-white/10 transition-colors"
            >
              Go to my dashboard →
            </button>
          </div>
        )}

      </div>
    </div>

    </>
  )
}
