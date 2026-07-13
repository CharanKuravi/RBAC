import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import Exam from './pages/Exam'
import Admin from './pages/Admin'
import Review from './pages/Review'
import StudentDashboard from './pages/StudentDashboard'

function PrivateRoute({ children, role }) {
  const token = localStorage.getItem('token')
  const userRole = localStorage.getItem('role')
  if (!token) return <Navigate to="/login" replace />

  const adminRoles = ['admin', 'super_admin', 'it_coordinator', 'staff']

  if (role === 'admin') {
    if (!adminRoles.includes(userRole)) return <Navigate to="/login" replace />
  }
  if (role === 'student') {
    if (userRole !== 'student') return <Navigate to="/login" replace />
  }
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/signup" element={<Navigate to="/register" replace />} />
        <Route
          path="/profile"
          element={
            <PrivateRoute role="student">
              <Profile />
            </PrivateRoute>
          }
        />
        <Route
          path="/exam"
          element={
            <PrivateRoute role="student">
              <Exam />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <PrivateRoute role="admin">
              <Admin />
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute role="student">
              <StudentDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/review/:submissionId"
          element={
            <PrivateRoute role="student">
              <Review />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
