import {
  AlertTriangle,
  Ban,
  CalendarCheck,
  CheckCircle,
  CircleDot,
  Clock3,
  CreditCard,
  KeyRound,
  MessageSquare,
  RotateCcw,
  UserRound,
  Video
} from 'lucide-react';
import { resolveMediaUrl } from '../lib/mediaUrl';

const statusStyles = {
  completed: {
    label: 'Completed',
    bg: '#EAFBF1',
    border: '#22C55E',
    text: '#15803D',
    connector: '#22C55E'
  },
  pending: {
    label: 'Pending',
    bg: '#EEF6FF',
    border: '#3B82F6',
    text: '#1D4ED8',
    connector: '#3B82F6'
  },
  waiting: {
    label: 'Waiting',
    bg: '#FFF9E8',
    border: '#F59E0B',
    text: '#B45309',
    connector: '#F59E0B'
  },
  warning: {
    label: 'Warning',
    bg: '#FFF2E6',
    border: '#F97316',
    text: '#C2410C',
    connector: '#F97316'
  },
  failed: {
    label: 'Failed',
    bg: '#FEECEC',
    border: '#EF4444',
    text: '#B91C1C',
    connector: '#EF4444'
  },
  cancelled: {
    label: 'Cancelled',
    bg: '#F3F4F6',
    border: '#6B7280',
    text: '#374151',
    connector: '#6B7280'
  },
  future: {
    label: 'Pending',
    bg: '#F8FAFC',
    border: '#CBD5E1',
    text: '#64748B',
    connector: '#CBD5E1'
  }
};

const iconMap = {
  booking: CalendarCheck,
  payment: CreditCard,
  interview: Video,
  refund: RotateCcw,
  feedback: MessageSquare,
  password: KeyRound,
  user: UserRound,
  warning: AlertTriangle,
  failed: Ban,
  default: CircleDot
};

const getStatusStyle = (status) => statusStyles[String(status || '').toLowerCase()] || statusStyles.future;
const getConnectorColor = (connectorStatus) => getStatusStyle(connectorStatus).connector;

const formatTimestamp = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata'
  });
};

