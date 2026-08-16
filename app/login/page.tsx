'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  // States to track embedded success animation step
  const [isLoginSuccess, setIsLoginSuccess] = useState(false)
  const [firstName, setFirstName] = useState('Student')
  
  const router = useRouter()

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
      // Extract user's first name safely for the greeting card view
      const name =
        data.user?.user_metadata?.first_name ||
        data.user?.user_metadata?.firstName ||
        data.user?.user_metadata?.name?.split(' ')[0] ||
        'Student'
      
      setFirstName(name)
      setIsLoginSuccess(true)

      // Hold view context for 2.8 seconds before navigating away
      setTimeout(() => {
        router.push('/dashboard')
      }, 2800)
    }
  }

  // --- EMBEDDED SUCCESS VIEW LAYER (Tailwind Production Ready) ---
  if (isLoginSuccess) {
    return (
      <main className="min-h-screen bg-[#080b14] text-white flex items-center justify-center overflow-hidden relative font-sans select-none">
        
        {/* Background Glow Ring */}
        <div className="absolute w-[650px] h-[650px] rounded-full bg-blue-500/10 blur-[120px] animate-pulse duration-[4000ms]" />

        <div className="relative z-10 text-center animate-[fadeIn_0.7s_cubic-bezier(0.2,0.8,0.2,1)]">
          
          {/* Checked Icon Circle */}
          <div className="w-[90px] h-[90px] mx-auto mb-7 rounded-full relative bg-gradient-to-br from-[#5865f2] to-[#7c5cff] flex items-center justify-center shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_0_55px_rgba(88,101,242,0.45)] animate-[scaleUp_0.7s_cubic-bezier(0.17,0.89,0.32,1.49)]">
            
            {/* Pulsing Outer Circle Accent */}
            <div className="absolute -inset-3 rounded-full border border-[#7c5cff]/30 animate-ping opacity-25" />
            
            {/* Success Checkmark Element */}
            <svg 
              className="w-10 h-10 text-white" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              strokeWidth="3.5"
            >
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

          {/* Loading Progress Bar Tracking */}
          <div className="w-[210px] sm:w-[240px] h-[3px] mx-auto bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#5865f2] to-[#9b7cff] rounded-full" 
              style={{
                animation: 'progressFill 2.8s cubic-bezier(0.4, 0, 0.2, 1) forwards'
              }}
            />
          </div>
        </div>

        {/* Safe production injection for layout keyframe configs */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes progressFill {
            from { width: 0%; }
            to { width: 100%; }
          }
          @keyframes scaleUp {
            0% { transform: scale(0.3); opacity: 0; }
            70% { transform: scale(1.05); }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}} />
      </main>
    )
  }

  // --- STANDARD LOGIN FORM LAYOUT ---
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
