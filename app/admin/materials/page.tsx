'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

type Material = {
  id: string
  title: string
  description: string
  type: string
  url: string
  created_at: string
}

export default function AdminMaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<'file' | 'video'>('video')
  const [videoUrl, setVideoUrl] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const router = useRouter()

  const supabase = createClient()

  const loadMaterials = async () => {
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

    const { data } = await supabase
      .from('materials')
      .select('*')
      .order('created_at', { ascending: false })

    setMaterials(data || [])
    setPageLoading(false)
  }

  useEffect(() => {
    loadMaterials()
  }, [])

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    setLoading(true)

    let finalUrl = videoUrl

    if (type === 'file') {
      if (!file) {
        setMessage('Please choose a file.')
        setLoading(false)
        return
      }

      const filePath = `${Date.now()}-${file.name}`
      const { error: uploadError } = await supabase.storage
        .from('materials')
        .upload(filePath, file)

      if (uploadError) {
        setMessage(`Upload failed: ${uploadError.message}`)
        setLoading(false)
        return
      }

      const { data: publicUrlData } = supabase.storage
        .from('materials')
        .getPublicUrl(filePath)

      finalUrl = publicUrlData.publicUrl
    }

    const { error } = await supabase.from('materials').insert({
      title,
      description,
      type,
      url: finalUrl,
    })

    if (error) {
      setMessage(`Save failed: ${error.message}`)
      setLoading(false)
      return
    }

    setTitle('')
    setDescription('')
    setVideoUrl('')
    setFile(null)
    setMessage('Material added!')
    setLoading(false)
    loadMaterials()
  }

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('materials').delete().eq('id', id)
    if (error) {
      setMessage(`Delete failed: ${error.message}`)
      return
    }
    loadMaterials()
  }

  if (pageLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6">Manage Materials</h1>

        <form onSubmit={handleUpload} className="flex flex-col gap-4 mb-8 rounded border border-zinc-200 dark:border-zinc-700 p-6">
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="rounded border border-zinc-300 dark:border-zinc-600 px-3 py-2 bg-transparent"
          />
          <textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="rounded border border-zinc-300 dark:border-zinc-600 px-3 py-2 bg-transparent"
          />

          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={type === 'video'}
                onChange={() => setType('video')}
              />
              Video link (Zoom/YouTube)
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={type === 'file'}
                onChange={() => setType('file')}
              />
              Upload file (PDF, slides, etc.)
            </label>
          </div>

          {type === 'video' ? (
            <input
              type="url"
              placeholder="https://..."
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              required
              className="rounded border border-zinc-300 dark:border-zinc-600 px-3 py-2 bg-transparent"
            />
          ) : (
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              required
              className="text-sm"
            />
          )}

          <button
            type="submit"
            disabled={loading}
            className="rounded bg-black dark:bg-white text-white dark:text-black px-3 py-2 font-medium disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Add material'}
          </button>

          {message && <p className="text-sm text-zinc-600 dark:text-zinc-400">{message}</p>}
        </form>

        <h2 className="text-lg font-medium mb-3">Existing materials</h2>
        <div className="flex flex-col gap-3">
          {materials.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between rounded border border-zinc-200 dark:border-zinc-700 p-4"
            >
              <div>
                <p className="font-medium">{m.title}</p>
                <p className="text-sm text-zinc-500">{m.type} · {m.description}</p>
              </div>
              <button
                onClick={() => handleDelete(m.id)}
                className="text-sm text-red-600 underline"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}