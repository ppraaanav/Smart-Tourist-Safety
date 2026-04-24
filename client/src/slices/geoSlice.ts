import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { api } from '../services/api'
import type { GeoZone } from '../types'

type GeoState = {
  zones: GeoZone[]
  status: 'idle' | 'loading'
  error: string | null
}

const initialState: GeoState = { zones: [], status: 'idle', error: null }

export const fetchZones = createAsyncThunk('geo/fetchZones', async () => {
  const res = await api.get('/api/geozones')
  return res.data as { zones: GeoZone[] }
})

const geoSlice = createSlice({
  name: 'geo',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchZones.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchZones.fulfilled, (state, action) => {
        state.status = 'idle'
        state.zones = action.payload.zones
      })
      .addCase(fetchZones.rejected, (state, action) => {
        state.status = 'idle'
        state.error = action.error.message || 'Failed to load geo zones'
      })
  }
})

export default geoSlice.reducer

