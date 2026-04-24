import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAppDispatch } from '../hooks'
import { signup } from '../slices/authSlice'

export default function SignupPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [name, setName] = useState('John Tourist')
  const [email, setEmail] = useState('tourist@example.com')
  const [password, setPassword] = useState('tourist12345')
  const [status, setStatus] = useState<'idle' | 'loading'>('idle')

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    const pendingToastId = toast.loading('Creating account...')
    try {
      const res = await dispatch(signup({ name, email, password })).unwrap()
      toast.success('Account created')
      navigate(res.user.role === 'admin' ? '/admin' : '/tourist', { replace: true })
    } catch (err: any) {
      toast.error(err?.message || 'Signup failed')
    } finally {
      toast.dismiss(pendingToastId)
      setStatus('idle')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white shadow rounded p-6">
        <h1 className="text-2xl font-bold mb-2">Sign Up</h1>
        <p className="text-gray-600 mb-6">Create your Smart Tourist account</p>

        <form className="space-y-4" onSubmit={onSubmit}>
          <label className="block">
            <span className="text-sm text-gray-700">Name</span>
            <input className="mt-1 w-full border rounded px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
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
            {status === 'loading' ? 'Please wait...' : 'Create account'}
          </button>
        </form>

        <div className="mt-4 text-sm text-gray-600">
          Already have an account?{' '}
          <Link className="text-blue-600 hover:underline" to="/login">
            Login
          </Link>
        </div>
      </div>
    </div>
  )
}

