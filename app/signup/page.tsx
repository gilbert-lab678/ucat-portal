'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')

    if (password !== confirmPassword) {
      setMessage('Passwords do not match.')
      return
    }

    setLoading(true)
    const supabase = createClient()

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        full_name: fullName,
        email: email,
        status: 'pending',
      })

      if (profileError) {
        setMessage(`Profile creation failed: ${profileError.message}`)
        setLoading(false)
        return
      }
    }

    setMessage('Account created! Your tutor will review and approve your account soon. You will get an email once approved.')
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900">
      <div className="w-full max-w-sm rounded-lg border border-zinc-200 dark:border-zinc-700 p-8">
        <h1 className="text-2xl font-semibold mb-6">Sign up for UCAT Portal</h1>

        <form onSubmit={handleSignup} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="rounded border border-zinc-300 dark:border-zinc-600 px-3 py-2 bg-transparent"
          />
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
              minLength={6}
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

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
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
            {loading ? 'Creating account...' : 'Sign up'}
          </button>
        </form>

        {message && (
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">{message}</p>
        )}

        <div className="mt-4 text-sm">
          <a href="/login" className="underline">Already have an account? Log in</a>
        </div>
      </div>
    </div>
  )
}