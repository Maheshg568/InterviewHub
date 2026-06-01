const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

const User = require('../models/User');
const Booking = require('../models/Booking');
const VerificationRequest = require('../models/VerificationRequest');
const PasswordResetRequest = require('../models/PasswordResetRequest');
const IssueDispute = require('../models/IssueDispute');
const TIMEZONE = 'Asia/Kolkata';
const SLOT_OPTIONS = [
  { label: '07:00 AM – 09:00 AM', start: '07:00:00', end: '09:00:00', legacy: ['07:00-09:00'] },
  { label: '09:00 AM – 11:00 AM', start: '09:00:00', end: '11:00:00', legacy: ['09:00-11:00'] },
  { label: '10:00 AM – 12:00 PM', start: '10:00:00', end: '12:00:00', legacy: ['10:00-12:00'] },
  { label: '11:00 AM – 01:00 PM', start: '11:00:00', end: '13:00:00', legacy: ['11:00-13:00'] },
  { label: '12:00 PM – 02:00 PM', start: '12:00:00', end: '14:00:00', legacy: ['12:00-14:00'] },
  { label: '01:00 PM – 03:00 PM', start: '13:00:00', end: '15:00:00', legacy: ['13:00-15:00'] },
  { label: '03:00 PM – 05:00 PM', start: '15:00:00', end: '17:00:00', legacy: ['15:00-17:00'] },
  { label: '05:00 PM – 07:00 PM', start: '17:00:00', end: '19:00:00', legacy: ['17:00-19:00'] },
  { label: '06:00 PM – 08:00 PM', start: '18:00:00', end: '20:00:00', legacy: ['18:00-20:00'] },
  { label: '07:00 PM – 09:00 PM', start: '19:00:00', end: '21:00:00', legacy: ['19:00-21:00'] }
];

const normalizeSlotLabel = (value) => String(value || '').replace(/\s+/g, '').replace(/[–—]/g, '-').toLowerCase();
const getSlotDefinition = (value) => {
  const normalized = normalizeSlotLabel(value);
  return SLOT_OPTIONS.find(option => normalizeSlotLabel(option.label) === normalized || option.legacy.some(legacy => normalizeSlotLabel(legacy) === normalized));
};
const makeSlot = (date, value) => {
  const definition = getSlotDefinition(value);
  if (!date || !definition) return null;
  return {
    date: String(date),
    time: definition.label,
    label: definition.label,
    selectedDate: String(date),
    slotLabel: definition.label,
    slotStartTime: definition.start,
    slotEndTime: definition.end,
    timezone: TIMEZONE
  };
};

const requireAdmin = (req, res, next) => {
  if (!req.session?.user) return res.status(401).json({ error: 'Not authenticated' });
  if (req.session.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  next();
};

const calculateInterviewerCompletion = (user) => {
  const required = [
    Boolean(user.profileImage?.filePath),
    Boolean(String(user.name || '').trim()),
    Number(user.age) > 0,
    Boolean(String(user.phone || '').trim()),
    Number(user.yearsOfExperience) > 0,
    Boolean(String(user.company || '').trim()),
    Boolean(String(user.primaryExpertise || user.specialization || '').trim()),
    Boolean(String(user.city || '').trim()),
    Boolean(String(user.area || '').trim()),
    Boolean(String(user.bio || '').trim()),
    Array.isArray(user.interviewServices) && user.interviewServices.length > 0
  ];
  return Math.round((required.filter(Boolean).length / required.length) * 100);
};

const formatVerificationRequest = (request) => ({
  id: request.id,
  interviewerId: request.interviewerId,
  requestType: request.requestType || 'new',
  status: request.status || 'pending',
  profile: request.profile || {},
  profileImage: request.profileImage || null,
  oldDocument: request.oldDocument || null,
  document: request.document || null,
  createdAt: request.createdAt || '',
  updatedAt: request.updatedAt || '',
  reviewedAt: request.reviewedAt || '',
  reviewedBy: request.reviewedBy || ''
});

const expirePasswordResetRequests = async () => {
  const now = new Date();
  const approved = await PasswordResetRequest.find({ status: 'approved' });
  for (const request of approved) {
    if (request.expiresAt && new Date(request.expiresAt).getTime() <= now.getTime()) {
      request.status = 'expired';
      request.expiredAt = now.toISOString();
      appendPasswordResetEvent(request, 'password_reset_expired', {
        at: request.expiredAt,
        status: 'Failed',
        notes: 'Approved password reset request expired after 7 days.'
      });
      await request.save();
    }
  }
};

const appendPasswordResetEvent = (request, type, details = {}) => {
  if ((request.lifecycleEvents || []).some(event => event.type === type)) return;
  request.lifecycleEvents = [
    ...(request.lifecycleEvents || []),
    {
      type,
      at: details.at || new Date().toISOString(),
      actorType: details.actorType || 'System',
      actorName: details.actorName || '',
      status: details.status || 'Completed',
      notes: details.notes || '',
      metadata: details.metadata || {}
    }
  ];
};

const formatPasswordResetRequest = (request) => ({
  id: request.id,
  userId: request.userId,
  userRole: request.userRole,
  name: request.name,
  email: request.email,
  phone: request.phone,
  organization: request.organization,
  organizationType: request.organizationType,
  reason: request.reason || '',
  status: request.status,
  accountCreatedAt: request.accountCreatedAt || '',
  lastLoginAt: request.lastLoginAt || '',
  createdAt: request.createdAt || '',
  approvedAt: request.approvedAt || '',
  expiresAt: request.expiresAt || '',
  declinedAt: request.declinedAt || '',
  expiredAt: request.expiredAt || '',
  completedAt: request.completedAt || '',
  openedAt: request.openedAt || '',
  passwordChangedAt: request.passwordChangedAt || '',
  lifecycleEvents: request.lifecycleEvents || []
});

const formatIssueDispute = (issue) => ({
  id: issue.id,
  type: issue.type,
  status: issue.status,
  bookingId: issue.bookingId,
  displayBookingId: issue.displayBookingId,
  studentId: issue.studentId,
  studentName: issue.studentName,
  interviewerId: issue.interviewerId,
  interviewerName: issue.interviewerName,
  refundProof: issue.refundProof || null,
  refundRequestedAt: issue.refundRequestedAt || '',
  disputeAt: issue.disputeAt || '',
  studentComment: issue.studentComment || '',
  interviewDurationMinutes: issue.interviewDurationMinutes,
  issueDate: issue.issueDate || '',
  issueTime: issue.issueTime || '',
  adminDecision: issue.adminDecision || '',
  history: issue.history || [],
  createdAt: issue.createdAt || '',
  updatedAt: issue.updatedAt || ''
});

const getIstParts = (date = new Date()) => ({
  date: date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: TIMEZONE }),
  time: `${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: TIMEZONE })} IST`
});

const trackerEvent = (booking, type, at, details = {}) => {
  const date = at ? new Date(at) : new Date();
  const ist = getIstParts(date);
  return {
    type,
    at: date.toISOString(),
    date: ist.date,
    time: ist.time,
    timezone: TIMEZONE,
    bookingId: booking.bookingId || booking.id,
    studentId: booking.studentId,
    interviewerId: booking.interviewerId,
    ...details
  };
};

const hasTrackerEvent = (booking, type) => (booking.bookingEvents || []).some(event => event.type === type);
const getTrackerEvent = (booking, type) => (booking.bookingEvents || []).find(event => event.type === type);

const pushTrackerEvent = (booking, type, at, details = {}) => {
  if (hasTrackerEvent(booking, type)) return false;
  booking.bookingEvents = [...(booking.bookingEvents || []), trackerEvent(booking, type, at, details)];
  return true;
};

const normalizePaymentEvidence = (booking, item = {}, index = 0) => {
  const submittedAt = item.submittedAt || item.uploadedAt || booking.updatedAt || booking.createdAt || new Date().toISOString();
  const ist = getIstParts(new Date(submittedAt));
  return {
    id: item.id || `payment-evidence-${booking.id}-${index}`,
    type: item.type || (index === 0 ? 'original' : 'reupload'),
    fileName: item.fileName || booking.paymentProofName || '',
    filePath: item.filePath || booking.paymentProof || '',
    utr: item.utr || booking.paymentUtr || booking.utiNumber || '',
    studentName: item.studentName || booking.studentName || 'Student',
    bookingId: item.bookingId || booking.bookingId || booking.id,
    submittedAt,
    submissionDate: item.submissionDate || ist.date,
    submissionTime: item.submissionTime || ist.time,
    timezone: item.timezone || TIMEZONE
  };
};

const getPaymentEvidenceHistory = (booking) => {
  const existing = Array.isArray(booking.paymentSubmissions) ? booking.paymentSubmissions : [];
  if (existing.length) {
    return existing.map((item, index) => normalizePaymentEvidence(booking, item, index));
  }
  if (!booking.paymentProof) return [];
  return [normalizePaymentEvidence(booking, {
    fileName: booking.paymentProofName || '',
    filePath: booking.paymentProof || '',
    utr: booking.paymentUtr || booking.utiNumber || '',
    submittedAt: booking.updatedAt || booking.createdAt
  }, 0)];
};

const getPaymentEvidencePayload = (booking) => {
  const evidenceHistory = getPaymentEvidenceHistory(booking);
  return {
    evidenceType: 'payment',
    evidence: evidenceHistory[evidenceHistory.length - 1] || null,
    evidenceHistory
  };
};

