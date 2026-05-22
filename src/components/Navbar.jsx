import { useState, useEffect, useRef } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'

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

  return (
    <header className="w-full fixed top-0 left-0 right-0 z-50 px-6 pt-4 pb-2 pointer-events-none">
      <div className="max-w-[1280px] mx-auto rounded-2xl pl-4 pr-6 h-16 flex items-center gap-6 pointer-events-auto bg-white/10 border border-white/20 backdrop-blur-md">

        {/* Logo */}
        <Link to="/" className="shrink-0">
          <img src="/LabadaGoLogo.png" alt="LabadaGo" className="h-11 w-auto" />
        </Link>

        {/* Search */}
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60"
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
              className="w-full pl-9 pr-4 py-2 rounded-full text-sm outline-none bg-white/15 text-white placeholder:text-white/50 focus:ring-2 focus:ring-white/30"
            />
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex items-center gap-5 shrink-0">

          {/* Browse — always visible for guests, and for customers */}
          {(!user || role === 'customer' || !role) && (
            <NavLink
              to="/browse"
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${isActive ? 'text-[#F5A623]' : 'text-white/80 hover:text-white'}`
              }
            >
              Browse shops
            </NavLink>
          )}

          {/* Customer links */}
          {user && role === 'customer' && (
            <>
              <NavLink
                to="/my-orders"
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors ${isActive ? 'text-[#F5A623]' : 'text-white/80 hover:text-white'}`
                }
              >
                My orders
              </NavLink>
              <NavLink
                to="/order-tracking"
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors ${isActive ? 'text-[#F5A623]' : 'text-white/80 hover:text-white'}`
                }
              >
                Track
              </NavLink>
            </>
          )}

          {/* Merchant link */}
          {user && role === 'merchant' && (
            <NavLink
              to="/merchant"
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${isActive ? 'text-[#F5A623]' : 'text-white/80 hover:text-white'}`
              }
            >
              My Dashboard
            </NavLink>
          )}

          {/* Rider link */}
          {user && role === 'rider' && (
            <NavLink
              to="/rider"
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${isActive ? 'text-[#F5A623]' : 'text-white/80 hover:text-white'}`
              }
            >
              My Deliveries
            </NavLink>
          )}

          {/* Auth area */}
          {!user ? (
            <Link
              to="/signin"
              className="text-sm font-semibold px-4 py-2 rounded-lg bg-white text-[#0D3F6B] hover:bg-white/90 transition-colors"
            >
              Sign in
            </Link>
          ) : (
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setDropdownOpen(v => !v)}
                className="flex items-center gap-2 rounded-full pl-2 pr-3 py-1.5 border border-white/30 hover:bg-white/10 transition-colors"
              >
                <div className="w-6 h-6 rounded-full border border-dashed border-white/60 bg-white/10 shrink-0" />
                <span className="text-sm font-medium text-white max-w-[96px] truncate">
                  {firstName}
                </span>
                <svg
                  className={`w-3.5 h-3.5 text-white/70 transition-transform duration-150 ${dropdownOpen ? 'rotate-180' : ''}`}
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
