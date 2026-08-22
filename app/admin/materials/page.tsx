'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

type Student = {
  id: string
  full_name: string
  email: string
}

type Material = {
  id: string
  title: string
  description: string
  type: 'file' | 'video'
  url: string
}

type Lesson = {
  id: string
  title: string
  lesson_date: string | null
  materials: Material[]
  lesson_access: { student_id: string }[]
}

export default function AdminMaterialsPage() {
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [pageLoading, setPageLoading] = useState(true)
  const [message, setMessage] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const [expandedLessonId, setExpandedLessonId] = useState<string | null>(null)
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null)

  const [lessonTitle, setLessonTitle] = useState('')
  const [lessonDate, setLessonDate] = useState('')
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])
  const [savingLesson, setSavingLesson] = useState(false)

  const [matTitle, setMatTitle] = useState('')
  const [matDescription, setMatDescription] = useState('')
  const [matType, setMatType] = useState<'file' | 'video'>('video')
  const [matVideoUrl, setMatVideoUrl] = useState('')
  const [matFile, setMatFile] = useState<File | null>(null)
  const [savingMaterial, setSavingMaterial] = useState(false)
  const [addingMaterialToLessonId, setAddingMaterialToLessonId] = useState<string | null>(null)

  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null)
  const [editMatTitle, setEditMatTitle] = useState('')
  const [editMatDescription, setEditMatDescription] = useState('')
  const [editMatUrl, setEditMatUrl] = useState('')
  const [editMatFile, setEditMatFile] = useState<File | null>(null)

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

    const { data: lessonsData } = await supabase
      .from('lessons')
      .select('*, materials(*), lesson_access(student_id)')
      .order('lesson_date', { ascending: false, nullsFirst: true })

    const { data: studentsData } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('status', 'approved')
      .order('full_name', { ascending: true })

    setLessons((lessonsData as any) || [])
    setStudents(studentsData || [])
    setPageLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const resetLessonForm = () => {
    setLessonTitle('')
    setLessonDate('')
    setSelectedStudentIds([])
    setEditingLessonId(null)
  }

  const startEditLesson = (lesson: Lesson) => {
    setEditingLessonId(lesson.id)
    setLessonTitle(lesson.title)
    setLessonDate(lesson.lesson_date || '')
    setSelectedStudentIds(lesson.lesson_access.map((a) => a.student_id))
  }

  const toggleStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')

    if (!lessonTitle.trim()) {
      setMessage('Lesson title is required.')
      return
    }

    setSavingLesson(true)

    let lessonId = editingLessonId

    if (editingLessonId) {
      const { error } = await supabase
        .from('lessons')
        .update({ title: lessonTitle, lesson_date: lessonDate || null })
        .eq('id', editingLessonId)

      if (error) {
        setMessage(`Failed to update lesson: ${error.message}`)
        setSavingLesson(false)
        return
      }

      await supabase.from('lesson_access').delete().eq('lesson_id', editingLessonId)
    } else {
      const { data, error } = await supabase
        .from('lessons')
        .insert({ title: lessonTitle, lesson_date: lessonDate || null })
        .select()
        .single()

      if (error) {
        setMessage(`Failed to create lesson: ${error.message}`)
        setSavingLesson(false)
        return
      }

      lessonId = data.id
    }

    if (lessonDate && selectedStudentIds.length > 0 && lessonId) {
      const accessRows = selectedStudentIds.map((studentId) => ({
        lesson_id: lessonId,
        student_id: studentId,
      }))
      const { error: accessError } = await supabase.from('lesson_access').insert(accessRows)
      if (accessError) {
        setMessage(`Lesson saved, but access failed: ${accessError.message}`)
        setSavingLesson(false)
        loadData()
        return
      }
    }

    setMessage(editingLessonId ? 'Lesson updated!' : 'Lesson created!')
    resetLessonForm()
    setSavingLesson(false)
    loadData()
  }

  const handleDeleteLesson = async (id: string) => {
    const { error } = await supabase.from('lessons').delete().eq('id', id)
    if (error) {
      setMessage(`Delete failed: ${error.message}`)
      return
    }
    loadData()
  }

  const resetMaterialForm = () => {
    setMatTitle('')
    setMatDescription('')
    setMatVideoUrl('')
    setMatFile(null)
    setAddingMaterialToLessonId(null)
  }

  const handleAddMaterial = async (e: React.FormEvent, lessonId: string) => {
    e.preventDefault()
    setMessage('')
    setSavingMaterial(true)

    let finalUrl = matVideoUrl

    if (matType === 'file') {
      if (!matFile) {
        setMessage('Please choose a file.')
        setSavingMaterial(false)
        return
      }

      const filePath = `${Date.now()}-${matFile.name}`
      const { error: uploadError } = await supabase.storage
        .from('materials')
        .upload(filePath, matFile)

      if (uploadError) {
        setMessage(`Upload failed: ${uploadError.message}`)
        setSavingMaterial(false)
        return
      }

      const { data: publicUrlData } = supabase.storage.from('materials').getPublicUrl(filePath)
      finalUrl = publicUrlData.publicUrl
    }

    const { error } = await supabase.from('materials').insert({
      lesson_id: lessonId,
      title: matTitle,
      description: matDescription,
      type: matType,
      url: finalUrl,
    })

    if (error) {
      setMessage(`Save failed: ${error.message}`)
      setSavingMaterial(false)
      return
    }

    setMessage('Material added!')
    resetMaterialForm()
    setSavingMaterial(false)
    loadData()
  }

  const handleDeleteMaterial = async (id: string) => {
    const { error } = await supabase.from('materials').delete().eq('id', id)
    if (error) {
      setMessage(`Delete failed: ${error.message}`)
      return
    }
    loadData()
  }

  const startEditMaterial = (m: Material) => {
    setEditingMaterialId(m.id)
    setEditMatTitle(m.title)
    setEditMatDescription(m.description || '')
    setEditMatUrl(m.type === 'video' ? m.url : '')
    setEditMatFile(null)
  }

  const handleSaveMaterialEdit = async (m: Material) => {
    setMessage('')
    setSavingMaterial(true)

    let finalUrl = m.url

    if (m.type === 'video') {
      finalUrl = editMatUrl
    } else if (editMatFile) {
      const filePath = `${Date.now()}-${editMatFile.name}`
      const { error: uploadError } = await supabase.storage
        .from('materials')
        .upload(filePath, editMatFile)

      if (uploadError) {
        setMessage(`Upload failed: ${uploadError.message}`)
        setSavingMaterial(false)
        return
      }

      const { data: publicUrlData } = supabase.storage.from('materials').getPublicUrl(filePath)
      finalUrl = publicUrlData.publicUrl
    }

    const { error } = await supabase
      .from('materials')
      .update({ title: editMatTitle, description: editMatDescription, url: finalUrl })
      .eq('id', m.id)

    if (error) {
      setMessage(`Update failed: ${error.message}`)
      setSavingMaterial(false)
      return
    }

    setMessage('Material updated!')
    setEditingMaterialId(null)
    setSavingMaterial(false)
    loadData()
  }

  if (pageLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6">Manage Lessons & Materials</h1>

        <form
          onSubmit={handleSaveLesson}
          className="flex flex-col gap-4 mb-8 rounded border border-zinc-200 dark:border-zinc-700 p-6"
        >
          <h2 className="font-medium">{editingLessonId ? 'Edit lesson' : 'Create new lesson'}</h2>

          <input
            type="text"
            placeholder="Lesson title (e.g. Week 1 - DM Syllogisms)"
            value={lessonTitle}
            onChange={(e) => setLessonTitle(e.target.value)}
            required
            className="rounded border border-zinc-300 dark:border-zinc-600 px-3 py-2 bg-transparent"
          />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">
              Date (optional — leave blank for general tips, visible to all approved students automatically)
            </label>
            <input
              type="date"
              value={lessonDate}
              onChange={(e) => setLessonDate(e.target.value)}
              className="rounded border border-zinc-300 dark:border-zinc-600 px-3 py-2 bg-transparent"
            />
          </div>

          {lessonDate && (
            <div>
              <label className="text-sm font-medium block mb-2">Visible to which students?</label>
              <div className="flex flex-col gap-1 max-h-48 overflow-y-auto rounded border border-zinc-200 dark:border-zinc-700 p-3">
                {students.length === 0 && (
                  <p className="text-sm text-zinc-500">No approved students yet.</p>
                )}
                {students.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedStudentIds.includes(s.id)}
                      onChange={() => toggleStudent(s.id)}
                    />
                    {s.full_name} <span className="text-zinc-500">({s.email})</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={savingLesson}
              className="rounded bg-black dark:bg-white text-white dark:text-black px-3 py-2 font-medium disabled:opacity-50"
            >
              {savingLesson ? 'Saving...' : editingLessonId ? 'Update lesson' : 'Create lesson'}
            </button>
            {editingLessonId && (
              <button
                type="button"
                onClick={resetLessonForm}
                className="text-sm underline text-zinc-500"
              >
                Cancel edit
              </button>
            )}
          </div>

          {message && <p className="text-sm text-zinc-600 dark:text-zinc-400">{message}</p>}
        </form>

        <h2 className="text-lg font-medium mb-3">Lessons ({lessons.length})</h2>
        <div className="flex flex-col gap-3">
          {lessons.map((lesson) => (
            <div key={lesson.id} className="rounded border border-zinc-200 dark:border-zinc-700">
              <div className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{lesson.title}</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    {lesson.lesson_date
                      ? new Date(lesson.lesson_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
                      : 'No date — visible to all approved students'}
                    {' · '}
                    {lesson.lesson_date ? `${lesson.lesson_access.length} student(s) assigned` : ''}
                    {' · '}
                    {lesson.materials.length} material(s)
                  </p>
                </div>
                <div className="flex gap-3 text-sm shrink-0">
                  <button
                    onClick={() => setExpandedLessonId(expandedLessonId === lesson.id ? null : lesson.id)}
                    className="underline"
                  >
                    {expandedLessonId === lesson.id ? 'Collapse' : 'Manage'}
                  </button>
                  <button onClick={() => startEditLesson(lesson)} className="underline">
                    Edit
                  </button>
                  <button onClick={() => handleDeleteLesson(lesson.id)} className="underline text-red-600">
                    Delete
                  </button>
                </div>
              </div>

              {expandedLessonId === lesson.id && (
                <div className="border-t border-zinc-200 dark:border-zinc-700 p-4 flex flex-col gap-3">
                  {lesson.materials.map((m) =>
                    editingMaterialId === m.id ? (
                      <div key={m.id} className="rounded border border-zinc-200 dark:border-zinc-700 p-3 flex flex-col gap-2">
                        <input
                          type="text"
                          value={editMatTitle}
                          onChange={(e) => setEditMatTitle(e.target.value)}
                          className="rounded border border-zinc-300 dark:border-zinc-600 px-2 py-1.5 text-sm bg-transparent"
                        />
                        <input
                          type="text"
                          placeholder="Description"
                          value={editMatDescription}
                          onChange={(e) => setEditMatDescription(e.target.value)}
                          className="rounded border border-zinc-300 dark:border-zinc-600 px-2 py-1.5 text-sm bg-transparent"
                        />
                        {m.type === 'video' ? (
                          <input
                            type="url"
                            value={editMatUrl}
                            onChange={(e) => setEditMatUrl(e.target.value)}
                            className="rounded border border-zinc-300 dark:border-zinc-600 px-2 py-1.5 text-sm bg-transparent"
                          />
                        ) : (
                          <input
                            type="file"
                            onChange={(e) => setEditMatFile(e.target.files?.[0] || null)}
                            className="text-xs"
                          />
                        )}
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleSaveMaterialEdit(m)}
                            disabled={savingMaterial}
                            className="text-sm rounded bg-black dark:bg-white text-white dark:text-black px-3 py-1"
                          >
                            Save
                          </button>
                          <button onClick={() => setEditingMaterialId(null)} className="text-sm underline">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div key={m.id} className="flex items-center justify-between text-sm">
                        <span>{m.title} <span className="text-zinc-500">({m.type})</span></span>
                        <div className="flex gap-3">
                          <button onClick={() => startEditMaterial(m)} className="underline">Edit</button>
                          <button onClick={() => handleDeleteMaterial(m.id)} className="underline text-red-600">Delete</button>
                        </div>
                      </div>
                    )
                  )}

                  {addingMaterialToLessonId === lesson.id ? (
                    <form
                      onSubmit={(e) => handleAddMaterial(e, lesson.id)}
                      className="flex flex-col gap-2 rounded border border-zinc-200 dark:border-zinc-700 p-3 mt-2"
                    >
                      <input
                        type="text"
                        placeholder="Title"
                        value={matTitle}
                        onChange={(e) => setMatTitle(e.target.value)}
                        required
                        className="rounded border border-zinc-300 dark:border-zinc-600 px-2 py-1.5 text-sm bg-transparent"
                      />
                      <input
                        type="text"
                        placeholder="Description (optional)"
                        value={matDescription}
                        onChange={(e) => setMatDescription(e.target.value)}
                        className="rounded border border-zinc-300 dark:border-zinc-600 px-2 py-1.5 text-sm bg-transparent"
                      />
                      <div className="flex gap-4 text-xs">
                        <label className="flex items-center gap-1">
                          <input type="radio" checked={matType === 'video'} onChange={() => setMatType('video')} />
                          Video link
                        </label>
                        <label className="flex items-center gap-1">
                          <input type="radio" checked={matType === 'file'} onChange={() => setMatType('file')} />
                          Upload file
                        </label>
                      </div>
                      {matType === 'video' ? (
                        <input
                          type="url"
                          placeholder="https://..."
                          value={matVideoUrl}
                          onChange={(e) => setMatVideoUrl(e.target.value)}
                          required
                          className="rounded border border-zinc-300 dark:border-zinc-600 px-2 py-1.5 text-sm bg-transparent"
                        />
                      ) : (
                        <input
                          type="file"
                          onChange={(e) => setMatFile(e.target.files?.[0] || null)}
                          required
                          className="text-xs"
                        />
                      )}
                      <div className="flex gap-3">
                        <button
                          type="submit"
                          disabled={savingMaterial}
                          className="text-sm rounded bg-black dark:bg-white text-white dark:text-black px-3 py-1"
                        >
                          {savingMaterial ? 'Saving...' : 'Add'}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setAddingMaterialToLessonId(null); resetMaterialForm() }}
                          className="text-sm underline"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      onClick={() => setAddingMaterialToLessonId(lesson.id)}
                      className="text-sm underline text-blue-600 dark:text-blue-400 text-left mt-1"
                    >
                      + Add material to this lesson
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
