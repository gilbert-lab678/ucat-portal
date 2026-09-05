'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { AdminSidebar as Sidebar } from '@/components/layout/admin-sidebar'
import { Navbar } from '@/components/layout/navbar'
import { Plus, X, ChevronDown, Trash2, UserPlus } from 'lucide-react'

export const dynamic = 'force-dynamic'

type Student = {
  id: string
  full_name: string
  email: string
  class_code_id: string | null
}

type AccessGrant = {
  id: string
  student_id: string
  override_comment: string | null
}

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
  access: AccessGrant[]
}

export default function ClassDetailPage() {
  const params = useParams()
  const classId = params.classId as string
  const router = useRouter()
  const supabase = createClient()

  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(true)
  const [classCode, setClassCode] = useState<{ code: string; description: string | null } | null>(null)
  const [enrolled, setEnrolled] = useState<Student[]>([])
  const [allStudents, setAllStudents] = useState<Student[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [message, setMessage] = useState('')

  const [addStudentId, setAddStudentId] = useState('')
  const [expandedLessonId, setExpandedLessonId] = useState<string | null>(null)
  const [grantStudentId, setGrantStudentId] = useState('')

  const [showNewLesson, setShowNewLesson] = useState(false)
  const [newLesson, setNewLesson] = useState({
    title: '', lesson_date: '', week_label: '', hw_requirement: '',
    comments: '', video_link: '', whiteboard_link: '', tutor_name: '',
  })
  const [savingLesson, setSavingLesson] = useState(false)

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

    const { data: classData } = await supabase
      .from('class_codes')
      .select('code, description')
      .eq('id', classId)
      .single()

    setClassCode(classData || null)

    const { data: studentsData } = await supabase
      .from('profiles')
      .select('id, full_name, email, class_code_id')
      .eq('status', 'approved')
      .order('full_name', { ascending: true })

    const allApproved = studentsData || []
    setAllStudents(allApproved)
    setEnrolled(allApproved.filter((s) => s.class_code_id === classId))

    const { data: lessonsData } = await supabase
      .from('lessons')
      .select('id, title, lesson_date, week_label, hw_requirement, comments, video_link, whiteboard_link, tutor_name, lesson_access(id, student_id, override_comment)')
      .eq('class_code_id', classId)
      .order('lesson_date', { ascending: false, nullsFirst: true })

    setLessons(
      (lessonsData || []).map((l: any) => ({ ...l, access: l.lesson_access || [] }))
    )

    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [classId])

  const handleAddStudent = async () => {
    if (!addStudentId) return
    setMessage('')

    const { error } = await supabase
      .from('profiles')
      .update({ class_code_id: classId })
      .eq('id', addStudentId)

    if (error) {
      setMessage(`Failed to add student: ${error.message}`)
      return
    }

    setAddStudentId('')
    loadData()
  }

  const handleRemoveStudent = async (studentId: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ class_code_id: null })
      .eq('id', studentId)

    if (error) {
      setMessage(`Failed to remove student: ${error.message}`)
      return
    }

    loadData()
  }

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingLesson(true)
    setMessage('')

    const { error } = await supabase.from('lessons').insert({
      class_code_id: classId,
      title: newLesson.title || null,
      lesson_date: newLesson.lesson_date || null,
      week_label: newLesson.week_label || null,
      hw_requirement: newLesson.hw_requirement || null,
      comments: newLesson.comments || null,
      video_link: newLesson.video_link || null,
      whiteboard_link: newLesson.whiteboard_link || null,
      tutor_name: newLesson.tutor_name || null,
    })

    if (error) {
      setMessage(`Failed to create lesson: ${error.message}`)
      setSavingLesson(false)
      return
    }

    setNewLesson({
      title: '', lesson_date: '', week_label: '', hw_requirement: '',
      comments: '', video_link: '', whiteboard_link: '', tutor_name: '',
    })
    setShowNewLesson(false)
    setSavingLesson(false)
    loadData()
  }

  const handleDeleteLesson = async (lessonId: string) => {
    if (!window.confirm('Delete this lesson? This also removes any attached materials.')) return
    await supabase.from('lessons').delete().eq('id', lessonId)
    loadData()
  }

  const handleGrantAccess = async (lessonId: string) => {
    if (!grantStudentId) return
    const { error } = await supabase
      .from('lesson_access')
      .insert({ lesson_id: lessonId, student_id: grantStudentId })

    if (error) {
      setMessage(`Failed to grant access: ${error.message}`)
      return
    }

    setGrantStudentId('')
    loadData()
  }

  const handleRevokeAccess = async (grantId: string) => {
    await supabase.from('lesson_access').delete().eq('id', grantId)
    loadData()
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-[#030408]">
        <p className="text-zinc-500 dark:text-zinc-400 animate-pulse text-sm">Loading Workspace...</p>
      </div>
    )
  }

  const unenrolledStudents = allStudents.filter((s) => s.class_code_id !== classId)

  return (
    <div className="min-h-screen flex bg-zinc-50 dark:bg-[#030408] text-zinc-900 dark:text-zinc-100 font-sans transition-colors duration-200">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar fullName={fullName} title={classCode?.code || 'Class'} />

        <main className="flex-1 p-8 max-w-4xl mx-auto w-full">
          <button onClick={() => router.push('/admin/classes')} className="text-xs text-zinc-500 hover:text-indigo-500 mb-4">
            ← All classes
          </button>

          {classCode?.description && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">{classCode.description}</p>
          )}

          {message && <p className="text-xs text-rose-500 mb-4">{message}</p>}

          {/* Enrolled students */}
          <div className="bg-white dark:bg-[#0a0d14] border border-zinc-200 dark:border-zinc-800/80 rounded-xl shadow-sm mb-8 overflow-hidden">
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-800/50 bg-zinc-50 dark:bg-[#0d111a]/40">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Enrolled Students ({enrolled.length})</h2>
            </div>

            <div className="p-5 flex flex-col gap-2">
              {enrolled.map((s) => (
                <div key={s.id} className="flex items-center justify-between text-sm py-1.5">
                  <div>
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">{s.full_name}</span>
                    <span className="text-zinc-400 dark:text-zinc-500 ml-2 text-xs">{s.email}</span>
                  </div>
                  <button onClick={() => handleRemoveStudent(s.id)} className="text-xs text-rose-500 hover:underline">
                    Remove
                  </button>
                </div>
              ))}

              {enrolled.length === 0 && (
                <p className="text-xs text-zinc-400 dark:text-zinc-500">No students enrolled yet.</p>
              )}

              <div className="flex gap-2 mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-800/50">
                <select
                  value={addStudentId}
                  onChange={(e) => setAddStudentId(e.target.value)}
                  className="flex-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0d111a] px-3 py-2 text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="">Select a student to add...</option>
                  {unenrolledStudents.map((s) => (
                    <option key={s.id} value={s.id}>{s.full_name} ({s.email})</option>
                  ))}
                </select>
                <button
                  onClick={handleAddStudent}
                  disabled={!addStudentId}
                  className="rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2 text-sm font-medium disabled:opacity-40 transition-colors flex items-center gap-1.5"
                >
                  <UserPlus className="h-3.5 w-3.5" /> Add
                </button>
              </div>
            </div>
          </div>

          {/* Lessons */}
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Lessons ({lessons.length})</h2>
            <button
              onClick={() => setShowNewLesson(!showNewLesson)}
              className="text-xs rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 font-medium transition-colors flex items-center gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" /> New lesson
            </button>
          </div>

          {showNewLesson && (
            <form onSubmit={handleCreateLesson} className="bg-white dark:bg-[#0a0d14] border border-zinc-200 dark:border-zinc-800/80 rounded-xl p-5 shadow-sm mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input placeholder="Content title (e.g. 5.5 Mechanics V)" value={newLesson.title} onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })} className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0d111a] px-3 py-2 text-sm sm:col-span-2" />
              <input type="date" placeholder="Lesson date" value={newLesson.lesson_date} onChange={(e) => setNewLesson({ ...newLesson, lesson_date: e.target.value })} className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0d111a] px-3 py-2 text-sm" />
              <input placeholder="Week label (e.g. Week 2)" value={newLesson.week_label} onChange={(e) => setNewLesson({ ...newLesson, week_label: e.target.value })} className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0d111a] px-3 py-2 text-sm" />
              <input placeholder="Tutor name" value={newLesson.tutor_name} onChange={(e) => setNewLesson({ ...newLesson, tutor_name: e.target.value })} className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0d111a] px-3 py-2 text-sm" />
              <input placeholder="HW requirement (e.g. Medify Mock 5)" value={newLesson.hw_requirement} onChange={(e) => setNewLesson({ ...newLesson, hw_requirement: e.target.value })} className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0d111a] px-3 py-2 text-sm" />
              <input placeholder="Video link" value={newLesson.video_link} onChange={(e) => setNewLesson({ ...newLesson, video_link: e.target.value })} className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0d111a] px-3 py-2 text-sm" />
              <input placeholder="Whiteboard link" value={newLesson.whiteboard_link} onChange={(e) => setNewLesson({ ...newLesson, whiteboard_link: e.target.value })} className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0d111a] px-3 py-2 text-sm" />
              <textarea placeholder="Comments" value={newLesson.comments} onChange={(e) => setNewLesson({ ...newLesson, comments: e.target.value })} rows={2} className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0d111a] px-3 py-2 text-sm sm:col-span-2" />
              <button type="submit" disabled={savingLesson} className="sm:col-span-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 text-sm font-medium disabled:opacity-50 transition-colors">
                {savingLesson ? 'Saving...' : 'Save lesson'}
              </button>
            </form>
          )}

          <div className="flex flex-col gap-3">
            {lessons.length === 0 && (
              <div className="bg-white dark:bg-[#0a0d14] border border-zinc-200 dark:border-zinc-800/80 rounded-xl p-8 text-center shadow-sm">
                <p className="text-sm text-zinc-400 dark:text-zinc-500">No lessons yet for this class.</p>
              </div>
            )}

            {lessons.map((lesson) => {
              const isExpanded = expandedLessonId === lesson.id
              return (
                <div key={lesson.id} className="bg-white dark:bg-[#0a0d14] border border-zinc-200 dark:border-zinc-800/80 rounded-xl shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between p-4">
                    <button
                      onClick={() => setExpandedLessonId(isExpanded ? null : lesson.id)}
                      className="flex-1 text-left flex items-center gap-2"
                    >
                      <ChevronDown className={`h-4 w-4 text-zinc-400 transition-transform shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
                      <div>
                        <p className="text-sm font-medium text-zinc-900 dark:text-white">{lesson.title || 'Untitled lesson'}</p>
                        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                          {lesson.week_label || 'No week'} {lesson.lesson_date ? `· ${new Date(lesson.lesson_date).toLocaleDateString('en-AU')}` : ''}
                          {lesson.hw_requirement && ` · ${lesson.hw_requirement}`}
                        </p>
                      </div>
                    </button>
                    <button onClick={() => handleDeleteLesson(lesson.id)} className="text-zinc-400 hover:text-rose-500 p-1 shrink-0">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-zinc-200 dark:border-zinc-800/50 p-4 text-sm">
                      {lesson.comments && (
                        <p className="text-zinc-600 dark:text-zinc-400 mb-3">{lesson.comments}</p>
                      )}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400 mb-4">
                        {lesson.tutor_name && <span>Tutor: {lesson.tutor_name}</span>}
                        {lesson.video_link && <a href={lesson.video_link} target="_blank" className="text-indigo-500 hover:underline">Video link</a>}
                        {lesson.whiteboard_link && <a href={lesson.whiteboard_link} target="_blank" className="text-indigo-500 hover:underline">Whiteboard link</a>}
                      </div>

                      <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase mb-2">
                        Extra access (makeups / absences)
                      </p>
                      <div className="flex flex-col gap-1.5 mb-3">
                        {lesson.access.map((a) => {
                          const student = allStudents.find((s) => s.id === a.student_id)
                          return (
                            <div key={a.id} className="flex items-center justify-between text-xs bg-zinc-50 dark:bg-[#0d111a] rounded-lg px-3 py-1.5">
                              <span>{student?.full_name || 'Unknown student'}</span>
                              <button onClick={() => handleRevokeAccess(a.id)} className="text-rose-500">
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          )
                        })}
                        {lesson.access.length === 0 && (
                          <p className="text-xs text-zinc-400 dark:text-zinc-500">No extra students granted access.</p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <select
                          value={grantStudentId}
                          onChange={(e) => setGrantStudentId(e.target.value)}
                          className="flex-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0d111a] px-3 py-1.5 text-xs"
                        >
                          <option value="">Select a student...</option>
                          {allStudents.map((s) => (
                            <option key={s.id} value={s.id}>{s.full_name}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleGrantAccess(lesson.id)}
                          disabled={!grantStudentId}
                          className="rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 text-xs font-medium disabled:opacity-40 transition-colors"
                        >
                          Grant
                        </button>
                      </div>
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
