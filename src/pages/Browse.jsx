import { useState, useMemo } from 'react'
import FilterSidebar from '../components/FilterSidebar'
import ShopCard from '../components/ShopCard'

const CHIPS = ['All', 'Wash & Fold', 'Dry Cleaning', 'Comforters', 'Towels & Linens']

const SORT_OPTIONS = [
  { key: 'nearest', label: 'Nearest' },
  { key: 'rating', label: 'Top rated' },
  { key: 'price', label: 'Price' },
]

const SHOPS = [
  {
    id: 1,
    name: 'Bubbles Laundry Hub',
    address: '23 Tomas Morato Ave, Quezon City',
    rating: 4.8,
    distanceKm: 0.4,
    pricePerKg: 65,
    services: ['Wash & Fold', 'Dry Cleaning'],
    detergents: ['Ariel', 'Tide'],
    isOpen: true,
    isSameDay: true,
    isFeatured: true,
    color: 'bg-[#DBEAFE]',
  },
  {
    id: 2,
    name: 'FreshPress Express',
    address: '5 Scout Albano St, Quezon City',
    rating: 4.6,
    distanceKm: 0.9,
    pricePerKg: 55,
    services: ['Wash & Fold', 'Towels & Linens'],
    detergents: ['Tide', 'Breeze'],
    isOpen: true,
    isSameDay: true,
    isFeatured: false,
    color: 'bg-[#D1FAE5]',
  },
  {
    id: 3,
    name: 'CleanSuds Laundromat',
    address: '88 Timog Ave, Quezon City',
    rating: 4.3,
    distanceKm: 1.4,
    pricePerKg: 48,
    services: ['Wash & Fold', 'Comforters'],
    detergents: ['Ariel', 'Hypoallergenic'],
    isOpen: false,
    isSameDay: false,
    isFeatured: false,
    color: 'bg-[#FEE2E2]',
  },
  {
    id: 4,
    name: 'Pristine Garments Care',
    address: '12 Bohol Ave, Quezon City',
    rating: 4.9,
    distanceKm: 1.8,
    pricePerKg: 90,
    services: ['Dry Cleaning', 'Comforters'],
    detergents: ['Breeze', 'Hypoallergenic'],
    isOpen: true,
    isSameDay: false,
    isFeatured: true,
    color: 'bg-[#EDE9FE]',
  },
  {
    id: 5,
    name: 'Sudsy Corner',
    address: '41 Mother Ignacia Ave, Quezon City',
    rating: 4.1,
    distanceKm: 2.3,
    pricePerKg: 42,
    services: ['Wash & Fold', 'Towels & Linens'],
    detergents: ['Tide'],
    isOpen: true,
    isSameDay: true,
    isFeatured: false,
    color: 'bg-[#FEF3C7]',
  },
  {
    id: 6,
    name: 'The Linen Club',
    address: '7 Sct. Madrinan St, Quezon City',
    rating: 4.7,
    distanceKm: 3.0,
    pricePerKg: 75,
    services: ['Comforters', 'Towels & Linens', 'Dry Cleaning'],
    detergents: ['Ariel', 'Tide', 'Breeze'],
    isOpen: false,
    isSameDay: false,
    isFeatured: false,
    color: 'bg-[#CCFBF1]',
  },
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

export default function Browse() {
  const [activeChip, setActiveChip] = useState('All')
  const [sortBy, setSortBy] = useState('nearest')
  const [filters, setFilters] = useState(DEFAULT_FILTERS)

  const displayed = useMemo(() => {
    const filtered = SHOPS.filter(shop => {
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
      if (sortBy === 'rating') return b.rating - a.rating
      if (sortBy === 'price') return a.pricePerKg - b.pricePerKg
      return 0
    })
  }, [filters, activeChip, sortBy])

  return (
    <>
      {/* Hero strip */}
      <section className="bg-[#0D3F6B]">
        <div className="max-w-[1280px] mx-auto px-8 py-14 grid grid-cols-2 gap-16 items-center">
          <div>
            <h1 className="font-heading font-extrabold text-[2.75rem] leading-tight text-white mb-4">
              Laundry picked up,{' '}
              <span className="text-[#F5A623]">washed, delivered.</span>
            </h1>
            <p className="text-[#8DB8D8] text-[15px] leading-relaxed mb-8">
              Browse verified laundry shops near you. Filter by service, price, and availability.
            </p>
            <div className="flex flex-wrap gap-2">
              {CHIPS.map(chip => (
                <button
                  key={chip}
                  onClick={() => setActiveChip(chip)}
                  className={[
                    'text-sm font-medium px-4 py-1.5 rounded-full transition-colors',
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

          <div className="h-64 rounded-2xl border-2 border-dashed border-white/25 flex items-center justify-center">
            <span className="text-white/40 text-sm">Hero image slot</span>
          </div>
        </div>
      </section>

      {/* Body */}
      <div className="max-w-[1280px] mx-auto px-8 py-8 flex gap-8">
        <FilterSidebar onFilterChange={setFilters} />

        <div className="flex-1 min-w-0">
          {/* Sort + count bar */}
          <div className="flex items-center gap-2 mb-6">
            <span className="text-sm text-gray-400 mr-1">Sort by</span>
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
            <span className="ml-auto text-sm text-gray-400">
              {displayed.length} shop{displayed.length !== 1 ? 's' : ''}
            </span>
          </div>

          {displayed.length > 0 ? (
            <div className="grid grid-cols-3 gap-5">
              {displayed.map(shop => (
                <ShopCard key={shop.id} {...shop} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
              <span className="text-4xl mb-3">🧺</span>
              <p className="text-sm">No shops match your filters.</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
