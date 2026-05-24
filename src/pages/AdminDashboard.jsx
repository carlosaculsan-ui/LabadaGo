import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  collection, onSnapshot, doc, updateDoc, setDoc, getDoc,
} from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import { auth, db } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'
import Logo from '../components/Logo'

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_LABEL = {
  PENDING:            'Pending',
  ACCEPTED:           'Accepted',
  PICKUP_EN_ROUTE:    'Pickup en route',
  PICKED_UP:          'Picked up',
  ARRIVED_AT_SHOP:    'Arrived at shop',
  PROCESSING:         'Processing',
  READY_FOR_DELIVERY: 'Ready for delivery',
  DELIVERY_EN_ROUTE:  'Delivery en route',
  COMPLETED:          'Completed',
  CANCELLED:          'Cancelled',
}

const STATUS_PILL = {
  PENDING:            'bg-amber-100 text-amber-700',
  ACCEPTED:           'bg-blue-100 text-[#1B6CA8]',
  PICKUP_EN_ROUTE:    'bg-purple-100 text-purple-700',
  PICKED_UP:          'bg-purple-100 text-purple-700',
  ARRIVED_AT_SHOP:    'bg-purple-100 text-purple-700',
  PROCESSING:         'bg-blue-100 text-blue-700',
  READY_FOR_DELIVERY: 'bg-green-100 text-green-700',
  DELIVERY_EN_ROUTE:  'bg-sky-100 text-sky-700',
  COMPLETED:          'bg-gray-100 text-gray-600',
  CANCELLED:          'bg-red-100 text-red-500',
}

const ROLE_PILL = {
  admin:    'bg-red-100 text-red-700',
  merchant: 'bg-purple-100 text-purple-700',
  rider:    'bg-sky-100 text-sky-700',
  customer: 'bg-green-100 text-green-700',
}

const ACTIVE_STATUSES = new Set([
  'ACCEPTED', 'PICKUP_EN_ROUTE', 'PICKED_UP',
  'ARRIVED_AT_SHOP', 'PROCESSING', 'READY_FOR_DELIVERY', 'DELIVERY_EN_ROUTE',
])

const ALL_STATUSES = Object.keys(STATUS_LABEL)

const SETTINGS_DEFAULT = {
  maintenanceMode:       false,
  allowNewRegistrations: true,
  requireShopApproval:   true,
  platformFee:           10,
  supportEmail:          '',
  announcementBanner:    '',
}

const STAT_DOTS = ['bg-[#F5A623]', 'bg-amber-400', 'bg-violet-400', 'bg-emerald-400']

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const TAB_ICONS = {
  Overview:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5 shrink-0"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  Users:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5 shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  Orders:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5 shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>,
  Shops:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5 shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>,
  Riders:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5 shrink-0"><rect x="1" y="3" width="15" height="13"/><polygon points="16,8 20,8 23,11 23,16 16,16 16,8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
  Analytics: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5 shrink-0"><polyline strokeLinecap="round" strokeLinejoin="round" points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline strokeLinecap="round" strokeLinejoin="round" points="17 6 23 6 23 12"/></svg>,
  Settings:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5 shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><circle cx="12" cy="12" r="3"/></svg>,
}

const TABS = ['Overview', 'Users', 'Orders', 'Shops', 'Riders', 'Analytics', 'Settings']

// ─── Shared Components ────────────────────────────────────────────────────────

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={[
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0',
        checked ? 'bg-[#1B6CA8]' : 'bg-gray-200',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
      ].join(' ')}
    >
      <span className={['inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform', checked ? 'translate-x-6' : 'translate-x-1'].join(' ')} />
    </button>
  )
}

