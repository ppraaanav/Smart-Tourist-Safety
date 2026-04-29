const router = require('express').Router();
const {
  getAlerts,
  markAsRead,
  markAllAsRead,
  sendAlert
} = require('../controllers/alertController');

const { protect } = require('../middleware/auth');

router.use(protect);

// Get all alerts
router.get('/', getAlerts);

// Send new alert
router.post('/send', sendAlert);

// Mark single alert as read
router.put('/:id/read', markAsRead);

// Mark all alerts as read
router.put('/read-all', markAllAsRead);

module.exports = router;