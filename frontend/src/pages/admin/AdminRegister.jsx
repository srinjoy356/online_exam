/**
 * pages/admin/AdminRegister.jsx
 * Inline inputs only — no sub-components, prevents focus loss on re-render.
 */
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus, BookOpen } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi } from '../../api/services'
import { useAuth } from '../../context/AuthContext'

export default function AdminRegister() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [loginName,     setLoginName]     = useState('')
  const [instituteName, setInstituteName] = useState('')
  const [email,         setEmail]         = useState('')
  const [password,      setPassword]      = useState('')
  const [loading,       setLoading]       = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!loginName || !instituteName || !email || !password) {
      toast.error('All fields are required.')
      return
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters.')
      return
    }
    setLoading(true)
    try {
      const { data } = await authApi.adminRegister({
        login_name:     loginName,
        institute_name: instituteName,
        email,
        password,
      })
      login(data)
      toast.success('Account created! Welcome.')
      navigate('/admin/dashboard')
    } catch (err) {
      toast.error(err.message || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  const cls = `input bg-white/5 border-white/10 text-cream placeholder-slate-600
               focus:ring-amber focus:border-transparent`

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber/10 mb-4">
            <BookOpen size={22} className="text-amber" />
          </div>
          <h1 className="text-2xl font-display font-bold text-cream">Create Admin Account</h1>
          <p className="text-slate-400 text-sm mt-1">Register your institute on ExamPortal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <label className="label text-slate-400">Login Name</label>
            <input
              type="text"
              className={cls}
              placeholder="unique_login_id"
              value={loginName}
              onChange={e => setLoginName(e.target.value)}
            />
          </div>

          <div>
            <label className="label text-slate-400">Institute Name</label>
            <input
              type="text"
              className={cls}
              placeholder="Springfield Academy"
              value={instituteName}
              onChange={e => setInstituteName(e.target.value)}
            />
          </div>

          <div>
            <label className="label text-slate-400">Email</label>
            <input
              type="email"
              className={cls}
              placeholder="admin@institute.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="label text-slate-400">Password</label>
            <input
              type="password"
              className={cls}
              placeholder="Min. 6 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" disabled={loading} className="btn-amber w-full justify-center mt-2">
            {loading ? 'Creating account…' : <><UserPlus size={15} /> Create Account</>}
          </button>

        </form>

        <p className="text-center text-slate-500 text-sm mt-6">
          Already registered?{' '}
          <Link to="/admin/login" className="text-amber hover:underline">Sign in</Link>
        </p>
        <p className="text-center text-slate-600 text-xs mt-4">
          <Link to="/" className="hover:text-slate-400">← Back to home</Link>
        </p>
      </div>
    </div>
  )
}