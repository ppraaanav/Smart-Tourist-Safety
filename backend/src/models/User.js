const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['tourist', 'authority', 'admin'],
    default: 'tourist'
  },
  dtid: {
    type: String,
    unique: true,
    sparse: true
  },
  phone: {
    type: String,
    trim: true
  },
  nationality: {
    type: String,
    trim: true
  },
  emergencyContact: {
    name: String,
    phone: String,
    relation: String
  },
  avatar: {
    type: String,
    default: ''
  },
  lastKnownLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  pushSubscription: {
    type: Object,
    default: null
  },
  preferences: {
    language: { type: String, default: 'en' },
    notifications: { type: Boolean, default: true }
  }
}, {
  timestamps: true
});

// Index for geospatial queries
userSchema.index({ lastKnownLocation: '2dsphere' });
userSchema.index({ dtid: 1 });
userSchema.index({ role: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Generate DTID before saving
userSchema.pre('save', function(next) {
  if (!this.dtid && this.role === 'tourist') {
    const prefix = 'DTID';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = crypto.randomBytes(3).toString('hex').toUpperCase();
    this.dtid = `${prefix}-${timestamp}-${random}`;
  }
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
