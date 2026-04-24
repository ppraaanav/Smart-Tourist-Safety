const { z } = require('zod');

const createIncidentSchema = z.object({
  type: z.enum(['sos', 'anomaly', 'geofence_breach', 'inactivity', 'route_deviation']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  location: z.object({
    coordinates: z.array(z.number()).length(2)
  }),
  description: z.string().optional(),
  metadata: z.object({
    speed: z.number().optional(),
    locationVariance: z.number().optional(),
    anomalyScore: z.number().optional()
  }).optional()
});

const updateIncidentSchema = z.object({
  status: z.enum(['open', 'investigating', 'resolved', 'false_alarm']).optional(),
  resolutionNotes: z.string().optional(),
  assignedTo: z.string().optional()
});

const locationUpdateSchema = z.object({
  coordinates: z.array(z.number()).length(2),
  accuracy: z.number().optional(),
  speed: z.number().optional(),
  heading: z.number().optional(),
  altitude: z.number().optional(),
  battery: z.number().optional()
});

const geofenceSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  type: z.enum(['danger', 'restricted', 'safe', 'warning']).default('danger'),
  geometry: z.object({
    type: z.literal('Polygon'),
    coordinates: z.array(z.array(z.array(z.number())))
  }),
  center: z.object({
    coordinates: z.array(z.number()).length(2)
  }).optional(),
  radius: z.number().optional(),
  alertMessage: z.string().optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).default('high')
});

module.exports = { createIncidentSchema, updateIncidentSchema, locationUpdateSchema, geofenceSchema };
