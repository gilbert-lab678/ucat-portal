'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Sidebar } from '@/components/layout/sidebar'
import { Navbar } from '@/components/layout/navbar'
import { Send, Paperclip, X, FileText, Bot } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

export const dynamic = 'force-dynamic'

type Attachment = {
  id: string
  file: File
  previewUrl: string
  base64: string
  mimeType: string
  isImage: boolean
}

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
  imagePreviews?: string[]
  streaming?: boolean
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// Screenshots (especially retina/mobile ones) can be several MB as raw PNG.
// Downscaling + re-encoding as JPEG before it ever hits the network cuts
// both upload time and how long Gemini spends processing the image, with
// no real loss in legibility for text/diagram questions.
const MAX_IMAGE_DIMENSION = 1600
const IMAGE_JPEG_QUALITY = 0.82

function compressImage(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      let { width, height } = img
      if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
        const scale = MAX_IMAGE_DIMENSION / Math.max(width, height)
        width = Math.round(width * scale)
        height = Math.round(height * scale)
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas not supported'))
        return
      }
      ctx.drawImage(img, 0, 0, width, height)

      const dataUrl = canvas.toDataURL('image/jpeg', IMAGE_JPEG_QUALITY)
      resolve({ base64: dataUrl.split(',')[1], mimeType: 'image/jpeg' })
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Failed to load image for compression'))
    }

    img.src = objectUrl
  })
}

// Renders assistant replies with markdown + LaTeX ($...$ and $$...$$) support
function AssistantContent({ text }: { text: string }) {
  return (
    <div className="prose-sm max-w-none [&_p]:my-1.5 [&_ul]:my-1.5 [&_ol]:my-1.5 [&_li]:my-0.5 [&_h1]:text-base [&_h1]:font-semibold [&_h1]:mt-3 [&_h1]:mb-1 [&_h2]:text-sm [&_h2]:font-semibold [&_h2]:mt-3 [&_h2]:mb-1 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1 [&_strong]:font-semibold [&_code]:bg-zinc-200 dark:[&_code]:bg-zinc-700 [&_code]:rounded [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.85em] [&_hr]:my-3 [&_hr]:border-zinc-300 dark:[&_hr]:border-zinc-700">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
      >
        {text}
      </ReactMarkdown>
    </div>
  )
}