const hasRefundEvent = (booking, type) => (booking.refundEvents || []).some(event => event.type === type);
const getRefundEvent = (booking, type) => (booking.refundEvents || []).find(event => event.type === type);
const pushRefundEvent = (booking, type, at, details = {}) => {
  if (hasRefundEvent(booking, type)) return false;
  const date = at ? new Date(at) : new Date();
  const ist = getIstParts(date);
  booking.refundEvents = [
    ...(booking.refundEvents || []),
    {
      type,
      at: date.toISOString(),
      date: ist.date,
      time: ist.time,
      timezone: TIMEZONE,
      bookingId: booking.bookingId || booking.id,
      ...details
    }
  ];
  return true;
};

const buildRefundEvidencePayload = (booking) => {
  const snapshot = booking.refundSnapshot || {};
  const evidenceHistory = [];
  if (snapshot.refundQrSnapshot?.filePath) {
    evidenceHistory.push({
      id: `refund-qr-${booking.id}`,
      label: 'Refund QR Snapshot',
      fileName: snapshot.refundQrSnapshot.fileName || 'Refund QR',
      filePath: snapshot.refundQrSnapshot.filePath,
      viewLabel: 'View QR Snapshot',
      downloadLabel: 'Download QR Snapshot',
      studentName: snapshot.studentName || booking.studentName || 'Student',
      bookingId: booking.bookingId || booking.id,
      submittedAt: snapshot.capturedAt || booking.refundRequiredAt || booking.createdAt,
      submissionDate: snapshot.capturedAt ? getIstParts(new Date(snapshot.capturedAt)).date : '',
      submissionTime: snapshot.capturedAt ? getIstParts(new Date(snapshot.capturedAt)).time : ''
    });
  }
  if (booking.refundProof?.filePath) {
    evidenceHistory.push({
      id: `refund-proof-${booking.id}`,
      label: 'Refund Screenshot',
      fileName: booking.refundProof.fileName || 'Refund Screenshot',
      filePath: booking.refundProof.filePath,
      viewLabel: 'View Refund Screenshot',
      downloadLabel: 'Download Refund Screenshot',
      utr: booking.refundUtr || '',
      studentName: snapshot.studentName || booking.studentName || 'Student',
      bookingId: booking.bookingId || booking.id,
      submittedAt: booking.refundSubmittedAt || booking.refundProof.uploadedAt || '',
      submissionDate: booking.refundSubmittedDate || '',
      submissionTime: booking.refundSubmittedTime || ''
    });
  }
  return {
    evidenceType: 'refund',
    evidenceHistory,
    rows: [
      ['Booking ID', booking.bookingId || booking.id],
      ['Student Name', snapshot.studentName || booking.studentName || 'Student'],
      ['Interviewer Name', booking.interviewerName || 'Interviewer'],
      ['Refund Amount', `${booking.refundCurrency || snapshot.paymentCurrency || 'INR'} ${booking.refundAmount || snapshot.paymentAmount || 0}`],
      ['UPI Snapshot', snapshot.refundUpiSnapshot || 'N/A'],
      ['UTR Number', booking.refundUtr || 'N/A'],
      ['Submission Time', booking.refundSubmittedAt ? `${getIstParts(new Date(booking.refundSubmittedAt)).date}, ${getIstParts(new Date(booking.refundSubmittedAt)).time}` : 'N/A'],
      ['Confirmation Time', booking.refundConfirmedAt ? `${getIstParts(new Date(booking.refundConfirmedAt)).date}, ${getIstParts(new Date(booking.refundConfirmedAt)).time}` : 'N/A'],
      ['Dispute Time', booking.refundDisputedAt ? `${getIstParts(new Date(booking.refundDisputedAt)).date}, ${getIstParts(new Date(booking.refundDisputedAt)).time}` : 'N/A']
    ]
  };
};

const buildFeedbackRows = (booking) => ([
  ['Booking ID', booking.bookingId || booking.id],
  ['Student Name', booking.studentName || 'Student'],
  ['Interviewer Name', booking.interviewerName || 'Interviewer'],
  ['Feedback Text', booking.feedback?.comments || 'N/A'],
  ['Resume Score', booking.feedback?.resumeScore != null ? `${booking.feedback.resumeScore}/10` : 'N/A'],
  ['Resume Comments', booking.feedback?.comments || 'N/A'],
  ['Timestamp', booking.feedback?.submittedAt ? `${getIstParts(new Date(booking.feedback.submittedAt)).date}, ${getIstParts(new Date(booking.feedback.submittedAt)).time}` : 'N/A']
]);

const ensureC3TrackerEvents = async (booking) => {
  let changed = false;
  if (booking.refundStatus || booking.refundRequiredAt) {
    if (booking.refundRequiredAt) {
      changed = pushRefundEvent(booking, 'refund_required_created', booking.refundRequiredAt, {
        refundAmount: booking.refundAmount,
        refundCurrency: booking.refundCurrency
      }) || changed;
    }
    if (booking.refundSnapshot) {
      changed = pushRefundEvent(booking, 'refund_snapshot_stored', booking.refundSnapshot.capturedAt || booking.refundRequiredAt || booking.createdAt, {
        refundSnapshot: booking.refundSnapshot
      }) || changed;
    }
    if (booking.refundPendingTriggeredAt) changed = pushRefundEvent(booking, 'refund_pending_triggered', booking.refundPendingTriggeredAt) || changed;
    if (booking.refundProof?.filePath) {
      changed = pushRefundEvent(booking, 'refund_screenshot_uploaded', booking.refundProof.uploadedAt || booking.refundSubmittedAt || booking.updatedAt, {
        screenshotFile: booking.refundProof,
        screenshotUploader: booking.interviewerName || 'Interviewer'
      }) || changed;
    }
    if (booking.refundUtr) {
      changed = pushRefundEvent(booking, 'refund_utr_submitted', booking.refundSubmittedAt || booking.updatedAt, {
        utr: booking.refundUtr,
        validationStatus: 'valid'
      }) || changed;
    }
    if (booking.refundSubmittedAt) {
      changed = pushRefundEvent(booking, 'refund_sent', booking.refundSubmittedAt, {
        refundSubmittedBy: booking.interviewerName || 'Interviewer'
      }) || changed;
      changed = pushRefundEvent(booking, 'student_confirmation_requested', booking.refundSubmittedAt) || changed;
    }
    if (booking.refundConfirmedAt) changed = pushRefundEvent(booking, 'refund_completed', booking.refundConfirmedAt, { confirmedByStudent: booking.studentName || 'Student' }) || changed;
    if (booking.refundDisputedAt) changed = pushRefundEvent(booking, 'refund_disputed', booking.refundDisputedAt, { issueId: booking.refundDisputeId || '' }) || changed;
    if (booking.refundAdminReviewRequiredAt) changed = pushRefundEvent(booking, 'admin_review_required', booking.refundAdminReviewRequiredAt, { timeoutReason: 'no student response' }) || changed;
  }

  if (booking.sessionEndedAt) {
    const endedType = hasTrackerEvent(booking, 'interview_auto_closed') ? 'auto' : 'manual';
    changed = pushTrackerEvent(booking, 'feedback_interview_ended', booking.sessionEndedAt, {
      actor: endedType === 'auto' ? 'System' : booking.interviewerName || 'Interviewer',
      endMode: endedType
    }) || changed;
    if (!booking.feedback?.submittedAt) {
      changed = pushTrackerEvent(booking, 'awaiting_interviewer_feedback', booking.sessionEndedAt, {
        actor: 'System',
        notes: 'Interview completed. Waiting for interviewer feedback.'
      }) || changed;
    }
    const tenMinutesAfter = new Date(new Date(booking.sessionEndedAt).getTime() + 10 * 60 * 1000);
    if (!booking.feedback?.submittedAt && Date.now() >= tenMinutesAfter.getTime()) {
      const at = booking.feedbackReminderSentAt || tenMinutesAfter.toISOString();
      booking.feedbackReminderSentAt = booking.feedbackReminderSentAt || at;
      changed = pushTrackerEvent(booking, 'feedback_reminder_sent', at, { actor: 'System' }) || changed;
    }
    const oneHourAfter = new Date(new Date(booking.sessionEndedAt).getTime() + 60 * 60 * 1000);
    if (!booking.feedback?.submittedAt && Date.now() >= oneHourAfter.getTime()) {
      const at = booking.feedbackDashboardReminderAt || oneHourAfter.toISOString();
      booking.feedbackDashboardReminderAt = booking.feedbackDashboardReminderAt || at;
      changed = pushTrackerEvent(booking, 'feedback_dashboard_reminder', at, { actor: 'System' }) || changed;
    }
  }
  if (booking.feedback?.submittedAt) {
    changed = pushTrackerEvent(booking, 'feedback_submitted', booking.feedback.submittedAt, {
      actor: booking.interviewerName || 'Interviewer',
      feedbackText: booking.feedback.comments || '',
      feedback: booking.feedback
    }) || changed;
    changed = pushTrackerEvent(booking, 'resume_rating_submitted', booking.feedback.submittedAt, {
      actor: booking.interviewerName || 'Interviewer',
      resumeScore: booking.feedback.resumeScore,
      resumeComments: booking.feedback.comments || ''
    }) || changed;
  }
  if (booking.feedbackViewedAt) {
    changed = pushTrackerEvent(booking, 'student_viewed_feedback', booking.feedbackViewedAt, { actor: booking.studentName || 'Student' }) || changed;
    changed = pushTrackerEvent(booking, 'feedback_completed', booking.feedbackViewedAt, { actor: 'System' }) || changed;
  }

  if (changed) {
    booking.updatedAt = new Date().toISOString();
    await booking.save();
  }
};

