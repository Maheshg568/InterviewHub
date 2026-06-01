import { getBookingDisplayId, getInterviewDateLabel, getInterviewTimeLabel } from '../lib/interviewLifecycle';

export default function MeetingDetailsModal({ booking, onClose, onCopy, onOpen }) {
  if (!booking) return null;

  const rows = [
    ['Booking ID', getBookingDisplayId(booking)],
    ['Student Name', booking.studentName || 'Student'],
    ['Interviewer Name', booking.interviewerName || 'Interviewer'],
    ['Interview Date', getInterviewDateLabel(booking)],
    ['Interview Time', getInterviewTimeLabel(booking)],
    ['Meeting Link', booking.meetingLink || 'Not uploaded yet'],
    ['Duration', booking.duration || booking.selectedSlot?.duration || 'Scheduled slot'],
    ['Payment Status', booking.paymentStatus || 'not_uploaded']
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-y-auto liquid-glass-panel p-4 sm:p-5">
        <button onClick={onClose} className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-sm text-slate-600 dark:bg-slate-800/70 dark:text-slate-200">X</button>
        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Meeting Details</h3>
        <div className="mt-4 space-y-2">
          {rows.map(([label, value]) => (
            <div key={label} className="rounded-xl border border-white/60 bg-white/55 p-3 text-sm dark:border-slate-600/45 dark:bg-slate-800/50">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
              <p className="mt-1 break-words text-slate-800 dark:text-slate-100">{value}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <button onClick={() => onCopy?.(booking.meetingLink || '')} disabled={!booking.meetingLink} className="rounded-xl bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-50 dark:bg-slate-700/80 dark:text-slate-100">
            Copy Link
          </button>
          <button onClick={() => onOpen?.(booking)} disabled={!booking.meetingLink} className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
            Open Meeting
          </button>
        </div>
      </div>
    </div>
  );
}
