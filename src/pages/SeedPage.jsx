import { useState } from 'react'
import { seedShops } from '../scripts/seedShops'

export default function SeedPage() {
  const [status, setStatus] = useState('idle')
  const [count, setCount] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSeed() {
    setStatus('seeding')
    try {
      const n = await seedShops()
      setCount(n)
      setStatus('done')
    } catch (err) {
      setErrorMsg(err.message)
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F7FA] flex items-center justify-center p-8">
      <div className="bg-white rounded-2xl border border-[#e5e7eb] p-10 max-w-sm w-full text-center shadow-sm">
        <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          ⚠ Dev only — remove before production
        </div>

        <h1 className="font-heading font-bold text-xl text-gray-900 mb-2">Seed Firestore</h1>
        <p className="text-sm text-gray-500 mb-8">
          Writes all shops from{' '}
          <code className="bg-gray-100 px-1 rounded text-xs">shops.js</code> into the{' '}
          <code className="bg-gray-100 px-1 rounded text-xs">shops</code> collection.
          Existing documents with the same ID will be overwritten.
        </p>

        <button
          onClick={handleSeed}
          disabled={status === 'seeding' || status === 'done'}
          className="w-full bg-[#1B6CA8] text-white font-semibold py-2.5 rounded-lg hover:bg-[#155a8a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
        >
          {status === 'seeding' ? 'Seeding…' : 'Seed shops to Firestore'}
        </button>

        {status === 'done' && (
          <p className="mt-4 text-sm text-green-600 font-medium">Done! {count} shops written.</p>
        )}
        {status === 'error' && (
          <p className="mt-4 text-sm text-red-500">{errorMsg}</p>
        )}
      </div>
    </div>
  )
}
