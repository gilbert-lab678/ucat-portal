'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Sidebar } from '@/components/layout/sidebar'
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

const AGGREGATE: ChartConfig = { key: 'aggregate', label: 'Aggregate (VR + DM + QR)', color: '#4f46e5', min: 900, max: 2700 }

type TimeRange = 'all' | 'month' | 'twoWeeks'

const TIME_RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: 'all', label: 'All mocks' },
  { value: 'month', label: 'Past month' },
  { value: 'twoWeeks', label: 'Past 2 weeks' },
]

function formatDateShort(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
}

function formatDateFull(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
}

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

export default function AnalyticsPage() {
  const [fullName, setFullName] = useState('')
  const [scores, setScores] = useState<MockScore[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<TimeRange>('all')
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
        .select('full_name, status')
        .eq('id', user.id)
        .single()

      if (!profile || profile.status !== 'approved') {
        router.push('/login')
        return
      }

      setFullName(profile.full_name)

      const { data } = await supabase
        .from('mock_scores')
        .select('*')
        .order('mock_date', { ascending: true })

      // Sort again on the client as a safety net so chart order is always
      // truly chronological, regardless of how the database returned rows.
      const sorted = (data || []).slice().sort(
        (a, b) => new Date(a.mock_date).getTime() - new Date(b.mock_date).getTime()
      )

      setScores(sorted)
      setLoading(false)
    }

    load()
  }, [router])

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

  const buildData = (key: ChartConfig['key']) => {
    return filteredScores
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
  }

  const getStat = (config: ChartConfig) => {
    const data = buildData(config.key)
    if (data.length === 0) return { latest: null, delta: null, accuracy: null }

    const latest = data[data.length - 1].value as number
    const prev = data.length > 1 ? (data[data.length - 2].value as number) : null
    const delta = prev !== null ? latest - prev : null
    const accuracy = Math.round((latest / config.max) * 100)

    return { latest, delta, accuracy }
  }

  const renderChart = (config: ChartConfig, height = 220) => {
    const data = buildData(config.key)
    const stat = getStat(config)
    const gradientId = `glow-${config.key}`

    return (
      <div
        key={config.key}
        className="bg-white dark:bg-[#0a0d14] border border-zinc-200 dark:border-zinc-800/80 rounded-xl p-5 shadow-sm transition-colors duration-200"
      >
        <div className="flex items-baseline justify-between mb-1">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">{config.label}</h3>
          {stat.latest !== null && (
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-zinc-900 dark:text-white">
                {stat.latest} / {config.max}
              </span>
              {stat.delta !== null && (
                <span
                  className={`text-xs font-mono px-2 py-0.5 rounded border ${
                    stat.delta > 0
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/10'
                      : stat.delta < 0
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/10'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-transparent'
                  }`}
                >
                  {stat.delta > 0 ? '+' : ''}{stat.delta} vs last
                </span>
              )}
            </div>
          )}
        </div>

        {stat.accuracy !== null && (
          <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1 rounded-full mb-4 overflow-hidden">
            <div
              className="h-full"
              style={{ width: `${stat.accuracy}%`, backgroundColor: config.color }}
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

  return (
    <div className="min-h-screen flex bg-zinc-50 dark:bg-[#030408] text-zinc-900 dark:text-zinc-100 font-sans transition-colors duration-200">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar fullName={fullName} />

        <main className="flex-1 p-8 max-w-5xl mx-auto w-full">
          <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
            <div>
              <h1 className="text-lg font-semibold text-zinc-900 dark:text-white mb-1">Analytics</h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Progress across mock exams, based on marks you've submitted.
              </p>
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {CHARTS.map((c) => renderChart(c))}
          </div>

          <div className="mt-2">
            {renderChart(AGGREGATE, 260)}
          </div>

          <div className="mt-6 text-xs text-zinc-400 dark:text-zinc-500">
            <a href="/submit-marks" className="text-indigo-600 dark:text-indigo-400 hover:underline">
              + Submit a new mock
            </a>
          </div>
        </main>
      </div>
    </div>
  )
}
