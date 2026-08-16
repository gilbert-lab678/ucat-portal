'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const SECTIONS = [
  { value: 'verbal_reasoning', label: 'Verbal Reasoning' },
  { value: 'decision_making', label: 'Decision Making' },
  { value: 'quantitative_reasoning', label: 'Quantitative Reasoning' },
  { value: 'situational_judgement', label: 'Situational Judgement' },
]

export default function PracticePage() {
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const router = useRouter()

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
        .select('status')
        .eq('id', user.id)
        .single()

      if (!profile || profile.status !== 'approved') {
        router.push('/login')
        return
      }

      const results: Record<string, number> = {}

      for (const s of SECTIONS) {
        const { count } = await supabase
          .from('questions')
          .select('*', { count: 'exact', head: true })
          .eq('section', s.value)
          .eq('category', 'practice')

        results[s.value] = count || 0
      }

      setCounts(results)
      setLoading(false)
    }

    load()
  }, [router])

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
        <h1 className="text-2xl font-semibold mb-2">Question Bank</h1>
        <p className="text-sm text-zinc-500 mb-6">Untimed practice, by section. Pick one to start.</p>

        <div className="flex flex-col gap-3">
          {SECTIONS.map((s) => (
            <button
              key={s.value}
              onClick={() => router.push(`/practice/${s.value}`)}
              disabled={counts[s.value] === 0}
              className="flex items-center justify-between rounded border border-zinc-200 dark:border-zinc-700 p-5 text-left hover:border-zinc-400 dark:hover:border-zinc-500 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="font-medium">{s.label}</span>
              <span className="text-sm text-zinc-500">
                {counts[s.value] === 0 ? 'No questions yet' : `${counts[s.value]} question${counts[s.value] === 1 ? '' : 's'}`}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-6">
          <a href="/dashboard" className="text-sm underline">Back to dashboard</a>
        </div>
      </div>
    </div>
  )
}
