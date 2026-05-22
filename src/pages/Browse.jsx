import { useState, useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../lib/firebase'
import FilterSidebar from '../components/FilterSidebar'
import ShopCard from '../components/ShopCard'

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

const CARD_COLORS = [
  'bg-[#DBEAFE]', 'bg-[#D1FAE5]', 'bg-[#FEE2E2]',
  'bg-[#EDE9FE]', 'bg-[#FEF3C7]', 'bg-[#CCFBF1]',
]

const MOCK_SHOPS = [
  {
    id: 'mock-1', name: 'Sunshine Laundry',      address: '12 Rizal St, Barangay Sta. Cruz',
    rating: 4.9, distanceKm: 0.8, pricePerKg: 65,
    services: ['Wash & Fold', 'Dry Cleaning'],    detergents: ['Any', 'Ariel', 'Tide'],
    isOpen: true,  isSameDay: true,  isFeatured: true,  color: CARD_COLORS[0], image: '/SunshineLaundry.png',
  },
  {
    id: 'mock-2', name: 'CleanWave Express',      address: '45 Mabini Ave, Poblacion',
    rating: 4.7, distanceKm: 1.4, pricePerKg: 55,
    services: ['Wash & Fold', 'Comforters'],       detergents: ['Any', 'Breeze'],
    isOpen: true,  isSameDay: true,  isFeatured: false, color: CARD_COLORS[1], image: '/CleanwaveExpress.png',
  },
  {
    id: 'mock-3', name: 'FreshFold Laundromat',   address: '8 Del Pilar Rd, San Antonio',
    rating: 4.6, distanceKm: 2.1, pricePerKg: 50,
    services: ['Wash & Fold', 'Towels & Linens'],  detergents: ['Any', 'Tide', 'Hypoallergenic'],
    isOpen: false, isSameDay: false, isFeatured: false, color: CARD_COLORS[2], image: '/FreshFold.png',
  },
  {
    id: 'mock-4', name: 'BubbleKing Laundry',     address: '33 Luna Blvd, Bagong Silang',
    rating: 4.8, distanceKm: 2.7, pricePerKg: 60,
    services: ['Dry Cleaning', 'Comforters'],      detergents: ['Any', 'Ariel'],
    isOpen: true,  isSameDay: false, isFeatured: false, color: CARD_COLORS[3], image: '/BubbleKingLaundry.png',
  },
  {
    id: 'mock-5', name: 'SpinCycle PH',           address: '21 Bonifacio St, Laging Handa',
    rating: 4.5, distanceKm: 3.2, pricePerKg: 48,
    services: ['Wash & Fold'],                     detergents: ['Any', 'Breeze', 'Tide'],
    isOpen: true,  isSameDay: true,  isFeatured: false, color: CARD_COLORS[4], image: '/SpinCyclePH.jpg',
  },
  {
    id: 'mock-6', name: 'PureFresh Laundry',      address: '9 Aguinaldo St, Pinyahan',
    rating: 4.4, distanceKm: 4.1, pricePerKg: 52,
    services: ['Wash & Fold', 'Dry Cleaning', 'Comforters'], detergents: ['Any', 'Hypoallergenic'],
    isOpen: false, isSameDay: false, isFeatured: false, color: CARD_COLORS[5], image: '/PureFreshLaundry.png',
  },
]

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
  const [activeChip, setActiveChip] = useState(() => {
    const param = new URLSearchParams(location.search).get('service')
    return param && CHIPS.includes(param) ? param : 'All'
  })
  const [sortBy, setSortBy] = useState('nearest')
  const [filters, setFilters] = useState(DEFAULT_FILTERS)

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
    const filtered = shops.filter(shop => {
      if (shop.distanceKm > filters.maxDistance) return false
      if (filters.services.length > 0 && !filters.services.some(s => shop.services.includes(s))) return false
      if (activeChip !== 'All' && !shop.services.includes(activeChip)) return false
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
  }, [shops, filters, activeChip, sortBy])

  return (
    <>
      {/* Hero strip */}
      <section className="relative overflow-hidden min-h-screen flex flex-col justify-center -mt-[88px]">

        {/* Video background — same video as home */}
        <video
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay muted loop playsInline
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
                  onClick={() => setActiveChip(chip)}
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

      {/* Body */}
      <div className="max-w-[1280px] mx-auto px-8 py-8 flex gap-8">
        <FilterSidebar onFilterChange={setFilters} />

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
                <ShopCard key={shop.id} {...shop} />
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
    </>
  )
}
