'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { Sidebar } from '@/components/layout/sidebar'
import { Navbar } from '@/components/layout/navbar'
import { Search, Calendar, ExternalLink, ChevronUp, ChevronDown, Bell, Bot, MessageCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

type Lesson = {
  id: string
  title: string | null
  lesson_date: string | null
  week_label: string | null
  hw_requirement: string | null
  comments: string | null
  video_link: string | null
  whiteboard_link: string | null
  tutor_name: string | null
  class_codes: { code: string } | null
}

type Notification = {
  id: string
  message: string
  created_at: string
}

type MockScore = {
  id: string
  mock_date: string
  vr_score: number
  dm_score: number
  qr_score: number
  sjt_score: number | null
}

type Subtest = {
  name: string
  score: string
  trend: string
  isPositive: boolean
  accuracy: number
  hasData: boolean
}

const SUBTEST_CONFIG = [
  { key: 'vr_score' as const, name: 'Verbal Reasoning', max: 900 },
  { key: 'dm_score' as const, name: 'Decision Making', max: 900 },
  { key: 'qr_score' as const, name: 'Quantitative Reasoning', max: 900 },
  { key: 'sjt_score' as const, name: 'Situational Judgement', max: 900 },
]

function computeSubtests(mocks: MockScore[]): Subtest[] {
  return SUBTEST_CONFIG.map(({ key, name, max }) => {
    const withScore = mocks.filter((m) => m[key] !== null && m[key] !== undefined)

    if (withScore.length === 0) {
      return { name, score: '—', trend: 'No data', isPositive: true, accuracy: 0, hasData: false }
    }

    const latestMock = withScore[withScore.length - 1]
    const latest = latestMock[key] as number
    const accuracy = Math.round((latest / max) * 100)

    const twoWeeksBefore = new Date(latestMock.mock_date)
    twoWeeksBefore.setDate(twoWeeksBefore.getDate() - 14)

    const priorWindow = withScore.filter(
      (m) =>
        m.id !== latestMock.id &&
        new Date(m.mock_date) >= twoWeeksBefore &&
        new Date(m.mock_date) < new Date(latestMock.mock_date)
    )

    if (priorWindow.length === 0) {
      return { name, score: `${accuracy}%`, trend: 'New', isPositive: true, accuracy, hasData: true }
    }

    const avgPrior = priorWindow.reduce((sum, m) => sum + (m[key] as number), 0) / priorWindow.length
    const avgPriorPct = (avgPrior / max) * 100
    const deltaPct = Math.round(accuracy - avgPriorPct)

    return {
      name,
      score: `${accuracy}%`,
      trend: `${deltaPct > 0 ? '+' : ''}${deltaPct}%`,
      isPositive: deltaPct >= 0,
      accuracy,
      hasData: true,
    }
  })
}

export default function DashboardPage() {
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(true)
  const [searchFilter, setSearchFilter] = useState('')
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({})
  // Starts empty; the saved per-student date is loaded from Supabase in loadUser.
  const [examDate, setExamDate] = useState<string>('')
  const [daysLeft, setDaysLeft] = useState<number | null>(null)
  const [upcomingLessons, setUpcomingLessons] = useState<Lesson[]>([])
  const [lessonHistory, setLessonHistory] = useState<Lesson[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [subtests, setSubtests] = useState<Subtest[]>([])
  const router = useRouter()

  useEffect(() => {
    if (!examDate) {
      setDaysLeft(null)
      return
    }
    // Compare local midnight to local midnight so the count doesn't
    // change depending on the time of day.
    const exam = new Date(`${examDate}T00:00:00`)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const diffDays = Math.round((exam.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    setDaysLeft(diffDays > 0 ? diffDays : 0)
  }, [examDate])

  useEffect(() => {
    const loadUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return; }

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, status, exam_date')
        .eq('id', user.id)
        .single()
      if (!profile || profile.status !== 'approved') { router.push('/login'); return; }

      setFullName(profile.full_name)
      setExamDate(profile.exam_date ?? '')

      const { data: lessonsData } = await supabase
        .from('lessons')
        .select('id, title, lesson_date, week_label, hw_requirement, comments, video_link, whiteboard_link, tutor_name, class_codes(code)')

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const upcoming: Lesson[] = []
      const history: Lesson[] = []

      for (const l of (lessonsData as any) || []) {
        if (l.lesson_date && new Date(l.lesson_date) >= today) {
          upcoming.push(l)
        } else if (l.lesson_date) {
          history.push(l)
        }
      }

      upcoming.sort((a, b) => new Date(a.lesson_date!).getTime() - new Date(b.lesson_date!).getTime())
      history.sort((a, b) => new Date(b.lesson_date!).getTime() - new Date(a.lesson_date!).getTime())

      setUpcomingLessons(upcoming)
      setLessonHistory(history)

      // Mock scores drive the top summary cards - scoped to this student only.
      const { data: mockData } = await supabase
        .from('mock_scores')
        .select('id, mock_date, vr_score, dm_score, qr_score, sjt_score')
        .eq('student_id', user.id)
        .order('mock_date', { ascending: true })

      setSubtests(computeSubtests((mockData as MockScore[]) || []))

      // RLS on notifications already restricts this to general announcements
      // plus anything specifically targeted at this student.
      const { data: notifData } = await supabase
        .from('notifications')
        .select('id, message, created_at')
        .order('created_at', { ascending: false })
        .limit(10)

      setNotifications(notifData || [])
      setLoading(false)
    }
    loadUser()
  }, [router])

  // Saves the student's exam date to their own profile row.
  const handleExamDateChange = async (value: string) => {
    setExamDate(value)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('profiles')
      .update({ exam_date: value || null })
      .eq('id', user.id)

    if (error) console.error('Failed to save exam date:', error.message)
  }

  const filteredHistory = lessonHistory.filter((lesson) =>
    (lesson.title || '').toLowerCase().includes(searchFilter.toLowerCase()) ||
    (lesson.comments || '').toLowerCase().includes(searchFilter.toLowerCase())
  )

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
        <Navbar fullName={fullName} />

        <main className="flex-1 p-8 grid grid-cols-1 xl:grid-cols-4 gap-8 overflow-y-auto">
          <div className="xl:col-span-3 space-y-8">

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {subtests.map((subtest) => (
                <div key={subtest.name} className="bg-white dark:bg-[#0a0d14] border border-zinc-200 dark:border-zinc-800/80 rounded-xl p-5 shadow-sm transition-all duration-200">
                  <div className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{subtest.name}</div>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className={`text-2xl font-bold ${subtest.hasData ? 'text-zinc-900 dark:text-white' : 'text-zinc-400 dark:text-zinc-600'}`}>
                      {subtest.score}
                    </span>
                    <span className={`text-xs font-mono px-2 py-0.5 rounded border ${
                      !subtest.hasData
                        ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 border-transparent'
                        : subtest.trend.startsWith('+')
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/10'
                        : subtest.trend.startsWith('-')
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/10'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-transparent'
                    }`}>
                      {subtest.hasData && subtest.trend !== 'New' ? `${subtest.trend} vs 2w avg` : subtest.trend}
                    </span>
                  </div>
                  <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1 rounded-full mt-4 overflow-hidden">
                    <div className="bg-indigo-500 h-full" style={{ width: `${subtest.accuracy}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white dark:bg-[#0a0d14] border border-zinc-200 dark:border-zinc-800/80 rounded-xl overflow-hidden shadow-sm transition-colors duration-200">
              <div className="p-5 border-b border-zinc-200 dark:border-zinc-800/50 bg-zinc-50 dark:bg-[#0d111a]/40 transition-colors">
                <h3 className="font-semibold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-indigo-500 dark:text-indigo-400" /> Upcoming Lessons
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800/50 text-[11px] text-zinc-500 dark:text-zinc-400 uppercase bg-zinc-50 dark:bg-[#0e121c]/40 font-semibold transition-colors">
                      <th className="p-4">Class</th>
                      <th className="p-4">Date</th>
                      <th className="p-4">Tutor</th>
                      <th className="p-4 text-center">Video</th>
                      <th className="p-4 text-center">Whiteboard</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/30 text-zinc-700 dark:text-zinc-300">
                    {upcomingLessons.length === 0 && (
                      <tr><td colSpan={5} className="p-4 text-center text-zinc-400 dark:text-zinc-600">No upcoming lessons scheduled.</td></tr>
                    )}
                    {upcomingLessons.map((lesson) => (
                      <tr key={lesson.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors">
                        <td className="p-4 font-medium text-indigo-600 dark:text-indigo-400">{lesson.class_codes?.code || '—'}</td>
                        <td className="p-4 text-zinc-500 dark:text-zinc-400">
                          {lesson.lesson_date && new Date(lesson.lesson_date).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'short' })}
                        </td>
                        <td className="p-4">{lesson.tutor_name || '—'}</td>
                        <td className="p-4 text-center">
                          {lesson.video_link ? (
                            <a href={lesson.video_link} target="_blank" rel="noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1">
                              Click here <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : '—'}
                        </td>
                        <td className="p-4 text-center">
                          {lesson.whiteboard_link ? (
                            <a href={lesson.whiteboard_link} target="_blank" rel="noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1">
                              Click here <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white dark:bg-[#0a0d14] border border-zinc-200 dark:border-zinc-800/80 rounded-xl overflow-hidden shadow-sm transition-colors duration-200">
              <div className="p-5 border-b border-zinc-200 dark:border-zinc-800/50 sm:flex items-center justify-between gap-4 bg-zinc-50 dark:bg-[#0d111a]/40 transition-colors">
                <h3 className="font-semibold text-sm text-zinc-900 dark:text-white">Lesson History</h3>
                <div className="relative max-w-xs w-full">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Filter by topic..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="w-full pl-9 pr-4 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0d111a] text-xs text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800/50 text-[11px] text-zinc-500 dark:text-zinc-400 uppercase bg-zinc-50 dark:bg-[#0e121c]/40 font-semibold transition-colors">
                      <th className="p-4">Class Code</th>
                      <th className="p-4">Content</th>
                      <th className="p-4">Week</th>
                      <th className="p-4">HW Requirements</th>
                      <th className="p-4">Comments</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/30 text-zinc-700 dark:text-zinc-300">
                    {filteredHistory.length === 0 && (
                      <tr><td colSpan={5} className="p-4 text-center text-zinc-400 dark:text-zinc-600">No past lessons yet.</td></tr>
                    )}
                    {filteredHistory.map((lesson) => (
                      <tr key={lesson.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/20 align-top transition-colors">
                        <td className="p-4 font-mono text-zinc-400 dark:text-zinc-500">{lesson.class_codes?.code || '—'}</td>
                        <td className="p-4">
                          <span className="text-indigo-600 dark:text-indigo-400 font-medium block">{lesson.title || 'Untitled'}</span>
                        </td>
                        <td className="p-4 text-zinc-500 dark:text-zinc-400">{lesson.week_label || '—'}</td>
                        <td className="p-4 text-amber-600 dark:text-amber-400 font-medium">{lesson.hw_requirement || '—'}</td>
                        <td className="p-4 max-w-xs">
                          {!lesson.comments ? (
                            <span className="text-zinc-400 dark:text-zinc-600">—</span>
                          ) : (
                            <div>
                              <p className={`text-zinc-600 dark:text-zinc-400 ${expandedComments[lesson.id] ? '' : 'line-clamp-2'}`}>
                                {lesson.comments}
                              </p>
                              {lesson.comments.length > 60 && (
                                <button
                                  onClick={() => setExpandedComments((p) => ({ ...p, [lesson.id]: !p[lesson.id] }))}
                                  className="mt-1 text-indigo-600 dark:text-indigo-400 font-semibold inline-flex items-center gap-1 hover:underline"
                                >
                                  {expandedComments[lesson.id] ? (
                                    <>Collapse <ChevronUp className="h-3 w-3" /></>
                                  ) : (
                                    <>View Full Detail <ChevronDown className="h-3 w-3" /></>
                                  )}
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-[#0a0d14] border border-zinc-200 dark:border-zinc-800/80 rounded-xl p-5 shadow-sm transition-colors duration-200">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black font-mono text-zinc-900 dark:text-white">{daysLeft ?? '--'}</span>
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full uppercase">Days Left</span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Exam Countdown Schedule</p>
              <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800/60 flex items-center justify-between gap-2">
                <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium">Set exam date:</span>
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => handleExamDateChange(e.target.value)}
                  className="bg-zinc-50 dark:bg-[#0d111a] border border-zinc-200 dark:border-zinc-800 rounded px-2 py-1 text-xs font-mono text-zinc-800 dark:text-zinc-300 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div className="bg-white dark:bg-[#0a0d14] border border-zinc-200 dark:border-zinc-800/80 rounded-xl p-5 shadow-sm transition-colors duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800/50 mb-3">
                <h4 className="font-semibold text-xs text-zinc-800 dark:text-white uppercase flex items-center gap-2">
                  <Bell className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" /> Notifications
                </h4>
                <span className="text-[10px] font-bold px-1.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 font-mono">
                  {notifications.length}
                </span>
              </div>

              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-6 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-[#0d111a]/20">
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">No announcements posted</p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-600 mt-1">Real-time alerts will stream when pushed from admin hub.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                  {notifications.map((n) => (
                    <div key={n.id} className="rounded-lg bg-zinc-50 dark:bg-[#0d111a]/40 p-3">
                      <p className="text-xs text-zinc-700 dark:text-zinc-300">{n.message}</p>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-600 mt-1">
                        {new Date(n.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Link
              href="/ask-ubbie"
              className="group flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-indigo-50/80 to-purple-50/50 dark:from-indigo-900/40 dark:to-purple-900/30 border border-indigo-100 dark:border-indigo-500/20 hover:border-indigo-300 dark:hover:border-indigo-500/40 transition-all shadow-sm dark:shadow-lg block"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-indigo-100 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-400/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Bot className="h-4 w-4" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-zinc-900 dark:text-white">Stuck on a logic problem?</h5>
                  <p className="text-[11px] text-indigo-600 dark:text-indigo-300/80">Ask Ubbie for step-by-step reasoning</p>
                </div>
              </div>
              <MessageCircle className="h-4 w-4 text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </main>
      </div>
    </div>
  )
}
