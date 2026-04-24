import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { AlertDoc } from '../types'

type AlertsState = {
  items: AlertDoc[]
}

const initialState: AlertsState = { items: [] }

const alertsSlice = createSlice({
  name: 'alerts',
  initialState,
  reducers: {
    setInitialAlerts(state, action: PayloadAction<AlertDoc[]>) {
      state.items = action.payload
    },
    addAlert(state, action: PayloadAction<AlertDoc>) {
      state.items.unshift(action.payload)
      if (state.items.length > 200) state.items.pop()
    },
    clearAlerts(state) {
      state.items = []
    }
  }
})

export const { setInitialAlerts, addAlert, clearAlerts } = alertsSlice.actions
export default alertsSlice.reducer

