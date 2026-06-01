const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const Booking = require('../models/Booking');
const User = require('../models/User');
const IssueDispute = require('../models/IssueDispute');
const cloudinary = require('../config/cloudinary');

const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png'];
const ALLOWED_PAYMENT_MIME_TYPES = ['application/pdf', ...ALLOWED_IMAGE_MIME_TYPES];
const ALLOWED_RESUME_MIME_TYPES = ['application/pdf', ...ALLOWED_IMAGE_MIME_TYPES];
const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const TIMEZONE = 'Asia/Kolkata';
const LEAD_TIME_MS = 60 * 60 * 1000;
const DEFAULT_SESSION_FEE = 50;
const ACTIVE_PENDING_STATUSES = ['pending', 'accepted', 'pending_payment', 'pending_verification', 'screenshot_uploaded', 'reschedule_requested', 'reschedule_slot_selected'];
const CONFIRMED_BLOCKING_STATUSES = ['confirmed', 'meeting_link_uploaded', 'session_ended'];
const UNRESOLVED_REFUND_STATUSES = ['required', 'proof_submitted', 'disputed', 'admin_review_required'];
const SLOT_OPTIONS = [
  { label: '07:00 AM – 09:00 AM', start: '07:00:00', end: '09:00:00', legacy: ['07:00-09:00', '7:00-9:00'] },
  { label: '09:00 AM – 11:00 AM', start: '09:00:00', end: '11:00:00', legacy: ['09:00-11:00', '9:00-11:00'] },
  { label: '10:00 AM – 12:00 PM', start: '10:00:00', end: '12:00:00', legacy: ['10:00-12:00'] },
  { label: '11:00 AM – 01:00 PM', start: '11:00:00', end: '13:00:00', legacy: ['11:00-13:00', '11:00-1:00'] },
  { label: '12:00 PM – 02:00 PM', start: '12:00:00', end: '14:00:00', legacy: ['12:00-14:00'] },
  { label: '01:00 PM – 03:00 PM', start: '13:00:00', end: '15:00:00', legacy: ['13:00-15:00', '1:00-3:00'] },
  { label: '03:00 PM – 05:00 PM', start: '15:00:00', end: '17:00:00', legacy: ['15:00-17:00', '3:00-5:00'] },
  { label: '05:00 PM – 07:00 PM', start: '17:00:00', end: '19:00:00', legacy: ['17:00-19:00', '5:00-7:00'] },
  { label: '06:00 PM – 08:00 PM', start: '18:00:00', end: '20:00:00', legacy: ['18:00-20:00'] },
  { label: '07:00 PM – 09:00 PM', start: '19:00:00', end: '21:00:00', legacy: ['19:00-21:00', '7:00-9:00'] }
];
const PUBLIC_SLOT_STARTS = new Set(['07:00:00', '09:00:00', '11:00:00', '13:00:00', '15:00:00', '17:00:00', '19:00:00']);
const PUBLIC_SLOT_OPTIONS = SLOT_OPTIONS.filter(option => PUBLIC_SLOT_STARTS.has(option.start));

const paymentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_PAYMENT_MIME_TYPES.includes(file.mimetype)) {
      return cb(new Error('Only PDF/JPG/PNG payment proof files are allowed.'));
    }
    cb(null, true);
  }
});

const uploadResume = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_RESUME_MIME_TYPES.includes(file.mimetype)) {
      return cb(new Error('Only PDF/JPG/PNG resumes are allowed.'));
    }
    cb(null, true);
  }
});

const refundProofUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype)) {
      return cb(new Error('Only JPG/PNG refund screenshots are allowed.'));
    }
    cb(null, true);
  }
});

const requireAuth = async (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  try {
    if (req.session.user.role === 'student') {
      const student = await User.findOne({ id: req.session.user.id, role: 'student' }).lean();
      if (!student || ['disabled', 'inactive', 'archived'].includes(student.status)) {
        return res.status(403).json({
          error: 'Account Disabled\nYour account has been disabled.\nPlease contact admin for assistance.'
        });
      }
    }
    next();
  } catch (err) {
    next(err);
  }
};

const normalizeSlotLabel = (value) => String(value || '').replace(/\s+/g, '').replace(/[–—]/g, '-').toLowerCase();

const getSlotDefinition = (value) => {
  const normalized = normalizeSlotLabel(value);
  return SLOT_OPTIONS.find(option => (
    normalizeSlotLabel(option.label) === normalized ||
    option.legacy.some(legacy => normalizeSlotLabel(legacy) === normalized)
  ));
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

const normalizeSlots = (slotsInput, fallbackSlot, fallbackDate) => {
  if (slotsInput) {
    let parsed = slotsInput;
    if (typeof slotsInput === 'string') {
      parsed = JSON.parse(slotsInput);
    }

    if (!Array.isArray(parsed) || parsed.length === 0) {
      return [];
    }

    return parsed
      .filter(slot => slot && slot.date && slot.time)
      .map(slot => makeSlot(slot.date, slot.time))
      .filter(Boolean);
  }

  if (fallbackDate && fallbackSlot) {
    const slot = makeSlot(fallbackDate, fallbackSlot);
    return slot ? [slot] : [];
  }

  return [];
};

const getIstDateKey = (date = new Date()) => {
  const ist = new Date(date.getTime() + IST_OFFSET_MS);
  return ist.toISOString().slice(0, 10).replace(/-/g, '');
};

const generateBookingId = async (createdAt = new Date()) => {
  const dateKey = getIstDateKey(createdAt);
  const prefix = `BK-${dateKey}-`;
  const lastBooking = await Booking.findOne({ bookingId: new RegExp(`^${prefix}`) }).sort({ bookingId: -1 }).lean();
  const lastSequence = lastBooking?.bookingId ? Number(lastBooking.bookingId.split('-').pop()) : 0;
  return `${prefix}${String(lastSequence + 1).padStart(3, '0')}`;
};

const ensureBookingId = async (booking) => {
  if (!booking || booking.bookingId) return booking;
  booking.bookingId = await generateBookingId(new Date(booking.createdAt || Date.now()));
  await booking.save();
  return booking;
};

const applyCanonicalSlotFields = (booking, slot) => {
  const canonical = makeSlot(slot?.selectedDate || slot?.date || booking.selectedDate || booking.date, slot?.slotLabel || slot?.time || slot?.label || booking.slotLabel || booking.slot);
  if (!canonical) return false;
  booking.selectedDate = canonical.selectedDate;
  booking.slotLabel = canonical.slotLabel;
  booking.slotStartTime = canonical.slotStartTime;
  booking.slotEndTime = canonical.slotEndTime;
  booking.timezone = TIMEZONE;
  booking.date = canonical.selectedDate;
  booking.slot = canonical.slotLabel;
  return true;
};

const ensureBookingFoundation = async (booking) => {
  if (!booking) return booking;
  let changed = false;
  if (!booking.bookingId) {
    booking.bookingId = await generateBookingId(new Date(booking.createdAt || Date.now()));
    changed = true;
  }
  if (!booking.selectedDate || !booking.slotStartTime || !booking.slotEndTime || !booking.slotLabel || !booking.timezone) {
    changed = applyCanonicalSlotFields(booking, booking.selectedSlot || booking.preferredSlots?.[0] || booking) || changed;
  }
  if (['accepted', 'confirmed', 'meeting_link_uploaded', 'session_ended', 'completed'].includes(booking.status) && booking.approvalStatus !== 'approved') {
    const approvedAt = booking.approvedAt ? new Date(booking.approvedAt) : new Date(booking.updatedAt || booking.createdAt || Date.now());
    booking.approvalStatus = 'approved';
    booking.approvedAt = approvedAt.toISOString();
    booking.approvedDate = approvedAt.toLocaleDateString('en-CA', { timeZone: TIMEZONE });
    booking.approvedTime = approvedAt.toLocaleTimeString('en-GB', { timeZone: TIMEZONE, hour12: false });
    changed = true;
  }
  if (booking.bookingStatus !== booking.status) {
    booking.bookingStatus = booking.status;
    changed = true;
  }
  if (changed) await booking.save();
  return booking;
};

const uploadToCloudinary = (fileBuffer, mimeType, originalname) => new Promise((resolve, reject) => {
  const resourceType = mimeType === 'application/pdf' ? 'raw' : 'image';
  const upload = cloudinary.uploader.upload_stream({
    folder: 'interview-experience-hub/payment-proofs',
    resource_type: resourceType,
    public_id: `${Date.now()}-${originalname.replace(/\s+/g, '-')}`
  }, (err, result) => {
    if (err) return reject(err);
    resolve(result);
  });
  upload.end(fileBuffer);
});

const canUseCloudinary = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

const uploadPaymentProofAsset = async (file) => {
  if (canUseCloudinary) {
    const uploaded = await uploadToCloudinary(file.buffer, file.mimetype, file.originalname);
    return uploaded.secure_url;
  }

  if (process.env.NODE_ENV !== 'production') {
    const uploadsDir = path.join(__dirname, '../uploads/');
    fs.mkdirSync(uploadsDir, { recursive: true });
    const safeName = `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
    const outputPath = path.join(uploadsDir, safeName);
    fs.writeFileSync(outputPath, file.buffer);
    return `/uploads/${safeName}`;
  }

  throw new Error('Cloudinary is required for payment proof uploads in production.');
};

const uploadRefundProofAsset = async (file) => {
  if (canUseCloudinary) {
    const uploaded = await new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream({
        folder: 'interview-experience-hub/refund-proofs',
        resource_type: 'image',
        public_id: `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`
      }, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
      upload.end(file.buffer);
    });
    return uploaded.secure_url;
  }

  if (process.env.NODE_ENV !== 'production') {
    const uploadsDir = path.join(__dirname, '../uploads/refund-proofs/');
    fs.mkdirSync(uploadsDir, { recursive: true });
    const safeName = `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
    const outputPath = path.join(uploadsDir, safeName);
    fs.writeFileSync(outputPath, file.buffer);
    return `/uploads/refund-proofs/${safeName}`;
  }

  throw new Error('Cloudinary is required for refund proof uploads in production.');
};

const getIstParts = (date = new Date()) => ({
  date: date.toLocaleDateString('en-CA', { timeZone: TIMEZONE }),
  time: date.toLocaleTimeString('en-GB', { timeZone: TIMEZONE, hour12: false })
});

const getIstToday = (date = new Date()) => date.toLocaleDateString('en-CA', { timeZone: TIMEZONE });

const isValidDateKey = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || '')) && !Number.isNaN(new Date(`${value}T00:00:00+05:30`).getTime());

const getSlotStartMs = (slot) => {
  if (!slot?.selectedDate || !slot?.slotStartTime) return null;
  const ms = new Date(`${slot.selectedDate}T${slot.slotStartTime}+05:30`).getTime();
  return Number.isFinite(ms) ? ms : null;
};

const slotKey = (slot) => `${slot.selectedDate}|${slot.slotStartTime}`;

