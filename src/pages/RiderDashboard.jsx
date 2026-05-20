import { useState } from 'react'

// ─── Data ─────────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: 'dashboard',  label: 'Dashboard'     },
  { id: 'deliveries', label: 'My deliveries' },
  { id: 'earnings',   label: 'Earnings'      },
  { id: 'profile',    label: 'Profile'       },
]

const STATS = [
  { label: "Today's deliveries", value: '3'     },
  { label: 'This week',          value: '18'    },
  { label: "Today's earnings",   value: '₱420'  },
  { label: 'Rating',             value: '4.9 ★' },
]

const UPCOMING_TASKS = [
  {
    id: 'LBG-0042',
    customer: 'Maria Santos',
    initials: 'MS',
    avatarBg: 'bg-purple-100 text-purple-700',
    pickup:   '14 Bohol Ave, QC',
    delivery: '22 Scout Tobias, QC',
    status:   'Pending',
  },
  {
    id: 'LBG-0043',
    customer: 'Jose Reyes',
    initials: 'JR',
    avatarBg: 'bg-green-100 text-green-700',
    pickup:   '8 Timog Ave, QC',
    delivery: '5 Sct. Albano, QC',
    status:   'Accepted',
  },
  {
    id: 'LBG-0044',
    customer: 'Ana Cruz',
    initials: 'AC',
    avatarBg: 'bg-amber-100 text-amber-700',
    pickup:   '33 Mother Ignacia, QC',
    delivery: '11 Kamuning Rd, QC',
    status:   'Ready for delivery',
  },
]

const STATUS_PILL = {
  'Pending':            'bg-gray-100 text-gray-600',
  'Accepted':           'bg-[#DBEAFE] text-[#1B6CA8]',
  'Ready for delivery': 'bg-[#D1FAE5] text-green-700',
}

const EARNINGS_DATA = [
  { day: 'Mon', amount: 180 },
  { day: 'Tue', amount: 240 },
  { day: 'Wed', amount: 90  },
  { day: 'Thu', amount: 310 },
  { day: 'Fri', amount: 420 },
  { day: 'Sat', amount: 380 },
  { day: 'Sun', amount: 0   },
]

const MAX_EARNING = 420
const ACTIVE_DAY  = 'Fri'

// ─── Shared placeholder ───────────────────────────────────────────────────────

