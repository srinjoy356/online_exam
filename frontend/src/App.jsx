/**
 * App.jsx — root component with all routes.
 */
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

// Admin pages
import AdminLogin      from './pages/admin/AdminLogin'
import AdminRegister   from './pages/admin/AdminRegister'
import AdminDashboard  from './pages/admin/AdminDashboard'
import ExamCreate      from './pages/admin/ExamCreate'
import ExamDetail      from './pages/admin/ExamDetail'
import ExamResults     from './pages/admin/ExamResults'       // NEW
import StudentManage   from './pages/admin/StudentManage'
import StudentProfile  from './pages/admin/StudentProfile'    // NEW

// Student pages
import StudentLogin    from './pages/student/StudentLogin'
import ExamList        from './pages/student/ExamList'
import ExamInterface   from './pages/student/ExamInterface'
import ResultScreen    from './pages/student/ResultScreen'

// Landing
import Landing from './pages/Landing'

function ProtectedRoute({ children, requiredRole }) {
  const { session, role } = useAuth()
  if (!session) return <Navigate to="/" replace />
  if (requiredRole && role !== requiredRole) return <Navigate to="/" replace />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/"                 element={<Landing />} />
      <Route path="/admin/login"      element={<AdminLogin />} />
      <Route path="/admin/register"   element={<AdminRegister />} />
      <Route path="/student/login"    element={<StudentLogin />} />

      {/* Admin */}
      <Route path="/admin/dashboard" element={
        <ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>
      }/>
      <Route path="/admin/exams/new" element={
        <ProtectedRoute requiredRole="admin"><ExamCreate /></ProtectedRoute>
      }/>
      <Route path="/admin/exams/:examId" element={
        <ProtectedRoute requiredRole="admin"><ExamDetail /></ProtectedRoute>
      }/>
      <Route path="/admin/exams/:examId/results" element={
        <ProtectedRoute requiredRole="admin"><ExamResults /></ProtectedRoute>
      }/>
      <Route path="/admin/students" element={
        <ProtectedRoute requiredRole="admin"><StudentManage /></ProtectedRoute>
      }/>
      <Route path="/admin/students/:studentId" element={
        <ProtectedRoute requiredRole="admin"><StudentProfile /></ProtectedRoute>
      }/>

      {/* Student */}
      <Route path="/student/exams" element={
        <ProtectedRoute requiredRole="student"><ExamList /></ProtectedRoute>
      }/>
      <Route path="/student/exams/:examId/take" element={
        <ProtectedRoute requiredRole="student"><ExamInterface /></ProtectedRoute>
      }/>
      <Route path="/student/results/:attemptId" element={
        <ProtectedRoute requiredRole="student"><ResultScreen /></ProtectedRoute>
      }/>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
