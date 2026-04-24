const router = require('express').Router();
const { createGeofence, getGeofences, getGeofenceById, updateGeofence, deleteGeofence } = require('../controllers/geofenceController');
const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { geofenceSchema } = require('../validators/incidentValidator');

router.use(protect);

router.post('/', authorize('authority', 'admin'), validate(geofenceSchema), createGeofence);
router.get('/', getGeofences);
router.get('/:id', getGeofenceById);
router.put('/:id', authorize('authority', 'admin'), updateGeofence);
router.delete('/:id', authorize('authority', 'admin'), deleteGeofence);

module.exports = router;