function EvidencePreview({ evidence, index }) {
  if (!evidence?.filePath) return null;

  const mediaUrl = resolveMediaUrl(evidence.filePath);
  const isPdf = String(evidence.filePath).toLowerCase().endsWith('.pdf');
  const title = evidence.label || (index === 0 ? 'Original Screenshot' : 'Reuploaded Screenshot');

  return (
    <div className="rounded-xl border border-white bg-white p-2 shadow-[0_6px_16px_rgba(15,23,42,0.05)]">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <div className="mt-2">
        {isPdf ? (
          <a href={mediaUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-sky-700 hover:underline">
            View PDF screenshot
          </a>
        ) : (
          <a href={mediaUrl} target="_blank" rel="noopener noreferrer">
            <img src={mediaUrl} alt={title} className="max-h-36 w-full rounded-lg border border-slate-100 object-contain bg-white" />
          </a>
        )}
      </div>
      <div className="mt-2 space-y-1">
        {evidence.utr && <p>UTR Number: {evidence.utr}</p>}
        {evidence.studentName && <p>Student Name: {evidence.studentName}</p>}
        {evidence.bookingId && <p>Booking ID: {evidence.bookingId}</p>}
        <p>Submission Date: {evidence.submissionDate || 'N/A'}</p>
        <p>Submission Time: {evidence.submissionTime || formatTimestamp(evidence.submittedAt) || 'N/A'}</p>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <a href={mediaUrl} target="_blank" rel="noopener noreferrer" className="rounded-full bg-sky-50 px-3 py-1 text-[11px] font-semibold text-sky-700">
          {evidence.viewLabel || 'View Full Screenshot'}
        </a>
        <a href={mediaUrl} download className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700">
          {evidence.downloadLabel || 'Download Screenshot'}
        </a>
      </div>
    </div>
  );
}

function EvidenceDetails({ details }) {
  const metadata = details?.metadata || {};
  const evidenceHistory = details?.evidenceHistory?.length
    ? details.evidenceHistory
    : metadata.evidenceHistory || [];
  const approval = metadata.approval || {};
  const rejection = metadata.rejection || {};
  const approverName = metadata.approverName || approval.approverName || approval.actor || '';
  const approvalTimestamp = metadata.approvalTimestamp || approval.approvalTimestamp || approval.at || '';
  const rejectedBy = metadata.rejectedBy || rejection.rejectedBy || rejection.actor || '';
  const rejectionReason = metadata.rejectionReason || rejection.rejectionReason || '';
  const rejectionTimestamp = metadata.rejectionTimestamp || rejection.rejectionTimestamp || rejection.at || '';

  if (!evidenceHistory.length && !approverName && !rejectedBy && !rejectionReason) return null;

  return (
    <div className="mt-3 space-y-3">
      {evidenceHistory.length > 0 && (
        <div className="space-y-2">
          <p className="font-semibold text-slate-700">{metadata.evidenceType === 'refund' ? 'Refund Evidence' : 'Payment Evidence'}</p>
          {evidenceHistory.map((evidence, index) => (
            <EvidencePreview key={evidence.id || evidence.filePath || index} evidence={evidence} index={index} />
          ))}
        </div>
      )}
      {approverName && (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-emerald-800">
          <p>Approver Name: {approverName}</p>
          <p>Approval Timestamp: {formatTimestamp(approvalTimestamp) || 'N/A'}</p>
        </div>
      )}
      {(rejectedBy || rejectionReason) && (
        <div className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-rose-800">
          <p>Rejection Reason: {rejectionReason || 'N/A'}</p>
          <p>Rejected By: {rejectedBy || 'N/A'}</p>
          <p>Rejection Timestamp: {formatTimestamp(rejectionTimestamp) || 'N/A'}</p>
        </div>
      )}
    </div>
  );
}

function TrackerNode({ step, index }) {
  const style = getStatusStyle(step.status);
  const Icon = iconMap[step.icon] || iconMap.default;
  const label = `${step.name}. Status: ${style.label}. ${step.actor ? `Actor: ${step.actor}.` : ''}`;

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className="relative z-10 flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full bg-white shadow-[0_8px_24px_rgba(0,0,0,0.08)] outline-none transition-transform duration-200 focus-visible:ring-4 focus-visible:ring-sky-200"
      style={{ border: `2px solid ${style.border}`, color: style.text }}
    >
      <Icon size={28} strokeWidth={2} />
      <span className="sr-only">Milestone {index + 1}</span>
    </button>
  );
}

function MilestoneCard({ step }) {
  const style = getStatusStyle(step.status);

  return (
    <article
      className="min-w-0 w-full rounded-[18px] bg-white p-3 shadow-[0_8px_24px_rgba(0,0,0,0.06)] sm:p-4 md:min-h-[96px] md:w-[320px] md:max-w-[320px]"
      style={{ border: `1px solid ${style.border}` }}
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <h4 className="min-w-0 text-sm font-bold text-slate-900">{step.name}</h4>
        <span
          className="shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold"
          style={{ background: style.bg, borderColor: style.border, color: style.text }}
        >
          {step.statusLabel || style.label}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-slate-600 min-[360px]:grid-cols-2">
        <p>{step.date || 'Date pending'}</p>
        <p>{step.time || 'Time pending'}</p>
      </div>
      {step.actor && <p className="mt-2 text-xs font-medium text-slate-700">Actor: {step.actor}</p>}
      {step.description && <p className="mt-2 text-xs leading-5 text-slate-500">{step.description}</p>}
      {step.details && (
        <details className="mt-3 min-w-0 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
          <summary className="cursor-pointer font-semibold text-slate-700">View Details</summary>
          <div className="mt-2 space-y-1">
            <p>Booking ID: {step.details.bookingId || 'N/A'}</p>
            <p>Actor: {step.details.actor || step.actor || 'N/A'}</p>
            <p>Date: {step.details.date || step.date || 'N/A'}</p>
            <p>Time: {step.details.time || step.time || 'N/A'}</p>
          </div>
          {Array.isArray(step.details.rows) && step.details.rows.length > 0 && (
            <div className="mt-3 grid grid-cols-1 gap-2">
              {step.details.rows.map(([label, value]) => (
                <div key={label} className="rounded-lg bg-white/70 px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
                  <p className="mt-1 break-words text-xs text-slate-700">{value || 'N/A'}</p>
                </div>
              ))}
            </div>
          )}
          <EvidenceDetails details={step.details} />
        </details>
      )}
    </article>
  );
}