const getInterviewStartMs = (booking) => {
  if (!booking?.selectedDate || !booking?.slotStartTime || booking.timezone !== TIMEZONE) return null;
  const ms = new Date(`${booking.selectedDate}T${booking.slotStartTime}+05:30`).getTime();
  return Number.isFinite(ms) ? ms : null;
};

const getInterviewEndMs = (booking) => {
  if (!booking?.selectedDate || !booking?.slotEndTime || booking.timezone !== TIMEZONE) return null;
  const ms = new Date(`${booking.selectedDate}T${booking.slotEndTime}+05:30`).getTime();
  return Number.isFinite(ms) ? ms : null;
};

const ensureTrackerEvents = async (booking, student) => {
  let changed = false;
  const createdAt = booking.createdAt || new Date().toISOString();
  changed = pushTrackerEvent(booking, 'interviewer_selected', createdAt, {
    interviewerId: booking.interviewerId,
    interviewerName: booking.interviewerName || ''
  }) || changed;
  changed = pushTrackerEvent(booking, 'topic_selected', createdAt, {
    topicName: booking.domain || ''
  }) || changed;
  const resume = (student?.resumes || [])
    .filter(item => item.uploadedAt)
    .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))[0];
  if (resume) {
    changed = pushTrackerEvent(booking, 'resume_uploaded', resume.uploadedAt, {
      fileName: resume.fileName || '',
      filePath: resume.filePath || ''
    }) || changed;
  }
  changed = pushTrackerEvent(booking, 'interview_request_submitted', createdAt, {
    requestTimestamp: createdAt
  }) || changed;
  changed = pushTrackerEvent(booking, 'request_under_review', createdAt, {
    visibleToInterviewer: true
  }) || changed;

  if (booking.approvedAt) {
    changed = pushTrackerEvent(booking, 'booking_approved', booking.approvedAt, {
      actor: 'Interviewer',
      selectedDate: booking.selectedDate,
      slotStartTime: booking.slotStartTime,
      slotEndTime: booking.slotEndTime
    }) || changed;
  }
  if (booking.rescheduleProposal?.proposedAt) {
    changed = pushTrackerEvent(booking, 'reschedule_requested', booking.rescheduleProposal.proposedAt, {
      proposedDate: booking.rescheduleProposal.date,
      proposedSlots: booking.rescheduleProposal.slots || []
    }) || changed;
  }
  if (booking.rescheduleProposal?.selectedAt) {
    changed = pushTrackerEvent(booking, 'reschedule_slot_selected', booking.rescheduleProposal.selectedAt, {
      selectedSlot: booking.rescheduleProposal.selectedSlot || booking.selectedSlot || null
    }) || changed;
  }
  if (booking.rescheduleProposal?.confirmedAt) {
    changed = pushTrackerEvent(booking, 'reschedule_confirmed', booking.rescheduleProposal.confirmedAt, {
      selectedSlot: booking.selectedSlot || null
    }) || changed;
  }
  if (['rejected', 'cancelled_by_interviewer', 'cancelled_by_student', 'cancelled', 'no_response'].includes(booking.status)) {
    changed = pushTrackerEvent(booking, 'request_cancelled', booking.updatedAt || createdAt, {
      actor: booking.status === 'cancelled_by_student' ? 'Student' : 'Interviewer',
      reason: booking.interviewerMessage || booking.status
    }) || changed;
  }
  if (booking.paymentProof) {
    const paymentEvidencePayload = getPaymentEvidencePayload(booking);
    changed = pushTrackerEvent(booking, 'payment_screenshot_submitted', booking.updatedAt || createdAt, {
      fileName: booking.paymentProofName || '',
      filePath: booking.paymentProof || '',
      utr: booking.paymentUtr || booking.utiNumber || '',
      ...paymentEvidencePayload
    }) || changed;
    changed = pushTrackerEvent(booking, 'payment_under_review', booking.updatedAt || createdAt, {
      paymentStatus: booking.paymentStatus,
      ...paymentEvidencePayload
    }) || changed;
  }
  if (booking.paymentStatus === 'verified' && booking.paymentVerifiedAt) {
    changed = pushTrackerEvent(booking, 'payment_approved', booking.paymentVerifiedAt, {
      actor: booking.paymentApprovedByName || 'Interviewer',
      approverName: booking.paymentApprovedByName || 'Interviewer',
      approvalTimestamp: booking.paymentVerifiedAt,
      paymentAmount: booking.paymentAmount || 50,
      paymentCurrency: booking.paymentCurrency || 'INR',
      ...getPaymentEvidencePayload(booking)
    }) || changed;
  }
  if (booking.paymentStatus === 'rejected') {
    const rejectedAt = booking.paymentRejectedAt || booking.updatedAt || createdAt;
    changed = pushTrackerEvent(booking, 'payment_rejected', rejectedAt, {
      actor: booking.paymentRejectedByName || 'Interviewer',
      rejectedBy: booking.paymentRejectedByName || 'Interviewer',
      rejectionReason: booking.paymentRejectionReason || '',
      rejectionTimestamp: rejectedAt,
      ...getPaymentEvidencePayload(booking)
    }) || changed;
  }
  if (booking.confirmedAt) {
    changed = pushTrackerEvent(booking, 'booking_confirmed', booking.confirmedAt, {
      displayBookingId: booking.bookingId || booking.id,
      selectedDate: booking.selectedDate,
      slotLabel: booking.slotLabel,
      slotStartTime: booking.slotStartTime
    }) || changed;
    changed = pushTrackerEvent(booking, 'booking_id_generated', booking.confirmedAt, {
      displayBookingId: booking.bookingId || booking.id
    }) || changed;
  }
  if (booking.meetingLinkUploadedAt) {
    const uploadedAt = new Date(booking.meetingLinkUploadedAt);
    const startsAt = getInterviewStartMs(booking);
    const delayMinutes = startsAt && uploadedAt.getTime() > startsAt
      ? Math.ceil((uploadedAt.getTime() - startsAt) / 60000)
      : 0;
    changed = pushTrackerEvent(booking, 'meeting_link_uploaded', booking.meetingLinkUploadedAt, {
      meetingLink: booking.meetingLink || '',
      delayMinutes,
      warning: delayMinutes > 0
    }) || changed;
  }
  if (booking.studentJoinedAt) {
    changed = pushTrackerEvent(booking, 'meeting_link_opened', booking.studentJoinedAt, {
      meetingLink: booking.meetingLink || ''
    }) || changed;
  }
  const startsAt = getInterviewStartMs(booking);
  if (startsAt && Date.now() >= startsAt) {
    changed = pushTrackerEvent(booking, 'interview_session_active', new Date(startsAt).toISOString(), {
      selectedDate: booking.selectedDate,
      slotStartTime: booking.slotStartTime
    }) || changed;
  }
  const endsAt = getInterviewEndMs(booking);
  if (endsAt && ['confirmed', 'meeting_link_uploaded'].includes(booking.status) && Date.now() >= endsAt + 2 * 60 * 60 * 1000) {
    const autoClosedAt = new Date().toISOString();
    booking.status = 'session_ended';
    booking.sessionEndedAt = booking.sessionEndedAt || autoClosedAt;
    changed = pushTrackerEvent(booking, 'interview_auto_closed', booking.sessionEndedAt, {
      autoClosed: true,
      selectedDate: booking.selectedDate,
      slotEndTime: booking.slotEndTime
    }) || changed;
  } else if (booking.sessionEndedAt) {
    changed = pushTrackerEvent(booking, 'interview_ended', booking.sessionEndedAt, {
      selectedDate: booking.selectedDate,
      slotEndTime: booking.slotEndTime
    }) || changed;
  }

  if (changed) {
    booking.updatedAt = new Date().toISOString();
    await booking.save();
  }
};

const stepFromEvent = ({ booking, eventType, name, actor, icon, active = false, future = false, statusOverride = '', description = '', metadata = {} }) => {
  const event = getTrackerEvent(booking, eventType);
  const status = statusOverride || (event ? (event.warning ? 'warning' : 'completed') : active ? 'pending' : future ? 'future' : 'future');
  const paymentMetadata = String(eventType).startsWith('payment_') ? {
    ...getPaymentEvidencePayload(booking),
    approverName: event?.approverName || booking.paymentApprovedByName || '',
    approvalTimestamp: event?.approvalTimestamp || booking.paymentVerifiedAt || '',
    rejectedBy: event?.rejectedBy || booking.paymentRejectedByName || '',
    rejectionReason: event?.rejectionReason || booking.paymentRejectionReason || '',
    rejectionTimestamp: event?.rejectionTimestamp || booking.paymentRejectedAt || ''
  } : {};
  return {
    id: eventType,
    name,
    status,
    connectorStatus: status === 'completed' ? 'completed' : status === 'warning' ? 'warning' : 'future',
    date: event?.date || 'Pending',
    time: event?.time || 'Pending',
    actor: event?.actor || actor,
    icon,
    description: description || event?.description || '',
    details: {
      bookingId: booking.bookingId || booking.id,
      actor: event?.actor || actor,
      date: event?.date || '',
      time: event?.time || '',
      rows: metadata.rows || paymentMetadata.rows || [],
      metadata: { ...(event || {}), ...paymentMetadata, ...metadata },
      evidence: paymentMetadata.evidence || event?.evidence || null,
      evidenceHistory: paymentMetadata.evidenceHistory || event?.evidenceHistory || []
    }
  };
};

