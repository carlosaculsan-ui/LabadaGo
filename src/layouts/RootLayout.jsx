import { Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Navbar from '../components/Navbar'

const FOOTER_LINKS = {
  Company:  ['About us', 'Careers', 'Press'],
  Services: ['Wash & fold', 'Dry cleaning', 'Comforters', 'Towels & linens'],
  Support:  ['Help center', 'Contact', 'FAQs'],
}

export default function RootLayout() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <>
      <Navbar />
      <main className="pt-[88px]">
        <Outlet />
      </main>

      <footer className="bg-[#0D3F6B]">
        <div className="max-w-[1280px] mx-auto px-6 md:px-8 py-10 md:py-12 grid grid-cols-1 gap-8 md:grid-cols-[1fr_auto] md:gap-16 items-start">
          <div className="max-w-[300px]">
            <div className="mb-4">
              <img src="/LabadaGoLogo.png" alt="LabadaGo" className="h-8 w-auto" />
            </div>
            <p className="text-[#8DB8D8] text-sm leading-relaxed">
              Pickup, wash, and delivery — connecting you with verified local laundry shops across the Philippines.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-6 md:flex md:gap-12 md:shrink-0">
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
          <div className="max-w-[1280px] mx-auto px-6 md:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-white/40">© 2026 LabadaGo. All rights reserved.</p>
            <p className="text-xs text-white/25">Made with care in the Philippines.</p>
          </div>
        </div>
      </footer>
    </>
  )
}
