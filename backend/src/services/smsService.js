const logger = require('../config/logger');

/**
 * Send SMS using Twilio or mock for development
 */
const sendSMS = async (phoneNumber, message) => {
  try {
    if (process.env.NODE_ENV === 'production' &&
        process.env.TWILIO_ACCOUNT_SID &&
        process.env.TWILIO_ACCOUNT_SID !== 'mock_sid') {
      const twilio = require('twilio');
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

      await client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber
      });
      logger.info(`SMS sent to ${phoneNumber}`);
    } else {
      // Mock SMS in development
      logger.info(`[MOCK SMS] To: ${phoneNumber} | Message: ${message}`);
    }
  } catch (error) {
    logger.error(`SMS send error: ${error.message}`);
  }
};

module.exports = { sendSMS };