const buildTrackerGroups = (booking) => {
  const approvedEvent = getTrackerEvent(booking, 'booking_approved');
  const rescheduleEvent = getTrackerEvent(booking, 'reschedule_requested');
  const cancelledEvent = getTrackerEvent(booking, 'request_cancelled');
  const paymentApprovedEvent = getTrackerEvent(booking, 'payment_approved');
  const paymentRejectedEvent = getTrackerEvent(booking, 'payment_rejected');
  const paymentReuploadEvent = getTrackerEvent(booking, 'payment_screenshot_reuploaded');
  const meetingLinkEvent = getTrackerEvent(booking, 'meeting_link_uploaded');
  const autoClosedEvent = getTrackerEvent(booking, 'interview_auto_closed');

  const requestUnderReviewActive = !approvedEvent && !rescheduleEvent && !cancelledEvent;
  const paymentUnderReviewActive = Boolean(getTrackerEvent(booking, 'payment_under_review')) && !paymentApprovedEvent && !paymentRejectedEvent;
  const reReviewActive = Boolean(getTrackerEvent(booking, 'payment_re_review')) && !paymentApprovedEvent;
  const interviewActive = Boolean(getTrackerEvent(booking, 'interview_session_active')) && !getTrackerEvent(booking, 'interview_ended') && !autoClosedEvent;

  const bookingSteps = [
    stepFromEvent({ booking, eventType: 'interviewer_selected', name: 'Interviewer Selected', actor: 'Student', icon: 'user' }),
    stepFromEvent({ booking, eventType: 'topic_selected', name: 'Topic Selected', actor: 'Student', icon: 'booking', metadata: { topicName: booking.domain || '' } }),
    stepFromEvent({ booking, eventType: 'resume_uploaded', name: 'Resume Uploaded', actor: 'Student', icon: 'user' }),
    stepFromEvent({ booking, eventType: 'interview_request_submitted', name: 'Interview Request Submitted', actor: 'Student', icon: 'booking' }),
    {
      ...stepFromEvent({ booking, eventType: 'request_under_review', name: 'Request Under Review', actor: 'Interviewer', icon: 'booking', active: requestUnderReviewActive }),
      branches: [
        approvedEvent && { id: 'interviewer-approves', name: 'Interviewer Approves', status: 'completed', description: approvedEvent.time },
        rescheduleEvent && { id: 'interviewer-reschedule', name: 'Interviewer Requests Reschedule', status: 'warning', description: rescheduleEvent.time },
        cancelledEvent && { id: 'request-cancelled', name: 'Request Cancelled', status: 'cancelled', description: cancelledEvent.reason || cancelledEvent.time }
      ].filter(Boolean)
    }
  ];

  if (rescheduleEvent) {
    bookingSteps.push(
      stepFromEvent({ booking, eventType: 'reschedule_requested', name: 'Reschedule Requested', actor: 'Interviewer', icon: 'warning', statusOverride: 'warning' }),
      stepFromEvent({ booking, eventType: 'reschedule_slot_selected', name: 'Student Selected New Slot', actor: 'Student', icon: 'booking' }),
      stepFromEvent({ booking, eventType: 'reschedule_confirmed', name: 'Interviewer Confirmed Reschedule', actor: 'Interviewer', icon: 'booking' })
    );
  }

  bookingSteps.push(
    stepFromEvent({ booking, eventType: 'booking_confirmed', name: 'Booking Confirmed', actor: 'Interviewer', icon: 'booking' }),
    stepFromEvent({ booking, eventType: 'booking_id_generated', name: 'Booking ID Generated', actor: 'System', icon: 'booking', metadata: { displayBookingId: booking.bookingId || booking.id } })
  );

  const paymentSteps = [
    stepFromEvent({ booking, eventType: 'payment_screenshot_submitted', name: 'Payment Screenshot Submitted', actor: 'Student', icon: 'payment' }),
    {
      ...stepFromEvent({
        booking,
        eventType: 'payment_under_review',
        name: 'Payment Under Review',
        actor: 'Interviewer',
        icon: 'payment',
        active: paymentUnderReviewActive,
        statusOverride: paymentRejectedEvent ? 'failed' : '',
        metadata: {
          approval: paymentApprovedEvent || null,
          rejection: paymentRejectedEvent || null
        }
      }),
      branches: [
        paymentApprovedEvent && { id: 'payment-approved', name: 'Payment Approved', status: 'completed', description: paymentApprovedEvent.time },
        paymentRejectedEvent && { id: 'payment-rejected', name: 'Payment Rejected', status: 'failed', description: paymentRejectedEvent.time }
      ].filter(Boolean)
    }
  ];

  if (paymentRejectedEvent || paymentReuploadEvent) {
    paymentSteps.push(
      stepFromEvent({ booking, eventType: 'payment_screenshot_reuploaded', name: 'Student Reuploaded Payment Screenshot', actor: 'Student', icon: 'payment' }),
      stepFromEvent({ booking, eventType: 'payment_re_review', name: 'Payment Re-Review', actor: 'Interviewer', icon: 'payment', active: reReviewActive }),
      stepFromEvent({ booking, eventType: 'payment_approved', name: 'Payment Approved', actor: 'Interviewer', icon: 'payment' })
    );
  }

  const interviewSteps = [
    stepFromEvent({
      booking,
      eventType: 'meeting_link_uploaded',
      name: meetingLinkEvent?.delayMinutes ? `Meeting Link Uploaded (+${meetingLinkEvent.delayMinutes} Minutes Late)` : 'Meeting Link Uploaded',
      actor: 'Interviewer',
      icon: 'interview',
      statusOverride: meetingLinkEvent?.delayMinutes ? 'warning' : ''
    }),
    stepFromEvent({ booking, eventType: 'meeting_link_opened', name: 'Meeting Link Opened', actor: 'Student', icon: 'interview' }),
    stepFromEvent({ booking, eventType: 'interview_session_active', name: 'Interview Session Active', actor: 'System', icon: 'interview', active: interviewActive }),
    autoClosedEvent
      ? stepFromEvent({ booking, eventType: 'interview_auto_closed', name: 'Interview Auto Closed', actor: 'System', icon: 'warning', statusOverride: 'warning' })
      : stepFromEvent({ booking, eventType: 'interview_ended', name: 'Interview Ended', actor: 'Interviewer', icon: 'interview' })
  ];

  return [
    { id: 'booking-tracker', title: 'Booking Tracker', steps: bookingSteps },
    { id: 'payment-tracker', title: 'Payment Tracker', steps: paymentSteps },
    { id: 'interview-tracker', title: 'Interview Tracker', steps: interviewSteps }
  ];
};

const stepFromRefundEvent = ({ booking, eventType, name, status = 'completed', active = false, icon = 'refund', description = '', metadata = {}, branches = [] }) => {
  const event = getRefundEvent(booking, eventType);
  const resolvedStatus = event ? status : active ? 'pending' : 'future';
  const evidencePayload = buildRefundEvidencePayload(booking);
  return {
    id: eventType,
    name,
    status: resolvedStatus,
    statusLabel: active && !event ? 'Active' : '',
    connectorStatus: resolvedStatus === 'completed' ? 'completed' : resolvedStatus === 'warning' ? 'warning' : resolvedStatus === 'failed' ? 'failed' : 'future',
    date: event?.date || 'Pending',
    time: event?.time || 'Pending',
    actor: event?.actor || metadata.actor || '',
    icon,
    description: description || event?.notes || '',
    branches,
    details: {
      bookingId: booking.bookingId || booking.id,
      actor: event?.actor || metadata.actor || '',
      date: event?.date || '',
      time: event?.time || '',
      rows: evidencePayload.rows,
      evidenceHistory: evidencePayload.evidenceHistory,
      metadata: { ...(event || {}), ...metadata, ...evidencePayload }
    }
  };
};

