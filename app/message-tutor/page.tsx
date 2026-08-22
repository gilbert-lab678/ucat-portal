'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Paperclip, Send, X, FileText, GraduationCap, Pencil, Trash2, Check,
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { Sidebar } from '@/components/layout/sidebar'
import { Navbar } from '@/components/layout/navbar'

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
  edited_at: string | null
}

function Lightbox({ url, onClose }: { url: string; onClose: () => void }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  const handleClose = () => {
    setVisible(false)
    setTimeout(onClose, 200)
  }

  return (
    <div
      onClick={handleClose}
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm transition-opacity duration-200 cursor-zoom-out ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt="Attachment preview"
        onClick={(e) => e.stopPropagation()}
        className={`max-w-[90vw] max-h-[85vh] rounded-lg shadow-2xl transition-all duration-200 ease-out cursor-zoom-in ${
          visible ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
        }`}
      />
    </div>
  )
}

function Attachment({ path, name }: { path: string; name: string }) {
  const [url, setUrl] = useState<string | null>(null)
  const [zoomed, setZoomed] = useState(false)
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

  if (!url) return <p className="text-xs opacity-60 mt-1">Loading attachment...</p>

  const isImage = /\.(png|jpe?g|gif|webp)$/i.test(name)

  if (isImage) {
    return (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={name}
          onClick={() => setZoomed(true)}
          className="mt-1.5 max-w-[220px] rounded-xl border border-zinc-200 dark:border-zinc-800 cursor-zoom-in hover:brightness-95 dark:hover:brightness-110 transition-all"
        />
        {zoomed && <Lightbox url={url} onClose={() => setZoomed(false)} />}
      </>
    )
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1.5 text-xs underline mt-1.5 opacity-90 hover:opacity-100"
    >
      <FileText className="h-3.5 w-3.5" />
      {name}
    </a>
  )
}

