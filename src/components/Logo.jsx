export default function Logo({ className, scrolled = false }) {
  return (
    <div className={`flex items-center gap-2.5 ${className ?? ''}`}>
      {/* Icon */}
      <svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-10 w-auto">
        {/* Outer dark circle */}
        <circle cx="28" cy="28" r="26" fill="#0A3A58"/>
        <circle cx="28" cy="28" r="26" fill="none" stroke="#1A6090" strokeWidth="2"/>

        {/* Water droplet — upper center */}
        <path
          d="M28 9 C27 11 21 18 21 22.5 C21 26.1 24.1 29 28 29 C31.9 29 35 26.1 35 22.5 C35 18 29 11 28 9Z"
          fill="#4BAED4"
        />

        {/* Basket rim (ellipse at top of basket) */}
        <ellipse cx="28" cy="30" rx="13" ry="2.5" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="1.4"/>

        {/* Basket body clipped to rounded shape */}
        <clipPath id="bc">
          <path d="M15 30 Q14 44 28 45 Q42 44 41 30 Z"/>
        </clipPath>
        <path d="M15 30 Q14 44 28 45 Q42 44 41 30 Z" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="1.4"/>
        <g clipPath="url(#bc)">
          <line x1="14" y1="33" x2="42" y2="33" stroke="rgba(255,255,255,0.7)" strokeWidth="1.3"/>
          <line x1="14" y1="36.5" x2="42" y2="36.5" stroke="rgba(255,255,255,0.7)" strokeWidth="1.3"/>
          <line x1="14.5" y1="40" x2="41.5" y2="40" stroke="rgba(255,255,255,0.7)" strokeWidth="1.3"/>
          <line x1="15.5" y1="43.5" x2="40.5" y2="43.5" stroke="rgba(255,255,255,0.7)" strokeWidth="1.3"/>
        </g>

      </svg>

      {/* Wordmark */}
      <span className="font-heading font-bold text-[1.65rem] leading-none tracking-tight transition-colors duration-300">
        <span className={scrolled ? 'text-[#0D3F6B]' : 'text-white'}>Labada</span>
        <span className="text-[#F5A623]">Go</span>
      </span>
    </div>
  )
}
