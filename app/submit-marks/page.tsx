'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Sidebar } from '@/components/layout/sidebar'
import { Navbar } from '@/components/layout/navbar'
import { Trash2 } from 'lucide-react'

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

export default function SubmitMarksPage() {
  const [fullName, setFullName] = useState('')
  const [userId, setUserId] = useState('')
  const [scores, setScores] = useState<MockScore[]>([])
  const [pageLoading, setPageLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const [mockLabel, setMockLabel] = useState('')
  const [mockDate, setMockDate] = useState('')
  const [vrScore, setVrScore] = useState('')
  const [dmScore, setDmScore] = useState('')
  const [qrScore, setQrScore] = useState('')
  const [sjtScore, setSjtScore] = useState('')

  const loadScores = async () => {
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
    setUserId(user.id)

    const { data } = await supabase
      .from('mock_scores')
      .select('*')
      .order('mock_date', { ascending: true })

    setScores(data || [])
    setPageLoading(false)
  }

  useEffect(() => {
    loadScores()
  }, [])

  const resetForm = () => {
    setMockLabel('')
    setMockDate('')
    setVrScore('')
    setDmScore('')
    setQrScore('')
    setSjtScore('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')

    const vr = parseInt(vrScore)
    const dm = parseInt(dmScore)
    const qr = parseInt(qrScore)

    if (!mockLabel.trim() || !mockDate) {
      setMessage('Mock name and date are required.')
      return
    }

    if ([vr, dm, qr].some((s) => isNaN(s) || s < 300 || s > 900)) {
      setMessage('VR, DM, and QR scores must each be between 300 and 900.')
      return
    }

    if (sjtScore && (parseInt(sjtScore) < 300 || parseInt(sjtScore) > 900)) {
      setMessage('SJT score must be between 300 and 900.')
      return
    }

    setSaving(true)

    const { error } = await supabase.from('mock_scores').insert({
      student_id: userId,
      mock_label: mockLabel,
      mock_date: mockDate,
      vr_score: vr,
      dm_score: dm,
      qr_score: qr,
      sjt_score: sjtScore ? parseInt(sjtScore) : null,
    })

    if (error) {
      setMessage(`Failed to save: ${error.message}`)
      setSaving(false)
      return
    }

    setMessage('Mock scores saved!')
    resetForm()
    setSaving(false)
    loadScores()
  }

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('mock_scores').delete().eq('id', id)
    if (error) {
      setMessage(`Delete failed: ${error.message}`)
      return
    }
    loadScores()
  }

  if (pageLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-[#030408]">
        <p className="text-zinc-500 dark:text-zinc-400 animate-pulse text-sm">Loading Workspace...</p>
      </div>
    )
  }

  const inputBaseClasses =
    'rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0d111a] px-3 py-2 text-sm text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors'

  const numberInputClasses =
    inputBaseClasses +
    ' [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'

  return (
    <div className="min-h-screen flex bg-zinc-50 dark:bg-[#030408] text-zinc-900 dark:text-zinc-100 font-sans transition-colors duration-200">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar fullName={fullName} />

        <main className="flex-1 p-8 max-w-3xl mx-auto w-full">
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-white mb-1">Submit Mock Marks</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">
            Log your results after each mock exam. These feed directly into your Analytics page.
          </p>

          <form
            onSubmit={handleSubmit}
            className="bg-white dark:bg-[#0a0d14] border border-zinc-200 dark:border-zinc-800/80 rounded-xl p-6 shadow-sm mb-8 flex flex-col gap-4 transition-colors duration-200"
          >
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Mock name (e.g. Medify Mock 3)"
                value={mockLabel}
                onChange={(e) => setMockLabel(e.target.value)}
                required
                className={`flex-1 ${inputBaseClasses}`}
              />
              <input
                type="date"
                value={mockDate}
                onChange={(e) => setMockDate(e.target.value)}
                required
                className={inputBaseClasses}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'VR', value: vrScore, setter: setVrScore, required: true },
                { label: 'DM', value: dmScore, setter: setDmScore, required: true },
                { label: 'QR', value: qrScore, setter: setQrScore, required: true },
                { label: 'SJT', value: sjtScore, setter: setSjtScore, required: false },
              ].map((field) => (
                <div key={field.label} className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider whitespace-nowrap">
                    {field.label} {field.required ? '(300-900)' : '(optional)'}
                  </label>
                  <input
                    type="number"
                    min={300}
                    max={900}
                    value={field.value}
                    onChange={(e) => field.setter(e.target.value)}
                    required={field.required}
                    className={numberInputClasses}
                  />
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={saving}
              className="self-start rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 text-sm font-medium shadow-md shadow-indigo-600/10 transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Submit mock'}
            </button>

            {message && <p className="text-xs text-zinc-500 dark:text-zinc-400">{message}</p>}
          </form>

          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3">
            Past submissions ({scores.length})
          </h2>

          <div className="bg-white dark:bg-[#0a0d14] border border-zinc-200 dark:border-zinc-800/80 rounded-xl overflow-hidden shadow-sm transition-colors duration-200">
            {scores.length === 0 ? (
              <p className="text-xs text-zinc-400 dark:text-zinc-500 p-6 text-center">No mocks submitted yet.</p>
            ) : (
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800/30">
                {[...scores].reverse().map((s) => (
                  <div key={s.id} className="flex items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{s.mock_label}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                        {s.mock_date} · VR {s.vr_score} · DM {s.dm_score} · QR {s.qr_score}
                        {s.sjt_score ? ` · SJT ${s.sjt_score}` : ''} · Total {s.vr_score + s.dm_score + s.qr_score}/2700
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