export default function AskUbbiePage() {
  const [fullName, setFullName] = useState('')
  const [pageLoading, setPageLoading] = useState(true)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [sending, setSending] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [viewerSrc, setViewerSrc] = useState<string | null>(null)
  const router = useRouter()
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragCounter = useRef(0)

  useEffect(() => {
    const load = async () => {
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
      setPageLoading(false)
    }

    load()
  }, [router])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  // Close lightbox on Escape
  useEffect(() => {
    if (!viewerSrc) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setViewerSrc(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [viewerSrc])

  const addFiles = async (files: FileList | File[]) => {
    const newAttachments: Attachment[] = []

    for (const file of Array.from(files)) {
      const isImage = file.type.startsWith('image/')

      let base64: string
      let mimeType: string
      if (isImage) {
        // Compress images (screenshots in particular) before they're ever
        // sent, rather than shipping the raw file.
        const compressed = await compressImage(file)
        base64 = compressed.base64
        mimeType = compressed.mimeType
      } else {
        base64 = await readFileAsBase64(file)
        mimeType = file.type || 'application/octet-stream'
      }

      newAttachments.push({
        id: `${Date.now()}-${file.name}-${Math.random()}`,
        file,
        previewUrl: isImage ? URL.createObjectURL(file) : '',
        base64,
        mimeType,
        isImage,
      })
    }

    setAttachments((prev) => [...prev, ...newAttachments])
  }

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id))
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current += 1
    if (e.dataTransfer.types.includes('Files')) setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current -= 1
    if (dragCounter.current <= 0) {
      setIsDragging(false)
      dragCounter.current = 0
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    dragCounter.current = 0
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files)
    }
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() && attachments.length === 0) return

    const userMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      role: 'user',
      text: input.trim(),
      imagePreviews: attachments.filter((a) => a.isImage).map((a) => a.previewUrl),
    }

    const historyForApi = messages.map((m) => ({ role: m.role, text: m.text }))
    const imagesForApi = attachments.map((a) => ({ mimeType: a.mimeType, base64: a.base64 }))

    const assistantId = `${Date.now()}-assistant`

    setMessages((prev) => [
      ...prev,
      userMessage,
      { id: assistantId, role: 'assistant', text: '', streaming: true },
    ])
    setInput('')
    setAttachments([])
    setSending(true)

    const updateAssistant = (updater: (prevText: string) => string) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, text: updater(m.text) } : m))
      )
    }

    try {
      const res = await fetch('/api/ask-ubbie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.text,
          images: imagesForApi,
          history: historyForApi,
        }),
      })

      // Error responses come back as JSON with a non-OK status.
      // Success responses come back as a raw streamed text body.
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        updateAssistant(() => `Something went wrong: ${errData.error || 'Request failed.'}`)
        return
      }

      if (!res.body) {
        updateAssistant(() => 'Something went wrong: empty response from server.')
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        if (chunk) updateAssistant((prev) => prev + chunk)
      }
    } catch (err: any) {
      updateAssistant(() => `Something went wrong: ${err.message}`)
    } finally {
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, streaming: false } : m))
      )
      setSending(false)
    }
  }

  if (pageLoading) {
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
        <Navbar fullName={fullName} title="Ask Ubbie" />

        <main className="flex-1 p-8 flex flex-col max-w-4xl mx-auto w-full min-h-0">
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-white mb-1 flex items-center gap-2">
            <Bot className="h-5 w-5 text-indigo-500" /> Ask Ubbie
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">
            Paste a question, drag in a screenshot, and Ubbie will reason it through with you.
          </p>

          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="relative flex-1 bg-white dark:bg-[#0a0d14] border border-zinc-200 dark:border-zinc-800/80 rounded-xl shadow-sm flex flex-col overflow-hidden min-h-0"
          >
            {isDragging && (
              <div className="absolute inset-0 z-10 bg-indigo-600/10 backdrop-blur-sm border-2 border-dashed border-indigo-500 rounded-xl flex items-center justify-center pointer-events-none">
                <p className="text-sm font-medium text-indigo-600 dark:text-indigo-300">Drop files to attach</p>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3 min-h-[560px] max-h-[calc(100vh-280px)]">
              {messages.length === 0 && (
                <div className="flex-1 flex items-center justify-center text-xs text-zinc-400 dark:text-zinc-500 text-center px-8">
                  Ask a UCAT question, or drag in a screenshot of one.
                </div>
              )}

              {messages.map((m) => {
                const isMine = m.role === 'user'
                return (
                  <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] rounded-xl px-3.5 py-2 text-sm ${
                        isMine
                          ? 'bg-indigo-600 text-white rounded-br-sm'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-bl-sm'
                      }`}
                    >
                      {m.imagePreviews && m.imagePreviews.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {m.imagePreviews.map((src, i) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              key={i}
                              src={src}
                              alt="attachment"
                              onClick={() => setViewerSrc(src)}
                              className="h-24 w-24 object-cover rounded-lg cursor-zoom-in hover:opacity-90 transition-opacity"
                            />
                          ))}
                        </div>
                      )}
                      {m.role === 'assistant' ? (
                        m.text ? (
                          <AssistantContent text={m.text} />
                        ) : m.streaming ? (
                          <span className="text-xs text-zinc-500 dark:text-zinc-400">Ubbie is thinking...</span>
                        ) : null
                      ) : (
                        m.text && <p className="whitespace-pre-wrap">{m.text}</p>
                      )}
                    </div>
                  </div>
                )
              })}

              <div ref={bottomRef} />
            </div>

            {attachments.length > 0 && (
              <div className="border-t border-zinc-200 dark:border-zinc-800/50 p-3 flex flex-wrap gap-2">
                {attachments.map((a) => (
                  <div key={a.id} className="relative">
                    {a.isImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={a.previewUrl}
                        alt={a.file.name}
                        onClick={() => setViewerSrc(a.previewUrl)}
                        className="h-16 w-16 object-cover rounded-lg border border-zinc-200 dark:border-zinc-700 cursor-zoom-in hover:opacity-90 transition-opacity"
                      />
                    ) : (
                      <div className="h-16 w-16 flex flex-col items-center justify-center gap-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-[#0d111a] p-1">
                        <FileText className="h-4 w-4 text-zinc-400" />
                        <span className="text-[9px] text-zinc-500 truncate w-full text-center">{a.file.name}</span>
                      </div>
                    )}
                    <button
                      onClick={() => removeAttachment(a.id)}
                      className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center shadow"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleSend} className="border-t border-zinc-200 dark:border-zinc-800/50 p-3 flex gap-2 items-center">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => e.target.files && addFiles(e.target.files)}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0d111a] hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 transition-colors"
                title="Attach file"
              >
                <Paperclip className="h-4 w-4" />
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about a question, or attach a screenshot..."
                className="flex-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0d111a] px-3 py-2 text-sm text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <button
                type="submit"
                disabled={sending || (!input.trim() && attachments.length === 0)}
                className="rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2 disabled:opacity-40 transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </main>
      </div>

      {viewerSrc && (
        <div
          onClick={() => setViewerSrc(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-8 cursor-zoom-out"
        >
          <button
            onClick={() => setViewerSrc(null)}
            className="absolute top-5 right-5 h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={viewerSrc}
            alt="Full size attachment"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
          />
        </div>
      )}
    </div>
  )
}
