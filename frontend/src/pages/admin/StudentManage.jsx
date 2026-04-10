/**
 * pages/admin/StudentManage.jsx
 * --------------------------------
 * Add, view, and delete students.
 */
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, UserPlus, Trash2, Users, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import Navbar from '../../components/common/Navbar'
import { adminApi } from '../../api/services'
import { useAuth } from '../../context/AuthContext'

export default function StudentManage() {
  const { userId } = useAuth()
  const navigate   = useNavigate()
  const [students,  setStudents]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [form,      setForm]      = useState({ student_code: '', student_name: '' })
  const [saving,    setSaving]    = useState(false)
  const [search,    setSearch]    = useState('')

  const fetchStudents = async () => {
    try {
      const { data } = await adminApi.listStudents()
      setStudents(data)
    } catch {
      toast.error('Failed to load students.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchStudents() }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!form.student_code.trim() || !form.student_name.trim()) {
      toast.error('Both fields are required.'); return
    }
    setSaving(true)
    try {
      await adminApi.addStudent(form)
      toast.success('Student added!')
      setForm({ student_code: '', student_name: '' })
      fetchStudents()
    } catch (err) {
      toast.error(err.message || 'Failed to add student.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id, name) => {
    if (!confirm(`Remove student "${name}"?`)) return
    try {
      await adminApi.deleteStudent(id)
      toast.success('Student removed.')
      fetchStudents()
    } catch (err) {
      toast.error(err.message || 'Delete failed.')
    }
  }

  const filtered = students.filter(s =>
    s.student_name.toLowerCase().includes(search.toLowerCase()) ||
    s.student_code.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="page-wrap">
      <Navbar/>
      <main className="container-md py-10">

        <div className="flex items-center gap-3 mb-8 animate-fade-up">
          <Link to="/admin/dashboard" className="btn-ghost px-2"><ArrowLeft size={16}/></Link>
          <div>
            <h1 className="text-2xl font-display font-bold text-ink">Student Management</h1>
            <p className="text-slate-400 text-sm">
              Institute ID: <span className="font-mono text-amber-dark font-semibold">{userId}</span>
              {' '}(share this with students for login)
            </p>
          </div>
        </div>

        {/* Add student form */}
        <form onSubmit={handleAdd} className="card mb-6 animate-fade-up">
          <h2 className="font-display font-bold text-ink mb-4 flex items-center gap-2">
            <UserPlus size={17} className="text-amber"/> Add New Student
          </h2>
          <div className="flex gap-3 flex-wrap sm:flex-nowrap">
            <div className="flex-1 min-w-0">
              <label className="label">Student ID / Code</label>
              <input value={form.student_code} onChange={e => setForm({...form, student_code: e.target.value})}
                     className="input" placeholder="e.g. STU001"/>
            </div>
            <div className="flex-1 min-w-0">
              <label className="label">Full Name</label>
              <input value={form.student_name} onChange={e => setForm({...form, student_name: e.target.value})}
                     className="input" placeholder="e.g. Riya Sharma"/>
            </div>
            <div className="flex items-end">
              <button type="submit" disabled={saving} className="btn-amber whitespace-nowrap">
                {saving ? 'Adding…' : <><UserPlus size={14}/> Add</>}
              </button>
            </div>
          </div>
        </form>

        {/* Students list */}
        <div className="card animate-fade-up" style={{animationDelay:'0.1s'}}>
          <div className="flex items-center justify-between mb-4 gap-3">
            <h2 className="font-display font-bold text-ink flex items-center gap-2">
              <Users size={17}/> Students
              <span className="badge-info ml-1">{students.length}</span>
            </h2>
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"/>
              <input value={search} onChange={e => setSearch(e.target.value)}
                     className="input pl-8 text-xs w-44" placeholder="Search…"/>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-10 text-slate-400">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              {search ? 'No matching students.' : 'No students added yet.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left">
                    <th className="pb-2 text-xs text-slate-400 font-semibold uppercase tracking-wider pr-4">#</th>
                    <th className="pb-2 text-xs text-slate-400 font-semibold uppercase tracking-wider pr-4">Code</th>
                    <th className="pb-2 text-xs text-slate-400 font-semibold uppercase tracking-wider pr-4">Name</th>
                    <th className="pb-2 text-xs text-slate-400 font-semibold uppercase tracking-wider">Joined</th>
                    <th className="pb-2"/>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((s, i) => (
                    <tr key={s.id} className="hover:bg-slate-50 group">
                      <td className="py-3 pr-4 text-slate-400 font-mono text-xs">{i+1}</td>
                      <td className="py-3 pr-4 font-mono font-medium text-ink">{s.student_code}</td>
                      <td className="py-3 pr-4 text-ink">
                        <button onClick={() => navigate(`/admin/students/${s.id}`)} className="hover:text-teal hover:underline text-left">{s.student_name}</button>
                      </td>
                      <td className="py-3 text-slate-400 text-xs">
                        {new Date(s.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 text-right">
                        <button onClick={() => handleDelete(s.id, s.student_name)}
                                className="text-slate-300 hover:text-coral transition-colors opacity-0 group-hover:opacity-100">
                          <Trash2 size={14}/>
                        </button>
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
