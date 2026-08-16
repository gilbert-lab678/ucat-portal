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
  
  // New States to handle embedding the success view directly
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
      // Extract user's name for the success card animation
      const name =
        data.user?.user_metadata?.first_name ||
        data.user?.user_metadata?.firstName ||
        data.user?.user_metadata?.name?.split(' ')[0] ||
        'Student'
      
      setFirstName(name)
      // Switch the UI screen to the success layout immediately
      setIsLoginSuccess(true)

      // Hold execution here for 2.8 seconds before physically routing away
      setTimeout(() => {
        router.push('/dashboard')
      }, 2800)
    }
  }

  // --- EMBEDDED SUCCESS VIEW LAYER ---
  if (isLoginSuccess) {
    return (
      <main
        style={{
          minHeight: '100vh',
          background: '#080b14',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          position: 'relative',
          fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        <style jsx>{`
          .backgroundGlow {
            position: absolute;
            width: 650px;
            height: 650px;
            border-radius: 50%;
            background: rgba(88, 101, 242, 0.14);
            filter: blur(120px);
            animation: glowPulse 4s ease-in-out infinite;
          }
          .container {
            position: relative;
            z-index: 2;
            text-align: center;
            animation: entrance 0.7s cubic-bezier(0.2, 0.8, 0.2, 1);
          }
          .icon {
            width: 90px;
            height: 90px;
            margin: 0 auto 28px;
            border-radius: 50%;
            position: relative;
            background: linear-gradient(135deg, #5865f2, #7c5cff);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.08), 0 0 55px rgba(88, 101, 242, 0.45);
            animation: pop 0.7s cubic-bezier(0.17, 0.89, 0.32, 1.49);
          }
          .icon::before {
            content: '';
            position: absolute;
            inset: -12px;
            border-radius: 50%;
            border: 1px solid rgba(124, 92, 255, 0.3);
            animation: ring 2s ease-out infinite;
          }
          .check {
            width: 31px;
            height: 18px;
            border-left: 4px solid white;
            border-bottom: 4px solid white;
            transform: rotate(-45deg) scale(0);
            animation: check 0.4s ease-out 0.4s forwards;
          }
          h1 {
            font-size: 42px;
            line-height: 1.1;
            font-weight: 700;
            letter-spacing: -1.5px;
            margin: 0 0 12px;
          }
          .welcome {
            color: #9da4b8;
            font-size: 18px;
            margin: 0 0 34px;
          }
          .welcome span {
            color: white;
            font-weight: 600;
          }
          .loading {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            color: #858ca0;
            font-size: 14px;
            margin-bottom: 16px;
          }
          .dots {
            display: flex;
            gap: 4px;
          }
          .dots span {
            width: 4px;
            height: 4px;
            border-radius: 50%;
            background: #8b7cff;
            animation: dots 1.2s infinite ease-in-out;
          }
          .dots span:nth-child(2) { animation-delay: 0.15s; }
          .dots span:nth-child(3) { animation-delay: 0.3s; }
          .progress {
            width: 240px;
            height: 3px;
            margin: 0 auto;
            background: rgba(255, 255, 255, 0.08);
            border-radius: 999px;
            overflow: hidden;
          }
          .progressBar {
            height: 100%;
            width: 0;
            border-radius: inherit;
            background: linear-gradient(90deg, #5865f2, #9b7cff);
            animation: progress 2.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          }
          @keyframes entrance { from { opacity: 0; transform: translateY(20px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
          @keyframes pop { 0% { opacity: 0; transform: scale(0.3); } 70% { transform: scale(1.08); } 100% { opacity: 1; transform: scale(1); } }
          @keyframes check { to { transform: rotate(-45deg) scale(1); } }
          @keyframes ring { 0% { transform: scale(0.9); opacity: 0.8; } 100% { transform: scale(1.35); opacity: 0; } }
          @keyframes glowPulse { 0%, 100% { opacity: 0.6; transform: scale(1); } 50% { opacity: 1; transform: scale(1.1); } }
          @keyframes dots { 0%, 60%, 100% { opacity: 0.3; transform: translateY(0); } 30% { opacity: 1; transform: translateY(-3px); } }
          @keyframes progress { from { width: 0; } to { width: 100%; } }
          @media (max-width: 600px) { h1 { font-size: 32px; } .welcome { font-size: 16px; } .progress { width: 210px; } }
        `}</style>

        <div className="backgroundGlow" />

        <div className="container">
          <div className="icon">
            <div className="check" />
          </div>

          <h1>Sign in successful</h1>

          <p className="welcome">
            Welcome back, <span>{firstName}</span>.
          </p>

          <div className="loading">
            <span>Preparing your dashboard</span>
            <div className="dots">
              <span />
              <span />
              <span />
            </div>
          </div>

          <div className="progress">
            <div className="progressBar" />
          </div>
        </div>
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
