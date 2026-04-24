const router = require('express').Router();
const { updateLocation, syncOfflineLocations, getLocationHistory, getNearbyTourists } = require('../controllers/locationController');
const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { locationUpdateSchema } = require('../validators/incidentValidator');
const { locationLimiter } = require('../middleware/rateLimiter');

router.use(protect);

router.post('/update', locationLimiter, authorize('tourist'), validate(locationUpdateSchema), updateLocation);
router.post('/sync', authorize('tourist'), syncOfflineLocations);
router.get('/history/:userId', authorize('authority', 'admin'), getLocationHistory);
router.get('/nearby', authorize('authority', 'admin'), getNearbyTourists);

module.exports = router;
