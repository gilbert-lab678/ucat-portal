'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { Sidebar } from '@/components/layout/sidebar'
import { Navbar } from '@/components/layout/navbar'
import { Search, Calendar, ExternalLink, ChevronUp, ChevronDown, Bell, Bot, MessageCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

const INITIAL_SUBTESTS = [
  { name: 'Verbal Reasoning', score: '82%', trend: '+4%', isPositive: true, accuracy: 82 },
  { name: 'Decision Making', score: '64%', trend: '-2%', isPositive: false, accuracy: 64 },
  { name: 'Quantitative Reasoning', score: '71%', trend: '+5%', isPositive: true, accuracy: 71 },
  { name: 'Situational Judgement', score: '78%', trend: '0%', isPositive: true, accuracy: 78 },
]

const UPCOMING_LESSONS = [
  {
    id: 1,
    classCode: '12MX2-TUE-TYL1-2026',
    time: 'Tuesday 16:30',
    tutor: 'Tyson Lieu',
    videoLink: '/materials?search=12MX2-TUE-TYL1-2026',
    whiteboardLink: 'https://miro.com',
  }
]

const LESSON_HISTORY = [
  {
    id: 1,
    classCode: '12MX2-TUE-TYL1-2026',
    content: '5.5 Mechanics V',
    week: 'Week 2',
    hw: 'Medify Mock 5',
    comments: 'Excellent breakdown of angular kinematics. Focus on the core acceleration matrices before attempting the final past papers.',
    tags: ['mechanics', 'kinematics']
  },
  {
    id: 2,
    classCode: '12MX2-TUE-TYL1-2026',
    content: '5.4 Mechanics IV',
    week: 'Week 1',
    hw: 'Medify Mock 6',
    comments: 'N/A',
    tags: ['mechanics', 'syllogisms']
  }
]

export default function DashboardPage() {
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(true)
  const [searchFilter, setSearchFilter] = useState('')
  const [expandedComments, setExpandedComments] = useState<Record<number, boolean>>({})
  const [examDate, setExamDate] = useState<string>('2026-11-15')
  const [daysLeft, setDaysLeft] = useState<number | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (!examDate) return
    const diffDays = Math.ceil((new Date(examDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    setDaysLeft(diffDays > 0 ? diffDays : 0)
  }, [examDate])

  useEffect(() => {
    const loadUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return; }

      const { data: profile } = await supabase.from('profiles').select('full_name, status').eq('id', user.id).single()
      if (!profile || profile.status !== 'approved') { router.push('/login'); return; }

      setFullName(profile.full_name)
      setLoading(false)
    }
    loadUser()
  }, [router])

  const filteredHistory = LESSON_HISTORY.filter(lesson => 
    lesson.content.toLowerCase().includes(searchFilter.toLowerCase()) ||
    lesson.tags.some(tag => tag.toLowerCase().includes(searchFilter.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-[#030408]">
        <p className="text-zinc-500 dark:text-zinc-400 animate-pulse text-sm">Loading Workspace...</p>
      </div>
    )
  }

  // --- RENDERING CONTINUES BELOW ---
  return (
    <div className="min-h-screen flex bg-zinc-50 dark:bg-[#030408] text-zinc-900 dark:text-zinc-100 font-sans transition-colors duration-200">
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar fullName={fullName} />
        
        <main className="flex-1 p-8 grid grid-cols-1 xl:grid-cols-4 gap-8 overflow-y-auto">
          {/* Main Left Columns */}
          <div className="xl:col-span-3 space-y-8">
            
            {/* Accuracy Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {INITIAL_SUBTESTS.map((subtest) => (
                <div key={subtest.name} className="bg-white dark:bg-[#0a0d14] border border-zinc-200 dark:border-zinc-800/80 rounded-xl p-5 shadow-sm transition-all duration-200">
                  <div className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{subtest.name}</div>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-2xl font-bold text-zinc-900 dark:text-white">{subtest.score}</span>
                    <span className={`text-xs font-mono px-2 py-0.5 rounded border ${
                      subtest.trend.startsWith('+') 
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/10' 
                        : subtest.trend.startsWith('-')
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/10'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-transparent'
                    }`}>
                      {subtest.trend} vs 2w avg
                    </span>
                  </div>
                  <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1 rounded-full mt-4 overflow-hidden">
                    <div className="bg-indigo-500 h-full" style={{ width: `${subtest.accuracy}%` }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Upcoming Classes */}
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
                      <th className="p-4">Time</th>
                      <th className="p-4">Tutor</th>
                      <th className="p-4 text-center">Video</th>
                      <th className="p-4 text-center">Whiteboard</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/30 text-zinc-700 dark:text-zinc-300">
                    {UPCOMING_LESSONS.map((lesson) => (
                      <tr key={lesson.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors">
                        <td className="p-4 font-medium text-indigo-600 dark:text-indigo-400">{lesson.classCode}</td>
                        <td className="p-4 text-zinc-500 dark:text-zinc-400">{lesson.time}</td>
                        <td className="p-4">{lesson.tutor}</td>
                        <td className="p-4 text-center">
                          <Link href={lesson.videoLink} className="text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1">
                            Click here <ExternalLink className="h-3 w-3" />
                          </Link>
                        </td>
                        <td className="p-4 text-center">
                          <a href={lesson.whiteboardLink} target="_blank" rel="noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1">
                            Click here <ExternalLink className="h-3 w-3" />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Lesson Search & Archive */}
            <div className="bg-white dark:bg-[#0a0d14] border border-zinc-200 dark:border-zinc-800/80 rounded-xl overflow-hidden shadow-sm transition-colors duration-200">
              <div className="p-5 border-b border-zinc-200 dark:border-zinc-800/50 sm:flex items-center justify-between gap-4 bg-zinc-50 dark:bg-[#0d111a]/40 transition-colors">
                <h3 className="font-semibold text-sm text-zinc-900 dark:text-white">Lesson History</h3>
                <div className="relative max-w-xs w-full">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
                  <input
                    type="text" 
                    placeholder="Filter by concept (e.g. syllogisms)..." 
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
                    {filteredHistory.map((history) => (
                      <tr key={history.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/20 align-top transition-colors">
                        <td className="p-4 font-mono text-zinc-400 dark:text-zinc-500">{history.classCode}</td>
                        <td className="p-4">
                          <Link href={`/materials?search=${encodeURIComponent(history.content)}`} className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium block">
                            {history.content}
                          </Link>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {history.tags.map(tag => (
                              <span key={tag} className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-4 text-zinc-500 dark:text-zinc-400">{history.week}</td>
                        <td className="p-4 text-amber-600 dark:text-amber-400 font-medium">{history.hw}</td>
                        <td className="p-4 max-w-xs">
                          {history.comments === 'N/A' ? (
                            <span className="text-zinc-400 dark:text-zinc-600">N/A</span>
                          ) : (
                            <div>
                              <p className={`text-zinc-600 dark:text-zinc-400 ${expandedComments[history.id] ? '' : 'line-clamp-2'}`}>
                                {history.comments}
                              </p>
                              {history.comments.length > 60 && (
                                <button 
                                  onClick={() => setExpandedComments(p => ({...p, [history.id]: !p[history.id]}))} 
                                  className="mt-1 text-indigo-600 dark:text-indigo-400 font-semibold inline-flex items-center gap-1 hover:underline"
                                >
                                  {expandedComments[history.id] ? (
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
          {/* Right Sidebar Utility Stream Column */}
          <div className="space-y-6">
            
            {/* Exam Countdown */}
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
                  onChange={(e) => setExamDate(e.target.value)} 
                  className="bg-zinc-50 dark:bg-[#0d111a] border border-zinc-200 dark:border-zinc-800 rounded px-2 py-1 text-xs font-mono text-zinc-800 dark:text-zinc-300 focus:outline-none focus:border-indigo-500 transition-colors" 
                />
              </div>
            </div>

            {/* Notifications panel - Blank Canvas for Admin Posts */}
            <div className="bg-white dark:bg-[#0a0d14] border border-zinc-200 dark:border-zinc-800/80 rounded-xl p-5 shadow-sm transition-colors duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800/50 mb-3">
                <h4 className="font-semibold text-xs text-zinc-800 dark:text-white uppercase flex items-center gap-2">
                  <Bell className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" /> Notifications
                </h4>
                <span className="text-[10px] font-bold px-1.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 font-mono">0</span>
              </div>
              <div className="flex flex-col items-center justify-center p-6 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-[#0d111a]/20">
                <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">No announcements posted</p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-600 mt-1">Real-time alerts will stream when pushed from admin hub.</p>
              </div>
            </div>

            {/* Ask Ubbie Card Promotion */}
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
