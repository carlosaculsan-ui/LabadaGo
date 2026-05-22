import { useState, useEffect, useRef } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'
import Logo from './Logo'

export default function Navbar() {
  const [search,       setSearch]       = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  const navigate    = useNavigate()
  const { user, userProfile, role } = useAuth()

  useEffect(() => {
    if (!dropdownOpen) return
    function onClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [dropdownOpen])

  async function handleSignOut() {
    setDropdownOpen(false)
    await signOut(auth)
    navigate('/', { replace: true })
  }

  const firstName = (userProfile?.fullName ?? user?.displayName ?? '').split(' ')[0] || 'Account'

  const linkClass = ({ isActive }) =>
    `text-sm font-medium transition-colors ${isActive ? 'text-[#1B6CA8]' : 'text-gray-600 hover:text-[#1B6CA8]'}`

  return (
    <header className="w-full fixed top-0 left-0 right-0 z-50 px-6 pt-4 pb-2 pointer-events-none">
      <div className="max-w-[1280px] mx-auto rounded-2xl pl-4 pr-6 h-16 flex items-center gap-6 pointer-events-auto bg-white border border-[#e5e7eb] shadow-[0_4px_24px_rgba(0,0,0,0.08)]">

        {/* Logo */}
        <Link to="/" className="shrink-0" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <img src="/CleanLogo.png" alt="LabadaGo" className="h-12 w-auto" />
        </Link>

        {/* Search */}
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              width="15" height="15" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search laundry shops..."
              className="w-full pl-9 pr-4 py-2 rounded-full text-sm outline-none bg-gray-100 text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-[#1B6CA8]/30"
            />
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex items-center gap-5 shrink-0">

          {(!user || role === 'customer' || !role) && (
            <NavLink to="/browse" className={linkClass}>Browse shops</NavLink>
          )}

          {!user && (
            <a
              href="/#how-it-works"
              className="text-sm font-medium text-gray-600 hover:text-[#1B6CA8] transition-colors"
            >
              How it works
            </a>
          )}

          {user && role === 'customer' && (
            <>
              <NavLink to="/my-orders"      className={linkClass}>My orders</NavLink>
              <NavLink to="/order-tracking" className={linkClass}>Track</NavLink>
            </>
          )}

          {user && role === 'merchant' && (
            <NavLink to="/merchant" className={linkClass}>My Dashboard</NavLink>
          )}

          {user && role === 'rider' && (
            <NavLink to="/rider" className={linkClass}>My Deliveries</NavLink>
          )}

          {/* Auth area */}
          {!user ? (
            <div className="flex items-center gap-2">
              <Link
                to="/signup"
                className="text-sm font-semibold px-4 py-2 rounded-lg border border-[#1B6CA8] text-[#1B6CA8] hover:bg-[#1B6CA8]/10 transition-colors"
              >
                Sign up
              </Link>
              <Link
                to="/signin"
                className="text-sm font-semibold px-4 py-2 rounded-lg bg-[#1B6CA8] text-white hover:bg-[#155a8a] transition-colors"
              >
                Sign in
              </Link>
            </div>
          ) : (
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setDropdownOpen(v => !v)}
                className="flex items-center gap-2 rounded-full pl-2 pr-3 py-1.5 border border-[#e5e7eb] hover:bg-gray-50 transition-colors"
              >
                <div className="w-6 h-6 rounded-full border border-dashed border-[#1B6CA8] bg-[#E8F4FD] shrink-0" />
                <span className="text-sm font-medium text-gray-700 max-w-[96px] truncate">
                  {firstName}
                </span>
                <svg
                  className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-150 ${dropdownOpen ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.1)] border border-[#e5e7eb] overflow-hidden z-50 py-1">
                  <button
                    onClick={() => setDropdownOpen(false)}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    My profile
                  </button>
                  <div className="h-px bg-[#e5e7eb] mx-2" />
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-50 transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          )}

        </nav>
      </div>
    </header>
  )
}
