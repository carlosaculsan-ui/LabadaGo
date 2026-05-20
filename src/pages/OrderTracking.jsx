// ─── Data ─────────────────────────────────────────────────────────────────────

const ORDER_STATUSES = [
  { id: 'PENDING',            label: 'Order placed',        desc: 'Your booking has been submitted and is awaiting confirmation.'     },
  { id: 'ACCEPTED',           label: 'Accepted by shop',    desc: 'The shop has confirmed your order and is preparing for pickup.'    },
  { id: 'PICKUP_EN_ROUTE',    label: 'Pickup en route',     desc: 'Your rider is on the way to collect your laundry.'                 },
  { id: 'PICKED_UP',          label: 'Laundry picked up',   desc: 'Your rider has collected your laundry and is heading to the shop.' },
  { id: 'ARRIVED_AT_SHOP',    label: 'Arrived at shop',     desc: 'Your laundry has arrived at the shop and will be sorted.'          },
  { id: 'PROCESSING',         label: 'Washing & drying',    desc: 'Your clothes are being washed, dried, and folded with care.'       },
  { id: 'READY_FOR_DELIVERY', label: 'Ready for delivery',  desc: 'Your laundry is clean, folded, and ready to be delivered.'         },
  { id: 'DELIVERY_EN_ROUTE',  label: 'Delivery en route',   desc: 'Your rider is on the way to deliver your fresh laundry.'           },
  { id: 'COMPLETED',          label: 'Delivered',           desc: 'Your laundry has been delivered. Thank you for using LabadaGo!'   },
]

const ACTIVE_INDEX = 2 // PICKUP_EN_ROUTE

const STEP_TIMESTAMPS = ['1:45 PM', '2:10 PM', '2:14 PM']