const buildC3BookingGroups = (booking) => {
  const groups = [];
  if (booking.refundStatus || booking.refundRequiredAt || (booking.refundEvents || []).length) {
    const refundCompleted = Boolean(getRefundEvent(booking, 'refund_completed'));
    const refundDisputed = Boolean(getRefundEvent(booking, 'refund_disputed'));
    const adminReview = Boolean(getRefundEvent(booking, 'admin_review_required'));
    const refundSent = Boolean(getRefundEvent(booking, 'refund_sent'));
    groups.push({
      id: 'refund-tracker',
      title: 'Refund Tracker',
      steps: [
        stepFromRefundEvent({ booking, eventType: 'refund_required_created', name: 'Refund Required Created', description: 'Interviewer cancelled after payment.' }),
        stepFromRefundEvent({ booking, eventType: 'refund_snapshot_stored', name: 'Refund Snapshot Stored', description: 'Student refund information snapshot preserved.' }),
        stepFromRefundEvent({ booking, eventType: 'refund_pending_triggered', name: 'Refund Pending', status: 'warning', description: 'Refund has been pending for more than 24 hours.' }),
        stepFromRefundEvent({ booking, eventType: 'refund_screenshot_uploaded', name: 'Refund Screenshot Uploaded', description: 'Interviewer uploaded refund proof screenshot.' }),
        stepFromRefundEvent({ booking, eventType: 'refund_utr_submitted', name: 'UTR Submitted', description: 'Refund UTR was submitted and validated.' }),
        stepFromRefundEvent({ booking, eventType: 'refund_sent', name: 'Refund Sent', description: 'Refund marked as sent.' }),
        stepFromRefundEvent({
          booking,
          eventType: 'student_confirmation_requested',
          name: 'Student Confirmation Requested',
          active: refundSent && !refundCompleted && !refundDisputed && !adminReview,
          description: 'Student receives refund confirmation prompt.',
          branches: [
            refundCompleted && { id: 'refund-yes', name: 'YES - Refund Completed', status: 'completed', description: getRefundEvent(booking, 'refund_completed')?.time },
            refundDisputed && { id: 'refund-no', name: 'NO - Refund Dispute Created', status: 'failed', description: getRefundEvent(booking, 'refund_disputed')?.time }
          ].filter(Boolean)
        }),
        stepFromRefundEvent({ booking, eventType: 'refund_completed', name: 'Refund Completed', description: 'Student confirmed receiving refund.' }),
        stepFromRefundEvent({ booking, eventType: 'refund_disputed', name: 'Refund Dispute Created', status: 'failed', description: 'Student reported refund not received.' }),
        stepFromRefundEvent({ booking, eventType: 'admin_review_required', name: 'Admin Review Required', status: 'warning', description: 'No student response received within 7 days.' })
      ]
    });
  }

  if (booking.sessionEndedAt || booking.feedback?.submittedAt || booking.feedbackViewedAt) {
    const hasFeedback = Boolean(booking.feedback?.submittedAt);
    const viewed = Boolean(booking.feedbackViewedAt);
    const rows = buildFeedbackRows(booking);
    groups.push({
      id: 'feedback-tracker',
      title: 'Feedback Tracker',
      steps: [
        stepFromEvent({ booking, eventType: 'feedback_interview_ended', name: 'Interview Ended', actor: 'Interviewer', icon: 'feedback', metadata: { rows } }),
        stepFromEvent({ booking, eventType: 'awaiting_interviewer_feedback', name: 'Awaiting Interviewer Feedback', actor: 'System', icon: 'feedback', active: !hasFeedback, metadata: { rows } }),
        stepFromEvent({ booking, eventType: 'feedback_reminder_sent', name: 'Feedback Reminder Sent', actor: 'System', icon: 'warning', statusOverride: getTrackerEvent(booking, 'feedback_reminder_sent') ? 'warning' : '', metadata: { rows } }),
        stepFromEvent({ booking, eventType: 'feedback_dashboard_reminder', name: 'Dashboard Feedback Reminder Card', actor: 'System', icon: 'warning', statusOverride: getTrackerEvent(booking, 'feedback_dashboard_reminder') ? 'warning' : '', metadata: { rows } }),
        stepFromEvent({ booking, eventType: 'feedback_submitted', name: 'Feedback Submitted', actor: 'Interviewer', icon: 'feedback', metadata: { rows } }),
        stepFromEvent({ booking, eventType: 'resume_rating_submitted', name: 'Resume Rating Submitted', actor: 'Interviewer', icon: 'feedback', metadata: { rows } }),
        stepFromEvent({ booking, eventType: 'student_viewed_feedback', name: 'Student Viewed Feedback', actor: 'Student', icon: 'feedback', active: hasFeedback && !viewed, metadata: { rows } }),
        stepFromEvent({ booking, eventType: 'feedback_completed', name: 'Feedback Completed', actor: 'System', icon: 'feedback', metadata: { rows } })
      ]
    });
  }

  return groups;
};

const ensurePasswordResetTrackerEvents = async (request) => {
  let changed = false;
  const add = (type, at, details = {}) => {
    if ((request.lifecycleEvents || []).some(event => event.type === type) || !at) return;
    request.lifecycleEvents = [
      ...(request.lifecycleEvents || []),
      {
        type,
        at,
        actorType: details.actorType || 'System',
        actorName: details.actorName || '',
        status: details.status || 'Completed',
        notes: details.notes || '',
        metadata: details.metadata || {}
      }
    ];
    changed = true;
  };

  add('password_reset_requested', request.createdAt, {
    actorType: request.userRole,
    actorName: request.name,
    metadata: { userId: request.userId, role: request.userRole, email: request.email, phone: request.phone }
  });
  add('reset_link_sent', request.approvedAt, {
    actorType: 'Admin',
    actorName: 'Admin',
    metadata: { expiresAt: request.expiresAt }
  });
  add('reset_link_opened', request.openedAt, { actorType: request.userRole, actorName: request.name });
  add('password_updated', request.passwordChangedAt, {
    actorType: request.userRole,
    actorName: request.name,
    metadata: { passwordHashUpdated: true }
  });
  add('password_reset_completed', request.completedAt, {
    actorType: 'System',
    actorName: 'System',
    metadata: { oldPasswordInvalidated: true }
  });
  add('password_reset_expired', request.expiredAt, {
    actorType: 'System',
    actorName: 'System',
    status: 'Failed'
  });
  add('password_reset_declined', request.declinedAt, {
    actorType: 'Admin',
    actorName: 'Admin',
    status: 'Failed'
  });

  if (changed) await request.save();
};

const accountRows = (request) => ([
  ['User Name', request.name || 'N/A'],
  ['Role', request.userRole || 'N/A'],
  ['Email', request.email || 'N/A'],
  ['Phone', request.phone || 'N/A'],
  ['Request Timestamp', request.createdAt ? `${getIstParts(new Date(request.createdAt)).date}, ${getIstParts(new Date(request.createdAt)).time}` : 'N/A'],
  ['Approved Timestamp', request.approvedAt ? `${getIstParts(new Date(request.approvedAt)).date}, ${getIstParts(new Date(request.approvedAt)).time}` : 'N/A'],
  ['Opened Timestamp', request.openedAt ? `${getIstParts(new Date(request.openedAt)).date}, ${getIstParts(new Date(request.openedAt)).time}` : 'N/A'],
  ['Password Updated Timestamp', request.passwordChangedAt ? `${getIstParts(new Date(request.passwordChangedAt)).date}, ${getIstParts(new Date(request.passwordChangedAt)).time}` : 'N/A'],
  ['Expiry Timestamp', request.expiresAt ? `${getIstParts(new Date(request.expiresAt)).date}, ${getIstParts(new Date(request.expiresAt)).time}` : 'N/A'],
  ['Notes', request.reason || 'N/A']
]);

const passwordResetEvent = (request, type) => (request.lifecycleEvents || []).find(event => event.type === type);

const stepFromPasswordEvent = ({ request, eventType, name, active = false, status = 'completed', icon = 'password', description = '' }) => {
  const event = passwordResetEvent(request, eventType);
  const resolvedStatus = event ? (event.status === 'Failed' ? 'failed' : status) : active ? 'pending' : 'future';
  const at = event?.at ? new Date(event.at) : null;
  const ist = at ? getIstParts(at) : null;
  return {
    id: eventType,
    name,
    status: resolvedStatus,
    statusLabel: active && !event ? 'Active' : '',
    connectorStatus: resolvedStatus === 'completed' ? 'completed' : resolvedStatus === 'failed' ? 'failed' : 'future',
    date: ist?.date || 'Pending',
    time: ist?.time || 'Pending',
    actor: event?.actorName || event?.actorType || '',
    icon,
    description: description || event?.notes || '',
    details: {
      bookingId: request.id,
      actor: event?.actorName || event?.actorType || '',
      date: ist?.date || '',
      time: ist?.time || '',
      rows: accountRows(request),
      metadata: { ...(event || {}), userId: request.userId, userRole: request.userRole }
    }
  };
};

const buildAccountTrackerGroups = (request) => {
  const isApprovedActive = request.status === 'approved' && !request.passwordChangedAt;
  return [{
    id: 'account-password-reset-tracker',
    title: 'Account / Password Reset Tracker',
    steps: [
      stepFromPasswordEvent({ request, eventType: 'password_reset_requested', name: 'Password Reset Requested' }),
      stepFromPasswordEvent({ request, eventType: 'reset_link_sent', name: 'Reset Link Sent', active: request.status === 'pending' }),
      stepFromPasswordEvent({ request, eventType: 'reset_link_opened', name: 'Reset Link Opened', active: isApprovedActive && !request.openedAt }),
      stepFromPasswordEvent({ request, eventType: 'password_updated', name: 'Password Updated', active: isApprovedActive && Boolean(request.openedAt) }),
      stepFromPasswordEvent({ request, eventType: 'password_reset_completed', name: 'Password Reset Completed' }),
      stepFromPasswordEvent({ request, eventType: 'password_reset_expired', name: 'Password Reset Expired', status: 'failed' })
    ]
  }];
};

const enforceExpiry = async () => {
  const now = Date.now();
  const actionable = ['pending', 'pending_payment', 'pending_verification'];
  const bookings = await Booking.find({ status: { $in: actionable } });
  for (const b of bookings) {
    const deadline = b.approvalDeadlineAt || new Date(new Date(b.createdAt).getTime() + 6 * 60 * 60 * 1000).toISOString();
    if (now <= new Date(deadline).getTime()) {
      if (!b.approvalDeadlineAt) {
        b.approvalDeadlineAt = deadline;
        await b.save();
      }
      continue;
    }
    b.status = 'expired';
    b.updatedAt = new Date().toISOString();
    await b.save();
  }
};

