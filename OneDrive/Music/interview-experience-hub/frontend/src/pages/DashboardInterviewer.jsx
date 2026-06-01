import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRound, X } from 'lucide-react';
import api, { getApiErrorMessage } from '../lib/apiClient';
import { resolveMediaUrl } from '../lib/mediaUrl';
import InterviewRequestCard from '../components/InterviewRequestCard';
import ApprovalControls from '../components/ApprovalControls';
import ResumeViewer from '../components/ResumeViewer';
import NotificationItem from '../components/NotificationItem';
import UpcomingInterviewCountdown from '../components/UpcomingInterviewCountdown';
import HangingTag from '../components/HangingTag';
import MeetingDetailsModal from '../components/MeetingDetailsModal';
import MobileNotificationBell from '../components/MobileNotificationBell';
import MobileRecentNotifications from '../components/MobileRecentNotifications';

const FEEDBACK_FIELDS = [
  { key: 'technicalSkills', label: 'Technical Skills' },
  { key: 'communicationSkills', label: 'Communication Skills' },
  { key: 'confidenceLevel', label: 'Confidence Level' },
  { key: 'professionalism', label: 'Professionalism' },
  { key: 'problemSolvingAbility', label: 'Problem Solving Ability' },
  { key: 'leadershipQuality', label: 'Leadership Quality' },
  { key: 'adaptability', label: 'Adaptability' },
  { key: 'resumePresentation', label: 'Resume Presentation' },
  { key: 'behavioralInteraction', label: 'Behavioral Interaction' },
  { key: 'clarityOfThought', label: 'Clarity of Thought' }
];

const RESCHEDULE_SLOT_OPTIONS = [
  '07:00 AM – 09:00 AM',
  '09:00 AM – 11:00 AM',
  '11:00 AM – 01:00 PM',
  '01:00 PM – 03:00 PM',
  '03:00 PM – 05:00 PM',
  '05:00 PM – 07:00 PM',
  '07:00 PM – 09:00 PM'
];

const formatDateCapsule = (dateValue) => {
  const date = new Date(`${dateValue}T00:00:00`);
  return {
    day: date.toLocaleDateString(undefined, { weekday: 'short' }),
    date: date.toLocaleDateString(undefined, { day: '2-digit' })
  };
};

const getDateOptions = () => Array.from({ length: 10 }, (_, index) => {
  const date = new Date();
  date.setDate(date.getDate() + index + 1);
  return date.toISOString().slice(0, 10);
});

