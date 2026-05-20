import { useState } from 'react'

// ─── Data ─────────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard'          },
  { id: 'orders',    label: 'Orders'             },
  { id: 'shop',      label: 'My shop profile'    },
  { id: 'services',  label: 'Services & pricing' },
  { id: 'earnings',  label: 'Earnings'           },
  { id: 'settings',  label: 'Settings'           },
]

const ORDER_STATUSES = [
  'Pending',
  'Accepted',
  'Picked up',
  'Received at shop',
  'Being washed',
  'Being dried',
  'Being folded',
  'Ready for delivery',
  'Delivered',
]

const MOCK_ORDERS = [
  {
    id: 'LBG-0051',
    customer: 'Maria Santos',
    time: '8:45 AM',
    service: 'Wash & Fold',
    weight: '6 kg',
    detergent: 'Ariel (hypo)',
    status: 'Pending',
  },
  {
    id: 'LBG-0052',
    customer: 'Jose Reyes',
    time: '9:12 AM',
    service: 'Wash & Iron',
    weight: '4 kg',
    detergent: 'Downy (fresh)',
    status: 'Pending',
  },
  {
    id: 'LBG-0053',
    customer: 'Ana Cruz',
    time: '7:30 AM',
    service: 'Wash & Fold',
    weight: '5 kg',
    detergent: 'Surf (regular)',
    status: 'Being washed',
  },
  {
    id: 'LBG-0054',
    customer: 'Ramon Dela Cruz',
    time: '7:15 AM',
    service: 'Dry Clean',
    weight: '3 kg',
    detergent: 'None',
    status: 'Being dried',
  },
  {
    id: 'LBG-0055',
    customer: 'Luisa Gomez',
    time: '6:50 AM',
    service: 'Wash & Fold',
    weight: '7 kg',
    detergent: 'Ariel (regular)',
    status: 'Delivered',
  },
]

const EARNINGS_DATA = [
  { day: 'Mon', amount: 1200 },
  { day: 'Tue', amount: 890  },
  { day: 'Wed', amount: 1450 },
  { day: 'Thu', amount: 2100 },
  { day: 'Fri', amount: 1800 },
  { day: 'Sat', amount: 2400 },
  { day: 'Sun', amount: 600  },
]

const MAX_EARNING  = 2400
const ACTIVE_DAY   = 'Wed'
const TOTAL_WEEKLY = EARNINGS_DATA.reduce((sum, d) => sum + d.amount, 0)

const TABS = ['All', 'Pending', 'In Progress', 'Completed', 'Cancelled']

