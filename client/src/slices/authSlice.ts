import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { api } from '../services/api'
import type { Role, User } from '../types'

type AuthState = {
  token: string | null
  user: (User & { role: Role }) | null
  status: 'idle' | 'loading'
  error: string | null
}

const tokenFromStorage = () => {
  try {
    return localStorage.getItem('token')
  } catch {
    return null
  }
}

const initialState: AuthState = {
  token: tokenFromStorage(),
  user: null,
  status: 'idle',
  error: null
}

export const signup = createAsyncThunk(
  'auth/signup',
  async (payload: { email: string; password: string; name: string }) => {
    const res = await api.post('/api/auth/signup', payload)
    return res.data as { token: string; user: User & { role: Role } }
  }
)

export const login = createAsyncThunk(
  'auth/login',
  async (payload: { email: string; password: string }) => {
    const res = await api.post('/api/auth/login', payload)
    return res.data as { token: string; user: User & { role: Role } }
  }
)

export const fetchMe = createAsyncThunk('auth/fetchMe', async () => {
  const res = await api.get('/api/auth/me')
  return res.data as User & { role: Role }
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.token = null
      state.user = null
      state.error = null
      try {
        localStorage.removeItem('token')
      } catch {}
    },
    setToken(state, action: PayloadAction<string | null>) {
      state.token = action.payload
      if (action.payload) {
        try {
          localStorage.setItem('token', action.payload)
        } catch {}
      } else {
        try {
          localStorage.removeItem('token')
        } catch {}
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(signup.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(signup.fulfilled, (state, action) => {
        state.status = 'idle'
        state.token = action.payload.token
        state.user = action.payload.user
        state.error = null
        try {
          localStorage.setItem('token', action.payload.token)
        } catch {}
      })
      .addCase(signup.rejected, (state, action) => {
        state.status = 'idle'
        state.error = action.error.message || 'Signup failed'
      })
      .addCase(login.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'idle'
        state.token = action.payload.token
        state.user = action.payload.user
        state.error = null
        try {
          localStorage.setItem('token', action.payload.token)
        } catch {}
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'idle'
        state.error = action.error.message || 'Login failed'
      })
      .addCase(fetchMe.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.status = 'idle'
        state.user = action.payload
      })
      .addCase(fetchMe.rejected, (state, action) => {
        state.status = 'idle'
        state.error = action.error.message || 'Failed to fetch profile'
      })
  }
})

export const { logout, setToken } = authSlice.actions
export default authSlice.reducer

