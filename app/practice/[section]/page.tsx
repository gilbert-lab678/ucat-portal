'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import {
  DndContext,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  PointerSensor,
  DragEndEvent,
} from '@dnd-kit/core'

export const dynamic = 'force-dynamic'

const SECTION_LABELS: Record<string, string> = {
  verbal_reasoning: 'Verbal Reasoning',
  decision_making: 'Decision Making',
  quantitative_reasoning: 'Quantitative Reasoning',
  situational_judgement: 'Situational Judgement',
}

type AnswerValue = 'true' | 'false' | 'cant_tell'

const OPTION_VALUES: AnswerValue[] = ['true', 'false', 'cant_tell']
const OPTION_LABELS: Record<AnswerValue, string> = {
  true: 'True',
  false: 'False',
  cant_tell: "Can't Tell",
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
  correct_answer: AnswerValue
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
  term: string | null
  subject: string | null
  passages: Passage | null
  answer_options: AnswerOption[]
  syllogism_statements: SyllogismStatement[]
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function DraggableChip({ value, disabled }: { value: AnswerValue; disabled: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `chip-${value}`,
    data: { value },
    disabled,
  })

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 50 }
    : undefined

  return (
    <button
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      type="button"
      className={`rounded border-2 px-4 py-2 text-sm font-medium bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 touch-none select-none ${
        isDragging ? 'opacity-50' : ''
      } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}`}
    >
      {OPTION_LABELS[value]}
    </button>
  )
}

function DropTarget({
  statementId,
  currentValue,
  correctValue,
  submitted,
}: {
  statementId: string
  currentValue: AnswerValue | undefined
  correctValue: AnswerValue
  submitted: boolean
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `target-${statementId}` })

  let stateClasses = 'border-dashed border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900'

  if (submitted) {
    if (currentValue === correctValue) {
      stateClasses = 'border-solid border-green-500 bg-green-50 dark:bg-green-900/30'
    } else {
      stateClasses = 'border-solid border-red-500 bg-red-50 dark:bg-red-900/30'
    }
  } else if (currentValue) {
    stateClasses = 'border-solid border-black dark:border-white bg-white dark:bg-zinc-800'
  } else if (isOver) {
    stateClasses = 'border-dashed border-black dark:border-white bg-zinc-100 dark:bg-zinc-800'
  }

  return (
    <div
      ref={setNodeRef}
      className={`w-28 shrink-0 rounded border-2 px-3 py-2 text-sm font-medium text-center ${stateClasses}`}
    >
      {currentValue ? OPTION_LABELS[currentValue] : ''}
      {submitted && currentValue !== correctValue && (
        <p className="text-xs mt-1 font-normal">Correct: {OPTION_LABELS[correctValue]}</p>
      )}
    </div>
  )
}

