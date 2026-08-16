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
      router.push('/login/success')
    }
  }

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
