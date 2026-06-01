import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, UserRound, X } from 'lucide-react';
import api, { getApiErrorMessage } from '../lib/apiClient';
import InterviewRequestCard from '../components/InterviewRequestCard';
import NotificationItem from '../components/NotificationItem';
import ResumeUploadPanel from '../components/ResumeUploadPanel';
import StarRating from '../components/StarRating';
import SlotSelector from '../components/SlotSelector';
import { resolveMediaUrl } from '../lib/mediaUrl';
import AchievementBadge from '../components/AchievementBadge';
import { calculateInterviewAchievement } from '../lib/interviewAchievement';
import UpcomingInterviewCountdown from '../components/UpcomingInterviewCountdown';
import MeetingDetailsModal from '../components/MeetingDetailsModal';
import MobileNotificationBell from '../components/MobileNotificationBell';
import MobileRecentNotifications from '../components/MobileRecentNotifications';
import { getBookingDisplayId } from '../lib/interviewLifecycle';

let lastStudentDashboardFetchAt = 0;

export default function DashboardStudent() {
  const [bookings, setBookings] = useState([]);
  const [interviewers, setInterviewers] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');

  const [reassignBookingId, setReassignBookingId] = useState(null);
  const [newInterviewerId, setNewInterviewerId] = useState('');
  const [newSlots, setNewSlots] = useState([{ date: '', time: '' }]);
  const [reassignError, setReassignError] = useState('');
  const [reassignLoading, setReassignLoading] = useState(false);

  const [cancelConfirmBookingId, setCancelConfirmBookingId] = useState(null);
  const [feedbackBookingId, setFeedbackBookingId] = useState(null);
  const [studentFeedbackForm, setStudentFeedbackForm] = useState({ rating: '', comments: '' });
  const [studentFeedbackError, setStudentFeedbackError] = useState('');
  const [studentFeedbackLoading, setStudentFeedbackLoading] = useState(false);
  const [acceptedPopup, setAcceptedPopup] = useState(null);
  const [paymentFiles, setPaymentFiles] = useState({});
  const [paymentUtrs, setPaymentUtrs] = useState({});
  const [paymentUploading, setPaymentUploading] = useState({});
  const [paymentMessages, setPaymentMessages] = useState({});
  const [expandedFeedbackCards, setExpandedFeedbackCards] = useState({});
  const [selectedRescheduleSlots, setSelectedRescheduleSlots] = useState({});
  const [rescheduleMessages, setRescheduleMessages] = useState({});
  const [interviewerPreview, setInterviewerPreview] = useState(null);
  const [studentLifecyclePopup, setStudentLifecyclePopup] = useState(null);
  const [studentLifecycleComment, setStudentLifecycleComment] = useState('');
  const [meetingDetailsBooking, setMeetingDetailsBooking] = useState(null);

  useEffect(() => {
    const now = Date.now();
    if (now - lastStudentDashboardFetchAt < 800) return;
    lastStudentDashboardFetchAt = now;
    fetchData();
  }, []);

  useEffect(() => {
    const interval = window.setInterval(fetchData, 15000);
    return () => window.clearInterval(interval);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setPageError('');

    const [bookingsResult, interviewersResult, resumesResult] = await Promise.allSettled([
      api.get('/api/bookings/my-bookings'),
      api.get('/api/auth/interviewers'),
      api.get('/api/bookings/resumes/me')
    ]);

    if (bookingsResult.status === 'fulfilled') {
      setBookings(bookingsResult.value?.data?.bookings || []);
    } else {
      setBookings([]);
      setPageError(prev => prev || getApiErrorMessage(bookingsResult.reason, 'Could not load bookings.'));
    }

    if (interviewersResult.status === 'fulfilled') {
      setInterviewers(interviewersResult.value?.data?.interviewers || []);
    } else {
      setInterviewers([]);
    }

    if (resumesResult.status === 'fulfilled') {
      setResumes(resumesResult.value?.data?.resumes || []);
    } else {
      setResumes([]);
    }

    setLoading(false);
  };

  const feedbackBookings = bookings.filter(b => b.feedback);
  const notifications = bookings.flatMap(b => (b.notifications || []).filter(n => n.recipientRole === 'student'));
  const getPaymentStatusLabel = (status) => {
    if (status === 'not_uploaded') return 'Payment Pending';
    if (status === 'screenshot_uploaded') return 'Screenshot Uploaded';
    if (status === 'verified') return 'Payment Verified';
    if (status === 'rejected') return 'Payment Rejected';
    if (status === 'pending_verification') return 'Screenshot Uploaded';
    return 'Payment Pending';
  };
  const getPaymentStatusClass = (status) => {
    if (status === 'verified') return 'text-emerald-700 dark:text-emerald-400';
    if (status === 'rejected') return 'text-rose-700 dark:text-rose-400';
    if (status === 'pending_verification' || status === 'screenshot_uploaded') return 'text-amber-700 dark:text-amber-400';
    return 'text-slate-600 dark:text-slate-400';
  };

  const getBookingLifecycleStatus = (booking) => {
    if (booking.status === 'pending') return 'Pending Interviewer Response';
    if (booking.status === 'accepted') return booking.paymentStatus === 'verified' ? 'Payment Verified' : 'Request Accepted - Awaiting Payment';
    if (booking.status === 'reschedule_requested') return 'New Slot Requested';
    if (booking.status === 'reschedule_slot_selected') return 'New Slot Selected - Awaiting Confirmation';
    if (booking.status === 'confirmed') return 'Booking Confirmed';
    if (booking.status === 'meeting_link_uploaded') return 'Meeting Link Sent';
    if (booking.status === 'completed') return 'Interview Completed';
    if (booking.status === 'refund_requested') return 'Refund Requested';
    if (booking.status === 'refund_required') return 'Refund Required';
    if (booking.status === 'refund_proof_submitted') return 'Refund Submitted';
    if (booking.status === 'refund_disputed') return 'Refund Disputed';
    if (booking.status === 'refund_completed') return 'Refund Completed';
    return (booking.status || '').replace(/_/g, ' ');
  };

  useEffect(() => {
    const acceptedNotifications = notifications.filter(n => n.type === 'booking_accepted');
    if (acceptedNotifications.length === 0) return;

    const latest = [...acceptedNotifications].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
    const seenKey = 'ieh_seen_booking_accepted_notifications';
    const seenRaw = window.sessionStorage.getItem(seenKey);
    const seen = seenRaw ? JSON.parse(seenRaw) : [];
    if (seen.includes(latest.id)) return;

    setAcceptedPopup(latest);
    window.sessionStorage.setItem(seenKey, JSON.stringify([...seen, latest.id]));
  }, [notifications]);

  useEffect(() => {
    if (!interviewerPreview) return;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setInterviewerPreview(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [interviewerPreview]);

  useEffect(() => {
    const refundNotifications = notifications.filter(n => n.type === 'refund_completed');
    if (refundNotifications.length === 0) return;
    const latest = [...refundNotifications].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
    const seenKey = 'ieh_seen_refund_completed_notifications';
    const seenRaw = window.sessionStorage.getItem(seenKey);
    const seen = seenRaw ? JSON.parse(seenRaw) : [];
    if (seen.includes(latest.id)) return;
    window.sessionStorage.setItem(seenKey, JSON.stringify([...seen, latest.id]));
    alert('We’re sorry for the inconvenience.\n\nYour refund has been completed successfully.\nFeel free to book another interview session anytime.');
  }, [notifications]);

  useEffect(() => {
    const actionable = notifications
      .filter(n => !n.read && ['meeting_link_uploaded', 'interview_reminder', 'refund_submitted', 'quick_interview_check'].includes(n.type))
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0];
    if (!actionable) {
      setStudentLifecyclePopup(null);
      setStudentLifecycleComment('');
      return;
    }
    const booking = bookings.find(b => b.id === actionable.bookingId);
    setStudentLifecyclePopup({ notification: actionable, booking });
    setStudentLifecycleComment('');
  }, [notifications, bookings]);

  const reassignableBookings = bookings.filter(b =>
    ['cancelled_by_interviewer', 'no_response'].includes(b.status) && b.paymentStatus === 'verified'
  );
  const confirmedMeetingBookings = bookings.filter(b =>
    ['confirmed', 'accepted', 'meeting_link_uploaded', 'completed'].includes(b.status)
  );

  const cancellableStatuses = ['pending', 'pending_payment', 'pending_verification', 'accepted', 'confirmed', 'meeting_link_uploaded', 'reschedule_slot_selected'];

  const handleCancelBooking = async (bookingId) => {
    try {
      await api.put(`/api/bookings/${bookingId}/status`, { status: 'cancelled' });
      setCancelConfirmBookingId(null);
      fetchData();
    } catch (err) {
      alert(getApiErrorMessage(err, 'Cancellation failed.'));
    }
  };

  const handleReassign = async (bookingId) => {
    if (!newInterviewerId) return setReassignError('Please select an interviewer.');
    if (newSlots.some(s => !s.date || !s.time)) return setReassignError('All slots must have date and time.');
    setReassignError('');
    setReassignLoading(true);
    try {
      await api.post(`/api/bookings/${bookingId}/reassign`, { newInterviewerId, newSlots });
      setReassignBookingId(null);
      setNewInterviewerId('');
      setNewSlots([{ date: '', time: '' }]);
      fetchData();
    } catch (err) {
      setReassignError(getApiErrorMessage(err, 'Reassignment failed.'));
    }
    setReassignLoading(false);
  };

  const openReassign = (bookingId) => {
    setReassignBookingId(bookingId);
    setNewInterviewerId('');
    setNewSlots([{ date: '', time: '' }]);
    setReassignError('');
  };

  const openFeedbackPopup = (bookingId) => {
    setFeedbackBookingId(bookingId);
    setStudentFeedbackForm({ rating: '', comments: '' });
    setStudentFeedbackError('');
  };

  const closeFeedbackPopup = () => {
    setFeedbackBookingId(null);
    setStudentFeedbackForm({ rating: '', comments: '' });
    setStudentFeedbackError('');
  };

  const submitStudentFeedback = async (e) => {
    e.preventDefault();
    if (!feedbackBookingId) return;
    if (!studentFeedbackForm.rating) {
      setStudentFeedbackError('Please provide a rating.');
      return;
    }
    setStudentFeedbackError('');
    setStudentFeedbackLoading(true);
    try {
      await api.post(`/api/bookings/${feedbackBookingId}/student-feedback`, studentFeedbackForm);
      closeFeedbackPopup();
      fetchData();
    } catch (err) {
      setStudentFeedbackError(getApiErrorMessage(err, 'Failed to submit feedback.'));
    } finally {
      setStudentFeedbackLoading(false);
    }
  };

  const uploadPaymentScreenshot = async (bookingId) => {
    const file = paymentFiles[bookingId];
    const utr = String(paymentUtrs[bookingId] || '').trim();
    if (!file) return;
    if (!/^[A-Za-z0-9-]{8,30}$/.test(utr)) {
      setPaymentMessages(prev => ({ ...prev, [bookingId]: 'UTR number must be 8 to 30 characters and contain only letters, numbers, or hyphen.' }));
      return;
    }
    try {
      setPaymentUploading(prev => ({ ...prev, [bookingId]: true }));
      setPaymentMessages(prev => ({ ...prev, [bookingId]: '' }));
      const data = new FormData();
      data.append('paymentScreenshot', file);
      data.append('utr', utr);
      await api.post(`/api/bookings/${bookingId}/payment-screenshot`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
      setPaymentMessages(prev => ({ ...prev, [bookingId]: 'Screenshot uploaded successfully.' }));
      setPaymentFiles(prev => ({ ...prev, [bookingId]: null }));
      setPaymentUtrs(prev => ({ ...prev, [bookingId]: '' }));
      await fetchData();
    } catch (err) {
      setPaymentMessages(prev => ({ ...prev, [bookingId]: getApiErrorMessage(err, 'Failed to upload payment screenshot.') }));
    } finally {
      setPaymentUploading(prev => ({ ...prev, [bookingId]: false }));
    }
  };

  const confirmRescheduleSlot = async (bookingId) => {
    const selectedSlot = selectedRescheduleSlots[bookingId];
    if (!selectedSlot) return;
    try {
      setRescheduleMessages(prev => ({ ...prev, [bookingId]: '' }));
      await api.put(`/api/bookings/${bookingId}/reschedule-selection`, { selectedSlot });
      setSelectedRescheduleSlots(prev => ({ ...prev, [bookingId]: null }));
      await fetchData();
    } catch (err) {
      setRescheduleMessages(prev => ({ ...prev, [bookingId]: getApiErrorMessage(err, 'Could not confirm new slot.') }));
    }
  };

  const toggleFeedbackCard = (bookingId) => {
    setExpandedFeedbackCards(prev => ({ ...prev, [bookingId]: !prev[bookingId] }));
    const booking = bookings.find(item => item.id === bookingId);
    if (booking?.feedback && !booking.feedbackViewedAt && !expandedFeedbackCards[bookingId]) {
      api.post(`/api/bookings/${bookingId}/feedback-viewed`)
        .then(fetchData)
        .catch(() => {});
    }
  };

  const getInterviewerName = (booking) => booking.interviewerName || interviewers.find(i => i.id === booking.interviewerId)?.name || 'Interviewer';
  const getAcceptedInterviewerProfile = (interviewerId) => {
    const acceptedStatuses = ['accepted', 'confirmed', 'meeting_link_uploaded', 'session_ended', 'completed'];
    return bookings.find(b => b.interviewerId === interviewerId && acceptedStatuses.includes(b.status))?.interviewerProfile;
  };

  const openInterviewerPreview = (interviewer) => {
    const acceptedProfile = getAcceptedInterviewerProfile(interviewer.id);
    setInterviewerPreview({ ...interviewer, ...(acceptedProfile || {}), phone: acceptedProfile?.phone || '' });
  };

  const acknowledgeNotification = async (bookingId, notificationId) => {
    try {
      await api.put(`/api/bookings/${bookingId}/notifications/${notificationId}/ack`);
      await fetchData();
    } catch (err) {
      console.error(getApiErrorMessage(err, 'Could not acknowledge notification.'));
    }
  };

  const joinInterview = async (booking) => {
    if (!booking?.meetingLink) return;
    try {
      await api.post(`/api/bookings/${booking.id}/student-joined`);
      window.open(booking.meetingLink, '_blank', 'noopener,noreferrer');
      await fetchData();
    } catch (err) {
      alert(getApiErrorMessage(err, 'Could not open meeting.'));
    }
  };

  const copyMeetingLink = async (link) => {
    if (!link) return;
    await navigator.clipboard?.writeText(link);
  };

  const respondToRefund = async (received) => {
    if (!studentLifecyclePopup?.booking) return;
    try {
      await api.post(`/api/bookings/${studentLifecyclePopup.booking.id}/refund-confirmation`, {
        received,
        comment: studentLifecycleComment
      });
      setStudentLifecyclePopup(null);
      setStudentLifecycleComment('');
      await fetchData();
    } catch (err) {
      alert(getApiErrorMessage(err, 'Could not submit refund response.'));
    }
  };

  const respondToQualityCheck = async (happened) => {
    if (!studentLifecyclePopup?.booking) return;
    try {
      await api.post(`/api/bookings/${studentLifecyclePopup.booking.id}/quality-check-response`, {
        happened,
        comment: studentLifecycleComment
      });
      setStudentLifecyclePopup(null);
      setStudentLifecycleComment('');
      await fetchData();
    } catch (err) {
      alert(getApiErrorMessage(err, 'Could not submit interview issue response.'));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <MobileNotificationBell notifications={notifications} />

      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Student Dashboard</h1>
        <Link to="/practice" className="bg-emerald-600 text-white px-4 py-2 rounded-xl">AI Practice Module</Link>
      </div>

      {loading && <div className="liquid-glass-panel p-4 text-sm text-slate-600 dark:text-slate-400">Loading dashboard data...</div>}
      {pageError && <div className="liquid-glass-panel p-4 text-sm text-rose-700 dark:text-rose-400">{pageError}</div>}

      <UpcomingInterviewCountdown bookings={bookings} role="student" onJoin={joinInterview} />

      {confirmedMeetingBookings.length > 0 && (
        <div className="liquid-glass-panel p-5">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4">Interview Meeting Link</h2>
          <div className="space-y-3">
            {confirmedMeetingBookings.map(b => {
              const interviewerName = b.interviewerName || interviewers.find(i => i.id === b.interviewerId)?.name || 'Interviewer';
              const slotLabel = b.selectedSlot?.label || `${b.date} ${b.slot}`;
              return (
                <div key={`meeting-${b.id}`} className="bg-white/60 dark:bg-slate-800/60 rounded-xl p-4 border border-white/60 dark:border-slate-600/50">
                  <p className="font-medium text-slate-800 dark:text-slate-200">{interviewerName}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{slotLabel}</p>
                  {b.meetingLink ? (
                    <div className="mt-2">
                      <p className="text-sm text-emerald-700 dark:text-emerald-400">Google Meet Link Uploaded</p>
                      <p className="text-xs font-semibold text-sky-700 dark:text-sky-300 mt-1">Booking ID: {getBookingDisplayId(b)}</p>
                      <button
                        type="button"
                        onClick={() => joinInterview(b)}
                        disabled={b.status === 'completed'}
                        className={`inline-flex items-center mt-2 px-4 py-2 rounded-xl text-sm ${b.status === 'completed' ? 'bg-slate-400 text-white opacity-60' : 'bg-sky-600 text-white'}`}
                      >
                        Join Meeting
                      </button>
                      <button
                        onClick={() => setMeetingDetailsBooking(b)}
                        className="inline-flex items-center mt-2 ml-2 bg-white/80 dark:bg-slate-700/80 px-4 py-2 rounded-xl text-sm"
                      >
                        View Meeting Details
                      </button>
                      {b.status === 'completed' && !b.studentFeedback && (
                        <button
                          onClick={() => openFeedbackPopup(b.id)}
                          className="inline-flex items-center mt-2 ml-2 bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm"
                        >
                          Interview Successful
                        </button>
                      )}
                      {b.studentFeedback && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">Feedback submitted. Thank you.</p>
                      )}
                      {b.status === 'session_ended' && !b.feedback && (
                        <p className="mt-2 rounded-xl border border-sky-100 bg-sky-50/70 px-3 py-2 text-sm text-sky-800 dark:border-sky-800/50 dark:bg-sky-900/20 dark:text-sky-300">
                          Interview completed. Your interviewer will upload feedback shortly. You will be notified once feedback becomes available.
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-700 dark:text-slate-300 mt-2">Waiting for interviewer to upload Google Meet link.</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {feedbackBookingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:px-4">
          <div className="absolute inset-0 bg-black/40" onClick={closeFeedbackPopup} />
          <div className="relative max-h-[calc(100dvh-1.5rem)] w-full max-w-md overflow-y-auto liquid-glass-panel p-4 sm:p-5">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Interview Feedback</h3>
            <form onSubmit={submitStudentFeedback} className="mt-3 space-y-3">
              <div>
                <label className="text-sm text-slate-700 dark:text-slate-300">Rating (1-5)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={studentFeedbackForm.rating}
                  onChange={(e) => setStudentFeedbackForm(prev => ({ ...prev, rating: e.target.value }))}
                  className="glass-input text-sm mt-1"
                  required
                />
              </div>
              <div>
                <label className="text-sm text-slate-700 dark:text-slate-300">Comments</label>
                <textarea
                  rows="3"
                  value={studentFeedbackForm.comments}
                  onChange={(e) => setStudentFeedbackForm(prev => ({ ...prev, comments: e.target.value }))}
                  className="glass-input text-sm mt-1"
                  placeholder="Share your interview experience"
                />
              </div>
              {studentFeedbackError && <p className="text-sm text-rose-700 dark:text-rose-400">{studentFeedbackError}</p>}
              <div className="flex flex-wrap gap-2">
                <button type="submit" disabled={studentFeedbackLoading} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm disabled:opacity-60">
                  {studentFeedbackLoading ? 'Submitting...' : 'Submit Feedback'}
                </button>
                <button type="button" onClick={closeFeedbackPopup} className="bg-white/80 dark:bg-slate-700/80 px-4 py-2 rounded-xl text-sm">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {acceptedPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setAcceptedPopup(null)} />
          <div className="relative max-h-[calc(100dvh-1.5rem)] w-full max-w-md overflow-y-auto liquid-glass-panel p-4 sm:p-5">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Booking Accepted</h3>
            <p className="text-sm text-slate-700 dark:text-slate-300 mt-2">Your interview booking has been accepted.</p>
            <button
              onClick={() => setAcceptedPopup(null)}
              className="mt-4 px-4 py-2 rounded-xl bg-sky-600 text-white text-sm"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Reassignment Section */}
      {reassignableBookings.length > 0 && (
        <div className="liquid-glass-panel p-5 border border-amber-300 dark:border-amber-600/50 bg-amber-50/40 dark:bg-amber-900/10">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-1 flex items-center gap-2">
            Reassign Alternative Interviewer
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Your previous interviewer cancelled or did not respond within 6 hours. Choose another interviewer — your payment remains valid.</p>
          <div className="space-y-3">
            {reassignableBookings.map(b => (
              <div key={b.id} className="bg-white/60 dark:bg-slate-800/60 rounded-xl p-3 border border-white/60 dark:border-slate-600/50">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{b.domain} with {b.interviewerName} — {b.date}</p>
                <p className="text-xs text-rose-600 dark:text-rose-400 mb-2">Status: {b.status.replace('_', ' ')}</p>
                {reassignBookingId !== b.id ? (
                  <button onClick={() => openReassign(b.id)} className="text-sm bg-violet-600 text-white px-3 py-1.5 rounded-lg">Reassign Interviewer</button>
                ) : (
                  <div className="mt-3 space-y-3">
                    <select value={newInterviewerId} onChange={e => setNewInterviewerId(e.target.value)} className="glass-input text-sm">
                      <option value="">Select new interviewer...</option>
                      {interviewers.filter(i => i.id !== b.interviewerId).map(i => (
                        <option key={i.id} value={i.id}>{i.name} — {i.company || 'Independent'}</option>
                      ))}
                    </select>
                    <SlotSelector selectedSlots={newSlots} onChange={slots => setNewSlots(slots)} />
                    {reassignError && <p className="text-xs text-rose-600 dark:text-rose-400">{reassignError}</p>}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReassign(b.id)}
                        disabled={reassignLoading}
                        className="text-sm bg-violet-600 text-white px-4 py-2 rounded-xl disabled:opacity-50"
                      >
                        {reassignLoading ? 'Reassigning...' : 'Confirm Reassignment'}
                      </button>
                      <button onClick={() => setReassignBookingId(null)} className="text-sm bg-white/80 dark:bg-slate-700/80 px-4 py-2 rounded-xl">Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Interview Requests & Status</h2>
          {bookings.map(b => (
            <div key={b.id}>
              <InterviewRequestCard booking={b}>
                <p className="text-sm text-slate-700 dark:text-slate-300">Preferred Slots: {(b.preferredSlots || []).map(s => `${s.date} ${s.time}`).join(', ') || `${b.date} ${b.slot}`}</p>
                <p className="text-sm mt-1 text-slate-700 dark:text-slate-300">Status: {getBookingLifecycleStatus(b)}</p>
                <p className={`text-sm mt-1 ${getPaymentStatusClass(b.paymentStatus)}`}>
                  Payment Status: {getPaymentStatusLabel(b.paymentStatus)}
                </p>
                {b.selectedSlot && <p className="text-sm text-emerald-700 dark:text-emerald-400 mt-1">Accepted Slot: {b.selectedSlot.date} {b.selectedSlot.time}</p>}
                {b.interviewerMessage && <p className="text-sm mt-2 bg-white/70 dark:bg-slate-700/50 rounded p-2 text-slate-700 dark:text-slate-300">Message: {b.interviewerMessage}</p>}

                {b.status === 'accepted' && (
                  <div className="mt-3 rounded-xl border border-white/60 dark:border-slate-600/50 bg-white/60 dark:bg-slate-700/60 p-3">
                    <h4 className="font-semibold text-slate-800 dark:text-slate-100">Payment Section</h4>
                    <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">Interview Session Fee: ₹50 per session</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Scan the QR code to complete payment.</p>
                    {interviewers.find(i => i.id === b.interviewerId)?.paymentQr?.filePath ? (
                      <img
                        src={resolveMediaUrl(interviewers.find(i => i.id === b.interviewerId)?.paymentQr?.filePath)}
                        alt="Interviewer payment QR"
                        className="mt-3 w-40 h-40 object-contain rounded-lg border border-white/60 dark:border-slate-600/50 bg-white p-2"
                      />
                    ) : (
                      <p className="text-sm text-amber-700 dark:text-amber-400 mt-2">Interviewer QR not available yet.</p>
                    )}
                    <div className="mt-3">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Upload Payment Screenshot</p>
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf"
                        onChange={(e) => setPaymentFiles(prev => ({ ...prev, [b.id]: e.target.files?.[0] || null }))}
                        className="block w-full text-sm mt-2"
                      />
                      <input
                        type="text"
                        value={paymentUtrs[b.id] || ''}
                        onChange={(e) => setPaymentUtrs(prev => ({ ...prev, [b.id]: e.target.value }))}
                        placeholder="Enter UTR number"
                        className="mt-2 w-full rounded-xl border border-white/60 bg-white/80 px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-sky-200 dark:border-slate-600/50 dark:bg-slate-800/70 dark:text-slate-100"
                      />
                      <button
                        onClick={() => uploadPaymentScreenshot(b.id)}
                        disabled={!paymentFiles[b.id] || !paymentUtrs[b.id] || paymentUploading[b.id]}
                        className="mt-2 text-sm bg-sky-600 text-white px-4 py-2 rounded-xl disabled:opacity-60"
                      >
                        {paymentUploading[b.id] ? 'Uploading...' : 'Submit Payment Screenshot'}
                      </button>
                      {paymentMessages[b.id] && <p className="text-xs text-slate-700 dark:text-slate-300 mt-2">{paymentMessages[b.id]}</p>}
                    </div>
                  </div>
                )}

                {/* Cancel Button */}
                {cancellableStatuses.includes(b.status) && (
                  <div className="mt-3">
                    {cancelConfirmBookingId === b.id ? (
                      <div className="bg-rose-50 dark:bg-rose-900/20 rounded-xl p-4 border border-rose-200 dark:border-rose-800/50">
                        <p className="text-sm text-rose-800 dark:text-rose-300 font-medium mb-3">Amount will not be refunded. Are you sure you want to cancel this interview?</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleCancelBooking(b.id)}
                            className="text-sm bg-rose-600 text-white px-4 py-2 rounded-xl"
                          >
                            Yes Cancel
                          </button>
                          <button
                            onClick={() => setCancelConfirmBookingId(null)}
                            className="text-sm bg-white/80 dark:bg-slate-700/80 px-4 py-2 rounded-xl"
                          >
                            Go Back
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setCancelConfirmBookingId(b.id)}
                        className="text-sm bg-rose-600 text-white px-4 py-2 rounded-xl hover:bg-rose-700 transition"
                      >
                        Cancel Interview
                      </button>
                    )}
                  </div>
                )}
              </InterviewRequestCard>

              {b.status === 'reschedule_requested' && b.rescheduleProposal?.status === 'proposed' && (
                <div className="mt-5 rounded-2xl border border-violet-200/70 bg-violet-50/70 p-4 shadow-[0_14px_30px_rgba(124,58,237,0.12)] backdrop-blur-xl dark:border-violet-700/45 dark:bg-violet-900/20">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-semibold text-violet-900 dark:text-violet-100">Alternative Slots Available</p>
                    {b.rescheduleProposal.message && (
                      <p className="text-sm text-slate-700 dark:text-slate-300">{b.rescheduleProposal.message}</p>
                    )}
                    <p className="text-xs font-medium uppercase tracking-wide text-violet-600 dark:text-violet-300">
                      {new Date(`${b.rescheduleProposal.date}T00:00:00`).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                    </p>
                  </div>

                  <div className="mt-3 max-h-36 overflow-y-auto rounded-2xl border border-white/55 bg-white/35 p-2 dark:border-slate-600/40 dark:bg-slate-800/35">
                    <div className="flex flex-wrap gap-2">
                      {(b.rescheduleProposal.slots || []).map(slot => {
                        const selected = selectedRescheduleSlots[b.id]?.date === slot.date && selectedRescheduleSlots[b.id]?.time === slot.time;
                        return (
                          <button
                            key={`${b.id}-${slot.date}-${slot.time}`}
                            type="button"
                            onClick={() => setSelectedRescheduleSlots(prev => ({ ...prev, [b.id]: slot }))}
                            className={`rounded-2xl border px-4 py-2 text-sm transition-all ${selected ? 'border-violet-300/80 bg-white/85 text-violet-800 shadow-[0_8px_18px_rgba(124,58,237,0.12)] dark:border-violet-500/60 dark:bg-slate-700/80 dark:text-violet-200' : 'border-white/60 bg-white/55 text-slate-700 hover:bg-white/75 dark:border-slate-600/45 dark:bg-slate-800/55 dark:text-slate-200 dark:hover:bg-slate-700/60'}`}
                          >
                            {slot.time}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {rescheduleMessages[b.id] && <p className="mt-2 text-sm text-rose-700 dark:text-rose-400">{rescheduleMessages[b.id]}</p>}

                  {cancelConfirmBookingId === b.id ? (
                    <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50/80 p-3 dark:border-rose-800/50 dark:bg-rose-900/20">
                      <p className="mb-3 text-sm font-medium text-rose-800 dark:text-rose-300">Amount will not be refunded. Are you sure you want to cancel this interview?</p>
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => handleCancelBooking(b.id)} className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-medium text-white">
                          Yes Cancel
                        </button>
                        <button onClick={() => setCancelConfirmBookingId(null)} className="rounded-xl bg-white/80 px-4 py-2 text-sm dark:bg-slate-700/80">
                          Go Back
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={!selectedRescheduleSlots[b.id]}
                        onClick={() => confirmRescheduleSlot(b.id)}
                        className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Confirm New Slot
                      </button>
                      <button
                        type="button"
                        onClick={() => setCancelConfirmBookingId(b.id)}
                        className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-700"
                      >
                        Cancel Booking
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {!loading && bookings.length === 0 && <p className="text-slate-500 dark:text-slate-400">No bookings yet.</p>}
        </div>

        <MobileRecentNotifications notifications={notifications} loading={loading} />

        <div className="hidden space-y-4 md:block">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Notifications</h2>
          <div className="space-y-2">
            {notifications.map(n => <NotificationItem key={n.id} notification={n} />)}
            {!loading && notifications.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">No notifications yet.</p>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4">Available Interviewers</h2>
          <div className="space-y-4">
            {interviewers.map(int => (
              <div key={int.id} className="liquid-glass-panel p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">{int.name}</h3>
                    {int.verification?.status === 'verified' && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200/70 bg-emerald-50/80 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:border-emerald-700/45 dark:bg-emerald-900/25 dark:text-emerald-300">
                        <ShieldCheck size={12} strokeWidth={2} />
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{int.company || 'Independent Tech Professional'}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Experience: {int.yearsOfExperience ?? 'N/A'} years</p>
                  <p className="text-xs text-sky-700 dark:text-sky-300 mt-1">{int.primaryExpertise || int.specialization || 'Interview Specialist'}</p>
                </div>
                <div className="flex flex-wrap gap-2 sm:justify-end">
                  <button type="button" onClick={() => openInterviewerPreview(int)} className="bg-white/80 dark:bg-slate-700/80 text-sky-700 dark:text-sky-300 px-4 py-2 rounded-xl text-sm">
                    View Profile
                  </button>
                  <Link to={`/book/${int.id}`} className="bg-sky-600 text-white px-4 py-2 rounded-xl text-sm">Book Slot</Link>
                </div>
              </div>
            ))}
            {!loading && interviewers.length === 0 && <p className="text-slate-500 dark:text-slate-400">No interviewers available yet.</p>}
          </div>
        </div>

        <div className="space-y-4">
          <ResumeUploadPanel onUploaded={fetchData} />
          <div className="liquid-glass-panel p-4">
            <h3 className="text-lg font-semibold mb-3 text-slate-800 dark:text-slate-200">Uploaded Resumes</h3>
            <div className="space-y-4 md:space-y-6">
              {resumes.map(resume => {
                const latestRating = resume.ratings?.[resume.ratings.length - 1];
                return (
                  <div key={resume.id} className="rounded-xl border border-white/60 dark:border-slate-600/50 bg-white/60 dark:bg-slate-700/60 p-3">
                    <p className="font-medium text-slate-800 dark:text-slate-200">{resume.fileName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Uploaded: {new Date(resume.uploadedAt).toLocaleString()}</p>
                    {latestRating ? (
                      <div className="mt-2">
                        <p className="text-sm text-slate-700 dark:text-slate-300">Latest rating by {latestRating.ratedByName} on {new Date(latestRating.ratedAt).toLocaleString()}</p>
                        <StarRating value={latestRating.rating} readOnly />
                        {latestRating.feedback && <p className="text-sm mt-1 italic text-slate-700 dark:text-slate-300">{latestRating.feedback}</p>}
                      </div>
                    ) : <p className="text-sm text-amber-700 dark:text-amber-400 mt-2">Rating pending</p>}
                  </div>
                );
              })}
              {!loading && resumes.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">No resumes uploaded yet.</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="liquid-glass-panel overflow-visible p-5 [clip-path:none] md:overflow-visible md:[clip-path:none]">
        <h2 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-100">Feedback Board</h2>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <h3 className="font-semibold mb-2 text-slate-700 dark:text-slate-300">Interview Feedback</h3>
            <div className="space-y-[42px] md:space-y-11">
              {feedbackBookings.map(b => {
                const isExpanded = Boolean(expandedFeedbackCards[b.id]);
                const achievement = calculateInterviewAchievement(b.feedback || {});
                const scorePercent = achievement.percentage;
                const interviewerName = getInterviewerName(b);
                const scoreBreakdown = achievement.breakdown;
                const strengths = achievement.strengths;
                const improvements = achievement.improvements;

                return (
                  <div
                    key={b.id}
                    className="relative overflow-visible rounded-2xl border border-white/70 dark:border-slate-600/60 bg-white/65 dark:bg-slate-700/65 p-5 shadow-[0_14px_34px_rgba(14,116,144,0.14)] hover:shadow-[0_16px_38px_rgba(190,24,93,0.16)] transition-all duration-300"
                    style={{ boxShadow: achievement.tier?.glowShadow || undefined }}
                  >
                    <AchievementBadge achievement={achievement} />
                    <span className="pointer-events-none absolute right-5 top-[51px] z-20 inline-flex items-center rounded-full border border-emerald-200/80 bg-emerald-100/90 px-3 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-700/50 dark:bg-emerald-900/40 dark:text-emerald-300 sm:top-[65px] md:right-8 md:top-[69px] lg:top-[73px]">
                      Completed
                    </span>
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_6%,rgba(56,189,248,0.22),transparent_42%),radial-gradient(circle_at_86%_12%,rgba(236,72,153,0.16),transparent_38%)] opacity-80" />
                    <div className="pointer-events-none absolute inset-0 rounded-2xl border border-white/40 dark:border-slate-500/40" />

                    <div className="relative z-10 space-y-5">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0">
                          <p className="text-sm text-slate-600 dark:text-slate-300">Interview Type</p>
                          <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{b.domain || 'General Interview'}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">Interviewer: {interviewerName}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Date: {new Date(b.date || b.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="hidden">
                          <span className="inline-flex items-center self-start px-3 py-1 rounded-full text-xs font-medium bg-emerald-100/90 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-700/50">
                            Completed
                          </span>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-white/70 dark:border-slate-600/50 bg-white/60 dark:bg-slate-800/60 p-4">
                        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
                          <div className="relative w-28 h-28 shrink-0">
                            <div
                              className="w-28 h-28 rounded-full"
                              style={{
                                background: `conic-gradient(from 220deg, rgba(56,189,248,0.95) 0deg, rgba(236,72,153,0.9) ${scorePercent * 3.6}deg, rgba(226,232,240,0.8) ${scorePercent * 3.6}deg 360deg)`
                              }}
                            />
                            <div className="absolute inset-2 rounded-full bg-white/85 dark:bg-slate-900/80 backdrop-blur-sm border border-white/70 dark:border-slate-600/60 flex flex-col items-center justify-center">
                              <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{scorePercent}%</p>
                              <p className="text-[10px] tracking-wide text-slate-500 dark:text-slate-400">OVERALL</p>
                            </div>
                            <div className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_28%,rgba(255,255,255,0.42),transparent_36%)]" />
                          </div>
                          <div className="text-center sm:text-left">
                            <p className="text-sm text-slate-600 dark:text-slate-300">Result Summary</p>
                            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{achievement.summary}</p>
                            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                              {b.feedback?.comments ? b.feedback.comments.split('. ')[0] : 'Performance summary is available in full feedback details.'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm text-slate-700 dark:text-slate-300">Quick Feedback Summary</p>
                        <button
                          onClick={() => toggleFeedbackCard(b.id)}
                          className="px-4 py-2 rounded-xl text-sm bg-sky-600 text-white hover:bg-sky-700 transition-colors"
                        >
                          {isExpanded ? 'Hide Full Feedback' : 'View Full Feedback'}
                        </button>
                      </div>

                      <div
                        className={`overflow-hidden transition-all duration-300 ease-out ${isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}
                      >
                        <div className="pt-3 grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div className="rounded-xl border border-white/60 dark:border-slate-600/50 bg-white/55 dark:bg-slate-800/55 p-4 space-y-2">
                            <h4 className="font-semibold text-slate-800 dark:text-slate-200">Performance Breakdown</h4>
                            {scoreBreakdown.map(item => (
                              <div key={`${b.id}-${item.label}`} className="flex items-center justify-between text-sm">
                                <span className="text-slate-700 dark:text-slate-300">{item.label}</span>
                                <span className="font-medium text-slate-900 dark:text-slate-100">{item.value}/10</span>
                              </div>
                            ))}
                          </div>

                          <div className="rounded-xl border border-white/60 dark:border-slate-600/50 bg-white/55 dark:bg-slate-800/55 p-4 space-y-3">
                            <h4 className="font-semibold text-slate-800 dark:text-slate-200">Detailed Notes</h4>
                            <div>
                              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Strengths</p>
                              <p className="text-sm text-slate-700 dark:text-slate-300">{strengths.length ? strengths.join(', ') : 'Further growth expected across all evaluated skills.'}</p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Improvement Areas</p>
                              <p className="text-sm text-slate-700 dark:text-slate-300">{improvements.length ? improvements.join(', ') : 'Consistent performance across all evaluated areas.'}</p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Interviewer Comments</p>
                              <p className="text-sm italic text-slate-700 dark:text-slate-300">{b.feedback?.comments || 'No additional comments provided.'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {!loading && feedbackBookings.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">No interview feedback yet.</p>}
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-2 text-slate-700 dark:text-slate-300">Resume Ratings</h3>
            <div className="space-y-3">
              {resumes.flatMap(r => (r.ratings || []).map(rate => ({ resumeName: r.fileName, ...rate }))).map(item => (
                <div key={item.id} className="rounded-xl border border-white/60 dark:border-slate-600/50 bg-white/60 dark:bg-slate-700/60 p-3">
                  <p className="font-medium text-slate-800 dark:text-slate-200">{item.resumeName}</p>
                  <StarRating value={item.rating} readOnly />
                  <p className="text-xs text-slate-500 dark:text-slate-400">By {item.ratedByName} on {new Date(item.ratedAt).toLocaleString()}</p>
                  {item.feedback && <p className="text-sm italic mt-1 text-slate-700 dark:text-slate-300">{item.feedback}</p>}
                </div>
              ))}
              {!loading && resumes.flatMap(r => r.ratings || []).length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">No resume ratings yet.</p>}
            </div>
          </div>
        </div>
      </div>

      {interviewerPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:px-4">
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[3px] transition-opacity duration-[240ms]" onClick={() => setInterviewerPreview(null)} />
          <div className="relative max-h-[calc(100dvh-1.5rem)] w-full max-w-[700px] overflow-y-auto rounded-[26px] border border-white/55 bg-sky-50/84 p-4 shadow-[0_22px_48px_rgba(14,116,144,0.18)] backdrop-blur-2xl transition-all duration-[260ms] ease-out sm:w-[80%] sm:p-5 lg:w-[66%] dark:border-slate-600/45 dark:bg-slate-900/84">
            <button
              type="button"
              onClick={() => setInterviewerPreview(null)}
              className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/60 bg-white/50 text-slate-700 transition-colors hover:text-sky-700 active:bg-white/65 dark:border-slate-600/45 dark:bg-slate-800/55 dark:text-slate-200 dark:hover:text-sky-300"
              aria-label="Close interviewer profile"
            >
              <X size={18} strokeWidth={2} />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="flex h-[140px] w-[140px] items-center justify-center overflow-hidden rounded-full border border-sky-200/70 bg-white/55 text-sky-700 shadow-[inset_0_2px_18px_rgba(255,255,255,0.55),0_16px_30px_rgba(14,116,144,0.14)] dark:border-sky-500/35 dark:bg-slate-800/55 dark:text-sky-300 sm:h-[150px] sm:w-[150px]">
                {resolveMediaUrl(interviewerPreview.profileImage?.filePath) ? (
                  <img
                    src={resolveMediaUrl(interviewerPreview.profileImage?.filePath)}
                    alt=""
                    className="h-full w-full object-cover"
                    style={{ objectPosition: `${interviewerPreview.profileImage?.focusX || 50}% ${interviewerPreview.profileImage?.focusY || 50}%` }}
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center rounded-full bg-sky-100/60 dark:bg-slate-700/70">
                    <UserRound size={48} strokeWidth={1.8} />
                  </span>
                )}
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{interviewerPreview.name || 'Interviewer'}</h3>
                {interviewerPreview.verification?.status === 'verified' && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200/70 bg-emerald-50/80 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-700/45 dark:bg-emerald-900/25 dark:text-emerald-300">
                    <ShieldCheck size={13} strokeWidth={2} />
                    Verified Interviewer
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{interviewerPreview.primaryExpertise || interviewerPreview.specialization || 'Interview Specialist'}</p>
            </div>

            <div className="mt-6 grid max-h-[58vh] grid-cols-1 gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
              {[
                ['Age', interviewerPreview.age || 'Not added yet'],
                ['Experience', interviewerPreview.yearsOfExperience ? `${interviewerPreview.yearsOfExperience} Years` : 'Not added yet'],
                ['Company', interviewerPreview.company || 'Independent'],
                ['Mobile Number', interviewerPreview.phone || 'Available after booking is accepted'],
                ['City', interviewerPreview.city || 'Not added yet'],
                ['Area / Locality', interviewerPreview.area || 'Not added yet'],
                ['College / University', interviewerPreview.college || 'Not added yet'],
                ['Course', interviewerPreview.course || 'Not added yet']
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/55 bg-white/50 p-4 shadow-[0_10px_22px_rgba(14,116,144,0.08)] dark:border-slate-600/40 dark:bg-slate-800/50">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
                  <p className="mt-2 text-sm font-medium text-slate-900 dark:text-slate-100">{value}</p>
                </div>
              ))}

              <div className="rounded-2xl border border-white/55 bg-white/50 p-4 shadow-[0_10px_22px_rgba(14,116,144,0.08)] dark:border-slate-600/40 dark:bg-slate-800/50 sm:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Skill Tags</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(interviewerPreview.skillTags || []).length ? interviewerPreview.skillTags.map(tag => (
                    <span key={tag} className="rounded-full border border-sky-200/70 bg-white/65 px-3 py-1 text-xs font-medium text-sky-800 dark:border-sky-500/40 dark:bg-slate-700/55 dark:text-sky-200">{tag}</span>
                  )) : <span className="text-sm text-slate-600 dark:text-slate-300">No skill tags added yet.</span>}
                </div>
              </div>

              <div className="rounded-2xl border border-white/55 bg-white/50 p-4 shadow-[0_10px_22px_rgba(14,116,144,0.08)] dark:border-slate-600/40 dark:bg-slate-800/50 sm:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Interview Services</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(interviewerPreview.interviewServices || []).map(service => (
                    <span key={service} className="rounded-full border border-sky-200/70 bg-white/65 px-3 py-1 text-xs font-medium text-sky-800 dark:border-sky-500/40 dark:bg-slate-700/55 dark:text-sky-200">{service}</span>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-white/55 bg-white/50 p-4 shadow-[0_10px_22px_rgba(14,116,144,0.08)] dark:border-slate-600/40 dark:bg-slate-800/50 sm:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Availability</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(interviewerPreview.availabilityPreference || []).length ? interviewerPreview.availabilityPreference.map(option => (
                    <span key={option} className="rounded-full border border-sky-200/70 bg-white/65 px-3 py-1 text-xs font-medium text-sky-800 dark:border-sky-500/40 dark:bg-slate-700/55 dark:text-sky-200">{option}</span>
                  )) : <span className="text-sm text-slate-600 dark:text-slate-300">No availability preference added yet.</span>}
                </div>
              </div>

              <div className="rounded-2xl border border-white/55 bg-white/50 p-4 shadow-[0_10px_22px_rgba(14,116,144,0.08)] dark:border-slate-600/40 dark:bg-slate-800/50 sm:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">About</p>
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-800 dark:text-slate-200">{interviewerPreview.bio || 'No bio added yet.'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {studentLifecyclePopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
          <div className="relative max-h-[calc(100dvh-1.5rem)] w-full max-w-md overflow-y-auto liquid-glass-panel p-4 sm:p-5">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {studentLifecyclePopup.notification.title || (
                studentLifecyclePopup.notification.type === 'meeting_link_uploaded'
                  ? 'Meeting Link Available'
                  : studentLifecyclePopup.notification.type === 'refund_submitted'
                    ? 'Refund Submitted'
                    : studentLifecyclePopup.notification.type === 'quick_interview_check'
                      ? 'Interview Ended Very Quickly'
                      : 'Interview Reminder'
              )}
            </h3>
            <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
              {studentLifecyclePopup.notification.message || (studentLifecyclePopup.notification.type === 'meeting_link_uploaded'
                ? 'Your interviewer has uploaded the meeting link.'
                : studentLifecyclePopup.notification.type === 'refund_submitted'
                  ? 'Did you receive the refund?'
                  : studentLifecyclePopup.notification.type === 'quick_interview_check'
                    ? 'Did your interview actually happen?'
                    : 'Your interviewer is waiting.')}
            </p>
            <p className="mt-2 text-xs font-semibold text-sky-700 dark:text-sky-300">
              Booking ID: {getBookingDisplayId(studentLifecyclePopup.booking)}
            </p>
            {['refund_submitted', 'quick_interview_check'].includes(studentLifecyclePopup.notification.type) && (
              <textarea
                rows="3"
                value={studentLifecycleComment}
                onChange={(event) => setStudentLifecycleComment(event.target.value)}
                placeholder="Optional comment"
                className="mt-3 w-full rounded-xl border border-white/60 bg-white/70 px-3 py-2 text-sm outline-none dark:border-slate-600/45 dark:bg-slate-700/70 dark:text-slate-100"
              />
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {studentLifecyclePopup.notification.type === 'refund_submitted' ? (
                <>
                  <button onClick={() => respondToRefund(true)} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white">YES</button>
                  <button onClick={() => respondToRefund(false)} className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-medium text-white">NO</button>
                </>
              ) : studentLifecyclePopup.notification.type === 'quick_interview_check' ? (
                <>
                  <button onClick={() => respondToQualityCheck(true)} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white">YES</button>
                  <button onClick={() => respondToQualityCheck(false)} className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-medium text-white">NO - Report Issue</button>
                </>
              ) : (
                <>
              {studentLifecyclePopup.booking?.meetingLink && (
                <button
                  onClick={async () => {
                    await joinInterview(studentLifecyclePopup.booking);
                    await acknowledgeNotification(studentLifecyclePopup.booking.id, studentLifecyclePopup.notification.id);
                  }}
                  className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white"
                >
                  Join Interview
                </button>
              )}
              <button
                onClick={() => acknowledgeNotification(studentLifecyclePopup.booking.id, studentLifecyclePopup.notification.id)}
                className="rounded-xl bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 dark:bg-slate-700/80 dark:text-slate-100"
              >
                OK
              </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <MeetingDetailsModal
        booking={meetingDetailsBooking}
        onClose={() => setMeetingDetailsBooking(null)}
        onCopy={copyMeetingLink}
        onOpen={joinInterview}
      />
    </div>
  );
}
