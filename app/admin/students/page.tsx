'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { AdminSidebar } from '@/components/layout/admin-sidebar'
import { Navbar } from '@/components/layout/navbar'
import { Search } from 'lucide-react'

export const dynamic = 'force-dynamic'

const YEAR_GROUPS = ['Year 10', 'Year 11', 'Year 12', 'Gap year']

type Student = {
  id: string
  full_name: string
  email: string
  year_group: string | null
}

export default function StudentsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [fullName, setFullName] = useState('')
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [yearFilter, setYearFilter] = useState('all')

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

      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, email, year_group')
        .eq('status', 'approved')
        .eq('is_admin', false)
        .order('full_name', { ascending: true })

      setStudents(data || [])
      setLoading(false)
    }

    load()
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return students.filter((s) => {
      const matchesName = !q || s.full_name?.toLowerCase().includes(q)
      const matchesYear =
        yearFilter === 'all' ||
        (yearFilter === 'none' ? !s.year_group : s.year_group === yearFilter)
      return matchesName && matchesYear
    })
  }, [students, search, yearFilter])

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
        <Navbar fullName={fullName} title="Students" />

        <main className="flex-1 p-8 max-w-3xl mx-auto w-full">
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search students by name..."
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0d111a] pl-9 pr-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0d111a] px-3 py-2 text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-indigo-500 transition-colors"
            >
              <option value="all">All year groups</option>
              {YEAR_GROUPS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
              <option value="none">No year group</option>
            </select>
          </div>

          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
            {filtered.length} student{filtered.length === 1 ? '' : 's'}
          </p>

          <div className="flex flex-col gap-3">
            {filtered.length === 0 && (
              <div className="bg-white dark:bg-[#0a0d14] border border-zinc-200 dark:border-zinc-800/80 rounded-xl p-10 text-center shadow-sm">
                <p className="text-sm text-zinc-400 dark:text-zinc-500">No students match.</p>
              </div>
            )}

            {filtered.map((s) => (
              <button
                key={s.id}
                onClick={() => router.push(`/admin/students/${s.id}`)}
                className="text-left bg-white dark:bg-[#0a0d14] border border-zinc-200 dark:border-zinc-800/80 rounded-xl p-4 shadow-sm hover:border-indigo-400 dark:hover:border-indigo-500/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                    {s.full_name?.charAt(0).toUpperCase() || 'S'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{s.full_name}</p>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate">{s.email}</p>
                  </div>
                  <span className="text-xs font-medium px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 shrink-0">
                    {s.year_group || 'No year group'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