router.get('/stats', requireAdmin, async (req, res) => {
  await enforceExpiry();

  const [users, bookings] = await Promise.all([
    User.find({}).lean(),
    Booking.find({}).lean()
  ]);

  const students = users.filter(u => u.role === 'student');
  const interviewers = users.filter(u => u.role === 'interviewer');
  const totalBookings = bookings.length;
  const pending = bookings.filter(b => ['pending', 'pending_payment', 'pending_verification'].includes(b.status)).length;
  const completed = bookings.filter(b => b.status === 'completed').length;

  res.json({ totalStudents: students.length, totalInterviewers: interviewers.length, totalBookings, pendingRequests: pending, completedInterviews: completed });
});

router.get('/bookings', requireAdmin, async (req, res) => {
  await enforceExpiry();

  const [bookings, users] = await Promise.all([
    Booking.find({}),
    User.find({}).lean()
  ]);
  for (const booking of bookings) {
    let changed = false;
    if (!booking.bookingId) {
      const datePart = new Date(new Date(booking.createdAt || Date.now()).getTime() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10).replace(/-/g, '');
      const prefix = `BK-${datePart}-`;
      const lastBooking = await Booking.findOne({ bookingId: new RegExp(`^${prefix}`) }).sort({ bookingId: -1 }).lean();
      const lastSequence = lastBooking?.bookingId ? Number(lastBooking.bookingId.split('-').pop()) : 0;
      booking.bookingId = `${prefix}${String(lastSequence + 1).padStart(3, '0')}`;
      changed = true;
    }
    if (!booking.selectedDate || !booking.slotStartTime || !booking.slotEndTime || !booking.slotLabel || !booking.timezone) {
      const canonicalSlot = makeSlot(booking.selectedSlot?.date || booking.date, booking.selectedSlot?.time || booking.slot);
      if (canonicalSlot) {
        booking.selectedDate = canonicalSlot.selectedDate;
        booking.slotLabel = canonicalSlot.slotLabel;
        booking.slotStartTime = canonicalSlot.slotStartTime;
        booking.slotEndTime = canonicalSlot.slotEndTime;
        booking.timezone = TIMEZONE;
        booking.date = canonicalSlot.selectedDate;
        booking.slot = canonicalSlot.slotLabel;
        if (booking.selectedSlot) booking.selectedSlot = canonicalSlot;
        changed = true;
      }
    }
    if (['accepted', 'confirmed', 'meeting_link_uploaded', 'session_ended', 'completed'].includes(booking.status) && booking.approvalStatus !== 'approved') {
      const approvedAt = booking.approvedAt ? new Date(booking.approvedAt) : new Date(booking.updatedAt || booking.createdAt || Date.now());
      booking.approvalStatus = 'approved';
      booking.approvedAt = approvedAt.toISOString();
      booking.approvedDate = approvedAt.toLocaleDateString('en-CA', { timeZone: TIMEZONE });
      booking.approvedTime = approvedAt.toLocaleTimeString('en-GB', { timeZone: TIMEZONE, hour12: false });
      changed = true;
    }
    if (changed) {
      await booking.save();
    }
  }

  const usersById = new Map(users.map(u => [u.id, u]));
  const enriched = bookings.map(booking => {
    const b = booking.toObject();
    const interviewer = usersById.get(b.interviewerId);
    return { ...b, interviewerName: interviewer?.name || 'Unknown', interviewerEmail: interviewer?.email || '' };
  });
  res.json({ bookings: enriched });
});

router.put('/bookings/:id', requireAdmin, async (req, res) => {
  const { status, newDate, newSlot, newInterviewerId, paymentStatus, zoomLink, message } = req.body;
  const booking = await Booking.findOne({ id: req.params.id });
  if (!booking) return res.status(404).json({ error: 'Booking not found' });

  const users = await User.find({}).lean();

  if (status) {
    const allowedStatuses = ['accepted', 'confirmed', 'rejected', 'reschedule_requested', 'cancelled', 'completed'];
    if (!allowedStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });
    booking.status = status;
    if (['accepted', 'confirmed'].includes(status) && booking.approvalStatus !== 'approved') {
      const approvedAt = new Date();
      booking.approvalStatus = 'approved';
      booking.approvedAt = approvedAt.toISOString();
      booking.approvedDate = approvedAt.toLocaleDateString('en-CA', { timeZone: TIMEZONE });
      booking.approvedTime = approvedAt.toLocaleTimeString('en-GB', { timeZone: TIMEZONE, hour12: false });
    }
  }
  if (newDate || newSlot) {
    const canonicalSlot = makeSlot(newDate || booking.selectedDate || booking.date, newSlot || booking.slotLabel || booking.slot);
    if (!canonicalSlot) {
      return res.status(400).json({ error: 'Select a valid AM/PM slot.' });
    }
    booking.selectedSlot = canonicalSlot;
    booking.selectedDate = canonicalSlot.selectedDate;
    booking.slotLabel = canonicalSlot.slotLabel;
    booking.slotStartTime = canonicalSlot.slotStartTime;
    booking.slotEndTime = canonicalSlot.slotEndTime;
    booking.timezone = TIMEZONE;
    booking.date = canonicalSlot.selectedDate;
    booking.slot = canonicalSlot.slotLabel;
  }
  if (newInterviewerId) {
    const oldInterviewerId = booking.interviewerId;
    booking.interviewerId = newInterviewerId;
    const newInterviewer = users.find(u => u.id === newInterviewerId);
    if (newInterviewer) {
      booking.notifications = [
        ...(booking.notifications || []),
        {
          id: `notif-${Date.now()}-reassign`,
          recipientRole: 'interviewer',
          type: 'reassigned',
          message: `Booking reassigned to you by admin. Interview: ${booking.domain || 'General'}`,
          createdAt: new Date().toISOString(),
          read: false
        }
      ];
      if (oldInterviewerId) {
        booking.notifications.push({
          id: `notif-${Date.now()}-removed`,
          recipientRole: 'interviewer',
          type: 'reassigned_away',
          message: 'Booking removed from you by admin.',
          createdAt: new Date().toISOString(),
          read: false
        });
      }
    }
  }
  if (paymentStatus) booking.paymentStatus = paymentStatus;
  if (zoomLink) booking.zoomLink = zoomLink;
  if (message) booking.interviewerMessage = message;
  booking.updatedAt = new Date().toISOString();

  await booking.save();
  res.json({ message: 'Booking updated', booking: booking.toObject() });
});

router.put('/bookings/:id/payment', requireAdmin, async (req, res) => {
  const { paymentStatus, utiNumber } = req.body;
  const booking = await Booking.findOne({ id: req.params.id });
  if (!booking) return res.status(404).json({ error: 'Booking not found' });

  if (paymentStatus) booking.paymentStatus = paymentStatus;
  if (utiNumber) booking.utiNumber = utiNumber;
  booking.updatedAt = new Date().toISOString();

  await booking.save();
  res.json({ message: 'Payment status updated', booking: booking.toObject() });
});

router.get('/interviewers', requireAdmin, async (req, res) => {
  const [users, bookings] = await Promise.all([
    User.find({ role: 'interviewer' }).lean(),
    Booking.find({}).lean()
  ]);

  const interviewers = users.map(u => {
    const userBookings = bookings.filter(b => b.interviewerId === u.id);
    return {
      id: u.id, name: u.name, email: u.email, phone: u.phone || '',
      company: u.company || '', yearsOfExperience: u.yearsOfExperience || 0,
      specialization: u.specialization || '', primaryExpertise: u.primaryExpertise || u.specialization || '',
      age: u.age || null, city: u.city || '', area: u.area || '', bio: u.bio || '',
      skillTags: u.skillTags || [], interviewServices: u.interviewServices || [],
      availabilityPreference: u.availabilityPreference || [],
      status: u.status || 'active',
      proofOfWork: u.proofOfWork || null,
      profileImage: u.profileImage || null,
      verification: u.verification || { status: 'required' },
      lastProfileEditedAt: u.lastProfileEditedAt || null,
      lastProfileEditSummary: u.lastProfileEditSummary || [],
      profileCompletion: calculateInterviewerCompletion(u),
      createdAt: u.createdAt || null,
      totalBookings: userBookings.length,
      completedBookings: userBookings.filter(b => b.status === 'completed').length,
      pendingBookings: userBookings.filter(b => ['pending', 'pending_payment'].includes(b.status)).length
    };
  });
  res.json({ interviewers });
});

router.get('/verification-requests', requireAdmin, async (req, res) => {
  const requests = await VerificationRequest.find({}).sort({ createdAt: -1 }).lean();
  res.json({ requests: requests.map(formatVerificationRequest) });
});

router.get('/verification-requests/:id', requireAdmin, async (req, res) => {
  const request = await VerificationRequest.findOne({ id: req.params.id }).lean();
  if (!request) return res.status(404).json({ error: 'Verification request not found.' });
  res.json({ request: formatVerificationRequest(request) });
});