const validateSlotsAgainstServerTime = (slots, now = new Date()) => {
  const today = getIstToday(now);
  const nowMs = now.getTime();
  const seen = new Set();

  for (const slot of slots) {
    if (!slot || !isValidDateKey(slot.selectedDate)) {
      return {
        ok: false,
        code: 'invalid_date',
        error: 'Invalid Booking Date\nPast dates cannot be selected.\nPlease choose today or a future date.'
      };
    }
    if (slot.selectedDate < today) {
      return {
        ok: false,
        code: 'past_date',
        error: 'Invalid Booking Date\nPast dates cannot be selected.\nPlease choose today or a future date.'
      };
    }
    if (!getSlotDefinition(slot.slotLabel) || !PUBLIC_SLOT_STARTS.has(slot.slotStartTime)) {
      return {
        ok: false,
        code: 'invalid_time',
        error: 'Invalid Booking Time\nBookings require at least 60 minutes preparation time.'
      };
    }
    const key = slotKey(slot);
    if (seen.has(key)) {
      return {
        ok: false,
        code: 'duplicate_slot',
        error: 'Duplicate Slot Selected\nThis time slot has already been selected.\nPlease choose a different slot.'
      };
    }
    seen.add(key);

    const startsAt = getSlotStartMs(slot);
    if (!startsAt || startsAt - nowMs < LEAD_TIME_MS) {
      return {
        ok: false,
        code: 'lead_time',
        error: 'Invalid Booking Time\nBookings require at least 60 minutes preparation time.'
      };
    }
  }

  return { ok: true };
};

const findConfirmedConflict = async ({ interviewerId, studentId, slots, excludeBookingId = null }) => {
  for (const slot of slots) {
    const baseQuery = {
      selectedDate: slot.selectedDate,
      slotStartTime: slot.slotStartTime,
      status: { $in: CONFIRMED_BLOCKING_STATUSES }
    };
    if (excludeBookingId) baseQuery.id = { $ne: excludeBookingId };

    const interviewerConflict = await Booking.findOne({ ...baseQuery, interviewerId }).lean();
    if (interviewerConflict) {
      return {
        type: 'interviewer',
        slot,
        bookingId: interviewerConflict.bookingId || interviewerConflict.id,
        error: 'This Interviewer Is Unavailable\nThe selected interviewer already has a confirmed booking for this date and time.\nPlease choose another available slot.'
      };
    }

    if (studentId) {
      const studentConflict = await Booking.findOne({ ...baseQuery, studentId }).lean();
      if (studentConflict) {
        return {
          type: 'student',
          slot,
          bookingId: studentConflict.bookingId || studentConflict.id,
          error: 'Booking Conflict\nYou already have an interview scheduled for this date and time.\nPlease select another available slot.'
        };
      }
    }
  }
  return null;
};

const makeBookingEvent = (type, details = {}) => {
  const now = new Date();
  const ist = getIstParts(now);
  return {
    type,
    at: now.toISOString(),
    date: ist.date,
    time: ist.time,
    timezone: TIMEZONE,
    ...details
  };
};

const hasBookingEvent = (booking, type) => (booking.bookingEvents || []).some(event => event.type === type);

const appendBookingEvent = (booking, type, details = {}) => {
  booking.bookingEvents = [
    ...(booking.bookingEvents || []),
    makeBookingEvent(type, {
      bookingId: booking.bookingId || booking.id,
      studentId: booking.studentId,
      interviewerId: booking.interviewerId,
      ...details
    })
  ];
};

const createPaymentEvidence = ({ booking, file, filePath, utr, submittedAt, type }) => {
  const ist = getIstParts(new Date(submittedAt));
  return {
    id: `pay-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    fileName: file.originalname,
    filePath,
    utr,
    studentName: booking.studentName || 'Student',
    bookingId: booking.bookingId || booking.id,
    submittedAt,
    submissionDate: ist.date,
    submissionTime: ist.time,
    timezone: TIMEZONE
  };
};

const getPaymentEvidencePayload = (booking) => ({
  evidenceType: 'payment',
  evidence: (booking.paymentSubmissions || []).slice(-1)[0] || null,
  evidenceHistory: booking.paymentSubmissions || []
});

const createNotification = ({ booking, recipientRole, recipientId, type, title, message }) => ({
  id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  recipientId,
  recipientRole,
  type,
  title,
  message,
  bookingId: booking.id,
  createdAt: new Date().toISOString(),
  read: false
});

const appendRefundEvent = (booking, type, details = {}) => {
  const now = new Date();
  const ist = getIstParts(now);
  booking.refundEvents = [
    ...(booking.refundEvents || []),
    {
      type,
      at: now.toISOString(),
      date: ist.date,
      time: ist.time,
      timezone: TIMEZONE,
      bookingId: booking.bookingId || booking.id,
      ...details
    }
  ];
};

const buildRefundSnapshot = async (booking) => {
  const student = await User.findOne({ id: booking.studentId, role: 'student' }).lean();
  return {
    studentName: student?.name || booking.studentName || 'Student',
    studentMobile: student?.phone || '',
    studentId: booking.studentId,
    refundQrSnapshot: student?.refundInfo?.qrCode || null,
    refundUpiSnapshot: student?.refundInfo?.upiId || '',
    bookingId: booking.bookingId || booking.id,
    paymentAmount: Number(booking.paymentAmount || DEFAULT_SESSION_FEE),
    paymentCurrency: booking.paymentCurrency || 'INR',
    capturedAt: new Date().toISOString()
  };
};

const hasUnresolvedRefundRestriction = async (interviewerId) => {
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  return Boolean(await Booking.exists({
    interviewerId,
    refundStatus: { $in: UNRESOLVED_REFUND_STATUSES },
    refundRequestedAt: { $lte: cutoff, $ne: '' }
  }));
};

const advanceRefundDeadlines = async (query = {}) => {
  const now = new Date();
  const nowIso = now.toISOString();
  const pendingCutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const overdueCutoff = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();
  const reviewCutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const bookings = await Booking.find({
    ...query,
    refundStatus: { $in: UNRESOLVED_REFUND_STATUSES },
    refundRequestedAt: { $ne: '' }
  });

  for (const booking of bookings) {
    let changed = false;
    if (!booking.refundPendingTriggeredAt && booking.refundRequestedAt <= pendingCutoff) {
      booking.refundPendingTriggeredAt = nowIso;
      appendRefundEvent(booking, 'refund_pending_triggered');
      changed = true;
    }
    if (!booking.refundOverdueTriggeredAt && booking.refundRequestedAt <= overdueCutoff) {
      booking.refundOverdueTriggeredAt = nowIso;
      appendRefundEvent(booking, 'refund_overdue');
      changed = true;
    }
    if (booking.refundStatus === 'proof_submitted' && booking.refundSubmittedAt && booking.refundSubmittedAt <= reviewCutoff && !booking.refundAdminReviewRequiredAt) {
      const issue = await IssueDispute.create({
        id: `issue-${Date.now()}-${booking.id}-refund-review`,
        type: 'refund_dispute',
        status: 'under_review',
        bookingId: booking.id,
        displayBookingId: booking.bookingId || '',
        studentId: booking.studentId,
        studentName: booking.studentName,
        interviewerId: booking.interviewerId,
        interviewerName: booking.interviewerName,
        refundProof: booking.refundProof || null,
        refundAmount: booking.refundAmount || booking.refundSnapshot?.paymentAmount || booking.paymentAmount || DEFAULT_SESSION_FEE,
        refundCurrency: booking.refundCurrency || booking.paymentCurrency || 'INR',
        refundUtr: booking.refundUtr || '',
        refundRequestedAt: booking.refundRequestedAt || '',
        disputeAt: nowIso,
        studentComment: 'No student response received within 7 days after refund submission.',
        history: [{ status: 'under_review', at: nowIso, note: 'Refund moved to admin review after no student response for 7 days.' }],
        createdAt: nowIso,
        updatedAt: nowIso
      });
      booking.refundStatus = 'admin_review_required';
      booking.status = 'refund_disputed';
      booking.refundAdminReviewRequiredAt = nowIso;
      booking.refundAdminReviewIssueId = issue.id;
      appendRefundEvent(booking, 'admin_review_required', { issueId: issue.id });
      changed = true;
    }
    if (changed) {
      booking.updatedAt = nowIso;
      await booking.save();
    }
  }
};

const expireQualityChecks = async (query = {}) => {
  const nowIso = new Date().toISOString();
  const bookings = await Booking.find({
    ...query,
    'qualityCheck.status': 'pending',
    'qualityCheck.expiresAt': { $lte: nowIso }
  });
  for (const booking of bookings) {
    booking.qualityCheck = {
      ...(booking.qualityCheck || {}),
      status: 'expired',
      expiredAt: nowIso
    };
    booking.updatedAt = nowIso;
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

const autoCloseOverdueSessions = async (query = {}) => {
  const bookings = await Booking.find({
    ...query,
    status: { $in: ['confirmed', 'meeting_link_uploaded'] }
  });
  const nowMs = Date.now();
  for (const booking of bookings) {
    const endMs = getInterviewEndMs(booking);
    if (!endMs || nowMs < endMs + 2 * 60 * 60 * 1000) continue;
    const closedAt = new Date();
    booking.status = 'session_ended';
    booking.sessionEndedAt = booking.sessionEndedAt || closedAt.toISOString();
    booking.hangingTagState = null;
    appendBookingEvent(booking, 'interview_auto_closed', {
      bookingStatus: 'session_ended',
      autoClosed: true,
      selectedDate: booking.selectedDate,
      slotStartTime: booking.slotStartTime,
      slotEndTime: booking.slotEndTime,
      timezone: TIMEZONE
    });
    booking.updatedAt = closedAt.toISOString();
    await booking.save();
  }
};

const advanceFeedbackReminders = async (query = {}) => {
  const now = new Date();
  const tenMinuteCutoff = new Date(now.getTime() - 10 * 60 * 1000).toISOString();
  const oneHourCutoff = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
  const bookings = await Booking.find({
    ...query,
    status: 'session_ended',
    sessionEndedAt: { $ne: null },
    feedback: { $in: [null, {}] }
  });

  for (const booking of bookings) {
    let changed = false;
    if (!booking.feedbackReminderSentAt && booking.sessionEndedAt <= tenMinuteCutoff) {
      booking.feedbackReminderSentAt = now.toISOString();
      appendBookingEvent(booking, 'feedback_reminder_sent', {
        actor: 'System',
        actorRole: 'system',
        notes: 'Interviewer feedback reminder sent 10 minutes after interview end.'
      });
      booking.notifications = [
        ...(booking.notifications || []),
        createNotification({
          booking,
          recipientId: booking.interviewerId,
          recipientRole: 'interviewer',
          type: 'feedback_reminder',
          title: 'Feedback Reminder',
          message: 'Please submit feedback for the completed interview.'
        })
      ];
      changed = true;
    }
    if (!booking.feedbackDashboardReminderAt && booking.sessionEndedAt <= oneHourCutoff) {
      booking.feedbackDashboardReminderAt = now.toISOString();
      appendBookingEvent(booking, 'feedback_dashboard_reminder', {
        actor: 'System',
        actorRole: 'system',
        notes: 'Dashboard feedback reminder created 1 hour after interview end.'
      });
      changed = true;
    }
    if (changed) {
      booking.updatedAt = now.toISOString();
      await booking.save();
    }
  }
};

const markInterviewActiveEvents = async (query = {}) => {
  const bookings = await Booking.find({
    ...query,
    status: { $in: ['confirmed', 'meeting_link_uploaded'] }
  });
  const nowMs = Date.now();
  for (const booking of bookings) {
    if (hasBookingEvent(booking, 'interview_session_active')) continue;
    const startMs = getInterviewStartMs(booking);
    if (!startMs || nowMs < startMs) continue;
    appendBookingEvent(booking, 'interview_session_active', {
      bookingStatus: booking.status,
      selectedDate: booking.selectedDate,
      slotStartTime: booking.slotStartTime,
      timezone: TIMEZONE
    });
    booking.updatedAt = new Date().toISOString();
    await booking.save();
  }
};

const makeHangingTagState = (booking, nowMs = Date.now()) => {
  const unresolvedRefund = booking.refundStatus === 'required';
  if (unresolvedRefund && booking.refundRequestedAt) {
    const refundAgeMs = nowMs - new Date(booking.refundRequestedAt).getTime();
    if (refundAgeMs >= 48 * 60 * 60 * 1000) {
      return null;
    }
    if (refundAgeMs >= 24 * 60 * 60 * 1000) {
      return {
        type: 'refund_pending',
        title: 'Refund Pending',
        tone: 'warning',
        message: 'Refund request has been pending for more than 24 hours. Please complete refund immediately.',
        actions: ['view_refund_details', 'mark_refund_sent']
      };
    }
  }

  if (!['confirmed', 'meeting_link_uploaded'].includes(booking.status)) return null;
  if (booking.studentJoinedAt) return null;

  const startsAt = getInterviewStartMs(booking);
  if (!startsAt) return null;
  const diff = startsAt - nowMs;
  const hasMeetingLink = Boolean(String(booking.meetingLink || '').trim());

  if (diff <= 20 * 60 * 1000 && diff > 5 * 60 * 1000) {
    return {
      type: 'upcoming_interview',
      title: 'Upcoming Interview',
      tone: 'info',
      message: 'Interview starts soon. Please ensure your meeting setup is ready.',
      actions: ['notify_student', 'view_meeting_details']
    };
  }

  if (diff <= 5 * 60 * 1000 && diff > 0) {
    if (!hasMeetingLink) {
      return {
        type: 'meeting_link_missing',
        title: 'Meeting Link Missing',
        tone: 'warning',
        message: 'Please upload the meeting link before interview begins.',
        actions: ['upload_meeting_link', 'view_meeting_details']
      };
    }
    return {
      type: 'interview_reminder',
      title: 'Interview Reminder',
      tone: 'info',
      message: 'Meeting link is ready. Notify the student before interview begins.',
      actions: ['notify_student', 'view_meeting_details']
    };
  }

  if (diff <= 0) {
    if (!hasMeetingLink) {
      return {
        type: 'meeting_link_missing',
        title: 'Meeting Link Missing',
        tone: 'warning',
        message: 'Please upload the meeting link before interview begins.',
        actions: ['upload_meeting_link', 'view_meeting_details']
      };
    }
    return {
      type: 'student_not_joined',
      title: 'Student Not Joined',
      tone: 'danger',
      message: 'Interview has started. Student has not joined yet.',
      actions: ['notify_student', 'call_student', 'view_meeting_details']
    };
  }

  return null;
};

const syncHangingTagState = async (booking) => {
  if (!booking.refundPendingTriggeredAt && booking.refundStatus === 'required' && booking.refundRequestedAt && Date.now() - new Date(booking.refundRequestedAt).getTime() >= 24 * 60 * 60 * 1000) {
    booking.refundPendingTriggeredAt = new Date().toISOString();
    appendRefundEvent(booking, 'refund_pending_triggered');
  }
  const state = makeHangingTagState(booking);
  const sentAt = state?.type ? booking.tagNotificationSentAt?.[state.type] || '' : '';
  const nextState = state ? {
    ...state,
    notified: Boolean(sentAt),
    notifiedAt: sentAt,
    computedAt: new Date().toISOString()
  } : null;
  const current = JSON.stringify(booking.hangingTagState || null);
  const next = JSON.stringify(nextState || null);
  if (current !== next) {
    booking.hangingTagState = nextState;
    booking.updatedAt = new Date().toISOString();
    await booking.save();
  }
  return booking;
};

const isRefundOverdue = (booking) => {
  if (!UNRESOLVED_REFUND_STATUSES.includes(booking.refundStatus) || !booking.refundRequestedAt) return false;
  return Date.now() - new Date(booking.refundRequestedAt).getTime() >= 48 * 60 * 60 * 1000;
};

const uploadResumeAsset = async (file) => {
  if (canUseCloudinary) {
    const resourceType = file.mimetype === 'application/pdf' ? 'raw' : 'image';
    const uploaded = await new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream({
        folder: 'interview-experience-hub/resumes',
        resource_type: resourceType,
        public_id: `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`
      }, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
      upload.end(file.buffer);
    });
    return uploaded.secure_url;
  }

  if (process.env.NODE_ENV !== 'production') {
    const uploadsDir = path.join(__dirname, '../uploads/');
    fs.mkdirSync(uploadsDir, { recursive: true });
    const safeName = `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
    const outputPath = path.join(uploadsDir, safeName);
    fs.writeFileSync(outputPath, file.buffer);
    return `/uploads/${safeName}`;
  }

  throw new Error('Cloudinary is required for resume uploads in production.');
};

