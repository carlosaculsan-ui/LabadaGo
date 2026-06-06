import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { MOCK_SHOPS, CARD_COLORS } from '../data/mockShops'

function Stars({ rating }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <svg
          key={n}
          className={`w-4 h-4 ${n <= Math.round(rating) ? 'text-[#F5A623]' : 'text-gray-200'}`}
          viewBox="0 0 20 20" fill="currentColor"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  )
}

function DemoModal({ name, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
          <svg viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636-.707.707M21 12h-1M4 12H3m3.343-5.657-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <h3 className="font-heading font-bold text-gray-900 text-center mb-2">Demo Shop</h3>
        <p className="text-sm text-gray-600 text-center leading-relaxed mb-5">
          <strong>{name}</strong> is a demo listing used to showcase how LabadaGo works. Bookings are not available for demo shops.
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

export default function ShopDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [shop, setShop] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showDemo, setShowDemo] = useState(false)

  const isMock = id?.startsWith('mock-')

  useEffect(() => {
    if (isMock) {
      const found = MOCK_SHOPS.find(s => s.id === id)
      setShop(found ?? null)
      setLoading(false)
    } else {
      getDoc(doc(db, 'shops', id))
        .then(snap => {
          if (snap.exists()) {
            setShop({ id: snap.id, color: CARD_COLORS[0], ...snap.data() })
          }
          setLoading(false)
        })
        .catch(() => setLoading(false))
    }
  }, [id, isMock])

  function handleBook() {
    if (isMock) {
      setShowDemo(true)
    } else {
      navigate(`/checkout?shopId=${shop.id}&shop=${encodeURIComponent(shop.name)}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F7FA] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-gray-200 border-t-[#1B6CA8] animate-spin" />
      </div>
    )
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-[#F4F7FA] flex flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="font-heading font-bold text-gray-900 text-xl">Shop not found</p>
        <p className="text-sm text-gray-500">This shop may have been removed or the link is incorrect.</p>
        <button
          onClick={() => navigate('/browse')}
          className="bg-[#1B6CA8] text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-[#155a8a] transition-colors"
        >
          Browse shops
        </button>
      </div>
    )
  }

  return (
    <>
      {showDemo && <DemoModal name={shop.name} onClose={() => setShowDemo(false)} />}

      {/* Sticky top bar */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-[#e5e7eb]">
        <div className="max-w-5xl mx-auto px-4 md:px-8 h-14 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors shrink-0"
          >
            <svg className="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <p className="font-heading font-bold text-gray-900 text-[15px] truncate">{shop.name}</p>
          {isMock && (
            <span className="text-[10px] font-medium bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full shrink-0">Demo</span>
          )}
        </div>
      </div>

      {/* Hero */}
      <div className={`w-full h-64 md:h-80 relative overflow-hidden ${shop.color ?? 'bg-[#DBEAFE]'}`}>
        {shop.image && (
          <img src={shop.image} alt={shop.name} className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        {isMock ? (
          <div className="absolute top-4 left-4 bg-black/50 text-white text-[11px] font-medium px-2.5 py-1 rounded-full">
            Demo listing
          </div>
        ) : shop.isFeatured ? (
          <div className="absolute top-4 left-4 bg-[#F5A623] text-[#0D3F6B] text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wide">
            Most booked near you
          </div>
        ) : null}
        <div className="absolute bottom-0 left-0 right-0 px-4 md:px-8 pb-5">
          <div className="max-w-5xl mx-auto flex items-end justify-between gap-4">
            <div>
              <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-white leading-tight">{shop.name}</h1>
              <p className="text-white/70 text-sm mt-1">{shop.address}</p>
            </div>
            <span className={[
              'text-sm font-semibold px-3 py-1.5 rounded-full shrink-0',
              shop.isOpen
                ? 'bg-green-400/20 text-green-300 border border-green-400/40'
                : 'bg-red-400/20 text-red-300 border border-red-400/40',
            ].join(' ')}>
              {shop.isOpen ? '● Open now' : '● Closed'}
            </span>
          </div>
        </div>
      </div>

      {/* Quick stats strip */}
      <div className="border-b border-[#e5e7eb] bg-white">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <div className="flex items-center gap-1.5">
            <Stars rating={shop.rating} />
            <span className="font-bold text-gray-800">{shop.rating}</span>
            {shop.reviewCount && <span className="text-gray-400 text-xs">({shop.reviewCount} reviews)</span>}
          </div>
          <span className="text-gray-300">·</span>
          <span className="text-gray-600">{shop.distanceKm} km away</span>
          <span className="text-gray-300">·</span>
          <span className="font-semibold text-[#1B6CA8]">From ₱{shop.pricePerKg}/kg</span>
          {shop.isSameDay && (
            <>
              <span className="text-gray-300">·</span>
              <span className="text-emerald-600 font-medium flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Same-day available
              </span>
            </>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-10 flex flex-col md:flex-row gap-8 pb-28 md:pb-12">

        {/* Left column — all content */}
        <div className="flex-1 min-w-0 space-y-8">

          {/* Service type pills */}
          {shop.services?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {shop.services.map(svc => (
                <span key={svc} className="text-sm font-medium bg-[#E8F4FD] text-[#0C447C] px-3 py-1 rounded-full">
                  {svc}
                </span>
              ))}
            </div>
          )}

          {/* About */}
          {shop.about && (
            <section>
              <h2 className="font-heading font-bold text-[15px] text-gray-900 mb-2">About</h2>
              <p className="text-sm text-gray-600 leading-relaxed">{shop.about}</p>
            </section>
          )}

          {/* Services & Pricing */}
          {shop.servicePricing?.length > 0 && (
            <section>
              <h2 className="font-heading font-bold text-[15px] text-gray-900 mb-3">Services & pricing</h2>
              <div className="space-y-2">
                {shop.servicePricing.map((svc, i) => (
                  <div key={i} className="flex items-center justify-between py-3 px-4 rounded-xl border border-[#e5e7eb] bg-[#FAFAFA]">
                    <div className="min-w-0 mr-4">
                      <p className="text-sm font-semibold text-gray-800">{svc.name}</p>
                      {svc.desc && <p className="text-xs text-gray-500 mt-0.5 leading-snug">{svc.desc}</p>}
                    </div>
                    <span className="text-sm font-bold text-[#1B6CA8] whitespace-nowrap shrink-0">{svc.price}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Amenities */}
          {shop.amenities?.length > 0 && (
            <section>
              <h2 className="font-heading font-bold text-[15px] text-gray-900 mb-3">What's included</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {shop.amenities.map((a, i) => (
                  <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-[#F4F9FF] border border-[#D6EAF8] text-sm text-gray-700">
                    <svg className="w-4 h-4 text-[#1B6CA8] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {a}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Reviews */}
          {shop.reviews?.length > 0 && (
            <section>
              <div className="flex items-baseline gap-2 mb-3">
                <h2 className="font-heading font-bold text-[15px] text-gray-900">Reviews</h2>
                {shop.reviewCount && (
                  <span className="text-xs text-gray-400">{shop.reviewCount} total</span>
                )}
              </div>
              <div className="space-y-3">
                {shop.reviews.map((r, i) => (
                  <div key={i} className="p-4 rounded-xl border border-[#e5e7eb] bg-white">
                    <div className="flex items-center justify-between mb-2.5 gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-[#1B6CA8] flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {r.name[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{r.name}</p>
                          <p className="text-[11px] text-gray-400">{r.date}</p>
                        </div>
                      </div>
                      <Stars rating={r.rating} />
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{r.text}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Hours + Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {shop.hours?.length > 0 && (
              <section>
                <h2 className="font-heading font-bold text-[15px] text-gray-900 mb-3">Hours</h2>
                <div className="space-y-2">
                  {shop.hours.map((h, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-gray-500">{h.day}</span>
                      <span className={h.time === 'Closed' ? 'text-red-500 font-medium' : 'font-semibold text-gray-800'}>
                        {h.time}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {(shop.phone || shop.email) && (
              <section>
                <h2 className="font-heading font-bold text-[15px] text-gray-900 mb-3">Contact</h2>
                <div className="space-y-2.5">
                  {shop.phone && (
                    <div className="flex items-center gap-2.5 text-sm text-gray-700">
                      <svg className="w-4 h-4 text-[#1B6CA8] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {shop.phone}
                    </div>
                  )}
                  {shop.email && (
                    <div className="flex items-center gap-2.5 text-sm text-gray-700">
                      <svg className="w-4 h-4 text-[#1B6CA8] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {shop.email}
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>

        </div>

        {/* Right column — sticky CTA (desktop only) */}
        <div className="hidden md:block w-72 shrink-0">
          <div className="sticky top-20 bg-white rounded-2xl border border-[#e5e7eb] shadow-sm p-6">
            <div className="flex items-baseline gap-1 mb-1">
              <span className="font-heading font-extrabold text-3xl text-[#0D3F6B]">₱{shop.pricePerKg}</span>
              <span className="text-sm text-gray-400">/kg</span>
            </div>
            <p className="text-xs text-gray-400 mb-5 leading-snug">
              Starting price — final total calculated at checkout based on actual weight
            </p>
            <button
              onClick={handleBook}
              className={[
                'w-full font-bold py-3.5 rounded-xl text-sm transition-colors',
                isMock
                  ? 'bg-gray-100 text-gray-500 cursor-default'
                  : 'bg-[#1B6CA8] text-white hover:bg-[#155a8a]',
              ].join(' ')}
            >
              {isMock ? 'Booking unavailable' : 'Book now'}
            </button>
            {isMock && (
              <p className="text-[11px] text-gray-400 text-center mt-2">This is a demo listing</p>
            )}
            {!isMock && shop.isSameDay && (
              <p className="text-[11px] text-emerald-600 font-medium text-center mt-3 flex items-center justify-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Same-day service available
              </p>
            )}
          </div>
        </div>

      </div>

      {/* Mobile sticky bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-white border-t border-[#e5e7eb] px-4 py-3 safe-area-inset-bottom">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-[10px] text-gray-400 leading-none mb-0.5">From</p>
            <p className="font-heading font-extrabold text-xl text-[#0D3F6B]">
              ₱{shop.pricePerKg}<span className="text-xs font-normal text-gray-400">/kg</span>
            </p>
          </div>
          <button
            onClick={handleBook}
            className={[
              'flex-1 font-bold py-3 rounded-xl text-sm transition-colors',
              isMock
                ? 'bg-gray-100 text-gray-500 cursor-default'
                : 'bg-[#1B6CA8] text-white hover:bg-[#155a8a]',
            ].join(' ')}
          >
            {isMock ? 'Demo shop' : 'Book now'}
          </button>
        </div>
      </div>
    </>
  )
}
