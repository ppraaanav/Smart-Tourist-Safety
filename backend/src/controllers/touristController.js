const User = require('../models/User');
const LocationLog = require('../models/LocationLog');
const Incident = require('../models/Incident');

exports.getAllTourists = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const query = { role: 'tourist' };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { dtid: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (status === 'active') {
      query.lastActive = { $gte: new Date(Date.now() - 30 * 60 * 1000) };
    }

    const tourists = await User.find(query)
      .select('-password')
      .sort({ lastActive: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: tourists,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch tourists' });
  }
};

exports.getTouristById = async (req, res) => {
  try {
    const tourist = await User.findById(req.params.id).select('-password');
    if (!tourist) {
      return res.status(404).json({ success: false, message: 'Tourist not found' });
    }

    // Get recent location history
    const locationHistory = await LocationLog.find({ userId: req.params.id })
      .sort({ createdAt: -1 })
      .limit(50);

    // Get incidents
    const incidents = await Incident.find({ userId: req.params.id })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      success: true,
      data: {
        tourist,
        locationHistory,
        incidents
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch tourist details' });
  }
};

exports.getActiveTourists = async (req, res) => {
  try {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const tourists = await User.find({
      role: 'tourist',
      lastActive: { $gte: thirtyMinutesAgo },
      isActive: true
    }).select('name dtid lastKnownLocation lastActive');

    res.json({ success: true, data: tourists, count: tourists.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch active tourists' });
  }
};

exports.getTouristByDTID = async (req, res) => {
  try {
    const tourist = await User.findOne({ dtid: req.params.dtid }).select('-password');
    if (!tourist) {
      return res.status(404).json({ success: false, message: 'Tourist not found' });
    }
    res.json({ success: true, data: tourist });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch tourist' });
  }
};