// ─── Shared placeholder component ─────────────────────────────────────────────
// All visual slots use this instead of real images.
function ImgPlaceholder({ label, className }) {
  return (
    <div className={['border border-dashed flex items-center justify-center', className].join(' ')}>
      <span className="text-[7px] font-medium text-gray-400 text-center leading-snug px-1.5">
        {label}
      </span>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OrderTracking() {
  return (
    <div className="min-h-screen bg-[#F4F7FA]">
      <div className="max-w-6xl mx-auto px-8 py-10">
        <div className="flex gap-8 items-start">

          {/* ── Left column ───────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* Section 1 — Order header */}
            <div className="bg-white rounded-xl border border-[#e5e7eb] p-6">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h1 className="font-heading font-bold text-[22px] text-gray-900 leading-tight">
                    Order #LBG-0041
                  </h1>
                  <p className="text-sm text-gray-400 mt-1">Placed on May 20, 2026 · 1:45 PM</p>
                </div>
                <span className="bg-[#1B6CA8] text-white text-sm font-semibold px-4 py-1.5 rounded-full shrink-0">
                  Pickup en route
                </span>
              </div>
              <div className="flex items-center gap-3">
                <ImgPlaceholder
                  label="Shop logo"
                  className="w-10 h-10 rounded-lg bg-[#DBEAFE] border-blue-300 shrink-0"
                />
                <div>
                  <p className="text-[13px] font-semibold text-gray-800">Bubbles Laundry Hub</p>
                  <p className="text-xs text-gray-400">23 Tomas Morato Ave, Quezon City</p>
                </div>
              </div>
            </div>

            {/* Section 2 — Progress tracker */}
            <div className="bg-white rounded-xl border border-[#e5e7eb] p-6">
              <h2 className="font-heading font-bold text-[16px] text-gray-900 mb-6">
                Order progress
              </h2>

              <div>
                {ORDER_STATUSES.map((status, idx) => {
                  const isCompleted = idx < ACTIVE_INDEX
                  const isActive    = idx === ACTIVE_INDEX
                  const isLast      = idx === ORDER_STATUSES.length - 1

                  return (
                    <div key={status.id} className="flex gap-4">

                      {/* Circle + connecting line */}
                      <div className="flex flex-col items-center">
                        <div className={[
                          'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                          isCompleted
                            ? 'bg-[#1B6CA8]'
                            : isActive
                            ? 'bg-[#F5A623] animate-pulse'
                            : 'bg-gray-200',
                        ].join(' ')}>
                          {isCompleted && (
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        {!isLast && (
                          <div className={[
                            'w-0.5 flex-1 min-h-8 mt-1',
                            idx < ACTIVE_INDEX ? 'bg-[#1B6CA8]' : 'bg-gray-200',
                          ].join(' ')} />
                        )}
                      </div>

                      {/* Content + timestamp */}
                      <div className={[
                        'flex-1 flex justify-between items-start gap-4',
                        !isLast ? 'pb-5' : '',
                      ].join(' ')}>
                        <div className="flex-1">
                          <p className={[
                            'font-heading text-[14px]',
                            isCompleted || isActive ? 'font-bold text-gray-900' : 'font-semibold text-gray-400',
                          ].join(' ')}>
                            {status.label}
                          </p>
                          <p className={[
                            'text-xs mt-0.5 leading-relaxed',
                            isCompleted || isActive ? 'text-gray-500' : 'text-gray-300',
                          ].join(' ')}>
                            {status.desc}
                          </p>
                        </div>
                        <div className="shrink-0 pt-0.5">
                          {STEP_TIMESTAMPS[idx] && (
                            <p className="text-xs font-medium text-gray-500 whitespace-nowrap">
                              {STEP_TIMESTAMPS[idx]}
                            </p>
                          )}
                        </div>
                      </div>

                    </div>
                  )
                })}
              </div>
            </div>

            {/* Section 3 — Order details */}
            <div className="bg-white rounded-xl border border-[#e5e7eb] p-6">
              <h2 className="font-heading font-bold text-[16px] text-gray-900 mb-5">
                Order details
              </h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400 mb-3">
                    Laundry details
                  </p>
                  <div className="space-y-2">
                    {[
                      ['Service',     'Wash & Fold'],
                      ['Est. weight', '5 kg'       ],
                      ['Detergent',   'Ariel'       ],
                      ['Conditioner', 'Downy'       ],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between text-sm">
                        <span className="text-gray-400">{label}</span>
                        <span className="font-medium text-gray-700">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400 mb-3">
                    Schedule
                  </p>
                  <div className="space-y-2">
                    {[
                      ['Pickup',   'May 20 · 2:00–4:00 PM'   ],
                      ['Delivery', 'May 21 · 10:00 AM–12 PM' ],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between text-sm">
                        <span className="text-gray-400">{label}</span>
                        <span className="font-medium text-gray-700 text-right">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <hr className="border-[#e5e7eb] my-4" />

              {/* Weight confirmation */}
              <div className="flex items-center gap-2">
                <ImgPlaceholder
                  label="warning icon"
                  className="w-5 h-5 rounded bg-[#FEF3C7] border-amber-300 shrink-0"
                />
                <p className="text-sm text-amber-600">
                  <span className="font-semibold">Weight confirmation: </span>
                  Pending — shop will update after weighing
                </p>
              </div>
            </div>

            {/* Section 4 — Price breakdown */}
            <div className="bg-white rounded-xl border border-[#e5e7eb] p-6">
              <h2 className="font-heading font-bold text-[16px] text-gray-900 mb-5">
                Price breakdown
              </h2>
              <div className="space-y-3">
                {[
                  ['Est. 5 kg × ₱50', '₱250'],
                  ['Pickup fee',       '₱49' ],
                  ['Delivery fee',     '₱49' ],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-gray-400">{label}</span>
                    <span className="font-medium text-gray-700">{value}</span>
                  </div>
                ))}
              </div>
              <hr className="border-[#e5e7eb] my-4" />
              <div className="flex justify-between items-baseline">
                <span className="font-heading font-bold text-[15px] text-gray-900">Total</span>
                <span className="font-bold text-2xl text-[#1B6CA8]">₱348</span>
              </div>
              <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">
                Final price adjusted after the shop weighs your actual laundry.
              </p>
            </div>

          </div>

          {/* ── Right column ──────────────────────────────────────────────── */}
          <div className="w-96 shrink-0 sticky top-20 self-start space-y-4">

            {/* Map placeholder */}
            <div className="min-h-[400px] rounded-xl border-2 border-dashed border-blue-200 bg-[#E8F4FD] flex flex-col items-center justify-center p-6">
              <ImgPlaceholder
                label="Rider pin icon"
                className="w-12 h-12 rounded-lg bg-[#FEF3C7] border-amber-300 mb-3"
              />
              <p className="text-xs text-[#1B6CA8] opacity-60 text-center leading-relaxed max-w-[200px]">
                Live map — rider location updated in real time. Integrate Google Maps or Leaflet here.
              </p>
            </div>

            {/* Rider info card */}
            <div className="bg-white rounded-xl border border-[#e5e7eb] p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400 mb-4">
                Your rider
              </p>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <ImgPlaceholder
                    label="Rider photo"
                    className="w-12 h-12 rounded-full bg-gray-100 border-gray-300 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="font-heading font-bold text-[15px] text-gray-900">Kuya Mark</p>
                    <p className="text-xs text-gray-400">Rider</p>
                    <p className="text-xs text-gray-500 mt-0.5">4.9 ★</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <button className="text-sm font-medium px-4 py-1.5 rounded-lg border border-[#1B6CA8] text-[#1B6CA8] hover:bg-[#F0F7FF] transition-colors">
                    Call rider
                  </button>
                  <button className="text-sm font-medium px-4 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:border-gray-400 transition-colors">
                    Message
                  </button>
                </div>
              </div>
            </div>

            {/* Estimated arrival */}
            <div className="bg-white rounded-xl border border-[#e5e7eb] p-5">
              <div className="flex items-center gap-2 mb-1">
                <ImgPlaceholder
                  label="clock"
                  className="w-5 h-5 rounded bg-gray-100 border-gray-300 shrink-0"
                />
                <p className="font-heading font-semibold text-[15px] text-gray-900">
                  Estimated arrival: 2:30 PM
                </p>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed pl-7">
                Based on current traffic conditions.
              </p>
            </div>

            {/* Cancel order */}
            <div className="text-center py-2">
              <button className="text-sm text-[#DC2626] hover:underline underline-offset-2 transition-colors">
                Cancel order
              </button>
              <p className="text-[11px] text-gray-400 mt-1">(Only available before pickup)</p>
            </div>

          </div>

        </div>
      </div>
    </div>
  )
}
