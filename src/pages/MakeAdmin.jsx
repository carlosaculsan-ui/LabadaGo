import { useState } from 'react'
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'

export default function MakeAdmin() {
  const [email,   setEmail]   = useState('')
  const [result,  setResult]  = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState('')

  async function handleSearch(e) {
    e.preventDefault()
    setResult(null); setError(''); setSuccess('')
    if (!email.trim()) return
    setLoading(true)
    try {
      const snap = await getDocs(collection(db, 'users'))
      const match = snap.docs.find(d => d.data().email?.toLowerCase() === email.trim().toLowerCase())
      if (!match) { setError('No user found with that email.'); return }
      setResult({ id: match.id, ...match.data() })
    } catch (err) {
      setError('Error searching: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleMakeAdmin() {
    if (!result) return
    setLoading(true); setError(''); setSuccess('')
    try {
      await updateDoc(doc(db, 'users', result.id), { role: 'admin' })
      setSuccess(`${result.fullName ?? result.email} is now an admin.`)
      setResult(prev => ({ ...prev, role: 'admin' }))
    } catch (err) {
      setError('Error updating role: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F7FA] flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-5">

        {/* Dev warning */}
        <div className="bg-amber-50 border border-amber-300 rounded-xl px-4 py-3 flex items-start gap-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="2" className="w-4 h-4 mt-0.5 shrink-0"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <p className="text-xs text-amber-700 font-medium">Dev tool — remove this page before going to production.</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#e5e7eb] p-6 shadow-sm">
          <h1 className="font-heading font-bold text-xl text-gray-900 mb-1">Make Admin</h1>
          <p className="text-sm text-gray-500 mb-6">Search a user by email and promote them to admin.</p>

          <form onSubmit={handleSearch} className="flex gap-2 mb-5">
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="user@email.com"
              className="flex-1 px-4 py-2.5 rounded-xl border border-[#e5e7eb] text-sm outline-none focus:ring-2 focus:ring-[#1B6CA8]/30"
            />
            <button type="submit" disabled={loading || !email.trim()}
              className="px-4 py-2.5 rounded-xl bg-[#1B6CA8] text-white text-sm font-semibold hover:bg-[#155a8a] transition-colors disabled:opacity-60"
            >
              {loading ? '…' : 'Search'}
            </button>
          </form>

          {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
          {success && <p className="text-sm text-green-600 font-medium mb-4">{success}</p>}

          {result && (
            <div className="bg-[#F4F7FA] rounded-xl p-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-gray-900 text-sm">{result.fullName ?? '—'}</p>
                <p className="text-xs text-gray-500">{result.email}</p>
                <span className={[
                  'inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize',
                  result.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600',
                ].join(' ')}>
                  {result.role ?? 'customer'}
                </span>
              </div>
              {result.role !== 'admin' && (
                <button onClick={handleMakeAdmin} disabled={loading}
                  className="shrink-0 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-60"
                >
                  Make Admin
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
