const mongoose = require('mongoose');

const VerificationRequestSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  interviewerId: { type: String, required: true, index: true },
  requestType: { type: String, enum: ['new', 'update'], default: 'new', index: true },
  status: { type: String, enum: ['pending', 'update_pending', 'under_review', 'verified', 'declined'], default: 'pending', index: true },
  profile: { type: Object, default: {} },
  profileImage: { type: Object, default: null },
  oldDocument: { type: Object, default: null },
  document: {
    documentType: { type: String, default: '' },
    fileName: String,
    filePath: String,
    mimeType: String,
    uploadedAt: String
  },
  reviewedAt: { type: String, default: '' },
  reviewedBy: { type: String, default: '' },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() }
}, { versionKey: false });

module.exports = mongoose.models.VerificationRequest || mongoose.model('VerificationRequest', VerificationRequestSchema);
