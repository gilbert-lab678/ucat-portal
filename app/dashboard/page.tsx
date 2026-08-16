'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export default function DashboardPage() {
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const loadUser = async () => {
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, status')
        .eq('id', user.id)
        .single()

      if (!profile || profile.status !== 'approved') {
        router.push('/login')
        return
      }

      setFullName(profile.full_name)
      setLoading(false)
    }

    loadUser()
  }, [router])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold">Welcome, {fullName}</h1>
          <button
            onClick={handleLogout}
            className="text-sm underline text-zinc-500"
          >
            Log out
          </button>
        </div>

        <div className="rounded border border-zinc-200 dark:border-zinc-700 p-6">
          <a href="/practice" className="text-blue-600 dark:text-blue-400 underline font-medium">
            Question Bank →
          </a>
        </div>
      </div>
    </div>
  )
}