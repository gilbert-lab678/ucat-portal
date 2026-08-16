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

function getYouTubeEmbedUrl(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=|youtube\.com\/embed\/)([\w-]+)/)
  return match ? `https://www.youtube.com/embed/${match[1]}` : null
}

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set())
  const [tab, setTab] = useState<'all' | 'saved'>('all')
  const [openId, setOpenId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
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
      .select('status')
      .eq('id', user.id)
      .single()

    if (myProfile?.status !== 'approved') {
      router.push('/login')
      return
    }

    const { data: materialsData } = await supabase
      .from('materials')
      .select('*')
      .order('created_at', { ascending: false })

    const { data: bookmarksData } = await supabase
      .from('bookmarks')
      .select('material_id')
      .eq('user_id', user.id)

    setMaterials(materialsData || [])
    setBookmarkedIds(new Set((bookmarksData || []).map((b) => b.material_id)))
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const toggleBookmark = async (materialId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const isBookmarked = bookmarkedIds.has(materialId)

    if (isBookmarked) {
      await supabase
        .from('bookmarks')
        .delete()
        .eq('user_id', user.id)
        .eq('material_id', materialId)

      setBookmarkedIds((prev) => {
        const next = new Set(prev)
        next.delete(materialId)
        return next
      })
    } else {
      await supabase
        .from('bookmarks')
        .insert({ user_id: user.id, material_id: materialId })

      setBookmarkedIds((prev) => new Set(prev).add(materialId))
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  const visibleMaterials =
    tab === 'saved'
      ? materials.filter((m) => bookmarkedIds.has(m.id))
      : materials

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6">Materials</h1>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab('all')}
            className={`px-3 py-1.5 rounded text-sm font-medium ${
              tab === 'all'
                ? 'bg-black text-white dark:bg-white dark:text-black'
                : 'border border-zinc-300 dark:border-zinc-600'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setTab('saved')}
            className={`px-3 py-1.5 rounded text-sm font-medium ${
              tab === 'saved'
                ? 'bg-black text-white dark:bg-white dark:text-black'
                : 'border border-zinc-300 dark:border-zinc-600'
            }`}
          >
            Saved
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {visibleMaterials.length === 0 && (
            <p className="text-sm text-zinc-500">
              {tab === 'saved' ? 'No saved materials yet.' : 'No materials yet.'}
            </p>
          )}

          {visibleMaterials.map((m) => {
            const isOpen = openId === m.id
            const isBookmarked = bookmarkedIds.has(m.id)
            const youtubeEmbed = m.type === 'video' ? getYouTubeEmbedUrl(m.url) : null

            return (
              <div
                key={m.id}
                className="rounded border border-zinc-200 dark:border-zinc-700 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <button
                    onClick={() => setOpenId(isOpen ? null : m.id)}
                    className="text-left flex-1"
                  >
                    <p className="font-medium">{m.title}</p>
                    {m.description && (
                      <p className="text-sm text-zinc-500">{m.description}</p>
                    )}
                    <p className="text-xs text-zinc-400 mt-1">
                      {m.type === 'video' ? 'Video' : 'File'} · {isOpen ? 'Click to close' : 'Click to view'}
                    </p>
                  </button>

                  <button
                    onClick={() => toggleBookmark(m.id)}
                    aria-label={isBookmarked ? 'Remove bookmark' : 'Save material'}
                    className="text-xl leading-none shrink-0"
                  >
                    {isBookmarked ? '★' : '☆'}
                  </button>
                </div>

                {isOpen && (
                  <div className="mt-4">
                    {m.type === 'video' && youtubeEmbed && (
                      <div className="aspect-video">
                        <iframe
                          src={youtubeEmbed}
                          className="w-full h-full rounded"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    )}

                    {m.type === 'video' && !youtubeEmbed && (
                      <a href={m.url} target="_blank" rel="noopener noreferrer" className="text-sm underline text-blue-600 dark:text-blue-400">
                        Open video link
                      </a>
                    )}

                    {m.type === 'file' && (
                      <div className="flex flex-col gap-2">
                        <iframe
                          src={m.url}
                          className="w-full h-[600px] rounded border border-zinc-200 dark:border-zinc-700"
                        />
                        <a href={m.url} download className="text-sm underline text-blue-600 dark:text-blue-400 self-start">
                          Download file
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
