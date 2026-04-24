const Incident = require('../models/Incident');
const User = require('../models/User');
const LocationLog = require('../models/LocationLog');

exports.getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const last24h = new Date(now - 24 * 60 * 60 * 1000);
    const last7d = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const last30min = new Date(now - 30 * 60 * 1000);

    const [
      totalTourists,
      activeTourists,
      totalIncidents,
      openIncidents,
      criticalIncidents,
      incidents24h,
      incidentsByType,
      incidentsBySeverity,
      recentIncidents
    ] = await Promise.all([
      User.countDocuments({ role: 'tourist' }),
      User.countDocuments({ role: 'tourist', lastActive: { $gte: last30min } }),
      Incident.countDocuments(),
      Incident.countDocuments({ status: 'open' }),
      Incident.countDocuments({ severity: 'critical', status: { $ne: 'resolved' } }),
      Incident.countDocuments({ createdAt: { $gte: last24h } }),
      Incident.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]),
      Incident.aggregate([
        { $group: { _id: '$severity', count: { $sum: 1 } } }
      ]),
      Incident.find()
        .populate('userId', 'name dtid')
        .sort({ createdAt: -1 })
        .limit(10)
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalTourists,
          activeTourists,
          totalIncidents,
          openIncidents,
          criticalIncidents,
          incidents24h
        },
        incidentsByType: incidentsByType.reduce((acc, i) => ({ ...acc, [i._id]: i.count }), {}),
        incidentsBySeverity: incidentsBySeverity.reduce((acc, i) => ({ ...acc, [i._id]: i.count }), {}),
        recentIncidents
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats' });
  }
};

exports.getIncidentTrends = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const trends = await Incident.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            type: '$type'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    const hourlyDistribution = await Incident.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: { trends, hourlyDistribution }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch incident trends' });
  }
};

exports.getHeatmapData = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const heatmapPoints = await Incident.find(
      { createdAt: { $gte: startDate } },
      { location: 1, severity: 1, type: 1 }
    ).lean();

    const data = heatmapPoints.map(point => ({
      lat: point.location.coordinates[1],
      lng: point.location.coordinates[0],
      intensity: point.severity === 'critical' ? 1.0 :
                 point.severity === 'high' ? 0.75 :
                 point.severity === 'medium' ? 0.5 : 0.25,
      type: point.type
    }));

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch heatmap data' });
  }
};

exports.getResponseTimeAnalytics = async (req, res) => {
  try {
    const resolvedIncidents = await Incident.find({
      status: { $in: ['resolved', 'false_alarm'] },
      resolvedAt: { $exists: true }
    }).lean();

    const responseTimes = resolvedIncidents.map(inc => ({
      type: inc.type,
      severity: inc.severity,
      responseTimeMinutes: (new Date(inc.resolvedAt) - new Date(inc.createdAt)) / (1000 * 60)
    }));

    const avgByType = {};
    const avgBySeverity = {};

    responseTimes.forEach(rt => {
      if (!avgByType[rt.type]) avgByType[rt.type] = [];
      avgByType[rt.type].push(rt.responseTimeMinutes);

      if (!avgBySeverity[rt.severity]) avgBySeverity[rt.severity] = [];
      avgBySeverity[rt.severity].push(rt.responseTimeMinutes);
    });

    const calcAvg = (arr) => arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2) : 0;

    res.json({
      success: true,
      data: {
        avgResponseByType: Object.entries(avgByType).reduce((acc, [k, v]) => ({ ...acc, [k]: calcAvg(v) }), {}),
        avgResponseBySeverity: Object.entries(avgBySeverity).reduce((acc, [k, v]) => ({ ...acc, [k]: calcAvg(v) }), {}),
        totalResolved: resolvedIncidents.length,
        overallAvgMinutes: calcAvg(responseTimes.map(r => r.responseTimeMinutes))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch analytics' });
  }
};