const enforceExpiry = async () => {
  const now = Date.now();
  const actionable = ['pending', 'pending_payment', 'pending_verification', 'screenshot_uploaded'];
  const bookings = await Booking.find({ status: { $in: actionable } });

  for (const booking of bookings) {
    const deadline = booking.approvalDeadlineAt || new Date(new Date(booking.createdAt).getTime() + SIX_HOURS_MS).toISOString();
    if (now <= new Date(deadline).getTime()) {
      if (!booking.approvalDeadlineAt) {
        booking.approvalDeadlineAt = deadline;
        await booking.save();
      }
      continue;
    }

    booking.status = 'no_response';
    booking.approvalDeadlineAt = deadline;
    booking.updatedAt = new Date().toISOString();
    booking.interviewerMessage = booking.interviewerMessage || 'Request expired — no response within 6 hours. You can reassign to another interviewer.';
    booking.notifications = [
      ...(booking.notifications || []),
      {
        id: `notif-${Date.now()}-${booking.id}`,
        recipientRole: 'student',
        type: 'booking_expired',
        message: 'Your interview request was not approved within 6 hours. You can reassign to another interviewer from your dashboard.',
        createdAt: new Date().toISOString(),
        read: false
      }
    ];
    await booking.save();
  }
};

router.post('/', requireAuth, async (req, res) => {
  try {
    const { interviewerId, date, slot, domain, slots } = req.body;
    const preferredSlots = normalizeSlots(slots, slot, date);

    if (!interviewerId || preferredSlots.length === 0) {
      return res.status(400).json({ error: 'Interviewer and at least one preferred slot are required.' });
    }

    await enforceExpiry();
    const activePendingCount = await Booking.countDocuments({
      studentId: req.session.user.id,
      status: { $in: ACTIVE_PENDING_STATUSES }
    });
    if (activePendingCount >= 2) {
      return res.status(409).json({
        error: 'Maximum Pending Requests Reached\nPlease wait for a confirmation or decline before requesting another interview.'
      });
    }

    const interviewer = await User.findOne({ id: interviewerId, role: 'interviewer', status: 'active' }).lean();
    if (!interviewer || interviewer.verification?.status !== 'verified') {
      return res.status(403).json({ error: 'This interviewer is not available for bookings yet.' });
    }
    if (await hasUnresolvedRefundRestriction(interviewerId)) {
      return res.status(403).json({ error: 'This interviewer is temporarily unavailable for new bookings until a pending refund is resolved.' });
    }
    const timeValidation = validateSlotsAgainstServerTime(preferredSlots);
    if (!timeValidation.ok) {
      return res.status(400).json({ error: timeValidation.error });
    }
    const conflict = await findConfirmedConflict({
      interviewerId,
      studentId: req.session.user.id,
      slots: preferredSlots
    });
    if (conflict) {
      return res.status(409).json({ error: conflict.error });
    }

    const createdDate = new Date();
    const createdAt = createdDate.toISOString();
    const bookingId = await generateBookingId(createdDate);
    const initialSlot = preferredSlots[0];

    const newBooking = await Booking.create({
      id: Date.now().toString(),
      bookingId,
      studentId: req.session.user.id,
      studentName: req.session.user.name,
      interviewerId,
      interviewerName: interviewer.name || '',
      domain,
      paymentAmount: DEFAULT_SESSION_FEE,
      paymentCurrency: 'INR',
      preferredSlots,
      selectedSlot: null,
      selectedDate: initialSlot.selectedDate,
      slotLabel: initialSlot.slotLabel,
      slotStartTime: initialSlot.slotStartTime,
      slotEndTime: initialSlot.slotEndTime,
      timezone: TIMEZONE,
      approvalStatus: 'pending',
      bookingStatus: 'pending',
      conflictChecks: {
        checkedAt: createdAt,
        interviewerConflict: false,
        studentConflict: false
      },
      bookingEvents: [
        makeBookingEvent('interviewer_selected', {
          bookingStatus: 'pending',
          interviewerId,
          interviewerName: interviewer.name || '',
          timestamp: createdAt
        }),
        makeBookingEvent('topic_selected', {
          bookingStatus: 'pending',
          topicName: domain || '',
          timestamp: createdAt
        }),
        makeBookingEvent('booking_created', {
          bookingStatus: 'pending',
          selectedDate: initialSlot.selectedDate,
          slotStartTime: initialSlot.slotStartTime,
          slotEndTime: initialSlot.slotEndTime,
          timezone: TIMEZONE
        }),
        makeBookingEvent('interview_request_submitted', {
          bookingStatus: 'pending',
          requestTimestamp: createdAt
        }),
        makeBookingEvent('request_under_review', {
          bookingStatus: 'pending',
          visibleToInterviewer: true
        })
      ],
      date: initialSlot.selectedDate,
      slot: initialSlot.slotLabel,
      status: 'pending',
      paymentProof: null,
      paymentProofName: '',
      paymentStatus: 'not_uploaded',
      paymentVerifiedAt: null,
      paymentVerifiedBy: null,
      meetingLink: null,
      approvalDeadlineAt: new Date(Date.now() + SIX_HOURS_MS).toISOString(),
      interviewerMessage: '',
      createdAt,
      updatedAt: createdAt,
      notifications: [
        {
          id: `notif-${Date.now()}-interviewer`,
          recipientRole: 'interviewer',
          type: 'booking_requested',
          message: `${req.session.user.name} requested an interview with ${preferredSlots.length} preferred slot(s).`,
          createdAt,
          read: false
        }
      ]
    });

    return res.status(201).json({ message: 'Booking request created', booking: newBooking.toObject() });
  } catch (error) {
    console.error('Booking creation failed:', error?.message || error);
    return res.status(400).json({ error: 'Invalid booking request format.' });
  }
});

router.get('/rules', requireAuth, (req, res) => {
  if (req.session.user.role !== 'student') {
    return res.status(403).json({ error: 'Only students can view booking rules.' });
  }
  const now = new Date();
  res.json({
    timezone: TIMEZONE,
    serverNow: now.toISOString(),
    istToday: getIstToday(now),
    leadTimeMinutes: 60,
    slots: PUBLIC_SLOT_OPTIONS.map(({ label, start, end }) => ({ label, start, end }))
  });
});