const STATUS_PILL = {
  'Pending':            'bg-amber-100 text-amber-700',
  'Accepted':           'bg-[#DBEAFE] text-[#1B6CA8]',
  'Picked up':          'bg-purple-100 text-purple-700',
  'Received at shop':   'bg-purple-100 text-purple-700',
  'Being washed':       'bg-blue-100 text-blue-700',
  'Being dried':        'bg-sky-100 text-sky-700',
  'Being folded':       'bg-indigo-100 text-indigo-700',
  'Ready for delivery': 'bg-green-100 text-green-700',
  'Delivered':          'bg-gray-100 text-gray-600',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function OrderCard({ order }) {
  const [currentStatus, setCurrentStatus] = useState(order.status)

  const isPending    = currentStatus === 'Pending'
  const isCompleted  = currentStatus === 'Delivered'
  const isInProgress = !isPending && !isCompleted

  return (
    <div className="bg-white rounded-xl border border-[#e5e7eb] p-5 flex gap-5">

      {/* Left — order meta */}
      <div className="min-w-[148px]">
        <p className="font-heading font-bold text-[15px] text-gray-900">{order.id}</p>
        <p className="text-sm text-gray-700 mt-0.5">{order.customer}</p>
        <p className="text-[11px] text-gray-400 mt-1">Placed {order.time}</p>
      </div>

      {/* Center — service info */}
      <div className="flex-1">
        <div className="flex flex-wrap gap-1.5 mb-2">
          <span className="text-[11px] font-semibold bg-[#E8F4FD] text-[#1B6CA8] px-2 py-0.5 rounded-full">
            {order.service}
          </span>
          <span className="text-[11px] font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
            {order.weight}
          </span>
          <span className="text-[11px] font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
            {order.detergent}
          </span>
        </div>
        <button className="text-xs text-[#1B6CA8] hover:underline font-medium">
          View details
        </button>
      </div>

      {/* Right — status + actions */}
      <div className="flex flex-col items-end gap-2 min-w-[176px]">
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${STATUS_PILL[currentStatus] ?? 'bg-gray-100 text-gray-600'}`}>
          {currentStatus}
        </span>

        {isPending && (
          <div className="flex flex-col gap-1.5 w-full">
            <button className="w-full bg-green-500 text-white text-xs font-semibold py-1.5 px-3 rounded-lg hover:bg-green-600 transition-colors">
              Accept
            </button>
            <button className="w-full border border-red-400 text-red-500 text-xs font-semibold py-1.5 px-3 rounded-lg hover:bg-red-50 transition-colors">
              Decline
            </button>
          </div>
        )}

        {isInProgress && (
          <div className="flex flex-col gap-1.5 w-full">
            <select
              value={currentStatus}
              onChange={e => setCurrentStatus(e.target.value)}
              className="w-full text-xs border border-[#e5e7eb] rounded-lg px-2 py-1.5 text-gray-700 focus:outline-none focus:border-[#1B6CA8]"
            >
              {ORDER_STATUSES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button className="w-full bg-[#1B6CA8] text-white text-xs font-semibold py-1.5 px-3 rounded-lg hover:bg-[#155a8a] transition-colors">
              Update status
            </button>
          </div>
        )}

        {isCompleted && (
          <button className="border border-gray-300 text-gray-500 text-xs font-semibold py-1.5 px-4 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap">
            View receipt
          </button>
        )}
      </div>

    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MerchantDashboard() {
  const [isOpen,       setIsOpen]       = useState(true)
  const [activeNav,    setActiveNav]    = useState('dashboard')
  const [activeTab,    setActiveTab]    = useState('All')
  const [actualWeight, setActualWeight] = useState(5)

  const STATS = [
    { label: "Today's orders",   value: '5' },
    { label: 'Pending approval', value: '2' },
    { label: 'In progress',      value: '2' },
    { label: 'Completed today',  value: '1' },
  ]

  const filteredOrders = MOCK_ORDERS.filter(o => {
    if (activeTab === 'All')         return true
    if (activeTab === 'Pending')     return o.status === 'Pending'
    if (activeTab === 'In Progress') return o.status !== 'Pending' && o.status !== 'Delivered'
    if (activeTab === 'Completed')   return o.status === 'Delivered'
    return false
  })

  return (
    <div className="flex h-screen bg-[#F4F7FA] overflow-hidden">

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="fixed top-0 left-0 h-screen w-[240px] bg-white border-r border-[#e5e7eb] flex flex-col z-20">

        {/* Logo */}
        <div className="px-5 pt-6 pb-5 border-b border-[#e5e7eb]">
          <div>
            <span className="font-heading font-extrabold text-xl text-[#1B6CA8]">Labada</span>
            <span className="font-heading font-extrabold text-xl text-[#F5A623]">Go</span>
          </div>
          <p className="text-[10px] text-gray-400 mt-0.5 font-medium tracking-wide">Merchant portal</p>
        </div>

        {/* Shop status toggle */}
        <div className="px-5 py-4 border-b border-[#e5e7eb]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-400 mb-2">
            Shop status
          </p>
          <button
            onClick={() => setIsOpen(v => !v)}
            className={[
              'w-full py-2 px-4 rounded-full text-sm font-semibold transition-colors',
              isOpen ? 'bg-green-500 text-white' : 'bg-red-500 text-white',
            ].join(' ')}
          >
            {isOpen ? 'Open' : 'Closed'}
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-3 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={[
                'w-full flex items-center gap-3 py-3 text-sm font-medium transition-colors text-left',
                activeNav === item.id
                  ? 'border-l-4 border-[#1B6CA8] bg-[#EBF4FF] text-[#1B6CA8] pl-[17px] pr-5'
                  : 'border-l-4 border-transparent pl-[17px] pr-5 text-gray-600 hover:bg-gray-50',
              ].join(' ')}
            >
              <ImgPlaceholder
                label=""
                className="w-5 h-5 rounded bg-gray-100 border-gray-300 shrink-0"
              />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Shop owner info */}
        <div className="px-5 py-4 border-t border-[#e5e7eb] flex items-center gap-3">
          <ImgPlaceholder
            label="Owner photo"
            className="w-10 h-10 rounded-full bg-[#EBF4FF] border-blue-200 shrink-0"
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">Ate Linda's Lavanderia</p>
            <p className="text-[11px] text-gray-400">Shop owner</p>
          </div>
        </div>

      </aside>

      {/* ── Main area ───────────────────────────────────────────────────── */}
      <div className="ml-[240px] flex-1 flex flex-col overflow-y-auto">

        {/* Top bar */}
        <header className="bg-white border-b border-[#e5e7eb] h-16 flex items-center justify-between px-8 sticky top-0 z-10 shrink-0">
          <div>
            <h1 className="font-heading font-bold text-[18px] text-gray-900 leading-tight">
              Good morning, Ate Linda
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">Wednesday, May 20, 2026</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-lg border border-[#e5e7eb] flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
              </div>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </div>
            <ImgPlaceholder
              label="Owner avatar"
              className="w-9 h-9 rounded-full bg-[#EBF4FF] border-blue-200 shrink-0"
            />
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

          {/* ── Orders section ───────────────────────────────────────────── */}
          <div className="space-y-4">
            <h2 className="font-heading font-bold text-[17px] text-gray-900">Today's orders</h2>

            {/* Tabs */}
            <div className="flex border-b border-[#e5e7eb]">
              {TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={[
                    'px-4 py-2.5 text-sm font-medium transition-colors',
                    activeTab === tab
                      ? 'text-[#1B6CA8] border-b-2 border-[#1B6CA8] -mb-px'
                      : 'text-gray-400 hover:text-gray-600',
                  ].join(' ')}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Order cards */}
            <div className="space-y-3">
              {filteredOrders.map(order => (
                <OrderCard key={order.id} order={order} />
              ))}
              {filteredOrders.length === 0 && (
                <div className="bg-white rounded-xl border border-[#e5e7eb] p-10 text-center">
                  <p className="text-gray-400 text-sm">No orders in this category</p>
                </div>
              )}
            </div>
          </div>

          {/* ── Weight confirmation ──────────────────────────────────────── */}
          <div className="bg-white rounded-xl border border-[#e5e7eb] flex overflow-hidden">
            <div className="w-1 bg-amber-400 shrink-0" />
            <div className="flex-1 p-6">
              <h2 className="font-heading font-bold text-[17px] text-gray-900 mb-5">
                Weight confirmations needed
              </h2>

              <div className="space-y-4">
                {/* Order info */}
                <div className="flex flex-wrap gap-6 pb-4 border-b border-[#e5e7eb]">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400 mb-0.5">Order ID</p>
                    <p className="font-heading font-bold text-[15px] text-gray-900">LBG-0053</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400 mb-0.5">Customer</p>
                    <p className="text-sm font-medium text-gray-700">Ana Cruz</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400 mb-0.5">Customer estimate</p>
                    <p className="text-sm font-medium text-gray-700">5 kg</p>
                  </div>
                </div>

                {/* Weight stepper */}
                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-2">Actual weight (kg)</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActualWeight(w => Math.max(0.5, +(w - 0.5).toFixed(1)))}
                      className="w-9 h-9 rounded-lg border border-[#e5e7eb] flex items-center justify-center text-lg font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      value={actualWeight}
                      onChange={e => setActualWeight(+e.target.value)}
                      className="w-20 text-center border border-[#e5e7eb] rounded-lg py-2 text-sm font-semibold text-gray-800 focus:outline-none focus:border-[#1B6CA8]"
                      min="0.5"
                      step="0.5"
                    />
                    <button
                      onClick={() => setActualWeight(w => +(w + 0.5).toFixed(1))}
                      className="w-9 h-9 rounded-lg border border-[#e5e7eb] flex items-center justify-center text-lg font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      +
                    </button>
                    <span className="text-sm text-gray-500 ml-1">kg</span>
                  </div>
                </div>

                {/* Scale photo upload */}
                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-2">Scale photo</p>
                  <div className="w-full h-24 rounded-xl border-2 border-dashed border-amber-300 bg-amber-50 flex items-center justify-center">
                    <span className="text-[10px] font-medium text-amber-500 text-center leading-snug px-4">
                      Upload scale photo — merchant uploads proof of actual weight
                    </span>
                  </div>
                </div>

                {/* Confirm button */}
                <div className="flex items-center gap-4">
                  <button className="bg-[#F5A623] text-gray-900 font-heading font-semibold text-sm py-2.5 px-6 rounded-lg hover:bg-[#e09a1f] transition-colors">
                    Confirm weight & update invoice
                  </button>
                  <p className="text-xs text-gray-400">Customer will be notified with updated price</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Earnings snapshot ────────────────────────────────────────── */}
          <div className="bg-white rounded-xl border border-[#e5e7eb] p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading font-bold text-[17px] text-gray-900">
                This week's earnings
              </h2>
              <p className="font-heading font-bold text-[1.4rem] text-[#1B6CA8]">
                ₱{TOTAL_WEEKLY.toLocaleString()}
              </p>
            </div>

            {/* Bars */}
            <div className="flex items-end gap-2 h-[120px]">
              {EARNINGS_DATA.map(entry => (
                <div
                  key={entry.day}
                  className={`flex-1 rounded-t-sm transition-all ${entry.day === ACTIVE_DAY ? 'bg-[#1B6CA8]' : 'bg-[#BFDBFE]'}`}
                  style={{ height: `${(entry.amount / MAX_EARNING) * 120}px` }}
                />
              ))}
            </div>

            {/* Labels */}
            <div className="flex gap-2 mt-3">
              {EARNINGS_DATA.map(entry => (
                <div key={entry.day} className="flex-1 text-center">
                  <p className={`text-[10px] font-medium ${entry.day === ACTIVE_DAY ? 'text-[#1B6CA8]' : 'text-gray-500'}`}>
                    ₱{entry.amount.toLocaleString()}
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
