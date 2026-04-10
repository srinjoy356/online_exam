/**
 * pages/student/ExamInterface.jsx
 * --------------------------------
 * Full exam-taking experience:
 *  • Fetches questions from the backend on mount.
 *  • Countdown timer with auto-submit on expiry.
 *  • Next / Previous navigation.
 *  • Question palette (jump to any question).
 *  • Stores answers in local state; submits all at once.
 */
import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Clock, Send, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import Navbar from '../../components/common/Navbar'
import { studentApi } from '../../api/services'

export default function ExamInterface() {
  const { examId } = useParams()
  const navigate   = useNavigate()

  // ── Exam state ─────────────────────────────────────────
  const [attemptId,  setAttemptId]  = useState(null)
  const [questions,  setQuestions]  = useState([])
  const [timeLimitMins, setTimeLimitMins] = useState(30)
  const [answers,    setAnswers]    = useState({})    // { question_id: option_id | null }
  const [current,   setCurrent]    = useState(0)
  const [loading,   setLoading]    = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [timeLeft,   setTimeLeft]   = useState(null)  // seconds

  const timerRef = useRef(null)
  const submitted = useRef(false)

  // ── Start exam ─────────────────────────────────────────
  useEffect(() => {
    studentApi.startExam(examId)
      .then(({ data }) => {
        setAttemptId(data.attempt_id)
        setQuestions(data.questions)
        setTimeLimitMins(data.time_limit_mins)
        const secs = data.time_limit_mins * 60
        setTimeLeft(secs)
        // init blank answers
        const blank = {}
        data.questions.forEach(q => { blank[q.id] = null })
        setAnswers(blank)
      })
      .catch(err => {
        toast.error(err.message || 'Could not load exam.')
        navigate('/student/exams')
      })
      .finally(() => setLoading(false))
  }, [examId])

  // ── Countdown timer ────────────────────────────────────
  const handleSubmit = useCallback(async (autoSubmit = false) => {
    if (submitted.current) return
    submitted.current = true
    clearInterval(timerRef.current)
    if (autoSubmit) toast('⏱ Time up! Submitting automatically…', { duration: 4000 })

    setSubmitting(true)
    try {
      const responses = Object.entries(answers).map(([qId, optId]) => ({
        question_id:        Number(qId),
        selected_option_id: optId,
      }))
      await studentApi.submitExam({ attempt_id: attemptId, responses })
      navigate(`/student/results/${attemptId}`)
    } catch (err) {
      toast.error(err.message || 'Submission failed. Please try again.')
      submitted.current = false
      setSubmitting(false)
    }
  }, [answers, attemptId, navigate])

  useEffect(() => {
    if (timeLeft === null) return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current)
          handleSubmit(true)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [timeLeft === null, handleSubmit])  // only restart when exam loads

  // ── Helpers ────────────────────────────────────────────
  const selectOption = (questionId, optionId) => {
    setAnswers(a => ({ ...a, [questionId]: optionId }))
  }

  const formatTime = (secs) => {
    if (secs === null) return '--:--'
    const m = Math.floor(secs / 60).toString().padStart(2,'0')
    const s = (secs % 60).toString().padStart(2,'0')
    return `${m}:${s}`
  }

  const answeredCount = Object.values(answers).filter(v => v !== null).length
  const q = questions[current]
  const isWarning = timeLeft !== null && timeLeft <= 60

  // ── Loading state ──────────────────────────────────────
  if (loading) return (
    <div className="page-wrap"><Navbar/>
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin"/>
        <p className="text-slate-400 text-sm">Loading exam…</p>
      </div>
    </div>
  )

  return (
    <div className="page-wrap">
      <Navbar/>
      <main className="max-w-4xl mx-auto px-4 py-6">

        {/* ── Top bar ── */}
        <div className="flex items-center justify-between mb-6 animate-fade-up">
          <div>
            <p className="text-xs text-slate-400 font-mono">Question {current+1} of {questions.length}</p>
            <div className="w-48 h-1.5 bg-slate-200 rounded-full mt-1.5 overflow-hidden">
              <div className="h-full bg-teal rounded-full transition-all duration-300"
                   style={{ width: `${((current+1)/questions.length)*100}%` }}/>
            </div>
          </div>

          {/* Timer */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-sm font-bold
                           transition-colors ${isWarning
                             ? 'bg-coral/10 text-coral animate-pulse'
                             : 'bg-slate-100 text-ink'}`}>
            <Clock size={15}/>
            {formatTime(timeLeft)}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">

          {/* ── Question area ── */}
          <div className="lg:col-span-3 space-y-4">

            {/* Question card */}
            <div className="card animate-fade-up">
              <div className="flex items-start gap-3 mb-6">
                <span className="w-8 h-8 rounded-lg bg-ink text-cream text-sm font-mono font-bold
                                 flex items-center justify-center shrink-0 mt-0.5">
                  {current+1}
                </span>
                <p className="text-ink font-medium leading-relaxed">{q?.question_text}</p>
              </div>

              {/* Options */}
              <div className="space-y-3">
                {q?.options.map((opt) => {
                  const selected = answers[q.id] === opt.id
                  return (
                    <button key={opt.id}
                            onClick={() => selectOption(q.id, opt.id)}
                            className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl
                                        border-2 transition-all duration-150 text-sm
                                        ${selected
                                          ? 'border-teal bg-teal/5 text-teal-dark font-medium'
                                          : 'border-slate-100 hover:border-teal/30 hover:bg-teal/5 text-slate-700'
                                        }`}>
                      <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0
                                        ${selected ? 'border-teal bg-teal' : 'border-slate-300'}`}>
                        {selected && <span className="w-2 h-2 rounded-full bg-white"/>}
                      </span>
                      {opt.option_text}
                    </button>
                  )
                })}
              </div>

              {/* Skip note */}
              {answers[q?.id] !== null && (
                <button onClick={() => selectOption(q.id, null)}
                        className="mt-3 text-xs text-slate-400 hover:text-coral transition-colors">
                  Clear selection
                </button>
              )}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <button onClick={() => setCurrent(c => c-1)} disabled={current === 0}
                      className="btn-ghost disabled:opacity-30">
                <ChevronLeft size={16}/> Previous
              </button>

              {current < questions.length - 1 ? (
                <button onClick={() => setCurrent(c => c+1)} className="btn-teal">
                  Next <ChevronRight size={16}/>
                </button>
              ) : (
                <button onClick={() => handleSubmit(false)} disabled={submitting}
                        className="btn-amber">
                  {submitting ? 'Submitting…' : <><Send size={14}/> Submit Exam</>}
                </button>
              )}
            </div>
          </div>

          {/* ── Question palette ── */}
          <div className="lg:col-span-1">
            <div className="card sticky top-20">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Question Map
              </p>
              <div className="grid grid-cols-5 gap-1.5">
                {questions.map((q2, idx) => {
                  const isAnswered = answers[q2.id] !== null
                  const isCurrent  = idx === current
                  return (
                    <button key={q2.id}
                            onClick={() => setCurrent(idx)}
                            className={`aspect-square rounded-md text-xs font-mono font-bold
                                        transition-all
                                        ${isCurrent  ? 'ring-2 ring-teal ring-offset-1 bg-teal text-white'
                                        : isAnswered ? 'bg-teal/20 text-teal-dark'
                                        :              'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>
                      {idx+1}
                    </button>
                  )
                })}
              </div>

              <div className="mt-4 space-y-1.5 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded bg-teal/20 inline-block"/>Answered ({answeredCount})
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded bg-slate-100 inline-block"/>Skipped ({questions.length - answeredCount})
                </div>
              </div>

              {/* Submit button (sidebar) */}
              <button onClick={() => handleSubmit(false)} disabled={submitting}
                      className="btn-amber w-full justify-center mt-4 text-xs">
                {submitting ? 'Submitting…' : <><Send size={12}/> Submit</>}
              </button>

              {answeredCount < questions.length && (
                <p className="text-[10px] text-slate-400 mt-2 flex items-start gap-1">
                  <AlertTriangle size={11} className="shrink-0 mt-0.5 text-amber-dark"/>
                  {questions.length - answeredCount} unanswered question(s)
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
