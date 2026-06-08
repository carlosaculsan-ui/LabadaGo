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

const MOCK_SHOPS = [
  {
    id: 'mock-1', name: 'Sunshine Laundry',   address: '12 Rizal St, Barangay Sta. Cruz',
    rating: 4.9, distanceKm: 0.8, pricePerKg: 65,
    services: ['Wash & Fold', 'Dry Cleaning'], isOpen: true,  isFeatured: true,  color: CARD_COLORS[0], image: '/SunshineLaundry.png',
  },
  {
    id: 'mock-2', name: 'CleanWave Express',  address: '45 Mabini Ave, Poblacion',
    rating: 4.7, distanceKm: 1.4, pricePerKg: 55,
    services: ['Wash & Fold', 'Comforters'],   isOpen: true,  isFeatured: false, color: CARD_COLORS[1], image: '/CleanwaveExpress.png',
  },
  {
    id: 'mock-3', name: 'FreshFold Laundromat', address: '8 Del Pilar Rd, San Antonio',
    rating: 4.6, distanceKm: 2.1, pricePerKg: 50,
    services: ['Wash & Fold', 'Towels & Linens'], isOpen: false, isFeatured: false, color: CARD_COLORS[2], image: '/FreshFold.png',
  },
  {
    id: 'mock-4', name: 'BubbleKing Laundry', address: '33 Luna Blvd, Bagong Silang',
    rating: 4.8, distanceKm: 2.7, pricePerKg: 60,
    services: ['Dry Cleaning', 'Comforters'],  isOpen: true,  isFeatured: false, color: CARD_COLORS[3], image: '/BubbleKingLaundry.png',
  },
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

const CITIES = ['All', 'Manila', 'Quezon City', 'Makati', 'Pasig', 'Mandaluyong']

const TESTIMONIALS = [
  {
    name: 'Maria Santos',
    location: 'Quezon City',
    rating: 5,
    text: 'Super convenient! Kinuha nila yung labada ko ng umaga, tapos delivered na agad ng hapon — fresh pa! Uulitin ko talaga.',
    initials: 'MS',
    color: 'bg-[#DBEAFE]',
    textColor: 'text-[#1B6CA8]',
  },
  {
    name: 'Carlo Reyes',
    location: 'Makati',
    rating: 5,
    text: 'Sa wakas may laundry service na nakakarating talaga on time. Ang ganda pa ng pagkakafold ng damit, parang bagong laba. 10/10.',
    initials: 'CR',
    color: 'bg-[#D1FAE5]',
    textColor: 'text-[#059669]',
  },
  {
    name: 'Jessa Flores',
    location: 'Pasig',
    rating: 5,
    text: 'Dalawang buwan na akong gumagamit ng LabadaGo every week. Grabe ang naiipon kong oras — consistent pa ang quality lagi!',
    initials: 'JF',
    color: 'bg-[#EDE9FE]',
    textColor: 'text-[#7C3AED]',
  },
]

const FAQ_ITEMS = [
  {
    q: 'How does LabadaGo work?',
    a: 'Choose a verified shop near you, pick a convenient pickup time, and a rider collects your laundry from your door. The shop washes, dries, and folds everything, then delivers it back clean on the date you selected — you don\'t leave the house.',
  },
  {
    q: 'How much does a pickup cost?',
    a: 'Pricing depends on the shop and service type. Most shops start at ₱50 per kg for wash & fold. A ₱49 pickup fee and ₱49 delivery fee apply per order. You\'ll see the full estimated total on the booking page before you confirm.',
  },
  {
    q: 'How do I know the shops are trustworthy?',
    a: 'Every shop on LabadaGo is personally inspected before being listed. We verify the business permit, check the equipment, and confirm the facility is clean and operational. Shops that receive consistent complaints are suspended immediately.',
  },
  {
    q: 'What happens if my clothes are damaged or lost?',
    a: 'Report the issue through your order page within 48 hours of delivery. Our team coordinates with the shop for a resolution — repair, replacement value, or a refund depending on the situation. We take every claim seriously.',
  },
  {
    q: 'Can I cancel my order after booking?',
    a: 'Yes — as long as the rider hasn\'t picked up your laundry yet. A "Cancel order" link appears on your order tracking page while the status is still PENDING. Once pickup is underway, cancellation is no longer available.',
  },
  {
    q: 'How is the final price determined?',
    a: 'We estimate the cost using the weight you enter at checkout. After the shop physically weighs your laundry, the price is adjusted to reflect the actual weight. You\'ll be notified of the final amount before any payment is collected.',
  },
]

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
  const [shopsCount,      setShopsCount]      = useState(null)
  const [userOrderCount,  setUserOrderCount]  = useState(0)
  const [activeOrderCount, setActiveOrderCount] = useState(0)
  const [userDataLoaded,  setUserDataLoaded]  = useState(false)
  const [openFaq,         setOpenFaq]         = useState(null)
  const [selectedCity,    setSelectedCity]    = useState('All')

  // Fetch shops — count + first 4 for preview; pad with mocks if fewer than 4
  useEffect(() => {
    getDocs(collection(db, 'shops')).then(snap => {
      setShopsCount(snap.size || MOCK_SHOPS.length)
      const real = snap.docs.slice(0, 4).map((d, i) => ({
        ...d.data(),
        id: d.id,
        color: CARD_COLORS[i % CARD_COLORS.length],
        distanceKm: d.data().distanceKm ?? +(Math.random() * 4 + 0.5).toFixed(1),
      }))
      const padded = [
        ...real,
        ...MOCK_SHOPS.slice(real.length, 4),
      ]
      setNearbyShops(padded)
      setShopsLoading(false)
    }).catch(() => {
      setShopsCount(MOCK_SHOPS.length)
      setNearbyShops(MOCK_SHOPS)
      setShopsLoading(false)
    })
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

  const coreStats = [
    { value: shopsCount != null ? String(shopsCount) : '—', label: 'partner shops'    },
    { value: '4.8★',             label: 'avg rating'       },
    { value: 'Same-day',         label: 'pickup available' },
  ]
  const showPersonalStat = user && userDataLoaded && userOrderCount > 0

  const isLoggedIn = !!user

  return (
    <>
      {/* ── Active order banner ─────────────────────────────────────────────── */}
      {isLoggedIn && userDataLoaded && activeOrderCount > 0 && (
        <div className="w-full bg-[#1B6CA8] px-4 md:px-8 py-2.5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
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
      <section className="relative overflow-hidden min-h-screen flex flex-col justify-center -mt-[88px]">

        {/* Video background — drop your mp4 src here */}
        <video
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay muted loop playsInline
          src="/Hero.mp4"
        />

        {/* Dark overlay — adjust opacity to taste once video is in */}
        <div className="absolute inset-0 bg-[#0D3F6B]/55" />

        {/* Content */}
        <div className="relative z-10 max-w-[1280px] mx-auto px-6 md:px-12 w-full pt-28 pb-16 md:pb-24">
          <div className="max-w-full md:max-w-[55%]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#F5A623] mb-4 md:mb-5">
              {isLoggedIn && firstName ? `Welcome back, ${firstName}!` : 'Your neighborhood laundry service'}
            </p>
            <h1 className="font-heading font-bold text-[2.8rem] md:text-[5rem] leading-[1.05] md:leading-[1.0] tracking-tight text-white mb-5 md:mb-6">
              Laundry picked up,<br />
              <span className="text-[#F5A623]">washed, delivered.</span>
            </h1>
            <p className="text-white/70 text-base md:text-[1.1rem] leading-relaxed mb-5 md:mb-6">
              Connecting you with verified local laundry shops in your neighborhood. Pickup, wash, fold, and deliver — all in one place.
            </p>

            {/* Pricing comparison hook */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mb-7 md:mb-10">
              <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2">
                <span className="text-[#F5A623] font-bold text-sm">From ₱48/kg</span>
                <span className="text-white/50 text-xs">· door-to-door</span>
              </div>
              <span className="text-white/30 text-xs font-semibold uppercase tracking-wider">vs.</span>
              <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-4 py-2">
                <span className="text-white/35 text-xs line-through">2-hr laundromat trip</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <button
                onClick={() => navigate('/browse')}
                className="bg-[#F5A623] text-[#0D3F6B] font-bold px-8 md:px-10 py-3.5 md:py-4 rounded-xl hover:bg-[#e89b15] transition-colors text-base w-full sm:w-auto"
              >
                Browse shops
              </button>
              <button
                onClick={() => navigate(isLoggedIn ? '/browse' : '/signin')}
                className="border-2 border-white/60 text-white font-semibold px-8 md:px-10 py-3.5 md:py-4 rounded-xl hover:bg-white/10 transition-colors text-base w-full sm:w-auto"
              >
                Book a pickup
              </button>
            </div>
          </div>
        </div>

      </section>

      {/* ── Stats ────────────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden py-12"
        style={{ background: 'linear-gradient(135deg, #0A3358, #1B6CA8, #2980C4, #0A3358)', backgroundSize: '300% 300%', animation: 'gradient-shift 15s ease infinite' }}
      >
        {/* Bubbles */}
        <div className="absolute inset-0 pointer-events-none">
          {[
            { w: 200, top: '10%', left: '5%'  },
            { w: 100, top: '60%', left: '2%'  },
            { w: 260, top: '5%',  left: '80%' },
            { w: 80,  top: '70%', left: '90%' },
            { w: 140, top: '40%', left: '50%' },
          ].map((b, i) => (
            <div
              key={i}
              className="absolute rounded-full border border-white"
              style={{
                width: b.w, height: b.w, top: b.top, left: b.left,
                opacity: 0.08 + (i % 3) * 0.04,
                animation: `${i % 2 === 0 ? 'bubble-float' : 'bubble-drift'} ${5 + i * 1.2}s ease-in-out ${-(i * 1.0).toFixed(1)}s infinite`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 max-w-[1280px] mx-auto px-4 md:px-8">
          <div className={`grid gap-3 md:gap-4 ${showPersonalStat ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-6' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5'}`}>

            <div className="bg-white/10 border border-white/20 rounded-2xl px-3 py-4 sm:px-6 sm:py-6 flex flex-col items-center text-center hover:bg-white/20 hover:-translate-y-1 transition-all duration-200 cursor-default backdrop-blur-sm">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-[#DBEAFE]/20 flex items-center justify-center mb-3 sm:mb-4">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-5 h-5">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/>
                </svg>
              </div>
              <p className="font-heading font-bold text-[1.75rem] text-white leading-none">{shopsCount != null ? `${shopsCount}+` : '—'}</p>
              <p className="text-[11px] text-white/60 mt-2">partner shops</p>
            </div>

            <div className="bg-white/10 border border-white/20 rounded-2xl px-3 py-4 sm:px-6 sm:py-6 flex flex-col items-center text-center hover:bg-white/20 hover:-translate-y-1 transition-all duration-200 cursor-default backdrop-blur-sm">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-[#FEF3C7]/20 flex items-center justify-center mb-3 sm:mb-4">
                <svg viewBox="0 0 24 24" fill="#F5A623" className="w-5 h-5">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <p className="font-heading font-bold text-[1.75rem] text-white leading-none">4.8★</p>
              <p className="text-[11px] text-white/60 mt-2">avg rating</p>
            </div>

            <div className="bg-white/10 border border-white/20 rounded-2xl px-3 py-4 sm:px-6 sm:py-6 flex flex-col items-center text-center hover:bg-white/20 hover:-translate-y-1 transition-all duration-200 cursor-default backdrop-blur-sm">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-[#D1FAE5]/20 flex items-center justify-center mb-3 sm:mb-4">
                <svg viewBox="0 0 24 24" fill="#34D399" className="w-5 h-5">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
              </div>
              <p className="font-heading font-bold text-[1.75rem] text-white leading-none">Same-day</p>
              <p className="text-[11px] text-white/60 mt-2">pickup available</p>
            </div>

            <div className="bg-white/10 border border-white/20 rounded-2xl px-3 py-4 sm:px-6 sm:py-6 flex flex-col items-center text-center hover:bg-white/20 hover:-translate-y-1 transition-all duration-200 cursor-default backdrop-blur-sm">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-[#EDE9FE]/20 flex items-center justify-center mb-3 sm:mb-4">
                <svg viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="2" className="w-5 h-5">
                  <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                </svg>
              </div>
              <p className="font-heading font-bold text-[1.75rem] text-white leading-none">₱48+</p>
              <p className="text-[11px] text-white/60 mt-2">starting price / kg</p>
            </div>

            <div className="bg-white/10 border border-white/20 rounded-2xl px-3 py-4 sm:px-6 sm:py-6 flex flex-col items-center text-center hover:bg-white/20 hover:-translate-y-1 transition-all duration-200 cursor-default backdrop-blur-sm">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-[#CCFBF1]/20 flex items-center justify-center mb-3 sm:mb-4">
                <svg viewBox="0 0 24 24" fill="none" stroke="#2DD4BF" strokeWidth="2" className="w-5 h-5">
                  <rect x="1" y="3" width="15" height="13"/><polygon points="16,8 20,8 23,11 23,16 16,16 16,8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
                </svg>
              </div>
              <p className="font-heading font-bold text-[1.75rem] text-white leading-none">2-hr</p>
              <p className="text-[11px] text-white/60 mt-2">pickup window</p>
            </div>

            {showPersonalStat && (
              <div className="bg-white/10 border border-white/20 rounded-2xl px-3 py-4 sm:px-6 sm:py-6 flex flex-col items-center text-center hover:bg-white/20 hover:-translate-y-1 transition-all duration-200 cursor-default backdrop-blur-sm">
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-[#FEE2E2]/20 flex items-center justify-center mb-3 sm:mb-4">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#FCA5A5" strokeWidth="2" className="w-5 h-5">
                    <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
                  </svg>
                </div>
                <p className="font-heading font-bold text-[1.75rem] text-white leading-none">{userOrderCount}</p>
                <p className="text-[11px] text-white/60 mt-2">orders placed</p>
              </div>
            )}

          </div>
        </div>
      </section>

      {/* ── Nearby shops ──────────────────────────────────────────────────────── */}
      <section id="nearby-shops" className="bg-white py-10 md:py-14">
        <div className="max-w-[1280px] mx-auto px-4 md:px-8">
          <div className="flex items-start justify-between mb-5 md:mb-7">
            <div>
              <h2 className="font-heading font-bold text-[1.6rem] text-gray-900">
                {selectedCity === 'All' ? 'Shops near you' : `Shops in ${selectedCity}`}
              </h2>
              <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                {CITIES.map(city => (
                  <button
                    key={city}
                    onClick={() => setSelectedCity(city)}
                    className={[
                      'text-xs font-medium px-3 py-1 rounded-full border transition-colors',
                      selectedCity === city
                        ? 'bg-[#1B6CA8] text-white border-[#1B6CA8]'
                        : 'bg-white text-gray-600 border-[#e5e7eb] hover:border-[#1B6CA8] hover:text-[#1B6CA8]',
                    ].join(' ')}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>
            <Link
              to={selectedCity === 'All' ? '/browse' : `/browse?search=${encodeURIComponent(selectedCity)}`}
              className="text-sm font-medium text-[#1B6CA8] hover:underline underline-offset-2 shrink-0 mt-1"
            >
              See all →
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
            {shopsLoading ? (
              <>
                <ShopSkeleton />
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

      {/* ── Trust / verification ─────────────────────────────────────────────── */}
      <section className="bg-white border-y border-[#e5e7eb] py-8 md:py-9">
        <div className="max-w-[1280px] mx-auto px-4 md:px-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:gap-10">
            <div className="shrink-0 md:min-w-[160px]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#1B6CA8] mb-1">
                LabadaGo verified
              </p>
              <p className="text-xs text-gray-500 leading-snug">
                What it takes to list on our platform
              </p>
            </div>
            <div className="hidden md:block w-px self-stretch bg-[#e5e7eb] shrink-0" />
            <div className="grid grid-cols-2 gap-4 md:flex md:items-start md:gap-8 md:flex-1">
              {[
                { title: 'On-site inspection',       desc: 'Every shop is physically visited and assessed before being approved.' },
                { title: 'Valid business permit',     desc: 'Shops must hold a current DTI or city-issued business permit.'       },
                { title: 'Verified customer ratings', desc: 'Star ratings only appear after an order is marked delivered.'        },
                { title: '48-hr damage resolution',   desc: 'Any damage or loss claim is reviewed and resolved within 48 hours.'  },
              ].map(item => (
                <div key={item.title} className="flex items-start gap-2.5 min-w-0">
                  <div className="w-5 h-5 rounded-full bg-[#D1FAE5] flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-[#059669]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 leading-snug">{item.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="bg-[#F4F7FA] py-12 md:py-16">
        <div className="max-w-[1280px] mx-auto px-4 md:px-8">

          <div className="text-center mb-8 md:mb-14">
            <h2 className="font-heading font-bold text-[1.6rem] text-gray-900">
              {isLoggedIn ? "Your laundry journey" : "How LabadaGo works"}
            </h2>
            <p className="text-sm text-gray-600 mt-2">
              {isLoggedIn
                ? <span>You&rsquo;re all set! Here&rsquo;s a reminder of how it works.</span>
                : 'From your door to the wash and back — four simple steps.'}
            </p>
          </div>

          <div className="relative grid grid-cols-2 gap-4 pt-8 md:grid-cols-4 md:gap-6 md:pt-4">
            <div className="hidden md:block absolute top-[18px] left-[12.5%] right-[12.5%] border-t-2 border-[#94A3B8] pointer-events-none z-0" />

            {HOW_STEPS.map(step => (
              <div key={step.num} className="group relative z-10 bg-white rounded-2xl p-6 pt-10 flex flex-col items-center text-center shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-[#1B6CA8] group-hover:bg-[#F5A623] text-white text-sm font-bold flex items-center justify-center shadow-md border-2 border-[#F4F7FA] transition-colors duration-200">
                  {step.num}
                </div>

                <div className={`w-16 h-16 rounded-2xl ${step.bg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-200`}>
                  {step.num === 1 && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="#1B6CA8" strokeWidth="2" className="w-7 h-7">
                      <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                    </svg>
                  )}
                  {step.num === 2 && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" className="w-7 h-7">
                      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01M12 14h.01M8 18h.01M12 18h.01"/>
                    </svg>
                  )}
                  {step.num === 3 && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" className="w-7 h-7">
                      <path d="M3 7h18M3 7a2 2 0 00-2 2v10a2 2 0 002 2h18a2 2 0 002-2V9a2 2 0 00-2-2M3 7V5a2 2 0 012-2h14a2 2 0 012 2v2"/><circle cx="12" cy="14" r="3"/>
                    </svg>
                  )}
                  {step.num === 4 && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="#0D9488" strokeWidth="2" className="w-7 h-7">
                      <rect x="1" y="3" width="15" height="13"/><polygon points="16,8 20,8 23,11 23,16 16,16 16,8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
                    </svg>
                  )}
                </div>

                <h3 className="font-heading font-bold text-[15px] text-gray-900 mb-2">{step.label}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────────── */}
      <section id="testimonials" className="bg-white py-12 md:py-16">
        <div className="max-w-[1280px] mx-auto px-4 md:px-8">

          <div className="text-center mb-8 md:mb-12">
            <h2 className="font-heading font-bold text-[1.6rem] text-gray-900">What our customers say</h2>
            <p className="text-sm text-gray-500 mt-2">Trusted by hundreds of households across the Philippines.</p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="bg-[#F4F7FA] rounded-2xl p-6 flex flex-col gap-4">
                <div className="flex items-center gap-1">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <svg key={i} viewBox="0 0 24 24" fill="#F5A623" className="w-4 h-4">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  ))}
                </div>
                <p className="text-sm text-gray-700 leading-relaxed flex-1">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3 pt-2 border-t border-[#e5e7eb]">
                  <div className={`w-9 h-9 rounded-full ${t.color} flex items-center justify-center shrink-0`}>
                    <span className={`text-xs font-bold ${t.textColor}`}>{t.initials}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                    <p className="text-[11px] text-gray-500">{t.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── Partner with us (teaser) ────────────────────────────────────── */}
      <section className="bg-[#F4F7FA] py-14 md:py-20">
        <div className="max-w-[1280px] mx-auto px-4 md:px-8 flex flex-col gap-8 md:flex-row md:items-center md:gap-16">

          {/* Left: text */}
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1B6CA8] mb-4">Join the network</p>
            <h2 className="font-heading font-extrabold text-[2.8rem] leading-tight tracking-tight text-gray-900 mb-4">
              Grow with{' '}<br /><span className="text-[#1B6CA8]">Labada</span><span className="text-[#F5A623]">Go</span>
            </h2>
            <p className="text-[15px] text-gray-500 leading-relaxed mb-8 max-w-sm">
              Whether you run a laundry shop or want flexible delivery work, there&apos;s a place for you in our network.
            </p>
            <button
              onClick={() => navigate('/partner')}
              className="inline-flex items-center gap-2 bg-[#1B6CA8] text-white font-bold px-8 py-3.5 rounded-xl hover:bg-[#155a8a] transition-colors text-sm"
            >
              Partner with us
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
          </div>

          {/* Right: collage of 4 overlapping images — hidden on mobile */}
          <div className="hidden md:block relative shrink-0 w-[500px] h-[270px]">
            {/* top-left, large, tilted left */}
            <div className="absolute w-[235px] h-[158px] rounded-2xl overflow-hidden border-4 border-white shadow-lg" style={{ left: 4, top: 4, transform: 'rotate(-5deg)', zIndex: 10 }}>
              <img src="/Image1.jpg" className="w-full h-full object-cover" alt="" />
            </div>
            {/* top-right, tilted right, overlaps image 1 */}
            <div className="absolute w-[205px] h-[148px] rounded-2xl overflow-hidden border-4 border-white shadow-lg" style={{ left: 198, top: 6, transform: 'rotate(4deg)', zIndex: 20 }}>
              <img src="/Image2.jpg" className="w-full h-full object-cover" alt="" />
            </div>
            {/* bottom-left, slight tilt, overlaps image 1 */}
            <div className="absolute w-[210px] h-[148px] rounded-2xl overflow-hidden border-4 border-white shadow-lg" style={{ left: 18, top: 106, transform: 'rotate(-2deg)', zIndex: 30 }}>
              <img src="/Image3.jpg" className="w-full h-full object-cover" alt="" />
            </div>
            {/* bottom-right, tilted right, overlaps images 2 & 3 */}
            <div className="absolute w-[220px] h-[152px] rounded-2xl overflow-hidden border-4 border-white shadow-xl" style={{ left: 228, top: 96, transform: 'rotate(5deg)', zIndex: 40 }}>
              <img src="/Image4.jpg" className="w-full h-full object-cover" alt="" />
            </div>
          </div>

        </div>
      </section>
      {/* ── FAQ ──────────────────────────────────────────────────────────────── */}
      <section className="bg-[#F4F7FA] py-10 md:py-14">
        <div className="max-w-[1280px] mx-auto px-4 md:px-8">
          <div className="text-center mb-6 md:mb-10">
            <h2 className="font-heading font-bold text-[1.6rem] text-gray-900">
              Frequently asked questions
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              Everything you need to know before your first pickup.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
            {[FAQ_ITEMS.slice(0, 3), FAQ_ITEMS.slice(3)].map((half, col) => (
              <div key={col} className="divide-y divide-[#e5e7eb] bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden">
                {half.map((item, row) => {
                  const i = col * 3 + row
                  return (
                    <div key={i}>
                      <button
                        onClick={() => setOpenFaq(openFaq === i ? null : i)}
                        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left hover:bg-[#F4F7FA] transition-colors"
                      >
                        <span className="font-heading font-semibold text-[15px] text-gray-900">
                          {item.q}
                        </span>
                        <span className={`shrink-0 text-[#1B6CA8] transition-transform duration-200 ${openFaq === i ? 'rotate-45' : ''}`}>
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                          </svg>
                        </span>
                      </button>
                      {openFaq === i && (
                        <div className="px-6 pb-5 text-sm text-gray-600 leading-relaxed border-t border-[#e5e7eb] pt-4">
                          {item.a}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────────────────────────── */}
      <section className="bg-[#0D3F6B] py-12 md:py-16 border-b-4 border-[#F5A623]">
        <div className="max-w-[1280px] mx-auto px-4 md:px-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between md:gap-8">
          <div>
            <h2 className="font-heading font-bold text-[1.6rem] md:text-[2rem] text-white leading-tight mb-2">
              Ready for fresh laundry<br />at your doorstep?
            </h2>
            <p className="text-white/60 text-sm">Book a pickup in under a minute. No contracts, no hassle.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto md:shrink-0">
            <button
              onClick={() => navigate(isLoggedIn ? '/browse' : '/signin')}
              className="bg-[#F5A623] text-[#0D3F6B] font-bold px-8 md:px-10 py-3.5 md:py-4 rounded-xl hover:bg-[#e89b15] transition-colors text-base whitespace-nowrap w-full sm:w-auto"
            >
              Book a pickup
            </button>
            <button
              onClick={() => navigate('/browse')}
              className="border-2 border-white/40 text-white font-semibold px-8 md:px-10 py-3.5 md:py-4 rounded-xl hover:bg-white/10 transition-colors text-base whitespace-nowrap w-full sm:w-auto"
            >
              Browse shops
            </button>
          </div>
        </div>
      </section>

    </>
  )
}
