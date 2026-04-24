import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { Role } from '../types'

export type UserPosition = {
  userId: string
  name: string
  touristId: string
  email: string
  role: Role
  position: { lat: number; lng: number; accuracyM?: number; timestamp?: string | number }
}

type UsersState = {
  byId: Record<string, UserPosition>
}

const initialState: UsersState = { byId: {} }

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    setPositions(state, action: PayloadAction<UserPosition[]>) {
      const next: Record<string, UserPosition> = {}
      for (const u of action.payload) next[u.userId] = u
      state.byId = next
    },
    upsertPosition(state, action: PayloadAction<UserPosition>) {
      state.byId[action.payload.userId] = action.payload
    }
  }
})

export const { setPositions, upsertPosition } = usersSlice.actions
export default usersSlice.reducer

