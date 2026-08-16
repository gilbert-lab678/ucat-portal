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

const IMAGE_SECTIONS = ['quantitative_reasoning', 'decision_making']

type Passage = {
  id: string
  title: string
}

type Question = {
  id: string
  question_text: string
  section: string
  term: string | null
  subject: string | null
  category: string
  passage_id: string | null
  question_type: string
  image_url: string | null
  created_at: string
}

type OptionDraft = {
  text: string
  isCorrect: boolean
}

type StatementDraft = {
  text: string
  correctAnswer: 'true' | 'false' | 'cant_tell'
}

export default function AdminQuestionsPage() {
  const [passages, setPassages] = useState<Passage[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [pageLoading, setPageLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const [passageMode, setPassageMode] = useState<'none' | 'existing' | 'new'>('none')
  const [existingPassageId, setExistingPassageId] = useState('')
  const [newPassageTitle, setNewPassageTitle] = useState('')
  const [newPassageText, setNewPassageText] = useState('')

  const [questionText, setQuestionText] = useState('')
  const [section, setSection] = useState('verbal_reasoning')
  const [term, setTerm] = useState('')
  const [subject, setSubject] = useState('')
  const [category, setCategory] = useState<'practice' | 'mock_only'>('practice')
  const [explanation, setExplanation] = useState('')
  const [questionType, setQuestionType] = useState<'single_choice' | 'syllogism'>('single_choice')
  const [imageFile, setImageFile] = useState<File | null>(null)

  const [options, setOptions] = useState<OptionDraft[]>([
    { text: '', isCorrect: true },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
  ])

  const [statements, setStatements] = useState<StatementDraft[]>([
    { text: '', correctAnswer: 'true' },
    { text: '', correctAnswer: 'false' },
  ])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { data: myProfile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!myProfile?.is_admin) {
      router.push('/login')
      return
    }

    const { data: passagesData } = await supabase
      .from('passages')
      .select('id, title')
      .order('created_at', { ascending: false })

    const { data: questionsData } = await supabase
      .from('questions')
      .select('*')
      .order('created_at', { ascending: false })

    setPassages(passagesData || [])
    setQuestions(questionsData || [])
    setPageLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const updateOptionText = (index: number, value: string) => {
    setOptions((prev) => prev.map((o, i) => (i === index ? { ...o, text: value } : o)))
  }

  const setCorrectOption = (index: number) => {
    setOptions((prev) => prev.map((o, i) => ({ ...o, isCorrect: i === index })))
  }

  const addOption = () => {
    setOptions((prev) => [...prev, { text: '', isCorrect: false }])
  }

  const removeOption = (index: number) => {
    setOptions((prev) => prev.filter((_, i) => i !== index))
  }

  const updateStatementText = (index: number, value: string) => {
    setStatements((prev) => prev.map((s, i) => (i === index ? { ...s, text: value } : s)))
  }

  const updateStatementAnswer = (index: number, value: 'true' | 'false' | 'cant_tell') => {
    setStatements((prev) => prev.map((s, i) => (i === index ? { ...s, correctAnswer: value } : s)))
  }

  const addStatement = () => {
    setStatements((prev) => [...prev, { text: '', correctAnswer: 'true' }])
  }

  const removeStatement = (index: number) => {
    setStatements((prev) => prev.filter((_, i) => i !== index))
  }

  const resetForm = () => {
    setQuestionText('')
    setTerm('')
    setSubject('')
    setExplanation('')
    setImageFile(null)
    setOptions([
      { text: '', isCorrect: true },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
    ])
    setStatements([
      { text: '', correctAnswer: 'true' },
      { text: '', correctAnswer: 'false' },
    ])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')

    if (!questionText.trim()) {
      setMessage('Question text is required.')
      return
    }

    if (questionType === 'single_choice') {
      const filledOptions = options.filter((o) => o.text.trim() !== '')
      if (filledOptions.length < 2) {
        setMessage('Add at least 2 answer options.')
        return
      }
      if (!filledOptions.some((o) => o.isCorrect)) {
        setMessage('Mark one option as correct.')
        return
      }
    } else {
      const filledStatements = statements.filter((s) => s.text.trim() !== '')
      if (filledStatements.length < 1) {
        setMessage('Add at least 1 statement.')
        return
      }
    }

    if (passageMode === 'new' && !newPassageText.trim()) {
      setMessage('Passage text is required when creating a new passage.')
      return
    }

    if (passageMode === 'existing' && !existingPassageId) {
      setMessage('Select an existing passage.')
      return
    }

    setSaving(true)

    let passageId: string | null = null

    if (passageMode === 'new') {
      const { data: passageData, error: passageError } = await supabase
        .from('passages')
        .insert({
          title: newPassageTitle || null,
          passage_text: newPassageText,
          section,
        })
        .select()
        .single()

      if (passageError) {
        setMessage(`Failed to save passage: ${passageError.message}`)
        setSaving(false)
        return
      }

      passageId = passageData.id
    } else if (passageMode === 'existing') {
      passageId = existingPassageId
    }

    let imageUrl: string | null = null

    if (imageFile) {
      const filePath = `${Date.now()}-${imageFile.name}`
      const { error: uploadError } = await supabase.storage
        .from('question-images')
        .upload(filePath, imageFile)

      if (uploadError) {
        setMessage(`Image upload failed: ${uploadError.message}`)
        setSaving(false)
        return
      }

      const { data: publicUrlData } = supabase.storage
        .from('question-images')
        .getPublicUrl(filePath)

      imageUrl = publicUrlData.publicUrl
    }

    const { data: questionData, error: questionError } = await supabase
      .from('questions')
      .insert({
        passage_id: passageId,
        question_text: questionText,
        section,
        term: term || null,
        subject: subject || null,
        category,
        explanation: explanation || null,
        question_type: questionType,
        image_url: imageUrl,
      })
      .select()
      .single()

    if (questionError) {
      setMessage(`Failed to save question: ${questionError.message}`)
      setSaving(false)
      return
    }

    if (questionType === 'single_choice') {
      const filledOptions = options.filter((o) => o.text.trim() !== '')
      const optionRows = filledOptions.map((o, index) => ({
        question_id: questionData.id,
        option_text: o.text,
        is_correct: o.isCorrect,
        order_index: index,
      }))

      const { error: optionsError } = await supabase
        .from('answer_options')
        .insert(optionRows)

      if (optionsError) {
        setMessage(`Question saved, but options failed: ${optionsError.message}`)
        setSaving(false)
        return
      }
    } else {
      const filledStatements = statements.filter((s) => s.text.trim() !== '')
      const statementRows = filledStatements.map((s, index) => ({
        question_id: questionData.id,
        statement_text: s.text,
        correct_answer: s.correctAnswer,
        order_index: index,
      }))

      const { error: statementsError } = await supabase
        .from('syllogism_statements')
        .insert(statementRows)

      if (statementsError) {
        setMessage(`Question saved, but statements failed: ${statementsError.message}`)
        setSaving(false)
        return
      }
    }

    setMessage('Question added!')
    resetForm()
    setSaving(false)
    loadData()
  }

  const handleDeleteQuestion = async (id: string) => {
    const { error } = await supabase.from('questions').delete().eq('id', id)
    if (error) {
      setMessage(`Delete failed: ${error.message}`)
      return
    }
    loadData()
  }

  if (pageLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  const showImageUpload = IMAGE_SECTIONS.includes(section)

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6">Add Question</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 mb-10 rounded border border-zinc-200 dark:border-zinc-700 p-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Section</label>
              <select
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="rounded border border-zinc-300 dark:border-zinc-600 px-3 py-2 bg-transparent"
              >
                {SECTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Question type</label>
              <select
                value={questionType}
                onChange={(e) => setQuestionType(e.target.value as 'single_choice' | 'syllogism')}
                className="rounded border border-zinc-300 dark:border-zinc-600 px-3 py-2 bg-transparent"
              >
                <option value="single_choice">Single choice</option>
                <option value="syllogism">Syllogism (True/False/Can't tell statements)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as 'practice' | 'mock_only')}
                className="rounded border border-zinc-300 dark:border-zinc-600 px-3 py-2 bg-transparent"
              >
                <option value="practice">Practice bank</option>
                <option value="mock_only">Mock only</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Term (optional)</label>
              <input
                type="text"
                placeholder="e.g. Term 1"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                className="rounded border border-zinc-300 dark:border-zinc-600 px-3 py-2 bg-transparent"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Subject (optional)</label>
              <input
                type="text"
                placeholder="e.g. Syllogisms"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="rounded border border-zinc-300 dark:border-zinc-600 px-3 py-2 bg-transparent"
              />
            </div>
          </div>

          {showImageUpload && (
            <div className="border-t border-zinc-200 dark:border-zinc-700 pt-4">
              <label className="text-sm font-medium block mb-2">
                Diagram / image (optional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="text-sm"
              />
              {imageFile && (
                <p className="text-xs text-zinc-500 mt-1">Selected: {imageFile.name}</p>
              )}
            </div>
          )}

          <div className="border-t border-zinc-200 dark:border-zinc-700 pt-4">
            <label className="text-sm font-medium block mb-2">Passage</label>
            <div className="flex gap-4 text-sm mb-3">
              <label className="flex items-center gap-2">
                <input type="radio" checked={passageMode === 'none'} onChange={() => setPassageMode('none')} />
                No passage
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" checked={passageMode === 'existing'} onChange={() => setPassageMode('existing')} />
                Use existing passage
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" checked={passageMode === 'new'} onChange={() => setPassageMode('new')} />
                Create new passage
              </label>
            </div>

            {passageMode === 'existing' && (
              <select
                value={existingPassageId}
                onChange={(e) => setExistingPassageId(e.target.value)}
                className="w-full rounded border border-zinc-300 dark:border-zinc-600 px-3 py-2 bg-transparent"
              >
                <option value="">Select a passage...</option>
                {passages.map((p) => (
                  <option key={p.id} value={p.id}>{p.title || 'Untitled passage'}</option>
                ))}
              </select>
            )}

            {passageMode === 'new' && (
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  placeholder="Passage title (optional)"
                  value={newPassageTitle}
                  onChange={(e) => setNewPassageTitle(e.target.value)}
                  className="rounded border border-zinc-300 dark:border-zinc-600 px-3 py-2 bg-transparent"
                />
                <textarea
                  placeholder="Passage text"
                  value={newPassageText}
                  onChange={(e) => setNewPassageText(e.target.value)}
                  rows={6}
                  className="rounded border border-zinc-300 dark:border-zinc-600 px-3 py-2 bg-transparent"
                />
              </div>
            )}
          </div>

          <div className="border-t border-zinc-200 dark:border-zinc-700 pt-4">
            <label className="text-sm font-medium block mb-2">Question text</label>
            <textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              rows={3}
              className="w-full rounded border border-zinc-300 dark:border-zinc-600 px-3 py-2 bg-transparent"
            />
          </div>

          {questionType === 'single_choice' ? (
            <div className="border-t border-zinc-200 dark:border-zinc-700 pt-4">
              <label className="text-sm font-medium block mb-2">Answer options (select the correct one)</label>
              <div className="flex flex-col gap-2">
                {options.map((opt, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={opt.isCorrect}
                      onChange={() => setCorrectOption(index)}
                    />
                    <input
                      type="text"
                      placeholder={`Option ${index + 1}`}
                      value={opt.text}
                      onChange={(e) => updateOptionText(index, e.target.value)}
                      className="flex-1 rounded border border-zinc-300 dark:border-zinc-600 px-3 py-2 bg-transparent"
                    />
                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(index)}
                        className="text-sm text-red-600"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addOption}
                className="text-sm underline text-blue-600 dark:text-blue-400 mt-2"
              >
                Add another option
              </button>
            </div>
          ) : (
            <div className="border-t border-zinc-200 dark:border-zinc-700 pt-4">
              <label className="text-sm font-medium block mb-2">
                Statements (each gets its own True / False / Can't tell answer)
              </label>
              <div className="flex flex-col gap-2">
                {statements.map((stmt, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={`Statement ${index + 1}`}
                      value={stmt.text}
                      onChange={(e) => updateStatementText(index, e.target.value)}
                      className="flex-1 rounded border border-zinc-300 dark:border-zinc-600 px-3 py-2 bg-transparent"
                    />
                    <select
                      value={stmt.correctAnswer}
                      onChange={(e) => updateStatementAnswer(index, e.target.value as 'true' | 'false' | 'cant_tell')}
                      className="rounded border border-zinc-300 dark:border-zinc-600 px-2 py-2 bg-transparent text-sm"
                    >
                      <option value="true">True</option>
                      <option value="false">False</option>
                      <option value="cant_tell">Can't tell</option>
                    </select>
                    {statements.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeStatement(index)}
                        className="text-sm text-red-600"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addStatement}
                className="text-sm underline text-blue-600 dark:text-blue-400 mt-2"
              >
                Add another statement
              </button>
            </div>
          )}

          <div className="border-t border-zinc-200 dark:border-zinc-700 pt-4">
            <label className="text-sm font-medium block mb-2">Explanation (shown after submission, optional)</label>
            <textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              rows={3}
              className="w-full rounded border border-zinc-300 dark:border-zinc-600 px-3 py-2 bg-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="rounded bg-black dark:bg-white text-white dark:text-black px-3 py-2 font-medium disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Add question'}
          </button>

          {message && <p className="text-sm text-zinc-600 dark:text-zinc-400">{message}</p>}
        </form>

        <h2 className="text-lg font-medium mb-3">Existing questions ({questions.length})</h2>
        <div className="flex flex-col gap-3">
          {questions.map((q) => (
            <div
              key={q.id}
              className="flex items-start justify-between gap-4 rounded border border-zinc-200 dark:border-zinc-700 p-4"
            >
              <div>
                <p className="font-medium">{q.question_text}</p>
                <p className="text-xs text-zinc-500 mt-1">
                  {q.section} · {q.question_type} · {q.category} {q.term ? `· ${q.term}` : ''} {q.subject ? `· ${q.subject}` : ''} {q.image_url ? '· has image' : ''}
                </p>
              </div>
              <button
                onClick={() => handleDeleteQuestion(q.id)}
                className="text-sm text-red-600 underline shrink-0"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
