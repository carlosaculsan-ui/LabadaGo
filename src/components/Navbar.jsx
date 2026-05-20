import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'

export default function Navbar() {
  const [search, setSearch] = useState('')
  const navigate = useNavigate()
  const { user, userProfile } = useAuth()

  async function handleSignOut() {
    await signOut(auth)
    navigate('/', { replace: true })
  }

  return (
    <header className="w-full bg-white border-b border-[#e5e7eb] sticky top-0 z-50">
      <div className="max-w-[1280px] mx-auto px-8 h-16 flex items-center gap-6">

        <Link to="/" className="shrink-0">
          <span className="font-heading font-extrabold text-2xl text-[#1B6CA8]">Labada</span>
          <span className="font-heading font-extrabold text-2xl text-[#F5A623]">Go</span>
        </Link>

        <div className="flex items-center gap-3 flex-1">
          <button className="flex items-center gap-1.5 bg-[#E8F4FD] text-[#0C447C] text-sm font-medium px-3 py-1.5 rounded-full shrink-0 whitespace-nowrap">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
            Quezon City
          </button>

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
              className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-full text-sm outline-none focus:ring-2 focus:ring-[#1B6CA8]/30 placeholder:text-gray-400"
            />
          </div>
        </div>

        <nav className="flex items-center gap-5 shrink-0">
          <NavLink
            to="/browse"
            className={({ isActive }) =>
              `text-sm font-medium transition-colors ${isActive ? 'text-[#1B6CA8]' : 'text-gray-600 hover:text-[#1B6CA8]'}`
            }
          >
            Browse shops
          </NavLink>

          {user && (
            <>
              <Link to="/order-tracking" className="text-sm font-medium text-gray-600 hover:text-[#1B6CA8] transition-colors">
                My orders
              </Link>
              <Link to="/order-tracking" className="text-sm font-medium text-gray-600 hover:text-[#1B6CA8] transition-colors">
                Track
              </Link>
            </>
          )}

          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 font-medium">
                {userProfile?.fullName ?? user.displayName ?? user.email}
              </span>
              <button
                onClick={handleSignOut}
                className="text-sm font-semibold text-gray-500 hover:text-red-500 transition-colors"
              >
                Sign out
              </button>
            </div>
          ) : (
            <Link
              to="/signin"
              className="bg-[#1B6CA8] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#155a8a] transition-colors"
            >
              Sign in
            </Link>
          )}
        </nav>

      </div>
    </header>
  )
}