router.get('/availability', requireAuth, async (req, res) => {
  if (req.session.user.role !== 'student') {
    return res.status(403).json({ error: 'Only students can view booking availability.' });
  }
  const interviewerId = String(req.query.interviewerId || '').trim();
  const date = String(req.query.date || '').trim();
  if (!interviewerId || !isValidDateKey(date)) {
    return res.status(400).json({ error: 'Invalid Booking Date\nPast dates cannot be selected.\nPlease choose today or a future date.' });
  }

  const now = new Date();
  const today = getIstToday(now);
  const availableSlots = [];
  for (const option of PUBLIC_SLOT_OPTIONS) {
    const slot = makeSlot(date, option.label);
    let available = true;
    let reason = '';
    if (date < today) {
      available = false;
      reason = 'past_date';
    } else if ((getSlotStartMs(slot) || 0) - now.getTime() < LEAD_TIME_MS) {
      available = false;
      reason = 'lead_time';
    } else {
      const conflict = await findConfirmedConflict({
        interviewerId,
        studentId: req.session.user.id,
        slots: [slot]
      });
      if (conflict) {
        available = false;
        reason = conflict.type === 'interviewer' ? 'interviewer_conflict' : 'student_conflict';
      }
    }
    availableSlots.push({ label: option.label, start: option.start, end: option.end, available, reason });
  }

  res.json({ date, timezone: TIMEZONE, serverNow: now.toISOString(), istToday: today, slots: availableSlots });
});

router.post('/:id/payment-screenshot', requireAuth, (req, res) => {
  if (req.session.user.role !== 'student') {
    return res.status(403).json({ error: 'Only students can upload payment screenshot.' });
  }

  paymentUpload.fields([
    { name: 'paymentScreenshot', maxCount: 1 },
    { name: 'paymentProof', maxCount: 1 }
  ])(req, res, async (uploadError) => {
    if (uploadError) {
      return res.status(400).json({ error: uploadError.message });
    }
    try {
      const screenshotFile = req.files?.paymentScreenshot?.[0] || req.files?.paymentProof?.[0] || null;
      if (!screenshotFile) {
        return res.status(400).json({ error: 'Please upload payment screenshot.' });
      }
      const paymentUtr = String(req.body.utr || req.body.paymentUtr || '').trim();
      if (!/^[A-Za-z0-9-]{8,30}$/.test(paymentUtr)) {
        return res.status(400).json({ error: 'UTR number must be 8 to 30 characters and contain only letters, numbers, or hyphen.' });
      }

      await enforceExpiry();
      const booking = await Booking.findOne({ id: req.params.id });
      if (!booking) return res.status(404).json({ error: 'Booking not found' });
      if (booking.studentId !== req.session.user.id) return res.status(403).json({ error: 'Unauthorized for this booking.' });
      if (booking.status !== 'accepted') {
        return res.status(409).json({ error: 'Payment upload is available only after interviewer accepts your request.' });
      }

      const paymentProofPath = await uploadPaymentProofAsset(screenshotFile);
      const isReupload = booking.paymentStatus === 'rejected' || Boolean(booking.paymentProof);
      const submittedAt = new Date().toISOString();
      const paymentEvidence = createPaymentEvidence({
        booking,
        file: screenshotFile,
        filePath: paymentProofPath,
        utr: paymentUtr,
        submittedAt,
        type: isReupload ? 'reupload' : 'original'
      });
      booking.paymentSubmissions = [...(booking.paymentSubmissions || []), paymentEvidence];
      booking.paymentProof = paymentProofPath;
      booking.paymentProofName = screenshotFile.originalname;
      booking.paymentUtr = paymentUtr;
      booking.utiNumber = paymentUtr;
      booking.paymentRejectedAt = '';
      booking.paymentRejectedByName = '';
      booking.paymentRejectionReason = '';
      booking.paymentStatus = 'screenshot_uploaded';
      appendBookingEvent(booking, isReupload ? 'payment_screenshot_reuploaded' : 'payment_screenshot_submitted', {
        fileName: screenshotFile.originalname,
        filePath: paymentProofPath,
        utr: paymentUtr,
        paymentStatus: 'screenshot_uploaded',
        ...getPaymentEvidencePayload(booking)
      });
      appendBookingEvent(booking, isReupload ? 'payment_re_review' : 'payment_under_review', {
        paymentStatus: 'screenshot_uploaded',
        ...getPaymentEvidencePayload(booking)
      });
      booking.updatedAt = new Date().toISOString();
      booking.notifications = [
        ...(booking.notifications || []),
        {
          id: `notif-${Date.now()}-${booking.id}`,
          recipientRole: 'interviewer',
          type: 'payment_screenshot_uploaded',
          message: `${booking.studentName || 'Student'} uploaded payment screenshot for verification.`,
          createdAt: new Date().toISOString(),
          read: false
        }
      ];
      await booking.save();

      return res.json({ message: 'Payment screenshot uploaded', booking: booking.toObject() });
    } catch (error) {
      return res.status(400).json({ error: 'Invalid booking request format.' });
    }
  });
});

router.get('/my-bookings', requireAuth, async (req, res) => {
  await enforceExpiry();
  const userId = req.session.user.id;
  const role = req.session.user.role;
  await advanceRefundDeadlines(role === 'student' ? { studentId: userId } : role === 'interviewer' ? { interviewerId: userId } : {});
  await markInterviewActiveEvents(role === 'student' ? { studentId: userId } : role === 'interviewer' ? { interviewerId: userId } : {});
  await autoCloseOverdueSessions(role === 'student' ? { studentId: userId } : role === 'interviewer' ? { interviewerId: userId } : {});
  await advanceFeedbackReminders(role === 'student' ? { studentId: userId } : role === 'interviewer' ? { interviewerId: userId } : {});
  await expireQualityChecks(role === 'student' ? { studentId: userId } : { interviewerId: userId });

  let query = {};
  if (role === 'student') query = { studentId: userId };
  if (role === 'interviewer') query = { interviewerId: userId };

  const bookingDocs = await Booking.find(query);
  for (const booking of bookingDocs) {
    await ensureBookingFoundation(booking);
    await syncHangingTagState(booking);
  }
  let myBookings = bookingDocs.map(booking => booking.toObject());
  const users = await User.find({}).lean();
  const usersById = new Map(users.map(user => [user.id, user]));

  myBookings = myBookings.map(booking => {
    const student = usersById.get(booking.studentId);
    const interviewer = usersById.get(booking.interviewerId);
    const canViewInterviewerPhone = role === 'student' && ['accepted', 'confirmed', 'meeting_link_uploaded', 'session_ended', 'completed'].includes(booking.status);
    const studentProfile = role === 'interviewer' && student ? {
      name: student.name || booking.studentName || 'Student',
      college: student.college || '',
      course: student.course || '',
      phone: student.phone || '',
      bio: student.bio || '',
      profileImage: student.profileImage || null
    } : undefined;
    const interviewerProfile = role === 'student' && interviewer ? {
      id: interviewer.id,
      name: interviewer.name || booking.interviewerName || 'Interviewer',
      age: interviewer.age || null,
      phone: canViewInterviewerPhone ? interviewer.phone || '' : '',
      company: interviewer.company || '',
      yearsOfExperience: interviewer.yearsOfExperience || 0,
      primaryExpertise: interviewer.primaryExpertise || interviewer.specialization || '',
      city: interviewer.city || '',
      area: interviewer.area || '',
      college: interviewer.college || '',
      course: interviewer.course || '',
      bio: interviewer.bio || '',
      skillTags: interviewer.skillTags || [],
      interviewServices: interviewer.interviewServices || [],
      availabilityPreference: interviewer.availabilityPreference || [],
      profileImage: interviewer.profileImage || null,
      verification: { status: interviewer.verification?.status || 'required' }
    } : undefined;
    return {
      ...booking,
      refundOverdue: isRefundOverdue(booking),
      studentName: booking.studentName || student?.name || 'Student',
      interviewerName: booking.interviewerName || interviewer?.name || 'Interviewer',
      ...(studentProfile ? { studentProfile } : {}),
      ...(interviewerProfile ? { interviewerProfile } : {})
    };
  });

  res.json({ bookings: myBookings });
});

router.get('/refund-history', requireAuth, async (req, res) => {
  await advanceRefundDeadlines(req.session.user.role === 'student'
    ? { studentId: req.session.user.id }
    : req.session.user.role === 'interviewer'
      ? { interviewerId: req.session.user.id }
      : {});

  const role = req.session.user.role;
  if (!['student', 'interviewer', 'admin'].includes(role)) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const query = role === 'student'
    ? { studentId: req.session.user.id, refundStatus: { $ne: '' } }
    : role === 'interviewer'
      ? { interviewerId: req.session.user.id, refundStatus: { $ne: '' } }
      : { refundStatus: { $ne: '' } };
  const bookings = await Booking.find(query).sort({ refundRequestedAt: -1, updatedAt: -1 }).lean();
  const history = bookings.map(booking => ({
    id: booking.id,
    bookingId: booking.bookingId || booking.id,
    studentName: booking.refundSnapshot?.studentName || booking.studentName || 'Student',
    interviewerName: booking.interviewerName || 'Interviewer',
    refundAmount: Number(booking.refundAmount || booking.refundSnapshot?.paymentAmount || booking.paymentAmount || DEFAULT_SESSION_FEE),
    refundCurrency: booking.refundCurrency || booking.paymentCurrency || 'INR',
    utr: booking.refundUtr || '',
    screenshot: booking.refundProof || null,
    refundRequestedAt: booking.refundRequestedAt || '',
    refundSubmittedAt: booking.refundSubmittedAt || '',
    refundConfirmedAt: booking.refundConfirmedAt || '',
    refundStatus: booking.refundStatus || '',
    status: booking.status || '',
    events: booking.refundEvents || []
  }));

  res.json({ history });
});

router.put('/:id/payment-verification', requireAuth, async (req, res) => {
  if (!['interviewer', 'admin'].includes(req.session.user.role)) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const { paymentStatus } = req.body;
  if (!['verified', 'rejected'].includes(paymentStatus)) {
    return res.status(400).json({ error: 'paymentStatus must be either verified or rejected.' });
  }
  const rejectionReason = String(req.body.rejectionReason || '').trim();
  if (paymentStatus === 'rejected' && !rejectionReason) {
    return res.status(400).json({ error: 'Rejection reason is required when rejecting payment.' });
  }

  await enforceExpiry();
  const booking = await Booking.findOne({ id: req.params.id });
  if (!booking) return res.status(404).json({ error: 'Booking not found' });

  if (req.session.user.role === 'interviewer' && booking.interviewerId !== req.session.user.id) {
    return res.status(403).json({ error: 'Unauthorized for this booking.' });
  }

  const actionAt = new Date().toISOString();
  const actorName = req.session.user.name || req.session.user.email || (req.session.user.role === 'admin' ? 'Admin' : 'Interviewer');
  booking.paymentStatus = paymentStatus;
  booking.paymentAmount = Number(booking.paymentAmount || DEFAULT_SESSION_FEE);
  booking.paymentCurrency = booking.paymentCurrency || 'INR';
  booking.paymentVerifiedBy = req.session.user.id;
  booking.paymentVerifiedAt = paymentStatus === 'verified' ? actionAt : null;
  booking.paymentApprovedByName = paymentStatus === 'verified' ? actorName : '';
  booking.paymentRejectedAt = paymentStatus === 'rejected' ? actionAt : '';
  booking.paymentRejectedByName = paymentStatus === 'rejected' ? actorName : '';
  booking.paymentRejectionReason = paymentStatus === 'rejected' ? rejectionReason : '';
  appendBookingEvent(booking, paymentStatus === 'verified' ? 'payment_approved' : 'payment_rejected', {
    paymentStatus,
    actorId: req.session.user.id,
    actorRole: req.session.user.role,
    actor: actorName,
    paymentProof: booking.paymentProof || '',
    paymentAmount: booking.paymentAmount,
    paymentCurrency: booking.paymentCurrency,
    approverName: paymentStatus === 'verified' ? actorName : '',
    approvalTimestamp: paymentStatus === 'verified' ? actionAt : '',
    rejectedBy: paymentStatus === 'rejected' ? actorName : '',
    rejectionReason: paymentStatus === 'rejected' ? rejectionReason : '',
    rejectionTimestamp: paymentStatus === 'rejected' ? actionAt : '',
    ...getPaymentEvidencePayload(booking)
  });
  booking.updatedAt = new Date().toISOString();
  booking.notifications = [
    ...(booking.notifications || []),
    {
      id: `notif-${Date.now()}-${booking.id}`,
      recipientId: booking.studentId,
      recipientRole: 'student',
      type: paymentStatus === 'verified' ? 'payment_verified' : 'payment_rejected',
      title: paymentStatus === 'verified' ? 'Payment Verified' : 'Payment Not Confirmed',
      message: paymentStatus === 'verified'
        ? 'Payment verified. Your booking is ready for confirmation.'
        : 'Payment proof was not confirmed. Please contact interviewer or upload correct proof if supported.',
      bookingId: booking.id,
      createdAt: new Date().toISOString(),
      read: false
    }
  ];

  await booking.save();
  res.json({ message: 'Payment verification updated', booking: booking.toObject() });
});

