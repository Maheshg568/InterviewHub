const mongoose = require('mongoose');

const IssueDisputeSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  type: { type: String, enum: ['refund_dispute', 'interview_issue'], required: true, index: true },
  status: { type: String, enum: ['open', 'under_review', 'resolved'], default: 'open', index: true },
  bookingId: { type: String, required: true, index: true },
  displayBookingId: { type: String, default: '' },
  studentId: { type: String, default: '', index: true },
  studentName: { type: String, default: '' },
  interviewerId: { type: String, default: '', index: true },
  interviewerName: { type: String, default: '' },
  refundProof: { type: Object, default: null },
  refundAmount: { type: Number, default: 0 },
  refundCurrency: { type: String, default: 'INR' },
  refundUtr: { type: String, default: '' },
  refundRequestedAt: { type: String, default: '' },
  disputeAt: { type: String, default: '' },
  studentComment: { type: String, default: '' },
  interviewDurationMinutes: { type: Number, default: null },
  issueDate: { type: String, default: '' },
  issueTime: { type: String, default: '' },
  adminDecision: { type: String, default: '' },
  history: { type: Array, default: [] },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() }
}, { versionKey: false });

module.exports = mongoose.models.IssueDispute || mongoose.model('IssueDispute', IssueDisputeSchema);
