import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { collection, getDocs, query, where, onSnapshot } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'
import Logo from './Logo'

const ACTIVE_ORDER_STATUSES = [
  'PENDING', 'ACCEPTED', 'PICKUP_EN_ROUTE', 'PICKED_UP',
  'ARRIVED_AT_SHOP', 'PROCESSING', 'READY_FOR_DELIVERY', 'DELIVERY_EN_ROUTE',
]

const MOCK_SHOPS = [
  { id: 'mock-1', name: 'Sunshine Laundry',    address: '12 Rizal St, Barangay Sta. Cruz' },
  { id: 'mock-2', name: 'CleanWave Express',   address: '45 Mabini Ave, Poblacion'        },
  { id: 'mock-3', name: 'FreshFold Laundromat',address: '8 Del Pilar Rd, San Antonio'     },
  { id: 'mock-4', name: 'BubbleKing Laundry',  address: '33 Luna Blvd, Bagong Silang'     },
  { id: 'mock-5', name: 'SpinCycle PH',        address: '21 Bonifacio St, Laging Handa'  },
  { id: 'mock-6', name: 'PureFresh Laundry',   address: '9 Aguinaldo St, Pinyahan'        },
]

export default function Navbar() {
  const [search,          setSearch]          = useState('')
  const [dropdownOpen,    setDropdownOpen]    = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [allShops,        setAllShops]        = useState([])
  const [shopsFetched,    setShopsFetched]    = useState(false)
  const [mobileMenuOpen,  setMobileMenuOpen]  = useState(false)
  const [activeOrder,     setActiveOrder]     = useState(null)
  const dropdownRef   = useRef(null)
  const searchRef     = useRef(null)
  const mobileMenuRef = useRef(null)
  const navigate      = useNavigate()
  const { pathname }  = useLocation()
  const { user, userProfile, role } = useAuth()

  function handleUseLocation() {
    setShowSuggestions(false)
    navigate('/browse')
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          sessionStorage.setItem('userLat', String(pos.coords.latitude))
          sessionStorage.setItem('userLng', String(pos.coords.longitude))
        },
        () => {}
      )
    }
  }

  useEffect(() => {
    setSearch('')
    setShowSuggestions(false)
  }, [pathname])

  async function fetchShops() {
    if (shopsFetched) return
    setShopsFetched(true)
    try {
      const snap = await getDocs(collection(db, 'shops'))
      const real = snap.docs.map(d => ({ id: d.id, name: d.data().name, address: d.data().address }))
      setAllShops([...real, ...MOCK_SHOPS])
    } catch {
      setAllShops(MOCK_SHOPS)
    }
  }

  const suggestions = search.trim().length === 0 ? [] : allShops.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.address.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 6)

  useEffect(() => {
    function onClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

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

  useEffect(() => {
    if (!mobileMenuOpen) return
    function onClickOutside(e) {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) {
        setMobileMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [mobileMenuOpen])

  useEffect(() => {
    if (!user || (role && role !== 'customer')) {
      setActiveOrder(null)
      return
    }
    const q = query(collection(db, 'orders'), where('customerId', '==', user.uid))
    const unsub = onSnapshot(q, snap => {
      const active = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(o => ACTIVE_ORDER_STATUSES.includes(o.status))
        .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))[0] ?? null
      setActiveOrder(active)
    }, () => setActiveOrder(null))
    return () => unsub()
  }, [user, role])

  async function handleSignOut() {
    setDropdownOpen(false)
    await signOut(auth)
    navigate('/', { replace: true })
  }

  const displayName = userProfile?.fullName ?? user?.displayName ?? ''
  const firstName = displayName.split(' ')[0] || 'Account'
  const initials = (() => {
    const parts = displayName.trim().split(/\s+/).filter(Boolean)
    if (parts.length === 0) return '?'
    if (parts.length === 1) return parts[0][0].toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  })()
  const photoURL = user?.photoURL

  return (
    <header className="w-full fixed top-0 left-0 right-0 z-50 px-3 md:px-6 pt-3 md:pt-4 pb-2 pointer-events-none">
      <div className="max-w-[1280px] mx-auto rounded-2xl pl-3 md:pl-4 pr-3 md:pr-6 h-14 md:h-16 flex items-center gap-3 md:gap-6 pointer-events-auto bg-white border border-[#e5e7eb] shadow-[0_4px_24px_rgba(0,0,0,0.08)]">

        {/* Logo */}
        <Link to="/" className="shrink-0" onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setMobileMenuOpen(false) }}>
          <img src="/CleanLogo.png" alt="LabadaGo" className="h-10 md:h-12 w-auto" />
        </Link>

        {/* Desktop: Search + Nav + User */}
        <div className="hidden md:flex items-center gap-4 flex-1">
          <div ref={searchRef} className="relative w-64">
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
              onChange={e => {
                setSearch(e.target.value)
                setShowSuggestions(true)
                fetchShops()
              }}
              onFocus={() => { setShowSuggestions(true); fetchShops() }}
              onKeyDown={e => {
                if (e.key === 'Enter' && search.trim()) {
                  navigate(`/browse?search=${encodeURIComponent(search.trim())}`)
                  setSearch('')
                  setShowSuggestions(false)
                }
                if (e.key === 'Escape') setShowSuggestions(false)
              }}
              placeholder="Search shops or locations..."
              className="w-full pl-9 pr-4 py-2 rounded-full text-sm outline-none bg-white border border-[#e5e7eb] text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-[#1B6CA8]/30 focus:border-[#1B6CA8]"
            />

            {/* Autocomplete dropdown / location prompt */}
            {showSuggestions && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-[#e5e7eb] overflow-hidden z-50">
                {search.trim().length === 0 ? (
                  <>
                    <button
                      onMouseDown={handleUseLocation}
                      className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[#F4F7FA] transition-colors text-left"
                    >
                      <div className="w-7 h-7 rounded-lg bg-[#D1FAE5] flex items-center justify-center shrink-0">
                        <svg viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" className="w-3.5 h-3.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                          <circle cx="12" cy="9" r="2.5"/>
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-gray-800">Use my current location</span>
                    </button>
                    <div className="border-t border-[#e5e7eb] px-4 pt-3 pb-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400 mb-2">
                        Popular areas
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {['Quezon City', 'Makati', 'Pasig', 'Manila', 'Mandaluyong'].map(area => (
                          <button
                            key={area}
                            onMouseDown={() => {
                              navigate(`/browse?search=${encodeURIComponent(area)}`)
                              setShowSuggestions(false)
                            }}
                            className="text-xs px-3 py-1.5 rounded-full bg-[#F4F7FA] text-gray-600 hover:bg-[#E8F4FD] hover:text-[#1B6CA8] transition-colors"
                          >
                            {area}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                ) : suggestions.length > 0 ? (
                  <>
                    {suggestions.map(shop => (
                      <button
                        key={shop.id}
                        onMouseDown={() => {
                          navigate(`/shop/${shop.id}`)
                          setSearch('')
                          setShowSuggestions(false)
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#F4F7FA] transition-colors text-left"
                      >
                        <div className="w-7 h-7 rounded-lg bg-[#EEF5FB] flex items-center justify-center shrink-0">
                          <svg viewBox="0 0 24 24" fill="none" stroke="#1B6CA8" strokeWidth="2" className="w-3.5 h-3.5">
                            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{shop.name}</p>
                          <p className="text-xs text-gray-400 truncate">{shop.address}</p>
                        </div>
                      </button>
                    ))}
                    <div className="border-t border-[#e5e7eb]">
                      <button
                        onMouseDown={() => {
                          navigate(`/browse?search=${encodeURIComponent(search.trim())}`)
                          setSearch('')
                          setShowSuggestions(false)
                        }}
                        className="w-full px-4 py-2.5 text-xs text-[#1B6CA8] font-medium hover:bg-[#F4F7FA] transition-colors text-left"
                      >
                        See all results for &ldquo;{search}&rdquo; →
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="px-4 py-5 text-center">
                    <p className="text-sm text-gray-500 mb-1">No shops found for &ldquo;{search}&rdquo;</p>
                    <button
                      onMouseDown={() => { navigate('/browse'); setSearch(''); setShowSuggestions(false) }}
                      className="text-xs text-[#1B6CA8] font-medium hover:underline"
                    >
                      Browse all shops →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Nav links — visible to everyone */}
          <nav className="flex items-center flex-1 justify-evenly">
            <a href="/#nearby-shops" className="text-sm font-medium text-gray-600 hover:text-[#1B6CA8] transition-colors">Nearby shops</a>
            <a href="/#how-it-works" className="text-sm font-medium text-gray-600 hover:text-[#1B6CA8] transition-colors">How it works</a>
            <a href="/#testimonials"  className="text-sm font-medium text-gray-600 hover:text-[#1B6CA8] transition-colors">Reviews</a>
          </nav>

          {/* Active order pill */}
          {activeOrder && (
            <button
              onClick={() => navigate(`/order-tracking?id=${activeOrder.id}`)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[13px] font-semibold hover:bg-amber-100 transition-colors shrink-0"
            >
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
              Track order
            </button>
          )}

          {/* Auth area */}
          {!user ? (
            <Link
              to="/signin"
              className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg bg-[#1B6CA8] text-white hover:bg-[#155a8a] transition-colors"
            >
              Login
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          ) : (
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setDropdownOpen(v => !v)}
                className="flex items-center gap-2 rounded-full pl-2 pr-3 py-1.5 border border-[#e5e7eb] hover:bg-gray-50 transition-colors"
              >
                {photoURL ? (
                  <img src={photoURL} alt={firstName} referrerPolicy="no-referrer" className="w-6 h-6 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-[#1B6CA8] flex items-center justify-center shrink-0">
                    <span className="text-[9px] font-bold text-white leading-none">{initials}</span>
                  </div>
                )}
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
                    onClick={() => { setDropdownOpen(false); navigate('/profile') }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    My profile
                  </button>
                  {role === 'merchant' && (
                    <button
                      onClick={() => { setDropdownOpen(false); navigate('/merchant') }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Dashboard
                    </button>
                  )}
                  {role === 'rider' && (
                    <button
                      onClick={() => { setDropdownOpen(false); navigate('/rider') }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      My Deliveries
                    </button>
                  )}
                  {role === 'admin' && (
                    <button
                      onClick={() => { setDropdownOpen(false); navigate('/admin') }}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Admin Panel
                    </button>
                  )}
                  {(role === 'customer' || !role) && (
                    <>
                      <button
                        onClick={() => { setDropdownOpen(false); navigate('/my-orders') }}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        My orders
                      </button>
                      <button
                        onClick={() => { setDropdownOpen(false); navigate(activeOrder ? `/order-tracking?id=${activeOrder.id}` : '/order-tracking') }}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Track order
                      </button>
                    </>
                  )}
                  <div className="h-px bg-[#e5e7eb] mx-2" />
                  <button
                    onClick={() => { setDropdownOpen(false); handleSignOut() }}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-50 transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile: avatar + hamburger */}
        <div className="flex items-center gap-2 ml-auto md:hidden">
          {!user ? (
            <Link
              to="/signin"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#1B6CA8] text-white"
            >
              Login
            </Link>
          ) : (
            photoURL
              ? <img src={photoURL} alt={firstName} referrerPolicy="no-referrer" className="w-7 h-7 rounded-full object-cover shrink-0" />
              : <div className="w-7 h-7 rounded-full bg-[#1B6CA8] flex items-center justify-center shrink-0">
                  <span className="text-[9px] font-bold text-white leading-none">{initials}</span>
                </div>
          )}
          <button
            onClick={() => setMobileMenuOpen(v => !v)}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-[#e5e7eb] text-gray-600 hover:bg-gray-50 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div ref={mobileMenuRef} className="md:hidden pointer-events-auto mt-2 bg-white rounded-2xl border border-[#e5e7eb] shadow-xl overflow-hidden">
          {/* Search */}
          <div className="p-3 border-b border-[#e5e7eb]">
            <div className="relative w-full">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Search shops or locations..."
                className="w-full pl-9 pr-4 py-2.5 rounded-full text-sm outline-none bg-white border border-[#e5e7eb] text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-[#1B6CA8]/30 focus:border-[#1B6CA8]"
                onKeyDown={e => {
                  if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                    navigate(`/browse?search=${encodeURIComponent(e.currentTarget.value.trim())}`)
                    setMobileMenuOpen(false)
                  }
                }}
              />
            </div>
          </div>

          {/* Nav links */}
          <div className="p-2">
            <a href="/#nearby-shops" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-colors">Nearby shops</a>
            <a href="/#how-it-works" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-colors">How it works</a>
            <a href="/#testimonials"  onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-colors">Reviews</a>
          </div>

          {/* User links */}
          {user ? (
            <div className="border-t border-[#e5e7eb] p-2">
              {activeOrder && (
                <button
                  onClick={() => { setMobileMenuOpen(false); navigate(`/order-tracking?id=${activeOrder.id}`) }}
                  className="w-full flex items-center gap-2.5 px-4 py-3 mb-1 text-sm font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-xl transition-colors"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                  Track active order
                </button>
              )}
              <button onClick={() => { setMobileMenuOpen(false); navigate('/profile') }} className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-colors">My profile</button>
              {role === 'merchant' && <button onClick={() => { setMobileMenuOpen(false); navigate('/merchant') }} className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-colors">Dashboard</button>}
              {role === 'rider'    && <button onClick={() => { setMobileMenuOpen(false); navigate('/rider') }}    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-colors">My Deliveries</button>}
              {role === 'admin'    && <button onClick={() => { setMobileMenuOpen(false); navigate('/admin') }}    className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors">Admin Panel</button>}
              {(role === 'customer' || !role) && <>
                <button onClick={() => { setMobileMenuOpen(false); navigate('/my-orders') }}     className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-colors">My orders</button>
                <button onClick={() => { setMobileMenuOpen(false); navigate(activeOrder ? `/order-tracking?id=${activeOrder.id}` : '/order-tracking') }} className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-colors">Track order</button>
              </>}
              <div className="h-px bg-[#e5e7eb] mx-2 my-1" />
              <button onClick={() => { setMobileMenuOpen(false); handleSignOut() }} className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-50 rounded-xl transition-colors">Sign out</button>
            </div>
          ) : null}
        </div>
      )}
    </header>
  )
}
