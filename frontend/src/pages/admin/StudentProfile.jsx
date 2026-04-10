/**
 * pages/admin/StudentProfile.jsx
 * --------------------------------
 * Admin view of a single student: average score card + full attempt history.
 */
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, GraduationCap, CheckCircle2, XCircle,
  MinusCircle, TrendingUp, BookOpen,
} from 'lucide-react'
import toast from 'react-hot-toast'
import Navbar from '../../components/common/Navbar'
import { adminApi } from '../../api/services'

export default function StudentProfile() {
  const { studentId } = useParams()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi.getStudentProfile(studentId)
      .then(r => setProfile(r.data))
      .catch(() => toast.error('Failed to load student profile.'))
      .finally(() => setLoading(false))
  }, [studentId])

  if (loading) return (
    <div className="page-wrap"><Navbar />
      <div className="flex items-center justify-center h-64 text-slate-400">Loading…</div>
    </div>
  )

  if (!profile) return (
    <div className="page-wrap"><Navbar />
      <div className="flex items-center justify-center h-64 text-coral">Student not found.</div>
    </div>
  )

  const passed = profile.attempts.filter(a => a.is_passed).length
  const failed = profile.attempts.length - passed

  return (
    <div className="page-wrap">
      <Navbar />
      <main className="container-md py-10">

        {/* Header */}
        <div className="flex items-start gap-3 mb-6 animate-fade-up">
          <Link to="/admin/students" className="btn-ghost px-2 mt-1">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <p className="text-xs text-slate-400 font-mono mb-0.5">Student Profile</p>
            <h1 className="text-2xl font-display font-bold text-ink">{profile.student_name}</h1>
            <p className="text-slate-400 text-sm font-mono">{profile.student_code}</p>
          </div>
        </div>

        {/* Average score hero */}
        <div className="rounded-3xl bg-ink text-cream p-7 mb-6 animate-fade-up flex flex-col sm:flex-row items-center gap-6">
          <div className="flex-1">
            <p className="text-slate-400 text-sm mb-1">Overall Average Score</p>
            <p className="text-6xl font-display font-extrabold text-amber">
              {profile.average_score.toFixed(1)}
            </p>
            <p className="text-slate-400 text-sm mt-1">across {profile.total_attempts} attempt{profile.total_attempts !== 1 ? 's' : ''}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-white/5 rounded-2xl px-5 py-4">
              <p className="text-2xl font-display font-bold text-teal">{passed}</p>
              <p className="text-xs text-slate-400 mt-0.5">Passed</p>
            </div>
            <div className="bg-white/5 rounded-2xl px-5 py-4">
              <p className="text-2xl font-display font-bold text-coral">{failed}</p>
              <p className="text-xs text-slate-400 mt-0.5">Failed</p>
            </div>
          </div>
        </div>

        {/* Attempt history table */}
        <div className="card animate-fade-up" style={{ animationDelay: '0.15s' }}>
          <h2 className="font-display font-bold text-ink mb-4 flex items-center gap-2">
            <BookOpen size={17} /> Exam Attempt History
          </h2>

          {profile.attempts.length === 0 ? (
            <p className="text-center text-slate-400 py-10">This student hasn't taken any exams yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left">
                    {['Exam', 'Correct', 'Wrong', 'Skipped', 'Marks', 'Result', 'Date'].map(h => (
                      <th key={h} className="pb-2 pr-4 text-xs text-slate-400 font-semibold uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {profile.attempts.map(a => (
                    <tr key={a.attempt_id} className="hover:bg-slate-50">
                      <td className="py-3 pr-4 font-medium text-ink">
                        <Link to={`/admin/exams/${a.exam_id}/results`}
                              className="hover:text-teal hover:underline">
                          {a.exam_name}
                        </Link>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="flex items-center gap-1 text-teal-dark font-medium">
                          <CheckCircle2 size={13} /> {a.correct_answers}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="flex items-center gap-1 text-coral font-medium">
                          <XCircle size={13} /> {a.incorrect_answers}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="flex items-center gap-1 text-slate-400">
                          <MinusCircle size={13} /> {a.unattempted}
                        </span>
                      </td>
                      <td className="py-3 pr-4 font-bold text-ink">{a.total_marks.toFixed(1)}</td>
                      <td className="py-3 pr-4">
                        {a.is_passed
                          ? <span className="badge-pass">Pass</span>
                          : <span className="badge-fail">Fail</span>}
                      </td>
                      <td className="py-3 text-xs text-slate-400">
                        {a.submitted_at ? new Date(a.submitted_at).toLocaleDateString() : '—'}
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
