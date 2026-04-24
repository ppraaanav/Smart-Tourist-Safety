const router = require('express').Router();
const { register, login, getMe, updateProfile, savePushSubscription } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { registerSchema, loginSchema } = require('../validators/authValidator');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/push-subscription', protect, savePushSubscription);

module.exports = router;
