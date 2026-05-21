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
    <header className="w-full bg-white border-b border-[#e5e7eb] sticky top-0 z-50">
      <div className="max-w-[1280px] mx-auto px-8 h-16 flex items-center gap-6">

        {/* Logo */}
        <Link to="/" className="shrink-0">
          <img src="/LabadaGoLogo.png" alt="LabadaGo" className="h-8 w-auto" />
        </Link>

        {/* Search + location */}
        <div className="flex items-center gap-3 flex-1">
          <button className="flex items-center gap-1.5 bg-[#E8F4FD] text-[#0C447C] text-sm font-medium px-3 py-1.5 rounded-full shrink-0 whitespace-nowrap">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
            Quezon City
          </button>

          <div className="relative flex-1 max-w-sm">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600"
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
              className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-full text-sm outline-none focus:ring-2 focus:ring-[#1B6CA8]/30 placeholder:text-gray-600"
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
                `text-sm font-medium transition-colors ${isActive ? 'text-[#1B6CA8]' : 'text-gray-600 hover:text-[#1B6CA8]'}`
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
                  `text-sm font-medium transition-colors ${isActive ? 'text-[#1B6CA8]' : 'text-gray-600 hover:text-[#1B6CA8]'}`
                }
              >
                My orders
              </NavLink>
              <NavLink
                to="/order-tracking"
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors ${isActive ? 'text-[#1B6CA8]' : 'text-gray-600 hover:text-[#1B6CA8]'}`
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
                `text-sm font-medium transition-colors ${isActive ? 'text-[#1B6CA8]' : 'text-gray-600 hover:text-[#1B6CA8]'}`
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
                `text-sm font-medium transition-colors ${isActive ? 'text-[#1B6CA8]' : 'text-gray-600 hover:text-[#1B6CA8]'}`
              }
            >
              My Deliveries
            </NavLink>
          )}

          {/* Auth area */}
          {!user ? (
            <Link
              to="/signin"
              className="bg-[#1B6CA8] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#155a8a] transition-colors"
            >
              Sign in
            </Link>
          ) : (
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setDropdownOpen(v => !v)}
                className="flex items-center gap-2 border border-[#e5e7eb] rounded-full pl-2 pr-3 py-1.5 hover:bg-gray-50 transition-colors"
              >
                <div className="w-6 h-6 rounded-full border border-dashed border-[#1B6CA8] bg-[#E8F4FD] shrink-0" />
                <span className="text-sm font-medium text-gray-700 max-w-[96px] truncate">
                  {firstName}
                </span>
                <svg
                  className={`w-3.5 h-3.5 text-gray-600 transition-transform duration-150 ${dropdownOpen ? 'rotate-180' : ''}`}
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
