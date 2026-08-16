'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

type Profile = {
  id: string
  full_name: string
  email: string
  status: string
  created_at: string
}

export default function AdminPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const router = useRouter()

  const supabase = createClient()

  const loadProfiles = async () => {
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    const { data: myProfile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!myProfile?.is_admin) {
      router.push('/login')
      return
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, status, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      setMessage(`Failed to load: ${error.message}`)
    } else {
      setProfiles(data || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    loadProfiles()
  }, [])

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ status })
      .eq('id', id)

    if (error) {
      setMessage(`Update failed: ${error.message}`)
      return
    }

    loadProfiles()
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  const pending = profiles.filter((p) => p.status === 'pending')
  const others = profiles.filter((p) => p.status !== 'pending')

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6">Student Approvals</h1>

        {message && (
          <p className="mb-4 text-sm text-red-600">{message}</p>
        )}

        <h2 className="text-lg font-medium mb-3">Pending ({pending.length})</h2>
        <div className="flex flex-col gap-3 mb-8">
          {pending.length === 0 && (
            <p className="text-sm text-zinc-500">No pending signups.</p>
          )}
          {pending.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded border border-zinc-200 dark:border-zinc-700 p-4"
            >
              <div>
                <p className="font-medium">{p.full_name}</p>
                <p className="text-sm text-zinc-500">{p.email}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => updateStatus(p.id, 'approved')}
                  className="rounded bg-green-600 text-white px-3 py-1.5 text-sm font-medium"
                >
                  Approve
                </button>
                <button
                  onClick={() => updateStatus(p.id, 'rejected')}
                  className="rounded bg-red-600 text-white px-3 py-1.5 text-sm font-medium"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>

        <h2 className="text-lg font-medium mb-3">All other students</h2>
        <div className="flex flex-col gap-3">
          {others.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded border border-zinc-200 dark:border-zinc-700 p-4"
            >
              <div>
                <p className="font-medium">{p.full_name}</p>
                <p className="text-sm text-zinc-500">{p.email}</p>
              </div>
              <span
                className={`text-sm font-medium px-2 py-1 rounded ${
                  p.status === 'approved'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                    : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                }`}
              >
                {p.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}