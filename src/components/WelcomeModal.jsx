import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { collection, query, where, getDocs, limit } from 'firebase/firestore'
import { db, auth } from '../lib/firebase'

const STORAGE_KEY = 'labadago_show_welcome'

const CONFETTI_COLORS = ['#F5A623', '#FF6B35', '#1B6CA8', '#ffffff', '#2980C4']

function fireConfetti() {
  const end = Date.now() + 2500
  ;(function frame() {
    confetti({ particleCount: 4, angle: 60,  spread: 60, origin: { x: 0 }, colors: CONFETTI_COLORS })
    confetti({ particleCount: 4, angle: 120, spread: 60, origin: { x: 1 }, colors: CONFETTI_COLORS })
    if (Date.now() < end) requestAnimationFrame(frame)
  })()
}

export default function WelcomeModal() {
  const navigate  = useNavigate()
  const [name, setName] = useState(null)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return
    localStorage.removeItem(STORAGE_KEY)

    const uid = auth.currentUser?.uid
    if (!uid) {
      setName(stored)
      fireConfetti()
      return
    }

    // Suppress modal if the user already has at least one order
    getDocs(query(collection(db, 'orders'), where('customerId', '==', uid), limit(1)))
      .then(snap => {
        if (snap.empty) {
          setName(stored)
          fireConfetti()
        }
      })
      .catch(() => {
        setName(stored)
        fireConfetti()
      })
  }, [])

  useEffect(() => {
    if (!name) return
    function onKey(e) {
      if (e.key === 'Escape') setName(null)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [name])

  if (!name) return null

  const firstName = name.split(' ')[0]

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setName(null)}
      >
        <motion.div
          className="w-full max-w-sm bg-[#0c2d54] border border-white/20 rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.65)] p-8 text-center relative"
          initial={{ scale: 0.75, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.75, opacity: 0, y: 40 }}
          transition={{ type: 'spring', stiffness: 300, damping: 22 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={() => setName(null)}
            aria-label="Close"
            className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Icon */}
          <div className="mx-auto mb-5 w-16 h-16 rounded-full bg-gradient-to-br from-[#F5A623] to-[#FF6B35] flex items-center justify-center shadow-[0_8px_24px_rgba(245,166,35,0.45)]">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <h2 className="text-white font-heading font-bold text-2xl leading-tight mb-2">
            Welcome, {firstName}!
          </h2>
          <p className="text-white/55 text-sm leading-relaxed mb-7">
            Your LabadaGo account is ready. Browse verified laundry shops near you and place your first order.
          </p>

          <button
            type="button"
            onClick={() => { setName(null); navigate('/browse') }}
            className="w-full bg-gradient-to-r from-[#F5A623] to-[#FF6B35] text-white font-heading font-bold py-3 rounded-full text-sm tracking-wide hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(245,166,35,0.5)] active:translate-y-0 transition-all duration-200"
          >
            Start browsing
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
