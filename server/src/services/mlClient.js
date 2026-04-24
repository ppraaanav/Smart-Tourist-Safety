const axios = require('axios')
const { config } = require('../config')

const getAnomalyScore = async (features) => {
  const resp = await axios.post(config.mlServiceUrl, features, {
    timeout: 3000,
    headers: { 'Content-Type': 'application/json' }
  })
  return resp.data
}

module.exports = { getAnomalyScore }

