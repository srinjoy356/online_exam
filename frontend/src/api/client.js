/**
 * api/client.js
 * -------------
 * Preconfigured Axios instance.
 * The request interceptor automatically attaches the JWT
 * from sessionStorage so every API call is authenticated.
 */
import axios from 'axios'

console.log("API URL:", import.meta.env.VITE_API_URL)

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
})

// ── Request interceptor: inject Authorization header ──────
api.interceptors.request.use((config) => {
  try {
    const raw  = sessionStorage.getItem('exam_auth')
    const auth = raw ? JSON.parse(raw) : null
    if (auth?.access_token) {
      config.headers.Authorization = `Bearer ${auth.access_token}`
    }
  } catch {
    /* ignore parse errors */
  }
  return config
})

// ── Response interceptor: normalise error messages ────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const detail = err.response?.data?.detail
    if (typeof detail === 'string') {
      err.message = detail
    } else if (Array.isArray(detail)) {
      // FastAPI validation errors are arrays of objects
      err.message = detail.map((d) => d.msg).join('; ')
    }
    return Promise.reject(err)
  }
)

export default api
