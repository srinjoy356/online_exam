/**
 * pages/admin/AdminDashboard.jsx
 * --------------------------------
 * Overview: lists all exams with quick actions.
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, BookOpen, Trash2, Eye, Users, Clock, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import Navbar from '../../components/common/Navbar'
import { adminApi } from '../../api/services'
import { useAuth } from '../../context/AuthContext'

export default function AdminDashboard() {
  const { userName } = useAuth()
  const [exams,   setExams]   = useState([])
  const [loading, setLoading] = useState(true)

  const fetchExams = async () => {
    try {
      const { data } = await adminApi.listExams()
      setExams(data)
    } catch (err) {
      toast.error('Failed to load exams.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchExams() }, [])

  const handleDelete = async (id, name) => {
    if (!confirm(`Deactivate exam "${name}"?`)) return
    try {
      await adminApi.deleteExam(id)
      toast.success('Exam deactivated.')
      fetchExams()
    } catch (err) {
      toast.error(err.message || 'Delete failed.')
    }
  }

  return (
    <div className="page-wrap">
      <Navbar/>

      <main className="container-lg py-10">
        {/* Page header */}
        <div className="flex items-start justify-between mb-8 animate-fade-up">
          <div>
            <p className="text-slate-500 text-sm font-mono mb-1">Welcome back,</p>
            <h1 className="text-3xl font-display font-bold text-ink">{userName}</h1>
          </div>
          <div className="flex gap-2">
            <Link to="/admin/students" className="btn-ghost">
              <Users size={15}/> Students
            </Link>
            <Link to="/admin/exams/new" className="btn-amber">
              <Plus size={15}/> New Exam
            </Link>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8 animate-stagger">
          <StatCard label="Total Exams"  value={exams.length}                       color="amber"/>
          <StatCard label="Active Exams" value={exams.filter(e => e.is_active).length} color="teal"/>
          <StatCard label="Avg Questions" value={
            exams.length ? Math.round(exams.reduce((s,e)=>s+e.num_questions,0)/exams.length) : 0
          } color="ink"/>
        </div>

        {/* Exams table */}
        <div className="card animate-fade-up" style={{animationDelay:'0.15s'}}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-bold text-lg text-ink">Your Exams</h2>
            <span className="badge-info">{exams.length} exams</span>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-400">Loading…</div>
          ) : exams.length === 0 ? (
            <EmptyState/>
          ) : (
            <div className="space-y-3">
              {exams.map(exam => (
                <ExamRow key={exam.id} exam={exam} onDelete={handleDelete}/>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function StatCard({ label, value, color }) {
  const bg = color === 'amber' ? 'bg-amber/10 text-amber-dark'
           : color === 'teal'  ? 'bg-teal/10 text-teal-dark'
           :                     'bg-ink text-cream'
  return (
    <div className={`rounded-2xl p-5 ${color === 'ink' ? 'bg-ink text-cream' : 'bg-white border border-slate-100'}`}>
      <p className={`text-3xl font-display font-bold ${color === 'ink' ? 'text-amber' : 'text-ink'}`}>{value}</p>
      <p className={`text-sm mt-1 ${color === 'ink' ? 'text-slate-400' : 'text-slate-500'}`}>{label}</p>
    </div>
  )
}

function ExamRow({ exam, onDelete }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-amber/30 hover:bg-amber/5 transition-all group">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-amber/10 flex items-center justify-center shrink-0">
          <BookOpen size={16} className="text-amber-dark"/>
        </div>
        <div>
          <p className="font-semibold text-ink text-sm">{exam.exam_name}</p>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <CheckCircle2 size={11}/> {exam.num_questions} Q
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Clock size={11}/> {exam.time_limit_mins} min
            </span>
            {!exam.is_active && <span className="badge-fail text-[10px]">Inactive</span>}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Link to={`/admin/exams/${exam.id}`}
              className="btn-ghost text-xs px-2.5 py-1.5">
          <Eye size={13}/> Manage
        </Link>
        <button onClick={() => onDelete(exam.id, exam.exam_name)}
                className="btn-ghost text-xs px-2.5 py-1.5 hover:text-coral">
          <Trash2 size={13}/>
        </button>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <div className="w-14 h-14 rounded-2xl bg-amber/10 flex items-center justify-center mx-auto mb-4">
        <BookOpen size={24} className="text-amber"/>
      </div>
      <p className="font-display font-bold text-ink mb-1">No exams yet</p>
      <p className="text-slate-400 text-sm mb-5">Create your first exam to get started.</p>
      <Link to="/admin/exams/new" className="btn-amber">
        <Plus size={14}/> Create Exam
      </Link>
    </div>
  )
}
