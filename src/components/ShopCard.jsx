import { useNavigate } from 'react-router-dom'

export default function ShopCard({
  id, name, address, rating, distanceKm, pricePerKg,
  services, isOpen, isFeatured, color, image,
}) {
  const navigate = useNavigate()
  const isMock = id?.startsWith('mock-')

  return (
    <div
      onClick={() => navigate(`/shop/${id}`)}
      className={[
        'bg-white rounded-xl overflow-hidden flex flex-col h-full cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-150',
        isFeatured ? 'border border-[#1B6CA8]' : 'border border-[#e5e7eb]',
      ].join(' ')}
    >
      <div className={`${color} h-36 relative shrink-0 overflow-hidden`}>
        {image && (
          <img src={image} alt={name} className="absolute inset-0 w-full h-full object-cover" />
        )}
        {isFeatured && (
          <div className="absolute top-0 left-0 right-0 bg-[#1B6CA8]/90 text-white text-[11px] font-semibold text-center py-1.5 tracking-wide">
            Most booked near you
          </div>
        )}
        {isMock && (
          <div className="absolute top-2.5 left-2.5 bg-black/50 text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
            Demo
          </div>
        )}
        <span className={[
          'absolute top-2.5 right-2.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full',
          isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600',
        ].join(' ')}>
          {isOpen ? 'Open' : 'Closed'}
        </span>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-heading font-bold text-[15px] text-gray-900 mb-0.5 leading-snug">{name}</h3>
        <p className="text-xs text-gray-600 mb-3">{address}</p>

        <div className="flex items-center gap-1.5 text-xs mb-3">
          <span className="font-semibold text-gray-800">⭐ {rating}</span>
          <span className="text-gray-600">•</span>
          <span className="text-gray-600">{distanceKm} km away</span>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {services.map(svc => (
            <span
              key={svc}
              className="text-[11px] font-medium bg-[#E8F4FD] text-[#0C447C] px-2.5 py-0.5 rounded-full"
            >
              {svc}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-[#e5e7eb] mt-auto">
          <p className="text-sm font-bold text-gray-800">
            ₱{pricePerKg}
            <span className="text-xs font-normal text-gray-600"> /kg</span>
          </p>
          <button
            onClick={e => { e.stopPropagation(); navigate(`/shop/${id}`) }}
            className={[
              'text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors',
              isMock
                ? 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                : 'bg-[#1B6CA8] text-white hover:bg-[#155a8a]',
            ].join(' ')}
          >
            {isMock ? 'View shop' : 'Book now'}
          </button>
        </div>
      </div>
    </div>
  )
}
