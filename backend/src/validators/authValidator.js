const { z } = require('zod');

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(128),
  role: z.enum(['tourist', 'authority']).default('tourist'),
  phone: z.string().optional(),
  nationality: z.string().optional(),
  emergencyContact: z.object({
    name: z.string(),
    phone: z.string(),
    relation: z.string()
  }).optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

module.exports = { registerSchema, loginSchema };