export default function MessageTutorPage() {
  const router = useRouter()
  const supabase = createClient()

  const [fullName, setFullName] = useState('')
  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const dragCounter = useRef(0)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    let channel: ReturnType<typeof supabase.channel> | null = null

    const init = async () => {
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

      if (cancelled) return
      setUserId(user.id)
      setFullName(profile.full_name)

      const { data: existing } = await supabase
        .from('tutor_messages')
        .select('*')
        .eq('student_id', user.id)
        .order('created_at', { ascending: true })

      if (cancelled) return
      setMessages(existing || [])
      setLoading(false)

      if (cancelled) return

      channel = supabase
        .channel(`tutor-${user.id}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'tutor_messages', filter: `student_id=eq.${user.id}` },
          (payload) => {
            setMessages((prev) => [...prev, payload.new as Message])
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'tutor_messages', filter: `student_id=eq.${user.id}` },
          (payload) => {
            const updated = payload.new as Message
            setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)))
          }
        )
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'tutor_messages', filter: `student_id=eq.${user.id}` },
          (payload) => {
            const deletedId = (payload.old as Partial<Message>).id
            setMessages((prev) => prev.filter((m) => m.id !== deletedId))
          }
        )
        .subscribe()
    }

    init()

    return () => {
      cancelled = true
      if (channel) supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!file) {
      setFilePreviewUrl(null)
      return
    }
    if (file.type.startsWith('image/')) {
      const objectUrl = URL.createObjectURL(file)
      setFilePreviewUrl(objectUrl)
      return () => URL.revokeObjectURL(objectUrl)
    }
    setFilePreviewUrl(null)
  }, [file])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim() && !file) return
    setSending(true)
    setSendError('')

    let attachmentUrl: string | null = null
    let attachmentName: string | null = null

    if (file) {
      const filePath = `${userId}/${Date.now()}-${file.name}`
      const { error: uploadError } = await supabase.storage
        .from('tutor-attachments')
        .upload(filePath, file)

      if (uploadError) {
        setSendError(`File upload failed: ${uploadError.message}`)
        setSending(false)
        return
      }

      attachmentUrl = filePath
      attachmentName = file.name
    }

    const { error: insertError } = await supabase.from('tutor_messages').insert({
      student_id: userId,
      sender_id: userId,
      sender_role: 'student',
      message_text: text.trim() || 'Sent a file',
      attachment_url: attachmentUrl,
      attachment_name: attachmentName,
    })

    if (insertError) {
      setSendError(`Message failed to send: ${insertError.message}`)
      setSending(false)
      return
    }

    setText('')
    setFile(null)
    setSending(false)
  }

  const startEdit = (m: Message) => {
    setEditingId(m.id)
    setEditText(m.message_text)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditText('')
  }

  const saveEdit = async (id: string) => {
    if (!editText.trim()) return
    await supabase
      .from('tutor_messages')
      .update({ message_text: editText.trim(), edited_at: new Date().toISOString() })
      .eq('id', id)
    setEditingId(null)
    setEditText('')
  }

  const deleteMessage = async (id: string) => {
    if (!window.confirm('Delete this message?')) return
    await supabase.from('tutor_messages').delete().eq('id', id)
  }

  const extractDroppedFile = (dt: DataTransfer): File | null => {
    if (dt.items && dt.items.length > 0) {
      for (let i = 0; i < dt.items.length; i++) {
        const item = dt.items[i]
        if (item.kind === 'file') {
          const f = item.getAsFile()
          if (f) return f
        }
      }
    }
    if (dt.files && dt.files.length > 0) return dt.files[0]
    return null
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current += 1
    if (e.dataTransfer.types.includes('Files')) setIsDraggingOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current -= 1
    if (dragCounter.current <= 0) {
      dragCounter.current = 0
      setIsDraggingOver(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current = 0
    setIsDraggingOver(false)
    const dropped = extractDroppedFile(e.dataTransfer)
    if (dropped) setFile(dropped)
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
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar fullName={fullName} title="Message Tutor" />

        <main className="flex-1 p-8 flex flex-col overflow-hidden">
          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="relative flex flex-col flex-1 min-h-0 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-[#0a0d14] shadow-sm overflow-hidden"
          >
            {isDraggingOver && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-indigo-600/10 backdrop-blur-[2px] border-2 border-dashed border-indigo-500 m-2 rounded-xl pointer-events-none">
                <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                  Drop file to attach
                </p>
              </div>
            )}

            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-zinc-200 dark:border-zinc-800/50 bg-zinc-50 dark:bg-[#0d111a]/40 shrink-0">
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shrink-0">
                <GraduationCap className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-white leading-tight">Your Tutor</p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 leading-tight">Direct messages</p>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 flex flex-col">
              {messages.length === 0 && (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-sm text-zinc-400 dark:text-zinc-500">
                    No messages yet. Ask your tutor anything!
                  </p>
                </div>
              )}

              {messages.map((m, i) => {
                const isMine = m.sender_role === 'student'
                const prev = messages[i - 1]
                const next = messages[i + 1]
                const isGroupedWithPrev = prev && prev.sender_role === m.sender_role
                const isLastInGroup = !next || next.sender_role !== m.sender_role
                const isEditing = editingId === m.id

                return (
                  <div
                    key={m.id}
                    className={`group flex ${isMine ? 'justify-end' : 'justify-start'} ${isGroupedWithPrev ? 'mt-1' : 'mt-3'}`}
                  >
                    <div className={`flex items-center gap-1.5 max-w-[70%] ${isMine ? 'flex-row' : 'flex-row-reverse'}`}>
                      {isMine && !isEditing && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 shrink-0">
                          <button
                            onClick={() => startEdit(m)}
                            className="p-1 rounded text-zinc-400 hover:text-indigo-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => deleteMessage(m.id)}
                            className="p-1 rounded text-zinc-400 hover:text-rose-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      )}

                      <div
                        className={`rounded-2xl px-3.5 py-2 text-sm ${
                          isMine
                            ? 'bg-indigo-600 text-white'
                            : 'bg-zinc-100 dark:bg-zinc-800/70 text-zinc-800 dark:text-zinc-100'
                        }`}
                      >
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <input
                              autoFocus
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveEdit(m.id)
                                if (e.key === 'Escape') cancelEdit()
                              }}
                              className="bg-transparent border-b border-white/40 outline-none text-sm min-w-[120px]"
                            />
                            <button type="button" onClick={() => saveEdit(m.id)}>
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button type="button" onClick={cancelEdit}>
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <>
                            {m.message_text && <p className="whitespace-pre-wrap leading-relaxed">{m.message_text}</p>}
                            {m.attachment_url && m.attachment_name && (
                              <Attachment path={m.attachment_url} name={m.attachment_name} />
                            )}
                            {isLastInGroup && (
                              <p className={`text-[10px] mt-1 ${isMine ? 'text-indigo-200' : 'text-zinc-400 dark:text-zinc-500'}`}>
                                {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                {m.edited_at && ' · edited'}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={handleSend} className="shrink-0 px-5 py-4 border-t border-zinc-200 dark:border-zinc-800/50 bg-zinc-50 dark:bg-[#0d111a]/40">
              {sendError && (
                <p className="text-xs text-rose-500 mb-2">{sendError}</p>
              )}

              {file && (
                <div className="flex items-center gap-3 mb-3 p-2 pr-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0a0d14] w-fit max-w-full">
                  {filePreviewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={filePreviewUrl} alt={file.name} className="h-12 w-12 rounded-md object-cover shrink-0" />
                  ) : (
                    <div className="h-12 w-12 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5 text-zinc-400" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-zinc-700 dark:text-zinc-200 truncate max-w-[180px]">{file.name}</p>
                    <p className="text-[10px] text-zinc-400">{(file.size / 1024).toFixed(0)} KB</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="ml-1 text-zinc-400 hover:text-rose-500 transition-colors shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0a0d14] pl-1.5 pr-1.5 py-1.5">
                <label className="flex items-center justify-center h-8 w-8 shrink-0 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-all">
                  <Paperclip className="h-4 w-4" />
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
                  placeholder="Message..."
                  className="flex-1 bg-transparent text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none"
                />

                <button
                  type="submit"
                  disabled={sending || (!text.trim() && !file)}
                  className="flex items-center justify-center h-8 w-8 shrink-0 rounded-full bg-indigo-600 text-white disabled:opacity-40 hover:bg-indigo-500 transition-colors"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  )
}