export default function PracticeSectionPage() {
  const params = useParams()
  const section = params.section as string
  const router = useRouter()
  const supabase = createClient()

  const [userId, setUserId] = useState('')
  const [checkingAuth, setCheckingAuth] = useState(true)

  const [started, setStarted] = useState(false)
  const [settingUp, setSettingUp] = useState(false)
  const [term, setTerm] = useState('')
  const [subject, setSubject] = useState('')
  const [quantity, setQuantity] = useState(10)
  const [setupMessage, setSetupMessage] = useState('')

  const [questions, setQuestions] = useState<QuestionData[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [flaggedIds, setFlaggedIds] = useState<Set<string>>(new Set())

  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [statementAnswers, setStatementAnswers] = useState<Record<string, AnswerValue>>({})
  const [submitted, setSubmitted] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  )

  useEffect(() => {
    const checkAuth = async () => {
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

      const { data: flagsData } = await supabase
        .from('flagged_questions')
        .select('question_id')
        .eq('student_id', user.id)

      setFlaggedIds(new Set((flagsData || []).map((f) => f.question_id)))
      setCheckingAuth(false)
    }

    checkAuth()
  }, [section])

  const resetForNextQuestion = () => {
    setSelectedOption(null)
    setStatementAnswers({})
    setSubmitted(false)
  }

  const handleStart = async () => {
    setSettingUp(true)
    setSetupMessage('')

    let query = supabase
      .from('questions')
      .select('*, passages(title, passage_text, image_url), answer_options(*), syllogism_statements(*)')
      .eq('section', section)
      .eq('category', 'practice')

    if (term.trim()) query = query.eq('term', term.trim())
    if (subject.trim()) query = query.eq('subject', subject.trim())

    const { data: allQuestions, error } = await query

    if (error || !allQuestions || allQuestions.length === 0) {
      setSetupMessage('No questions match this filter yet.')
      setSettingUp(false)
      return
    }

    const questionIds = allQuestions.map((q: any) => q.id)

    const { data: attempts } = await supabase
      .from('question_attempts')
      .select('question_id, is_correct, created_at')
      .eq('student_id', userId)
      .in('question_id', questionIds)
      .order('created_at', { ascending: true })

    const latestAttemptByQuestion = new Map<string, boolean>()
    for (const a of attempts || []) {
      latestAttemptByQuestion.set(a.question_id, a.is_correct)
    }

    const unattempted = allQuestions.filter((q: any) => !latestAttemptByQuestion.has(q.id))
    const attemptedWrong = allQuestions.filter((q: any) => latestAttemptByQuestion.get(q.id) === false)
    const attemptedRight = allQuestions.filter((q: any) => latestAttemptByQuestion.get(q.id) === true)

    const shuffledUnattempted = shuffle(unattempted)
    const shuffledWrong = shuffle(attemptedWrong)
    const shuffledRight = shuffle(attemptedRight)

    const freshCount = Math.min(shuffledUnattempted.length, quantity)
    const chosen = shuffledUnattempted.slice(0, freshCount)

    let remaining = quantity - chosen.length
    if (remaining > 0) {
      const fromWrong = shuffledWrong.slice(0, remaining)
      chosen.push(...fromWrong)
      remaining -= fromWrong.length
    }
    if (remaining > 0) {
      const fromRight = shuffledRight.slice(0, remaining)
      chosen.push(...fromRight)
      remaining -= fromRight.length
    }

    if (chosen.length === 0) {
      setSetupMessage('No questions match this filter yet.')
      setSettingUp(false)
      return
    }

    if (freshCount < quantity) {
      const reviewCount = chosen.length - freshCount
      if (freshCount === 0) {
        setSetupMessage(
          `You've completed all questions in this set! Showing ${reviewCount} review question${reviewCount === 1 ? '' : 's'}, prioritizing ones you got wrong before.`
        )
      } else {
        setSetupMessage(
          `Only ${freshCount} new question${freshCount === 1 ? '' : 's'} left in this set. Adding ${reviewCount} review question${reviewCount === 1 ? '' : 's'} to reach ${chosen.length}, prioritizing ones you got wrong before.`
        )
      }
    }

    const sorted = chosen.map((q: any) => ({
      ...q,
      answer_options: (q.answer_options || []).sort((a: AnswerOption, b: AnswerOption) => a.order_index - b.order_index),
      syllogism_statements: (q.syllogism_statements || []).sort((a: SyllogismStatement, b: SyllogismStatement) => a.order_index - b.order_index),
    }))

    setQuestions(sorted)
    setCurrentIndex(0)
    resetForNextQuestion()
    setStarted(true)
    setSettingUp(false)
  }

  const backToSetup = () => {
    setStarted(false)
    setSetupMessage('')
    setQuestions([])
  }

  const current = questions[currentIndex]

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

  const handleDragEnd = (event: DragEndEvent) => {
    if (submitted) return
    const { active, over } = event
    if (!over) return

    const value = active.data.current?.value as AnswerValue | undefined
    if (!value) return

    const statementId = String(over.id).replace('target-', '')
    setStatementAnswers((prev) => ({ ...prev, [statementId]: value }))
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

  const toggleFlag = async (questionId: string) => {
    const isFlagged = flaggedIds.has(questionId)

    if (isFlagged) {
      await supabase
        .from('flagged_questions')
        .delete()
        .eq('student_id', userId)
        .eq('question_id', questionId)

      setFlaggedIds((prev) => {
        const next = new Set(prev)
        next.delete(questionId)
        return next
      })
    } else {
      await supabase
        .from('flagged_questions')
        .insert({ student_id: userId, question_id: questionId })

      setFlaggedIds((prev) => new Set(prev).add(questionId))
    }
  }

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  if (!started) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-8">
        <div className="max-w-md mx-auto">
          <a href="/practice" className="text-sm underline">← Sections</a>
          <h1 className="text-2xl font-semibold mt-3 mb-6">{SECTION_LABELS[section]} Practice</h1>

          <div className="rounded border border-zinc-200 dark:border-zinc-700 p-6 bg-white dark:bg-zinc-800 flex flex-col gap-4">
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

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Number of questions</label>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                className="w-24 rounded border border-zinc-300 dark:border-zinc-600 px-3 py-2 bg-transparent"
              />
            </div>

            <button
              onClick={handleStart}
              disabled={settingUp}
              className="rounded bg-black dark:bg-white text-white dark:text-black px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {settingUp ? 'Preparing...' : 'Start practice'}
            </button>

            {setupMessage && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">{setupMessage}</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (currentIndex >= questions.length) {
    return (
      <div className="flex min-h-screen items-center justify-center flex-col gap-3">
        <p className="text-xl font-medium">You've finished this set!</p>
        <div className="flex gap-4 text-sm">
          <button onClick={backToSetup} className="underline">
            Start a new session
          </button>
          <a href="/practice" className="underline">Back to sections</a>
        </div>
      </div>
    )
  }

  const isFlagged = flaggedIds.has(current.id)

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <button onClick={backToSetup} className="text-sm underline">← New session</button>
          <p className="text-sm text-zinc-500">
            {SECTION_LABELS[section]} · Question {currentIndex + 1} of {questions.length}
          </p>
        </div>

        {setupMessage && (
          <p className="mb-4 text-sm rounded bg-zinc-100 dark:bg-zinc-800 p-3 text-zinc-600 dark:text-zinc-400">
            {setupMessage}
          </p>
        )}

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
          <div className="flex items-start justify-between gap-4 mb-4">
            <p className="flex-1">{current.question_text}</p>
            <button
              onClick={() => toggleFlag(current.id)}
              aria-label={isFlagged ? 'Remove flag' : 'Flag for review'}
              className="text-xl leading-none shrink-0"
            >
              {isFlagged ? '🚩' : '⚑'}
            </button>
          </div>

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
            <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
              <div className="flex flex-col gap-3">
                {current.syllogism_statements.map((stmt) => (
                  <div key={stmt.id} className="flex items-center gap-3 rounded border border-zinc-200 dark:border-zinc-700 p-3">
                    <p className="text-sm flex-1">{stmt.statement_text}</p>
                    <DropTarget
                      statementId={stmt.id}
                      currentValue={statementAnswers[stmt.id]}
                      correctValue={stmt.correct_answer}
                      submitted={submitted}
                    />
                  </div>
                ))}
              </div>

              <div className="mt-5 flex gap-3">
                {OPTION_VALUES.map((value) => (
                  <DraggableChip key={value} value={value} disabled={submitted} />
                ))}
              </div>
              <p className="text-xs text-zinc-500 mt-2">Drag an answer into the box beside each statement.</p>
            </DndContext>
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
