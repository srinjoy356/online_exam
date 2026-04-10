/**
 * pages/student/StudentLogin.jsx
 */
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogIn, GraduationCap } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi } from '../../api/services'
import { useAuth } from '../../context/AuthContext'

export default function StudentLogin() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form, setForm]       = useState({ student_code: '', student_name: '', institute_id: '' })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    const { student_code, student_name, institute_id } = form
    if (!student_code || !student_name || !institute_id) {
      toast.error('All fields are required.'); return
    }
    setLoading(true)
    try {
      const { data } = await authApi.studentLogin({
        student_code,
        student_name,
        institute_id: Number(institute_id),
      })
      login(data)
      toast.success(`Welcome, ${data.user_name}!`)
      navigate('/student/exams')
    } catch (err) {
      toast.error(err.message || 'Login failed. Check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-4">
      <div className="w-full max-w-sm animate-fade-up">

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-teal/20 mb-4">
            <GraduationCap size={22} className="text-teal"/>
          </div>
          <h1 className="text-2xl font-display font-bold text-cream">Student Login</h1>
          <p className="text-slate-400 text-sm mt-1">Enter your details to access your exams</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label text-slate-400">Institute ID</label>
            <input name="institute_id" value={form.institute_id} onChange={handleChange}
                   type="number"
                   className="input bg-white/5 border-white/10 text-cream placeholder-slate-600
                              focus:ring-teal focus:border-transparent"
                   placeholder="ID provided by your institute"/>
          </div>
          <div>
            <label className="label text-slate-400">Student ID / Code</label>
            <input name="student_code" value={form.student_code} onChange={handleChange}
                   className="input bg-white/5 border-white/10 text-cream placeholder-slate-600
                              focus:ring-teal focus:border-transparent"
                   placeholder="e.g. STU001"/>
          </div>
          <div>
            <label className="label text-slate-400">Full Name</label>
            <input name="student_name" value={form.student_name} onChange={handleChange}
                   className="input bg-white/5 border-white/10 text-cream placeholder-slate-600
                              focus:ring-teal focus:border-transparent"
                   placeholder="As registered by your institute"/>
          </div>

          <button type="submit" disabled={loading} className="btn-teal w-full justify-center mt-2">
            {loading ? 'Signing in…' : <><LogIn size={15}/> Sign In</>}
          </button>
        </form>

        <p className="text-center text-slate-600 text-xs mt-8">
          <Link to="/" className="hover:text-slate-400">← Back to home</Link>
        </p>
      </div>
    </div>
  )
}
