import { useState, useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../lib/firebase'
import FilterSidebar from '../components/FilterSidebar'
import ShopCard from '../components/ShopCard'
import ShopDrawer from '../components/ShopDrawer'
import { MOCK_SHOPS, CARD_COLORS } from '../data/mockShops'

const CHIPS = ['All', 'Wash & Fold', 'Dry Cleaning', 'Comforters', 'Towels & Linens']

const SORT_OPTIONS = [
  { key: 'nearest', label: 'Nearest' },
  { key: 'rating',  label: 'Top rated' },
  { key: 'price',   label: 'Price' },
]

const DEFAULT_FILTERS = {
  maxDistance: 5,
  services: [],
  detergent: 'Any',
  maxPrice: 120,
  rating: null,
  openNow: false,
  sameDay: false,
}

function ShopSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-[#e5e7eb] overflow-hidden animate-pulse">
      <div className="bg-gray-200 h-36" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="h-3 bg-gray-100 rounded w-1/3" />
        <div className="flex gap-2 mt-2">
          <div className="h-5 bg-gray-100 rounded-full w-20" />
          <div className="h-5 bg-gray-100 rounded-full w-24" />
        </div>
        <div className="flex justify-between items-center pt-3 border-t border-[#e5e7eb]">
          <div className="h-4 bg-gray-200 rounded w-16" />
          <div className="h-7 bg-gray-200 rounded-lg w-20" />
        </div>
      </div>
    </div>
  )
}

