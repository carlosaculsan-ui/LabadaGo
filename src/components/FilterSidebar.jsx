const SERVICE_TYPES = ['Wash & Fold', 'Dry Cleaning', 'Comforters', 'Towels & Linens']
const DETERGENTS = ['Any', 'Ariel', 'Tide', 'Breeze', 'Hypoallergenic']

function SectionLabel({ children }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-600 mb-3">
      {children}
    </p>
  )
}

export default function FilterSidebar({ filters, onFilterChange }) {
  const { maxDistance, services, detergent, maxPrice, rating, openNow, sameDay } = filters

  function toggleService(svc) {
    const next = services.includes(svc)
      ? services.filter(s => s !== svc)
      : [...services, svc]
    onFilterChange({ services: next })
  }

  function toggleRating(r) {
    onFilterChange({ rating: rating === r ? null : r })
  }

  return (
    <aside className="w-60 shrink-0 self-start md:sticky md:top-16 md:h-[calc(100vh-4rem)] overflow-y-auto">
      <div className="py-4 px-4 md:py-6 md:pr-5 md:px-0 space-y-7">

        <div>
          <SectionLabel>Distance</SectionLabel>
          <input
            type="range" min={0} max={5} step={0.5} value={maxDistance}
            onChange={e => onFilterChange({ maxDistance: parseFloat(e.target.value) })}
            className="w-full accent-[#1B6CA8]"
          />
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>0 km</span>
            <span className="font-semibold text-[#1B6CA8]">{maxDistance} km</span>
          </div>
        </div>

        <div>
          <SectionLabel>Service type</SectionLabel>
          <div className="space-y-2.5">
            {SERVICE_TYPES.map(svc => (
              <label key={svc} className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={services.includes(svc)}
                  onChange={() => toggleService(svc)}
                  className="accent-[#1B6CA8] w-4 h-4"
                />
                <span className="text-sm text-gray-700">{svc}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <SectionLabel>Detergent</SectionLabel>
          <div className="space-y-2.5">
            {DETERGENTS.map(d => (
              <label key={d} className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="detergent"
                  checked={detergent === d}
                  onChange={() => onFilterChange({ detergent: d })}
                  className="accent-[#1B6CA8] w-4 h-4"
                />
                <span className="text-sm text-gray-700">{d}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <SectionLabel>Price per kilo</SectionLabel>
          <input
            type="range" min={30} max={120} step={5} value={maxPrice}
            onChange={e => onFilterChange({ maxPrice: parseInt(e.target.value, 10) })}
            className="w-full accent-[#1B6CA8]"
          />
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>₱30</span>
            <span className="font-semibold text-[#1B6CA8]">₱{maxPrice}</span>
          </div>
        </div>

        <div>
          <SectionLabel>Rating</SectionLabel>
          <div className="space-y-2.5">
            {['4.5+', '4.0+'].map(r => (
              <label key={r} className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rating === r}
                  onChange={() => toggleRating(r)}
                  className="accent-[#1B6CA8] w-4 h-4"
                />
                <span className="text-sm text-gray-700">⭐ {r} stars</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <SectionLabel>Availability</SectionLabel>
          <div className="space-y-2.5">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={openNow}
                onChange={() => onFilterChange({ openNow: !openNow })}
                className="accent-[#1B6CA8] w-4 h-4"
              />
              <span className="text-sm text-gray-700">Open now</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={sameDay}
                onChange={() => onFilterChange({ sameDay: !sameDay })}
                className="accent-[#1B6CA8] w-4 h-4"
              />
              <span className="text-sm text-gray-700">Same-day</span>
            </label>
          </div>
        </div>

      </div>
    </aside>
  )
}
