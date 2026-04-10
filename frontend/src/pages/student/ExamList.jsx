/**
 * pages/student/ExamList.jsx
 * Shows overall stats summary + available exams with attempt status per exam.
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Clock, CheckCircle2, TrendingUp, Trophy, XCircle, Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import Navbar from '../../components/common/Navbar'
import { studentApi } from '../../api/services'
import { useAuth } from '../../context/AuthContext'

export default function ExamList() {
  const { userName } = useAuth()
  const navigate     = useNavigate()

  const [exams,    setExams]    = useState([])
  const [stats,    setStats]    = useState(null)
  const [statuses, setStatuses] = useState({})   // examId → AttemptStatusOut
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    Promise.all([studentApi.listExams(), studentApi.getStats()])
      .then(async ([examsRes, statsRes]) => {
        const examList = examsRes.data
        setExams(examList)
        setStats(statsRes.data)

        // Fetch attempt status for every exam in parallel
        const statusResults = await Promise.all(
          examList.map(e =>
            studentApi.getAttemptStatus(e.id)
              .then(r => [e.id, r.data])
              .catch(() => [e.id, null])
          )
        )
        const statusMap = {}
        statusResults.forEach(([id, data]) => { statusMap[id] = data })
        setStatuses(statusMap)
      })
      .catch(() => toast.error('Failed to load exams.'))
      .finally(() => setLoading(false))
  }, [])

  const handleStart = (examId, canAttempt) => {
    if (!canAttempt) { toast.error('You have used all allowed attempts for this exam.'); return }
    navigate(`/student/exams/${examId}/take`)
  }

  return (
    <div className="page-wrap">
      <Navbar />
      <main className="container-md py-10">

        <div className="mb-6 animate-fade-up">
          <p className="text-slate-400 text-sm font-mono">Hello,</p>
          <h1 className="text-3xl font-display font-bold text-ink">{userName}</h1>
        </div>

        {/* Stats summary card */}
        {stats && (
          <div className="rounded-2xl bg-ink text-cream p-6 mb-6 animate-fade-up">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
              <TrendingUp size={13} /> Your Performance
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <MiniStat label="Avg Score"    value={stats.average_score.toFixed(1)} accent="amber" />
              <MiniStat label="Attempts"     value={stats.total_attempts}           accent="slate" />
              <MiniStat label="Passed"       value={stats.exams_passed}             accent="teal" />
              <MiniStat label="Failed"       value={stats.exams_failed}             accent="coral" />
            </div>
          </div>
        )}

        {/* Exam list */}
        {loading ? (
          <div className="text-center py-20 text-slate-400">Loading exams…</div>
        ) : exams.length === 0 ? (
          <div className="card text-center py-16">
            <BookOpen size={32} className="mx-auto mb-3 text-slate-300" />
            <p className="font-display font-bold text-ink mb-1">No exams available</p>
            <p className="text-slate-400 text-sm">Your institute hasn't published any exams yet.</p>
          </div>
        ) : (
          <div className="space-y-4 animate-stagger">
            {exams.map(exam => {
              const status = statuses[exam.id]
              const canAttempt = status?.can_attempt ?? true
              return (
                <ExamCard
                  key={exam.id}
                  exam={exam}
                  status={status}
                  onStart={() => handleStart(exam.id, canAttempt)}
                />
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

function MiniStat({ label, value, accent }) {
  const color = accent === 'amber' ? 'text-amber'
              : accent === 'teal'  ? 'text-teal'
              : accent === 'coral' ? 'text-coral'
              : 'text-slate-300'
  return (
    <div>
      <p className={`text-2xl font-display font-bold ${color}`}>{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  )
}

function ExamCard({ exam, status, onStart }) {
  const used        = status?.attempts_used ?? 0
  const max         = status?.max_attempts  ?? exam.max_attempts ?? 1
  const canAttempt  = status?.can_attempt   ?? true
  const pct         = max > 0 ? Math.round((used / max) * 100) : 100

  return (
    <div className={`card border transition-all group
                     ${canAttempt
                       ? 'border-slate-100 hover:border-teal/30 hover:shadow-md'
                       : 'border-slate-100 opacity-75'}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0
                           ${canAttempt ? 'bg-teal/10' : 'bg-slate-100'}`}>
            {canAttempt
              ? <BookOpen size={18} className="text-teal-dark" />
              : <Lock size={18} className="text-slate-400" />}
          </div>
          <div>
            <h2 className="font-display font-bold text-ink text-lg">{exam.exam_name}</h2>
            <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <CheckCircle2 size={11} className="text-teal" /> {exam.num_questions} Q
              </span>
              <span className="flex items-center gap-1">
                <Clock size={11} className="text-amber-dark" /> {exam.time_limit_mins} min
              </span>
              <span>
                <span className="text-teal-dark font-semibold">+{exam.positive_marks}</span>
                {' / '}
                <span className="text-coral font-semibold">-{exam.negative_marks}</span>
              </span>
              <span>Pass: <strong className="text-ink">{exam.passing_marks}</strong></span>
            </div>

            {/* Attempt usage bar */}
            <div className="mt-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-slate-400">
                  {used} / {max} attempt{max !== 1 ? 's' : ''} used
                </span>
                {!canAttempt && (
                  <span className="badge-fail text-[10px]">Max reached</span>
                )}
              </div>
              <div className="w-40 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${canAttempt ? 'bg-teal' : 'bg-coral'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={onStart}
          disabled={!canAttempt}
          className={canAttempt ? 'btn-teal shrink-0' : 'btn-ghost shrink-0 opacity-50 cursor-not-allowed'}
        >
          {canAttempt ? 'Start Exam' : 'Locked'}
        </button>
      </div>
    </div>
  )
}
