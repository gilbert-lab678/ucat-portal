'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

// We separate the layout into a Content component wrapped in a Suspense boundary.
// Next.js requires a Suspense boundary whenever you use 'useSearchParams' on a client page.
function SuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [firstName, setFirstName] = useState('User')
  const [progressWidth, setProgressWidth] = useState('0%')

  useEffect(() => {
    // Safely pull the name and destination variables out using Next.js hooks
    const urlName = searchParams.get('name')
    const urlRole = searchParams.get('role')

    if (urlName) {
      setFirstName(urlName)
    }

    // Smoothly fill the loading animation bar layout right away
    const animationTimer = setTimeout(() => {
      setProgressWidth('100%')
    }, 50)

    // Wait exactly 2.8s for the animation before routing to the dashboard destination
    const redirectTimer = setTimeout(() => {
      if (urlRole === 'admin') {
        router.push('/admin')
      } else {
        router.push('/dashboard')
      }
    }, 2800)

    return () => {
      clearTimeout(animationTimer)
      clearTimeout(redirectTimer)
    }
  }, [router, searchParams])

  return (
    <main className="min-h-screen w-full bg-[#080b14] text-white flex items-center justify-center overflow-hidden relative font-sans select-none">
      <div className="absolute w-[650px] h-[650px] rounded-full bg-blue-500/10 blur-[120px] animate-pulse duration-[4000ms]" />

      <div className="relative z-10 text-center">
        <div className="w-[90px] h-[90px] mx-auto mb-7 rounded-full relative bg-gradient-to-br from-[#5865f2] to-[#7c5cff] flex items-center justify-center shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_0_55px_rgba(88,101,242,0.45)]">
          <div className="absolute -inset-3 rounded-full border border-[#7c5cff]/30 animate-ping opacity-25" />
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-3 leading-tight">
          Sign in successful
        </h1>

        <p className="text-[#9da4b8] text-base sm:text-lg mb-9">
          Welcome back, <span className="text-white font-semibold">{firstName}</span>.
        </p>

        <div className="flex items-center justify-center gap-2 text-[#858ca0] text-sm mb-4">
          <span>Preparing your dashboard</span>
          <div className="flex gap-1 items-center pt-1">
            <span className="w-1 h-1 rounded-full bg-[#8b7cff] animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1 h-1 rounded-full bg-[#8b7cff] animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1 h-1 rounded-full bg-[#8b7cff] animate-bounce" />
          </div>
        </div>

        <div className="w-[210px] sm:w-[240px] h-[3px] mx-auto bg-white/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[#5865f2] to-[#9b7cff] rounded-full transition-all ease-out" 
            style={{ 
              width: progressWidth,
              transitionDuration: '2800ms'
            }}
          />
        </div>
      </div>
    </main>
  )
}

// Main page export wrapped in Suspense to satisfy Next.js compilation requirements
export default function LoginSuccess() {
  return (
    <Suspense fallback={
      <div className="min-h-screen w-full bg-[#080b14] text-white flex items-center justify-center">
        <p className="text-sm text-[#858ca0]">Loading routing context...</p>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