function ConfirmModal({ message, confirmLabel = 'Confirm', danger = false, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4">
        <p className="text-sm text-gray-700 mb-6 text-center">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 px-4 py-2 rounded-xl border border-[#e5e7eb] text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={onConfirm} className={['flex-1 px-4 py-2 rounded-xl text-sm font-semibold transition-colors', danger ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-[#1B6CA8] text-white hover:bg-[#155a8a]'].join(' ')}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}

function SearchInput({ value, onChange, placeholder }) {
  return (
    <div className="relative">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="pl-9 pr-4 py-2 rounded-xl border border-[#e5e7eb] text-sm bg-white outline-none focus:ring-2 focus:ring-[#1B6CA8]/30 w-64" />
    </div>
  )
}

function TableWrap({ cols, empty, children }) {
  return (
    <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#e5e7eb] bg-[#F9FAFB]">
            {cols.map(({ label, align = 'left' }) => (
              <th key={label} className={`text-${align} px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide`}>{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {empty
            ? <tr><td colSpan={cols.length} className="text-center py-10 text-gray-400 text-sm">{empty}</td></tr>
            : children
          }
        </tbody>
      </table>
    </div>
  )
}

function FilterBar({ children, count, noun }) {
  return (
    <div className="flex items-center gap-4 flex-wrap mb-5">
      {children}
      {count != null && <span className="text-sm text-gray-500 ml-auto">{count} {noun}{count !== 1 ? 's' : ''}</span>}
    </div>
  )
}

function FilterPills({ options, active, onChange }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map(o => (
        <button key={o} onClick={() => onChange(o)}
          className={['text-sm font-medium px-3 py-1.5 rounded-lg border transition-colors', active === o ? 'bg-[#0A2540] text-white border-[#0A2540]' : 'bg-white text-gray-600 border-[#e5e7eb] hover:border-[#0A2540]'].join(' ')}
        >{o}</button>
      ))}
    </div>
  )
}

function TR({ children }) {
  return <tr className="border-b border-[#e5e7eb] last:border-0 hover:bg-[#F9FAFB]">{children}</tr>
}

function TD({ children, align = 'left', className = '' }) {
  return <td className={`px-5 py-3 text-${align} ${className}`}>{children}</td>
}

function fmtDate(ts) {
  if (!ts?.toDate) return '—'
  return ts.toDate().toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}

function initials(name) {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({ orders, users, shops }) {
  const pendingShops  = shops.filter(s => !s.approved && s.status !== 'suspended')
  const pendingRiders = users.filter(u => u.role === 'rider' && !u.status)

  const recentOrders = [...orders]
    .sort((a, b) => (b.createdAt?.toDate?.()?.getTime() ?? 0) - (a.createdAt?.toDate?.()?.getTime() ?? 0))
    .slice(0, 10)

  return (
    <div className="space-y-8">
      <h2 className="font-heading font-bold text-[17px] text-gray-900">Overview</h2>

      {(pendingShops.length > 0 || pendingRiders.length > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <h3 className="font-heading font-semibold text-amber-800 mb-3 flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Pending Actions
          </h3>
          <div className="space-y-2">
            {pendingShops.map(s => (
              <div key={s.id} className="flex items-center justify-between text-sm">
                <span className="text-amber-700">Shop awaiting approval: <strong>{s.name}</strong></span>
                <span className="text-amber-500 text-xs">Go to Shops tab →</span>
              </div>
            ))}
            {pendingRiders.map(r => (
              <div key={r.id} className="flex items-center justify-between text-sm">
                <span className="text-amber-700">Rider pending review: <strong>{r.fullName ?? r.email}</strong></span>
                <span className="text-amber-500 text-xs">Go to Riders tab →</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="font-heading font-semibold text-gray-700 mb-3">Recent Orders</p>
        <TableWrap
          cols={[{ label: 'Ref' }, { label: 'Shop' }, { label: 'Status' }, { label: 'Amount', align: 'right' }, { label: 'Date', align: 'right' }]}
          empty={recentOrders.length === 0 ? 'No orders yet' : null}
        >
          {recentOrders.map(o => (
            <TR key={o.id}>
              <TD><span className="font-mono text-xs text-gray-500">LBG-{o.id.substring(0, 8).toUpperCase()}</span></TD>
              <TD><span className="text-gray-800">{o.shopName ?? '—'}</span></TD>
              <TD>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_PILL[o.status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {STATUS_LABEL[o.status] ?? o.status}
                </span>
              </TD>
              <TD align="right"><span className="font-medium text-gray-800">₱{(o.finalPrice ?? o.estimatedPrice ?? 0).toLocaleString()}</span></TD>
              <TD align="right"><span className="text-gray-500 text-xs">{fmtDate(o.createdAt)}</span></TD>
            </TR>
          ))}
        </TableWrap>
      </div>
    </div>
  )
}

// ─── Users Tab ────────────────────────────────────────────────────────────────

function UsersTab({ users }) {
  const [search,     setSearch]     = useState('')
  const [roleFilter, setRoleFilter] = useState('All')
  const [confirm,    setConfirm]    = useState(null)
  const [busy,       setBusy]       = useState(null)

  const displayed = useMemo(() => {
    const q = search.toLowerCase()
    return users.filter(u => {
      if (roleFilter !== 'All' && (u.role ?? 'customer') !== roleFilter.toLowerCase()) return false
      if (q && !u.fullName?.toLowerCase().includes(q) && !u.email?.toLowerCase().includes(q)) return false
      return true
    })
  }, [users, search, roleFilter])

  async function handleStatus(uid, newStatus) {
    setBusy(uid)
    try { await updateDoc(doc(db, 'users', uid), { status: newStatus }) }
    finally { setBusy(null); setConfirm(null) }
  }

  return (
    <div>
      <h2 className="font-heading font-bold text-[17px] text-gray-900 mb-5">Users</h2>
      {confirm && <ConfirmModal message={confirm.message} confirmLabel={confirm.label} danger={confirm.danger} onConfirm={() => handleStatus(confirm.uid, confirm.status)} onCancel={() => setConfirm(null)} />}

      <FilterBar count={displayed.length} noun="user">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name or email…" />
        <FilterPills options={['All', 'Customer', 'Merchant', 'Rider', 'Admin']} active={roleFilter} onChange={setRoleFilter} />
      </FilterBar>

      <TableWrap
        cols={[{ label: 'User' }, { label: 'Role' }, { label: 'Joined' }, { label: 'Status' }, { label: 'Actions', align: 'right' }]}
        empty={displayed.length === 0 ? 'No users found' : null}
      >
        {displayed.map(u => {
          const isSuspended = u.status === 'suspended'
          return (
            <TR key={u.id}>
              <TD>
                <div className="flex items-center gap-3">
                  {u.photoURL
                    ? <img src={u.photoURL} alt="" referrerPolicy="no-referrer" className="w-8 h-8 rounded-full object-cover shrink-0" />
                    : <div className="w-8 h-8 rounded-full bg-[#1B6CA8] flex items-center justify-center shrink-0"><span className="text-[10px] font-bold text-white">{initials(u.fullName)}</span></div>
                  }
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{u.fullName ?? '—'}</p>
                    <p className="text-xs text-gray-400 truncate">{u.email}</p>
                  </div>
                </div>
              </TD>
              <TD>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${ROLE_PILL[u.role ?? 'customer'] ?? 'bg-gray-100 text-gray-600'}`}>
                  {u.role ?? 'customer'}
                </span>
              </TD>
              <TD><span className="text-gray-500 text-xs">{fmtDate(u.createdAt)}</span></TD>
              <TD>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${isSuspended ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                  {isSuspended ? 'Suspended' : 'Active'}
                </span>
              </TD>
              <TD align="right">
                {u.role !== 'admin' && (
                  <button disabled={busy === u.id}
                    onClick={() => setConfirm({ uid: u.id, status: isSuspended ? 'active' : 'suspended', label: isSuspended ? 'Activate' : 'Suspend', danger: !isSuspended, message: isSuspended ? `Activate account for ${u.fullName ?? u.email}?` : `Suspend ${u.fullName ?? u.email}? They won't be able to log in.` })}
                    className={['text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors', isSuspended ? 'border-green-300 text-green-700 hover:bg-green-50' : 'border-red-300 text-red-600 hover:bg-red-50'].join(' ')}
                  >
                    {isSuspended ? 'Activate' : 'Suspend'}
                  </button>
                )}
              </TD>
            </TR>
          )
        })}
      </TableWrap>
    </div>
  )
}

// ─── Orders Tab ───────────────────────────────────────────────────────────────

function OrdersTab({ orders }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')
  const [busy,   setBusy]   = useState(null)

  const displayed = useMemo(() => {
    const q = search.toLowerCase()
    return [...orders].filter(o => {
      if (filter === 'Pending'   && o.status !== 'PENDING')         return false
      if (filter === 'Active'    && !ACTIVE_STATUSES.has(o.status)) return false
      if (filter === 'Completed' && o.status !== 'COMPLETED')       return false
      if (filter === 'Cancelled' && o.status !== 'CANCELLED')       return false
      if (q && !o.shopName?.toLowerCase().includes(q) && !o.id.toLowerCase().includes(q)) return false
      return true
    }).sort((a, b) => (b.createdAt?.toDate?.()?.getTime() ?? 0) - (a.createdAt?.toDate?.()?.getTime() ?? 0))
  }, [orders, filter, search])

  async function handleStatus(id, status) {
    setBusy(id)
    try { await updateDoc(doc(db, 'orders', id), { status }) }
    finally { setBusy(null) }
  }

  return (
    <div>
      <h2 className="font-heading font-bold text-[17px] text-gray-900 mb-5">Orders</h2>
      <FilterBar count={displayed.length} noun="order">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by shop or order ID…" />
        <FilterPills options={['All', 'Pending', 'Active', 'Completed', 'Cancelled']} active={filter} onChange={setFilter} />
      </FilterBar>

      <TableWrap
        cols={[{ label: 'Ref' }, { label: 'Shop' }, { label: 'Service' }, { label: 'Status' }, { label: 'Amount', align: 'right' }, { label: 'Date', align: 'right' }]}
        empty={displayed.length === 0 ? 'No orders found' : null}
      >
        {displayed.map(o => (
          <TR key={o.id}>
            <TD><span className="font-mono text-xs text-gray-500">LBG-{o.id.substring(0, 8).toUpperCase()}</span></TD>
            <TD><span className="text-gray-800">{o.shopName ?? '—'}</span></TD>
            <TD><span className="text-gray-500 text-xs">{o.serviceType ?? '—'}</span></TD>
            <TD>
              <select value={o.status} disabled={busy === o.id} onChange={e => handleStatus(o.id, e.target.value)}
                className="text-xs border border-[#e5e7eb] rounded-lg px-2 py-1 bg-white outline-none focus:ring-2 focus:ring-[#1B6CA8]/30 cursor-pointer"
              >
                {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
              </select>
            </TD>
            <TD align="right"><span className="font-medium text-gray-800">₱{(o.finalPrice ?? o.estimatedPrice ?? 0).toLocaleString()}</span></TD>
            <TD align="right"><span className="text-gray-500 text-xs">{fmtDate(o.createdAt)}</span></TD>
          </TR>
        ))}
      </TableWrap>
    </div>
  )
}

// ─── Shops Tab ────────────────────────────────────────────────────────────────

function ShopDetailModal({ shop, owner, orderCount, onClose }) {
  if (!shop) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

        {/* Hero */}
        <div className="relative h-44 bg-gradient-to-br from-[#DBEAFE] to-[#93C5FD] shrink-0 overflow-hidden rounded-t-2xl">
          {shop.image && <img src={shop.image} alt={shop.name} className="w-full h-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="absolute bottom-0 left-0 right-0 px-5 pb-4">
            <h2 className="font-heading font-extrabold text-xl text-white leading-tight">{shop.name}</h2>
            <p className="text-white/70 text-xs mt-0.5">{shop.address}</p>
          </div>
          <div className="absolute top-3 left-3 flex gap-2">
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${shop.approved ? 'bg-green-500 text-white' : 'bg-amber-400 text-amber-900'}`}>
              {shop.approved ? 'Approved' : 'Pending'}
            </span>
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${shop.isOpen ? 'bg-emerald-400/90 text-white' : 'bg-red-400/90 text-white'}`}>
              {shop.isOpen ? 'Open' : 'Closed'}
            </span>
            {shop.status === 'suspended' && (
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-600 text-white">Suspended</span>
            )}
          </div>
        </div>

        <div className="p-6 space-y-6">

          {/* Quick stats row */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Rating',    value: shop.rating ? `${shop.rating}★` : '—' },
              { label: 'Price',     value: shop.pricePerKg ? `₱${shop.pricePerKg}/kg` : '—' },
              { label: 'Orders',    value: orderCount ?? 0 },
              { label: 'Distance',  value: shop.distanceKm ? `${shop.distanceKm} km` : '—' },
            ].map(stat => (
              <div key={stat.label} className="bg-[#F4F7FB] rounded-xl px-3 py-3 text-center">
                <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Services */}
          {shop.services?.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Services</p>
              <div className="flex flex-wrap gap-1.5">
                {shop.services.map(svc => (
                  <span key={svc} className="text-xs font-medium bg-[#E8F4FD] text-[#0C447C] px-2.5 py-1 rounded-full">{svc}</span>
                ))}
              </div>
            </div>
          )}

          {/* About */}
          {shop.about && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">About</p>
              <p className="text-sm text-gray-600 leading-relaxed">{shop.about}</p>
            </div>
          )}

          {/* Two-column: Contact + Owner */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#F4F7FB] rounded-xl p-4 space-y-2.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Shop Contact</p>
              <Row label="Phone"  value={shop.phone || '—'} />
              <Row label="Email"  value={shop.email || '—'} />
              <Row label="GCash"  value={shop.gcash || '—'} />
              <Row label="Same-day" value={shop.isSameDay ? 'Yes' : 'No'} />
              <Row label="Featured" value={shop.featured ? 'Yes' : 'No'} />
            </div>
            <div className="bg-[#F4F7FB] rounded-xl p-4 space-y-2.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Owner</p>
              <Row label="Name"   value={owner?.fullName || '—'} />
              <Row label="Email"  value={owner?.email || '—'} />
              <Row label="Mobile" value={owner?.mobile || '—'} />
              <Row label="Role"   value={owner?.role || '—'} />
              <Row label="Joined" value={owner?.createdAt?.toDate ? owner.createdAt.toDate().toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'} />
            </div>
          </div>

          {/* Service Pricing */}
          {shop.servicePricing?.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Services & Pricing</p>
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
            </div>
          )}

          {/* Amenities */}
          {shop.amenities?.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">What's Included</p>
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
            </div>
          )}

          {/* Operating Hours */}
          {shop.hours?.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Operating Hours</p>
              <div className="space-y-1.5">
                {shop.hours.map((h, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-500">{h.day}</span>
                    <span className={h.time === 'Closed' ? 'text-red-500 font-medium' : 'font-semibold text-gray-800'}>{h.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between text-xs gap-2">
      <span className="text-gray-500 shrink-0">{label}</span>
      <span className="text-gray-800 font-medium text-right break-all">{value}</span>
    </div>
  )
}

function ShopsTab({ shops, users, orders }) {
  const [confirm,      setConfirm]      = useState(null)
  const [busy,         setBusy]         = useState(null)
  const [search,       setSearch]       = useState('')
  const [detailShop,   setDetailShop]   = useState(null)

  const shopOrderCount = useMemo(() => {
    const counts = {}
    orders.forEach(o => { if (o.shopId) counts[o.shopId] = (counts[o.shopId] ?? 0) + 1 })
    return counts
  }, [orders])

  const displayed = useMemo(() => {
    const q = search.toLowerCase()
    return shops.filter(s => !q || s.name?.toLowerCase().includes(q) || s.address?.toLowerCase().includes(q))
  }, [shops, search])

  async function setField(shopId, field, value) {
    setBusy(shopId + field)
    try { await updateDoc(doc(db, 'shops', shopId), { [field]: value }) }
    finally { setBusy(null); setConfirm(null) }
  }

  return (
    <div>
      <h2 className="font-heading font-bold text-[17px] text-gray-900 mb-5">Shops</h2>
      {confirm && <ConfirmModal message={confirm.message} confirmLabel={confirm.label} danger={confirm.danger} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} />}
      {detailShop && <ShopDetailModal shop={detailShop} owner={users.find(u => u.id === detailShop.id)} orderCount={shopOrderCount[detailShop.id] ?? 0} onClose={() => setDetailShop(null)} />}

      <FilterBar count={displayed.length} noun="shop">
        <SearchInput value={search} onChange={setSearch} placeholder="Search shops…" />
      </FilterBar>

      <TableWrap
        cols={[{ label: 'Shop' }, { label: 'Owner' }, { label: 'Rating', align: 'center' }, { label: 'Orders', align: 'center' }, { label: 'Featured', align: 'center' }, { label: 'Approved', align: 'center' }, { label: 'Actions', align: 'right' }]}
        empty={displayed.length === 0 ? 'No shops found' : null}
      >
        {displayed.map(s => {
          const isSuspended = s.status === 'suspended'
          const owner = users.find(u => u.id === s.id)
          return (
            <TR key={s.id}>
              <TD>
                <p className="font-medium text-gray-900">{s.name}</p>
                <p className="text-xs text-gray-400">{s.address}</p>
              </TD>
              <TD><span className="text-gray-500 text-xs">{owner?.email ?? '—'}</span></TD>
              <TD align="center"><span className="text-gray-800">{s.rating ? `${s.rating}★` : '—'}</span></TD>
              <TD align="center"><span className="text-gray-600">{shopOrderCount[s.id] ?? 0}</span></TD>
              <TD align="center">
                <div className="flex justify-center">
                  <Toggle checked={!!s.featured} disabled={busy === s.id + 'featured'} onChange={val => setField(s.id, 'featured', val)} />
                </div>
              </TD>
              <TD align="center">
                {s.approved
                  ? <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">Approved</span>
                  : <button disabled={!!busy} onClick={() => setField(s.id, 'approved', true)} className="text-xs font-semibold px-3 py-1 rounded-lg bg-[#1B6CA8] text-white hover:bg-[#155a8a] transition-colors">Approve</button>
                }
              </TD>
              <TD align="right">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => setDetailShop(s)}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg border border-[#1B6CA8]/40 text-[#1B6CA8] hover:bg-[#E8F4FD] transition-colors"
                  >
                    Details
                  </button>
                  <button disabled={!!busy}
                    onClick={() => setConfirm({ message: isSuspended ? `Restore shop "${s.name}"?` : `Suspend "${s.name}"? It will be hidden from Browse.`, label: isSuspended ? 'Restore' : 'Suspend', danger: !isSuspended, onConfirm: () => setField(s.id, 'status', isSuspended ? 'active' : 'suspended') })}
                    className={['text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors', isSuspended ? 'border-green-300 text-green-700 hover:bg-green-50' : 'border-red-300 text-red-600 hover:bg-red-50'].join(' ')}
                  >
                    {isSuspended ? 'Restore' : 'Suspend'}
                  </button>
                </div>
              </TD>
            </TR>
          )
        })}
      </TableWrap>
    </div>
  )
}

// ─── Riders Tab ───────────────────────────────────────────────────────────────

function RiderDetailModal({ rider, deliveryCount, onClose }) {
  const [app, setApp] = useState(null)

  useEffect(() => {
    if (!rider?.id) return
    getDoc(doc(db, 'applications', rider.id)).then(snap => {
      if (snap.exists()) setApp(snap.data())
    }).catch(() => {})
  }, [rider?.id])

  if (!rider) return null

  const isSuspended = rider.status === 'suspended'
  const joined = rider.createdAt?.toDate
    ? rider.createdAt.toDate().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="relative bg-gradient-to-br from-[#0A3358] to-[#1B6CA8] px-6 pt-6 pb-8 rounded-t-2xl">
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="flex items-center gap-4">
            {rider.photoURL
              ? <img src={rider.photoURL} alt="" referrerPolicy="no-referrer" className="w-16 h-16 rounded-full object-cover ring-2 ring-white/40 shrink-0" />
              : <div className="w-16 h-16 rounded-full bg-sky-400 flex items-center justify-center ring-2 ring-white/40 shrink-0">
                  <span className="text-lg font-bold text-white">{initials(rider.fullName)}</span>
                </div>
            }
            <div>
              <h2 className="font-heading font-bold text-xl text-white leading-tight">{rider.fullName ?? '—'}</h2>
              <p className="text-white/70 text-sm mt-0.5">{rider.email}</p>
              <div className="flex gap-2 mt-2">
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${isSuspended ? 'bg-red-400/90 text-white' : 'bg-emerald-400/90 text-white'}`}>
                  {isSuspended ? 'Suspended' : 'Active'}
                </span>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${rider.available ? 'bg-white/20 text-white' : 'bg-white/10 text-white/50'}`}>
                  {rider.available ? 'Available' : 'Unavailable'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Deliveries',  value: deliveryCount },
              { label: 'Vehicle',     value: app?.vehicle ?? '—' },
              { label: 'Joined',      value: rider.createdAt?.toDate ? rider.createdAt.toDate().toLocaleDateString('en-PH', { month: 'short', year: 'numeric' }) : '—' },
            ].map(s => (
              <div key={s.label} className="bg-[#F4F7FB] rounded-xl px-3 py-3 text-center">
                <p className="text-base font-bold text-gray-900">{s.value}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Personal Details */}
          <div className="bg-[#F4F7FB] rounded-xl p-4 space-y-2.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Personal Details</p>
            <Row label="Full Name"  value={rider.fullName || '—'} />
            <Row label="Email"      value={rider.email || '—'} />
            <Row label="Mobile"     value={rider.mobile || app?.mobile || '—'} />
            <Row label="Contact"    value={app?.contact || '—'} />
            <Row label="Age"        value={app?.age ?? '—'} />
            <Row label="Sex"        value={app?.sex || '—'} />
            <Row label="Address"    value={app?.address || '—'} />
            <Row label="Joined"     value={joined} />
          </div>

          {/* Vehicle Details */}
          <div className="bg-[#F4F7FB] rounded-xl p-4 space-y-2.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Vehicle Details</p>
            <Row label="Type"       value={app?.vehicle || '—'} />
            <Row label="Plate No."  value={app?.plate || '—'} />
          </div>

          {/* Documents */}
          {(app?.license || app?.validId) && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Documents</p>
              <div className="grid grid-cols-2 gap-3">
                {app.license && (
                  <a href={app.license} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-[#1B6CA8]/30 bg-[#E8F4FD] text-[#1B6CA8] text-xs font-semibold hover:bg-[#DBEAFE] transition-colors">
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Driver's License
                  </a>
                )}
                {app.validId && (
                  <a href={app.validId} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-[#1B6CA8]/30 bg-[#E8F4FD] text-[#1B6CA8] text-xs font-semibold hover:bg-[#DBEAFE] transition-colors">
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2" />
                    </svg>
                    Government ID
                  </a>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

function RidersTab({ users, orders }) {
  const [confirm,      setConfirm]      = useState(null)
  const [busy,         setBusy]         = useState(null)
  const [search,       setSearch]       = useState('')
  const [detailRider,  setDetailRider]  = useState(null)

  const riders = useMemo(() => users.filter(u => u.role === 'rider'), [users])

  const completedByRider = useMemo(() => {
    const counts = {}
    orders.forEach(o => { if (o.status === 'COMPLETED' && o.riderId) counts[o.riderId] = (counts[o.riderId] ?? 0) + 1 })
    return counts
  }, [orders])

  const displayed = useMemo(() => {
    const q = search.toLowerCase()
    return riders.filter(r => !q || r.fullName?.toLowerCase().includes(q) || r.email?.toLowerCase().includes(q))
  }, [riders, search])

  async function handleStatus(uid, newStatus) {
    setBusy(uid); try { await updateDoc(doc(db, 'users', uid), { status: newStatus }) } finally { setBusy(null); setConfirm(null) }
  }
  async function handleAvailable(uid, val) {
    setBusy(uid + 'a'); try { await updateDoc(doc(db, 'users', uid), { available: val }) } finally { setBusy(null) }
  }

  return (
    <div>
      <h2 className="font-heading font-bold text-[17px] text-gray-900 mb-5">Riders</h2>
      {confirm && <ConfirmModal message={confirm.message} confirmLabel={confirm.label} danger={confirm.danger} onConfirm={() => handleStatus(confirm.uid, confirm.status)} onCancel={() => setConfirm(null)} />}
      {detailRider && <RiderDetailModal rider={detailRider} deliveryCount={completedByRider[detailRider.id] ?? 0} onClose={() => setDetailRider(null)} />}

      <FilterBar count={displayed.length} noun="rider">
        <SearchInput value={search} onChange={setSearch} placeholder="Search riders…" />
      </FilterBar>

      <TableWrap
        cols={[{ label: 'Rider' }, { label: 'Phone' }, { label: 'Available', align: 'center' }, { label: 'Deliveries', align: 'center' }, { label: 'Status', align: 'center' }, { label: 'Actions', align: 'right' }]}
        empty={displayed.length === 0 ? 'No riders found' : null}
      >
        {displayed.map(r => {
          const isSuspended = r.status === 'suspended'
          return (
            <TR key={r.id}>
              <TD>
                <div className="flex items-center gap-3">
                  {r.photoURL
                    ? <img src={r.photoURL} alt="" referrerPolicy="no-referrer" className="w-8 h-8 rounded-full object-cover shrink-0" />
                    : <div className="w-8 h-8 rounded-full bg-sky-500 flex items-center justify-center shrink-0"><span className="text-[10px] font-bold text-white">{initials(r.fullName)}</span></div>
                  }
                  <div>
                    <p className="font-medium text-gray-900">{r.fullName ?? '—'}</p>
                    <p className="text-xs text-gray-400">{r.email}</p>
                  </div>
                </div>
              </TD>
              <TD><span className="text-gray-500 text-xs">{r.mobile ?? '—'}</span></TD>
              <TD align="center">
                <div className="flex justify-center">
                  <Toggle checked={!!r.available} disabled={busy === r.id + 'a'} onChange={val => handleAvailable(r.id, val)} />
                </div>
              </TD>
              <TD align="center"><span className="font-medium text-gray-700">{completedByRider[r.id] ?? 0}</span></TD>
              <TD align="center">
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${isSuspended ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                  {isSuspended ? 'Suspended' : 'Active'}
                </span>
              </TD>
              <TD align="right">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => setDetailRider(r)}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg border border-[#1B6CA8]/40 text-[#1B6CA8] hover:bg-[#E8F4FD] transition-colors"
                  >
                    Details
                  </button>
                  <button disabled={busy === r.id}
                    onClick={() => setConfirm({ uid: r.id, status: isSuspended ? 'active' : 'suspended', label: isSuspended ? 'Activate' : 'Suspend', danger: !isSuspended, message: isSuspended ? `Reactivate rider ${r.fullName ?? r.email}?` : `Suspend rider ${r.fullName ?? r.email}?` })}
                    className={['text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors', isSuspended ? 'border-green-300 text-green-700 hover:bg-green-50' : 'border-red-300 text-red-600 hover:bg-red-50'].join(' ')}
                  >
                    {isSuspended ? 'Activate' : 'Suspend'}
                  </button>
                </div>
              </TD>
            </TR>
          )
        })}
      </TableWrap>
    </div>
  )
}

// ─── Analytics Tab ────────────────────────────────────────────────────────────

function AnalyticsTab({ orders, users }) {
  const completedOrders = useMemo(() => orders.filter(o => o.status === 'COMPLETED'), [orders])

  const monthlyRevenue = useMemo(() => {
    const year = new Date().getFullYear()
    const data = Array(12).fill(0)
    completedOrders.forEach(o => {
      if (!o.createdAt?.toDate) return
      const d = o.createdAt.toDate()
      if (d.getFullYear() === year) data[d.getMonth()] += o.finalPrice ?? o.estimatedPrice ?? 0
    })
    return data
  }, [completedOrders])

  const maxRev   = Math.max(...monthlyRevenue, 1)
  const totalRev = monthlyRevenue.reduce((s, v) => s + v, 0)
  const avgOrder = completedOrders.length > 0 ? totalRev / completedOrders.length : 0
  const completion = orders.length > 0 ? ((completedOrders.length / orders.length) * 100).toFixed(1) : '0.0'

  const topShops = useMemo(() => {
    const counts = {}
    orders.forEach(o => { const k = o.shopName ?? o.shopId; if (k) counts[k] = (counts[k] ?? 0) + 1 })
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5)
  }, [orders])

  const topRiders = useMemo(() => {
    const counts = {}
    completedOrders.forEach(o => {
      if (!o.riderId) return
      const n = users.find(u => u.id === o.riderId)?.fullName ?? o.riderId
      counts[n] = (counts[n] ?? 0) + 1
    })
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5)
  }, [completedOrders, users])

  const summaryStats = [
    { label: 'Total Revenue',      value: `₱${totalRev.toLocaleString()}`,          color: 'text-[#F5A623]'   },
    { label: 'Completed Orders',   value: completedOrders.length,                    color: 'text-emerald-600' },
    { label: 'Avg Order Value',    value: `₱${Math.round(avgOrder).toLocaleString()}`, color: 'text-[#1B6CA8]'   },
    { label: 'Completion Rate',    value: `${completion}%`,                           color: 'text-violet-600'  },
  ]

  return (
    <div className="space-y-8">
      <h2 className="font-heading font-bold text-[17px] text-gray-900">Analytics</h2>

      <div className="grid grid-cols-4 gap-4">
        {summaryStats.map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-[#e5e7eb] px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400 mb-2">{s.label}</p>
            <p className={`font-heading font-bold text-2xl leading-tight ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-[#e5e7eb] p-6">
        <p className="font-heading font-semibold text-gray-800 mb-6">Monthly Revenue — {new Date().getFullYear()}</p>
        <div className="flex items-end gap-2">
          {monthlyRevenue.map((val, i) => (
            <div key={i} className="flex-1 flex flex-col items-center group">
              <div className="relative w-full flex justify-center items-end" style={{ height: '160px' }}>
                <div
                  className="w-full rounded-t-lg bg-[#0A2540] group-hover:bg-[#1B6CA8] transition-colors relative"
                  style={{ height: `${(val / maxRev) * 160}px`, minHeight: val > 0 ? '4px' : '0' }}
                >
                  {val > 0 && (
                    <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-gray-600 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                      ₱{val.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-[10px] text-gray-400 mt-1.5">{MONTHS[i]}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {[
          { title: 'Top 5 Shops by Orders',        data: topShops,  color: '#0A2540', unit: 'orders'     },
          { title: 'Top 5 Riders by Deliveries',   data: topRiders, color: '#0EA5E9', unit: 'deliveries' },
        ].map(({ title, data, color, unit }) => (
          <div key={title} className="bg-white rounded-2xl border border-[#e5e7eb] p-5">
            <p className="font-heading font-semibold text-gray-800 mb-4">{title}</p>
            {data.length === 0
              ? <p className="text-sm text-gray-400 text-center py-6">No data yet</p>
              : (
                <div className="space-y-3">
                  {data.map(([name, count], i) => (
                    <div key={name} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-gray-400 w-4 text-right">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-800 truncate">{name}</span>
                          <span className="text-xs text-gray-500 shrink-0 ml-2">{count} {unit}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${(count / (data[0]?.[1] ?? 1)) * 100}%`, background: color }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            }
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────

function SettingsTab() {
  const [form,    setForm]    = useState(SETTINGS_DEFAULT)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)

  useEffect(() => {
    getDoc(doc(db, 'settings', 'platform'))
      .then(snap => { if (snap.exists()) setForm({ ...SETTINGS_DEFAULT, ...snap.data() }) })
      .finally(() => setLoading(false))
  }, [])

  async function handleSave() {
    setSaving(true); setSaved(false)
    try { await setDoc(doc(db, 'settings', 'platform'), form, { merge: true }); setSaved(true); setTimeout(() => setSaved(false), 3000) }
    finally { setSaving(false) }
  }

  if (loading) return <div className="text-gray-400 text-sm py-10 text-center">Loading settings…</div>

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="font-heading font-bold text-[17px] text-gray-900">Settings</h2>

      <div className="bg-white rounded-2xl border border-[#e5e7eb] p-6 space-y-5">
        <p className="font-heading font-semibold text-gray-800 border-b border-[#e5e7eb] pb-3">Platform Toggles</p>
        {[
          { key: 'maintenanceMode',       label: 'Maintenance Mode',        sub: 'Show a maintenance banner to all users' },
          { key: 'allowNewRegistrations', label: 'Allow New Registrations', sub: 'Let new users sign up on the platform' },
          { key: 'requireShopApproval',   label: 'Require Shop Approval',   sub: 'New shops must be manually approved before going live' },
        ].map(({ key, label, sub }) => (
          <div key={key} className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-gray-800">{label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
            </div>
            <Toggle checked={!!form[key]} onChange={val => setForm(f => ({ ...f, [key]: val }))} />
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-[#e5e7eb] p-6 space-y-4">
        <p className="font-heading font-semibold text-gray-800 border-b border-[#e5e7eb] pb-3">Platform Settings</p>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Platform Fee (%)</label>
          <input type="number" min="0" max="100" value={form.platformFee} onChange={e => setForm(f => ({ ...f, platformFee: +e.target.value }))}
            className="w-full px-4 py-2.5 rounded-xl border border-[#e5e7eb] text-sm outline-none focus:ring-2 focus:ring-[#1B6CA8]/30" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Support Email</label>
          <input type="email" value={form.supportEmail} placeholder="support@labadago.com" onChange={e => setForm(f => ({ ...f, supportEmail: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-xl border border-[#e5e7eb] text-sm outline-none focus:ring-2 focus:ring-[#1B6CA8]/30" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Announcement Banner</label>
          <textarea value={form.announcementBanner} placeholder="Leave blank to hide the banner" rows={3} onChange={e => setForm(f => ({ ...f, announcementBanner: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-xl border border-[#e5e7eb] text-sm outline-none focus:ring-2 focus:ring-[#1B6CA8]/30 resize-none" />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 rounded-xl bg-[#0A2540] text-white text-sm font-semibold hover:bg-[#0d3058] transition-colors disabled:opacity-60">
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
        {saved && <span className="text-sm text-green-600 font-medium">Saved successfully</span>}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const navigate        = useNavigate()
  const { user, userProfile } = useAuth()
  const menuRef         = useRef(null)
  const [activeTab,  setActiveTab]  = useState('Overview')
  const [menuOpen,   setMenuOpen]   = useState(false)
  const [orders,     setOrders]     = useState([])
  const [users,      setUsers]      = useState([])
  const [shops,      setShops]      = useState([])

  useEffect(() => {
    const u1 = onSnapshot(collection(db, 'orders'), snap => setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
    const u2 = onSnapshot(collection(db, 'users'),  snap => setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
    const u3 = onSnapshot(collection(db, 'shops'),  snap => setShops(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
    return () => { u1(); u2(); u3() }
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    function onClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [menuOpen])

  async function handleLogout() {
    await signOut(auth)
    navigate('/')
  }

  const activeOrders   = orders.filter(o => ACTIVE_STATUSES.has(o.status))
  const pendingShops   = shops.filter(s => !s.approved && s.status !== 'suspended')
  const riders         = users.filter(u => u.role === 'rider')

  const STATS = [
    { label: 'Total users',    value: users.length         },
    { label: 'Active orders',  value: activeOrders.length  },
    { label: 'Partner shops',  value: shops.length         },
    { label: 'Total riders',   value: riders.length        },
  ]

  const firstName = userProfile?.fullName?.split(' ')[0] ?? 'Admin'
  const hour      = new Date().getHours()
  const greeting  = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="flex h-screen bg-[#EDF1F7] overflow-hidden">

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside className="fixed top-0 left-0 h-screen w-[240px] bg-[#0A2540] flex flex-col z-20">
        <div className="px-5 pt-6 pb-5">
          <button onClick={() => navigate('/')} className="cursor-pointer hover:opacity-85 transition-opacity focus:outline-none">
            <Logo />
          </button>
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/30 mt-2 pl-1">Admin Portal</p>
        </div>

        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                activeTab === tab
                  ? 'bg-white text-[#0A2540] font-semibold shadow-sm'
                  : 'text-white/50 hover:text-white hover:bg-white/8'
              }`}
            >
              {TAB_ICONS[tab]}
              {tab}
            </button>
          ))}
        </nav>

        <div className="px-5 py-4 border-t border-white/10 shrink-0">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/30">LabadaGo v1.0</p>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────────────────── */}
      <div className="ml-[240px] flex-1 flex flex-col overflow-y-auto">

        {/* Top banner */}
        <div className="bg-[#0A2540] px-8 pt-7 pb-7 shrink-0">
          <div className="flex items-start justify-between mb-7">
            <div>
              <p className="text-white/40 text-xs font-medium mb-1 tracking-wide">
                {new Date().toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
              <h1 className="font-heading font-bold text-[1.6rem] text-white leading-tight">
                {greeting},{' '}
                <span className="text-[#F5A623]">{firstName}</span>
              </h1>
            </div>
            <div className="flex items-center gap-3">
              {/* Bell */}
              <div className="relative">
                <button className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/15 transition-colors">
                  <svg className="w-5 h-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                  </svg>
                </button>
                {pendingShops.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#F5A623] rounded-full text-[9px] font-bold text-[#0A2540] flex items-center justify-center">
                    {pendingShops.length}
                  </span>
                )}
              </div>

              {/* Avatar + dropdown */}
              <div className="relative flex items-center gap-2.5" ref={menuRef}>
                <div className="text-right">
                  <p className="text-sm font-semibold text-white leading-tight">{userProfile?.fullName ?? 'Admin'}</p>
                  <p className="text-[10px] text-white/40">Administrator</p>
                </div>
                <button
                  onClick={() => setMenuOpen(o => !o)}
                  className="w-9 h-9 rounded-full overflow-hidden bg-red-500 flex items-center justify-center shrink-0 hover:ring-2 hover:ring-white/30 transition-all focus:outline-none"
                >
                  {user?.photoURL
                    ? <img src={user.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    : <span className="text-white text-xs font-bold">{initials(userProfile?.fullName)}</span>
                  }
                </button>

                {menuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-44 bg-white rounded-2xl shadow-xl border border-[#e5e7eb] overflow-hidden z-50">
                    <button onClick={() => { setMenuOpen(false); navigate('/') }}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                    >
                      <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>
                      Home
                    </button>
                    <button onClick={() => { setMenuOpen(false); navigate('/profile') }}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                    >
                      <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                      My Profile
                    </button>
                    <div className="border-t border-[#e5e7eb]" />
                    <button onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors text-left"
                    >
                      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-4 gap-3">
            {STATS.map((stat, i) => (
              <div key={stat.label}
                className="bg-white/10 border border-white/15 rounded-2xl px-5 py-4 transition-all duration-200 hover:bg-white/[0.16] hover:border-white/30 hover:scale-[1.03] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 cursor-default"
              >
                <div className={`w-2 h-2 rounded-full ${STAT_DOTS[i]} mb-3`} />
                <p className="font-heading font-bold text-[2.2rem] text-white leading-none">{stat.value}</p>
                <p className="text-[11px] text-white/65 mt-2">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <main className="flex-1 p-8 space-y-6">
          {activeTab === 'Overview'  && <OverviewTab  orders={orders} users={users} shops={shops} />}
          {activeTab === 'Users'     && <UsersTab     users={users} />}
          {activeTab === 'Orders'    && <OrdersTab    orders={orders} />}
          {activeTab === 'Shops'     && <ShopsTab     shops={shops} users={users} orders={orders} />}
          {activeTab === 'Riders'    && <RidersTab    users={users} orders={orders} />}
          {activeTab === 'Analytics' && <AnalyticsTab orders={orders} users={users} />}
          {activeTab === 'Settings'  && <SettingsTab />}
        </main>
      </div>
    </div>
  )
}
