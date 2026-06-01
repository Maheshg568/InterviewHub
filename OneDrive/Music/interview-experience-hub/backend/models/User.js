const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  role: { type: String, enum: ['student', 'interviewer', 'admin'], required: true, index: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  phone: { type: String, default: '' },
  password: { type: String, required: true },
  college: { type: String, default: '' },
  course: { type: String, default: '' },
  bio: { type: String, default: '' },
  company: { type: String, default: '' },
  experience: { type: String, default: '' },
  yearsOfExperience: { type: Number, default: 0 },
  specialization: { type: String, default: '' },
  age: { type: Number, default: null },
  city: { type: String, default: '' },
  area: { type: String, default: '' },
  primaryExpertise: { type: String, default: '' },
  skillTags: { type: Array, default: [] },
  interviewServices: { type: Array, default: [] },
  availabilityPreference: { type: Array, default: [] },
  status: { type: String, default: 'active' },
  proofOfWork: {
    fileName: String,
    filePath: String,
    mimeType: String,
    uploadedAt: String
  },
  paymentQr: {
    fileName: String,
    filePath: String,
    mimeType: String,
    uploadedAt: String
  },
  refundInfo: {
    upiId: { type: String, default: '' },
    qrCode: {
      fileName: String,
      filePath: String,
      mimeType: String,
      uploadedAt: String
    }
  },
  profileImage: {
    fileName: String,
    filePath: String,
    mimeType: String,
    uploadedAt: String,
    focusX: { type: Number, default: 50 },
    focusY: { type: Number, default: 50 }
  },
  verification: {
    status: { type: String, enum: ['required', 'pending', 'update_pending', 'under_review', 'verified', 'rejected', 'declined'], default: 'required' },
    requestId: { type: String, default: '' },
    requestType: { type: String, enum: ['new', 'update'], default: 'new' },
    documentType: { type: String, default: '' },
    fileName: String,
    filePath: String,
    mimeType: String,
    uploadedAt: String,
    reviewedAt: String,
    reviewedBy: String,
    rejectionReason: { type: String, default: '' }
  },
  verificationSuccessDismissedAt: { type: String, default: null },
  lastProfileEditedAt: { type: String, default: null },
  lastProfileEditSummary: { type: Array, default: [] },
  passwordChangedAt: { type: String, default: null },
  resumes: { type: Array, default: [] },
  aiPracticeSessions: { type: Number, default: 0 },
  aiPracticeTopics: { type: Array, default: [] },
  lastActive: { type: String, default: null },
  createdAt: { type: String, default: () => new Date().toISOString() }
}, { versionKey: false });

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
