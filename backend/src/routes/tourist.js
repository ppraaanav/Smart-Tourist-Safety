const router = require('express').Router();
const { getAllTourists, getTouristById, getActiveTourists, getTouristByDTID } = require('../controllers/touristController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', authorize('authority', 'admin'), getAllTourists);
router.get('/active', authorize('authority', 'admin'), getActiveTourists);
router.get('/dtid/:dtid', authorize('authority', 'admin'), getTouristByDTID);
router.get('/:id', authorize('authority', 'admin'), getTouristById);

module.exports = router;
