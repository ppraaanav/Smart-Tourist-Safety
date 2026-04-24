import { useAppDispatch, useAppSelector } from '../hooks'
import { logout } from '../slices/authSlice'

export default function TopBar({ title }: { title: string }) {
  const dispatch = useAppDispatch()
  const user = useAppSelector((s) => s.auth.user)

  return (
    <div className="w-full bg-white shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-lg font-semibold">{title}</div>
          <div className="text-xs text-gray-500">
            {user ? `${user.name} (${user.touristId})` : '—'}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => dispatch(logout())}
            className="text-sm px-3 py-2 rounded border hover:bg-gray-50"
            type="button"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}

