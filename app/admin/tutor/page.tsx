'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

type ThreadPreview = {
  student_id: string
  full_name: string
  email: string
  last_message: string
  last_time: string
}

export default function AdminTutorInboxPage() {
  const router = useRouter()
  const supabase = createClient()
  const [threads, setThreads] = useState<ThreadPreview[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
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

      const { data: messages } = await supabase
        .from('tutor_messages')
        .select('student_id, message_text, created_at')
        .order('created_at', { ascending: false })

      const latestByStudent = new Map<string, { message_text: string; created_at: string }>()
      for (const m of messages || []) {
        if (!latestByStudent.has(m.student_id)) {
          latestByStudent.set(m.student_id, { message_text: m.message_text, created_at: m.created_at })
        }
      }

      const studentIds = Array.from(latestByStudent.keys())

      if (studentIds.length === 0) {
        setThreads([])
        setLoading(false)
        return
      }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', studentIds)

      const combined: ThreadPreview[] = (profiles || []).map((p) => {
        const last = latestByStudent.get(p.id)!
        return {
          student_id: p.id,
          full_name: p.full_name,
          email: p.email,
          last_message: last.message_text,
          last_time: last.created_at,
        }
      })

      combined.sort((a, b) => new Date(b.last_time).getTime() - new Date(a.last_time).getTime())

      setThreads(combined)
      setLoading(false)
    }

    load()
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6">Ask Tutor — Inbox</h1>

        <div className="flex flex-col gap-2">
          {threads.length === 0 && (
            <p className="text-sm text-zinc-500">No student messages yet.</p>
          )}

          {threads.map((t) => (
            <button
              key={t.student_id}
              onClick={() => router.push(`/admin/tutor/${t.student_id}`)}
              className="text-left rounded border border-zinc-200 dark:border-zinc-700 p-4 bg-white dark:bg-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-500"
            >
              <div className="flex items-center justify-between">
                <p className="font-medium">{t.full_name}</p>
                <p className="text-xs text-zinc-400">
                  {new Date(t.last_time).toLocaleDateString()}
                </p>
              </div>
              <p className="text-sm text-zinc-500">{t.email}</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 truncate">{t.last_message}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