router.put('/:id/status', requireAuth, async (req, res) => {
  const { status, message, selectedSlot } = req.body;

  if (req.session.user.role === 'interviewer' && req.session.user.id !== undefined) {
    const interviewerAllowed = ['accepted', 'confirmed', 'rejected', 'reschedule_requested', 'cancelled', 'session_ended'];
    if (!interviewerAllowed.includes(status)) {
      return res.status(400).json({ error: 'Invalid status for interviewer action.' });
    }
  }

  if (req.session.user.role === 'student' && req.session.user.id !== undefined) {
    const studentAllowed = ['cancelled'];
    if (!studentAllowed.includes(status)) {
      return res.status(403).json({ error: 'Students can only cancel bookings.' });
    }
  }

  await enforceExpiry();
  const booking = await Booking.findOne({ id: req.params.id });
  if (!booking) return res.status(404).json({ error: 'Booking not found' });

  if (req.session.user.role === 'interviewer' && booking.interviewerId !== req.session.user.id) {
    return res.status(403).json({ error: 'Unauthorized for this booking.' });
  }
  if (req.session.user.role === 'student' && booking.studentId !== req.session.user.id) {
    return res.status(403).json({ error: 'Unauthorized for this booking.' });
  }

  const noResponseOrCancelled = ['no_response', 'cancelled', 'rejected'];
  if (noResponseOrCancelled.includes(booking.status)) {
    return res.status(409).json({ error: 'This request can no longer be updated.' });
  }

  const previousStatus = booking.status;
  booking.status = status;
  booking.updatedAt = new Date().toISOString();

  if (status === 'accepted') {
    if (!['pending', 'reschedule_slot_selected'].includes(previousStatus)) {
      return res.status(409).json({ error: 'Request can only be accepted from pending or student-selected reschedule state.' });
    }
    const acceptedSlot = selectedSlot?.date && selectedSlot?.time ? selectedSlot : booking.selectedSlot;
    if (!acceptedSlot?.date || !acceptedSlot?.time) {
      return res.status(400).json({ error: 'A slot must be selected from the student\'s preferred slots.' });
    }
    const canonicalAcceptedSlot = makeSlot(acceptedSlot.date || acceptedSlot.selectedDate, acceptedSlot.time || acceptedSlot.slotLabel || acceptedSlot.label);
    if (!canonicalAcceptedSlot) {
      return res.status(400).json({ error: 'Selected slot is not available.' });
    }
    booking.selectedSlot = canonicalAcceptedSlot;
    applyCanonicalSlotFields(booking, canonicalAcceptedSlot);
    const approvedAt = new Date();
    booking.approvalStatus = 'approved';
    booking.approvedAt = approvedAt.toISOString();
    booking.approvedDate = approvedAt.toLocaleDateString('en-CA', { timeZone: TIMEZONE });
    booking.approvedTime = approvedAt.toLocaleTimeString('en-GB', { timeZone: TIMEZONE, hour12: false });
    booking.bookingEvents = [
      ...(booking.bookingEvents || []),
      makeBookingEvent('booking_approved', {
        bookingStatus: 'accepted',
        actorId: req.session.user.id,
        actorRole: req.session.user.role,
        selectedDate: canonicalAcceptedSlot.selectedDate,
        slotStartTime: canonicalAcceptedSlot.slotStartTime,
        slotEndTime: canonicalAcceptedSlot.slotEndTime,
        timezone: TIMEZONE
      })
    ];
    if (previousStatus === 'reschedule_slot_selected') {
      appendBookingEvent(booking, 'reschedule_confirmed', {
        selectedDate: canonicalAcceptedSlot.selectedDate,
        slotLabel: canonicalAcceptedSlot.slotLabel,
        slotStartTime: canonicalAcceptedSlot.slotStartTime,
        slotEndTime: canonicalAcceptedSlot.slotEndTime,
        timezone: TIMEZONE
      });
    }
    booking.status = 'accepted';
    booking.bookingStatus = 'accepted';
    if (booking.rescheduleProposal) {
      booking.rescheduleProposal = {
        ...booking.rescheduleProposal,
        status: 'interviewer_confirmed',
        confirmedAt: new Date().toISOString()
      };
    }
    booking.notifications = [
      ...(booking.notifications || []),
      {
        id: `notif-${Date.now()}-${booking.id}`,
        recipientId: booking.studentId,
        recipientRole: 'student',
        type: 'booking_accepted',
        title: 'Booking Accepted',
        message: 'Your request is accepted. Please complete payment and upload screenshot.',
        bookingId: booking.id,
        createdAt: new Date().toISOString(),
        read: false
      }
    ];
  }

  if (status === 'confirmed') {
    if (previousStatus !== 'accepted') {
      return res.status(409).json({ error: 'Booking can only be confirmed after acceptance.' });
    }
    if (booking.paymentStatus !== 'verified') {
      return res.status(409).json({ error: 'Payment must be verified before confirming this booking.' });
    }
    if (!booking.selectedSlot?.date || !booking.selectedSlot?.time) {
      return res.status(409).json({ error: 'Select and accept a slot before confirming booking.' });
    }
    applyCanonicalSlotFields(booking, booking.selectedSlot);
    const conflict = await findConfirmedConflict({
      interviewerId: booking.interviewerId,
      studentId: booking.studentId,
      slots: [makeSlot(booking.selectedDate, booking.slotLabel)],
      excludeBookingId: booking.id
    });
    if (conflict) {
      booking.conflictChecks = {
        ...(booking.conflictChecks || {}),
        checkedAt: new Date().toISOString(),
        interviewerConflict: conflict.type === 'interviewer',
        studentConflict: conflict.type === 'student',
        conflictBookingId: conflict.bookingId || ''
      };
      await booking.save();
      return res.status(409).json({ error: conflict.error });
    }
    if (booking.approvalStatus !== 'approved') {
      const approvedAt = new Date();
      booking.approvalStatus = 'approved';
      booking.approvedAt = approvedAt.toISOString();
      booking.approvedDate = approvedAt.toLocaleDateString('en-CA', { timeZone: TIMEZONE });
      booking.approvedTime = approvedAt.toLocaleTimeString('en-GB', { timeZone: TIMEZONE, hour12: false });
    }
    booking.status = 'confirmed';
    booking.bookingStatus = 'confirmed';
    const confirmedAt = new Date();
    const confirmedIst = getIstParts(confirmedAt);
    booking.confirmedAt = confirmedAt.toISOString();
    booking.confirmedDate = confirmedIst.date;
    booking.confirmedTime = confirmedIst.time;
    booking.conflictChecks = {
      ...(booking.conflictChecks || {}),
      checkedAt: confirmedAt.toISOString(),
      interviewerConflict: false,
      studentConflict: false
    };
    booking.bookingEvents = [
      ...(booking.bookingEvents || []),
      makeBookingEvent('booking_confirmed', {
        bookingStatus: 'confirmed',
        actorId: req.session.user.id,
        actorRole: req.session.user.role,
        selectedDate: booking.selectedDate,
        slotStartTime: booking.slotStartTime,
        slotEndTime: booking.slotEndTime,
        timezone: TIMEZONE
      }),
      makeBookingEvent('booking_id_generated', {
        bookingStatus: 'confirmed',
        displayBookingId: booking.bookingId || booking.id
      })
    ];
    booking.notifications = [
      ...(booking.notifications || []),
      {
        id: `notif-${Date.now()}-${booking.id}`,
        recipientId: booking.studentId,
        recipientRole: 'student',
        type: 'booking_confirmed',
        title: 'Booking Confirmed',
        message: 'Your booking is officially confirmed.',
        bookingId: booking.id,
        createdAt: new Date().toISOString(),
        read: false
      }
    ];
  }

  if (status === 'cancelled') {
    const cancelledBy = req.session.user.role === 'interviewer' ? 'interviewer' : 'student';
    const paymentVerified = booking.paymentStatus === 'verified';
    const now = new Date();
    const ist = getIstParts(now);
    booking.status = cancelledBy === 'interviewer' && paymentVerified ? 'refund_required' : (cancelledBy === 'interviewer' ? 'cancelled_by_interviewer' : 'cancelled_by_student');
    booking.hangingTagState = null;
    booking.interviewerMessage = message || `Cancelled by ${cancelledBy}.`;
    appendBookingEvent(booking, 'request_cancelled', {
      actor: cancelledBy,
      actorRole: req.session.user.role,
      reason: message || `Cancelled by ${cancelledBy}.`,
      bookingStatus: booking.status
    });
    if (cancelledBy === 'interviewer' && paymentVerified) {
      booking.refundStatus = 'required';
      booking.refundAmount = Number(booking.paymentAmount || DEFAULT_SESSION_FEE);
      booking.refundCurrency = booking.paymentCurrency || 'INR';
      booking.refundSnapshot = await buildRefundSnapshot(booking);
      booking.refundRequiredAt = now.toISOString();
      booking.refundRequestedAt = now.toISOString();
      booking.refundCancellationDate = ist.date;
      booking.refundCancellationTime = ist.time;
      appendRefundEvent(booking, 'refund_required_created', {
        refundAmount: booking.refundAmount,
        refundCurrency: booking.refundCurrency
      });
      appendRefundEvent(booking, 'refund_snapshot_stored', {
        refundSnapshot: booking.refundSnapshot
      });
    }
    booking.notifications = [
      ...(booking.notifications || []),
      {
        id: `notif-${Date.now()}-${booking.id}`,
        recipientRole: cancelledBy === 'interviewer' ? 'student' : 'interviewer',
        type: `booking_${booking.status}`,
        message: cancelledBy === 'interviewer'
          ? (paymentVerified ? 'Interviewer cancelled after payment. A refund is now required.' : 'Interviewer cancelled the booking.')
          : 'Student cancelled the interview. Amount will not be refunded.',
        createdAt: new Date().toISOString(),
        read: false
      }
    ];
    if (cancelledBy === 'interviewer' && paymentVerified) {
      booking.notifications.push(createNotification({
        booking,
        recipientId: booking.interviewerId,
        recipientRole: 'interviewer',
        type: 'refund_required',
        title: 'Refund Required',
        message: 'Payment was completed before cancellation. Please refund the student and upload proof.'
      }));
    }
  }

  if (status === 'rejected') {
    booking.status = 'rejected';
    booking.interviewerMessage = message || 'Request rejected by interviewer.';
    appendBookingEvent(booking, 'request_cancelled', {
      actor: 'interviewer',
      actorRole: req.session.user.role,
      reason: booking.interviewerMessage,
      bookingStatus: 'rejected'
    });
  }

  if (status === 'completed' && req.session.user.role === 'interviewer') {
    booking.notifications = [
      ...(booking.notifications || []),
      {
        id: `notif-${Date.now()}-${booking.id}`,
        recipientId: booking.studentId,
        recipientRole: 'student',
        type: 'interview_completed',
        title: 'Interview Completed',
        message: 'Your interviewer marked the interview as successful. Please share your feedback.',
        bookingId: booking.id,
        createdAt: new Date().toISOString(),
        read: false
      }
    ];
  }

  if (status === 'session_ended' && req.session.user.role === 'interviewer') {
    const persistedMeetingLink = typeof booking.meetingLink === 'string' ? booking.meetingLink.trim() : '';
    if (!persistedMeetingLink) {
      return res.status(409).json({ error: 'Meeting link must be uploaded before ending interview session.' });
    }
    booking.status = 'session_ended';
    booking.sessionEndedAt = new Date().toISOString();
    appendBookingEvent(booking, 'interview_ended', {
      bookingStatus: 'session_ended',
      selectedDate: booking.selectedDate,
      slotStartTime: booking.slotStartTime,
      slotEndTime: booking.slotEndTime,
      timezone: TIMEZONE
    });
    booking.notifications = [
      ...(booking.notifications || []),
      {
        id: `notif-${Date.now()}-${booking.id}`,
        recipientId: booking.studentId,
        recipientRole: 'student',
        type: 'session_ended',
        title: 'Interview Session Ended',
        message: 'Interviewer ended the interview session and is preparing feedback.',
        bookingId: booking.id,
        createdAt: new Date().toISOString(),
        read: false
      }
    ];
  }

  if (message && status !== 'cancelled') booking.interviewerMessage = message;

  await booking.save();
  res.json({ message: 'Booking updated', booking: booking.toObject() });
});

