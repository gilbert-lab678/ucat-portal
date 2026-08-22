'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

type Message = {
  id: string
  student_id: string
  sender_id: string
  sender_role: 'student' | 'admin'
  message_text: string
  attachment_url: string | null
  attachment_name: string | null
  created_at: string
}

function Attachment({ path, name }: { path: string; name: string }) {
  const [url, setUrl] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.storage
        .from('tutor-attachments')
        .createSignedUrl(path, 3600)
      if (data) setUrl(data.signedUrl)
    }
    load()
  }, [path])

  if (!url) return <p className="text-xs text-zinc-400 mt-1">Loading attachment...</p>

  const isImage = /\.(png|jpe?g|gif|webp)$/i.test(name)

  return isImage ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={name} className="mt-2 max-w-[240px] rounded border border-zinc-200 dark:border-zinc-700" />
  ) : (
    <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs underline block mt-2">
      📎 {name}
    </a>
  )
}

export default function AdminTutorThreadPage() {
  const params = useParams()
  const studentId = params.studentId as string
  const router = useRouter()
  const supabase = createClient()

  const [adminId, setAdminId] = useState('')
  const [studentName, setStudentName] = useState('')
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const init = async () => {
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

      setAdminId(user.id)

      const { data: studentProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', studentId)
        .single()

      setStudentName(studentProfile?.full_name || 'Student')

      const { data: existing } = await supabase
        .from('tutor_messages')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: true })

      setMessages(existing || [])
      setLoading(false)

      const channel = supabase
        .channel(`tutor-admin-${studentId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'tutor_messages',
            filter: `student_id=eq.${studentId}`,
          },
          (payload) => {
            setMessages((prev) => [...prev, payload.new as Message])
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }

    init()
  }, [studentId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!text.trim() && !file) return
    setSending(true)

    let attachmentUrl: string | null = null
    let attachmentName: string | null = null

    if (file) {
      const filePath = `${studentId}/${Date.now()}-${file.name}`
      const { error: uploadError } = await supabase.storage
        .from('tutor-attachments')
        .upload(filePath, file)

      if (uploadError) {
        setSending(false)
        return
      }

      attachmentUrl = filePath
      attachmentName = file.name
    }

    await supabase.from('tutor_messages').insert({
      student_id: studentId,
      sender_id: adminId,
      sender_role: 'admin',
      message_text: text.trim() || (file ? `Sent a file` : ''),
      attachment_url: attachmentUrl,
      attachment_name: attachmentName,
    })

    setText('')
    setFile(null)
    setSending(false)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-8 flex flex-col">
      <div className="max-w-2xl mx-auto w-full flex flex-col flex-1">
        <a href="/admin/tutor" className="text-sm underline mb-2">← Inbox</a>
        <h1 className="text-2xl font-semibold mb-4">{studentName}</h1>

        <div className="flex-1 flex flex-col gap-3 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-4 mb-4 overflow-y-auto max-h-[60vh] min-h-[300px]">
          {messages.length === 0 && (
            <p className="text-sm text-zinc-500 text-center my-auto">No messages yet.</p>
          )}

          {messages.map((m) => {
            const isMine = m.sender_role === 'admin'
            return (
              <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                    isMine
                      ? 'bg-black text-white dark:bg-white dark:text-black'
                      : 'bg-zinc-100 dark:bg-zinc-700'
                  }`}
                >
                  {m.message_text && <p className="whitespace-pre-wrap">{m.message_text}</p>}
                  {m.attachment_url && m.attachment_name && (
                    <Attachment path={m.attachment_url} name={m.attachment_name} />
                  )}
                  <p className={`text-[10px] mt-1 ${isMine ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-400'}`}>
                    {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        <div className="flex flex-col gap-2">
          {file && (
            <p className="text-xs text-zinc-500">
              📎 {file.name}{' '}
              <button onClick={() => setFile(null)} className="text-red-600 underline ml-1">
                Remove
              </button>
            </p>
          )}
          <div className="flex gap-2">
            <label className="flex items-center justify-center w-10 h-10 rounded border border-zinc-300 dark:border-zinc-600 cursor-pointer text-lg shrink-0">
              📎
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
              />
            </label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !sending) handleSend()
              }}
              placeholder="Type a message..."
              className="flex-1 rounded border border-zinc-300 dark:border-zinc-600 px-3 py-2 bg-transparent"
            />
            <button
              onClick={handleSend}
              disabled={sending}
              className="rounded bg-black dark:bg-white text-white dark:text-black px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
