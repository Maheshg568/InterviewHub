import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { getApiErrorMessage } from '../lib/apiClient';
import { resolveMediaUrl } from '../lib/mediaUrl';
import { Users, UserCheck, Calendar, Clock, CheckCircle, AlertCircle, XCircle, MessageSquare, DollarSign, BarChart3 } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [interviewers, setInterviewers] = useState([]);
  const [students, setStudents] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [verificationRequests, setVerificationRequests] = useState([]);
  const [passwordResetRequests, setPasswordResetRequests] = useState([]);
  const [issuesDisputes, setIssuesDisputes] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [securityFilter, setSecurityFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  // Modals
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showInterviewerModal, setShowInterviewerModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [selectedStudentProfile, setSelectedStudentProfile] = useState(null);
  const [selectedInterviewerProfile, setSelectedInterviewerProfile] = useState(null);
  const [editingInterviewer, setEditingInterviewer] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);

  // Form states
  const [interviewerForm, setInterviewerForm] = useState({ name: '', email: '', phone: '', password: '', company: '', yearsOfExperience: '', specialization: '' });
  const [bookingAction, setBookingAction] = useState({ status: '', newDate: '', newSlot: '', newInterviewerId: '', message: '' });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    setError('');
    const results = await Promise.allSettled([
      api.get('/api/admin/stats'),
      api.get('/api/admin/bookings'),
      api.get('/api/admin/interviewers'),
      api.get('/api/admin/students'),
      api.get('/api/admin/feedback'),
      api.get('/api/admin/analytics'),
      api.get('/api/admin/verification-requests'),
      api.get('/api/admin/password-reset-requests'),
      api.get('/api/admin/issues-disputes')
    ]);

    if (results[0].status === 'fulfilled') setStats(results[0].value.data);
    if (results[1].status === 'fulfilled') setBookings(results[1].value.data.bookings || []);
    if (results[2].status === 'fulfilled') setInterviewers(results[2].value.data.interviewers || []);
    if (results[3].status === 'fulfilled') setStudents(results[3].value.data.students || []);
    if (results[4].status === 'fulfilled') setFeedback(results[4].value.data.feedback || []);
    if (results[5].status === 'fulfilled') setAnalytics(results[5].value.data);
    if (results[6].status === 'fulfilled') setVerificationRequests(results[6].value.data.requests || []);
    if (results[7].status === 'fulfilled') setPasswordResetRequests(results[7].value.data.requests || []);
    if (results[8].status === 'fulfilled') setIssuesDisputes(results[8].value.data.issues || []);

    const anyError = results.find(r => r.status === 'rejected');
    if (anyError) setError(getApiErrorMessage(anyError.reason, 'Failed to load some data'));
    setLoading(false);
  };

  const handleBookingAction = async (bookingId, action, extra = {}) => {
    setActionLoading(bookingId);
    try {
      const payload = { status: action, ...bookingAction, ...extra };
      await api.put(`/api/admin/bookings/${bookingId}`, payload);
      setShowBookingModal(false);
      setSelectedBooking(null);
      setBookingAction({ status: '', newDate: '', newSlot: '', newInterviewerId: '', message: '' });
      fetchAll();
    } catch (err) {
      alert(getApiErrorMessage(err, 'Action failed'));
    }
    setActionLoading(null);
  };

  const handleDeleteInterviewer = async (id) => {
    if (!confirm('Archive this interviewer? History will be preserved.')) return;
    try {
      await api.delete(`/api/admin/interviewers/${id}`);
      fetchAll();
    } catch (err) {
      alert(getApiErrorMessage(err, 'Failed to remove interviewer'));
    }
  };

  const handleToggleInterviewerStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
    try {
      await api.put(`/api/admin/interviewers/${id}/status`, { status: newStatus });
      fetchAll();
    } catch (err) {
      alert(getApiErrorMessage(err, 'Failed to update status'));
    }
  };

  const handleSaveInterviewer = async () => {
    try {
      if (editingInterviewer) {
        await api.put(`/api/admin/interviewers/${editingInterviewer.id}`, interviewerForm);
      } else {
        await api.post('/api/admin/interviewers', interviewerForm);
      }
      setShowInterviewerModal(false);
      setEditingInterviewer(null);
      setInterviewerForm({ name: '', email: '', phone: '', password: '', company: '', yearsOfExperience: '', specialization: '' });
      fetchAll();
    } catch (err) {
      alert(getApiErrorMessage(err, 'Failed to save interviewer'));
    }
  };

  const handleDeleteStudent = async (id) => {
    if (!confirm('Deactivate this student account? History will be preserved.')) return;
    try {
      await api.delete(`/api/admin/students/${id}`);
      fetchAll();
    } catch (err) {
      alert(getApiErrorMessage(err, 'Failed to remove student'));
    }
  };

  const handleRestoreStudent = async (id) => {
    try {
      await api.put(`/api/admin/students/${id}/status`, { status: 'active' });
      fetchAll();
    } catch (err) {
      alert(getApiErrorMessage(err, 'Failed to restore student'));
    }
  };

  const handleArchiveInterviewer = async (id) => handleDeleteInterviewer(id);

  const handleRestoreInterviewer = async (id) => {
    try {
      await api.put(`/api/admin/interviewers/${id}/status`, { status: 'active' });
      fetchAll();
    } catch (err) {
      alert(getApiErrorMessage(err, 'Failed to restore interviewer'));
    }
  };

  const handlePasswordResetAction = async (id, status) => {
    try {
      await api.put(`/api/admin/password-reset-requests/${id}/status`, { status });
      fetchAll();
    } catch (err) {
      alert(getApiErrorMessage(err, 'Failed to update password reset request'));
    }
  };

  const handleIssueAction = async (id, action) => {
    try {
      await api.put(`/api/admin/issues-disputes/${id}/status`, { action });
      fetchAll();
    } catch (err) {
      alert(getApiErrorMessage(err, 'Failed to update issue'));
    }
  };

  const openBookingModal = (booking) => {
    setSelectedBooking(booking);
    setBookingAction({ status: '', newDate: booking.selectedSlot?.date || booking.date || '', newSlot: booking.selectedSlot?.time || booking.slot || '', newInterviewerId: '', message: '' });
    setShowBookingModal(true);
  };

  const openInterviewerModal = (interviewer = null) => {
    setEditingInterviewer(interviewer);
    if (interviewer) {
      setInterviewerForm({ name: interviewer.name, email: interviewer.email, phone: interviewer.phone || '', password: '', company: interviewer.company || '', yearsOfExperience: String(interviewer.yearsOfExperience || ''), specialization: interviewer.specialization || '' });
    } else {
      setInterviewerForm({ name: '', email: '', phone: '', password: '', company: '', yearsOfExperience: '', specialization: '' });
    }
    setShowInterviewerModal(true);
  };

  const getStatusColor = (status) => {
    const map = {
      pending: 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300',
      pending_payment: 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300',
      pending_verification: 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300',
      accepted: 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300',
      confirmed: 'bg-sky-100 dark:bg-sky-900/40 text-sky-800 dark:text-sky-300',
      meeting_link_uploaded: 'bg-sky-100 dark:bg-sky-900/40 text-sky-800 dark:text-sky-300',
      completed: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300',
      approved: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300',
      cancelled: 'bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-300',
      cancelled_by_interviewer: 'bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-300',
      cancelled_by_student: 'bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-300',
      rejected: 'bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-300',
      no_response: 'bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-300',
      expired: 'bg-slate-100 dark:bg-slate-700/40 text-slate-600 dark:text-slate-400',
      declined: 'bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-300',
      reschedule_requested: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300',
      reassigned: 'bg-violet-100 dark:bg-violet-900/40 text-violet-800 dark:text-violet-300',
      refund_required: 'bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-300',
      refund_proof_submitted: 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300',
      refund_disputed: 'bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-300',
      refund_completed: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300',
      open: 'bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-300',
      under_review: 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300',
      resolved: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300'
    };
    return map[status] || 'bg-slate-100 dark:bg-slate-700/40 text-slate-700 dark:text-slate-400';
  };

  const getFeedbackStatus = (status) => {
    const map = { submitted: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300', skipped: 'bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-300', pending: 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300' };
    return map[status] || 'bg-slate-100 dark:bg-slate-700/40 text-slate-700 dark:text-slate-400';
  };

  const formatStatus = (status) => (status || '').replace(/_/g, ' ');

  const cards = [
    { label: 'Total Students', value: stats?.totalStudents ?? 0, icon: <Users size={20} />, color: 'text-sky-600' },
    { label: 'Total Interviewers', value: stats?.totalInterviewers ?? 0, icon: <UserCheck size={20} />, color: 'text-violet-600' },
    { label: 'Total Interviews', value: stats?.totalBookings ?? 0, icon: <Calendar size={20} />, color: 'text-indigo-600' },
    { label: 'Pending Requests', value: stats?.pendingRequests ?? 0, icon: <Clock size={20} />, color: 'text-amber-600' },
    { label: 'Completed', value: stats?.completedInterviews ?? 0, icon: <CheckCircle size={20} />, color: 'text-emerald-600' }
  ];

  const verificationGroups = [
    { title: 'Pending Verification', items: verificationRequests.filter(r => (r.requestType || 'new') === 'new' && r.status === 'pending') },
    { title: 'Verification Update Requests', items: verificationRequests.filter(r => r.requestType === 'update' && (r.status === 'update_pending' || r.status === 'pending')) },
    { title: 'On Hold', items: verificationRequests.filter(r => r.status === 'under_review') },
    { title: 'Declined', items: verificationRequests.filter(r => r.status === 'declined') },
    { title: 'Approved History', items: verificationRequests.filter(r => r.status === 'verified') }
  ];

  const passwordResetGroups = [
    { title: 'Pending', items: passwordResetRequests.filter(r => r.status === 'pending') },
    { title: 'Approved', items: passwordResetRequests.filter(r => r.status === 'approved') },
    { title: 'Completed', items: passwordResetRequests.filter(r => r.status === 'completed') },
    { title: 'Expired', items: passwordResetRequests.filter(r => r.status === 'expired') },
    { title: 'Declined', items: passwordResetRequests.filter(r => r.status === 'declined') }
  ].filter(group => securityFilter === 'all' || group.title.toLowerCase() === securityFilter);

  const issueGroups = [
    { title: 'Refund Disputes', items: issuesDisputes.filter(issue => issue.type === 'refund_dispute') },
    { title: 'Interview Issues', items: issuesDisputes.filter(issue => issue.type === 'interview_issue') }
  ];

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-8"><div className="liquid-glass-panel p-8 text-center text-slate-600">Loading admin dashboard...</div></div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Admin Dashboard</h1>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Link to="/admin/interview-journey-tracker" className="px-4 py-2 bg-white/80 rounded-xl text-sm hover:bg-white transition">
            Interview Journey Tracker
          </Link>
          <button onClick={fetchAll} className="px-4 py-2 bg-white/80 rounded-xl text-sm hover:bg-white transition">Refresh</button>
        </div>
      </div>

      {error && <div className="liquid-glass-panel p-4 bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 text-sm">{error}</div>}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {cards.map(c => (
          <div key={c.label} className="liquid-glass-panel p-4 text-center">
            <div className={`flex justify-center mb-2 ${c.color}`}>{c.icon}</div>
            <p className="text-2xl font-bold">{c.value}</p>
            <p className="text-xs text-slate-500 mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-white/40 pb-2">
        {['overview', 'bookings', 'interviewers', 'students', 'verification requests', 'security', 'issues & disputes', 'feedback', 'analytics'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm capitalize transition ${activeTab === tab ? 'bg-sky-600 text-white' : 'bg-white/70 text-slate-700 hover:bg-white/90'}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="liquid-glass-panel p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><BarChart3 size={20} /> Analytics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/70 rounded-xl p-4 text-center border border-white/60">
                <p className="text-3xl font-bold text-sky-700">{analytics?.interviewsThisWeek ?? 0}</p>
                <p className="text-sm text-slate-600 mt-1">Interviews This Week</p>
              </div>
              <div className="bg-white/70 rounded-xl p-4 text-center border border-white/60">
                <p className="text-3xl font-bold text-emerald-700">{analytics?.averageConfidence ?? '0'}</p>
                <p className="text-sm text-slate-600 mt-1">Average Confidence Score</p>
              </div>
              <div className="bg-white/70 rounded-xl p-4 text-center border border-white/60">
                <p className="text-lg font-bold text-violet-700 truncate">{analytics?.mostInteractiveInterviewer?.name || 'N/A'}</p>
                <p className="text-sm text-slate-600 mt-1">Most Interactive Interviewer ({analytics?.mostInteractiveInterviewer?.completedInterviews || 0} interviews)</p>
              </div>
            </div>
          </div>

          <div className="liquid-glass-panel p-6">
            <h2 className="text-xl font-semibold mb-4">Interviewer Status Overview</h2>
            <div className="space-y-3">
              {interviewers.map(int => {
                const intBookings = bookings.filter(b => b.interviewerId === int.id);
                const byStatus = (status) => intBookings.filter(b => b.status === status).length;
                return (
                  <div key={int.id} className="bg-white/70 rounded-xl p-4 border border-white/60 flex justify-between items-center">
                    <div>
                      <p className="font-bold">{int.name}</p>
                      <p className="text-xs text-slate-500">{int.email}</p>
                    </div>
                    <div className="flex gap-2 text-xs">
                      <span className="px-2 py-1 bg-amber-100 rounded">{byStatus('pending') + byStatus('pending_payment')} pending</span>
                      <span className="px-2 py-1 bg-emerald-100 rounded">{byStatus('completed')} completed</span>
                      <span className={`px-2 py-1 rounded ${int.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>{int.status}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* BOOKINGS TAB */}
      {activeTab === 'bookings' && (
        <div className="liquid-glass-panel p-6">
          <h2 className="text-xl font-semibold mb-4">All Bookings</h2>
          <div className="max-w-full overflow-x-visible sm:overflow-x-auto">
            <table className="responsive-table w-full text-sm">
              <thead>
                <tr className="border-b border-white/60">
                  <th className="text-left p-2">Student</th>
                  <th className="text-left p-2">Booking ID</th>
                  <th className="text-left p-2">Interviewer</th>
                  <th className="text-left p-2">Domain</th>
                  <th className="text-left p-2">Date/Time</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Payment</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b.id} className="border-b border-white/40 hover:bg-white/30">
                    <td data-label="Student" className="p-2 font-medium">{b.studentName}</td>
                    <td data-label="Booking ID" className="p-2 text-xs font-semibold text-sky-700 dark:text-sky-300">{b.bookingId || b.id}</td>
                    <td data-label="Interviewer" className="p-2">{b.interviewerName}</td>
                    <td data-label="Domain" className="p-2 text-slate-600">{b.domain || 'General'}</td>
                    <td data-label="Date/Time" className="p-2">{b.date} {b.slot}</td>
                    <td data-label="Status" className="p-2"><span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(b.status)}`}>{formatStatus(b.status)}</span></td>
                    <td data-label="Payment" className="p-2">
                      {b.paymentStatus ? <span className={`px-2 py-1 rounded text-xs ${b.paymentStatus === 'verified' ? 'bg-emerald-100' : b.paymentStatus === 'failed' ? 'bg-rose-100' : 'bg-amber-100'}`}>{b.paymentStatus}</span>
                       : b.paymentProof ? <span className="text-xs text-slate-500">Uploaded</span> : <span className="text-xs text-slate-400">None</span>}
                    </td>
                    <td data-label="Actions" className="p-2">
                      <button onClick={() => openBookingModal(b)} className="text-sky-600 hover:underline text-xs">Manage</button>
                    </td>
                  </tr>
                ))}
                {bookings.length === 0 && <tr><td colSpan={8} className="p-4 text-center text-slate-400">No bookings found</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* INTERVIEWERS TAB */}
      {activeTab === 'interviewers' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => openInterviewerModal()} className="bg-sky-600 text-white px-4 py-2 rounded-xl text-sm">+ Add Interviewer</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {interviewers.map(int => (
              <div key={int.id} className="liquid-glass-panel p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-violet-600 rounded-full flex items-center justify-center text-white font-bold">{int.name.charAt(0)}</div>
                    <div>
                      <p className="font-bold">{int.name}</p>
                      <p className="text-xs text-slate-500">{int.email}</p>
                      <p className="text-xs text-slate-500">{int.company || 'Independent'}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${int.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>{int.status}</span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                  <span>{int.yearsOfExperience || 0} yrs exp</span>
                  {int.specialization && <span>Specialization: {int.specialization}</span>}
                  {int.primaryExpertise && <span>Expertise: {int.primaryExpertise}</span>}
                  <span>Profile: {int.profileCompletion || 0}%</span>
                  <span>{int.completedBookings || 0} completed</span>
                  <span>{int.pendingBookings || 0} pending</span>
                </div>
                <div className="rounded-xl border border-white/60 bg-white/55 p-3 text-xs text-slate-700 dark:border-slate-600/45 dark:bg-slate-800/45 dark:text-slate-300">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">Verification: {(int.verification?.status || 'required').replace(/_/g, ' ')}</span>
                    {int.verification?.filePath && (
                      <a href={resolveMediaUrl(int.verification.filePath)} target="_blank" rel="noopener noreferrer" className="text-sky-700 hover:underline dark:text-sky-300">
                        View document
                      </a>
                    )}
                  </div>
                  {int.verification?.status === 'rejected' && int.verification?.rejectionReason && (
                    <p className="mt-1 text-rose-700 dark:text-rose-300">Reason: {int.verification.rejectionReason}</p>
                  )}
                </div>
                {int.lastProfileEditedAt && (
                  <div className="rounded-xl border border-white/60 bg-white/55 p-3 text-xs text-slate-700 dark:border-slate-600/45 dark:bg-slate-800/45 dark:text-slate-300">
                    <p className="font-medium text-sky-700 dark:text-sky-300">Profile Updated</p>
                    <p>Last Edited: {new Date(int.lastProfileEditedAt).toLocaleDateString()} {new Date(int.lastProfileEditedAt).toLocaleTimeString()}</p>
                    <button onClick={() => setSelectedInterviewerProfile(int)} className="mt-1 text-sky-600 hover:underline">View Changes</button>
                  </div>
                )}
                <div className="flex flex-wrap gap-2 pt-2">
                  <button onClick={() => setSelectedInterviewerProfile(int)} className="px-3 py-1 bg-white/80 rounded-lg text-xs">View Profile</button>
                  <button onClick={() => openInterviewerModal(int)} className="px-3 py-1 bg-white/80 rounded-lg text-xs">Edit</button>
                  {int.status === 'archived' ? (
                    <button onClick={() => handleRestoreInterviewer(int.id)} className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs">Restore</button>
                  ) : (
                    <>
                      <button onClick={() => handleToggleInterviewerStatus(int.id, int.status)} className="px-3 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs">{int.status === 'active' ? 'Disable' : 'Enable'}</button>
                      <button onClick={() => handleArchiveInterviewer(int.id)} className="px-3 py-1 bg-rose-100 text-rose-800 rounded-lg text-xs">Archive</button>
                    </>
                  )}
                </div>
              </div>
            ))}
            {interviewers.length === 0 && <p className="text-slate-500 col-span-2 text-center py-8">No interviewers yet</p>}
          </div>
        </div>
      )}

      {activeTab === 'verification requests' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Verification Requests</h2>
          <div className="space-y-5">
            {verificationGroups.map(group => (
              <div key={group.title} className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{group.title}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {group.items.map(req => {
                    const profile = req.profile || {};
                    const statusLabel = {
                      pending: 'Pending Approval',
                      update_pending: 'Verification Update Pending',
                      under_review: 'On Hold',
                      verified: 'Verified',
                      declined: 'Declined'
                    }[req.status] || req.status;
                    return (
                      <Link key={req.id} to={`/admin/verification-requests/${req.id}`} className="liquid-glass-panel p-4 transition hover:bg-white/50">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-white/70 bg-white/70">
                              {resolveMediaUrl(req.profileImage?.filePath) ? (
                                <img src={resolveMediaUrl(req.profileImage.filePath)} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">No Image</div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-bold text-slate-900 dark:text-slate-100">{profile.name || 'Interviewer'}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">{profile.company || 'Independent'}</p>
                            </div>
                          </div>
                          <span className="shrink-0 rounded-full bg-white/80 px-2 py-1 text-xs font-medium text-slate-700 dark:bg-slate-700/80 dark:text-slate-200">{statusLabel}</span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-300">
                          <span>{profile.yearsOfExperience || 0} yrs exp</span>
                          <span>{profile.primaryExpertise || 'No expertise added'}</span>
                        </div>
                      </Link>
                    );
                  })}
                  {group.items.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">No requests</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Security</h2>
          <div className="liquid-glass-panel p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Password Reset Requests</h3>
              <div className="flex flex-wrap gap-2">
                {['all', 'pending', 'approved', 'completed', 'expired', 'declined'].map(status => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setSecurityFilter(status)}
                    className={`rounded-xl px-3 py-1 text-xs font-medium capitalize ${securityFilter === status ? 'bg-sky-600 text-white' : 'bg-white/70 text-slate-700 hover:bg-white/90'}`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-5 space-y-5">
              {passwordResetGroups.map(group => (
                <div key={group.title} className="space-y-3">
                  <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{group.title}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {group.items.map(req => (
                      <div key={req.id} className="rounded-2xl border border-white/60 bg-white/60 p-4 text-sm dark:border-slate-600/45 dark:bg-slate-800/45">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-bold text-slate-900 dark:text-slate-100">{req.name}</p>
                            <p className="text-xs capitalize text-slate-500 dark:text-slate-400">{req.userRole}</p>
                          </div>
                          <span className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(req.status)}`}>{formatStatus(req.status)}</span>
                        </div>
                        <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-slate-600 dark:text-slate-300">
                          <p>Email: {req.email}</p>
                          <p>Mobile: {req.phone}</p>
                          <p>{req.organizationType === 'college' ? 'College' : 'Company'}: {req.organization || 'N/A'}</p>
                          <p>Account Created: {req.accountCreatedAt ? new Date(req.accountCreatedAt).toLocaleString() : 'N/A'}</p>
                          <p>Last Login: {req.lastLoginAt ? new Date(req.lastLoginAt).toLocaleString() : 'N/A'}</p>
                          <p>Request Date: {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : 'N/A'}</p>
                          <p>Request Time: {req.createdAt ? new Date(req.createdAt).toLocaleTimeString() : 'N/A'}</p>
                          <p>Reason: {req.reason || 'Not provided'}</p>
                          {req.approvedAt && <p>Approved: {new Date(req.approvedAt).toLocaleString()}</p>}
                          {req.expiresAt && <p>Expires: {new Date(req.expiresAt).toLocaleString()}</p>}
                          {req.completedAt && <p>Completed: {new Date(req.completedAt).toLocaleString()}</p>}
                          {req.declinedAt && <p>Declined: {new Date(req.declinedAt).toLocaleString()}</p>}
                        </div>
                        {req.status === 'pending' && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            <button onClick={() => handlePasswordResetAction(req.id, 'approved')} className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-medium text-white">Approve</button>
                            <button onClick={() => handlePasswordResetAction(req.id, 'declined')} className="rounded-xl bg-rose-600 px-3 py-2 text-xs font-medium text-white">Decline</button>
                          </div>
                        )}
                      </div>
                    ))}
                    {group.items.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">No requests</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STUDENTS TAB */}
      {activeTab === 'students' && (
        <div className="liquid-glass-panel p-6">
          <h2 className="text-xl font-semibold mb-4">Student Management</h2>
          <div className="max-w-full overflow-x-visible sm:overflow-x-auto">
            <table className="responsive-table w-full text-sm">
              <thead>
                <tr className="border-b border-white/60">
                  <th className="text-left p-2">Name</th>
                  <th className="text-left p-2">Email</th>
                  <th className="text-left p-2">College</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Bookings</th>
                  <th className="text-left p-2">Resumes</th>
                  <th className="text-left p-2">Last Active</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map(s => (
                  <tr key={s.id} className="border-b border-white/40 hover:bg-white/30">
                    <td data-label="Name" className="p-2 font-medium">{s.name}</td>
                    <td data-label="Email" className="p-2 text-slate-600">{s.email}</td>
                    <td data-label="College" className="p-2 text-xs text-slate-500">{s.college || 'N/A'}</td>
                    <td data-label="Status" className="p-2 text-xs text-slate-500">{s.status || 'active'}</td>
                    <td data-label="Bookings" className="p-2 text-center">{s.totalBookings || 0}</td>
                    <td data-label="Resumes" className="p-2 text-center">{s.resumesCount || 0}</td>
                    <td data-label="Last Active" className="p-2 text-xs text-slate-500">{s.lastActive ? new Date(s.lastActive).toLocaleDateString() : 'N/A'}</td>
                    <td data-label="Actions" className="p-2">
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => setSelectedStudentProfile(s)} className="text-sky-600 hover:underline text-xs">View Profile</button>
                        {s.status === 'disabled' ? (
                          <button onClick={() => handleRestoreStudent(s.id)} className="text-emerald-600 hover:underline text-xs">Restore</button>
                        ) : (
                          <button onClick={() => handleDeleteStudent(s.id)} className="text-rose-600 hover:underline text-xs">Remove</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {students.length === 0 && <tr><td colSpan={8} className="p-4 text-center text-slate-400">No students found</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'issues & disputes' && (
        <div className="space-y-5">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Issues & Disputes</h2>
          {issueGroups.map(group => (
            <div key={group.title} className="liquid-glass-panel p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{group.title}</h3>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {group.items.map(issue => (
                  <div key={issue.id} className="rounded-2xl border border-white/60 bg-white/60 p-4 text-sm dark:border-slate-600/45 dark:bg-slate-800/45">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-slate-100">{issue.displayBookingId || issue.bookingId}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Student: {issue.studentName || 'Student'}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Interviewer: {issue.interviewerName || 'Interviewer'}</p>
                      </div>
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(issue.status)}`}>{formatStatus(issue.status)}</span>
                    </div>
                    <div className="mt-3 space-y-1 text-xs text-slate-600 dark:text-slate-300">
                      {issue.type === 'refund_dispute' ? (
                        <>
                          <p>Refund Requested: {issue.refundRequestedAt ? new Date(issue.refundRequestedAt).toLocaleString() : 'N/A'}</p>
                          <p>Dispute: {issue.disputeAt ? new Date(issue.disputeAt).toLocaleString() : 'N/A'}</p>
                          {issue.refundProof?.filePath && (
                            <a href={resolveMediaUrl(issue.refundProof.filePath)} target="_blank" rel="noopener noreferrer" className="text-sky-700 hover:underline dark:text-sky-300">
                              View Refund Screenshot
                            </a>
                          )}
                        </>
                      ) : (
                        <>
                          <p>Duration: {issue.interviewDurationMinutes ?? 'N/A'} minutes</p>
                          <p>Reported: {[issue.issueDate, issue.issueTime].filter(Boolean).join(' ') || 'N/A'}</p>
                        </>
                      )}
                      <p>Comment: {issue.studentComment || 'No comment provided'}</p>
                      {issue.adminDecision && <p>Decision: {formatStatus(issue.adminDecision)}</p>}
                    </div>
                    {issue.type === 'refund_dispute' && issue.status !== 'resolved' && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button onClick={() => handleIssueAction(issue.id, 'approve_student')} className="rounded-xl bg-amber-600 px-3 py-2 text-xs font-medium text-white">Approve Student</button>
                        <button onClick={() => handleIssueAction(issue.id, 'approve_interviewer')} className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-medium text-white">Approve Interviewer</button>
                        <button onClick={() => handleIssueAction(issue.id, 'request_more_evidence')} className="rounded-xl bg-white/80 px-3 py-2 text-xs font-medium text-slate-700">Request More Evidence</button>
                      </div>
                    )}
                    {issue.type === 'interview_issue' && issue.status !== 'resolved' && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button onClick={() => handleIssueAction(issue.id, 'request_more_evidence')} className="rounded-xl bg-white/80 px-3 py-2 text-xs font-medium text-slate-700">Request More Evidence</button>
                        <button onClick={() => handleIssueAction(issue.id, 'resolve')} className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-medium text-white">Resolve</button>
                      </div>
                    )}
                  </div>
                ))}
                {group.items.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">No records</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FEEDBACK TAB */}
      {activeTab === 'feedback' && (
        <div className="liquid-glass-panel p-6">
          <h2 className="text-xl font-semibold mb-4">Feedback Monitoring</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {['all', 'submitted', 'skipped', 'pending'].map(f => (
              <span key={f} className="px-3 py-1 bg-white/80 rounded-full text-xs text-slate-600 capitalize">{f}</span>
            ))}
          </div>
          <div className="space-y-3">
            {feedback.map(f => (
              <div key={f.id} className="bg-white/70 rounded-xl p-4 border border-white/60">
                <div className="flex flex-wrap justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">{f.domain} - {f.date}</p>
                    <p className="text-xs text-slate-500">Student: {f.studentName} | Interviewer: {f.interviewerName}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(f.status)}`}>{f.status}</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getFeedbackStatus(f.feedbackStatus)}`}>{f.feedbackStatus}</span>
                  </div>
                </div>
                {f.feedback ? (
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs bg-white/50 rounded-lg p-2 min-[420px]:grid-cols-5">
                    <span>Tech: <strong>{f.feedback.technical}/10</strong></span>
                    <span>Comm: <strong>{f.feedback.communication}/10</strong></span>
                    <span>Beh: <strong>{f.feedback.behaviour}/10</strong></span>
                    <span>Conf: <strong>{f.feedback.confidence}/10</strong></span>
                    <span>Resume: <strong>{f.feedback.resumeScore}/10</strong></span>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-rose-600">No feedback submitted</p>
                )}
              </div>
            ))}
            {feedback.length === 0 && <p className="text-slate-400 text-center py-8">No feedback records</p>}
          </div>
        </div>
      )}

      {/* ANALYTICS TAB */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="liquid-glass-panel p-6">
            <h2 className="text-xl font-semibold mb-4">Interviewer Performance</h2>
            <div className="space-y-3">
              {(analytics?.interviewerMetrics || []).map((m, i) => (
                <div key={m.interviewerId} className="bg-white/70 rounded-xl p-3 border border-white/60">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-sm">{i + 1}. {m.name}</span>
                    <span className="text-xs text-slate-500">{m.completedInterviews} interviews | Avg conf: {m.avgConfidence}</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className="bg-sky-500 h-2 rounded-full" style={{ width: `${Math.min(100, (m.completedInterviews / Math.max(1, analytics?.interviewerMetrics?.[0]?.completedInterviews || 1)) * 100)}%` }} />
                  </div>
                </div>
              ))}
              {(!analytics?.interviewerMetrics || analytics.interviewerMetrics.length === 0) && <p className="text-slate-400 text-center py-4">No interview data yet</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="liquid-glass-panel p-6 text-center">
              <p className="text-4xl font-bold text-sky-700">{analytics?.interviewsThisWeek ?? 0}</p>
              <p className="text-sm text-slate-600 mt-2">Interviews This Week</p>
            </div>
            <div className="liquid-glass-panel p-6 text-center">
              <p className="text-4xl font-bold text-emerald-700">{analytics?.averageConfidence ?? '0'}</p>
              <p className="text-sm text-slate-600 mt-2">Average Confidence Score</p>
            </div>
            <div className="liquid-glass-panel p-6 text-center">
              <p className="text-lg font-bold text-violet-700 truncate">{analytics?.mostInteractiveInterviewer?.name || 'N/A'}</p>
              <p className="text-sm text-slate-600 mt-2">Most Active Interviewer</p>
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="liquid-glass-panel p-4 sm:p-6 max-w-lg w-full max-h-[calc(100dvh-1.5rem)] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Manage Booking</h2>
            <div className="space-y-3 text-sm">
              <div className="bg-white/70 rounded-lg p-3">
                <p><strong>Student:</strong> {selectedBooking.studentName}</p>
                <p><strong>Interviewer:</strong> {selectedBooking.interviewerName}</p>
                <p><strong>Domain:</strong> {selectedBooking.domain || 'General'}</p>
                <p><strong>Status:</strong> <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(selectedBooking.status)}`}>{selectedBooking.status}</span></p>
                <p><strong>Date/Time:</strong> {selectedBooking.date} {selectedBooking.slot}</p>
                {selectedBooking.utiNumber && <p><strong>UTI Number:</strong> {selectedBooking.utiNumber}</p>}
                {selectedBooking.paymentProof && <p><strong>Payment Proof:</strong> <a href={selectedBooking.paymentProof} target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline">View</a></p>}
                {selectedBooking.paymentStatus && <p><strong>Payment Status:</strong> <span className={`px-2 py-0.5 rounded text-xs ${selectedBooking.paymentStatus === 'verified' ? 'bg-emerald-100' : 'bg-amber-100'}`}>{selectedBooking.paymentStatus}</span></p>}
              </div>

              <div className="flex flex-col gap-2">
                <h3 className="font-semibold">Update Status</h3>
                <div className="flex flex-wrap gap-2">
                  {['accepted', 'confirmed', 'completed', 'cancelled'].map(s => (
                    <button key={s} onClick={() => handleBookingAction(selectedBooking.id, s)} disabled={actionLoading === selectedBooking.id}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium ${selectedBooking.status === s ? 'bg-sky-600 text-white' : 'bg-white/80 text-slate-700 hover:bg-white'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Reschedule</h3>
                <input type="date" value={bookingAction.newDate} onChange={e => setBookingAction({ ...bookingAction, newDate: e.target.value })} className="glass-input text-sm" />
                <input type="text" value={bookingAction.newSlot} onChange={e => setBookingAction({ ...bookingAction, newSlot: e.target.value })} placeholder="Time slot (e.g. 05:00 PM – 07:00 PM)" className="glass-input text-sm" />
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Reassign Interviewer</h3>
                <select value={bookingAction.newInterviewerId} onChange={e => setBookingAction({ ...bookingAction, newInterviewerId: e.target.value })} className="glass-input text-sm">
                  <option value="">Select interviewer...</option>
                  {interviewers.filter(i => i.id !== selectedBooking.interviewerId).map(i => (
                    <option key={i.id} value={i.id}>{i.name} ({i.email})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Admin Message</h3>
                <input type="text" value={bookingAction.message} onChange={e => setBookingAction({ ...bookingAction, message: e.target.value })} placeholder="Optional message..." className="glass-input text-sm" />
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <button onClick={() => handleBookingAction(selectedBooking.id, selectedBooking.status, { newDate: bookingAction.newDate, newSlot: bookingAction.newSlot, newInterviewerId: bookingAction.newInterviewerId, message: bookingAction.message })} disabled={actionLoading === selectedBooking.id}
                  className="px-4 py-2 bg-sky-600 text-white rounded-xl text-sm">
                  {actionLoading === selectedBooking.id ? 'Saving...' : 'Save Changes'}
                </button>
                <button onClick={() => { setShowBookingModal(false); setSelectedBooking(null); }} className="px-4 py-2 bg-white/80 rounded-xl text-sm">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedStudentProfile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="liquid-glass-panel p-4 sm:p-6 max-w-3xl w-full max-h-[calc(100dvh-1.5rem)] overflow-y-auto">
            <div className="flex justify-between items-start gap-4">
              <h2 className="text-xl font-bold mb-4">Student Profile</h2>
              <button onClick={() => setSelectedStudentProfile(null)} className="px-3 py-1 bg-white/80 rounded-lg text-xs">Close</button>
            </div>
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <div className="h-20 w-20 rounded-full overflow-hidden border border-white/70 bg-white/70">
                {resolveMediaUrl(selectedStudentProfile.profileImage?.filePath) ? (
                  <img src={resolveMediaUrl(selectedStudentProfile.profileImage.filePath)} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-xs text-slate-500">No Image</div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-lg font-bold">{selectedStudentProfile.name}</p>
                <p className="text-sm text-slate-600">{selectedStudentProfile.email}</p>
                <p className="text-xs text-slate-500">Registered: {selectedStudentProfile.createdAt ? new Date(selectedStudentProfile.createdAt).toLocaleString() : 'N/A'}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {[
                ['Mobile Number', selectedStudentProfile.phone || 'N/A'],
                ['Course', selectedStudentProfile.course || 'N/A'],
                ['College', selectedStudentProfile.college || 'N/A'],
                ['Status', selectedStudentProfile.status || 'active'],
                ['Skills', (selectedStudentProfile.skillTags || []).join(', ') || 'N/A'],
                ['Resumes', `${selectedStudentProfile.resumesCount || 0} uploaded`]
              ].map(([label, value]) => (
                <div key={label} className="bg-white/70 rounded-xl border border-white/60 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
                  <p className="mt-1">{value}</p>
                </div>
              ))}
              <div className="bg-white/70 rounded-xl border border-white/60 p-3 sm:col-span-2">
                <p className="text-xs uppercase tracking-wide text-slate-500">Resume Information</p>
                <div className="mt-2 space-y-1">
                  {(selectedStudentProfile.resumes || []).map(r => <p key={r.id || r.fileName} className="text-sm">{r.fileName} · {r.uploadedAt ? new Date(r.uploadedAt).toLocaleDateString() : ''}</p>)}
                  {(selectedStudentProfile.resumes || []).length === 0 && <p className="text-sm text-slate-500">No resumes uploaded.</p>}
                </div>
              </div>
              <div className="bg-white/70 rounded-xl border border-white/60 p-3 sm:col-span-2">
                <p className="text-xs uppercase tracking-wide text-slate-500">Booking History</p>
                <div className="mt-2 space-y-1">
                  {bookings.filter(b => b.studentId === selectedStudentProfile.id).map(b => <p key={b.id} className="text-sm">{b.domain || 'General'} with {b.interviewerName} · {b.status}</p>)}
                  {bookings.filter(b => b.studentId === selectedStudentProfile.id).length === 0 && <p className="text-sm text-slate-500">No bookings yet.</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedInterviewerProfile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="liquid-glass-panel p-4 sm:p-6 max-w-3xl w-full max-h-[calc(100dvh-1.5rem)] overflow-y-auto">
            <div className="flex justify-between items-start gap-4">
              <h2 className="text-xl font-bold mb-4">Interviewer Profile</h2>
              <button onClick={() => setSelectedInterviewerProfile(null)} className="px-3 py-1 bg-white/80 rounded-lg text-xs">Close</button>
            </div>
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <div className="h-20 w-20 rounded-full overflow-hidden border border-white/70 bg-white/70">
                {resolveMediaUrl(selectedInterviewerProfile.profileImage?.filePath) ? (
                  <img src={resolveMediaUrl(selectedInterviewerProfile.profileImage.filePath)} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-xs text-slate-500">No Image</div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-lg font-bold">{selectedInterviewerProfile.name}</p>
                <p className="text-sm text-slate-600">{selectedInterviewerProfile.email}</p>
                <p className="text-xs text-slate-500">Verification: {selectedInterviewerProfile.verification?.status || 'required'}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {[
                ['Mobile Number', selectedInterviewerProfile.phone || 'N/A'],
                ['Age', selectedInterviewerProfile.age || 'N/A'],
                ['Experience', selectedInterviewerProfile.yearsOfExperience ? `${selectedInterviewerProfile.yearsOfExperience} Years` : 'N/A'],
                ['Company / Organization', selectedInterviewerProfile.company || 'N/A'],
                ['Primary Expertise', selectedInterviewerProfile.primaryExpertise || selectedInterviewerProfile.specialization || 'N/A'],
                ['Skills', (selectedInterviewerProfile.skillTags || []).join(', ') || 'N/A'],
                ['City', selectedInterviewerProfile.city || 'N/A'],
                ['Area', selectedInterviewerProfile.area || 'N/A'],
                ['Availability', (selectedInterviewerProfile.availabilityPreference || []).join(', ') || 'N/A'],
                ['Services Offered', (selectedInterviewerProfile.interviewServices || []).join(', ') || 'N/A'],
                ['Last Edited Date', selectedInterviewerProfile.lastProfileEditedAt ? new Date(selectedInterviewerProfile.lastProfileEditedAt).toLocaleDateString() : 'N/A'],
                ['Last Edited Time', selectedInterviewerProfile.lastProfileEditedAt ? new Date(selectedInterviewerProfile.lastProfileEditedAt).toLocaleTimeString() : 'N/A']
              ].map(([label, value]) => (
                <div key={label} className="bg-white/70 rounded-xl border border-white/60 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
                  <p className="mt-1">{value}</p>
                </div>
              ))}
              <div className="bg-white/70 rounded-xl border border-white/60 p-3 sm:col-span-2">
                <p className="text-xs uppercase tracking-wide text-slate-500">About</p>
                <p className="mt-1 whitespace-pre-line">{selectedInterviewerProfile.bio || 'N/A'}</p>
              </div>
              <div className="bg-white/70 rounded-xl border border-white/60 p-3 sm:col-span-2">
                <p className="text-xs uppercase tracking-wide text-slate-500">Verification History</p>
                <div className="mt-2 space-y-1">
                  {verificationRequests.filter(r => r.interviewerId === selectedInterviewerProfile.id).map(r => <p key={r.id} className="text-sm">{r.requestType || 'new'} · {r.status} · {r.createdAt ? new Date(r.createdAt).toLocaleString() : ''}</p>)}
                  {verificationRequests.filter(r => r.interviewerId === selectedInterviewerProfile.id).length === 0 && <p className="text-sm text-slate-500">No verification history.</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interviewer Modal */}
      {showInterviewerModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="liquid-glass-panel p-4 sm:p-6 max-w-md w-full max-h-[calc(100dvh-1.5rem)] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{editingInterviewer ? 'Edit Interviewer' : 'Add Interviewer'}</h2>
            <div className="space-y-3">
              <input type="text" placeholder="Name" value={interviewerForm.name} onChange={e => setInterviewerForm({ ...interviewerForm, name: e.target.value })} className="glass-input" required />
              <input type="email" placeholder="Email" value={interviewerForm.email} onChange={e => setInterviewerForm({ ...interviewerForm, email: e.target.value })} className="glass-input" required={!editingInterviewer} />
              {!editingInterviewer && <input type="password" placeholder="Password" value={interviewerForm.password} onChange={e => setInterviewerForm({ ...interviewerForm, password: e.target.value })} className="glass-input" required />}
              <input type="tel" placeholder="Phone" value={interviewerForm.phone} onChange={e => setInterviewerForm({ ...interviewerForm, phone: e.target.value })} className="glass-input" />
              <input type="text" placeholder="Company" value={interviewerForm.company} onChange={e => setInterviewerForm({ ...interviewerForm, company: e.target.value })} className="glass-input" />
              <input type="number" placeholder="Years of Experience" min="0" value={interviewerForm.yearsOfExperience} onChange={e => setInterviewerForm({ ...interviewerForm, yearsOfExperience: e.target.value })} className="glass-input" />
              <input type="text" placeholder="Specialization" value={interviewerForm.specialization} onChange={e => setInterviewerForm({ ...interviewerForm, specialization: e.target.value })} className="glass-input" />
              <div className="flex flex-wrap gap-2 pt-2">
                <button onClick={handleSaveInterviewer} className="px-4 py-2 bg-sky-600 text-white rounded-xl text-sm">{editingInterviewer ? 'Update' : 'Create'}</button>
                <button onClick={() => { setShowInterviewerModal(false); setEditingInterviewer(null); }} className="px-4 py-2 bg-white/80 rounded-xl text-sm">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
