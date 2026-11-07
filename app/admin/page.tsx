'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { AdminSidebar } from '@/components/layout/admin-sidebar'
import { Navbar } from '@/components/layout/navbar'
import { MessageSquare, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

type MessageAlert = {
  student_id: string
  full_name: string
  count: number
}

type Lesson = {
  id: string
  title: string
  lesson_date: string
  week_label: string | null
  class_code_id: string | null
}

type ClassCode = { id: string; code: string; description: string | null }

// ---- date helpers (all local time, weeks run Monday to Sunday) ----
const toISO = (d: Date) => d.toLocaleDateString('en-CA') // YYYY-MM-DD
const parseISO = (s: string) => new Date(s + 'T00:00:00')

function addDays(d: Date, n: number) {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

function startOfWeek(d: Date) {
  const r = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  r.setDate(r.getDate() - ((r.getDay() + 6) % 7)) // Monday
  return r
}

const formatDay = (d: Date) =>
  d.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'short' })

const formatShort = (d: Date) => d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })

function LessonRow({ lesson, cls }: { lesson: Lesson; cls?: ClassCode }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 dark:border-zinc-800 px-4 py-2.5">
      <div className="min-w-0">
        <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{lesson.title}</p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
          {cls ? cls.description || cls.code : 'No class assigned'}
        </p>
      </div>
      {lesson.week_label && (
        <span className="text-xs text-zinc-400 dark:text-zinc-500 shrink-0">{lesson.week_label}</span>
      )}
    </div>
  )
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [fullName, setFullName] = useState('')
  const [alerts, setAlerts] = useState<MessageAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [classes, setClasses] = useState<Record<string, ClassCode>>({})
  const [lessonError, setLessonError] = useState('')
  const [weekView, setWeekView] = useState(false)
  const [weekOffset, setWeekOffset] = useState(0)

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

      // Lessons and class codes are fetched separately so one problem can't hide the other
      const [lessonRes, classRes] = await Promise.all([
        supabase
          .from('lessons')
          .select('id, title, lesson_date, week_label, class_code_id')
          .not('lesson_date', 'is', null)
          .order('lesson_date', { ascending: true })
          .order('created_at', { ascending: true })
          .limit(1000),
        supabase.from('class_codes').select('id, code, description'),
      ])

      if (lessonRes.error) setLessonError(lessonRes.error.message)
      setLessons((lessonRes.data as Lesson[]) || [])
      setClasses(Object.fromEntries(((classRes.data as ClassCode[]) || []).map((c) => [c.id, c])))

      // Count each student's messages that came after your last reply in that thread
      const { data: messages } = await supabase
        .from('tutor_messages')
        .select('student_id, sender_role, created_at')
        .order('created_at', { ascending: false })

      const counts = new Map<string, number>()
      const answered = new Set<string>()
      for (const m of messages || []) {
        if (answered.has(m.student_id)) continue
        if (m.sender_role === 'student') {
          counts.set(m.student_id, (counts.get(m.student_id) || 0) + 1)
        } else {
          answered.add(m.student_id)
        }
      }

      const ids = Array.from(counts.keys())
      if (ids.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', ids)

        setAlerts(
          (profiles || [])
            .map((p) => ({ student_id: p.id, full_name: p.full_name, count: counts.get(p.id) || 0 }))
            .sort((a, b) => b.count - a.count)
        )
      }

      setLoading(false)
    }

    load()
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-[#030408]">
        <p className="text-zinc-500 dark:text-zinc-400 animate-pulse text-sm">Loading Workspace...</p>
      </div>
    )
  }

  const todayISO = toISO(new Date())

  // Next 3 lessons, grouped by day (several lessons can share a day)
  const nextThree = lessons.filter((l) => l.lesson_date >= todayISO).slice(0, 3)
  const nextGroups: { date: string; items: Lesson[] }[] = []
  for (const l of nextThree) {
    const last = nextGroups[nextGroups.length - 1]
    if (last && last.date === l.lesson_date) last.items.push(l)
    else nextGroups.push({ date: l.lesson_date, items: [l] })
  }

  // Monday to Sunday week view
  const weekStart = addDays(startOfWeek(new Date()), weekOffset * 7)
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const weekRange = `${formatShort(weekStart)} to ${formatShort(addDays(weekStart, 6))}`

  const lastLesson = lessons.length ? lessons[lessons.length - 1] : null

  const emptyMessage = lessonError
    ? `Couldn't load lessons: ${lessonError}`
    : lessons.length === 0
    ? 'No lessons found.'
    : `No upcoming lessons. Your latest lesson was on ${formatShort(parseISO(lastLesson!.lesson_date))}.`

  return (
    <div className="min-h-screen flex bg-zinc-50 dark:bg-[#030408] text-zinc-900 dark:text-zinc-100 font-sans transition-colors duration-200">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar fullName={fullName} title="Dashboard" />

        <main className="flex-1 p-8 max-w-3xl mx-auto w-full space-y-6">
          <div className="bg-white dark:bg-[#0a0d14] border border-zinc-200 dark:border-zinc-800/80 rounded-xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-800/50 bg-zinc-50 dark:bg-[#0d111a]/40 flex items-center justify-between gap-3">
              {weekView ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setWeekOffset((w) => w - 1)}
                    className="p-1 rounded text-zinc-400 hover:text-indigo-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    aria-label="Previous week"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <h2 className="text-sm font-semibold text-zinc-900 dark:text-white min-w-[140px] text-center">
                    {weekOffset === 0 ? 'This week' : weekRange}
                    {weekOffset === 0 && (
                      <span className="block text-xs font-normal text-zinc-500 dark:text-zinc-400">{weekRange}</span>
                    )}
                  </h2>
                  <button
                    onClick={() => setWeekOffset((w) => w + 1)}
                    className="p-1 rounded text-zinc-400 hover:text-indigo-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    aria-label="Next week"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  {weekOffset !== 0 && (
                    <button
                      onClick={() => setWeekOffset(0)}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline ml-1"
                    >
                      Today
                    </button>
                  )}
                </div>
              ) : (
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-indigo-500" /> Upcoming lessons
                </h2>
              )}

              <button
                onClick={() => {
                  setWeekView((v) => !v)
                  setWeekOffset(0)
                }}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline shrink-0"
              >
                {weekView ? 'Back to upcoming' : 'View week'}
              </button>
            </div>

            {weekView ? (
              <div className="p-5 flex flex-col gap-4">
                {lessonError && <p className="text-sm text-rose-500">{emptyMessage}</p>}
                {weekDays.map((day) => {
                  const iso = toISO(day)
                  const items = lessons.filter((l) => l.lesson_date === iso)
                  const isToday = iso === todayISO
                  const isPast = iso < todayISO
                  return (
                    <div key={iso} className={isPast ? 'opacity-60' : ''}>
                      <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 flex items-center gap-2">
                        {formatDay(day)}
                        {isToday && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-indigo-600 text-white">
                            Today
                          </span>
                        )}
                      </p>
                      {items.length === 0 ? (
                        <p className="text-xs text-zinc-300 dark:text-zinc-600 pl-1">No lessons</p>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {items.map((l) => (
                            <LessonRow key={l.id} lesson={l} cls={l.class_code_id ? classes[l.class_code_id] : undefined} />
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="p-5 flex flex-col gap-4">
                {nextGroups.length === 0 && (
                  <p className={`text-sm ${lessonError ? 'text-rose-500' : 'text-zinc-400 dark:text-zinc-500'}`}>
                    {emptyMessage}
                  </p>
                )}
                {nextGroups.map((g) => (
                  <div key={g.date}>
                    <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 flex items-center gap-2">
                      {formatDay(parseISO(g.date))}
                      {g.date === todayISO && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-indigo-600 text-white">
                          Today
                        </span>
                      )}
                    </p>
                    <div className="flex flex-col gap-2">
                      {g.items.map((l) => (
                        <LessonRow key={l.id} lesson={l} cls={l.class_code_id ? classes[l.class_code_id] : undefined} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-[#0a0d14] border border-zinc-200 dark:border-zinc-800/80 rounded-xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-800/50 bg-zinc-50 dark:bg-[#0d111a]/40">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-indigo-500" /> Notifications
              </h2>
            </div>

            <div className="p-5 flex flex-col gap-2">
              {alerts.length === 0 && (
                <p className="text-sm text-zinc-400 dark:text-zinc-500">You're all caught up.</p>
              )}
              {alerts.map((a) => (
                <button
                  key={a.student_id}
                  onClick={() => router.push(`/admin/tutor/${a.student_id}`)}
                  className="text-left rounded-lg border border-zinc-200 dark:border-zinc-800 px-4 py-3 text-sm hover:border-indigo-400 dark:hover:border-indigo-500/50 transition-colors"
                >
                  <span className="font-medium text-zinc-900 dark:text-white">{a.full_name}</span>
                  <span className="text-zinc-500 dark:text-zinc-400">
                    {' '}sent you {a.count} message{a.count === 1 ? '' : 's'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
