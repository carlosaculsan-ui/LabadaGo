import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function DemoModal({ name, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
          <svg viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
          </svg>
        </div>
        <h3 className="font-heading font-bold text-gray-900 text-center mb-2">Demo Shop</h3>
        <p className="text-sm text-gray-600 text-center leading-relaxed mb-5">
          <strong>{name}</strong> is a demo listing used to showcase how LabadaGo works.
          Bookings are not available for demo shops.
          <br /><br />
          Browse our real partner shops to place an actual order!
        </p>
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-[#1B6CA8] text-white text-sm font-semibold hover:bg-[#155a8a] transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  )
}

export default function ShopCard({
  id, name, address, rating, distanceKm, pricePerKg,
  services, isOpen, isFeatured, color, image, onSelect,
}) {
  const navigate = useNavigate()
  const [showDemo, setShowDemo] = useState(false)
  const isMock = id?.startsWith('mock-')

  function handleBook(e) {
    e.stopPropagation()
    if (isMock) {
      setShowDemo(true)
    } else {
      navigate(`/checkout?shopId=${id}&shop=${encodeURIComponent(name)}`)
    }
  }

  return (
    <>
      {showDemo && <DemoModal name={name} onClose={() => setShowDemo(false)} />}

      <div
        onClick={() => onSelect ? onSelect() : navigate('/browse')}
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
            <div className="absolute top-0 left-0 right-0 bg-amber-400/90 text-amber-900 text-[11px] font-semibold text-center py-1.5 tracking-wide">
              Demo listing
            </div>
          )}
          <span
            className={[
              'absolute top-2.5 right-2.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full',
              isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600',
            ].join(' ')}
          >
            {isOpen ? 'Open' : 'Busy'}
          </span>
        </div>

        <div className="p-4 flex flex-col flex-1">
          <h3 className="font-heading font-bold text-[15px] text-gray-900 mb-0.5 leading-snug">
            {name}
          </h3>
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
              onClick={handleBook}
              className={[
                'text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors',
                isMock
                  ? 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  : 'bg-[#1B6CA8] text-white hover:bg-[#155a8a]',
              ].join(' ')}
            >
              {isMock ? 'Demo' : 'Book now'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