export default function Browse() {
  const location = useLocation()
  const [shops, setShops] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState(() =>
    new URLSearchParams(location.search).get('search') ?? ''
  )
  const [selectedShop, setSelectedShop] = useState(null)
  const [sortBy, setSortBy] = useState('nearest')
  const [filters, setFilters] = useState(() => {
    const param = new URLSearchParams(location.search).get('service')
    const service = param && CHIPS.slice(1).includes(param) ? [param] : []
    return { ...DEFAULT_FILTERS, services: service }
  })

  const activeChip = filters.services.length === 1 && CHIPS.slice(1).includes(filters.services[0])
    ? filters.services[0]
    : 'All'

  useEffect(() => {
    getDocs(collection(db, 'shops')).then(snap => {
      const data = snap.docs.map((doc, i) => {
        const d = doc.data()
        return {
          ...d,
          id: doc.id,
          color: CARD_COLORS[i % CARD_COLORS.length],
          distanceKm: d.distanceKm ?? +(Math.random() * 4 + 0.5).toFixed(1),
        }
      })
      setShops(data.length > 0 ? data : MOCK_SHOPS)
      setLoading(false)
    }).catch(() => {
      setShops(MOCK_SHOPS)
      setLoading(false)
    })
  }, [])

  const displayed = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    const filtered = shops.filter(shop => {
      if (q && !shop.name.toLowerCase().includes(q) && !shop.address.toLowerCase().includes(q)) return false
      if (shop.distanceKm > filters.maxDistance) return false
      if (filters.services.length > 0 && !filters.services.some(s => shop.services.includes(s))) return false
      if (filters.detergent !== 'Any' && !shop.detergents.includes(filters.detergent)) return false
      if (shop.pricePerKg > filters.maxPrice) return false
      if (filters.rating === '4.5+' && shop.rating < 4.5) return false
      if (filters.rating === '4.0+' && shop.rating < 4.0) return false
      if (filters.openNow && !shop.isOpen) return false
      if (filters.sameDay && !shop.isSameDay) return false
      return true
    })

    return [...filtered].sort((a, b) => {
      if (sortBy === 'nearest') return a.distanceKm - b.distanceKm
      if (sortBy === 'rating')  return b.rating - a.rating
      if (sortBy === 'price')   return a.pricePerKg - b.pricePerKg
      return 0
    })
  }, [shops, filters, activeChip, sortBy, searchQuery])

  return (
    <>
      {/* Hero strip */}
      <section className="relative overflow-hidden min-h-screen flex flex-col justify-center -mt-[88px]">

        {/* Video background — same video as home */}
        <video
          className="absolute inset-0 w-full h-full object-cover outline-none"
          autoPlay muted loop playsInline tabIndex={-1}
          src="/Hero.mp4"
        />
        <div className="absolute inset-0 bg-[#0D3F6B]/55" />

        <div className="relative z-10 max-w-[1280px] mx-auto px-12 w-full pt-28 pb-20">
          <div className="max-w-[55%]">
            <h1 className="font-heading font-extrabold text-[4rem] leading-[1.0] tracking-tight text-white mb-5">
              Laundry picked up,{' '}
              <span className="text-[#F5A623]">washed, delivered.</span>
            </h1>
            <p className="text-white/70 text-[1.05rem] leading-relaxed mb-8">
              Browse verified laundry shops near you. Filter by service, price, and availability.
            </p>
            <div className="flex flex-wrap gap-2.5">
              {CHIPS.map(chip => (
                <button
                  key={chip}
                  onClick={() => setFilters(f => ({ ...f, services: chip === 'All' ? [] : [chip] }))}
                  className={[
                    'text-sm font-medium px-5 py-2 rounded-full transition-colors',
                    activeChip === chip
                      ? 'bg-[#F5A623] text-[#0D3F6B] font-semibold'
                      : 'bg-white/10 text-white hover:bg-white/20',
                  ].join(' ')}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section
        className="relative overflow-hidden py-12"
        style={{ background: 'linear-gradient(135deg, #0A3358, #1B6CA8, #2980C4, #0A3358)', backgroundSize: '300% 300%', animation: 'gradient-shift 15s ease infinite' }}
      >
        <div className="absolute inset-0 pointer-events-none">
          {[
            { w: 200, top: '10%', left: '5%'  },
            { w: 100, top: '60%', left: '2%'  },
            { w: 260, top: '5%',  left: '80%' },
            { w: 80,  top: '70%', left: '90%' },
            { w: 140, top: '40%', left: '50%' },
          ].map((b, i) => (
            <div
              key={i}
              className="absolute rounded-full border border-white"
              style={{
                width: b.w, height: b.w, top: b.top, left: b.left,
                opacity: 0.08 + (i % 3) * 0.04,
                animation: `${i % 2 === 0 ? 'bubble-float' : 'bubble-drift'} ${5 + i * 1.2}s ease-in-out ${-(i * 1.0).toFixed(1)}s infinite`,
              }}
            />
          ))}
        </div>
        <div className="relative z-10 max-w-[1280px] mx-auto px-8">
          <div className="grid grid-cols-5 gap-4">
            <div className="bg-white/10 border border-white/20 rounded-2xl px-6 py-6 flex flex-col items-center text-center hover:bg-white/20 hover:-translate-y-1 transition-all duration-200 cursor-default backdrop-blur-sm">
              <div className="w-11 h-11 rounded-xl bg-[#DBEAFE]/20 flex items-center justify-center mb-4">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-5 h-5">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/>
                </svg>
              </div>
              <p className="font-heading font-bold text-[1.75rem] text-white leading-none">{shops.length || 14}+</p>
              <p className="text-[11px] text-white/60 mt-2">partner shops</p>
            </div>
            <div className="bg-white/10 border border-white/20 rounded-2xl px-6 py-6 flex flex-col items-center text-center hover:bg-white/20 hover:-translate-y-1 transition-all duration-200 cursor-default backdrop-blur-sm">
              <div className="w-11 h-11 rounded-xl bg-[#FEF3C7]/20 flex items-center justify-center mb-4">
                <svg viewBox="0 0 24 24" fill="#F5A623" className="w-5 h-5">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <p className="font-heading font-bold text-[1.75rem] text-white leading-none">4.8★</p>
              <p className="text-[11px] text-white/60 mt-2">avg rating</p>
            </div>
            <div className="bg-white/10 border border-white/20 rounded-2xl px-6 py-6 flex flex-col items-center text-center hover:bg-white/20 hover:-translate-y-1 transition-all duration-200 cursor-default backdrop-blur-sm">
              <div className="w-11 h-11 rounded-xl bg-[#D1FAE5]/20 flex items-center justify-center mb-4">
                <svg viewBox="0 0 24 24" fill="#34D399" className="w-5 h-5">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
              </div>
              <p className="font-heading font-bold text-[1.75rem] text-white leading-none">Same-day</p>
              <p className="text-[11px] text-white/60 mt-2">pickup available</p>
            </div>
            <div className="bg-white/10 border border-white/20 rounded-2xl px-6 py-6 flex flex-col items-center text-center hover:bg-white/20 hover:-translate-y-1 transition-all duration-200 cursor-default backdrop-blur-sm">
              <div className="w-11 h-11 rounded-xl bg-[#EDE9FE]/20 flex items-center justify-center mb-4">
                <svg viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="2" className="w-5 h-5">
                  <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                </svg>
              </div>
              <p className="font-heading font-bold text-[1.75rem] text-white leading-none">₱48+</p>
              <p className="text-[11px] text-white/60 mt-2">starting price / kg</p>
            </div>
            <div className="bg-white/10 border border-white/20 rounded-2xl px-6 py-6 flex flex-col items-center text-center hover:bg-white/20 hover:-translate-y-1 transition-all duration-200 cursor-default backdrop-blur-sm">
              <div className="w-11 h-11 rounded-xl bg-[#CCFBF1]/20 flex items-center justify-center mb-4">
                <svg viewBox="0 0 24 24" fill="none" stroke="#2DD4BF" strokeWidth="2" className="w-5 h-5">
                  <rect x="1" y="3" width="15" height="13"/><polygon points="16,8 20,8 23,11 23,16 16,16 16,8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
                </svg>
              </div>
              <p className="font-heading font-bold text-[1.75rem] text-white leading-none">2-hr</p>
              <p className="text-[11px] text-white/60 mt-2">pickup window</p>
            </div>
          </div>
        </div>
      </section>

      {/* Body */}
      <div className="max-w-[1280px] mx-auto px-8 py-8 flex gap-8">
        <FilterSidebar
          services={filters.services}
          onServicesChange={services => setFilters(f => ({ ...f, services }))}
          onFilterChange={setFilters}
        />

        <div className="flex-1 min-w-0">
          {/* Sort + count bar */}
          <div className="flex items-center gap-2 mb-6">
            <span className="text-sm text-gray-600 mr-1">Sort by</span>
            {SORT_OPTIONS.map(opt => (
              <button
                key={opt.key}
                onClick={() => setSortBy(opt.key)}
                className={[
                  'text-sm font-medium px-4 py-1.5 rounded-lg border transition-colors',
                  sortBy === opt.key
                    ? 'bg-[#1B6CA8] text-white border-[#1B6CA8]'
                    : 'bg-white text-gray-600 border-[#e5e7eb] hover:border-[#1B6CA8] hover:text-[#1B6CA8]',
                ].join(' ')}
              >
                {opt.label}
              </button>
            ))}
            {!loading && (
              <span className="ml-auto text-sm text-gray-600">
                {displayed.length} shop{displayed.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-3 gap-5">
              <ShopSkeleton />
              <ShopSkeleton />
              <ShopSkeleton />
            </div>
          ) : displayed.length > 0 ? (
            <div className="grid grid-cols-3 gap-5">
              {displayed.map(shop => (
                <ShopCard key={shop.id} {...shop} onSelect={() => setSelectedShop(shop)} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-gray-600">
              <span className="text-4xl mb-3">🧺</span>
              <p className="text-sm">No shops match your filters.</p>
            </div>
          )}
        </div>
      </div>

      <ShopDrawer shop={selectedShop} onClose={() => setSelectedShop(null)} />
    </>
  )
}
