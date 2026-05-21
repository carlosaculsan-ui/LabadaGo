import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'
import ShopCard from '../components/ShopCard'

// ─── Shared placeholder ───────────────────────────────────────────────────────
function ImgPlaceholder({ label, className, bg, borderColor }) {
  return (
    <div
      className={[
        bg ?? 'bg-gray-100',
        'border border-dashed',
        borderColor ?? 'border-gray-300',
        'rounded-xl flex items-center justify-center',
        className,
      ].join(' ')}
    >
      <span className="text-[8px] font-medium text-gray-600 text-center leading-snug px-2">
        {label}
      </span>
    </div>
  )
}

// ─── Static data ──────────────────────────────────────────────────────────────

const CARD_COLORS = [
  'bg-[#DBEAFE]', 'bg-[#D1FAE5]', 'bg-[#FEE2E2]',
  'bg-[#EDE9FE]', 'bg-[#FEF3C7]', 'bg-[#CCFBF1]',
]

const SERVICE_CHIPS = [
  { id: 'all',    label: 'All services',    param: null,              iconBg: 'bg-gray-200',   iconBorder: 'border-gray-400'   },
  { id: 'wash',   label: 'Wash & Fold',     param: 'Wash & Fold',     iconBg: 'bg-[#DBEAFE]',  iconBorder: 'border-blue-300'   },
  { id: 'dry',    label: 'Dry Cleaning',    param: 'Dry Cleaning',    iconBg: 'bg-[#EDE9FE]',  iconBorder: 'border-purple-300' },
  { id: 'comf',   label: 'Comforters',      param: 'Comforters',      iconBg: 'bg-[#D1FAE5]',  iconBorder: 'border-green-300'  },
  { id: 'towels', label: 'Towels & Linens', param: 'Towels & Linens', iconBg: 'bg-[#FEF3C7]',  iconBorder: 'border-amber-300'  },
]

const HOW_STEPS = [
  {
    num: 1,
    label: 'Choose a shop',
    desc: 'Browse verified laundry shops near you and filter by service or price.',
    bg: 'bg-[#DBEAFE]',
    border: 'border-blue-300',
    imgLabel: 'Step 1 illustration — user browsing laundry shops on a mobile screen',
  },
  {
    num: 2,
    label: 'Schedule pickup',
    desc: "Pick a convenient time slot and we'll come to your door to collect.",
    bg: 'bg-[#FEF3C7]',
    border: 'border-amber-300',
    imgLabel: 'Step 2 illustration — calendar with a selected pickup date',
  },
  {
    num: 3,
    label: 'We wash & fold',
    desc: 'Your preferred shop handles washing, drying, and folding with care.',
    bg: 'bg-[#D1FAE5]',
    border: 'border-green-300',
    imgLabel: 'Step 3 illustration — laundry machine running a wash cycle',
  },
  {
    num: 4,
    label: 'Delivered to you',
    desc: 'Fresh, clean laundry returned to your doorstep on the day you chose.',
    bg: 'bg-[#CCFBF1]',
    border: 'border-teal-300',
    imgLabel: 'Step 4 illustration — delivery rider handing folded laundry bag to customer at door',
  },
]

