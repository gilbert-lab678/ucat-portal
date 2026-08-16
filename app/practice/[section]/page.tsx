'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const SECTION_LABELS: Record<string, string> = {
  verbal_reasoning: 'Verbal Reasoning',
  decision_making: 'Decision Making',
  quantitative_reasoning: 'Quantitative Reasoning',
  situational_judgement: 'Situational Judgement',
}

type AnswerOption = {
  id: string
  option_text: string
  is_correct: boolean
  order_index: number
}

type SyllogismStatement = {
  id: string
  statement_text: string
  correct_answer: 'true' | 'false' | 'cant_tell'
  order_index: number
}

type Passage = {
  title: string | null
  passage_text: string
  image_url: string | null
}

type QuestionData = {
  id: string
  question_text: string
  question_type: string
  image_url: string | null
  explanation: string | null
  passages: Passage | null
  answer_options: AnswerOption[]
  syllogism_statements: SyllogismStatement[]
}

export default function PracticeSectionPage() {
  const params = useParams()
  const section = params.section as string
  const router = useRouter()
  const supabase = createClient()

  const [questions, setQuestions] = useState<QuestionData[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState('')

  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [statementAnswers, setStatementAnswers] = useState<Record<string, 'true' | 'false' | 'cant_tell'>>({})
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const load = async () => {
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

      setUserId(user.id)

          const { data, error } = await supabase
        .from('questions')
        .select('*, passages(title, passage_text, image_url), answer_options(*), syllogism_statements(*)')
        .eq('section', section)
        .eq('category', 'practice')
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Practice query error:', error.message, error.details, error.hint, error.code)
      }

      if (!error && data) {
        const sorted = data.map((q: any) => ({
          ...q,
          answer_options: (q.answer_options || []).sort((a: AnswerOption, b: AnswerOption) => a.order_index - b.order_index),
          syllogism_statements: (q.syllogism_statements || []).sort((a: SyllogismStatement, b: SyllogismStatement) => a.order_index - b.order_index),
        }))
        setQuestions(sorted)
      }

      setLoading(false)
    }

    load()
  }, [section])

  const current = questions[currentIndex]

  const resetForNextQuestion = () => {
    setSelectedOption(null)
    setStatementAnswers({})
    setSubmitted(false)
  }

  const goNext = () => {
    resetForNextQuestion()
    setCurrentIndex((i) => i + 1)
  }

  const goPrev = () => {
    resetForNextQuestion()
    setCurrentIndex((i) => i - 1)
  }

  const isSingleChoiceCorrect = () => {
    const correctOption = current.answer_options.find((o) => o.is_correct)
    return selectedOption === correctOption?.id
  }

  const isSyllogismFullyCorrect = () => {
    return current.syllogism_statements.every(
      (s) => statementAnswers[s.id] === s.correct_answer
    )
  }

  const handleSubmit = async () => {
    if (!current) return

    let correct = false

    if (current.question_type === 'single_choice') {
      if (!selectedOption) return
      correct = isSingleChoiceCorrect()
    } else {
      const allAnswered = current.syllogism_statements.every((s) => statementAnswers[s.id])
      if (!allAnswered) return
      correct = isSyllogismFullyCorrect()
    }

    setSubmitted(true)

    await supabase.from('question_attempts').insert({
      student_id: userId,
      question_id: current.id,
      is_correct: correct,
    })
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center flex-col gap-3">
        <p>No practice questions in this section yet.</p>
        <a href="/practice" className="text-sm underline">Back to sections</a>
      </div>
    )
  }

  if (currentIndex >= questions.length) {
    return (
      <div className="flex min-h-screen items-center justify-center flex-col gap-3">
        <p className="text-xl font-medium">You've finished this set!</p>
        <div className="flex gap-4 text-sm">
          <button onClick={() => { setCurrentIndex(0); resetForNextQuestion() }} className="underline">
            Go through again
          </button>
          <a href="/practice" className="underline">Back to sections</a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <a href="/practice" className="text-sm underline">← Sections</a>
          <p className="text-sm text-zinc-500">
            {SECTION_LABELS[section]} · Question {currentIndex + 1} of {questions.length}
          </p>
        </div>

        {current.passages && (
          <div className="mb-4 rounded border border-zinc-200 dark:border-zinc-700 p-4 bg-white dark:bg-zinc-800">
            {current.passages.title && (
              <p className="font-medium mb-2">{current.passages.title}</p>
            )}
            <p className="text-sm whitespace-pre-wrap">{current.passages.passage_text}</p>
            {current.passages.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={current.passages.image_url} alt="Passage diagram" className="mt-3 max-w-full rounded" />
            )}
          </div>
        )}

        <div className="rounded border border-zinc-200 dark:border-zinc-700 p-6 bg-white dark:bg-zinc-800">
          <p className="mb-4">{current.question_text}</p>

          {current.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={current.image_url} alt="Question diagram" className="mb-4 max-w-full rounded" />
          )}

          {current.question_type === 'single_choice' ? (
            <div className="flex flex-col gap-2">
              {current.answer_options.map((opt) => {
                const isSelected = selectedOption === opt.id
                let stateClasses = 'border-zinc-300 dark:border-zinc-600'

                if (submitted) {
                  if (opt.is_correct) {
                    stateClasses = 'border-green-500 bg-green-50 dark:bg-green-900/30'
                  } else if (isSelected && !opt.is_correct) {
                    stateClasses = 'border-red-500 bg-red-50 dark:bg-red-900/30'
                  }
                } else if (isSelected) {
                  stateClasses = 'border-black dark:border-white'
                }

                return (
                  <button
                    key={opt.id}
                    onClick={() => !submitted && setSelectedOption(opt.id)}
                    disabled={submitted}
                    className={`text-left rounded border px-4 py-3 ${stateClasses}`}
                  >
                    {opt.option_text}
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {current.syllogism_statements.map((stmt) => {
                const userAnswer = statementAnswers[stmt.id]
                return (
                  <div key={stmt.id} className="rounded border border-zinc-200 dark:border-zinc-700 p-3">
                    <p className="text-sm mb-2">{stmt.statement_text}</p>
                    <div className="flex gap-2">
                      {(['true', 'false', 'cant_tell'] as const).map((val) => {
                        const isSelected = userAnswer === val
                        let stateClasses = 'border-zinc-300 dark:border-zinc-600'

                        if (submitted) {
                          if (val === stmt.correct_answer) {
                            stateClasses = 'border-green-500 bg-green-50 dark:bg-green-900/30'
                          } else if (isSelected && val !== stmt.correct_answer) {
                            stateClasses = 'border-red-500 bg-red-50 dark:bg-red-900/30'
                          }
                        } else if (isSelected) {
                          stateClasses = 'border-black dark:border-white'
                        }

                        return (
                          <button
                            key={val}
                            onClick={() =>
                              !submitted &&
                              setStatementAnswers((prev) => ({ ...prev, [stmt.id]: val }))
                            }
                            disabled={submitted}
                            className={`rounded border px-3 py-1.5 text-sm capitalize ${stateClasses}`}
                          >
                            {val === 'cant_tell' ? "Can't tell" : val}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {!submitted ? (
            <button
              onClick={handleSubmit}
              className="mt-5 rounded bg-black dark:bg-white text-white dark:text-black px-4 py-2 text-sm font-medium"
            >
              Submit answer
            </button>
          ) : (
            <div className="mt-5">
              <p className={`font-medium mb-2 ${
                current.question_type === 'single_choice'
                  ? isSingleChoiceCorrect() ? 'text-green-600' : 'text-red-600'
                  : isSyllogismFullyCorrect() ? 'text-green-600' : 'text-red-600'
              }`}>
                {(current.question_type === 'single_choice' ? isSingleChoiceCorrect() : isSyllogismFullyCorrect())
                  ? 'Correct!'
                  : 'Not quite.'}
              </p>

              {current.explanation && (
                <div className="rounded bg-zinc-100 dark:bg-zinc-700 p-3 text-sm mb-4">
                  <p className="font-medium mb-1">Explanation</p>
                  <p className="whitespace-pre-wrap">{current.explanation}</p>
                </div>
              )}

              <div className="flex gap-3">
                {currentIndex > 0 && (
                  <button onClick={goPrev} className="text-sm underline">
                    ← Previous
                  </button>
                )}
                <button
                  onClick={goNext}
                  className="rounded bg-black dark:bg-white text-white dark:text-black px-4 py-2 text-sm font-medium"
                >
                  Next question →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
