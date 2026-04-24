const webpush = require('web-push');
const Alert = require('../models/Alert');
const logger = require('../config/logger');
const { sendSMS } = require('./smsService');

// Configure web-push VAPID keys
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL || 'mailto:admin@touristsafety.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

/**
 * Send multi-channel notification to a user
 */
const sendNotification = async (user, { title, message, severity, incidentId }) => {
  try {
    // 1. Save alert to database
    const alert = await Alert.create({
      userId: user._id,
      incidentId,
      type: 'push',
      title,
      message,
      severity: severity === 'critical' ? 'critical' : severity === 'high' ? 'danger' : 'warning',
      channel: 'all',
      deliveredAt: new Date()
    });

    // 2. Web Push Notification
    if (user.pushSubscription) {
      try {
        await webpush.sendNotification(
          user.pushSubscription,
          JSON.stringify({
            title,
            body: message,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/badge-72x72.png',
            data: { incidentId, severity, url: '/dashboard' },
            actions: [
              { action: 'view', title: 'View Details' },
              { action: 'dismiss', title: 'Dismiss' }
            ]
          })
        );
        logger.info(`Push notification sent to ${user.email}`);
      } catch (pushError) {
        logger.error(`Push notification failed: ${pushError.message}`);
      }
    }

    // 3. SMS notification for critical/high severity
    if ((severity === 'critical' || severity === 'high') && user.phone) {
      await sendSMS(user.phone, `[Tourist Safety Alert] ${title}: ${message}`);
    }

    return alert;
  } catch (error) {
    logger.error(`Notification error: ${error.message}`);
  }
};

module.exports = { sendNotification };
