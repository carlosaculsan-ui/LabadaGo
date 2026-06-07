import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'
import Logo from '../components/Logo'

function fmt(ts) {
  if (!ts?.toDate) return '—'
  return ts.toDate().toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })
}

function TimelineStep({ label, sublabel, state, last }) {
  const dot =
    state === 'done'     ? 'bg-emerald-500 border-emerald-500' :
    state === 'rejected' ? 'bg-red-500 border-red-500' :
    state === 'active'   ? 'border-[#1B6CA8] bg-white' :
                           'border-gray-200 bg-white'
  const line = state === 'done' ? 'bg-emerald-400' : 'bg-gray-100'
  const textColor = state === 'idle' ? 'text-gray-400' : 'text-gray-900'

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 ${dot}`}>
          {state === 'done' ? (
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : state === 'rejected' ? (
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : state === 'active' ? (
            <span className="w-2.5 h-2.5 rounded-full bg-[#1B6CA8]" />
          ) : (
            <span className="w-2.5 h-2.5 rounded-full bg-gray-200" />
          )}
        </div>
        {!last && <div className={`w-px flex-1 my-1 ${line}`} style={{ minHeight: 36 }} />}
      </div>
      <div className="pb-8">
        <p className={`text-sm font-semibold leading-none mb-1 ${textColor}`}>{label}</p>
        {sublabel && <p className="text-xs text-gray-500 mt-0.5">{sublabel}</p>}
      </div>
    </div>
  )
}

function Row({ label, value }) {
  if (!value) return null
  return (
    <div className="flex gap-4 text-sm py-1.5">
      <span className="text-gray-500 w-36 shrink-0">{label}</span>
      <span className="text-gray-800 font-medium break-words flex-1">{value}</span>
    </div>
  )
}

export default function MerchantApplication() {
  const { user } = useAuth()
  const navigate  = useNavigate()
  const [app, setApp]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.uid) return
    getDoc(doc(db, 'applications', user.uid)).then(snap => {
      if (snap.exists()) setApp(snap.data())
      setLoading(false)
    })
  }, [user?.uid])

  const status = app?.status ?? 'pending'

  const stepStates = {
    submitted:  'done',
    review:     status === 'approved' || status === 'rejected' ? 'done' : 'active',
    decision:   status === 'approved' ? 'done' : status === 'rejected' ? 'rejected' : 'idle',
  }

  const statusBadge =
    status === 'approved' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
    status === 'rejected' ? 'bg-red-100 text-red-600 border-red-200' :
                            'bg-amber-100 text-amber-700 border-amber-200'
  const statusLabel =
    status === 'approved' ? 'Approved' :
    status === 'rejected' ? 'Rejected' : 'Under Review'

  return (
    <div className="min-h-screen bg-[#F4F7FA]">

      {/* Top bar */}
      <header className="bg-[#0A2540] px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate('/merchant')} className="cursor-pointer hover:opacity-80 transition-opacity">
          <Logo />
        </button>
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/30">Merchant Portal</span>
      </header>

      <div className="max-w-[680px] mx-auto px-4 py-10">

        {/* Page title */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading font-bold text-2xl text-gray-900">Application Status</h1>
            <p className="text-sm text-gray-500 mt-1">Merchant application for LabadaGo</p>
          </div>
          {!loading && app && (
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${statusBadge}`}>
              {statusLabel}
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <span className="w-7 h-7 rounded-full border-2 border-[#1B6CA8]/20 border-t-[#1B6CA8] animate-spin" />
          </div>
        ) : !app ? (
          <div className="bg-white rounded-2xl border border-[#e5e7eb] p-10 text-center">
            <p className="text-gray-500 text-sm">No merchant application found for this account.</p>
            <button onClick={() => navigate('/apply/merchant')}
              className="mt-4 text-sm font-semibold text-[#1B6CA8] hover:underline">
              Apply as Merchant →
            </button>
          </div>
        ) : (
          <div className="space-y-5">

            {/* Timeline */}
            <div className="bg-white rounded-2xl border border-[#e5e7eb] p-6">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-6">Progress</p>
              <TimelineStep
                label="Application Submitted"
                sublabel={app.appliedAt ? `Submitted on ${fmt(app.appliedAt)}` : undefined}
                state={stepStates.submitted}
              />
              <TimelineStep
                label="Under Review"
                sublabel="Our team is reviewing your documents and shop details."
                state={stepStates.review}
              />
              <TimelineStep
                label={status === 'rejected' ? 'Application Rejected' : 'Approved'}
                sublabel={
                  status === 'approved' ? 'Your shop is live on LabadaGo.' :
                  status === 'rejected' ? 'Please contact support for more information.' :
                  'You will be notified once a decision is made.'
                }
                state={stepStates.decision}
                last
              />
            </div>

            {/* Submitted details */}
            <div className="bg-white rounded-2xl border border-[#e5e7eb] p-6">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-4">Submitted Information</p>
              <div className="divide-y divide-gray-50">
                <Row label="Full name"       value={app.fullName} />
                <Row label="Mobile"          value={app.mobile} />
                <Row label="Shop name"       value={app.shopName} />
                <Row label="Shop address"    value={app.shopAddress} />
                <Row label="GCash number"    value={app.gcash || '—'} />
                <Row label="Services"        value={app.services?.join(', ')} />
                <Row label="Turnaround"      value={app.turnaround || '—'} />
                <Row label="Machines"        value={app.machines || '—'} />
                <Row label="Max daily (kg)"  value={app.maxKg || '—'} />
                <Row label="Service radius"  value={app.serviceRadius ? `${app.serviceRadius} km` : '—'} />
                <Row label="Business Permit" value={app.bizPermit ? 'Uploaded ✓' : 'Not uploaded'} />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/merchant')}
                className="flex-1 bg-[#1B6CA8] hover:bg-[#155a8a] text-white text-sm font-bold py-3.5 rounded-xl transition-colors"
              >
                Go to my dashboard →
              </button>
              <button
                onClick={() => navigate('/')}
                className="px-6 py-3.5 rounded-xl border border-[#e5e7eb] text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Home
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