router.put('/:id/reschedule-proposal', requireAuth, async (req, res) => {
  if (!['interviewer', 'admin'].includes(req.session.user.role)) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  await enforceExpiry();
  const booking = await Booking.findOne({ id: req.params.id });
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  if (req.session.user.role === 'interviewer' && booking.interviewerId !== req.session.user.id) {
    return res.status(403).json({ error: 'Unauthorized for this booking.' });
  }
  if (!['pending', 'accepted'].includes(booking.status)) {
    return res.status(409).json({ error: 'New slot requests are available only before final confirmation.' });
  }

  const date = String(req.body.date || '').trim();
  const slots = Array.isArray(req.body.slots) ? req.body.slots : [];
  const message = String(req.body.message || '').trim().slice(0, 240);
  const normalizedSlots = slots
    .map(slot => makeSlot(date, slot?.time || slot?.slotLabel || slot || ''))
    .filter(Boolean)
    .sort((a, b) => a.slotStartTime.localeCompare(b.slotStartTime));

  if (!date || normalizedSlots.length === 0) {
    return res.status(400).json({ error: 'Select one date and at least one available slot.' });
  }

  const now = new Date().toISOString();
  booking.status = 'reschedule_requested';
  booking.interviewerMessage = message;
  booking.rescheduleProposal = {
    date,
    slots: normalizedSlots,
    message,
    status: 'proposed',
    selectedSlot: null,
    proposedAt: now,
    selectedAt: null
  };
  appendBookingEvent(booking, 'reschedule_requested', {
    proposedDate: date,
    proposedSlots: normalizedSlots,
    message,
    bookingStatus: 'reschedule_requested'
  });
  booking.updatedAt = now;
  booking.notifications = [
    ...(booking.notifications || []),
    {
      id: `notif-${Date.now()}-${booking.id}`,
      recipientId: booking.studentId,
      recipientRole: 'student',
      type: 'reschedule_slots_proposed',
      title: 'New Slots Available',
      message: 'Your interviewer suggested alternate interview slots. Please choose one from your dashboard.',
      bookingId: booking.id,
      createdAt: now,
      read: false
    }
  ];

  await booking.save();
  res.json({ message: 'Available slots sent', booking: booking.toObject() });
});

router.put('/:id/reschedule-selection', requireAuth, async (req, res) => {
  if (req.session.user.role !== 'student') {
    return res.status(403).json({ error: 'Only students can choose a reschedule slot.' });
  }

  await enforceExpiry();
  const booking = await Booking.findOne({ id: req.params.id });
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  if (booking.studentId !== req.session.user.id) {
    return res.status(403).json({ error: 'Unauthorized for this booking.' });
  }
  if (booking.status !== 'reschedule_requested' || booking.rescheduleProposal?.status !== 'proposed') {
    return res.status(409).json({ error: 'No active reschedule proposal is available.' });
  }

  const selectedSlot = {
    date: String(req.body.selectedSlot?.date || '').trim(),
    time: String(req.body.selectedSlot?.time || '').trim()
  };
  const canonicalSelectedSlot = makeSlot(selectedSlot.date, selectedSlot.time);
  const isValidSlot = canonicalSelectedSlot && (booking.rescheduleProposal.slots || []).some(slot => slot.selectedDate === canonicalSelectedSlot.selectedDate && slot.slotStartTime === canonicalSelectedSlot.slotStartTime);
  if (!isValidSlot) {
    return res.status(400).json({ error: 'Please select one of the proposed slots.' });
  }

  const now = new Date().toISOString();
  booking.selectedSlot = canonicalSelectedSlot;
  applyCanonicalSlotFields(booking, canonicalSelectedSlot);
  booking.status = 'reschedule_slot_selected';
  booking.rescheduleProposal = {
    ...booking.rescheduleProposal,
    selectedSlot: booking.selectedSlot,
    status: 'student_selected',
    selectedAt: now
  };
  appendBookingEvent(booking, 'reschedule_slot_selected', {
    selectedDate: canonicalSelectedSlot.selectedDate,
    slotLabel: canonicalSelectedSlot.slotLabel,
    slotStartTime: canonicalSelectedSlot.slotStartTime,
    slotEndTime: canonicalSelectedSlot.slotEndTime,
    timezone: TIMEZONE,
    bookingStatus: 'reschedule_slot_selected'
  });
  booking.updatedAt = now;
  booking.notifications = [
    ...(booking.notifications || []),
    {
      id: `notif-${Date.now()}-${booking.id}`,
      recipientId: booking.interviewerId,
      recipientRole: 'interviewer',
      type: 'reschedule_slot_selected',
      title: 'Student Selected New Slot',
      message: 'The student selected one of your proposed slots. Please confirm booking.',
      bookingId: booking.id,
      createdAt: now,
      read: false
    }
  ];

  await booking.save();
  res.json({ message: 'New slot selected', booking: booking.toObject() });
});

router.put('/:id/meeting-link', requireAuth, async (req, res) => {
  if (!['interviewer', 'admin'].includes(req.session.user.role)) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const { meetingLink } = req.body;
  if (!meetingLink || typeof meetingLink !== 'string' || meetingLink.trim().length === 0) {
    return res.status(400).json({ error: 'Meeting link is required.' });
  }

  const trimmed = meetingLink.trim();
  const isHttpLink = /^https?:\/\//i.test(trimmed);
  const isMeet = trimmed.includes('meet.google.com');

  if (!isHttpLink || !isMeet) {
    return res.status(400).json({ error: 'Only valid Google Meet links are allowed.' });
  }

  await enforceExpiry();
  const booking = await Booking.findOne({ id: req.params.id });
  if (!booking) return res.status(404).json({ error: 'Booking not found' });

  if (req.session.user.role === 'interviewer' && booking.interviewerId !== req.session.user.id) {
    return res.status(403).json({ error: 'Unauthorized for this booking.' });
  }

  const confirmedStatuses = ['confirmed', 'meeting_link_uploaded'];
  if (!confirmedStatuses.includes(booking.status)) {
    return res.status(409).json({ error: 'Meeting link can only be uploaded for confirmed bookings.' });
  }

  const uploadedAt = new Date();
  const startsAt = getInterviewStartMs(booking);
  const delayMinutes = startsAt && uploadedAt.getTime() > startsAt
    ? Math.ceil((uploadedAt.getTime() - startsAt) / 60000)
    : 0;
  booking.meetingLink = trimmed;
  booking.meetingLinkUploadedAt = uploadedAt.toISOString();
  booking.status = 'meeting_link_uploaded';
  appendBookingEvent(booking, 'meeting_link_uploaded', {
    meetingLink: trimmed,
    delayMinutes,
    warning: delayMinutes > 0,
    selectedDate: booking.selectedDate,
    slotStartTime: booking.slotStartTime,
    timezone: TIMEZONE
  });
  booking.updatedAt = uploadedAt.toISOString();
  await syncHangingTagState(booking);
  booking.notifications = [
    ...(booking.notifications || []),
    {
      id: `notif-${Date.now()}-${booking.id}`,
      recipientId: booking.studentId,
      recipientRole: 'student',
      type: 'meeting_link_uploaded',
      title: 'Meeting Link Available',
      message: 'Your interviewer has uploaded the meeting link.',
      meetingLink: trimmed,
      bookingId: booking.id,
      displayBookingId: booking.bookingId || '',
      createdAt: new Date().toISOString(),
      read: false
    }
  ];

  await booking.save();
  res.json({ message: 'Google Meet link uploaded successfully', booking: booking.toObject() });
});

router.post('/:id/reminders', requireAuth, async (req, res) => {
  if (!['interviewer', 'admin'].includes(req.session.user.role)) {
    return res.status(403).json({ error: 'Only interviewers can notify students.' });
  }

  const booking = await Booking.findOne({ id: req.params.id });
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  await ensureBookingId(booking);
  if (req.session.user.role === 'interviewer' && booking.interviewerId !== req.session.user.id) {
    return res.status(403).json({ error: 'Unauthorized for this booking.' });
  }

  const existingActive = (booking.notifications || []).some(n => (
    n.recipientRole === 'student' &&
    n.type === 'interview_reminder' &&
    n.read === false
  ));
  if (existingActive) {
    return res.json({ message: 'An active reminder is already waiting for the student.', booking: booking.toObject() });
  }
  await syncHangingTagState(booking);
  const tagType = booking.hangingTagState?.type || 'interview_reminder';
  if (booking.tagNotificationSentAt?.[tagType]) {
    return res.json({ message: 'Student already notified.', booking: booking.toObject() });
  }

  const reminderMessage = tagType === 'student_not_joined'
    ? 'Your interviewer is waiting.'
    : 'Your interviewer is preparing for the interview.';

  booking.notifications = [
    ...(booking.notifications || []),
    {
      id: `notif-${Date.now()}-${booking.id}`,
      recipientId: booking.studentId,
      recipientRole: 'student',
      type: 'interview_reminder',
      title: 'Interview Reminder',
      message: reminderMessage,
      meetingLink: booking.meetingLink || '',
      bookingId: booking.id,
      displayBookingId: booking.bookingId || '',
      createdAt: new Date().toISOString(),
      read: false
    }
  ];
  booking.tagNotificationSentAt = {
    ...(booking.tagNotificationSentAt || {}),
    [tagType]: new Date().toISOString()
  };
  booking.updatedAt = new Date().toISOString();
  await syncHangingTagState(booking);
  await booking.save();

  res.json({ message: 'Student notified.', booking: booking.toObject() });
});

