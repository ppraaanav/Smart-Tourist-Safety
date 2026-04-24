import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAppDispatch, useAppSelector } from '../hooks'
import { login } from '../slices/authSlice'

export default function LoginPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [email, setEmail] = useState('tourist@example.com')
  const [password, setPassword] = useState('tourist12345')
  const status = useAppSelector((s) => s.auth.status)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const pendingToastId = toast.loading('Logging in...')
    try {
      const res = await dispatch(login({ email, password })).unwrap()
      toast.success('Welcome back')
      // Navigation happens in App after fetchMe; but this speeds up UX.
      const role = res.user.role
      navigate(role === 'admin' ? '/admin' : '/tourist', { replace: true })
    } catch (err: any) {
      toast.error(err?.message || 'Login failed')
    } finally {
      toast.dismiss(pendingToastId)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white shadow rounded p-6">
        <h1 className="text-2xl font-bold mb-2">Login</h1>
        <p className="text-gray-600 mb-6">Smart Tourist Safety</p>

        <form className="space-y-4" onSubmit={onSubmit}>
          <label className="block">
            <span className="text-sm text-gray-700">Email</span>
            <input
              className="mt-1 w-full border rounded px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
            />
          </label>
          <label className="block">
            <span className="text-sm text-gray-700">Password</span>
            <input
              className="mt-1 w-full border rounded px-3 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
            />
          </label>

          <button
            disabled={status === 'loading'}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-60"
            type="submit"
          >
            {status === 'loading' ? 'Please wait...' : 'Login'}
          </button>
        </form>

        <div className="mt-4 text-sm text-gray-600">
          New here?{' '}
          <Link className="text-blue-600 hover:underline" to="/signup">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  )
}

