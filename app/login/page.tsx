'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  const [isLoginSuccess, setIsLoginSuccess] = useState(false)
  const [firstName, setFirstName] = useState('Student')
  const [progressWidth, setProgressWidth] = useState('0%')
  
  const router = useRouter()

  // 1. Force state persistence check on initial load to block premature global middleware redirects
  useEffect(() => {
    const isShowingSuccess = localStorage.getItem('auth_success_pending')
    const savedName = localStorage.getItem('auth_success_name')
    
    if (isShowingSuccess === 'true') {
      setIsLoginSuccess(true)
      if (savedName) setFirstName(savedName)
    }
  }, [])

  // 2. Handle the explicit timing loop safely decoupled from asynchronous router pre-rendering locks
  useEffect(() => {
    if (!isLoginSuccess) return

    const animationFrame = setTimeout(() => {
      setProgressWidth('100%')
    }, 50)

    const redirectTimer = setTimeout(() => {
      localStorage.removeItem('auth_success_pending')
      localStorage.removeItem('auth_success_name')
      
      // Append a cache-busting timestamp string parameter to bypass edge routing checks
      router.push(`/dashboard?v=${Date.now()}`)
    }, 2800)

    return () => {
      clearTimeout(animationFrame)
      clearTimeout(redirectTimer)
    }
  }, [isLoginSuccess, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const supabase = createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('status, is_admin')
      .eq('id', data.user.id)
      .single()

    if (profileError || !profile) {
      setMessage(`Profile lookup failed: ${profileError?.message || 'not found'}`)
      setLoading(false)
      return
    }

    if (profile.status === 'pending') {
      setMessage('Your account is still awaiting approval from your tutor.')
      await supabase.auth.signOut()
      setLoading(false)
      return
    }

    if (profile.status === 'rejected') {
      setMessage('Your account request was not approved. Contact your tutor for details.')
      await supabase.auth.signOut()
      setLoading(false)
      return
    }

    if (profile.is_admin) {
      router.push('/admin')
    } else {
      const name =
        data.user?.user_metadata?.first_name ||
        data.user?.user_metadata?.firstName ||
        data.user?.user_metadata?.name?.split(' ')[0] ||
        'Student'
      
      // Explicitly serialize state into persistent browser storage before the rendering thread updates
      localStorage.setItem('auth_success_pending', 'true')
      localStorage.setItem('auth_success_name', name)
      
      setFirstName(name)
      setIsLoginSuccess(true)
    }
  }

  // --- SCREEN 2: DYNAMIC SUCCESS ANIMATION RENDER LAYER ---
  if (isLoginSuccess) {
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

  // --- SCREEN 1: STANDARD LOGIN FORM LAYOUT ---
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900">
      <div className="w-full max-w-sm rounded-lg border border-zinc-200 dark:border-zinc-700 p-8">
        <h1 className="text-2xl font-semibold mb-6">Log in to UCAT Portal</h1>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="rounded border border-zinc-300 dark:border-zinc-600 px-3 py-2 bg-transparent"
          />
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded border border-zinc-300 dark:border-zinc-600 px-3 py-2 pr-16 bg-transparent"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-zinc-500 dark:text-zinc-400"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="rounded bg-black dark:bg-white text-white dark:text-black px-3 py-2 font-medium disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        {message && (
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">{message}</p>
        )}

        <div className="mt-4 flex justify-between text-sm">
          <a href="/signup" className="underline">Sign up</a>
          <a href="/forgot-password" className="underline">Forgot password?</a>
        </div>
      </div>
    </div>
  )
}
