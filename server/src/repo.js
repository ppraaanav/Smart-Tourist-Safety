const crypto = require('crypto')
const mongoose = require('mongoose')

const UserModel = require('./models/User')
const AlertModel = require('./models/Alert')

let mode = 'none' // 'mongo' | 'none'

const memory = {
  usersById: new Map(), // id -> user doc
  userIdByEmail: new Map(), // email -> id
  alerts: [] // alert docs (newest first)
}

const initRepo = ({ dbMode }) => {
  mode = dbMode === 'mongo' ? 'mongo' : 'none'
}

const toUserDTO = (u) => {
  if (!u) return null
  return {
    id: (u._id || u.id).toString(),
    email: u.email,
    role: u.role,
    name: u.name,
    touristId: u.touristId,
    lastLocation: u.lastLocation || null
  }
}

const createUser = async ({ email, passwordHash, role, name, touristId }) => {
  if (mode === 'mongo') {
    const doc = await UserModel.create({ email, passwordHash, role, name, touristId })
    return toUserDTO(doc.toObject())
  }

  const id = crypto.randomBytes(12).toString('hex')
  const user = {
    id,
    email,
    passwordHash,
    role,
    name,
    touristId,
    lastLocation: null
  }

  memory.usersById.set(id, user)
  memory.userIdByEmail.set(email, id)
  return toUserDTO(user)
}

const findUserByEmail = async (email) => {
  if (mode === 'mongo') {
    return UserModel.findOne({ email }).exec()
  }
  const id = memory.userIdByEmail.get(email)
  if (!id) return null
  return memory.usersById.get(id)
}

const findUserById = async (id) => {
  if (mode === 'mongo') {
    return UserModel.findById(id).exec()
  }
  return memory.usersById.get(String(id)) || null
}

const updateUserLocation = async (userId, lastLocation) => {
  if (mode === 'mongo') {
    await UserModel.findByIdAndUpdate(
      userId,
      {
        lastLocation
      },
      { new: true }
    ).exec()
    return
  }

  const id = String(userId)
  const u = memory.usersById.get(id)
  if (!u) return
  u.lastLocation = lastLocation
}

const listUsersWithLastLocation = async () => {
  if (mode === 'mongo') {
    const users = await UserModel.find(
      { lastLocation: { $ne: null, lat: { $ne: null }, lng: { $ne: null } } },
      { email: 1, name: 1, role: 1, touristId: 1, lastLocation: 1 }
    )
      .lean()
      .exec()
    return users.map((u) => ({ ...u, _id: u._id?.toString?.() || u._id }))
  }

  const out = []
  for (const u of memory.usersById.values()) {
    if (!u.lastLocation?.lat && u.lastLocation?.lat !== 0) continue
    if (!u.lastLocation?.lng && u.lastLocation?.lng !== 0) continue
    out.push({
      _id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      touristId: u.touristId,
      lastLocation: u.lastLocation
    })
  }
  return out
}

const createAlert = async ({ userId, type, message, geo, anomalyScore, meta }) => {
  if (mode === 'mongo') {
    const doc = await AlertModel.create({ userId, type, message, geo, anomalyScore, meta })
    console.log(`[ALERT] ${type} user=${String(userId)} msg=${message}`)
    return doc.toObject()
  }

  const id = crypto.randomBytes(12).toString('hex')
  const alert = {
    _id: id,
    userId: String(userId),
    type,
    message,
    geo: geo || undefined,
    anomalyScore,
    meta: meta || undefined,
    createdAt: new Date().toISOString()
  }

  memory.alerts.unshift(alert)
  console.log(`[ALERT] ${type} user=${String(userId)} msg=${message}`)
  return alert
}

const listRecentAlerts = async (limit = 30) => {
  if (mode === 'mongo') {
    return AlertModel.find().sort({ createdAt: -1 }).limit(limit).lean().exec()
  }
  return memory.alerts.slice(0, limit)
}

module.exports = {
  initRepo,
  createUser,
  findUserByEmail,
  findUserById,
  updateUserLocation,
  listUsersWithLastLocation,
  createAlert,
  listRecentAlerts,
  toUserDTO
}

