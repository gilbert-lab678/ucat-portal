'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { AdminSidebar } from '@/components/layout/admin-sidebar'
import { Navbar } from '@/components/layout/navbar'
import { Plus, Video, FileText, ChevronDown, Pencil, Trash2, X } from 'lucide-react'

export const dynamic = 'force-dynamic'

type Student = {
  id: string
  full_name: string
  email: string
  class_code_id: string | null
}

type ClassCode = {
  id: string
  code: string
  description: string | null
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

const inputClasses =
  'w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0d111a] px-3 py-2 text-sm text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors'

export default function AdminMaterialsPage() {
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [classCodes, setClassCodes] = useState<ClassCode[]>([])
  const [fullName, setFullName] = useState('')
  const [pageLoading, setPageLoading] = useState(true)
  const [message, setMessage] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const [expandedLessonId, setExpandedLessonId] = useState<string | null>(null)
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null)

  const [lessonTitle, setLessonTitle] = useState('')
  const [lessonDate, setLessonDate] = useState('')
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])
  const [classQuickAdd, setClassQuickAdd] = useState('')
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
      .select('full_name, is_admin')
      .eq('id', user.id)
      .single()

    if (!myProfile?.is_admin) {
      router.push('/login')
      return
    }

    setFullName(myProfile.full_name)

    const { data: lessonsData } = await supabase
      .from('lessons')
      .select('*, materials(*), lesson_access(student_id)')
      .order('lesson_date', { ascending: false, nullsFirst: true })

    const { data: studentsData } = await supabase
      .from('profiles')
      .select('id, full_name, email, class_code_id')
      .eq('status', 'approved')
      .order('full_name', { ascending: true })

    const { data: classCodesData } = await supabase
      .from('class_codes')
      .select('id, code, description')
      .order('code', { ascending: true })

    setLessons((lessonsData as any) || [])
    setStudents(studentsData || [])
    setClassCodes(classCodesData || [])
    setPageLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const resetLessonForm = () => {
    setLessonTitle('')
    setLessonDate('')
    setSelectedStudentIds([])
    setClassQuickAdd('')
    setEditingLessonId(null)
  }

  const startEditLesson = (lesson: Lesson) => {
    setEditingLessonId(lesson.id)
    setLessonTitle(lesson.title)
    setLessonDate(lesson.lesson_date || '')
    setSelectedStudentIds(lesson.lesson_access.map((a) => a.student_id))
    setClassQuickAdd('')
    setExpandedLessonId(null)
  }

  const toggleStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  const handleClassQuickAdd = (classId: string) => {
    if (!classId) return

    const classStudentIds = students
      .filter((s) => s.class_code_id === classId)
      .map((s) => s.id)

    setSelectedStudentIds((prev) => Array.from(new Set([...prev, ...classStudentIds])))
    setClassQuickAdd('')
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
    const confirmed = window.confirm('Delete this lesson and all its materials? This cannot be undone.')
    if (!confirmed) return

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
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-[#030408]">
        <p className="text-zinc-500 dark:text-zinc-400 animate-pulse text-sm">Loading Workspace...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-zinc-50 dark:bg-[#030408] text-zinc-900 dark:text-zinc-100 font-sans transition-colors duration-200">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar fullName={fullName} title="Manage Lessons & Materials" />

        <main className="flex-1 p-8 max-w-3xl mx-auto w-full">
          {message && <p className="mb-4 text-sm text-rose-500">{message}</p>}

          <form
            onSubmit={handleSaveLesson}
            className="bg-white dark:bg-[#0a0d14] border border-zinc-200 dark:border-zinc-800/80 rounded-xl shadow-sm p-6 mb-8 flex flex-col gap-4"
          >
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
              {editingLessonId ? 'Edit lesson' : 'Create new lesson'}
            </h2>

            <input
              type="text"
              placeholder="Lesson title (e.g. Week 1 - DM Syllogisms)"
              value={lessonTitle}
              onChange={(e) => setLessonTitle(e.target.value)}
              required
              className={inputClasses}
            />

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Date (optional — leave blank for general tips, visible to all approved students automatically)
              </label>
              <input
                type="date"
                value={lessonDate}
                onChange={(e) => setLessonDate(e.target.value)}
                className={inputClasses}
              />
            </div>

            {lessonDate && (
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 block mb-1">
                    Quick-add a whole class
                  </label>
                  <select
                    value={classQuickAdd}
                    onChange={(e) => handleClassQuickAdd(e.target.value)}
                    className={inputClasses}
                  >
                    <option value="">Select a class to add all its students...</option>
                    {classCodes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code}{c.description ? ` — ${c.description}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 block mb-2">
                    Students ({selectedStudentIds.length} selected) — add or remove individually
                  </label>
                  <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 bg-zinc-50 dark:bg-[#0d111a]">
                    {students.length === 0 && (
                      <p className="text-xs text-zinc-400 dark:text-zinc-500">No approved students yet.</p>
                    )}
                    {students.map((s) => (
                      <label key={s.id} className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                        <input
                          type="checkbox"
                          checked={selectedStudentIds.includes(s.id)}
                          onChange={() => toggleStudent(s.id)}
                          className="accent-indigo-600"
                        />
                        {s.full_name} <span className="text-zinc-400 dark:text-zinc-500 text-xs">({s.email})</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 items-center">
              <button
                type="submit"
                disabled={savingLesson}
                className="rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 text-sm font-medium disabled:opacity-50 transition-colors flex items-center gap-1.5"
              >
                <Plus className="h-4 w-4" />
                {savingLesson ? 'Saving...' : editingLessonId ? 'Update lesson' : 'Create lesson'}
              </button>
              {editingLessonId && (
                <button
                  type="button"
                  onClick={resetLessonForm}
                  className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 underline transition-colors"
                >
                  Cancel edit
                </button>
              )}
            </div>
          </form>

          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3">
            Lessons ({lessons.length})
          </h2>

          <div className="flex flex-col gap-3">
            {lessons.map((lesson) => {
              const isExpanded = expandedLessonId === lesson.id
              return (
                <div
                  key={lesson.id}
                  className="bg-white dark:bg-[#0a0d14] border border-zinc-200 dark:border-zinc-800/80 rounded-xl shadow-sm overflow-hidden transition-colors"
                >
                  <div className="flex items-center justify-between p-4">
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-white">{lesson.title}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                        {lesson.lesson_date
                          ? new Date(lesson.lesson_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
                          : 'No date — visible to all approved students'}
                        {' · '}
                        {lesson.lesson_date ? `${lesson.lesson_access.length} student(s) assigned · ` : ''}
                        {lesson.materials.length} material{lesson.materials.length === 1 ? '' : 's'}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-xs shrink-0">
                      <button
                        onClick={() => setExpandedLessonId(isExpanded ? null : lesson.id)}
                        className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-medium"
                      >
                        Manage
                        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                      <button
                        onClick={() => startEditLesson(lesson)}
                        className="flex items-center gap-1 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => handleDeleteLesson(lesson.id)}
                        className="flex items-center gap-1 text-rose-500 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-zinc-200 dark:border-zinc-800/50 p-4 flex flex-col gap-2 bg-zinc-50 dark:bg-[#0d111a]/30">
                      {lesson.materials.map((m) =>
                        editingMaterialId === m.id ? (
                          <div
                            key={m.id}
                            className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0a0d14] p-3 flex flex-col gap-2"
                          >
                            <input
                              type="text"
                              value={editMatTitle}
                              onChange={(e) => setEditMatTitle(e.target.value)}
                              className={inputClasses}
                            />
                            <input
                              type="text"
                              placeholder="Description"
                              value={editMatDescription}
                              onChange={(e) => setEditMatDescription(e.target.value)}
                              className={inputClasses}
                            />
                            {m.type === 'video' ? (
                              <input
                                type="url"
                                value={editMatUrl}
                                onChange={(e) => setEditMatUrl(e.target.value)}
                                className={inputClasses}
                              />
                            ) : (
                              <input
                                type="file"
                                onChange={(e) => setEditMatFile(e.target.files?.[0] || null)}
                                className="text-xs text-zinc-500"
                              />
                            )}
                            <div className="flex gap-3">
                              <button
                                onClick={() => handleSaveMaterialEdit(m)}
                                disabled={savingMaterial}
                                className="text-xs rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 font-medium transition-colors"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingMaterialId(null)}
                                className="text-xs text-zinc-400 underline"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div
                            key={m.id}
                            className="flex items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0a0d14] px-3 py-2.5"
                          >
                            <div className="flex items-center gap-2">
                              {m.type === 'video' ? (
                                <Video className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                              ) : (
                                <FileText className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                              )}
                              <span className="text-sm text-zinc-800 dark:text-zinc-200">{m.title}</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs shrink-0">
                              <button onClick={() => startEditMaterial(m)} className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors">
                                Edit
                              </button>
                              <button onClick={() => handleDeleteMaterial(m.id)} className="text-rose-500 hover:text-rose-600 transition-colors">
                                Delete
                              </button>
                            </div>
                          </div>
                        )
                      )}

                      {addingMaterialToLessonId === lesson.id ? (
                        <form
                          onSubmit={(e) => handleAddMaterial(e, lesson.id)}
                          className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0a0d14] p-3 flex flex-col gap-2 mt-1"
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">New material</p>
                            <button
                              type="button"
                              onClick={() => { setAddingMaterialToLessonId(null); resetMaterialForm() }}
                              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <input
                            type="text"
                            placeholder="Title"
                            value={matTitle}
                            onChange={(e) => setMatTitle(e.target.value)}
                            required
                            className={inputClasses}
                          />
                          <input
                            type="text"
                            placeholder="Description (optional)"
                            value={matDescription}
                            onChange={(e) => setMatDescription(e.target.value)}
                            className={inputClasses}
                          />
                          <div className="flex gap-4 text-xs text-zinc-600 dark:text-zinc-300">
                            <label className="flex items-center gap-1.5">
                              <input type="radio" checked={matType === 'video'} onChange={() => setMatType('video')} className="accent-indigo-600" />
                              Video link
                            </label>
                            <label className="flex items-center gap-1.5">
                              <input type="radio" checked={matType === 'file'} onChange={() => setMatType('file')} className="accent-indigo-600" />
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
                              className={inputClasses}
                            />
                          ) : (
                            <input
                              type="file"
                              onChange={(e) => setMatFile(e.target.files?.[0] || null)}
                              required
                              className="text-xs text-zinc-500"
                            />
                          )}
                          <button
                            type="submit"
                            disabled={savingMaterial}
                            className="self-start text-xs rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 font-medium disabled:opacity-50 transition-colors"
                          >
                            {savingMaterial ? 'Saving...' : 'Add material'}
                          </button>
                        </form>
                      ) : (
                        <button
                          onClick={() => setAddingMaterialToLessonId(lesson.id)}
                          className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-1 self-start"
                        >
                          <Plus className="h-3.5 w-3.5" /> Add material to this lesson
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </main>
      </div>
    </div>
  )
}
