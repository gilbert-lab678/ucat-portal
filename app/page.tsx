'use client'

import Link from 'next/link'
import ConstellationGrid from "@/components/ui/constellation-grid"

export default function LandingPage() {
  const glassButtonClass = "w-full group relative px-8 py-3.5 rounded-full font-semibold tracking-wide text-sm bg-white/[0.01] border border-white/[0.08] hover:border-sky-400/40 backdrop-blur-2xl transition-all duration-500 overflow-hidden text-center shadow-[inset_0_1px_2px_rgba(255,255,255,0.06),_0_12px_40px_rgba(0,0,0,0.8)]"
  const glossOverlayTrack = "absolute inset-0 bg-gradient-to-r from-sky-500/20 via-blue-500/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-[1200ms] ease-out pointer-events-none"
  const glassTextProps = "relative z-10 text-zinc-300 group-hover:text-white transition-all duration-300"

  return (
    <div className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-[#030407] text-white select-none font-sans px-4">
      
      <div className="absolute inset-0 z-0 w-full h-full">
        <ConstellationGrid />
      </div>

      <div className="absolute inset-0 z-10 bg-gradient-to-b from-[#030407]/20 via-transparent to-[#030407]/70 pointer-events-none" />

      <div className="relative z-20 text-center px-4 max-w-4xl">
        <h1 className="text-6xl sm:text-8xl font-black tracking-tighter mb-6 cursor-default">
          <span className="bg-gradient-to-b from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]">
            UCAT Portal
          </span>
        </h1>

        <p className="text-zinc-400 text-sm sm:text-base font-medium tracking-normal mb-12 max-w-xs mx-auto leading-relaxed drop-shadow-[0_2px_8px_rgba(3,4,7,0.95)]">
          Master your examinations with the ultimate premium adaptive practice workflow interface.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 w-full max-w-xs sm:max-w-md mx-auto">
          <Link href="/login" className={glassButtonClass}>
            <div className={glossOverlayTrack} />
            <span className={glassTextProps}>Log In</span>
          </Link>

          <Link href="/login?mode=signup" className={glassButtonClass}>
            <div className={glossOverlayTrack} />
            <span className={glassTextProps}>Sign Up</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
