const bcrypt = require('bcrypt')
const { config } = require('./config')
const { generateTouristId } = require('./touristId')
const repo = require('./repo')

const seedAdmin = async () => {
  const existing = await repo.findUserByEmail(config.adminEmail)
  if (existing) return

  const passwordHash = await bcrypt.hash(config.adminPassword, 10)
  const user = await repo.createUser({
    email: config.adminEmail,
    passwordHash,
    role: 'admin',
    name: 'Admin',
    touristId: generateTouristId()
  })

  return user
}

module.exports = { seedAdmin }

