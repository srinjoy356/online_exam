/**
 * pages/admin/ExamResults.jsx
 * ---------------------------
 * Shows every student attempt for a given exam with full result breakdown.
 * Accessible from ExamDetail via a "Results" button.
 */
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Trophy, Users, CheckCircle2, XCircle, MinusCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import Navbar from '../../components/common/Navbar'
import { adminApi } from '../../api/services'

export default function ExamResults() {
  const { examId } = useParams()
  const [rows,    setRows]    = useState([])
  const [exam,    setExam]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([adminApi.getExam(examId), adminApi.getExamResults(examId)])
      .then(([examRes, resultsRes]) => {
        setExam(examRes.data)
        setRows(resultsRes.data)
      })
      .catch(() => toast.error('Failed to load results.'))
      .finally(() => setLoading(false))
  }, [examId])

  const passed  = rows.filter(r => r.is_passed).length
  const failed  = rows.filter(r => !r.is_passed).length
  const avgScore = rows.length
    ? (rows.reduce((s, r) => s + r.total_marks, 0) / rows.length).toFixed(1)
    : '—'

  return (
    <div className="page-wrap">
      <Navbar />
      <main className="container-lg py-10">

        {/* Header */}
        <div className="flex items-start gap-3 mb-6 animate-fade-up">
          <Link to={`/admin/exams/${examId}`} className="btn-ghost px-2 mt-1">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <p className="text-xs text-slate-400 font-mono mb-0.5">Exam Results</p>
            <h1 className="text-2xl font-display font-bold text-ink">
              {exam?.exam_name ?? 'Loading…'}
            </h1>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 animate-stagger">
          <StatCard label="Total Attempts" value={rows.length}  color="ink" />
          <StatCard label="Passed"         value={passed}       color="teal" />
          <StatCard label="Failed"         value={failed}       color="coral" />
          <StatCard label="Avg Score"      value={avgScore}     color="amber" />
        </div>

        {/* Results table */}
        <div className="card animate-fade-up" style={{ animationDelay: '0.2s' }}>
          <h2 className="font-display font-bold text-ink mb-4 flex items-center gap-2">
            <Users size={17} /> Attempt Records
          </h2>

          {loading ? (
            <div className="text-center py-12 text-slate-400">Loading…</div>
          ) : rows.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              No students have attempted this exam yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left">
                    {['Code', 'Name', 'Correct', 'Wrong', 'Skipped', 'Marks', 'Result', 'Date'].map(h => (
                      <th key={h} className="pb-2 pr-4 text-xs text-slate-400 font-semibold uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                    <th className="pb-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {rows.map(row => (
                    <tr key={row.attempt_id} className="hover:bg-slate-50 group">
                      <td className="py-3 pr-4 font-mono font-medium text-ink text-xs">
                        {row.student_code}
                      </td>
                      <td className="py-3 pr-4 text-ink font-medium">
                        <Link to={`/admin/students/${row.student_id}`}
                              className="hover:text-teal hover:underline">
                          {row.student_name}
                        </Link>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="flex items-center gap-1 text-teal-dark font-medium">
                          <CheckCircle2 size={13} /> {row.correct_answers}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="flex items-center gap-1 text-coral font-medium">
                          <XCircle size={13} /> {row.incorrect_answers}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="flex items-center gap-1 text-slate-400">
                          <MinusCircle size={13} /> {row.unattempted}
                        </span>
                      </td>
                      <td className="py-3 pr-4 font-bold text-ink">
                        {row.total_marks.toFixed(1)}
                      </td>
                      <td className="py-3 pr-4">
                        {row.is_passed
                          ? <span className="badge-pass">Pass</span>
                          : <span className="badge-fail">Fail</span>}
                      </td>
                      <td className="py-3 pr-4 text-xs text-slate-400">
                        {row.submitted_at
                          ? new Date(row.submitted_at).toLocaleDateString()
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function StatCard({ label, value, color }) {
  const styles = {
    ink:   'bg-ink text-cream',
    teal:  'bg-teal/10 text-teal-dark border border-teal/20',
    coral: 'bg-coral/10 text-coral border border-coral/20',
    amber: 'bg-amber/10 text-amber-dark border border-amber/20',
  }
  return (
    <div className={`rounded-2xl p-5 ${styles[color]}`}>
      <p className={`text-3xl font-display font-bold ${color === 'ink' ? 'text-amber' : ''}`}>
        {value}
      </p>
      <p className={`text-sm mt-1 ${color === 'ink' ? 'text-slate-400' : 'opacity-80'}`}>
        {label}
      </p>
    </div>
  )
}
