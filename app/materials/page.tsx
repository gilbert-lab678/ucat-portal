'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Sidebar } from '@/components/layout/sidebar'
import { Navbar } from '@/components/layout/navbar'
import { Search, Video, FileText, ExternalLink, ChevronDown } from 'lucide-react'

export const dynamic = 'force-dynamic'

type Material = {
  id: string
  title: string
  description: string
  type: 'file' | 'video'
  url: string
}

type Lesson = {
  id: string
  title: string
  lesson_date: string | null
  materials: Material[]
}

type TypeFilter = 'all' | 'video' | 'file'

export default function MaterialsPage() {
  return (
    <Suspense fallback={null}>
      <MaterialsPageInner />
    </Suspense>
  )
}

function MaterialsPageInner() {
  const [fullName, setFullName] = useState('')
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [searchFilter, setSearchFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [expandedLessonId, setExpandedLessonId] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const initialSearch = searchParams.get('search')
    if (initialSearch) setSearchFilter(initialSearch)
  }, [searchParams])

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

      const { data } = await supabase
        .from('lessons')
        .select('id, title, lesson_date, materials(*)')
        .order('lesson_date', { ascending: false, nullsFirst: true })

      setLessons((data as any) || [])
      setLoading(false)
    }

    load()
  }, [router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-[#030408]">
        <p className="text-zinc-500 dark:text-zinc-400 animate-pulse text-sm">Loading Workspace...</p>
      </div>
    )
  }

  const filteredLessons = lessons
    .filter((l) => l.title.toLowerCase().includes(searchFilter.toLowerCase()))
    .map((l) => ({
      ...l,
      materials: l.materials.filter((m) => typeFilter === 'all' || m.type === typeFilter),
    }))
    .filter((l) => l.materials.length > 0)

  return (
    <div className="min-h-screen flex bg-zinc-50 dark:bg-[#030408] text-zinc-900 dark:text-zinc-100 font-sans transition-colors duration-200">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar fullName={fullName} title="Video and Materials" />

        <main className="flex-1 p-8 max-w-3xl mx-auto w-full">
          <div className="mb-6">
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-white mb-1">Video and Materials</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Recordings and files your tutor has shared with you, organised by lesson.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
              <input
                type="text"
                placeholder="Search by week or topic (e.g. Week 1, syllogisms)..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0d111a] text-sm text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
              className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0d111a] px-3 py-2 text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-indigo-500 transition-colors"
            >
              <option value="all">All types</option>
              <option value="video">Videos only</option>
              <option value="file">Files only</option>
            </select>
          </div>

          {filteredLessons.length === 0 ? (
            <div className="bg-white dark:bg-[#0a0d14] border border-zinc-200 dark:border-zinc-800/80 rounded-xl p-10 text-center shadow-sm">
              <p className="text-sm text-zinc-400 dark:text-zinc-500">
                {lessons.length === 0 ? 'No lessons have been shared yet.' : 'No lessons match your search.'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredLessons.map((lesson) => {
                const isExpanded = expandedLessonId === lesson.id
                return (
                  <div
                    key={lesson.id}
                    className="bg-white dark:bg-[#0a0d14] border border-zinc-200 dark:border-zinc-800/80 rounded-xl shadow-sm overflow-hidden transition-colors"
                  >
                    <button
                      onClick={() => setExpandedLessonId(isExpanded ? null : lesson.id)}
                      className="w-full flex items-center justify-between p-4 text-left"
                    >
                      <div>
                        <p className="text-sm font-medium text-zinc-900 dark:text-white">{lesson.title}</p>
                        <p className="text-[11px] text-zinc-400 dark:text-zinc-600 mt-0.5">
                          {lesson.lesson_date
                            ? new Date(lesson.lesson_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
                            : 'General'}
                          {' · '}
                          {lesson.materials.length} item{lesson.materials.length === 1 ? '' : 's'}
                        </p>
                      </div>
                      <ChevronDown className={`h-4 w-4 text-zinc-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>

                    {isExpanded && (
                      <div className="border-t border-zinc-200 dark:border-zinc-800/50 divide-y divide-zinc-200 dark:divide-zinc-800/30">
                        {lesson.materials.map((m) => (
                          <a
                            key={m.id}
                            href={m.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-between gap-3 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              {m.type === 'video' ? (
                                <Video className="h-4 w-4 text-indigo-500 shrink-0" />
                              ) : (
                                <FileText className="h-4 w-4 text-indigo-500 shrink-0" />
                              )}
                              <div>
                                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{m.title}</p>
                                {m.description && (
                                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{m.description}</p>
                                )}
                              </div>
                            </div>
                            <ExternalLink className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
