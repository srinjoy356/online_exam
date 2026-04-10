/**
 * components/common/Navbar.jsx
 * ----------------------------
 * Top navigation bar shown on all authenticated pages.
 */
import { Link, useNavigate } from 'react-router-dom'
import { LogOut, BookOpen, Users, LayoutDashboard, ClipboardList } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

export default function Navbar() {
  const { isAdmin, isStudent, userName, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    navigate('/')
  }

  return (
    <nav className="sticky top-0 z-50 bg-ink text-cream shadow-lg">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">

        {/* Brand */}
        <Link to={isAdmin ? '/admin/dashboard' : '/student/exams'}
              className="flex items-center gap-2 font-display font-bold text-lg tracking-tight">
          <BookOpen size={20} className="text-amber" />
          <span>ExamPortal</span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {isAdmin && (
            <>
              <NavLink to="/admin/dashboard" icon={<LayoutDashboard size={15}/>} label="Dashboard"/>
              <NavLink to="/admin/students"  icon={<Users size={15}/>}           label="Students"/>
            </>
          )}
          {isStudent && (
            <NavLink to="/student/exams" icon={<ClipboardList size={15}/>} label="My Exams"/>
          )}

          {/* User pill */}
          <div className="ml-3 flex items-center gap-3 pl-3 border-l border-white/10">
            <span className="text-xs text-slate-400 hidden sm:block">
              {userName}
              <span className="ml-1 text-amber font-mono text-[10px]">
                [{isAdmin ? 'admin' : 'student'}]
              </span>
            </span>
            <button onClick={handleLogout}
                    className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-coral transition-colors">
              <LogOut size={14}/> Logout
            </button>
          </div>
        </div>

      </div>
    </nav>
  )
}

function NavLink({ to, icon, label }) {
  return (
    <Link to={to}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-300
                     hover:bg-white/10 hover:text-cream transition-all">
      {icon}{label}
    </Link>
  )
}
