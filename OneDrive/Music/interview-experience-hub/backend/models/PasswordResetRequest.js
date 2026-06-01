const mongoose = require('mongoose');

const PasswordResetRequestSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  userRole: { type: String, enum: ['student', 'interviewer'], required: true, index: true },
  name: { type: String, required: true },
  email: { type: String, required: true, index: true },
  phone: { type: String, required: true },
  organization: { type: String, required: true },
  organizationType: { type: String, enum: ['college', 'company'], required: true },
  reason: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'approved', 'completed', 'expired', 'declined'], default: 'pending', index: true },
  accountCreatedAt: { type: String, default: '' },
  lastLoginAt: { type: String, default: '' },
  createdAt: { type: String, default: () => new Date().toISOString() },
  approvedAt: { type: String, default: '' },
  expiresAt: { type: String, default: '' },
  declinedAt: { type: String, default: '' },
  expiredAt: { type: String, default: '' },
  completedAt: { type: String, default: '' },
  openedAt: { type: String, default: '' },
  passwordChangedAt: { type: String, default: '' },
  lifecycleEvents: { type: Array, default: [] }
}, { versionKey: false });

module.exports = mongoose.models.PasswordResetRequest || mongoose.model('PasswordResetRequest', PasswordResetRequestSchema);
