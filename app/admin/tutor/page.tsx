'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { AdminSidebar } from '@/components/layout/admin-sidebar'
import { Navbar } from '@/components/layout/navbar'
import { MessageSquare } from 'lucide-react'

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
  const [fullName, setFullName] = useState('')
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
        .select('full_name, is_admin')
        .eq('id', user.id)
        .single()

      if (!myProfile?.is_admin) {
        router.push('/login')
        return
      }

      setFullName(myProfile.full_name)

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
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-[#030408]">
        <p className="text-zinc-500 dark:text-zinc-400 animate-pulse text-sm">Loading Workspace...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-zinc-50 dark:bg-[#030408] text-zinc-900 dark:text-zinc-100 font-sans transition-colors duration-200">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar fullName={fullName} title="Tutor Inbox" />

        <main className="flex-1 p-8 max-w-3xl mx-auto w-full">
          <div className="mb-6">
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-white mb-1">Tutor Inbox</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              One conversation thread per student.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {threads.length === 0 && (
              <div className="bg-white dark:bg-[#0a0d14] border border-zinc-200 dark:border-zinc-800/80 rounded-xl p-10 text-center shadow-sm">
                <p className="text-sm text-zinc-400 dark:text-zinc-500">No student messages yet.</p>
              </div>
            )}

            {threads.map((t) => (
              <button
                key={t.student_id}
                onClick={() => router.push(`/admin/tutor/${t.student_id}`)}
                className="text-left bg-white dark:bg-[#0a0d14] border border-zinc-200 dark:border-zinc-800/80 rounded-xl p-4 shadow-sm hover:border-indigo-400 dark:hover:border-indigo-500/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                    {t.full_name?.charAt(0).toUpperCase() || 'S'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{t.full_name}</p>
                      <p className="text-[11px] text-zinc-400 dark:text-zinc-600 shrink-0">
                        {new Date(t.last_time).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">{t.email}</p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 truncate flex items-center gap-1.5">
                      <MessageSquare className="h-3 w-3 shrink-0" />
                      {t.last_message}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