router.put('/verification-requests/:id/status', requireAdmin, async (req, res) => {
  const { status } = req.body;
  if (!['verified', 'under_review', 'declined'].includes(status)) {
    return res.status(400).json({ error: 'Status must be verified, under_review, or declined.' });
  }

  const request = await VerificationRequest.findOne({ id: req.params.id });
  if (!request) return res.status(404).json({ error: 'Verification request not found.' });

  const user = await User.findOne({ id: request.interviewerId, role: 'interviewer' });
  if (!user) return res.status(404).json({ error: 'Interviewer not found.' });
  if (status === 'verified' && calculateInterviewerCompletion(user) < 100) {
    return res.status(409).json({ error: 'Interviewer profile is not complete yet.' });
  }

  const reviewedAt = new Date().toISOString();
  request.status = status;
  request.reviewedAt = reviewedAt;
  request.reviewedBy = req.session.user.id;
  request.updatedAt = reviewedAt;
  await request.save();

  const shouldApplyRequestDocument = status === 'verified' || request.requestType !== 'update';
  user.verification = {
    ...(user.verification || {}),
    status,
    requestId: request.id,
    requestType: request.requestType || 'new',
    documentType: shouldApplyRequestDocument ? (request.document?.documentType || user.verification?.documentType || '') : (user.verification?.documentType || ''),
    fileName: shouldApplyRequestDocument ? (request.document?.fileName || user.verification?.fileName || '') : (user.verification?.fileName || ''),
    filePath: shouldApplyRequestDocument ? (request.document?.filePath || user.verification?.filePath || '') : (user.verification?.filePath || ''),
    mimeType: shouldApplyRequestDocument ? (request.document?.mimeType || user.verification?.mimeType || '') : (user.verification?.mimeType || ''),
    uploadedAt: shouldApplyRequestDocument ? (request.document?.uploadedAt || user.verification?.uploadedAt || '') : (user.verification?.uploadedAt || ''),
    reviewedAt,
    reviewedBy: req.session.user.id,
    rejectionReason: ''
  };
  await user.save();

  res.json({ message: 'Verification request updated.', request: formatVerificationRequest(request.toObject()) });
});

router.post('/interviewers', requireAdmin, async (req, res) => {
  const { name, email, phone, password, company, yearsOfExperience, specialization } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password are required' });

  const existing = await User.findOne({ email }).lean();
  if (existing) return res.status(400).json({ error: 'Email already exists' });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newInterviewer = await User.create({
      id: `interviewer-${Date.now()}`,
      role: 'interviewer',
      name,
      email,
      phone: phone || '',
      password: hashedPassword,
      company: company || '',
      yearsOfExperience: Number(yearsOfExperience) || 0,
      specialization: specialization || '',
      status: 'active',
      proofOfWork: null,
      createdAt: new Date().toISOString()
    });
    const safeUser = newInterviewer.toObject();
    delete safeUser.password;
    res.status(201).json({ message: 'Interviewer created', interviewer: safeUser });
  } catch {
    res.status(500).json({ error: 'Failed to create interviewer' });
  }
});

router.put('/interviewers/:id', requireAdmin, async (req, res) => {
  const { name, email, phone, company, yearsOfExperience, specialization, status } = req.body;
  const user = await User.findOne({ id: req.params.id, role: 'interviewer' });
  if (!user) return res.status(404).json({ error: 'Interviewer not found' });

  if (name) user.name = name;
  if (email) user.email = email;
  if (phone !== undefined) user.phone = phone;
  if (company !== undefined) user.company = company;
  if (yearsOfExperience !== undefined) user.yearsOfExperience = Number(yearsOfExperience);
  if (specialization !== undefined) user.specialization = specialization;
  if (status) user.status = status;

  await user.save();
  const safeUser = user.toObject();
  delete safeUser.password;
  res.json({ message: 'Interviewer updated', interviewer: safeUser });
});

