'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { AdminSidebar } from '@/components/layout/admin-sidebar'
import { Navbar } from '@/components/layout/navbar'
import { UserCheck } from 'lucide-react'

export const dynamic = 'force-dynamic'

type Profile = {
  id: string
  full_name: string
  email: string
  status: string
  created_at: string
}

export default function AdminPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())
  const router = useRouter()
  const supabase = createClient()

  const loadProfiles = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { data: myProfile } = await supabase
      .from('profiles')
      .select('full_name, is_admin')
      .eq('id', user.id)
      .single()

    if (!myProfile?.is_admin) {
      router.push('/login')
      return
    }

    setFullName(myProfile.full_name)

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

  const setProcessing = (id: string, isProcessing: boolean) => {
    setProcessingIds((prev) => {
      const next = new Set(prev)
      if (isProcessing) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const updateStatus = async (id: string, status: string, email: string, name: string) => {
    if (processingIds.has(id)) return

    setProcessing(id, true)
    setMessage('')

    const { error } = await supabase.from('profiles').update({ status }).eq('id', id)

    if (error) {
      setMessage(`Update failed: ${error.message}`)
      setProcessing(id, false)
      return
    }

    if (status === 'approved') {
      try {
        const res = await fetch('/api/send-approval-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, fullName: name }),
        })

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          setMessage(`Approved, but the notification email failed: ${data.error || 'Unknown error'}`)
        }
      } catch (err: any) {
        setMessage(`Approved, but the notification email failed: ${err.message}`)
      }
    }

    await loadProfiles()
    setProcessing(id, false)
  }

  const handleRemove = async (id: string, name: string) => {
    const confirmed = window.confirm(
      `Remove ${name}? They will immediately lose access and won't be able to log in. This can't be undone from this page.`
    )
    if (!confirmed) return

    const { error } = await supabase.from('profiles').delete().eq('id', id)

    if (error) {
      setMessage(`Remove failed: ${error.message}`)
      return
    }

    loadProfiles()
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-[#030408]">
        <p className="text-zinc-500 dark:text-zinc-400 animate-pulse text-sm">Loading Workspace...</p>
      </div>
    )
  }

  const pending = profiles.filter((p) => p.status === 'pending')
  const others = profiles.filter((p) => p.status !== 'pending')

  return (
    <div className="min-h-screen flex bg-zinc-50 dark:bg-[#030408] text-zinc-900 dark:text-zinc-100 font-sans transition-colors duration-200">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar fullName={fullName} title="Student Approvals" />

        <main className="flex-1 p-8 max-w-3xl mx-auto w-full">
          {message && <p className="mb-4 text-sm text-rose-500">{message}</p>}

          <div className="bg-white dark:bg-[#0a0d14] border border-zinc-200 dark:border-zinc-800/80 rounded-xl shadow-sm mb-8 overflow-hidden">
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-800/50 bg-zinc-50 dark:bg-[#0d111a]/40">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-indigo-500" /> Pending ({pending.length})
              </h2>
            </div>

            <div className="p-5 flex flex-col gap-3">
              {pending.length === 0 && (
                <p className="text-sm text-zinc-400 dark:text-zinc-500">No pending signups.</p>
              )}
              {pending.map((p) => {
                const isProcessing = processingIds.has(p.id)
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-800 p-4"
                  >
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-white">{p.full_name}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">{p.email}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateStatus(p.id, 'approved', p.email, p.full_name)}
                        disabled={isProcessing}
                        className="rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
                      >
                        {isProcessing ? 'Working...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => updateStatus(p.id, 'rejected', p.email, p.full_name)}
                        disabled={isProcessing}
                        className="rounded-lg bg-rose-600 hover:bg-rose-500 text-white px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
                      >
                        {isProcessing ? 'Working...' : 'Reject'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="bg-white dark:bg-[#0a0d14] border border-zinc-200 dark:border-zinc-800/80 rounded-xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-800/50 bg-zinc-50 dark:bg-[#0d111a]/40">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">All other students</h2>
            </div>
            <div className="p-5 flex flex-col gap-2">
              {others.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-sm py-1.5">
                  <div>
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">{p.full_name}</span>
                    <span className="text-zinc-400 dark:text-zinc-500 ml-2 text-xs">{p.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded ${
                        p.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                      }`}
                    >
                      {p.status}
                    </span>
                    <button
                      onClick={() => handleRemove(p.id, p.full_name)}
                      className="text-xs text-zinc-400 hover:text-rose-500 underline transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