function ImgPlaceholder({ label, className }) {
  return (
    <div className={['border border-dashed flex items-center justify-center', className].join(' ')}>
      {label && (
        <span className="text-[7px] font-medium text-gray-400 text-center leading-snug px-1.5">
          {label}
        </span>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RiderDashboard() {
  const [isAvailable, setIsAvailable] = useState(true)
  const [activeNav,   setActiveNav]   = useState('dashboard')

  return (
    <div className="flex h-screen bg-[#F4F7FA] overflow-hidden">

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="fixed top-0 left-0 h-screen w-[220px] bg-[#0D3F6B] flex flex-col z-20">

        {/* Logo */}
        <div className="px-5 pt-6 pb-5 border-b border-white/10">
          <div>
            <span className="font-heading font-extrabold text-xl text-white">Labada</span>
            <span className="font-heading font-extrabold text-xl text-[#F5A623]">Go</span>
          </div>
          <p className="text-[10px] text-white/40 mt-0.5 font-medium tracking-wide">Rider portal</p>
        </div>

        {/* Status toggle */}
        <div className="px-5 py-4 border-b border-white/10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-white/40 mb-2">
            Status
          </p>
          <button
            onClick={() => setIsAvailable(v => !v)}
            className={[
              'w-full py-2 px-4 rounded-full text-sm font-semibold transition-colors',
              isAvailable ? 'bg-green-500 text-white' : 'bg-gray-500 text-white',
            ].join(' ')}
          >
            {isAvailable ? 'Available' : 'Off duty'}
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-3 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={[
                'w-full flex items-center gap-3 py-3 text-sm font-medium text-white transition-colors text-left',
                activeNav === item.id
                  ? 'border-l-4 border-[#F5A623] bg-white/10 pl-[17px] pr-5'
                  : 'border-l-4 border-transparent pl-[17px] pr-5 hover:bg-white/5',
              ].join(' ')}
            >
              <ImgPlaceholder
                label=""
                className="w-5 h-5 rounded bg-white/10 border-white/20 shrink-0"
              />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Rider info */}
        <div className="px-5 py-4 border-t border-white/10 flex items-center gap-3">
          <ImgPlaceholder
            label="Rider photo"
            className="w-10 h-10 rounded-full bg-white/10 border-white/25 shrink-0"
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">Kuya Mark</p>
            <p className="text-[11px] text-white/40">Rider</p>
          </div>
        </div>

      </aside>

      {/* ── Main area ───────────────────────────────────────────────────── */}
      <div className="ml-[220px] flex-1 flex flex-col overflow-y-auto">

        {/* Top bar */}
        <header className="bg-white border-b border-[#e5e7eb] h-16 flex items-center justify-between px-8 sticky top-0 z-10 shrink-0">
          <h1 className="font-heading font-bold text-[18px] text-gray-900">
            Rider Dashboard
          </h1>
          <div className="flex items-center gap-4">
            <p className="text-sm text-gray-400">Wednesday, May 20, 2026</p>
            <div className="relative">
              <div className="w-9 h-9 rounded-lg border border-[#e5e7eb] flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
              </div>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-8 space-y-6">

          {/* ── Stats row ────────────────────────────────────────────────── */}
          <div className="grid grid-cols-4 gap-4">
            {STATS.map(stat => (
              <div key={stat.label} className="bg-white rounded-xl border border-[#e5e7eb] p-5">
                <p className="font-heading font-bold text-[1.6rem] text-[#1B6CA8] leading-none">
                  {stat.value}
                </p>
                <p className="text-xs text-gray-400 mt-2">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* ── Active task card ─────────────────────────────────────────── */}
          {/* Left accent uses an inner strip div to avoid border shorthand conflicts */}
          <div className="bg-white rounded-xl border border-[#e5e7eb] flex overflow-hidden">
            <div className="w-1 bg-[#1B6CA8] shrink-0" />
            <div className="flex-1 p-6">

              <div className="flex items-center justify-between mb-5">
                <h2 className="font-heading font-bold text-[17px] text-gray-900">
                  Current task
                </h2>
                <span className="bg-[#FEF3C7] text-amber-700 text-xs font-semibold px-3 py-1 rounded-full">
                  Pickup en route
                </span>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-5">

                {/* Left: order details */}
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400 mb-1">
                      Order ID
                    </p>
                    <p className="font-heading font-bold text-[18px] text-gray-900">LBG-0041</p>
                  </div>

                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400 mb-2">
                      Customer
                    </p>
                    <div className="flex items-center gap-2.5">
                      <ImgPlaceholder
                        label="Customer photo"
                        className="w-8 h-8 rounded-full bg-[#DBEAFE] border-blue-300 shrink-0"
                      />
                      <span className="text-sm font-medium text-gray-800">Maria Santos</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400 mb-2">
                      Pickup address
                    </p>
                    <div className="flex items-start gap-2">
                      <ImgPlaceholder
                        label="pin icon"
                        className="w-5 h-5 rounded bg-[#FEE2E2] border-red-300 shrink-0 mt-0.5"
                      />
                      <p className="text-sm text-gray-700">23 Tomas Morato Ave, Quezon City</p>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                    <p className="text-xs text-amber-700 leading-relaxed">
                      Collect laundry bag, take a photo as proof
                    </p>
                  </div>
                </div>

                {/* Right: map placeholder */}
                <div className="min-h-48 rounded-xl border-2 border-dashed border-blue-200 bg-[#E8F4FD] flex flex-col items-center justify-center p-4">
                  <ImgPlaceholder
                    label="Rider pin"
                    className="w-10 h-10 rounded-lg bg-[#FEF3C7] border-amber-300 mb-3"
                  />
                  <p className="text-xs text-[#1B6CA8] opacity-60 text-center leading-relaxed max-w-[160px]">
                    Live map — customer location. Integrate Google Maps here.
                  </p>
                </div>

              </div>

              {/* Action */}
              <div>
                <button className="w-full bg-[#1B6CA8] text-white font-heading font-semibold py-3 rounded-lg hover:bg-[#155a8a] transition-colors text-sm">
                  Mark as picked up
                </button>
                <p className="text-[11px] text-gray-400 text-center mt-2">
                  This will notify the customer and update order status
                </p>
              </div>

            </div>
          </div>

          {/* ── Upcoming deliveries table ─────────────────────────────────── */}
          <div className="bg-white rounded-xl border border-[#e5e7eb] p-6">
            <h2 className="font-heading font-bold text-[17px] text-gray-900 mb-5">
              Upcoming tasks
            </h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e5e7eb]">
                  {['Order ID', 'Customer', 'Pickup address', 'Delivery address', 'Status', 'Action'].map(col => (
                    <th
                      key={col}
                      className="text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400 pb-3 pr-4 last:pr-0"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e7eb]">
                {UPCOMING_TASKS.map(row => (
                  <tr key={row.id}>
                    <td className="py-3.5 pr-4 font-heading font-semibold text-gray-800 text-[13px] whitespace-nowrap">
                      {row.id}
                    </td>
                    <td className="py-3.5 pr-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${row.avatarBg}`}>
                          {row.initials}
                        </div>
                        <span className="text-gray-700 whitespace-nowrap">{row.customer}</span>
                      </div>
                    </td>
                    <td className="py-3.5 pr-4 text-gray-500">{row.pickup}</td>
                    <td className="py-3.5 pr-4 text-gray-500">{row.delivery}</td>
                    <td className="py-3.5 pr-4">
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${STATUS_PILL[row.status]}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="py-3.5">
                      <button className="text-xs font-medium px-3 py-1.5 rounded-lg border border-[#1B6CA8] text-[#1B6CA8] hover:bg-[#F0F7FF] transition-colors">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Earnings snapshot ────────────────────────────────────────── */}
          <div className="bg-white rounded-xl border border-[#e5e7eb] p-6">
            <h2 className="font-heading font-bold text-[17px] text-gray-900 mb-6">
              This week's earnings
            </h2>

            {/* Bars — flex items-end so shorter bars sit at the bottom */}
            <div className="flex items-end gap-2 h-[120px]">
              {EARNINGS_DATA.map(entry => (
                <div
                  key={entry.day}
                  className={`flex-1 rounded-t-sm transition-all ${entry.day === ACTIVE_DAY ? 'bg-[#1B6CA8]' : 'bg-[#BFDBFE]'}`}
                  style={{ height: entry.amount === 0 ? '3px' : `${(entry.amount / MAX_EARNING) * 120}px` }}
                />
              ))}
            </div>

            {/* Labels */}
            <div className="flex gap-2 mt-3">
              {EARNINGS_DATA.map(entry => (
                <div key={entry.day} className="flex-1 text-center">
                  <p className={`text-[10px] font-medium ${entry.day === ACTIVE_DAY ? 'text-[#1B6CA8]' : 'text-gray-500'}`}>
                    {entry.amount > 0 ? `₱${entry.amount}` : '—'}
                  </p>
                  <p className={`text-[11px] mt-0.5 ${entry.day === ACTIVE_DAY ? 'text-gray-700 font-semibold' : 'text-gray-400'}`}>
                    {entry.day}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </main>
      </div>
    </div>
  )
}
