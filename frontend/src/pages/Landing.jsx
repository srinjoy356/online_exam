/**
 * pages/Landing.jsx
 * -----------------
 * Public home page with role-selection cards.
 */
import { useNavigate } from 'react-router-dom'
import { BookOpen, ShieldCheck, GraduationCap, ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useEffect } from 'react'

export default function Landing() {
  const navigate  = useNavigate()
  const { session, role } = useAuth()

  // Auto-redirect if already logged in
  useEffect(() => {
    if (session) {
      navigate(role === 'admin' ? '/admin/dashboard' : '/student/exams', { replace: true })
    }
  }, [session, role, navigate])

  return (
    <div className="min-h-screen bg-ink flex flex-col">

      {/* Hero */}
      <header className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20">
        <div className="animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full
                          border border-amber/30 bg-amber/10 text-amber text-xs font-mono mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-amber animate-pulse-dot"/>
            Production-Ready Examination Platform
          </div>

          <h1 className="text-5xl sm:text-7xl font-display font-extrabold text-cream mb-4 leading-none tracking-tight">
            Exam<span className="text-amber">Portal</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-md mx-auto mb-12 font-body">
            A secure, timed, auto-scored examination system for modern institutions.
          </p>

          {/* Role cards */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <RoleCard
              icon={<ShieldCheck size={28} className="text-amber"/>}
              title="Admin Portal"
              subtitle="Manage exams, questions & students"
              onClick={() => navigate('/admin/login')}
              accent="amber"
            />
            <RoleCard
              icon={<GraduationCap size={28} className="text-teal"/>}
              title="Student Portal"
              subtitle="Take exams & view your results"
              onClick={() => navigate('/student/login')}
              accent="teal"
            />
          </div>
        </div>
      </header>

      {/* Footer */}
      <footer className="text-center py-6 text-slate-600 text-xs font-mono border-t border-white/5">
        ExamPortal v1.0 · Built with FastAPI + React
      </footer>
    </div>
  )
}

function RoleCard({ icon, title, subtitle, onClick, accent }) {
  const border = accent === 'amber' ? 'hover:border-amber/50 hover:bg-amber/5'
                                    : 'hover:border-teal/50 hover:bg-teal/5'
  return (
    <button
      onClick={onClick}
      className={`group w-64 text-left p-6 rounded-2xl border border-white/10
                  bg-white/5 backdrop-blur transition-all duration-200 ${border}`}
    >
      <div className="mb-4">{icon}</div>
      <p className="font-display font-bold text-cream text-lg mb-1">{title}</p>
      <p className="text-slate-400 text-sm mb-4">{subtitle}</p>
      <div className={`flex items-center gap-1 text-xs font-medium
                       ${accent === 'amber' ? 'text-amber' : 'text-teal'}
                       group-hover:gap-2 transition-all`}>
        Get started <ArrowRight size={13}/>
      </div>
    </button>
  )
}
