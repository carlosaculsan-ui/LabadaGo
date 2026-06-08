import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const MERCHANT_PERKS = [
  'Free to list — no setup fees ever',
  'Receive and manage orders in real time',
  'Get paid directly via GCash',
  'Full dashboard to track earnings and reviews',
]

const RIDER_PERKS = [
  'Flexible hours — work whenever you want',
  'Earn per delivery with weekly payouts',
  'Real-time order assignments on your dashboard',
  'No vehicle requirements beyond a bike or motorcycle',
]

function PerkList({ perks }) {
  return (
    <ul className="space-y-3">
      {perks.map(p => (
        <li key={p} className="flex items-start gap-3 text-sm text-gray-700">
          <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-[#E8F4FD]">
            <svg className="w-3 h-3 text-[#1B6CA8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          {p}
        </li>
      ))}
    </ul>
  )
}

export default function Partner() {
  const navigate       = useNavigate()
  const { user, role } = useAuth()

  useEffect(() => {
    if (role === 'admin') navigate('/admin', { replace: true })
  }, [role, navigate])

  function handleApply(type) {
    if (!user) { navigate('/signin?redirect=/partner'); return }
    navigate(`/apply/${type}`)
  }

  return (
    <>
      {/* Hero */}
      <section
        className="relative overflow-hidden py-24"
        style={{ background: 'linear-gradient(135deg, #0A3358, #1B6CA8, #2980C4, #0A3358)', backgroundSize: '300% 300%', animation: 'gradient-shift 15s ease infinite' }}
      >
        {/* Bubbles */}
        <div className="absolute inset-0 pointer-events-none">
          {[
            { w: 280, top: '5%',  left: '2%'  },
            { w: 120, top: '55%', left: '5%'  },
            { w: 320, top: '0%',  left: '75%' },
            { w: 90,  top: '65%', left: '88%' },
            { w: 160, top: '35%', left: '45%' },
          ].map((b, i) => (
            <div
              key={i}
              className="absolute rounded-full border border-white pointer-events-none"
              style={{
                width: b.w, height: b.w, top: b.top, left: b.left,
                opacity: 0.07 + (i % 3) * 0.04,
                animation: `${i % 2 === 0 ? 'bubble-float' : 'bubble-drift'} ${5 + i * 1.2}s ease-in-out ${-(i * 1.0).toFixed(1)}s infinite`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 max-w-[1280px] mx-auto px-6 md:px-8 flex flex-col md:flex-row items-center gap-10 md:gap-16">

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#F5A623] mb-4">Join the network</p>
            <h1 className="font-heading font-bold text-[3.2rem] leading-[1.05] tracking-tight text-white mb-5">
              Grow with{' '}<br /><span className="text-white">Labada</span><span className="text-[#F5A623]">Go</span>
            </h1>
            <p className="text-white/65 text-[1.05rem] leading-relaxed max-w-md">
              Whether you run a laundry shop or want flexible delivery work, there&apos;s a place for you here. Join our growing network of merchants and riders across the Philippines.
            </p>
          </div>

          {/* Collage of 4 overlapping images */}
          <div className="relative shrink-0 hidden md:block w-[540px] h-[290px]">
            {/* top-left, large, tilted left */}
            <div className="absolute w-[255px] h-[172px] rounded-2xl overflow-hidden border-4 border-white/20 shadow-2xl" style={{ left: 4, top: 4, transform: 'rotate(-5deg)', zIndex: 10 }}>
              <img src="/Image1.jpg" className="w-full h-full object-cover" alt="" />
            </div>
            {/* top-right, tilted right, overlaps image 1 */}
            <div className="absolute w-[220px] h-[160px] rounded-2xl overflow-hidden border-4 border-white/20 shadow-2xl" style={{ left: 212, top: 8, transform: 'rotate(4deg)', zIndex: 20 }}>
              <img src="/Image2.jpg" className="w-full h-full object-cover" alt="" />
            </div>
            {/* bottom-left, slight tilt, overlaps image 1 */}
            <div className="absolute w-[225px] h-[158px] rounded-2xl overflow-hidden border-4 border-white/20 shadow-2xl" style={{ left: 20, top: 114, transform: 'rotate(-2deg)', zIndex: 30 }}>
              <img src="/Image3.jpg" className="w-full h-full object-cover" alt="" />
            </div>
            {/* bottom-right, tilted right, overlaps images 2 & 3 */}
            <div className="absolute w-[235px] h-[162px] rounded-2xl overflow-hidden border-4 border-white/20 shadow-2xl" style={{ left: 244, top: 104, transform: 'rotate(5deg)', zIndex: 40 }}>
              <img src="/Image4.jpg" className="w-full h-full object-cover" alt="" />
            </div>
          </div>
        </div>
      </section>

      {/* Role cards */}
      <section className="bg-[#F4F7FA] py-20">
        <div className="max-w-[1280px] mx-auto px-6 md:px-8">

          <div className="text-center mb-14">
            <h2 className="font-heading font-bold text-[1.75rem] text-gray-900 mb-3">Choose your role</h2>
            <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
              Pick the path that fits you. You can always apply through your profile after signing up.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Merchant */}
            <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden shadow-sm flex flex-col">
              <div className="relative h-56 bg-[#DBEAFE] overflow-hidden shrink-0">
                <video src="/MerchantVideo.mp4" autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover" />
              </div>

              <div className="p-8 flex flex-col flex-1">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-[#E8F4FD] flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-[#1B6CA8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                      <polyline points="9,22 9,12 15,12 15,22" />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#1B6CA8]">For shop owners</span>
                </div>
                <h3 className="font-heading font-bold text-xl text-gray-900 mb-2">List your shop, grow your orders</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-6">
                  Join verified laundry shops on LabadaGo. Reach more customers in your area and manage everything from one dashboard — for free.
                </p>
                <PerkList perks={MERCHANT_PERKS} color="blue" />
                <div className="mt-8">
                  {role === 'merchant' ? (
                    <button onClick={() => navigate('/merchant')} className="w-full bg-[#1B6CA8] text-white font-bold py-3.5 rounded-xl text-sm hover:bg-[#155a8a] transition-colors">
                      Go to my dashboard →
                    </button>
                  ) : (
                    <button onClick={() => handleApply('merchant')} className="w-full bg-[#1B6CA8] text-white font-bold py-3.5 rounded-xl text-sm hover:bg-[#155a8a] transition-colors">
                      Apply as Merchant →
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Rider */}
            <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden shadow-sm flex flex-col">
              <div className="relative h-56 bg-[#D1FAE5] overflow-hidden shrink-0">
                <video src="/RiderVideo.mp4" autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover" />
              </div>

              <div className="p-8 flex flex-col flex-1">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-[#E8F4FD] flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-[#1B6CA8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#1B6CA8]">For delivery riders</span>
                </div>
                <h3 className="font-heading font-bold text-xl text-gray-900 mb-2">Earn on your own schedule</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-6">
                  Turn your motorcycle or bike into income. Pick up and deliver laundry orders in your area — work when you want, earn what you deserve.
                </p>
                <PerkList perks={RIDER_PERKS} />
                <div className="mt-8">
                  {role === 'rider' ? (
                    <button onClick={() => navigate('/rider')} className="w-full bg-[#1B6CA8] text-white font-bold py-3.5 rounded-xl text-sm hover:bg-[#155a8a] transition-colors">
                      Go to my dashboard →
                    </button>
                  ) : (
                    <button onClick={() => handleApply('rider')} className="w-full bg-[#1B6CA8] text-white font-bold py-3.5 rounded-xl text-sm hover:bg-[#155a8a] transition-colors">
                      Apply as Rider →
                    </button>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

    </>
  )
}