function BranchList({ branches = [] }) {
  if (!branches.length) return null;

  return (
    <div className="mx-auto mt-4 grid min-w-0 w-full max-w-[520px] grid-cols-1 gap-3 sm:grid-cols-2">
      {branches.map(branch => {
        const style = getStatusStyle(branch.status);
        return (
          <div
            key={branch.id || branch.name}
            className="min-w-0 rounded-2xl bg-white/90 p-3 text-xs shadow-[0_8px_18px_rgba(0,0,0,0.05)]"
            style={{ border: `1px solid ${style.border}` }}
          >
            <p className="font-semibold" style={{ color: style.text }}>{branch.name}</p>
            <p className="mt-1 text-slate-500">{branch.description || branch.status}</p>
          </div>
        );
      })}
    </div>
  );
}

function TrackerStep({ step, index, total }) {
  const isLeft = index % 2 === 0;
  const connectorColor = getConnectorColor(step.connectorStatus || step.status);
  const lineHeight = index === total - 1 ? '0px' : '60px';

  return (
    <div className="relative">
      <div className="hidden md:grid md:grid-cols-[1fr_72px_1fr] md:items-center md:gap-4">
        <div className="flex justify-end">{isLeft && <MilestoneCard step={step} />}</div>
        <div className="relative flex justify-center">
          <TrackerNode step={step} index={index} />
          <div
            className="absolute left-1/2 top-[72px] w-2 -translate-x-1/2 rounded-full transition-colors duration-300"
            style={{ height: lineHeight, backgroundColor: connectorColor }}
            aria-hidden="true"
          />
        </div>
        <div className="flex justify-start">{!isLeft && <MilestoneCard step={step} />}</div>
      </div>

      <div className="flex min-w-0 flex-col items-center md:hidden">
        <TrackerNode step={step} index={index} />
        <div
          className="h-4 w-2 rounded-full"
          style={{ backgroundColor: connectorColor }}
          aria-hidden="true"
        />
        <MilestoneCard step={step} />
        {index < total - 1 && (
          <div
            className="my-3 h-8 w-2 rounded-full"
            style={{ backgroundColor: connectorColor }}
            aria-hidden="true"
          />
        )}
      </div>

      <BranchList branches={step.branches} />
    </div>
  );
}

export default function JourneyTrackerEngine({ groups = [] }) {
  if (!groups.length) {
    return (
      <div className="rounded-3xl border border-white/60 bg-white/65 p-6 text-center text-sm text-slate-500 shadow-[0_12px_30px_rgba(14,116,144,0.08)]">
        Tracker data is not available yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map(group => (
        <details key={group.id || group.title} className="min-w-0 rounded-3xl border border-white/60 bg-white/45 p-3 shadow-[0_14px_34px_rgba(14,116,144,0.08)] backdrop-blur-xl sm:p-4">
          <summary className="cursor-pointer list-none text-base font-semibold text-slate-900 outline-none transition-colors hover:text-sky-700 focus-visible:ring-4 focus-visible:ring-sky-200">
            <span className="mr-2 inline-block text-sky-700">▶</span>
            {group.title}
          </summary>
          <div className="relative mt-6 min-w-0 overflow-visible px-0 py-6 sm:px-3 md:px-8 md:py-8">
            <div
              className="pointer-events-none absolute left-1/2 top-8 hidden w-2 -translate-x-1/2 rounded-full bg-slate-200 md:block"
              style={{ height: `calc(100% - 64px)` }}
              aria-hidden="true"
            />
            <div className="space-y-[60px]">
              {(group.steps || []).map((step, index) => (
                <TrackerStep
                  key={step.id || `${group.id}-${index}`}
                  step={step}
                  index={index}
                  total={(group.steps || []).length}
                />
              ))}
            </div>
          </div>
        </details>
      ))}
    </div>
  );
}
