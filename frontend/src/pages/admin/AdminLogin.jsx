/**
 * pages/admin/AdminLogin.jsx
 */
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogIn, BookOpen } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi } from '../../api/services'
import { useAuth } from '../../context/AuthContext'

export default function AdminLogin() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form, setForm]       = useState({ login_name: '', password: '' })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.login_name || !form.password) {
      toast.error('Please fill in all fields.')
      return
    }
    setLoading(true)
    try {
      const { data } = await authApi.adminLogin(form)
      login(data)
      toast.success(`Welcome back, ${data.user_name}!`)
      navigate('/admin/dashboard')
    } catch (err) {
      toast.error(err.message || 'Login failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-4">
      <div className="w-full max-w-sm animate-fade-up">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber/10 mb-4">
            <BookOpen size={22} className="text-amber"/>
          </div>
          <h1 className="text-2xl font-display font-bold text-cream">Admin Login</h1>
          <p className="text-slate-400 text-sm mt-1">Sign in to manage your institute</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label text-slate-400">Login Name</label>
            <input name="login_name" value={form.login_name} onChange={handleChange}
                   className="input bg-white/5 border-white/10 text-cream placeholder-slate-600
                              focus:ring-amber focus:border-transparent"
                   placeholder="your_login_name" autoComplete="username"/>
          </div>
          <div>
            <label className="label text-slate-400">Password</label>
            <input name="password" type="password" value={form.password} onChange={handleChange}
                   className="input bg-white/5 border-white/10 text-cream placeholder-slate-600
                              focus:ring-amber focus:border-transparent"
                   placeholder="••••••••" autoComplete="current-password"/>
          </div>

          <button type="submit" disabled={loading} className="btn-amber w-full justify-center mt-2">
            {loading ? 'Signing in…' : <><LogIn size={15}/> Sign In</>}
          </button>
        </form>

        <p className="text-center text-slate-500 text-sm mt-6">
          No account?{' '}
          <Link to="/admin/register" className="text-amber hover:underline">Register here</Link>
        </p>
        <p className="text-center text-slate-600 text-xs mt-4">
          <Link to="/" className="hover:text-slate-400">← Back to home</Link>
        </p>
      </div>
    </div>
  )
}
