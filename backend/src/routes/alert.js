const router = require('express').Router();
const {
  getAlerts,
  getSentAlerts,
  markAsRead,
  markAllAsRead,
  sendAlert
} = require('../controllers/alertController');

const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// Get all alerts
router.get('/', getAlerts);

// Get alerts sent to tourists
router.get('/sent', authorize('authority', 'admin'), getSentAlerts);

// Send new alert
router.post('/send', authorize('authority', 'admin'), sendAlert);

// Mark single alert as read
router.put('/:id/read', markAsRead);

// Mark all alerts as read
router.put('/read-all', markAllAsRead);

module.exports = router;
