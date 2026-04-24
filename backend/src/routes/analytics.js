const router = require('express').Router();
const { getDashboardStats, getIncidentTrends, getHeatmapData, getResponseTimeAnalytics } = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('authority', 'admin'));

router.get('/dashboard', getDashboardStats);
router.get('/trends', getIncidentTrends);
router.get('/heatmap', getHeatmapData);
router.get('/response-times', getResponseTimeAnalytics);

module.exports = router;