const getInterviewerCompletion = (user) => {
  if (!user) return 0;
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

export default function DashboardInterviewer() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [feedbackForm, setFeedbackForm] = useState({});
  const [resumeState, setResumeState] = useState({ studentId: '', studentName: '', resumes: [] });
  const [meetingLinks, setMeetingLinks] = useState({});
  const [uploadingBookingId, setUploadingBookingId] = useState(null);
  const [meetingLinkErrors, setMeetingLinkErrors] = useState({});
  const [meetingLinkSuccess, setMeetingLinkSuccess] = useState({});
  const [paymentActionLoading, setPaymentActionLoading] = useState(false);
  const [paymentActionMessage, setPaymentActionMessage] = useState('');
  const [paymentRejectionReasons, setPaymentRejectionReasons] = useState({});
  const [endSessionBooking, setEndSessionBooking] = useState(null);
  const [me, setMe] = useState(null);
  const [qrFile, setQrFile] = useState(null);
  const [qrSaving, setQrSaving] = useState(false);
  const [qrMessage, setQrMessage] = useState('');
  const [reschedulePanel, setReschedulePanel] = useState(null);
  const [rescheduleDraft, setRescheduleDraft] = useState({ date: '', slots: [], message: '' });
  const [rescheduleSubmitting, setRescheduleSubmitting] = useState(false);
  const [rescheduleError, setRescheduleError] = useState('');
  const [profilePreview, setProfilePreview] = useState(null);
  const [meetingDetailsBooking, setMeetingDetailsBooking] = useState(null);
  const [refundDetailsBooking, setRefundDetailsBooking] = useState(null);
  const [refundProofFiles, setRefundProofFiles] = useState({});
  const [refundUtrs, setRefundUtrs] = useState({});
  const [refundActionMessages, setRefundActionMessages] = useState({});
  const [refundHistory, setRefundHistory] = useState([]);
  const [studentContactBooking, setStudentContactBooking] = useState(null);
  const [nowMs, setNowMs] = useState(Date.now());

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    const interval = window.setInterval(fetchBookings, 15000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await api.get('/api/bookings/my-bookings');
      setBookings(res.data.bookings || []);
    } catch (err) {
      console.error(getApiErrorMessage(err, 'Failed to load bookings.'));
    }
  };

  const fetchRefundHistory = async () => {
    try {
      const res = await api.get('/api/bookings/refund-history');
      setRefundHistory(res.data.history || []);
    } catch (err) {
      console.error(getApiErrorMessage(err, 'Failed to load refund history.'));
    }
  };

  const fetchMe = async () => {
    try {
      const res = await api.get('/api/auth/me');
      setMe(res.data?.user || null);
    } catch (err) {
      console.error(getApiErrorMessage(err, 'Failed to load interviewer profile.'));
    }
  };

  useEffect(() => {
    fetchMe();
    fetchRefundHistory();
  }, []);

  useEffect(() => {
    if (!['pending', 'under_review'].includes(me?.verification?.status)) return undefined;
    const interval = window.setInterval(fetchMe, 15000);
    return () => window.clearInterval(interval);
  }, [me?.verification?.status]);

  useEffect(() => {
    if (!profilePreview) return;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setProfilePreview(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [profilePreview]);

  const handleStatusChange = async (id, status, selectedSlot, _meetingLink = '', message = '') => {
    try {
      const me = await api.get('/api/auth/me');
      if (me?.data?.user?.role !== 'interviewer' && me?.data?.user?.role !== 'admin') {
        alert('Your current session is not interviewer. Please login as interviewer to confirm slots.');
        navigate('/login');
        return false;
      }
      await api.put(`/api/bookings/${id}/status`, { status, selectedSlot, message });
      await fetchBookings();
      return true;
    } catch (err) {
      const msg = getApiErrorMessage(err, 'Status update failed');
      if (msg === 'Students can only cancel bookings.') {
        alert('You are logged in as student. Please logout and login as interviewer.');
        navigate('/login');
        return false;
      }
      alert(msg);
      return false;
    }
  };

  const handleUploadMeetingLink = async (bookingId) => {
    const link = meetingLinks[bookingId]?.trim();

    if (!link) {
      setMeetingLinkErrors(prev => ({ ...prev, [bookingId]: 'Please paste a Google Meet link.' }));
      return;
    }

    if (!/^https?:\/\//i.test(link) || !link.includes('meet.google.com')) {
      setMeetingLinkErrors(prev => ({ ...prev, [bookingId]: 'Only valid Google Meet links are allowed.' }));
      return;
    }

    try {
      setUploadingBookingId(bookingId);
      setMeetingLinkErrors(prev => ({ ...prev, [bookingId]: '' }));
      setMeetingLinkSuccess(prev => ({ ...prev, [bookingId]: '' }));

      await api.put(`/api/bookings/${bookingId}/meeting-link`, { meetingLink: link });

      setMeetingLinks(prev => ({ ...prev, [bookingId]: '' }));
      setMeetingLinkSuccess(prev => ({ ...prev, [bookingId]: 'Google Meet link uploaded successfully.' }));
      await fetchBookings();
    } catch (error) {
      setMeetingLinkErrors(prev => ({
        ...prev,
        [bookingId]: getApiErrorMessage(error, 'Failed to upload Google Meet link.')
      }));
    } finally {
      setUploadingBookingId(null);
    }
  };

  const notifyStudent = async (bookingId) => {
    try {
      await api.post(`/api/bookings/${bookingId}/reminders`);
      await fetchBookings();
    } catch (err) {
      alert(getApiErrorMessage(err, 'Could not notify student.'));
    }
  };

  const openMeeting = (booking) => {
    if (booking?.meetingLink) window.open(booking.meetingLink, '_blank', 'noopener,noreferrer');
  };

  const copyMeetingLink = async (link) => {
    if (!link) return;
    await navigator.clipboard?.writeText(link);
  };

  const handleFeedbackSubmit = async (e, id) => {
    e.preventDefault();
    try {
      await api.post(`/api/bookings/${id}/feedback`, feedbackForm[id]);
      setFeedbackForm(prev => ({ ...prev, [id]: undefined }));
      fetchBookings();
    } catch (err) {
      console.error(getApiErrorMessage(err, 'Failed to submit feedback.'));
    }
  };

  const openReschedulePanel = (booking) => {
    setReschedulePanel(booking);
    setRescheduleDraft({ date: '', slots: [], message: '' });
    setRescheduleError('');
  };

  const closeReschedulePanel = () => {
    if (rescheduleSubmitting) return;
    setReschedulePanel(null);
    setRescheduleDraft({ date: '', slots: [], message: '' });
    setRescheduleError('');
  };

  const toggleRescheduleSlot = (slot) => {
    setRescheduleDraft(prev => ({
      ...prev,
      slots: prev.slots.includes(slot) ? prev.slots.filter(item => item !== slot) : [...prev.slots, slot].sort()
    }));
  };

  const submitRescheduleProposal = async () => {
    if (!reschedulePanel || !rescheduleDraft.date || rescheduleDraft.slots.length === 0) return;
    const conflict = bookings.find(booking => (
      booking.id !== reschedulePanel.id &&
      ['confirmed', 'meeting_link_uploaded', 'session_ended'].includes(booking.status) &&
      booking.selectedDate === rescheduleDraft.date &&
      rescheduleDraft.slots.includes(booking.slotLabel || booking.slot || booking.selectedSlot?.time)
    ));
    if (conflict && !window.confirm('This slot is already booked.\nContinuing may create a scheduling conflict.')) {
      return;
    }
    setRescheduleSubmitting(true);
    setRescheduleError('');
    try {
      await api.put(`/api/bookings/${reschedulePanel.id}/reschedule-proposal`, {
        date: rescheduleDraft.date,
        slots: rescheduleDraft.slots.map(time => ({ time })),
        message: rescheduleDraft.message
      });
      setReschedulePanel(null);
      setRescheduleDraft({ date: '', slots: [], message: '' });
      await fetchBookings();
    } catch (err) {
      setRescheduleError(getApiErrorMessage(err, 'Could not send available slots.'));
    } finally {
      setRescheduleSubmitting(false);
    }
  };

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

  const handlePaymentVerification = async (bookingId, paymentStatus) => {
    const rejectionReason = String(paymentRejectionReasons[bookingId] || '').trim();
    if (paymentStatus === 'rejected' && !rejectionReason) {
      setPaymentActionMessage('Rejection reason is required when rejecting payment.');
      return;
    }
    try {
      setPaymentActionLoading(true);
      setPaymentActionMessage('');
      await api.put(`/api/bookings/${bookingId}/payment-verification`, { paymentStatus, rejectionReason });
      setPaymentActionMessage(paymentStatus === 'verified' ? 'Payment confirmed successfully.' : 'Payment marked as not confirmed.');
      if (paymentStatus === 'rejected') {
        setPaymentRejectionReasons(prev => ({ ...prev, [bookingId]: '' }));
      }
      await fetchBookings();
    } catch (error) {
      setPaymentActionMessage(getApiErrorMessage(error, 'Failed to update payment verification.'));
    } finally {
      setPaymentActionLoading(false);
    }
  };

  const submitRefundProof = async (bookingId) => {
    const file = refundProofFiles[bookingId];
    const utr = String(refundUtrs[bookingId] || '').trim();
    if (!file) {
      setRefundActionMessages(prev => ({ ...prev, [bookingId]: 'Refund screenshot is required.' }));
      return;
    }
    if (!/^[A-Za-z0-9-]{8,30}$/.test(utr)) {
      setRefundActionMessages(prev => ({ ...prev, [bookingId]: 'UTR number must be 8 to 30 characters and contain only letters, numbers, or hyphen.' }));
      return;
    }
    try {
      const data = new FormData();
      data.append('refundScreenshot', file);
      data.append('utr', utr);
      await api.post(`/api/bookings/${bookingId}/refund-proof`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
      setRefundProofFiles(prev => ({ ...prev, [bookingId]: null }));
      setRefundUtrs(prev => ({ ...prev, [bookingId]: '' }));
      setRefundActionMessages(prev => ({ ...prev, [bookingId]: 'Refund proof submitted. Waiting for student confirmation.' }));
      await fetchBookings();
      await fetchRefundHistory();
    } catch (error) {
      setRefundActionMessages(prev => ({ ...prev, [bookingId]: getApiErrorMessage(error, 'Failed to submit refund proof.') }));
    }
  };

  const handleSaveQr = async () => {
    if (!qrFile) return;
    try {
      setQrSaving(true);
      setQrMessage('');
      const data = new FormData();
      data.append('paymentQr', qrFile);
      await api.post('/api/auth/interviewer-payment-qr', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      setQrMessage('Payment QR saved successfully.');
      setQrFile(null);
      await fetchMe();
      await fetchBookings();
    } catch (err) {
      setQrMessage(getApiErrorMessage(err, 'Failed to save payment QR.'));
    } finally {
      setQrSaving(false);
    }
  };

  const dismissVerificationSuccess = async () => {
    try {
      const res = await api.post('/api/auth/interviewer-verification-success-dismiss');
      setMe(res.data?.user || me);
      window.dispatchEvent(new CustomEvent('ieh:auth-changed'));
    } catch (err) {
      console.error(getApiErrorMessage(err, 'Could not dismiss verification message.'));
    }
  };

  const updateFeedbackForm = (id, field, value) => {
    setFeedbackForm(prev => ({ ...prev, [id]: { ...(prev[id] || {}), [field]: value } }));
  };

  const openStudentResumes = async (studentId) => {
    try {
      const res = await api.get(`/api/bookings/students/${studentId}/resumes`);
      setResumeState({ studentId, studentName: res.data.student.name, resumes: res.data.resumes || [] });
    } catch (err) {
      alert(getApiErrorMessage(err, 'Unable to load student resumes'));
    }
  };

  const interviewerNotifications = bookings.flatMap(b => (b.notifications || []).filter(n => n.recipientRole === 'interviewer'));
  const confirmedBookings = bookings.filter(b => ['confirmed', 'meeting_link_uploaded', 'session_ended'].includes(b.status));
  const getSlotLabel = (booking) => booking.selectedSlot?.label || `${booking.date || ''} ${booking.slot || ''}`.trim();
  const getLifecycleTag = (booking) => {
    const state = booking.hangingTagState;
    if (!state?.type) return null;
    const focusMeetingLinkInput = () => {
      const input = document.getElementById(`meeting-link-input-${booking.id}`);
      input?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      input?.focus();
    };
    const actionMap = {
      notify_student: {
        label: state.notified ? 'Notified ✓' : 'Notify Student',
        onClick: state.notified ? undefined : () => notifyStudent(booking.id)
      },
      view_meeting_details: { label: 'View Meeting Details', onClick: () => setMeetingDetailsBooking(booking) },
      upload_meeting_link: { label: 'Upload Meeting Link', onClick: focusMeetingLinkInput },
      call_student: { label: 'Call Student', onClick: () => setStudentContactBooking(booking) },
      view_refund_details: { label: 'View Refund Details', onClick: () => setRefundDetailsBooking(booking) },
      mark_refund_sent: {
        label: 'Mark Refund Sent',
        onClick: () => {
          if (refundProofFiles[booking.id]) submitRefundProof(booking.id);
          else document.getElementById(`refund-proof-input-${booking.id}`)?.click();
        }
      }
    };
    return {
      title: state.title,
      tone: state.tone,
      message: state.message,
      actions: (state.actions || []).map(action => actionMap[action]).filter(Boolean)
    };
  };
  const refundOverdueBookings = bookings.filter(b => b.refundOverdue);
  const profileCompletion = getInterviewerCompletion(me);
  const verificationStatus = me?.verification?.status || 'required';
  const verificationRequestType = me?.verification?.requestType || 'new';
  const dashboardProfileState = !me
    ? null
    : me.status === 'disabled'
      ? 'account-disabled'
    : profileCompletion < 100
      ? 'incomplete'
      : verificationStatus === 'verified'
        ? (me.verificationSuccessDismissedAt ? 'verified-dismissed' : 'verified')
        : verificationStatus === 'pending' || verificationStatus === 'update_pending'
          ? 'pending'
          : verificationStatus === 'under_review'
            ? 'under_review'
            : verificationStatus === 'declined' || verificationStatus === 'rejected'
              ? 'declined'
              : 'ready-for-verification';
  const showOnboardingCard = ['account-disabled', 'incomplete', 'ready-for-verification', 'pending', 'under_review', 'declined'].includes(dashboardProfileState);
  const showVerifiedSuccessCard = dashboardProfileState === 'verified';

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <MobileNotificationBell notifications={interviewerNotifications} />

      <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Interviewer Dashboard</h1>

      {refundOverdueBookings.length > 0 && (
        <div className="liquid-glass-panel border border-rose-200/80 bg-rose-50/70 p-5 dark:border-rose-700/45 dark:bg-rose-900/20">
          <p className="text-lg font-semibold text-rose-800 dark:text-rose-200">Refund Overdue</p>
          <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">Refund has remained unresolved for more than 48 hours. New interview requests are temporarily paused.</p>
          <p className="text-sm text-slate-700 dark:text-slate-300">Please complete refund to resume receiving student requests.</p>
          <div className="mt-4 space-y-2">
            {refundOverdueBookings.map(booking => (
              <div key={`overdue-${booking.id}`} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/60 bg-white/55 px-4 py-3 text-sm dark:border-slate-600/45 dark:bg-slate-800/45">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{booking.studentName || 'Student'}</p>
                  <p className="text-xs text-sky-700 dark:text-sky-300">Booking ID: {booking.bookingId || booking.id}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">Refund Amount: ₹{booking.refundAmount || booking.refundSnapshot?.paymentAmount || booking.paymentAmount || 50}</p>
                </div>
                <button type="button" onClick={() => setRefundDetailsBooking(booking)} className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-medium text-white">
                  View Refund Details
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {showVerifiedSuccessCard && (
        <div className="liquid-glass-panel p-5 border border-emerald-200/70 dark:border-emerald-700/45">
          <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">{verificationRequestType === 'update' ? 'Verification Update Approved' : 'Verification Approved'}</p>
          <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{verificationRequestType === 'update' ? 'Your updated verification information has been approved successfully.' : 'Your profile has been verified and is now visible to students.'}</p>
          <span className="mt-4 inline-flex rounded-full border border-emerald-200/80 bg-emerald-100/75 px-3 py-1 text-xs font-medium text-emerald-800 dark:border-emerald-700/45 dark:bg-emerald-900/25 dark:text-emerald-300">
            Verified
          </span>
          <button type="button" onClick={dismissVerificationSuccess} className="ml-3 mt-4 rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white">OK</button>
        </div>
      )}

      {showOnboardingCard && (
        <div className="liquid-glass-panel mx-auto max-w-3xl p-5 text-center">
          {dashboardProfileState === 'account-disabled' && (
            <>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Account Disabled</h2>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">Your account has been disabled by admin.</p>
              <p className="text-sm text-slate-700 dark:text-slate-300">Please contact admin for assistance.</p>
            </>
          )}
          {dashboardProfileState === 'incomplete' && (
            <>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Welcome!</h2>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">Complete your profile to start receiving interview requests.</p>
              <p className="text-sm text-slate-700 dark:text-slate-300">Your profile must be completed and verified before it becomes visible to students.</p>
              <button type="button" onClick={() => navigate('/interviewer-profile')} className="mt-4 rounded-2xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_14px_26px_rgba(14,116,144,0.18)]">
                Complete Profile
              </button>
            </>
          )}
          {dashboardProfileState === 'ready-for-verification' && (
            <>
              <h2 className="text-xl font-semibold text-emerald-700 dark:text-emerald-300">Profile Complete ✓</h2>
              <p className="mt-2 text-sm font-semibold text-slate-800 dark:text-slate-100">Final Step:</p>
              <p className="text-sm text-slate-700 dark:text-slate-300">Upload a verification document for admin approval.</p>
              <button type="button" onClick={() => navigate('/interviewer-profile#verification')} className="mt-4 rounded-2xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_14px_26px_rgba(14,116,144,0.18)]">
                Go To Verification
              </button>
            </>
          )}
          {dashboardProfileState === 'pending' && (
            <>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{verificationRequestType === 'update' ? 'Verification Update Submitted' : 'Verification Submitted'}</h2>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{verificationRequestType === 'update' ? 'Your updated verification information has been submitted for admin review.' : 'Your profile has been submitted for admin review.'}</p>
              <p className="text-sm text-slate-700 dark:text-slate-300">Your profile will become visible to students after approval.</p>
              <span className="mt-4 inline-flex rounded-full border border-amber-200/80 bg-amber-100/75 px-3 py-1 text-xs font-medium text-amber-800 dark:border-amber-700/45 dark:bg-amber-900/25 dark:text-amber-300">
                Pending Approval
              </span>
            </>
          )}
          {dashboardProfileState === 'under_review' && (
            <>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{verificationRequestType === 'update' ? 'Verification Update On Hold' : 'Verification On Hold'}</h2>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{verificationRequestType === 'update' ? 'Your updated verification information is under review. Please contact admin if needed.' : 'Your verification is currently under review. Please contact admin if additional information is required.'}</p>
              <span className="mt-4 inline-flex rounded-full border border-amber-200/80 bg-amber-100/75 px-3 py-1 text-xs font-medium text-amber-800 dark:border-amber-700/45 dark:bg-amber-900/25 dark:text-amber-300">
                Under Review
              </span>
            </>
          )}
          {dashboardProfileState === 'declined' && (
            <>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{verificationRequestType === 'update' ? 'Verification Update Declined' : 'Verification Declined'}</h2>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{verificationRequestType === 'update' ? 'Your updated verification information could not be approved. Please contact admin through Help & Support.' : 'Your verification request was not approved. Please contact admin through the Help section for support.'}</p>
              <span className="mt-4 inline-flex rounded-full border border-rose-200/80 bg-rose-100/75 px-3 py-1 text-xs font-medium text-rose-800 dark:border-rose-700/45 dark:bg-rose-900/25 dark:text-rose-300">
                Declined
              </span>
            </>
          )}
        </div>
      )}

      <UpcomingInterviewCountdown bookings={bookings} role="interviewer" onJoin={openMeeting} />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="liquid-glass-panel p-4 text-center"><p className="text-2xl font-bold text-sky-700 dark:text-sky-400">{bookings.length}</p><p className="text-sm text-slate-600 dark:text-slate-400">Total Requests</p></div>
        <div className="liquid-glass-panel p-4 text-center"><p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{bookings.filter(b => ['pending', 'pending_payment', 'pending_verification', 'screenshot_uploaded'].includes(b.status)).length}</p><p className="text-sm text-slate-600 dark:text-slate-400">Pending Approval</p></div>
        <div className="liquid-glass-panel p-4 text-center"><p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{confirmedBookings.length}</p><p className="text-sm text-slate-600 dark:text-slate-400">Confirmed</p></div>
        <div className="liquid-glass-panel p-4 text-center"><p className="text-2xl font-bold text-teal-700 dark:text-teal-400">{bookings.filter(b => b.status === 'completed').length}</p><p className="text-sm text-slate-600 dark:text-slate-400">Completed</p></div>
      </div>

      {refundHistory.length > 0 && (
        <div className="liquid-glass-panel p-5">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Refund History</h2>
          <div className="mt-4 space-y-3">
            {refundHistory.map(item => (
              <div key={`refund-history-${item.id}`} className="rounded-2xl border border-white/60 bg-white/55 p-3 text-sm dark:border-slate-600/45 dark:bg-slate-800/45">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">Booking ID: {item.bookingId}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300">Student: {item.studentName}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300">Amount: ₹{item.refundAmount}</p>
                  </div>
                  <span className="rounded-full border border-white/70 bg-white/70 px-3 py-1 text-xs font-medium text-slate-700 dark:border-slate-600/45 dark:bg-slate-700/55 dark:text-slate-200">
                    {item.refundStatus || 'refund'}
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-1 gap-2 text-xs text-slate-600 dark:text-slate-300 sm:grid-cols-3">
                  <p>UTR: {item.utr || 'Not submitted'}</p>
                  <p>Refund Date: {item.refundSubmittedAt ? new Date(item.refundSubmittedAt).toLocaleDateString() : 'N/A'}</p>
                  <p>Refund Time: {item.refundSubmittedAt ? new Date(item.refundSubmittedAt).toLocaleTimeString() : 'N/A'}</p>
                </div>
                {item.screenshot?.filePath && (
                  <a href={resolveMediaUrl(item.screenshot.filePath)} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs font-medium text-sky-700 hover:underline dark:text-sky-300">
                    View Screenshot
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="liquid-glass-panel p-5">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Payment QR Management</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Upload one permanent QR for your profile. Students will use this for all future bookings.</p>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
          <div className="md:col-span-1 rounded-xl border border-white/70 dark:border-slate-600/50 bg-white/70 dark:bg-slate-800/70 p-3">
            {me?.paymentQr?.filePath ? (
              <img src={resolveMediaUrl(me.paymentQr.filePath)} alt="Your payment QR" className="w-full max-w-[220px] mx-auto aspect-square object-contain rounded-lg bg-white p-2" />
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">No QR uploaded yet</p>
            )}
          </div>
          <div className="md:col-span-2 space-y-3">
            <input
              type="file"
              accept=".jpg,.jpeg,.png"
              onChange={(e) => setQrFile(e.target.files?.[0] || null)}
              className="block w-full text-sm"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveQr}
                disabled={!qrFile || qrSaving}
                className="px-4 py-2 rounded-xl bg-sky-600 text-white text-sm disabled:opacity-60"
              >
                {me?.paymentQr?.filePath ? 'Update QR' : 'Save QR'}
              </button>
            </div>
            {qrMessage && <p className="text-sm text-slate-700 dark:text-slate-300">{qrMessage}</p>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Interview Requests Queue</h2>
          {bookings.map(b => {
            const lifecycleTag = getLifecycleTag(b);
            return (
            <div key={b.id} className="space-y-3">
              <InterviewRequestCard
                booking={b}
                studentProfile={b.studentProfile}
                onStudentProfileClick={setProfilePreview}
                hasHangingTag={Boolean(lifecycleTag)}
              >
                {lifecycleTag && <HangingTag {...lifecycleTag} />}
                <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">Requested slots: {(b.preferredSlots || []).map(s => `${s.date} ${s.time}`).join(' | ')}</p>
                {b.selectedSlot?.date && b.selectedSlot?.time && (
                  <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">Finalized Slot: {b.selectedSlot.date} {b.selectedSlot.time}</p>
                )}
                {b.status !== 'pending' && (
                  <p className={`text-sm mb-2 ${getPaymentStatusClass(b.paymentStatus)}`}>
                    Payment Status: {getPaymentStatusLabel(b.paymentStatus)}
                  </p>
                )}
                {b.status === 'accepted' && b.paymentStatus === 'not_uploaded' && (
                  <div className="mb-3 rounded-xl border border-amber-200 dark:border-amber-700/50 bg-amber-50/70 dark:bg-amber-900/20 px-3 py-2">
                    <p className="text-sm text-amber-700 dark:text-amber-300">Awaiting payment screenshot from student.</p>
                  </div>
                )}
                {b.status === 'accepted' && b.paymentProof && (
                  <div className="mb-3 rounded-xl border border-white/60 dark:border-slate-600/50 bg-white/60 dark:bg-slate-800/60 p-3">
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">Uploaded Payment Screenshot</p>
                    {b.paymentProof?.toLowerCase().endsWith('.pdf') ? (
                      <a href={resolveMediaUrl(b.paymentProof)} target="_blank" rel="noopener noreferrer" className="inline-flex px-3 py-2 rounded-xl bg-white/80 dark:bg-slate-700/80 text-sm">
                        Open Screenshot File
                      </a>
                    ) : (
                      <img src={resolveMediaUrl(b.paymentProof)} alt="Uploaded payment screenshot" className="w-full max-h-64 object-contain rounded-xl border border-white/60 dark:border-slate-600/50 bg-white" />
                    )}
                  </div>
                )}
                {b.status === 'accepted' && (b.paymentStatus === 'screenshot_uploaded' || b.paymentStatus === 'rejected' || b.paymentStatus === 'pending_verification') && (
                  <div className="mb-3 space-y-2">
                    <input
                      type="text"
                      value={paymentRejectionReasons[b.id] || ''}
                      onChange={(e) => setPaymentRejectionReasons(prev => ({ ...prev, [b.id]: e.target.value }))}
                      placeholder="Reason required only if rejecting payment"
                      className="w-full rounded-xl border border-white/60 bg-white/80 px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-sky-200 dark:border-slate-600/50 dark:bg-slate-800/70 dark:text-slate-100"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handlePaymentVerification(b.id, 'verified')}
                        disabled={paymentActionLoading}
                        className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-sm disabled:opacity-60"
                      >
                        Verify Payment
                      </button>
                      <button
                        onClick={() => handlePaymentVerification(b.id, 'rejected')}
                        disabled={paymentActionLoading}
                        className="px-3 py-2 rounded-xl bg-rose-600 text-white text-sm disabled:opacity-60"
                      >
                        Reject Payment
                      </button>
                    </div>
                  </div>
                )}
                {['refund_required', 'refund_proof_submitted', 'refund_disputed'].includes(b.status) && (
                  <div className="mb-3 rounded-xl border border-rose-200 dark:border-rose-800/50 bg-rose-50/70 dark:bg-rose-900/20 p-3">
                    <p className="text-sm font-semibold text-rose-700 dark:text-rose-300 mb-2">
                      {b.refundStatus === 'proof_submitted' ? 'Refund Submitted' : b.refundStatus === 'disputed' ? 'Refund Disputed' : b.refundStatus === 'admin_review_required' ? 'Admin Review Required' : 'Refund Required'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setRefundDetailsBooking(b)}
                        className="px-3 py-2 rounded-xl bg-white/80 dark:bg-slate-700/80 text-rose-700 dark:text-rose-300 text-sm"
                      >
                        View Refund Details
                      </button>
                    </div>
                    {b.refundStatus === 'required' && (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs text-rose-700 dark:text-rose-300">Upload refund screenshot and enter UTR before marking refund sent.</p>
                        <div className="rounded-xl border border-white/60 bg-white/60 px-3 py-2 text-sm dark:border-slate-600/45 dark:bg-slate-800/50">
                          Refund Amount: <span className="font-semibold">₹{b.refundAmount || b.refundSnapshot?.paymentAmount || b.paymentAmount || 50}</span>
                        </div>
                        <input
                          id={`refund-proof-input-${b.id}`}
                          type="file"
                          accept=".jpg,.jpeg,.png"
                          onChange={(event) => setRefundProofFiles(prev => ({ ...prev, [b.id]: event.target.files?.[0] || null }))}
                          className="block w-full text-sm"
                        />
                        <input
                          value={refundUtrs[b.id] || ''}
                          onChange={(event) => setRefundUtrs(prev => ({ ...prev, [b.id]: event.target.value }))}
                          placeholder="UTR Number"
                          className="w-full rounded-xl border border-white/60 bg-white/70 px-3 py-2 text-sm outline-none dark:border-slate-600/45 dark:bg-slate-800/60"
                        />
                        <button
                          onClick={() => submitRefundProof(b.id)}
                          disabled={!refundProofFiles[b.id] || !/^[A-Za-z0-9-]{8,30}$/.test(String(refundUtrs[b.id] || '').trim())}
                          className="px-3 py-2 rounded-xl bg-rose-600 text-white text-sm disabled:opacity-60"
                        >
                          Mark Refund Sent
                        </button>
                      </div>
                    )}
                    {b.refundStatus === 'proof_submitted' && (
                      <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">Waiting for student confirmation.</p>
                    )}
                    {refundActionMessages[b.id] && <p className="mt-2 text-xs text-slate-700 dark:text-slate-300">{refundActionMessages[b.id]}</p>}
                  </div>
                )}
                {b.status === 'reschedule_slot_selected' && b.selectedSlot && (
                  <div className="mb-3 rounded-xl border border-violet-200/70 dark:border-violet-700/50 bg-violet-50/70 dark:bg-violet-900/20 px-3 py-2">
                    <p className="text-sm text-violet-800 dark:text-violet-200">Student selected: {b.selectedSlot.date} {b.selectedSlot.time}</p>
                  </div>
                )}
                {b.status === 'reschedule_requested' && (
                  <div className="mb-3 rounded-xl border border-indigo-200/70 dark:border-indigo-700/50 bg-indigo-50/70 dark:bg-indigo-900/20 px-3 py-2">
                    <p className="text-sm text-indigo-800 dark:text-indigo-200">Available slots sent. Waiting for student to choose one.</p>
                  </div>
                )}
                <ApprovalControls
                  booking={b}
                  onSubmit={(status, selectedSlot, meetingLinkValue, message) => handleStatusChange(b.id, status, selectedSlot, meetingLinkValue, message)}
                  onRequestNewSlot={() => openReschedulePanel(b)}
                />

                <div className="mt-3 flex flex-wrap gap-2">
                  <button onClick={() => openStudentResumes(b.studentId)} className="px-3 py-2 rounded-xl bg-white/80 dark:bg-slate-700/80 border border-white/80 dark:border-slate-600/50 text-sky-700 dark:text-sky-400 text-sm">View Student Resume</button>
                  {b.status === 'session_ended' && <button onClick={() => setFeedbackForm(prev => ({ ...prev, [b.id]: {} }))} className="px-3 py-2 rounded-xl bg-sky-600 text-white text-sm">Complete & Give Feedback</button>}
                </div>

                {feedbackForm[b.id] && b.status === 'session_ended' && (
                  <form onSubmit={(e) => handleFeedbackSubmit(e, b.id)} className="mt-4 rounded-xl bg-white/70 dark:bg-slate-700/70 border border-white/70 dark:border-slate-600/50 p-4 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {FEEDBACK_FIELDS.map(field => (
                        <div key={field.key}>
                          <label className="text-xs text-slate-600 dark:text-slate-300">{field.label}</label>
                          <input
                            type="number"
                            min="1"
                            max="10"
                            required
                            placeholder={`${field.label} (1-10)`}
                            className="glass-input mt-1"
                            onChange={(e) => updateFeedbackForm(b.id, field.key, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                    <textarea required rows="3" placeholder="Detailed comments" className="glass-input" onChange={(e) => updateFeedbackForm(b.id, 'comments', e.target.value)} />
                    <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm">Submit Feedback</button>
                  </form>
                )}
              </InterviewRequestCard>
            </div>
            );
          })}
          {bookings.length === 0 && <p className="text-slate-500 dark:text-slate-400">No bookings available.</p>}
        </div>

        <MobileRecentNotifications notifications={interviewerNotifications} />

        <div className="hidden space-y-4 md:block">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Notifications</h2>
          {interviewerNotifications.map(n => <NotificationItem key={n.id} notification={n} />)}
          {interviewerNotifications.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">No notifications yet.</p>}
        </div>
      </div>

      {confirmedBookings.length > 0 && (
        <div className="liquid-glass-panel p-6">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2">Google Meet Link Upload</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Upload a separate Google Meet link for each confirmed student.</p>

          <div className="space-y-3 mt-4">
            {confirmedBookings.map(b => (
              <div key={b.id} className="bg-white/60 dark:bg-slate-800/60 rounded-xl p-4 border border-white/60 dark:border-slate-600/50">
                {(() => {
                  const persistedMeetingLink = typeof b.meetingLink === 'string' ? b.meetingLink.trim() : '';
                  const hasUploadedMeetingLink = persistedMeetingLink.length > 0;
                  return (
                    <>
                <p className="font-medium text-slate-800 dark:text-slate-200">{b.studentName || 'Student'}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Domain: {b.domain || 'General Interview'}</p>
                <p className="text-xs font-semibold text-sky-700 dark:text-sky-300 mt-1">Booking ID: {b.bookingId || b.id}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Slot: {getSlotLabel(b)}</p>
                <p className="text-sm mt-2 text-slate-700 dark:text-slate-300">
                  Status: {hasUploadedMeetingLink ? 'Meeting Link Uploaded' : 'Waiting for Google Meet link upload'}
                </p>
                {b.status === 'completed' && (
                  <span className="inline-flex mt-2 px-4 py-2 bg-emerald-600 text-white text-sm rounded-xl">
                    Interview Successful
                  </span>
                )}
                {hasUploadedMeetingLink && !['session_ended', 'completed'].includes(b.status) && (
                  <button
                    onClick={() => setEndSessionBooking(b)}
                    className="mt-2 px-4 py-2 bg-emerald-600 text-white text-sm rounded-xl"
                  >
                    End Interview Session
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setMeetingDetailsBooking(b)}
                  className="mt-2 ml-2 px-4 py-2 bg-white/80 dark:bg-slate-700/80 text-sm rounded-xl"
                >
                  View Meeting Details
                </button>

                <div className="mt-3 space-y-2">
                  <input
                    id={`meeting-link-input-${b.id}`}
                    type="url"
                    placeholder="Paste Google Meet link"
                    value={meetingLinks[b.id] || ''}
                    onChange={(e) => setMeetingLinks(prev => ({ ...prev, [b.id]: e.target.value }))}
                    className="w-full rounded-xl border border-white/50 dark:border-slate-600/50 bg-white/80 dark:bg-slate-700/80 px-3 py-2 text-sm"
                  />
                  <button
                    onClick={() => handleUploadMeetingLink(b.id)}
                    disabled={uploadingBookingId === b.id}
                    className="px-4 py-2 bg-sky-600 text-white text-sm rounded-xl disabled:opacity-60"
                  >
                    {uploadingBookingId === b.id ? 'Uploading...' : (b.meetingLink ? 'Update Link' : 'Upload Link')}
                  </button>
                  {meetingLinkErrors[b.id] && <p className="text-sm text-rose-700 dark:text-rose-400">{meetingLinkErrors[b.id]}</p>}
                  {meetingLinkSuccess[b.id] && <p className="text-sm text-emerald-700 dark:text-emerald-400">{meetingLinkSuccess[b.id]}</p>}
                </div>
                    </>
                  );
                })()}
              </div>
            ))}
          </div>
        </div>
      )}

      {resumeState.studentId && (
        <div>
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-3">Resume Review: {resumeState.studentName}</h2>
          <ResumeViewer studentId={resumeState.studentId} resumes={resumeState.resumes} onRated={() => openStudentResumes(resumeState.studentId)} />
        </div>
      )}

      {paymentActionMessage && (
        <div className="liquid-glass-panel p-3">
          <p className={`text-sm ${paymentActionMessage.toLowerCase().includes('failed') ? 'text-rose-700 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
            {paymentActionMessage}
          </p>
        </div>
      )}

      {reschedulePanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:px-4">
          <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-[3px] transition-opacity duration-300" onClick={closeReschedulePanel} />
          <div className="relative max-h-[calc(100dvh-1.5rem)] w-full max-w-xl overflow-y-auto liquid-glass-panel p-4 transition-all duration-300 sm:p-5">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Request New Slot</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Send available alternatives to {reschedulePanel.studentName || 'the student'}.</p>

            <div className="mt-5 space-y-4">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Select Date</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {getDateOptions().map(dateValue => {
                    const label = formatDateCapsule(dateValue);
                    const selected = rescheduleDraft.date === dateValue;
                    return (
                      <button
                        key={dateValue}
                        type="button"
                        onClick={() => setRescheduleDraft(prev => ({ ...prev, date: dateValue, slots: [] }))}
                        className={`shrink-0 rounded-2xl border px-4 py-2 text-sm transition-all ${selected ? 'border-violet-300/80 bg-white/80 text-violet-800 shadow-[0_10px_22px_rgba(124,58,237,0.13)] dark:border-violet-500/60 dark:bg-slate-700/80 dark:text-violet-200' : 'border-white/60 bg-white/55 text-slate-700 hover:bg-white/75 hover:shadow-[0_8px_18px_rgba(14,116,144,0.1)] dark:border-slate-600/45 dark:bg-slate-800/55 dark:text-slate-200 dark:hover:bg-slate-700/60'}`}
                      >
                        <span className="block text-xs">{label.day}</span>
                        <span className="block font-semibold">{label.date}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Available Slots</p>
                <div className="max-h-40 overflow-y-auto rounded-2xl border border-white/55 bg-white/35 p-2 dark:border-slate-600/40 dark:bg-slate-800/35">
                  <div className="flex flex-wrap gap-2">
                    {RESCHEDULE_SLOT_OPTIONS.map(slot => {
                      const selected = rescheduleDraft.slots.includes(slot);
                      return (
                        <button
                          key={slot}
                          type="button"
                          disabled={!rescheduleDraft.date}
                          onClick={() => toggleRescheduleSlot(slot)}
                          className={`rounded-2xl border px-4 py-2 text-sm transition-all disabled:cursor-not-allowed disabled:opacity-50 ${selected ? 'border-violet-300/80 bg-white/80 text-violet-800 shadow-[0_8px_18px_rgba(124,58,237,0.12)] dark:border-violet-500/60 dark:bg-slate-700/80 dark:text-violet-200' : 'border-white/60 bg-white/55 text-slate-700 hover:bg-white/75 dark:border-slate-600/45 dark:bg-slate-800/55 dark:text-slate-200 dark:hover:bg-slate-700/60'}`}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <textarea
                rows="3"
                maxLength="240"
                value={rescheduleDraft.message}
                onChange={(e) => setRescheduleDraft(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Optional short scheduling note"
                className="w-full rounded-2xl border border-white/55 bg-white/60 px-4 py-3 text-sm outline-none dark:border-slate-600/45 dark:bg-slate-800/60 dark:text-slate-100"
              />

              {rescheduleError && <p className="text-sm text-rose-700 dark:text-rose-400">{rescheduleError}</p>}

              <div className="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={closeReschedulePanel}
                  className="rounded-xl bg-white/75 px-4 py-2 text-sm text-slate-700 transition hover:bg-white/90 dark:bg-slate-700/70 dark:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!rescheduleDraft.date || rescheduleDraft.slots.length === 0 || rescheduleSubmitting}
                  onClick={submitRescheduleProposal}
                  className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {rescheduleSubmitting ? 'Sending...' : 'Send Available Slots'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {profilePreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:px-4">
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[3px] transition-opacity duration-[240ms]" onClick={() => setProfilePreview(null)} />
          <div className="relative max-h-[calc(100dvh-1.5rem)] w-full max-w-[700px] overflow-y-auto rounded-[26px] border border-white/55 bg-sky-50/82 p-4 shadow-[0_22px_48px_rgba(14,116,144,0.18)] backdrop-blur-2xl transition-all duration-[260ms] ease-out sm:w-[80%] sm:p-5 lg:w-[66%] dark:border-slate-600/45 dark:bg-slate-900/84">
            <button
              type="button"
              onClick={() => setProfilePreview(null)}
              className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/60 bg-white/50 text-slate-700 transition-colors hover:text-sky-700 active:bg-white/65 dark:border-slate-600/45 dark:bg-slate-800/55 dark:text-slate-200 dark:hover:text-sky-300"
              aria-label="Close profile preview"
            >
              <X size={18} strokeWidth={2} />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="flex h-[118px] w-[118px] items-center justify-center overflow-hidden rounded-full border border-sky-200/70 bg-white/55 text-sky-700 shadow-[inset_0_2px_18px_rgba(255,255,255,0.55),0_16px_30px_rgba(14,116,144,0.14)] dark:border-sky-500/35 dark:bg-slate-800/55 dark:text-sky-300 sm:h-[126px] sm:w-[126px]">
                {resolveMediaUrl(profilePreview.profileImage?.filePath) ? (
                  <img src={resolveMediaUrl(profilePreview.profileImage?.filePath)} alt="" className="h-full w-full object-cover object-center" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center rounded-full bg-sky-100/60 dark:bg-slate-700/70">
                    <UserRound size={42} strokeWidth={1.8} />
                  </span>
                )}
              </div>
              <h3 className="mt-4 text-xl font-semibold text-slate-900 dark:text-slate-100">{profilePreview.name || 'Student'}</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{profilePreview.course || 'Course not added'}</p>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                ['College / University', profilePreview.college || 'Not added yet'],
                ['Course', profilePreview.course || 'Not added yet'],
                ['Mobile Number', profilePreview.phone || 'Not added yet']
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/55 bg-white/50 p-4 shadow-[0_10px_22px_rgba(14,116,144,0.08)] dark:border-slate-600/40 dark:bg-slate-800/50">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
                  <p className="mt-2 text-sm font-medium text-slate-900 dark:text-slate-100">{value}</p>
                </div>
              ))}
              <div className="rounded-2xl border border-white/55 bg-white/50 p-4 shadow-[0_10px_22px_rgba(14,116,144,0.08)] dark:border-slate-600/40 dark:bg-slate-800/50 sm:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Bio / About</p>
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-800 dark:text-slate-200">
                  {profilePreview.bio || 'No bio added yet.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {endSessionBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setEndSessionBooking(null)} />
          <div className="relative max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-y-auto liquid-glass-panel p-4 sm:p-5">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">End Interview Session?</h3>
            <p className="text-sm text-slate-700 dark:text-slate-300 mt-3">
              Are you sure you want to end this interview session?
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-300 mt-2">
              This action will close the active interview workflow and move you to the feedback submission section.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                onClick={() => setEndSessionBooking(null)}
                className="px-4 py-2 rounded-xl bg-white/80 dark:bg-slate-700/80 text-sm hover:bg-white/90 dark:hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const bookingId = endSessionBooking.id;
                  const ok = await handleStatusChange(bookingId, 'session_ended', null, '', 'Interview session ended by interviewer.');
                  if (ok) {
                    setEndSessionBooking(null);
                    setFeedbackForm(prev => ({ ...prev, [bookingId]: prev[bookingId] || {} }));
                  }
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm hover:bg-emerald-700 transition"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {refundDetailsBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:px-4">
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[3px]" onClick={() => setRefundDetailsBooking(null)} />
          <div className="relative max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-y-auto liquid-glass-panel p-4 sm:p-5">
            <button
              type="button"
              onClick={() => setRefundDetailsBooking(null)}
              className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white/70 dark:bg-slate-700/70"
              aria-label="Close refund details"
            >
              <X size={16} />
            </button>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Refund Details</h3>
            <div className="mt-4 space-y-2 text-sm text-slate-700 dark:text-slate-300">
              <p><span className="font-semibold">Student:</span> {refundDetailsBooking.refundSnapshot?.studentName || refundDetailsBooking.studentName || 'Student'}</p>
              <p><span className="font-semibold">Booking ID:</span> {refundDetailsBooking.bookingId || refundDetailsBooking.id}</p>
              <p><span className="font-semibold">Student Mobile:</span> {refundDetailsBooking.refundSnapshot?.studentMobile || 'Not provided'}</p>
              <p><span className="font-semibold">Refund Amount:</span> ₹{refundDetailsBooking.refundAmount || refundDetailsBooking.refundSnapshot?.paymentAmount || refundDetailsBooking.paymentAmount || 50}</p>
              <p><span className="font-semibold">UPI ID:</span> {refundDetailsBooking.refundSnapshot?.refundUpiSnapshot || 'Not provided'}</p>
              {refundDetailsBooking.refundUtr && <p><span className="font-semibold">UTR:</span> {refundDetailsBooking.refundUtr}</p>}
            </div>
            {refundDetailsBooking.refundSnapshot?.refundQrSnapshot?.filePath ? (
              <div className="mt-4 rounded-2xl border border-white/60 bg-white/60 p-3 dark:border-slate-600/45 dark:bg-slate-800/50">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Refund QR Code</p>
                <img
                  src={resolveMediaUrl(refundDetailsBooking.refundSnapshot.refundQrSnapshot.filePath)}
                  alt="Refund QR"
                  className="mx-auto aspect-square w-full max-w-56 rounded-xl bg-white object-contain p-2"
                />
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">No refund QR uploaded.</p>
            )}
          </div>
        </div>
      )}

      {studentContactBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:px-4">
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[3px]" onClick={() => setStudentContactBooking(null)} />
          <div className="relative max-h-[calc(100dvh-1.5rem)] w-full max-w-sm overflow-y-auto liquid-glass-panel p-4 sm:p-5">
            <button
              type="button"
              onClick={() => setStudentContactBooking(null)}
              className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white/70 dark:bg-slate-700/70"
              aria-label="Close student contact"
            >
              <X size={16} />
            </button>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Student Contact</h3>
            <div className="mt-4 space-y-2 text-sm text-slate-700 dark:text-slate-300">
              <p><span className="font-semibold">Student Name:</span> {studentContactBooking.studentName || studentContactBooking.studentProfile?.name || 'Student'}</p>
              <p><span className="font-semibold">Mobile Number:</span> {studentContactBooking.studentProfile?.phone || 'Not added yet'}</p>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={!studentContactBooking.studentProfile?.phone}
                onClick={() => navigator.clipboard?.writeText(studentContactBooking.studentProfile?.phone || '')}
                className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                Copy Number
              </button>
              <button
                type="button"
                onClick={() => setStudentContactBooking(null)}
                className="rounded-xl bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 dark:bg-slate-700/80 dark:text-slate-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <MeetingDetailsModal
        booking={meetingDetailsBooking}
        onClose={() => setMeetingDetailsBooking(null)}
        onCopy={copyMeetingLink}
        onOpen={openMeeting}
      />
    </div>
  );
}
