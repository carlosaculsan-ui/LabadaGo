import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

function Stars({ rating }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <svg
          key={n}
          className={`w-3.5 h-3.5 ${n <= Math.round(rating) ? 'text-[#F5A623]' : 'text-gray-200'}`}
          viewBox="0 0 20 20" fill="currentColor"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  )
}

export default function ShopDrawer({ shop, onClose }) {
  const navigate   = useNavigate()
  const [showDemo, setShowDemo] = useState(false)
  const isMock = shop?.id?.startsWith('mock-')

  useEffect(() => {
    document.body.style.overflow = shop ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [shop])

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={[
          'fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40 transition-opacity duration-300',
          shop ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        ].join(' ')}
      />

      {/* Drawer */}
      <div
        className={[
          'fixed right-0 top-0 h-full w-full md:w-[500px] bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-out',
          shop ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
      >
        {!shop ? null : (
          <>
            {/* Hero */}
            <div className="relative h-52 shrink-0 overflow-hidden bg-[#DBEAFE]">
              {shop.image && (
                <img src={shop.image} alt={shop.name} className="absolute inset-0 w-full h-full object-cover" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />

              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {shop.isFeatured && (
                <div className="absolute top-4 left-4 bg-[#F5A623] text-[#0D3F6B] text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wide">
                  Most booked near you
                </div>
              )}

              <div className="absolute bottom-0 left-0 right-0 px-5 pb-4">
                <div className="flex items-end justify-between">
                  <div>
                    <h2 className="font-heading font-extrabold text-xl text-white leading-tight">{shop.name}</h2>
                    <p className="text-white/70 text-xs mt-0.5">{shop.address}</p>
                  </div>
                  <span className={[
                    'text-xs font-semibold px-2.5 py-1 rounded-full mb-0.5',
                    shop.isOpen
                      ? 'bg-green-400/20 text-green-300 border border-green-400/40'
                      : 'bg-red-400/20 text-red-300 border border-red-400/40',
                  ].join(' ')}>
                    {shop.isOpen ? '● Open' : '● Closed'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick stats */}
            <div className="flex items-center gap-4 px-5 py-3 border-b border-[#e5e7eb] text-sm shrink-0">
              <div className="flex items-center gap-1.5">
                <Stars rating={shop.rating} />
                <span className="font-bold text-gray-800">{shop.rating}</span>
                {shop.reviewCount && <span className="text-gray-400 text-xs">({shop.reviewCount})</span>}
              </div>
              <span className="text-gray-300">·</span>
              <span className="text-gray-600">{shop.distanceKm} km</span>
              <span className="text-gray-300">·</span>
              <span className="text-gray-600">from ₱{shop.pricePerKg}/kg</span>
              {shop.isSameDay && (
                <>
                  <span className="text-gray-300">·</span>
                  <span className="text-emerald-600 font-medium flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Same-day
                  </span>
                </>
              )}
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-7">

              {/* Service pills */}
              <div className="flex flex-wrap gap-1.5">
                {(shop.services ?? []).map(svc => (
                  <span key={svc} className="text-xs font-medium bg-[#E8F4FD] text-[#0C447C] px-2.5 py-1 rounded-full">
                    {svc}
                  </span>
                ))}
              </div>

              {/* About */}
              {shop.about && (
                <section>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">About</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{shop.about}</p>
                </section>
              )}

              {/* Services & Pricing */}
              {shop.servicePricing?.length > 0 && (
                <section>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Services & Pricing</p>
                  <div className="space-y-2">
                    {shop.servicePricing.map((svc, i) => (
                      <div key={i} className="flex items-center justify-between py-2.5 px-3.5 rounded-lg border border-[#e5e7eb] bg-[#FAFAFA]">
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{svc.name}</p>
                          {svc.desc && <p className="text-xs text-gray-500 mt-0.5">{svc.desc}</p>}
                        </div>
                        <span className="text-sm font-bold text-[#1B6CA8] ml-3 whitespace-nowrap">{svc.price}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Amenities */}
              {shop.amenities?.length > 0 && (
                <section>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">What's included</p>
                  <div className="grid grid-cols-2 gap-2">
                    {shop.amenities.map((a, i) => (
                      <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg bg-[#F4F9FF] border border-[#D6EAF8] text-sm text-gray-700">
                        <svg className="w-3.5 h-3.5 text-[#1B6CA8] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Reviews</p>
                  <div className="space-y-3">
                    {shop.reviews.map((r, i) => (
                      <div key={i} className="p-4 rounded-xl border border-[#e5e7eb] bg-white">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-[#1B6CA8] flex items-center justify-center text-white text-xs font-bold">
                              {r.name[0]}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-800">{r.name}</p>
                              <p className="text-[10px] text-gray-400">{r.date}</p>
                            </div>
                          </div>
                          <Stars rating={r.rating} />
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed">{r.text}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Hours */}
              {shop.hours?.length > 0 && (
                <section>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Hours</p>
                  <div className="space-y-1.5">
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

              {/* Contact */}
              {(shop.phone || shop.email) && (
                <section className="pb-2">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Contact</p>
                  <div className="space-y-2">
                    {shop.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <svg className="w-4 h-4 text-[#1B6CA8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {shop.phone}
                      </div>
                    )}
                    {shop.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <svg className="w-4 h-4 text-[#1B6CA8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {shop.email}
                      </div>
                    )}
                  </div>
                </section>
              )}

            </div>

            {/* Sticky footer */}
            <div className="shrink-0 border-t border-[#e5e7eb] px-5 py-4 bg-white flex items-center gap-3">
              <div>
                <p className="text-[10px] text-gray-400 leading-none mb-0.5">Starting from</p>
                <p className="font-heading font-extrabold text-xl text-[#0D3F6B]">
                  ₱{shop.pricePerKg}<span className="text-sm font-normal text-gray-400">/kg</span>
                </p>
              </div>
              <button
                onClick={() => isMock ? setShowDemo(true) : navigate(`/checkout?shopId=${shop.id}&shop=${encodeURIComponent(shop.name)}`)}
                className={['flex-1 font-bold py-3 rounded-xl transition-colors text-sm', isMock ? 'bg-gray-100 text-gray-500 hover:bg-gray-200' : 'bg-[#1B6CA8] hover:bg-[#155a8a] text-white'].join(' ')}
              >
                {isMock ? 'Demo shop' : 'Book now'}
              </button>
            </div>

            {/* Demo modal */}
            {showDemo && (
              <div className="fixed right-0 top-0 h-full w-full md:w-[500px] z-[60] flex items-center justify-center bg-black/40 px-6" onClick={() => setShowDemo(false)}>
                <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-xs" onClick={e => e.stopPropagation()}>
                  <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                    </svg>
                  </div>
                  <h3 className="font-heading font-bold text-gray-900 text-center mb-2">Demo Shop</h3>
                  <p className="text-sm text-gray-600 text-center leading-relaxed mb-5">
                    <strong>{shop.name}</strong> is a demo listing used to showcase how LabadaGo works. Bookings are not available here.
                    <br /><br />
                    Browse our real partner shops to place an actual order!
                  </p>
                  <button onClick={() => setShowDemo(false)} className="w-full py-2.5 rounded-xl bg-[#1B6CA8] text-white text-sm font-semibold hover:bg-[#155a8a] transition-colors">
                    Got it
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
