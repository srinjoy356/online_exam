/**
 * pages/admin/ExamCreate.jsx
 */
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import Navbar from '../../components/common/Navbar'
import { adminApi } from '../../api/services'

export default function ExamCreate() {
  const navigate = useNavigate()

  const [examName,       setExamName]       = useState('')
  const [numQuestions,   setNumQuestions]   = useState(10)
  const [timeLimitMins,  setTimeLimitMins]  = useState(30)
  const [posMarks,       setPosMarks]       = useState(1)
  const [negMarks,       setNegMarks]       = useState(0.25)
  const [passingMarks,   setPassingMarks]   = useState(40)
  const [maxAttempts,    setMaxAttempts]    = useState(1)
  const [randomize,      setRandomize]      = useState(true)
  const [loading,        setLoading]        = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!examName.trim()) { toast.error('Exam name is required.'); return }
    setLoading(true)
    try {
      const { data } = await adminApi.createExam({
        exam_name:       examName,
        num_questions:   Number(numQuestions),
        time_limit_mins: Number(timeLimitMins),
        positive_marks:  Number(posMarks),
        negative_marks:  Number(negMarks),
        passing_marks:   Number(passingMarks),
        max_attempts:    Number(maxAttempts),
        randomize,
      })
      toast.success('Exam created! Add questions now.')
      navigate(`/admin/exams/${data.id}`)
    } catch (err) {
      toast.error(err.message || 'Failed to create exam.')
    } finally {
      setLoading(false)
    }
  }

  const numCls = 'input'

  return (
    <div className="page-wrap">
      <Navbar />
      <main className="container-md py-10">

        <div className="flex items-center gap-3 mb-8 animate-fade-up">
          <Link to="/admin/dashboard" className="btn-ghost px-2">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-2xl font-display font-bold text-ink">Create New Exam</h1>
            <p className="text-slate-400 text-sm">Configure exam settings below</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="card animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <div className="space-y-5">

            {/* Exam Name */}
            <div>
              <label className="label">Exam Name</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Mathematics Mid-Term 2025"
                value={examName}
                onChange={e => setExamName(e.target.value)}
              />
            </div>

            {/* Row 1 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="label">No. of Questions</label>
                <input type="number" className={numCls} min={1} max={500}
                  value={numQuestions} onChange={e => setNumQuestions(e.target.value)} />
              </div>
              <div>
                <label className="label">Time Limit (min)</label>
                <input type="number" className={numCls} min={1} max={300}
                  value={timeLimitMins} onChange={e => setTimeLimitMins(e.target.value)} />
              </div>
              <div>
                <label className="label">Passing Marks</label>
                <input type="number" className={numCls} min={0} step="0.5"
                  value={passingMarks} onChange={e => setPassingMarks(e.target.value)} />
              </div>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="label">Positive Marks (correct)</label>
                <input type="number" className={numCls} min={0} step="0.25"
                  value={posMarks} onChange={e => setPosMarks(e.target.value)} />
              </div>
              <div>
                <label className="label">Negative Marks (wrong)</label>
                <input type="number" className={numCls} min={0} step="0.25"
                  value={negMarks} onChange={e => setNegMarks(e.target.value)} />
              </div>
              <div>
                <label className="label">Max Attempts Per Student</label>
                <input type="number" className={numCls} min={1} max={100}
                  value={maxAttempts} onChange={e => setMaxAttempts(e.target.value)} />
                <p className="text-xs text-slate-400 mt-1">
                  {Number(maxAttempts) === 1 ? 'No retakes allowed' : `${maxAttempts} attempts allowed`}
                </p>
              </div>
            </div>

            {/* Randomize toggle */}
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <input type="checkbox" className="sr-only peer"
                  checked={randomize} onChange={e => setRandomize(e.target.checked)} />
                <div className="w-10 h-5 bg-slate-200 rounded-full peer-checked:bg-teal transition-colors" />
                <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow
                                transition-transform peer-checked:translate-x-5" />
              </div>
              <span className="text-sm text-slate-700 font-medium">Randomize question order</span>
            </label>

          </div>

          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-100">
            <Link to="/admin/dashboard" className="btn-ghost">Cancel</Link>
            <button type="submit" disabled={loading} className="btn-amber">
              {loading ? 'Creating…' : <><Save size={14} /> Create Exam</>}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
