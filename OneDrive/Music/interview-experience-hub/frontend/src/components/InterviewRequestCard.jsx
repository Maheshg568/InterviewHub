import LiquidGlassPanel from './LiquidGlassPanel';
import { UserRound } from 'lucide-react';
import { resolveMediaUrl } from '../lib/mediaUrl';

const STATUS_CLASSES = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  accepted: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  confirmed: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300',
  rejected: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
  reschedule_requested: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300',
  reschedule_slot_selected: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300',
  expired: 'bg-slate-200 text-slate-700 dark:bg-slate-700/40 dark:text-slate-400',
  completed: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',
  cancelled: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
  no_response: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
  meeting_link_uploaded: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300',
  payment_verified: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  refund_required: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
  refund_proof_submitted: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  refund_disputed: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
  refund_completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  reassigned: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300'
};

export function getStatusClass(status) {
  return STATUS_CLASSES[status] || 'bg-slate-100 text-slate-700 dark:bg-slate-700/40 dark:text-slate-400';
}

function formatStatusLabel(status) {
  if (status === 'meeting_link_uploaded') return 'Meeting Link Uploaded';
  if (status === 'confirmed') return 'Booking Confirmed';
  if (status === 'session_ended') return 'Session Ended';
  if (status === 'pending') return 'Pending Interviewer Response';
  if (status === 'accepted') return 'Request Accepted';
  if (status === 'reschedule_requested') return 'New Slot Requested';
  if (status === 'reschedule_slot_selected') return 'New Slot Selected';
  if (status === 'refund_requested') return 'Refund Requested';
  if (status === 'refund_required') return 'Refund Required';
  if (status === 'refund_proof_submitted') return 'Refund Submitted';
  if (status === 'refund_disputed') return 'Refund Disputed';
  if (status === 'refund_completed') return 'Refund Completed';
  return (status || '').replace(/_/g, ' ');
}

export default function InterviewRequestCard({ booking, children, studentProfile, onStudentProfileClick, hasHangingTag = false }) {
  const statusClass = getStatusClass(booking.status);
  const profile = studentProfile || booking.studentProfile;
  const profileImageUrl = resolveMediaUrl(profile?.profileImage?.filePath);
  const profileButtonClass = hasHangingTag
    ? 'absolute right-[132px] top-[76px] flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-sky-200/70 bg-white/55 text-sky-700 shadow-[0_8px_18px_rgba(14,116,144,0.12)] transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-300/80 hover:bg-white/70 active:scale-[0.98] min-[360px]:right-[148px] sm:right-[168px] sm:top-[86px] sm:h-12 sm:w-12 md:right-[189px] md:top-[96px] md:h-[52px] md:w-[52px] dark:border-sky-500/35 dark:bg-slate-800/55 dark:text-sky-300'
    : 'absolute right-4 top-[54px] flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-sky-200/70 bg-white/55 text-sky-700 shadow-[0_8px_18px_rgba(14,116,144,0.12)] transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-300/80 hover:bg-white/70 active:scale-[0.98] sm:right-5 sm:h-12 sm:w-12 md:h-[52px] md:w-[52px] dark:border-sky-500/35 dark:bg-slate-800/55 dark:text-sky-300';

  return (
    <LiquidGlassPanel className={`ieh-request-card relative min-w-0 p-4 sm:p-5 ${hasHangingTag ? 'min-h-[310px] pr-[118px] min-[360px]:pr-[136px] sm:min-h-[340px] sm:pr-[158px] md:min-h-[366px] md:pr-[250px]' : ''}`}>
      <div className="mb-2 flex min-w-0 items-start justify-between gap-3">
        <h3 className="min-w-0 text-lg font-semibold text-slate-900 dark:text-slate-100">{booking.studentName || 'Interview Request'}</h3>
        <span className={`ieh-status-pill max-w-[54%] shrink-0 rounded-full px-2 py-1 text-xs ${statusClass}`}>
          {formatStatusLabel(booking.status)}
        </span>
      </div>
      {profile && onStudentProfileClick && (
        <button
          type="button"
          onClick={() => onStudentProfileClick(profile)}
          className={profileButtonClass}
          aria-label={`Preview ${profile.name || booking.studentName || 'student'} profile`}
        >
          {profileImageUrl ? (
            <img src={profileImageUrl} alt="" className="h-full w-full object-cover object-center" />
          ) : (
            <span className="flex h-full w-full items-center justify-center rounded-full bg-sky-100/60 dark:bg-slate-700/70">
              <UserRound size={22} strokeWidth={1.9} />
            </span>
          )}
        </button>
      )}
      <p className="mb-2 text-sm text-slate-700 dark:text-slate-300">Topic: {booking.domain || 'General Interview'}</p>
      <p className="mb-2 text-xs font-semibold text-sky-700 dark:text-sky-300">Booking ID: {booking.bookingId || booking.id}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Created: {new Date(booking.createdAt).toLocaleString()}</p>
      {booking.approvalDeadlineAt && (
        <p className="text-xs text-rose-700 dark:text-rose-400 mb-3">Approval deadline: {new Date(booking.approvalDeadlineAt).toLocaleString()}</p>
      )}
      {children}
    </LiquidGlassPanel>
  );
}
