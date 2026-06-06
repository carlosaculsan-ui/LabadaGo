import { useState, useEffect, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../lib/firebase'
import FilterSidebar from '../components/FilterSidebar'
import ShopCard from '../components/ShopCard'
import { MOCK_SHOPS, CARD_COLORS } from '../data/mockShops'

const CHIPS = ['All', 'Wash & Fold', 'Dry Cleaning', 'Comforters', 'Towels & Linens']

const SORT_OPTIONS = [
  { key: 'all',     label: 'All' },
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
  const navigate  = useNavigate()
  const [shops, setShops] = useState([])
  const [loading, setLoading] = useState(true)
  const searchQuery = useMemo(
    () => new URLSearchParams(location.search).get('search') ?? '',
    [location.search]
  )
  const [sortBy, setSortBy] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState(() => {
    const param = new URLSearchParams(location.search).get('service')
    const service = param && CHIPS.slice(1).includes(param) ? [param] : []
    return { ...DEFAULT_FILTERS, services: service }
  })

  const activeChip = filters.services.length === 1 && CHIPS.slice(1).includes(filters.services[0])
    ? filters.services[0]
    : 'All'

  function resetFilters() {
    setFilters(DEFAULT_FILTERS)
    navigate('/browse', { replace: true })
  }

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    filters.maxDistance !== DEFAULT_FILTERS.maxDistance ||
    filters.services.length > 0 ||
    filters.detergent !== 'Any' ||
    filters.maxPrice !== DEFAULT_FILTERS.maxPrice ||
    filters.rating !== null ||
    filters.openNow ||
    filters.sameDay

  useEffect(() => {
    getDocs(collection(db, 'shops')).then(snap => {
      const real = snap.docs.map((doc, i) => {
        const d = doc.data()
        return {
          ...d,
          id: doc.id,
          color: CARD_COLORS[i % CARD_COLORS.length],
          distanceKm: d.distanceKm ?? +(Math.random() * 4 + 0.5).toFixed(1),
        }
      })
      setShops([...real, ...MOCK_SHOPS])
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

    if (sortBy === 'all') return filtered
    return [...filtered].sort((a, b) => {
      if (sortBy === 'nearest') return a.distanceKm - b.distanceKm
      if (sortBy === 'rating')  return b.rating - a.rating
      if (sortBy === 'price')   return a.pricePerKg - b.pricePerKg
      return 0
    })
  }, [shops, filters, sortBy, searchQuery])

  return (
    <>
      {/* Page header */}
      <div className="border-b border-[#e5e7eb] bg-white">
        <div className="max-w-[1280px] mx-auto px-4 md:px-8 py-4 flex flex-col gap-3">
          <h1 className="font-heading font-bold text-xl text-gray-900">Browse Shops</h1>
          <div className="flex gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
            {CHIPS.map(chip => (
              <button
                key={chip}
                onClick={() => setFilters(f => ({ ...f, services: chip === 'All' ? [] : [chip] }))}
                className={[
                  'text-sm font-medium px-4 py-1.5 rounded-full whitespace-nowrap shrink-0 transition-colors',
                  activeChip === chip
                    ? 'bg-[#1B6CA8] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
                ].join(' ')}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile filter overlay */}
      {showFilters && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowFilters(false)} />
          <div className="relative z-50 bg-white w-[280px] h-full overflow-y-auto flex flex-col">
            <div className="px-4 py-4 flex items-center justify-between border-b border-[#e5e7eb] shrink-0">
              <p className="font-heading font-semibold text-gray-900">Filters</p>
              <button onClick={() => setShowFilters(false)} className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <FilterSidebar
              filters={filters}
              onFilterChange={patch => setFilters(f => ({ ...f, ...patch }))}
            />
          </div>
        </div>
      )}

      {/* Body */}
      <div className="max-w-[1280px] mx-auto px-4 md:px-8 py-6 md:py-8 flex gap-8">
        {/* Desktop sidebar */}
        <div className="hidden md:block">
          <FilterSidebar
            filters={filters}
            onFilterChange={patch => setFilters(f => ({ ...f, ...patch }))}
          />
        </div>

        <div className="flex-1 min-w-0">
          {/* Mobile: filter button */}
          <div className="flex items-center gap-3 mb-4 md:hidden">
            <button
              onClick={() => setShowFilters(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#e5e7eb] text-sm font-medium text-gray-700 bg-white hover:border-[#1B6CA8] hover:text-[#1B6CA8] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"/></svg>
              Filters
              {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-[#1B6CA8] shrink-0" />}
            </button>
            {!loading && <span className="text-sm text-gray-500">{displayed.length} shop{displayed.length !== 1 ? 's' : ''}</span>}
          </div>

          {/* Sort + count bar */}
          <div className="flex items-center gap-2 mb-5 md:mb-6 flex-wrap">
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
              <div className="ml-auto flex items-center gap-3">
                {hasActiveFilters && (
                  <button
                    onClick={resetFilters}
                    className="text-xs font-medium text-[#DC2626] hover:underline underline-offset-2"
                  >
                    Clear filters ×
                  </button>
                )}
                <span className="hidden md:inline text-sm text-gray-600">
                  {displayed.length} shop{displayed.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:grid-cols-3 md:gap-5">
              <ShopSkeleton />
              <ShopSkeleton />
              <ShopSkeleton />
            </div>
          ) : displayed.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:grid-cols-3 md:gap-5">
              {displayed.map(shop => (
                <ShopCard key={shop.id} {...shop} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <span className="text-4xl mb-3">🧺</span>
              <p className="text-base font-semibold text-gray-800 mb-1">No shops match your filters</p>
              <p className="text-sm text-gray-500 mb-6">
                Try widening your distance range or removing a filter.
              </p>
              <button
                onClick={resetFilters}
                className="bg-[#1B6CA8] text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-[#155a8a] transition-colors"
              >
                Show all shops
              </button>
            </div>
          )}
        </div>
      </div>

    </>
  )
}