router.put('/:id/notifications/:notificationId/ack', requireAuth, async (req, res) => {
  const booking = await Booking.findOne({ id: req.params.id });
  if (!booking) return res.status(404).json({ error: 'Booking not found' });

  const notification = (booking.notifications || []).find(n => n.id === req.params.notificationId);
  if (!notification) return res.status(404).json({ error: 'Notification not found' });
  const isRecipient = notification.recipientRole === req.session.user.role && (!notification.recipientId || notification.recipientId === req.session.user.id);
  if (!isRecipient) return res.status(403).json({ error: 'Unauthorized for this notification.' });

  booking.notifications = (booking.notifications || []).map(n => (
    n.id === req.params.notificationId ? { ...n, read: true, acknowledgedAt: new Date().toISOString() } : n
  ));
  booking.updatedAt = new Date().toISOString();
  await booking.save();

  res.json({ message: 'Notification acknowledged.', booking: booking.toObject() });
});

router.post('/:id/student-joined', requireAuth, async (req, res) => {
  if (req.session.user.role !== 'student') {
    return res.status(403).json({ error: 'Only students can join interviews.' });
  }

  const booking = await Booking.findOne({ id: req.params.id });
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  if (booking.studentId !== req.session.user.id) {
    return res.status(403).json({ error: 'Unauthorized for this booking.' });
  }

  const firstJoin = !booking.studentJoinedAt;
  booking.studentJoinedAt = booking.studentJoinedAt || new Date().toISOString();
  if (firstJoin) {
    appendBookingEvent(booking, 'meeting_link_opened', {
      meetingLink: booking.meetingLink || '',
      bookingStatus: booking.status
    });
  }
  booking.updatedAt = new Date().toISOString();
  booking.hangingTagState = null;
  await booking.save();

  res.json({ message: 'Student join recorded.', booking: booking.toObject() });
});

router.post('/:id/reassign', requireAuth, async (req, res) => {
  if (req.session.user.role !== 'student') {
    return res.status(403).json({ error: 'Only students can reassign.' });
  }

  const { newInterviewerId, newSlots } = req.body;
  if (!newInterviewerId) {
    return res.status(400).json({ error: 'New interviewer is required.' });
  }

  await enforceExpiry();
  const booking = await Booking.findOne({ id: req.params.id });
  if (!booking) return res.status(404).json({ error: 'Booking not found' });

  if (booking.studentId !== req.session.user.id) {
    return res.status(403).json({ error: 'Unauthorized.' });
  }

  const reassignableStatuses = ['cancelled_by_interviewer', 'no_response', 'rejected'];
  if (!reassignableStatuses.includes(booking.status)) {
    return res.status(409).json({ error: 'Reassignment is only available when the interviewer cancelled or did not respond within 6 hours.' });
  }

  const newInterviewer = await User.findOne({ id: newInterviewerId, role: 'interviewer' }).lean();
  if (!newInterviewer) {
    return res.status(404).json({ error: 'Interviewer not found.' });
  }

  const normalizedSlots = normalizeSlots(newSlots, null, null);
  if (normalizedSlots.length === 0) {
    return res.status(400).json({ error: 'At least one preferred slot is required.' });
  }

  booking.status = 'reassigned';
  booking.interviewerId = newInterviewerId;
  booking.interviewerName = newInterviewer.name;
  booking.preferredSlots = normalizedSlots;
  booking.selectedSlot = null;
  booking.meetingLink = null;
  booking.interviewerMessage = '';
  booking.approvalDeadlineAt = new Date(Date.now() + SIX_HOURS_MS).toISOString();
  booking.updatedAt = new Date().toISOString();
  booking.notifications = [
    ...(booking.notifications || []),
    {
      id: `notif-${Date.now()}-${booking.id}`,
      recipientRole: 'interviewer',
      type: 'booking_reassigned',
      message: `${booking.studentName} reassigned you to an interview. ${normalizedSlots.length} preferred slot(s) selected.`,
      createdAt: new Date().toISOString(),
      read: false
    }
  ];

  await booking.save();
  res.json({ message: 'Booking reassigned', booking: booking.toObject() });
});

router.post('/:id/feedback', requireAuth, async (req, res) => {
  if (req.session.user.role !== 'interviewer') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const {
    technicalSkills,
    communicationSkills,
    confidenceLevel,
    professionalism,
    problemSolvingAbility,
    leadershipQuality,
    adaptability,
    resumePresentation,
    behavioralInteraction,
    clarityOfThought,
    communication,
    technical,
    behaviour,
    confidence,
    resumeScore,
    comments
  } = req.body;

  const normalizeScore = (value) => {
    const n = Number(value);
    return Number.isFinite(n) ? Math.max(0, Math.min(10, n)) : 0;
  };

  const feedbackPayload = {
    technicalSkills: normalizeScore(technicalSkills ?? technical),
    communicationSkills: normalizeScore(communicationSkills ?? communication),
    confidenceLevel: normalizeScore(confidenceLevel ?? confidence),
    professionalism: normalizeScore(professionalism ?? behaviour),
    problemSolvingAbility: normalizeScore(problemSolvingAbility ?? resumeScore),
    leadershipQuality: normalizeScore(leadershipQuality),
    adaptability: normalizeScore(adaptability),
    resumePresentation: normalizeScore(resumePresentation),
    behavioralInteraction: normalizeScore(behavioralInteraction),
    clarityOfThought: normalizeScore(clarityOfThought),
    comments
  };

  const hasAtLeastOneScore = [
    feedbackPayload.technicalSkills,
    feedbackPayload.communicationSkills,
    feedbackPayload.confidenceLevel,
    feedbackPayload.professionalism,
    feedbackPayload.problemSolvingAbility,
    feedbackPayload.leadershipQuality,
    feedbackPayload.adaptability,
    feedbackPayload.resumePresentation,
    feedbackPayload.behavioralInteraction,
    feedbackPayload.clarityOfThought
  ].some((score) => score > 0);

  if (!hasAtLeastOneScore) {
    return res.status(400).json({ error: 'Please provide valid interview ratings.' });
  }

  await enforceExpiry();
  const booking = await Booking.findOne({ id: req.params.id });

  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  if (booking.interviewerId !== req.session.user.id) return res.status(403).json({ error: 'Unauthorized for this booking.' });
  if (booking.status !== 'session_ended') {
    return res.status(409).json({ error: 'Feedback can be submitted only after ending the interview session.' });
  }

  booking.feedback = {
    ...feedbackPayload,
    // Backward-compatible keys for existing cards/data readers.
    communication: feedbackPayload.communicationSkills,
    technical: feedbackPayload.technicalSkills,
    behaviour: feedbackPayload.professionalism,
    confidence: feedbackPayload.confidenceLevel,
    resumeScore: feedbackPayload.problemSolvingAbility,
    submittedAt: new Date().toISOString()
  };
  appendBookingEvent(booking, 'feedback_submitted', {
    actor: req.session.user.name || 'Interviewer',
    actorRole: 'interviewer',
    feedbackText: comments || '',
    interviewerName: req.session.user.name || booking.interviewerName || 'Interviewer',
    feedback: booking.feedback
  });
  appendBookingEvent(booking, 'resume_rating_submitted', {
    actor: req.session.user.name || 'Interviewer',
    actorRole: 'interviewer',
    resumeScore: booking.feedback.resumeScore,
    resumeComments: comments || ''
  });
  booking.status = 'completed';
  booking.updatedAt = new Date().toISOString();
  booking.hangingTagState = null;
  if (booking.studentJoinedAt && booking.sessionEndedAt && (!booking.qualityCheck || booking.qualityCheck.status !== 'pending')) {
    const durationMs = new Date(booking.sessionEndedAt).getTime() - new Date(booking.studentJoinedAt).getTime();
    const durationMinutes = Math.max(0, Math.round(durationMs / 60000));
    if (Number.isFinite(durationMinutes) && durationMinutes < 10) {
      const now = new Date();
      booking.qualityCheck = {
        status: 'pending',
        requestedAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        durationMinutes
      };
      booking.notifications = [
        ...(booking.notifications || []),
        createNotification({
          booking,
          recipientId: booking.studentId,
          recipientRole: 'student',
          type: 'quick_interview_check',
          title: 'Interview Ended Very Quickly',
          message: 'Did your interview actually happen?'
        })
      ];
    }
  }

  await booking.save();
  res.json({ message: 'Feedback submitted', booking: booking.toObject() });
});

router.post('/:id/student-feedback', requireAuth, async (req, res) => {
  if (req.session.user.role !== 'student') {
    return res.status(403).json({ error: 'Only students can submit this feedback.' });
  }

  const { rating, comments } = req.body;
  const numericRating = Number(rating);
  if (!numericRating || numericRating < 1 || numericRating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
  }

  await enforceExpiry();
  const booking = await Booking.findOne({ id: req.params.id });
  if (!booking) return res.status(404).json({ error: 'Booking not found' });

  if (booking.studentId !== req.session.user.id) {
    return res.status(403).json({ error: 'Unauthorized for this booking.' });
  }

  booking.studentFeedback = {
    rating: numericRating,
    comments: comments || '',
    submittedAt: new Date().toISOString()
  };
  booking.updatedAt = new Date().toISOString();
  booking.notifications = [
    ...(booking.notifications || []),
    {
      id: `notif-${Date.now()}-${booking.id}`,
      recipientId: booking.interviewerId,
      recipientRole: 'interviewer',
      type: 'student_feedback_submitted',
      title: 'Student Feedback Received',
      message: `${booking.studentName || 'Student'} submitted interview feedback.`,
      bookingId: booking.id,
      createdAt: new Date().toISOString(),
      read: false
    }
  ];

  await booking.save();
  res.json({ message: 'Student feedback submitted', booking: booking.toObject() });
});

router.post('/:id/feedback-viewed', requireAuth, async (req, res) => {
  if (req.session.user.role !== 'student') {
    return res.status(403).json({ error: 'Only students can mark feedback as viewed.' });
  }

  const booking = await Booking.findOne({ id: req.params.id });
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  if (booking.studentId !== req.session.user.id) return res.status(403).json({ error: 'Unauthorized for this booking.' });
  if (!booking.feedback?.submittedAt) return res.status(409).json({ error: 'Feedback is not available yet.' });

  if (!booking.feedbackViewedAt) {
    booking.feedbackViewedAt = new Date().toISOString();
    appendBookingEvent(booking, 'student_viewed_feedback', {
      actor: req.session.user.name || booking.studentName || 'Student',
      actorRole: 'student'
    });
    appendBookingEvent(booking, 'feedback_completed', {
      actor: 'System',
      actorRole: 'system'
    });
    booking.updatedAt = new Date().toISOString();
    await booking.save();
  }

  res.json({ message: 'Feedback view recorded', booking: booking.toObject() });
});

