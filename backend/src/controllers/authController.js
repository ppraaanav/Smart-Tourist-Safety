const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Alert = require('../models/Alert');
const Incident = require('../models/Incident');
const LocationLog = require('../models/LocationLog');
const logger = require('../config/logger');

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, phone, nationality, emergencyContact } = req.validatedBody;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const user = await User.create({
      name, email, password,
      role: role || 'tourist',
      phone, nationality, emergencyContact
    });

    const token = generateToken(user);

    logger.info(`New user registered: ${email} (${role || 'tourist'})`);

    res.status(201).json({
      success: true,
      data: {
        user: user.toJSON(),
        token
      }
    });
  } catch (error) {
    logger.error(`Registration error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.validatedBody;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    user.lastActive = new Date();
    await user.save();

    const token = generateToken(user);

    logger.info(`User logged in: ${email}`);

    res.json({
      success: true,
      data: {
        user: user.toJSON(),
        token
      }
    });
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const allowedFields = ['name', 'phone', 'nationality', 'emergencyContact', 'preferences', 'avatar'];
    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true, runValidators: true
    });

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
};

exports.savePushSubscription = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      pushSubscription: req.body.subscription
    });
    res.json({ success: true, message: 'Push subscription saved' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to save subscription' });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    const userEmail = req.user.email;

    if (userRole === 'tourist') {
      await Promise.all([
        LocationLog.deleteMany({ userId }),
        Incident.deleteMany({ userId }),
        Alert.deleteMany({ userId })
      ]);
    }

    await Alert.updateMany(
      { sentBy: userId },
      { $unset: { sentBy: '' } }
    );

    await Incident.updateMany(
      { assignedTo: userId },
      { $unset: { assignedTo: '' } }
    );

    await User.findByIdAndDelete(userId);

    logger.warn(`Account deleted: ${userEmail} (${userRole})`);

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    logger.error(`Delete account error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Failed to delete account' });
  }
};
