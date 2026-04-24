import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAppDispatch, useAppSelector } from './hooks'
import { fetchMe, logout } from './slices/authSlice'

import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import TouristDashboard from './pages/TouristDashboard'
import AdminDashboard from './pages/AdminDashboard'

const LoadingGate = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-600">Loading...</div>
)

const TouristRoute = () => {
  const token = useAppSelector((s) => s.auth.token)
  const user = useAppSelector((s) => s.auth.user)
  const status = useAppSelector((s) => s.auth.status)
  const location = useLocation()

  if (!token) return <Navigate to="/login" replace state={{ from: location }} />
  if (status === 'loading' && !user) return <LoadingGate />
  if (user?.role && user.role !== 'tourist') return <Navigate to="/" replace />
  return <TouristDashboard />
}

const AdminRoute = () => {
  const token = useAppSelector((s) => s.auth.token)
  const user = useAppSelector((s) => s.auth.user)
  const status = useAppSelector((s) => s.auth.status)
  const location = useLocation()

  if (!token) return <Navigate to="/login" replace state={{ from: location }} />
  if (status === 'loading' && !user) return <LoadingGate />
  if (user?.role && user.role !== 'admin') return <Navigate to="/" replace />
  return <AdminDashboard />
}

const RoleRedirect = () => {
  const user = useAppSelector((s) => s.auth.user)
  if (!user) return null
  if (user.role === 'admin') return <Navigate to="/admin" replace />
  return <Navigate to="/tourist" replace />
}

export default function App() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const token = useAppSelector((s) => s.auth.token)
  const user = useAppSelector((s) => s.auth.user)
  const status = useAppSelector((s) => s.auth.status)
  const err = useAppSelector((s) => s.auth.error)

  useEffect(() => {
    if (!token) return
    if (user) return
    dispatch(fetchMe())
  }, [dispatch, token, user])

  useEffect(() => {
    if (!err) return
    toast.error(err)
  }, [err])

  // Keep navigation consistent when roles load.
  useEffect(() => {
    if (!token) return
    if (!user) return
    if (user.role === 'admin' && status !== 'loading') {
      navigate('/admin', { replace: true })
    }
    if (user.role === 'tourist' && status !== 'loading') {
      navigate('/tourist', { replace: true })
    }
  }, [navigate, token, user, status])

  return (
    <Routes>
      <Route path="/" element={token ? <RoleRedirect /> : <Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      <Route
        path="/tourist"
        element={<TouristRoute />}
      />
      <Route
        path="/admin"
        element={<AdminRoute />}
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

