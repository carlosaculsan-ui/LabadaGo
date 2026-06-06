import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'

const STORAGE_KEY = 'labadago_show_welcome'

export default function WelcomeModal() {
  const [name, setName] = useState(null)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return
    setName(stored)
    localStorage.removeItem(STORAGE_KEY)

    const colors = ['#F5A623', '#FF6B35', '#1B6CA8', '#ffffff', '#2980C4']
    const end = Date.now() + 2500

    ;(function frame() {
      confetti({ particleCount: 4, angle: 60,  spread: 60, origin: { x: 0 }, colors })
      confetti({ particleCount: 4, angle: 120, spread: 60, origin: { x: 1 }, colors })
      if (Date.now() < end) requestAnimationFrame(frame)
    })()
  }, [])

  if (!name) return null

  const firstName = name.split(' ')[0]

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="w-full max-w-sm bg-[#0c2d54] border border-white/20 rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.65)] p-8 text-center"
          initial={{ scale: 0.75, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.75, opacity: 0, y: 40 }}
          transition={{ type: 'spring', stiffness: 300, damping: 22 }}
        >
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
            onClick={() => setName(null)}
            className="w-full bg-gradient-to-r from-[#F5A623] to-[#FF6B35] text-white font-heading font-bold py-3 rounded-full text-sm tracking-wide hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(245,166,35,0.5)] active:translate-y-0 transition-all duration-200"
          >
            Start browsing
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
