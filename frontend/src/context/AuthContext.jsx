/**
 * context/AuthContext.jsx
 * -----------------------
 * Global authentication state using React Context API.
 * Stores JWT token + user info in sessionStorage so it
 * survives page refreshes within the browser tab.
 */
import { createContext, useContext, useState, useCallback } from 'react'

const AuthContext = createContext(null)

const SESSION_KEY = 'exam_auth'

function loadSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(loadSession)

  const login = useCallback((data) => {
    // data: { access_token, role, user_id, user_name }
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(data))
    setSession(data)
  }, [])

  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY)
    setSession(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        session,         // full token payload or null
        token: session?.access_token ?? null,
        role:  session?.role ?? null,        // 'admin' | 'student'
        userId: session?.user_id ?? null,
        userName: session?.user_name ?? null,
        isAdmin:   session?.role === 'admin',
        isStudent: session?.role === 'student',
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
