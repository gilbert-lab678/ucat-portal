'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { AdminSidebar } from '@/components/layout/admin-sidebar'
import { Navbar } from '@/components/layout/navbar'
import { Bell, Trash2, Send } from 'lucide-react'

export const dynamic = 'force-dynamic'

type Student = {
  id: string
  full_name: string
  email: string
}

type NotificationRow = {
  id: string
  message: string
  is_general: boolean
  created_at: string
  notification_recipients: { student_id: string }[]
}

export default function AdminNotificationsPage() {
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState<Student[]>([])
  const [notifications, setNotifications] = useState<NotificationRow[]>([])

  const [message, setMessage] = useState('')
  const [mode, setMode] = useState<'general' | 'individual'>('general')
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const router = useRouter()
  const supabase = createClient()

  const loadData = async () => {
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

    const { data: studentsData } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('status', 'approved')
      .order('full_name', { ascending: true })

    setStudents(studentsData || [])

    const { data: notifData } = await supabase
      .from('notifications')
      .select('id, message, is_general, created_at, notification_recipients(student_id)')
      .order('created_at', { ascending: false })

    setNotifications((notifData as any) || [])
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const toggleStudent = (id: string) => {
    setSelectedStudents((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!message.trim()) {
      setError('Message is required.')
      return
    }

    if (mode === 'individual' && selectedStudents.size === 0) {
      setError('Select at least one student.')
      return
    }

    setSending(true)

    const { data: notif, error: notifError } = await supabase
      .from('notifications')
      .insert({ message: message.trim(), is_general: mode === 'general' })
      .select()
      .single()

    if (notifError) {
      setError(`Failed to post: ${notifError.message}`)
      setSending(false)
      return
    }

    if (mode === 'individual') {
      const rows = Array.from(selectedStudents).map((student_id) => ({
        notification_id: notif.id,
        student_id,
      }))
      const { error: recipientsError } = await supabase.from('notification_recipients').insert(rows)
      if (recipientsError) {
        setError(`Notification posted, but recipients failed: ${recipientsError.message}`)
        setSending(false)
        return
      }
    }

    setMessage('')
    setSelectedStudents(new Set())
    setMode('general')
    setSending(false)
    loadData()
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this notification for everyone?')) return
    await supabase.from('notifications').delete().eq('id', id)
    loadData()
  }

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
        <Navbar fullName={fullName} title="Notifications" />

        <main className="flex-1 p-8 max-w-3xl mx-auto w-full">
          <div className="mb-6">
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-white mb-1">Post a Notification</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Send an announcement to every student, or pick specific ones.
            </p>
          </div>

          <form onSubmit={handleSend} className="bg-white dark:bg-[#0a0d14] border border-zinc-200 dark:border-zinc-800/80 rounded-xl p-5 shadow-sm mb-8 flex flex-col gap-4">
            <textarea
              placeholder="Write your announcement..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0d111a] px-3 py-2 text-sm text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />

            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input type="radio" checked={mode === 'general'} onChange={() => setMode('general')} />
                Everyone
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" checked={mode === 'individual'} onChange={() => setMode('individual')} />
                Specific students
              </label>
            </div>

            {mode === 'individual' && (
              <div className="max-h-48 overflow-y-auto flex flex-col gap-1 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2">
                {students.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 text-sm px-2 py-1.5 rounded hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                    <input
                      type="checkbox"
                      checked={selectedStudents.has(s.id)}
                      onChange={() => toggleStudent(s.id)}
                    />
                    {s.full_name} <span className="text-xs text-zinc-400">({s.email})</span>
                  </label>
                ))}
              </div>
            )}

            {error && <p className="text-xs text-rose-500">{error}</p>}

            <button
              type="submit"
              disabled={sending}
              className="self-start rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 text-sm font-medium disabled:opacity-50 transition-colors flex items-center gap-1.5"
            >
              <Send className="h-3.5 w-3.5" /> {sending ? 'Sending...' : 'Post notification'}
            </button>
          </form>

          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3 flex items-center gap-2">
            <Bell className="h-4 w-4 text-indigo-500" /> Sent notifications
          </h2>

          <div className="flex flex-col gap-2">
            {notifications.length === 0 && (
              <p className="text-sm text-zinc-400 dark:text-zinc-500">Nothing posted yet.</p>
            )}
            {notifications.map((n) => (
              <div key={n.id} className="bg-white dark:bg-[#0a0d14] border border-zinc-200 dark:border-zinc-800/80 rounded-xl p-4 shadow-sm flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-zinc-800 dark:text-zinc-200">{n.message}</p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                    {n.is_general ? 'Everyone' : `${n.notification_recipients.length} student(s)`} · {new Date(n.created_at).toLocaleDateString('en-AU')}
                  </p>
                </div>
                <button onClick={() => handleDelete(n.id)} className="text-zinc-400 hover:text-rose-500 shrink-0">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