router.post('/:id/refund-proof', requireAuth, (req, res) => {
  if (!['interviewer', 'admin'].includes(req.session.user.role)) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  refundProofUpload.single('refundScreenshot')(req, res, async (uploadError) => {
    if (uploadError) {
      return res.status(400).json({ error: uploadError.message });
    }
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Refund screenshot is required.' });
      }
      const refundUtr = String(req.body.utr || req.body.refundUtr || '').trim();
      if (!/^[A-Za-z0-9-]{8,30}$/.test(refundUtr)) {
        return res.status(400).json({ error: 'UTR number must be 8 to 30 characters and contain only letters, numbers, or hyphen.' });
      }

      const booking = await Booking.findOne({ id: req.params.id });
      if (!booking) return res.status(404).json({ error: 'Booking not found' });
      if (req.session.user.role === 'interviewer' && booking.interviewerId !== req.session.user.id) {
        return res.status(403).json({ error: 'Unauthorized for this booking.' });
      }
      if (booking.refundProof?.filePath || booking.refundSubmittedAt || booking.refundStatus === 'proof_submitted') {
        return res.status(409).json({ error: 'Refund proof has already been submitted for this refund case.' });
      }
      if (booking.refundStatus !== 'required') {
        return res.status(409).json({ error: 'Refund proof can be uploaded only for unresolved refund cases.' });
      }

      const filePath = await uploadRefundProofAsset(req.file);
      const nowDate = new Date();
      const now = nowDate.toISOString();
      const ist = getIstParts(nowDate);
      booking.refundProof = {
        fileName: req.file.originalname,
        filePath,
        mimeType: req.file.mimetype,
        uploadedAt: now
      };
      booking.refundUtr = refundUtr;
      booking.refundSubmittedAt = now;
      booking.refundSubmittedDate = ist.date;
      booking.refundSubmittedTime = ist.time;
      booking.refundAmount = Number(booking.refundAmount || booking.refundSnapshot?.paymentAmount || booking.paymentAmount || DEFAULT_SESSION_FEE);
      booking.refundCurrency = booking.refundCurrency || booking.paymentCurrency || 'INR';
      booking.refundSubmission = {
        bookingId: booking.bookingId || booking.id,
        studentId: booking.studentId,
        studentName: booking.refundSnapshot?.studentName || booking.studentName,
        interviewerId: booking.interviewerId,
        interviewerName: booking.interviewerName,
        refundAmount: booking.refundAmount,
        refundCurrency: booking.refundCurrency,
        utr: refundUtr,
        screenshot: booking.refundProof,
        submittedAt: now,
        submittedDate: ist.date,
        submittedTime: ist.time,
        timezone: TIMEZONE
      };
      booking.refundStatus = 'proof_submitted';
      booking.status = 'refund_proof_submitted';
      booking.hangingTagState = null;
      appendRefundEvent(booking, 'refund_submitted', {
        refundAmount: booking.refundAmount,
        refundCurrency: booking.refundCurrency,
        utr: refundUtr
      });
      appendRefundEvent(booking, 'refund_screenshot_uploaded', {
        screenshotFile: booking.refundProof,
        screenshotUploader: req.session.user.name || req.session.user.email || 'Interviewer'
      });
      appendRefundEvent(booking, 'refund_utr_submitted', {
        utr: refundUtr,
        validationStatus: 'valid'
      });
      appendRefundEvent(booking, 'refund_sent', {
        refundSubmittedBy: req.session.user.name || req.session.user.email || 'Interviewer'
      });
      appendRefundEvent(booking, 'student_confirmation_requested');
      booking.updatedAt = now;
      booking.notifications = [
        ...(booking.notifications || []),
        createNotification({
          booking,
          recipientId: booking.studentId,
          recipientRole: 'student',
          type: 'refund_submitted',
          title: 'Refund Submitted',
          message: 'Did you receive the refund?'
        })
      ];
      await booking.save();

      return res.json({ message: 'Refund proof submitted', booking: booking.toObject() });
    } catch (error) {
      console.error('Refund proof upload failed:', error?.message || error);
      return res.status(500).json({ error: 'Failed to submit refund proof.' });
    }
  });
});

router.post('/:id/refund-confirmation', requireAuth, async (req, res) => {
  if (req.session.user.role !== 'student') {
    return res.status(403).json({ error: 'Only students can confirm refunds.' });
  }

  const booking = await Booking.findOne({ id: req.params.id });
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  if (booking.studentId !== req.session.user.id) return res.status(403).json({ error: 'Unauthorized for this booking.' });
  if (booking.refundStatus !== 'proof_submitted') {
    return res.status(409).json({ error: 'Refund proof has not been submitted yet.' });
  }

  const received = Boolean(req.body.received);
  const now = new Date();
  const nowIso = now.toISOString();
  booking.notifications = (booking.notifications || []).map(n => (
    n.recipientRole === 'student' && n.type === 'refund_submitted'
      ? { ...n, read: true, acknowledgedAt: nowIso }
      : n
  ));

  if (received) {
    booking.refundStatus = 'completed';
    booking.status = 'refund_completed';
    booking.hangingTagState = null;
    booking.refundCompletedAt = nowIso;
    booking.refundConfirmedAt = nowIso;
    appendRefundEvent(booking, 'refund_confirmed');
    appendRefundEvent(booking, 'refund_completed', {
      confirmedByStudent: booking.studentName || req.session.user.name || 'Student'
    });
    appendRefundEvent(booking, 'refund_resolved');
    booking.updatedAt = nowIso;
    booking.notifications.push(createNotification({
      booking,
      recipientId: booking.interviewerId,
      recipientRole: 'interviewer',
      type: 'refund_completed',
      title: 'Refund Confirmed',
      message: 'The student confirmed receiving the refund.'
    }));
    await booking.save();
    return res.json({ message: 'Refund completed', booking: booking.toObject() });
  }

  const ist = getIstParts(now);
  const issue = await IssueDispute.create({
    id: `issue-${Date.now()}-${booking.id}`,
    type: 'refund_dispute',
    status: 'open',
    bookingId: booking.id,
    displayBookingId: booking.bookingId || '',
    studentId: booking.studentId,
    studentName: booking.studentName,
    interviewerId: booking.interviewerId,
    interviewerName: booking.interviewerName,
    refundProof: booking.refundProof || null,
    refundAmount: booking.refundAmount || booking.refundSnapshot?.paymentAmount || booking.paymentAmount || DEFAULT_SESSION_FEE,
    refundUtr: booking.refundUtr || '',
    refundRequestedAt: booking.refundRequestedAt || '',
    disputeAt: nowIso,
    studentComment: String(req.body.comment || '').trim().slice(0, 500),
    history: [{ status: 'open', at: nowIso, note: 'Student reported refund not received.' }],
    createdAt: nowIso,
    updatedAt: nowIso
  });
  booking.refundStatus = 'disputed';
  booking.status = 'refund_disputed';
  booking.hangingTagState = null;
  booking.refundDisputedAt = nowIso;
  booking.refundDisputeId = issue.id;
  appendRefundEvent(booking, 'refund_disputed', { issueId: issue.id });
  booking.updatedAt = nowIso;
  await booking.save();

  return res.json({ message: 'Refund dispute created', booking: booking.toObject(), issue: issue.toObject() });
});

router.post('/:id/quality-check-response', requireAuth, async (req, res) => {
  if (req.session.user.role !== 'student') {
    return res.status(403).json({ error: 'Only students can respond to quality checks.' });
  }

  await expireQualityChecks({ id: req.params.id });
  const booking = await Booking.findOne({ id: req.params.id });
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  if (booking.studentId !== req.session.user.id) return res.status(403).json({ error: 'Unauthorized for this booking.' });
  if (booking.qualityCheck?.status !== 'pending') {
    return res.status(409).json({ error: 'This quality check is not active.' });
  }

  const happened = Boolean(req.body.happened);
  const now = new Date();
  const nowIso = now.toISOString();
  booking.notifications = (booking.notifications || []).map(n => (
    n.recipientRole === 'student' && n.type === 'quick_interview_check'
      ? { ...n, read: true, acknowledgedAt: nowIso }
      : n
  ));

  if (happened) {
    booking.qualityCheck = { ...(booking.qualityCheck || {}), status: 'confirmed', respondedAt: nowIso };
    booking.updatedAt = nowIso;
    await booking.save();
    return res.json({ message: 'Quality check confirmed', booking: booking.toObject() });
  }

  const ist = getIstParts(now);
  const issue = await IssueDispute.create({
    id: `issue-${Date.now()}-${booking.id}`,
    type: 'interview_issue',
    status: 'open',
    bookingId: booking.id,
    displayBookingId: booking.bookingId || '',
    studentId: booking.studentId,
    studentName: booking.studentName,
    interviewerId: booking.interviewerId,
    interviewerName: booking.interviewerName,
    interviewDurationMinutes: booking.qualityCheck?.durationMinutes ?? null,
    issueDate: ist.date,
    issueTime: ist.time,
    studentComment: String(req.body.comment || '').trim().slice(0, 500),
    history: [{ status: 'open', at: nowIso, note: 'Student reported quick interview issue.' }],
    createdAt: nowIso,
    updatedAt: nowIso
  });
  booking.qualityCheck = { ...(booking.qualityCheck || {}), status: 'issue_reported', respondedAt: nowIso, issueId: issue.id };
  booking.updatedAt = nowIso;
  await booking.save();

  return res.json({ message: 'Interview issue created', booking: booking.toObject(), issue: issue.toObject() });
});

router.post('/resumes', requireAuth, (req, res) => {
  if (req.session.user.role !== 'student') {
    return res.status(403).json({ error: 'Only students can upload resumes.' });
  }

  uploadResume.single('resume')(req, res, async (uploadError) => {
    if (uploadError) {
      return res.status(400).json({ error: uploadError.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Resume file is required.' });
    }

    const user = await User.findOne({ id: req.session.user.id });
    if (!user) return res.status(404).json({ error: 'Student not found.' });

    const filePath = await uploadResumeAsset(req.file);
    const resumeRecord = {
      id: `resume-${Date.now()}`,
      fileName: req.file.originalname,
      filePath,
      mimeType: req.file.mimetype,
      size: req.file.size,
      uploadedAt: new Date().toISOString(),
      ratings: []
    };

    user.resumes = user.resumes || [];
    user.resumes.push(resumeRecord);
    await user.save();

    res.status(201).json({ message: 'Resume uploaded', resume: resumeRecord });
  });
});

router.get('/resumes/me', requireAuth, async (req, res) => {
  if (req.session.user.role !== 'student') {
    return res.status(403).json({ error: 'Only students can view own resumes here.' });
  }

  const student = await User.findOne({ id: req.session.user.id }).lean();
  res.json({ resumes: student?.resumes || [] });
});

router.get('/students/:studentId/resumes', requireAuth, async (req, res) => {
  if (!['interviewer', 'admin'].includes(req.session.user.role)) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const student = await User.findOne({ id: req.params.studentId, role: 'student' }).lean();
  if (!student) return res.status(404).json({ error: 'Student not found' });

  res.json({
    student: { id: student.id, name: student.name, email: student.email },
    resumes: student.resumes || []
  });
});

router.post('/students/:studentId/resumes/:resumeId/rate', requireAuth, async (req, res) => {
  if (req.session.user.role !== 'interviewer') {
    return res.status(403).json({ error: 'Only interviewers can rate resumes.' });
  }

  const { rating, feedback } = req.body;
  const numericRating = Number(rating);
  if (!numericRating || numericRating < 1 || numericRating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
  }

  const student = await User.findOne({ id: req.params.studentId, role: 'student' });
  if (!student) return res.status(404).json({ error: 'Student not found.' });

  const resumes = student.resumes || [];
  const resumeIndex = resumes.findIndex(r => r.id === req.params.resumeId);
  if (resumeIndex === -1) return res.status(404).json({ error: 'Resume not found.' });

  const ratingRecord = {
    id: `rating-${Date.now()}`,
    rating: numericRating,
    feedback: feedback || '',
    ratedById: req.session.user.id,
    ratedByName: req.session.user.name,
    ratedAt: new Date().toISOString()
  };

  resumes[resumeIndex].ratings = resumes[resumeIndex].ratings || [];
  resumes[resumeIndex].ratings.push(ratingRecord);
  student.resumes = resumes;
  await student.save();

  res.json({ message: 'Resume rating saved', rating: ratingRecord, resume: resumes[resumeIndex] });
});

module.exports = router;

