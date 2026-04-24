const router = require('express').Router();
const { createIncident, getIncidents, getIncidentById, updateIncident, triggerSOS } = require('../controllers/incidentController');
const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { createIncidentSchema, updateIncidentSchema } = require('../validators/incidentValidator');

router.use(protect);

router.post('/', validate(createIncidentSchema), createIncident);
router.get('/', getIncidents);
router.get('/:id', getIncidentById);
router.put('/:id', authorize('authority', 'admin'), validate(updateIncidentSchema), updateIncident);
router.post('/sos', authorize('tourist'), triggerSOS);

module.exports = router;