const FOOTER_LINKS = {
  Company: ['About us', 'Careers', 'Press'],
  Support:  ['Help center', 'Contact', 'FAQs'],
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ShopSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-[#e5e7eb] overflow-hidden animate-pulse">
      <div className="bg-gray-200 h-36" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="h-3 bg-gray-100 rounded w-1/3" />
        <div className="flex gap-2 mt-2">
          <div className="h-5 bg-gray-100 rounded-full w-20" />
          <div className="h-5 bg-gray-100 rounded-full w-24" />
        </div>
        <div className="flex justify-between items-center pt-3 border-t border-[#e5e7eb]">
          <div className="h-4 bg-gray-200 rounded w-16" />
          <div className="h-7 bg-gray-200 rounded-lg w-20" />
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const navigate = useNavigate()
  const { user, userProfile, role } = useAuth()

  const firstName = (userProfile?.fullName ?? user?.displayName ?? '').split(' ')[0] || ''

  const [activeChip,      setActiveChip]      = useState('all')
  const [nearbyShops,     setNearbyShops]     = useState([])
  const [shopsLoading,    setShopsLoading]    = useState(true)
  const [shopsCount,      setShopsCount]      = useState(14)
  const [userOrderCount,  setUserOrderCount]  = useState(0)
  const [activeOrderCount, setActiveOrderCount] = useState(0)
  const [userDataLoaded,  setUserDataLoaded]  = useState(false)

  // Fetch shops — count + first 3 for preview
  useEffect(() => {
    getDocs(collection(db, 'shops')).then(snap => {
      setShopsCount(snap.size)
      const data = snap.docs.slice(0, 3).map((d, i) => ({
        ...d.data(),
        id: d.id,
        color: CARD_COLORS[i % CARD_COLORS.length],
        distanceKm: d.data().distanceKm ?? +(Math.random() * 4 + 0.5).toFixed(1),
      }))
      setNearbyShops(data)
      setShopsLoading(false)
    }).catch(() => setShopsLoading(false))
  }, [])

  // Fetch user's orders once — derive total count + active count
  useEffect(() => {
    if (!user?.uid) return
    getDocs(query(collection(db, 'orders'), where('customerId', '==', user.uid)))
      .then(snap => {
        setUserOrderCount(snap.size)
        setActiveOrderCount(
          snap.docs.filter(d => !['COMPLETED', 'CANCELLED'].includes(d.data().status)).length
        )
        setUserDataLoaded(true)
      })
      .catch(() => setUserDataLoaded(true))
  }, [user?.uid])

  function handleChipClick(chip) {
    setActiveChip(chip.id)
    navigate(chip.param ? `/browse?service=${encodeURIComponent(chip.param)}` : '/browse')
  }

  // Stats bar — add personal stat when logged in
  const displayStats = [
    { value: String(shopsCount), label: 'partner shops'    },
    { value: '4.8★',             label: 'avg rating'       },
    { value: 'Same-day',         label: 'pickup available' },
    ...(user && userDataLoaded
      ? [{ value: String(userOrderCount), label: 'your orders' }]
      : []),
  ]

  const isLoggedIn = !!user

  return (
    <>
      {/* ── Active order banner ─────────────────────────────────────────────── */}
      {isLoggedIn && userDataLoaded && activeOrderCount > 0 && (
        <div className="w-full bg-[#1B6CA8] px-8 py-2.5 flex items-center justify-center gap-2">
          <span className="text-white text-sm">
            👋 Welcome back, {firstName}! You have{' '}
            <span className="font-semibold">{activeOrderCount}</span>{' '}
            active order{activeOrderCount !== 1 ? 's' : ''}.
          </span>
          <Link
            to="/my-orders"
            className="text-[#F5A623] text-sm font-semibold hover:underline underline-offset-2 whitespace-nowrap"
          >
            Track them →
          </Link>
        </div>
      )}

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="bg-[#0D3F6B] relative overflow-hidden">

        {/* Decorative circles */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full border border-white/10 pointer-events-none" />
        <div className="absolute top-12 right-52 w-52 h-52 rounded-full border border-white/[0.06] pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-72 h-72 rounded-full border border-white/10 pointer-events-none" />
        <div className="absolute bottom-10 left-[38%] w-36 h-36 rounded-full bg-white/[0.03] pointer-events-none" />

        <div className="max-w-[1280px] mx-auto px-8 py-16 relative z-10 grid grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#F5A623] mb-4">
              {isLoggedIn && firstName ? `Welcome back, ${firstName}!` : 'Welcome back'}
            </p>
            <h1 className="font-heading font-bold text-5xl leading-[1.1] tracking-tight text-white mb-5">
              Laundry picked up,<br />
              <span className="text-[#F5A623]">washed, delivered.</span>
            </h1>
            <p className="text-[#8DB8D8] text-base leading-relaxed mb-8 max-w-[420px]">
              Connecting you with verified local laundry shops in your neighborhood. Pickup, wash, fold, and deliver — all in one place.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(isLoggedIn ? '/checkout' : '/signin')}
                className="bg-[#F5A623] text-[#0D3F6B] font-semibold px-6 py-2.5 rounded-lg hover:bg-[#e89b15] transition-colors text-sm"
              >
                Book a pickup
              </button>
              <button
                onClick={() => navigate('/browse')}
                className="border border-white/70 text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-white/10 transition-colors text-sm"
              >
                Browse shops
              </button>
            </div>
          </div>

          <ImgPlaceholder
            label="Hero image — rider handing laundry bag at doorstep, warm natural light, local PH feel"
            className="h-[280px]"
            bg="bg-white/10"
            borderColor="border-white/30"
          />
        </div>
      </section>

      {/* ── Service chips ─────────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-[#e5e7eb]">
        <div className="max-w-[1280px] mx-auto px-8">
          <div className="flex items-center gap-3 overflow-x-auto py-4">
            {SERVICE_CHIPS.map(chip => (
              <button
                key={chip.id}
                onClick={() => handleChipClick(chip)}
                className={[
                  'flex items-center gap-2.5 pl-2.5 pr-4 py-1.5 rounded-full border text-sm font-medium whitespace-nowrap transition-colors shrink-0',
                  activeChip === chip.id
                    ? 'bg-[#1B6CA8] border-[#1B6CA8] text-white'
                    : 'border-[#e5e7eb] text-gray-700 hover:border-[#1B6CA8] hover:text-[#1B6CA8]',
                ].join(' ')}
              >
                <div
                  className={[
                    'w-6 h-6 rounded border border-dashed shrink-0',
                    chip.iconBg,
                    chip.iconBorder,
                  ].join(' ')}
                />
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats bar ─────────────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-[#e5e7eb]">
        <div className="max-w-[1280px] mx-auto px-8 py-8">
          <div className="flex items-center justify-center divide-x divide-[#e5e7eb]">
            {displayStats.map(stat => (
              <div
                key={stat.label}
                className="h-16 flex-1 flex flex-col items-center justify-center px-6"
              >
                <p className="font-heading font-bold text-[1.75rem] text-[#1B6CA8] leading-none">
                  {stat.value}
                </p>
                <p className="text-xs text-gray-600 mt-1.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Nearby shops ──────────────────────────────────────────────────────── */}
      <section className="bg-white py-14">
        <div className="max-w-[1280px] mx-auto px-8">
          <div className="flex items-baseline justify-between mb-7">
            <h2 className="font-heading font-bold text-[1.6rem] text-gray-900">
              Shops near you
            </h2>
            <Link
              to="/browse"
              className="text-sm font-medium text-[#1B6CA8] hover:underline underline-offset-2"
            >
              See all →
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-5">
            {shopsLoading ? (
              <>
                <ShopSkeleton />
                <ShopSkeleton />
                <ShopSkeleton />
              </>
            ) : (
              nearbyShops.map(shop => (
                <ShopCard key={shop.id} {...shop} />
              ))
            )}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────────────── */}
      <section className="bg-[#F4F7FA] py-16">
        <div className="max-w-[1280px] mx-auto px-8">

          <div className="text-center mb-14">
            <h2 className="font-heading font-bold text-[1.6rem] text-gray-900">
              {isLoggedIn ? "Your laundry journey" : "How LabadaGo works"}
            </h2>
            <p className="text-sm text-gray-600 mt-2">
              {isLoggedIn
                ? <span>You&rsquo;re all set! Here&rsquo;s a reminder of how it works.</span>
                : 'From your door to the wash and back — four simple steps.'}
            </p>
          </div>

          <div className="relative grid grid-cols-4 gap-8">
            <div className="absolute top-4 left-[12.5%] right-[12.5%] border-t-2 border-dashed border-gray-300 pointer-events-none" />

            {HOW_STEPS.map(step => (
              <div key={step.num} className="flex flex-col items-center text-center">
                <div className="relative z-10 w-8 h-8 rounded-full bg-[#1B6CA8] text-white text-sm font-bold flex items-center justify-center mb-4 shrink-0">
                  {step.num}
                </div>
                <ImgPlaceholder
                  label={step.imgLabel}
                  className="w-16 h-16 mb-4 rounded-xl"
                  bg={step.bg}
                  borderColor={step.border}
                />
                <h3 className="font-heading font-bold text-[15px] text-gray-900 mb-2">
                  {step.label}
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────────── */}
      <footer className="bg-[#0D3F6B]">
        <div className="max-w-[1280px] mx-auto px-8 py-12 flex items-start justify-between gap-16">

          <div className="max-w-[280px]">
            <div className="mb-4">
              <img src="/LabadaGoLogo.png" alt="LabadaGo" className="h-8 w-auto" />
            </div>
            <p className="text-[#8DB8D8] text-sm leading-relaxed">
              Pickup, wash, and delivery — connecting you with verified local laundry shops across the Philippines.
            </p>
          </div>

          <div className="flex gap-16 shrink-0">
            {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
              <div key={heading}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-white/40 mb-4">
                  {heading}
                </p>
                <ul className="space-y-2.5">
                  {links.map(link => (
                    <li key={link}>
                      <a href="#" className="text-sm text-[#8DB8D8] hover:text-white transition-colors">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

        </div>

        <div className="border-t border-white/10">
          <div className="max-w-[1280px] mx-auto px-8 py-4 flex items-center justify-between">
            <p className="text-xs text-white/40">© 2026 LabadaGo. All rights reserved.</p>
            <p className="text-xs text-white/25">Made with care in the Philippines.</p>
          </div>
        </div>
      </footer>
    </>
  )
}
