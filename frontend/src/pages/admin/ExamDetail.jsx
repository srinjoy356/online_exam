/**
 * pages/admin/ExamDetail.jsx
 * --------------------------
 * View an exam, add questions with 4 options, delete questions.
 */
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, CheckCircle2, Circle, ChevronDown, ChevronUp, BarChart2 } from 'lucide-react'
import toast from 'react-hot-toast'
import Navbar from '../../components/common/Navbar'
import { adminApi } from '../../api/services'

const blankOption = () => ({ option_text: '', is_correct: false, option_order: 1 })
const blankForm   = () => ({
  question_text: '',
  options: [
    { ...blankOption(), option_order: 1 },
    { ...blankOption(), option_order: 2 },
    { ...blankOption(), option_order: 3 },
    { ...blankOption(), option_order: 4 },
  ],
})

export default function ExamDetail() {
  const { examId } = useParams()
  const [exam,      setExam]      = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [showForm,  setShowForm]  = useState(false)
  const [form,      setForm]      = useState(blankForm())
  const [saving,    setSaving]    = useState(false)

  const fetchExam = async () => {
    try {
      const { data } = await adminApi.getExam(examId)
      setExam(data)
    } catch {
      toast.error('Failed to load exam.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchExam() }, [examId])

  const setOptionText = (i, text) => {
    const opts = [...form.options]
    opts[i] = { ...opts[i], option_text: text }
    setForm({ ...form, options: opts })
  }

  const setCorrect = (i) => {
    const opts = form.options.map((o, idx) => ({ ...o, is_correct: idx === i }))
    setForm({ ...form, options: opts })
  }

  const handleAddQuestion = async (e) => {
    e.preventDefault()
    if (!form.question_text.trim()) { toast.error('Question text required.'); return }
    if (form.options.some(o => !o.option_text.trim())) {
      toast.error('All 4 options must be filled.'); return
    }
    if (!form.options.some(o => o.is_correct)) {
      toast.error('Mark one option as correct.'); return
    }

    setSaving(true)
    try {
      await adminApi.addQuestion(examId, form)
      toast.success('Question added!')
      setForm(blankForm())
      setShowForm(false)
      fetchExam()
    } catch (err) {
      toast.error(err.message || 'Failed to add question.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteQuestion = async (qId) => {
    if (!confirm('Delete this question?')) return
    try {
      await adminApi.deleteQuestion(examId, qId)
      toast.success('Question deleted.')
      fetchExam()
    } catch (err) {
      toast.error(err.message || 'Delete failed.')
    }
  }

  if (loading) return (
    <div className="page-wrap"><Navbar/>
      <div className="flex items-center justify-center h-64 text-slate-400">Loading…</div>
    </div>
  )

  if (!exam) return (
    <div className="page-wrap"><Navbar/>
      <div className="flex items-center justify-center h-64 text-coral">Exam not found.</div>
    </div>
  )

  return (
    <div className="page-wrap">
      <Navbar/>
      <main className="container-md py-10">

        {/* Header */}
        <div className="flex items-start gap-3 mb-6 animate-fade-up">
          <Link to="/admin/dashboard" className="btn-ghost px-2 mt-1"><ArrowLeft size={16}/></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-display font-bold text-ink">{exam.exam_name}</h1>
            <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-500">
              <span>{exam.num_questions} Q required</span>
              <span>·</span>
              <span>{exam.time_limit_mins} min</span>
              <span>·</span>
              <span>+{exam.positive_marks} / -{exam.negative_marks} marks</span>
              <span>·</span>
              <span>Pass: {exam.passing_marks}</span>
            </div>
          </div>
          <Link to={`/admin/exams/${examId}/results`} className="btn-ghost shrink-0">
            <BarChart2 size={14}/> Results
          </Link>
          <button onClick={() => setShowForm(!showForm)} className="btn-amber shrink-0">
            {showForm ? <><ChevronUp size={14}/> Cancel</> : <><Plus size={14}/> Add Question</>}
          </button>
        </div>

        {/* Add Question Form */}
        {showForm && (
          <form onSubmit={handleAddQuestion}
                className="card mb-6 animate-fade-up border-amber/30">
            <h3 className="font-display font-bold text-ink mb-4">New Question</h3>

            <div className="mb-4">
              <label className="label">Question Text</label>
              <textarea value={form.question_text}
                        onChange={e => setForm({...form, question_text: e.target.value})}
                        className="input resize-none" rows={3}
                        placeholder="Type your question here…"/>
            </div>

            <div className="space-y-2 mb-5">
              <label className="label">Options (click circle to mark correct)</label>
              {form.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <button type="button" onClick={() => setCorrect(i)}
                          className={`shrink-0 transition-colors ${opt.is_correct ? 'text-teal' : 'text-slate-300 hover:text-teal/50'}`}>
                    {opt.is_correct ? <CheckCircle2 size={18}/> : <Circle size={18}/>}
                  </button>
                  <input value={opt.option_text}
                         onChange={e => setOptionText(i, e.target.value)}
                         className={`input text-sm ${opt.is_correct ? 'border-teal/40 bg-teal/5' : ''}`}
                         placeholder={`Option ${i+1}`}/>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => { setShowForm(false); setForm(blankForm()) }}
                      className="btn-ghost text-sm">Cancel</button>
              <button type="submit" disabled={saving} className="btn-teal text-sm">
                {saving ? 'Saving…' : <><Plus size={13}/> Save Question</>}
              </button>
            </div>
          </form>
        )}

        {/* Questions list */}
        <div className="card animate-fade-up" style={{animationDelay:'0.1s'}}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-ink">
              Questions
            </h2>
            <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${
              exam.questions?.length >= exam.num_questions
                ? 'bg-teal/10 text-teal-dark' : 'bg-amber/10 text-amber-dark'
            }`}>
              {exam.questions?.length || 0} / {exam.num_questions}
            </span>
          </div>

          {(!exam.questions || exam.questions.length === 0) ? (
            <p className="text-center text-slate-400 py-10">
              No questions yet. Click "Add Question" to start.
            </p>
          ) : (
            <div className="space-y-4">
              {exam.questions.map((q, idx) => (
                <QuestionCard key={q.id} q={q} idx={idx} onDelete={handleDeleteQuestion}/>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function QuestionCard({ q, idx, onDelete }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-slate-100 rounded-xl overflow-hidden hover:border-slate-200 transition-all">
      <button onClick={() => setOpen(!open)}
              className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50 transition-colors">
        <span className="w-7 h-7 rounded-lg bg-ink text-cream text-xs font-mono font-bold
                         flex items-center justify-center shrink-0">
          {idx + 1}
        </span>
        <span className="flex-1 text-sm text-ink font-medium">{q.question_text}</span>
        <span className="text-slate-400">{open ? <ChevronUp size={15}/> : <ChevronDown size={15}/>}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-slate-100">
          <div className="pt-3 space-y-2">
            {q.options.map(o => (
              <div key={o.id}
                   className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg
                               ${o.is_correct ? 'bg-teal/10 text-teal-dark font-medium' : 'text-slate-600'}`}>
                {o.is_correct ? <CheckCircle2 size={14}/> : <Circle size={14} className="text-slate-300"/>}
                {o.option_text}
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-3">
            <button onClick={() => onDelete(q.id)} className="btn-ghost text-xs text-coral hover:bg-coral/10">
              <Trash2 size={13}/> Delete Question
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
