import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import geoReducer from './slices/geoSlice'
import alertsReducer from './slices/alertsSlice'
import usersReducer from './slices/usersSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    geo: geoReducer,
    alerts: alertsReducer,
    users: usersReducer
  }
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
