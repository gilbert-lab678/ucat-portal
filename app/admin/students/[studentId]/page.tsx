'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { AdminSidebar } from '@/components/layout/admin-sidebar'
import { Navbar } from '@/components/layout/navbar'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { BarChart3, Table2, MessageSquare } from 'lucide-react'

export const dynamic = 'force-dynamic'

type MockScore = {
  id: string
  mock_label: string
  mock_date: string
  vr_score: number
  dm_score: number
  qr_score: number
  sjt_score: number | null
}

type ChartConfig = {
  key: 'vr' | 'dm' | 'qr' | 'sjt' | 'aggregate'
  label: string
  color: string
  min: number
  max: number
}

const CHARTS: ChartConfig[] = [
  { key: 'vr', label: 'Verbal Reasoning', color: '#6366f1', min: 300, max: 900 },
  { key: 'dm', label: 'Decision Making', color: '#a855f7', min: 300, max: 900 },
  { key: 'qr', label: 'Quantitative Reasoning', color: '#10b981', min: 300, max: 900 },
  { key: 'sjt', label: 'Situational Judgement', color: '#f59e0b', min: 300, max: 900 },
]

const AGGREGATE: ChartConfig = {
  key: 'aggregate',
  label: 'Aggregate (VR + DM + QR)',
  color: '#4f46e5',
  min: 900,
  max: 2700,
}

type TimeRange = 'all' | 'month' | 'twoWeeks'

const TIME_RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: 'all', label: 'All mocks' },
  { value: 'month', label: 'Past month' },
  { value: 'twoWeeks', label: 'Past 2 weeks' },
]

const formatDateShort = (d: string) =>
  new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })

const formatDateFull = (d: string) =>
  new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || payload.length === 0) return null
  const point = payload[0].payload

  return (
    <div className="bg-[#0d111a] border border-zinc-700 rounded-lg px-3 py-2 text-xs">
      <p className="text-zinc-400 mb-1">{formatDateFull(point.rawDate)}</p>
      <p className="font-medium" style={{ color: payload[0].color }}>
        value: {point.value}
      </p>
    </div>
  )
}