router.put('/interviewers/:id/verification', requireAdmin, async (req, res) => {
  const { status, rejectionReason } = req.body;
  if (!['verified', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Verification status must be verified or rejected.' });
  }

  const user = await User.findOne({ id: req.params.id, role: 'interviewer' });
  if (!user) return res.status(404).json({ error: 'Interviewer not found' });
  if (status === 'verified' && calculateInterviewerCompletion(user) < 100) {
    return res.status(409).json({ error: 'Interviewer profile is not complete yet.' });
  }

  user.verification = {
    ...(user.verification || {}),
    status,
    reviewedAt: new Date().toISOString(),
    reviewedBy: req.session.user.id,
    rejectionReason: status === 'rejected' ? String(rejectionReason || 'Document not clear.').trim().slice(0, 240) : ''
  };

  await user.save();
  const safeUser = user.toObject();
  delete safeUser.password;
  res.json({ message: status === 'verified' ? 'Interviewer verified.' : 'Verification rejected.', interviewer: safeUser });
});

router.delete('/interviewers/:id', requireAdmin, async (req, res) => {
  const user = await User.findOne({ id: req.params.id, role: 'interviewer' });
  if (!user) return res.status(404).json({ error: 'Interviewer not found' });

  user.status = 'archived';
  await user.save();

  res.json({ message: 'Interviewer archived' });
});

router.put('/interviewers/:id/status', requireAdmin, async (req, res) => {
  const { status } = req.body;
  if (!['active', 'disabled', 'archived'].includes(status)) {
    return res.status(400).json({ error: 'Invalid interviewer status.' });
  }
  const user = await User.findOne({ id: req.params.id, role: 'interviewer' });
  if (!user) return res.status(404).json({ error: 'Interviewer not found' });
  user.status = status;
  await user.save();
  const safeUser = user.toObject();
  delete safeUser.password;
  res.json({ message: 'Interviewer status updated', interviewer: safeUser });
});

router.get('/students', requireAdmin, async (req, res) => {
  const [users, bookings] = await Promise.all([
    User.find({ role: 'student' }).lean(),
    Booking.find({}).lean()
  ]);

  const students = users.map(u => {
    const userBookings = bookings.filter(b => b.studentId === u.id);
    return {
      id: u.id, name: u.name, email: u.email, phone: u.phone || '',
      college: u.college || '', course: u.course || '', bio: u.bio || '',
      status: u.status || 'active', profileImage: u.profileImage || null,
      resumes: u.resumes || [], skillTags: u.skillTags || [],
      resumesCount: (u.resumes || []).length,
      totalBookings: userBookings.length,
      completedBookings: userBookings.filter(b => b.status === 'completed').length,
      lastActive: u.lastActive || u.createdAt || null,
      createdAt: u.createdAt || null
    };
  });
  res.json({ students });
});

router.delete('/students/:id', requireAdmin, async (req, res) => {
  const user = await User.findOne({ id: req.params.id, role: 'student' });
  if (!user) return res.status(404).json({ error: 'Student not found' });

  user.status = 'disabled';
  await user.save();

  res.json({ message: 'Student account disabled' });
});

router.put('/students/:id/status', requireAdmin, async (req, res) => {
  const { status } = req.body;
  if (!['active', 'disabled'].includes(status)) {
    return res.status(400).json({ error: 'Invalid student status.' });
  }
  const user = await User.findOne({ id: req.params.id, role: 'student' });
  if (!user) return res.status(404).json({ error: 'Student not found' });
  user.status = status;
  await user.save();
  const safeUser = user.toObject();
  delete safeUser.password;
  res.json({ message: 'Student status updated', student: safeUser });
});

router.get('/feedback', requireAdmin, async (req, res) => {
  const [bookings, users] = await Promise.all([
    Booking.find({}).lean(),
    User.find({}).lean()
  ]);

  const usersById = new Map(users.map(u => [u.id, u]));
  const feedbackData = bookings.map(b => {
    const interviewer = usersById.get(b.interviewerId);
    const student = usersById.get(b.studentId);
    const hasFeedback = !!(b.feedback && b.feedback.submittedAt);
    const isCompleted = b.status === 'completed';

    return {
      id: b.id,
      domain: b.domain || 'General',
      date: b.date,
      slot: b.slot,
      status: b.status,
      studentName: b.studentName || student?.name || 'Unknown',
      studentId: b.studentId,
      interviewerName: interviewer?.name || 'Unknown',
      interviewerId: b.interviewerId,
      feedback: b.feedback || null,
      feedbackStatus: isCompleted && hasFeedback ? 'submitted' : isCompleted ? 'skipped' : 'pending',
      createdAt: b.createdAt,
      completedAt: isCompleted ? b.updatedAt : null
    };
  });

  res.json({ feedback: feedbackData });
});

router.get('/issues-disputes', requireAdmin, async (req, res) => {
  const issues = await IssueDispute.find({}).sort({ createdAt: -1 }).lean();
  res.json({ issues: issues.map(formatIssueDispute) });
});

router.put('/issues-disputes/:id/status', requireAdmin, async (req, res) => {
  const { action } = req.body;
  const issue = await IssueDispute.findOne({ id: req.params.id });
  if (!issue) return res.status(404).json({ error: 'Issue not found' });

  const now = new Date().toISOString();
  const appendHistory = (note) => {
    issue.history = [
      ...(issue.history || []),
      { status: issue.status, action, at: now, by: req.session.user.id, note }
    ];
  };

  if (action === 'request_more_evidence') {
    issue.status = 'under_review';
    issue.adminDecision = 'more_evidence_requested';
    appendHistory('Admin requested more evidence.');
  } else if (action === 'approve_student') {
    issue.status = 'under_review';
    issue.adminDecision = 'student_approved';
    appendHistory('Admin accepted the student claim. Refund remains unresolved.');
  } else if (action === 'approve_interviewer') {
    issue.status = 'resolved';
    issue.adminDecision = 'interviewer_approved';
    appendHistory('Admin accepted interviewer proof and resolved the refund.');
    if (issue.type === 'refund_dispute') {
      const booking = await Booking.findOne({ id: issue.bookingId });
      if (booking) {
        booking.refundStatus = 'completed';
        booking.status = 'refund_completed';
        booking.refundCompletedAt = booking.refundCompletedAt || now;
        booking.updatedAt = now;
        booking.notifications = [
          ...(booking.notifications || []),
          {
            id: `notif-${Date.now()}-${booking.id}`,
            recipientId: booking.studentId,
            recipientRole: 'student',
            type: 'refund_completed',
            title: 'Refund Completed',
            message: 'Admin accepted the refund proof and closed the refund case.',
            bookingId: booking.id,
            createdAt: now,
            read: false
          }
        ];
        await booking.save();
      }
    }
  } else if (action === 'resolve') {
    issue.status = 'resolved';
    issue.adminDecision = issue.adminDecision || 'resolved';
    appendHistory('Issue resolved by admin.');
  } else {
    return res.status(400).json({ error: 'Invalid issue action.' });
  }

  issue.updatedAt = now;
  await issue.save();
  res.json({ message: 'Issue updated', issue: formatIssueDispute(issue.toObject()) });
});

router.get('/analytics', requireAdmin, async (req, res) => {
  const [bookings, users] = await Promise.all([
    Booking.find({}).lean(),
    User.find({}).lean()
  ]);

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const interviewsThisWeek = bookings.filter(b => {
    if (!b.selectedSlot?.date) return false;
    const bDate = new Date(b.selectedSlot.date);
    return bDate >= weekStart && b.status === 'completed';
  }).length;

  const completedWithFeedback = bookings.filter(b => b.feedback && b.feedback.confidence);
  const avgConfidence = completedWithFeedback.length > 0
    ? (completedWithFeedback.reduce((sum, b) => sum + b.feedback.confidence, 0) / completedWithFeedback.length).toFixed(1)
    : '0';

  const interviewerCounts = {};
  completedWithFeedback.forEach(b => {
    if (!interviewerCounts[b.interviewerId]) interviewerCounts[b.interviewerId] = { count: 0, totalRating: 0, ratings: 0 };
    interviewerCounts[b.interviewerId].count++;
    if (b.feedback.confidence) {
      interviewerCounts[b.interviewerId].totalRating += b.feedback.confidence;
      interviewerCounts[b.interviewerId].ratings++;
    }
  });

  const interviewerMetrics = Object.entries(interviewerCounts).map(([id, data]) => {
    const user = users.find(u => u.id === id);
    return {
      interviewerId: id,
      name: user?.name || 'Unknown',
      completedInterviews: data.count,
      avgConfidence: data.ratings > 0 ? (data.totalRating / data.ratings).toFixed(1) : '0'
    };
  }).sort((a, b) => b.completedInterviews - a.completedInterviews);

  res.json({
    interviewsThisWeek,
    averageConfidence: avgConfidence,
    mostInteractiveInterviewer: interviewerMetrics[0] || null,
    interviewerMetrics
  });
});

router.get('/interview-journey-trackers', requireAdmin, async (req, res) => {
  const bookingQuery = String(req.query.bookingId || '').trim().toLowerCase();
  const studentQuery = String(req.query.student || '').trim().toLowerCase();
  const interviewerQuery = String(req.query.interviewer || '').trim().toLowerCase();
  const statusFilter = String(req.query.status || 'all').trim().toLowerCase();

  const bookings = await Booking.find({}).sort({ createdAt: -1 });
  const students = await User.find({ role: 'student' }).lean();
  const studentsById = new Map(students.map(student => [student.id, student]));
  const records = [];

  for (const booking of bookings) {
    const student = studentsById.get(booking.studentId);
    await ensureTrackerEvents(booking, student);
    await ensureC3TrackerEvents(booking);
    const plain = booking.toObject();
    const statusCategory = ['completed', 'refund_completed'].includes(plain.status)
      ? 'completed'
      : ['cancelled', 'cancelled_by_interviewer', 'cancelled_by_student', 'rejected', 'no_response'].includes(plain.status)
        ? 'cancelled'
        : ['refund_required', 'refund_proof_submitted', 'refund_disputed'].includes(plain.status)
          ? 'refund'
          : plain.refundDisputeId
            ? 'dispute'
            : 'active';

    const record = {
      id: plain.id,
      bookingId: plain.bookingId || plain.id,
      studentId: plain.studentId,
      interviewerId: plain.interviewerId,
      studentName: plain.studentName || student?.name || 'Student',
      interviewerName: plain.interviewerName || 'Interviewer',
      topic: plain.domain || 'General / HR',
      status: plain.status || 'pending',
      statusCategory,
      createdDate: plain.createdAt ? getIstParts(new Date(plain.createdAt)).date : '',
      groups: [...buildTrackerGroups(plain), ...buildC3BookingGroups(plain)]
    };

    const matchesBooking = !bookingQuery || record.bookingId.toLowerCase().includes(bookingQuery);
    const matchesStudent = !studentQuery || record.studentName.toLowerCase().includes(studentQuery);
    const matchesInterviewer = !interviewerQuery || record.interviewerName.toLowerCase().includes(interviewerQuery);
    const matchesStatus = statusFilter === 'all' || record.statusCategory === statusFilter;
    if (matchesBooking && matchesStudent && matchesInterviewer && matchesStatus) {
      records.push(record);
    }
  }

  await expirePasswordResetRequests();
  const resetRequests = await PasswordResetRequest.find({}).sort({ createdAt: -1 });
  for (const requestDoc of resetRequests) {
    await ensurePasswordResetTrackerEvents(requestDoc);
    const request = requestDoc.toObject();
    const record = {
      id: request.id,
      bookingId: request.id,
      userId: request.userId,
      studentName: request.name || 'User',
      interviewerName: request.email || request.userRole || 'Account',
      topic: 'Password Reset',
      status: request.status || 'pending',
      statusCategory: request.status === 'completed'
        ? 'completed'
        : ['expired', 'declined'].includes(request.status)
          ? 'cancelled'
          : 'active',
      createdDate: request.createdAt ? getIstParts(new Date(request.createdAt)).date : '',
      groups: buildAccountTrackerGroups(request)
    };

    const matchesBooking = !bookingQuery || record.bookingId.toLowerCase().includes(bookingQuery) || String(record.userId || '').toLowerCase().includes(bookingQuery);
    const matchesStudent = !studentQuery || record.studentName.toLowerCase().includes(studentQuery) || String(request.email || '').toLowerCase().includes(studentQuery);
    const matchesInterviewer = !interviewerQuery || record.interviewerName.toLowerCase().includes(interviewerQuery) || String(request.userRole || '').toLowerCase().includes(interviewerQuery);
    const matchesStatus = statusFilter === 'all' || record.statusCategory === statusFilter;
    if (matchesBooking && matchesStudent && matchesInterviewer && matchesStatus) {
      records.push(record);
    }
  }

  res.json({ records });
});

router.get('/password-reset-requests', requireAdmin, async (req, res) => {
  await expirePasswordResetRequests();
  const { status } = req.query;
  const filter = status && ['pending', 'approved', 'completed', 'expired', 'declined'].includes(status)
    ? { status }
    : {};
  const requests = await PasswordResetRequest.find(filter).sort({ createdAt: -1 }).lean();
  res.json({ requests: requests.map(formatPasswordResetRequest) });
});

router.put('/password-reset-requests/:id/status', requireAdmin, async (req, res) => {
  await expirePasswordResetRequests();
  const { status } = req.body;
  if (!['approved', 'declined'].includes(status)) {
    return res.status(400).json({ error: 'Status must be approved or declined.' });
  }

  const request = await PasswordResetRequest.findOne({ id: req.params.id });
  if (!request) return res.status(404).json({ error: 'Password reset request not found.' });
  if (!['pending', 'approved'].includes(request.status) && status === 'approved') {
    return res.status(409).json({ error: 'Only pending requests can be approved.' });
  }
  if (!['pending', 'approved'].includes(request.status) && status === 'declined') {
    return res.status(409).json({ error: 'Only active requests can be declined.' });
  }

  const now = new Date();
  if (status === 'approved') {
    request.status = 'approved';
    request.approvedAt = now.toISOString();
    request.expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    appendPasswordResetEvent(request, 'reset_link_sent', {
      at: request.approvedAt,
      actorType: 'Admin',
      actorName: req.session.user.name || 'Admin',
      metadata: { expiresAt: request.expiresAt }
    });
  } else {
    request.status = 'declined';
    request.declinedAt = now.toISOString();
    request.expiresAt = '';
    appendPasswordResetEvent(request, 'password_reset_declined', {
      at: request.declinedAt,
      actorType: 'Admin',
      actorName: req.session.user.name || 'Admin',
      status: 'Failed'
    });
  }
  await request.save();

  res.json({
    message: `Password reset request ${status}.`,
    request: formatPasswordResetRequest(request.toObject())
  });
});

router.post('/create-admin', requireAdmin, async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password required' });

  const existing = await User.findOne({ email }).lean();
  if (existing) return res.status(400).json({ error: 'Email already exists' });

  const hashedPassword = await bcrypt.hash(password, 10);
  const newAdmin = await User.create({
    id: `admin-${Date.now()}`,
    role: 'admin',
    name,
    email,
    phone: '',
    password: hashedPassword,
    createdAt: new Date().toISOString()
  });

  const safeAdmin = newAdmin.toObject();
  delete safeAdmin.password;
  res.status(201).json({ message: 'Admin created', admin: safeAdmin });
});

module.exports = router;
