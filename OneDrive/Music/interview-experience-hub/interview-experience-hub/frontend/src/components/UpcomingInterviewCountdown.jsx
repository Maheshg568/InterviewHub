import { useEffect, useMemo, useState } from 'react';
import {
  getCountdownParts,
  getInterviewDateLabel,
  getInterviewStartMs,
  getInterviewTimeLabel,
  getNearestUpcomingBooking,
  getTimerEmphasis
} from '../lib/interviewLifecycle';

const pad = (value) => String(value).padStart(2, '0');

export default function UpcomingInterviewCountdown({ bookings, role, onJoin }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const upcoming = useMemo(() => getNearestUpcomingBooking(bookings, now), [bookings, now]);
  if (!upcoming) return null;

  const startsAt = getInterviewStartMs(upcoming);
  if (!startsAt) return null;

  const parts = getCountdownParts(startsAt, now);
  const emphasis = getTimerEmphasis(parts.diff);
  const nameLabel = role === 'interviewer' ? 'Student' : 'Interviewer';
  const nameValue = role === 'interviewer' ? upcoming.studentName : upcoming.interviewerName;
  const isStarting = parts.diff <= 0;
  const emphasisClass = {
    normal: 'border-sky-200/70 shadow-[0_22px_48px_rgba(14,116,144,0.14)]',
    soon: 'border-cyan-200/80 shadow-[0_22px_52px_rgba(8,145,178,0.18)]',
    urgent: 'border-amber-200/90 shadow-[0_22px_56px_rgba(217,119,6,0.18)]',
    critical: 'border-rose-200/90 shadow-[0_22px_60px_rgba(225,29,72,0.2)]'
  }[emphasis];

  return (
    <section className={`liquid-glass-panel overflow-hidden border ${emphasisClass} p-4 sm:p-6`}>
      <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-700 dark:text-sky-300">Upcoming Interview</p>
          <h2 className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100 sm:text-2xl">
            {nameLabel}: {nameValue || nameLabel}
          </h2>
          <div className="mt-3 flex flex-wrap gap-2 text-sm text-slate-600 dark:text-slate-300">
            <span>Interview Date: {getInterviewDateLabel(upcoming)}</span>
            <span>Interview Time (IST): {getInterviewTimeLabel(upcoming)}</span>
          </div>
        </div>
        {isStarting ? (
          <div className="w-full rounded-3xl border border-white/70 bg-white/70 p-4 text-center sm:min-w-[220px] dark:border-slate-600/50 dark:bg-slate-800/65">
            <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">Interview Starting Now</p>
            {upcoming.meetingLink && (
              <button onClick={() => onJoin?.(upcoming)} className="mt-3 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white">
                Join Interview
              </button>
            )}
          </div>
        ) : (
          <div className="grid w-full min-w-0 grid-cols-2 gap-2 min-[420px]:grid-cols-4 sm:gap-3 lg:w-auto">
            {[
              ['Days', parts.days],
              ['Hours', parts.hours],
              ['Minutes', parts.minutes],
              ['Seconds', parts.seconds]
            ].map(([label, value]) => (
              <div key={label} className="min-w-0 rounded-3xl border border-white/65 bg-sky-700/85 px-2 py-4 text-center text-white shadow-[inset_0_1px_18px_rgba(255,255,255,0.18),0_14px_28px_rgba(14,116,144,0.18)] backdrop-blur-xl sm:min-w-[96px] sm:px-3">
                <p className="text-3xl font-bold leading-none sm:text-5xl">{pad(value)}</p>
                <p className="mt-2 text-[11px] font-medium uppercase tracking-wide text-sky-100/85 sm:text-xs">{label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