export default function AdminStudentDetailPage() {
  const params = useParams()
  const studentId = params.studentId as string
  const router = useRouter()
  const supabase = createClient()

  const [fullName, setFullName] = useState('')
  const [student, setStudent] = useState<{ full_name: string; year_group: string | null } | null>(null)
  const [scores, setScores] = useState<MockScore[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'graph' | 'table'>('graph')
  const [timeRange, setTimeRange] = useState<TimeRange>('all')

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

      const { data: studentProfile } = await supabase
        .from('profiles')
        .select('full_name, year_group')
        .eq('id', studentId)
        .single()

      setStudent(studentProfile)

      const { data } = await supabase
        .from('mock_scores')
        .select('*')
        .eq('student_id', studentId)

      const sorted = (data || []).slice().sort(
        (a, b) => new Date(a.mock_date).getTime() - new Date(b.mock_date).getTime()
      )

      setScores(sorted)
      setLoading(false)
    }

    load()
  }, [studentId])

  const filteredScores = useMemo(() => {
    if (timeRange === 'all') return scores

    const cutoff = new Date()
    if (timeRange === 'month') cutoff.setMonth(cutoff.getMonth() - 1)
    if (timeRange === 'twoWeeks') cutoff.setDate(cutoff.getDate() - 14)

    return scores.filter((s) => new Date(s.mock_date) >= cutoff)
  }, [scores, timeRange])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-[#030408]">
        <p className="text-zinc-500 dark:text-zinc-400 animate-pulse text-sm">Loading Workspace...</p>
      </div>
    )
  }

  const buildData = (key: ChartConfig['key']) =>
    filteredScores
      .filter((s) => key !== 'sjt' || s.sjt_score !== null)
      .map((s) => ({
        date: formatDateShort(s.mock_date),
        rawDate: s.mock_date,
        value:
          key === 'vr' ? s.vr_score :
          key === 'dm' ? s.dm_score :
          key === 'qr' ? s.qr_score :
          key === 'sjt' ? s.sjt_score :
          s.vr_score + s.dm_score + s.qr_score,
      }))

  const renderChart = (config: ChartConfig, height = 220) => {
    const data = buildData(config.key)
    const latest = data.length ? (data[data.length - 1].value as number) : null
    const prev = data.length > 1 ? (data[data.length - 2].value as number) : null
    const delta = latest !== null && prev !== null ? latest - prev : null
    const gradientId = `glow-${config.key}`

    return (
      <div
        key={config.key}
        className="bg-white dark:bg-[#0a0d14] border border-zinc-200 dark:border-zinc-800/80 rounded-xl p-5 shadow-sm"
      >
        <div className="flex items-baseline justify-between mb-1">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">{config.label}</h3>
          {latest !== null && (
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-zinc-900 dark:text-white">
                {latest} / {config.max}
              </span>
              {delta !== null && (
                <span
                  className={`text-xs font-mono px-2 py-0.5 rounded border ${
                    delta > 0
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/10'
                      : delta < 0
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/10'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-transparent'
                  }`}
                >
                  {delta > 0 ? '+' : ''}{delta} vs last
                </span>
              )}
            </div>
          )}
        </div>

        {latest !== null && (
          <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1 rounded-full mb-4 overflow-hidden">
            <div
              className="h-full"
              style={{ width: `${Math.round((latest / config.max) * 100)}%`, backgroundColor: config.color }}
            />
          </div>
        )}

        {data.length === 0 ? (
          <div className="flex items-center justify-center h-[180px] text-xs text-zinc-400 dark:text-zinc-500 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl mt-2">
            No mocks in this range
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={config.color} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={config.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-800" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#71717a' }} />
              <YAxis domain={[config.min, config.max]} tick={{ fontSize: 11, fill: '#71717a' }} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke={config.color}
                strokeWidth={2.5}
                fill={`url(#${gradientId})`}
                dot={{ r: 3, fill: config.color, strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    )
  }

  const tableRows = filteredScores.slice().reverse() // newest first
  const toggleClass = (active: boolean) =>
    `flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
      active
        ? 'bg-indigo-600 text-white'
        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
    }`

  return (
    <div className="min-h-screen flex bg-zinc-50 dark:bg-[#030408] text-zinc-900 dark:text-zinc-100 font-sans transition-colors duration-200">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar fullName={fullName} title={student?.full_name || 'Student'} />

        <main className="flex-1 p-8 max-w-5xl mx-auto w-full">
          <button
            onClick={() => router.push('/admin/students')}
            className="text-xs text-zinc-500 hover:text-indigo-500 mb-4"
          >
            ← Students
          </button>

          <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
            <div>
              <h1 className="text-lg font-semibold text-zinc-900 dark:text-white mb-1">
                {student?.full_name}
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {student?.year_group || 'No year group'} · {scores.length} mock{scores.length === 1 ? '' : 's'} submitted
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0d111a] p-1">
                <button onClick={() => setView('graph')} className={toggleClass(view === 'graph')}>
                  <BarChart3 className="h-3.5 w-3.5" /> Graph
                </button>
                <button onClick={() => setView('table')} className={toggleClass(view === 'table')}>
                  <Table2 className="h-3.5 w-3.5" /> Table
                </button>
              </div>

              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as TimeRange)}
                className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0d111a] px-3 py-2 text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-indigo-500 transition-colors"
              >
                {TIME_RANGE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>

              <button
                onClick={() => router.push(`/admin/tutor/${studentId}`)}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0d111a] px-3 py-2 text-sm text-zinc-800 dark:text-zinc-200 hover:border-indigo-400 transition-colors"
              >
                <MessageSquare className="h-3.5 w-3.5" /> Message
              </button>
            </div>
          </div>

          {scores.length === 0 ? (
            <div className="bg-white dark:bg-[#0a0d14] border border-zinc-200 dark:border-zinc-800/80 rounded-xl p-10 text-center shadow-sm">
              <p className="text-sm text-zinc-400 dark:text-zinc-500">
                {student?.full_name} hasn't submitted any mock scores yet.
              </p>
            </div>
          ) : view === 'graph' ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {CHARTS.map((c) => renderChart(c))}
              </div>
              {renderChart(AGGREGATE, 260)}
            </>
          ) : (
            <div className="bg-white dark:bg-[#0a0d14] border border-zinc-200 dark:border-zinc-800/80 rounded-xl shadow-sm overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800/50 bg-zinc-50 dark:bg-[#0d111a]/40">
                    <th className="px-5 py-3 font-medium">Mock</th>
                    <th className="px-3 py-3 font-medium">Date</th>
                    <th className="px-3 py-3 font-medium text-right">VR</th>
                    <th className="px-3 py-3 font-medium text-right">DM</th>
                    <th className="px-3 py-3 font-medium text-right">QR</th>
                    <th className="px-3 py-3 font-medium text-right">SJT</th>
                    <th className="px-5 py-3 font-medium text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-5 py-8 text-center text-xs text-zinc-400 dark:text-zinc-500">
                        No mocks in this range
                      </td>
                    </tr>
                  )}
                  {tableRows.map((s) => (
                    <tr key={s.id} className="border-b last:border-0 border-zinc-100 dark:border-zinc-800/40">
                      <td className="px-5 py-3 font-medium text-zinc-900 dark:text-white">{s.mock_label}</td>
                      <td className="px-3 py-3 text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                        {formatDateFull(s.mock_date)}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums">{s.vr_score}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{s.dm_score}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{s.qr_score}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{s.sjt_score ?? '–'}</td>
                      <td className="px-5 py-3 text-right tabular-nums font-semibold text-zinc-900 dark:text-white">
                        {s.vr_score + s.dm_score + s.qr_score}/2700
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
