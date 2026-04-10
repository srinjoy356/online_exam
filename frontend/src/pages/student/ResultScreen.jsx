/**
 * pages/student/ResultScreen.jsx
 * --------------------------------
 * Displays the result after exam submission.
 * Also accessible via GET /student/results/:attemptId for review.
 */
import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  CheckCircle2, XCircle, MinusCircle,
  Trophy, ArrowRight, BookOpen
} from 'lucide-react'
import toast from 'react-hot-toast'
import Navbar from '../../components/common/Navbar'
import { studentApi } from '../../api/services'

export default function ResultScreen() {
  const { attemptId } = useParams()
  const navigate      = useNavigate()
  const [result,   setResult]   = useState(null)
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    studentApi.getResult(attemptId)
      .then(r => setResult(r.data))
      .catch(err => {
        toast.error(err.message || 'Could not load result.')
        navigate('/student/exams')
      })
      .finally(() => setLoading(false))
  }, [attemptId])

  if (loading) return (
    <div className="page-wrap"><Navbar/>
      <div className="flex items-center justify-center h-64 text-slate-400">Loading result…</div>
    </div>
  )

  if (!result) return null

  const pct = result.total_questions > 0
    ? Math.round((result.correct_answers / result.total_questions) * 100)
    : 0

  return (
    <div className="page-wrap">
      <Navbar/>
      <main className="container-md py-10">

        {/* Hero result card */}
        <div className={`rounded-3xl p-8 text-center mb-6 animate-fade-up
                         ${result.is_passed ? 'bg-teal text-white' : 'bg-ink text-cream'}`}>

          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl
                          bg-white/10 mb-4">
            {result.is_passed
              ? <Trophy size={32} className="text-amber"/>
              : <XCircle size={32} className="text-coral"/>
            }
          </div>

          <h1 className="text-4xl font-display font-extrabold mb-1">
            {result.is_passed ? 'You Passed!' : 'Not Passed'}
          </h1>
          <p className="text-white/70 mb-5">{result.exam_name}</p>

          {/* Score ring */}
          <div className="relative inline-flex items-center justify-center mb-5">
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,.15)" strokeWidth="8"/>
              <circle cx="60" cy="60" r="52" fill="none"
                      stroke="rgba(255,255,255,.9)" strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray="326.7"
                      strokeDashoffset={326.7 * (1 - pct/100)}
                      transform="rotate(-90 60 60)"/>
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-display font-black">{pct}%</span>
              <span className="text-xs text-white/70">score</span>
            </div>
          </div>

          <p className="text-2xl font-display font-bold">
            {result.total_marks.toFixed(1)}
            <span className="text-base font-normal text-white/60 ml-1">marks</span>
          </p>
          <p className="text-sm text-white/60 mt-1">
            Pass mark: {result.passing_marks}
          </p>
        </div>

        {/* Breakdown grid */}
        <div className="grid grid-cols-3 gap-4 mb-6 animate-stagger">
          <StatBox
            icon={<CheckCircle2 size={20} className="text-teal"/>}
            label="Correct"
            value={result.correct_answers}
            color="teal"
          />
          <StatBox
            icon={<XCircle size={20} className="text-coral"/>}
            label="Incorrect"
            value={result.incorrect_answers}
            color="coral"
          />
          <StatBox
            icon={<MinusCircle size={20} className="text-slate-400"/>}
            label="Skipped"
            value={result.unattempted}
            color="slate"
          />
        </div>

        {/* Detailed stats card */}
        <div className="card animate-fade-up mb-6" style={{animationDelay:'0.2s'}}>
          <h2 className="font-display font-bold text-ink mb-4">Detailed Breakdown</h2>
          <div className="space-y-3">
            <StatRow label="Total Questions"    value={result.total_questions}/>
            <StatRow label="Correct Answers"    value={result.correct_answers}   color="teal"/>
            <StatRow label="Wrong Answers"      value={result.incorrect_answers} color="coral"/>
            <StatRow label="Unattempted"        value={result.unattempted}       color="slate"/>
            <div className="border-t border-slate-100 pt-3">
              <StatRow label="Total Marks Scored" value={result.total_marks.toFixed(2)}     bold/>
              <StatRow label="Passing Mark"        value={result.passing_marks.toFixed(2)}  bold/>
              <StatRow label="Result"
                value={result.is_passed ? '✅ PASS' : '❌ FAIL'}
                color={result.is_passed ? 'teal' : 'coral'} bold/>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-center animate-fade-up" style={{animationDelay:'0.3s'}}>
          <Link to="/student/exams" className="btn-primary">
            <BookOpen size={14}/> Back to Exams
          </Link>
        </div>
      </main>
    </div>
  )
}

function StatBox({ icon, label, value, color }) {
  const bg = color === 'teal'  ? 'bg-teal/5  border-teal/20'
           : color === 'coral' ? 'bg-coral/5 border-coral/20'
           :                     'bg-slate-50 border-slate-200'
  return (
    <div className={`rounded-2xl border p-4 text-center ${bg}`}>
      <div className="flex justify-center mb-2">{icon}</div>
      <p className="text-2xl font-display font-bold text-ink">{value}</p>
      <p className="text-xs text-slate-400 mt-0.5">{label}</p>
    </div>
  )
}

function StatRow({ label, value, color, bold }) {
  const textColor = color === 'teal'  ? 'text-teal-dark'
                  : color === 'coral' ? 'text-coral'
                  : color === 'slate' ? 'text-slate-400'
                  :                     'text-ink'
  return (
    <div className="flex items-center justify-between py-1">
      <span className={`text-sm ${bold ? 'font-semibold text-ink' : 'text-slate-500'}`}>{label}</span>
      <span className={`text-sm ${bold ? 'font-bold' : 'font-medium'} ${textColor}`}>{value}</span>
    </div>
  )
}
