'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { AdminSidebar } from '@/components/layout/admin-sidebar'
import { Navbar } from '@/components/layout/navbar'
import { Plus, Users, Trash2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

type ClassCode = {
  id: string
  code: string
  description: string | null
  student_count: number
}

export default function AdminClassesPage() {
  const [fullName, setFullName] = useState('')
  const [classes, setClasses] = useState<ClassCode[]>([])
  const [loading, setLoading] = useState(true)
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
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

    const { data: classData } = await supabase
      .from('class_codes')
      .select('id, code, description')
      .order('created_at', { ascending: false })

    const { data: profileCounts } = await supabase
      .from('profiles')
      .select('class_code_id')
      .not('class_code_id', 'is', null)

    const counts = new Map<string, number>()
    for (const p of profileCounts || []) {
      counts.set(p.class_code_id, (counts.get(p.class_code_id) || 0) + 1)
    }

    const combined = (classData || []).map((c) => ({
      ...c,
      student_count: counts.get(c.id) || 0,
    }))

    setClasses(combined)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')

    if (!code.trim()) {
      setMessage('Class code is required.')
      return
    }

    setSaving(true)

    const { error } = await supabase.from('class_codes').insert({
      code: code.trim(),
      description: description.trim() || null,
    })

    if (error) {
      setMessage(`Failed to create: ${error.message}`)
      setSaving(false)
      return
    }

    setCode('')
    setDescription('')
    setSaving(false)
    loadData()
  }

  const handleDelete = async (c: ClassCode) => {
    setMessage('')

    const { count: lessonCount } = await supabase
      .from('lessons')
      .select('id', { count: 'exact', head: true })
      .eq('class_code_id', c.id)

    const lessons = lessonCount || 0
    const confirmed = window.confirm(
      `Delete "${c.code}"?\n\n` +
        `• ${lessons} lesson${lessons === 1 ? '' : 's'} (and their materials) will be deleted\n` +
        `• ${c.student_count} student${c.student_count === 1 ? '' : 's'} will be removed from the class (their accounts and scores are not affected)\n\n` +
        `This can't be undone.`
    )
    if (!confirmed) return

    setDeletingId(c.id)

    const { error: lessonError } = await supabase.from('lessons').delete().eq('class_code_id', c.id)
    if (lessonError) {
      setMessage(`Couldn't delete the class's lessons: ${lessonError.message}`)
      setDeletingId(null)
      return
    }

    const { error: studentError } = await supabase
      .from('profiles')
      .update({ class_code_id: null })
      .eq('class_code_id', c.id)
    if (studentError) {
      setMessage(`Couldn't remove students from the class: ${studentError.message}`)
      setDeletingId(null)
      return
    }

    const { data: deleted, error: classError } = await supabase
      .from('class_codes')
      .delete()
      .eq('id', c.id)
      .select('id')

    if (classError) {
      setMessage(`Couldn't delete the class: ${classError.message}`)
      setDeletingId(null)
      return
    }

    if (!deleted || deleted.length === 0) {
      setMessage(
        "Couldn't delete the class. Your admin account probably doesn't have permission to delete from class_codes in Supabase."
      )
      setDeletingId(null)
      return
    }

    setDeletingId(null)
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
        <Navbar fullName={fullName} title="Class Codes" />

        <main className="flex-1 p-8 max-w-3xl mx-auto w-full">
          <div className="mb-6">
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-white mb-1">Class Codes</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Each class code groups students together for lessons, homework, and attendance.
            </p>
          </div>

          <form onSubmit={handleCreate} className="bg-white dark:bg-[#0a0d14] border border-zinc-200 dark:border-zinc-800/80 rounded-xl p-5 shadow-sm mb-6 flex flex-col sm:flex-row gap-3 sm:items-end">
            <div className="flex-1">
              <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 block mb-1">Class code</label>
              <input
                type="text"
                placeholder="e.g. 12MX2-TUE-TYL1-2026"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0d111a] px-3 py-2 text-sm text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 block mb-1">Description (optional)</label>
              <input
                type="text"
                placeholder="e.g. Tuesday 4:30 group"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0d111a] px-3 py-2 text-sm text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 text-sm font-medium disabled:opacity-50 transition-colors flex items-center gap-1.5 justify-center"
            >
              <Plus className="h-4 w-4" /> Create
            </button>
          </form>

          {message && <p className="text-xs text-rose-500 mb-4">{message}</p>}

          <div className="flex flex-col gap-3">
            {classes.length === 0 && (
              <div className="bg-white dark:bg-[#0a0d14] border border-zinc-200 dark:border-zinc-800/80 rounded-xl p-10 text-center shadow-sm">
                <p className="text-sm text-zinc-400 dark:text-zinc-500">No class codes yet. Create one above.</p>
              </div>
            )}

            {classes.map((c) => (
              <div
                key={c.id}
                role="button"
                tabIndex={0}
                onClick={() => router.push(`/admin/classes/${c.id}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') router.push(`/admin/classes/${c.id}`)
                }}
                className="cursor-pointer text-left bg-white dark:bg-[#0a0d14] border border-zinc-200 dark:border-zinc-800/80 rounded-xl p-4 shadow-sm hover:border-indigo-400 dark:hover:border-indigo-500/50 transition-colors flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">{c.code}</p>
                  {c.description && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{c.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500">
                    <Users className="h-3.5 w-3.5" />
                    {c.student_count} student{c.student_count === 1 ? '' : 's'}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(c)
                    }}
                    disabled={deletingId === c.id}
                    aria-label={`Delete ${c.code}`}
                    className="p-1.5 rounded text-zinc-400 hover:text-rose-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
