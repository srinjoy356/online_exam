/**
 * api/services.js — all API calls grouped by domain.
 */
import api from './client'

export const authApi = {
  adminRegister: (data) => api.post('/auth/admin/register', data),
  adminLogin:    (data) => api.post('/auth/admin/login',    data),
  studentLogin:  (data) => api.post('/auth/student/login',  data),
}

export const adminApi = {
  // Exams
  createExam:    (data)    => api.post('/admin/exams',          data),
  listExams:     ()        => api.get('/admin/exams'),
  getExam:       (id)      => api.get(`/admin/exams/${id}`),
  deleteExam:    (id)      => api.delete(`/admin/exams/${id}`),
  getExamResults:(id)      => api.get(`/admin/exams/${id}/results`),   // NEW

  // Questions
  addQuestion:    (examId, data) => api.post(`/admin/exams/${examId}/questions`, data),
  deleteQuestion: (examId, qId)  => api.delete(`/admin/exams/${examId}/questions/${qId}`),

  // Students
  addStudent:        (data) => api.post('/admin/students',                  data),
  listStudents:      ()     => api.get('/admin/students'),
  deleteStudent:     (id)   => api.delete(`/admin/students/${id}`),
  getStudentProfile: (id)   => api.get(`/admin/students/${id}/attempts`),   // NEW
}

export const studentApi = {
  listExams:       ()          => api.get('/student/exams'),
  getAttemptStatus:(examId)    => api.get(`/student/exams/${examId}/attempt-status`), // NEW
  startExam:       (examId)    => api.post(`/student/exams/${examId}/start`),
  submitExam:      (data)      => api.post('/student/exams/submit', data),
  getResult:       (attemptId) => api.get(`/student/results/${attemptId}`),
  getStats:        ()          => api.get('/student/stats'),                // NEW
}
