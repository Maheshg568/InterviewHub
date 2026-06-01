import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';
import api, { getApiErrorMessage } from '../lib/apiClient';
import JourneyTrackerEngine from '../components/JourneyTrackerEngine';

const statusOptions = ['All', 'Active', 'Completed', 'Cancelled', 'Refund', 'Dispute'];

export default function AdminJourneyTracker() {
  const [filters, setFilters] = useState({
    bookingId: '',
    student: '',
    interviewer: '',
    status: 'All'
  });
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTrackers = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/api/admin/interview-journey-trackers', {
        params: filters
      });
      setRecords(res.data.records || []);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load journey tracker.'));
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(fetchTrackers, 250);
    return () => window.clearTimeout(timer);
  }, [filters]);

  useEffect(() => {
    const interval = window.setInterval(fetchTrackers, 15000);
    return () => window.clearInterval(interval);
  }, [filters]);

  const updateFilter = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="mx-auto max-w-7xl px-3 py-6 sm:px-4 md:px-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            to="/admin"
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/60 bg-white/65 text-slate-700 shadow-[0_10px_22px_rgba(14,116,144,0.08)] transition hover:text-sky-700"
            aria-label="Back to admin dashboard"
          >
            <ArrowLeft size={18} strokeWidth={2} />
          </Link>
          <div>
            <p className="text-sm font-medium text-sky-700 dark:text-sky-300">Admin Panel</p>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 md:text-3xl">Interview Journey Tracker</h1>
          </div>
        </div>
        <button
          type="button"
          onClick={fetchTrackers}
          className="rounded-full border border-white/65 bg-white/65 px-4 py-2 text-xs font-medium text-slate-600 shadow-[0_8px_20px_rgba(14,116,144,0.08)] transition hover:text-sky-700 dark:border-slate-600/45 dark:bg-slate-800/55 dark:text-slate-300"
        >
          Refresh Tracker
        </button>
      </div>

      <section className="liquid-glass-panel p-4 md:p-6">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Search Booking ID
            <div className="mt-2 flex items-center gap-2 rounded-2xl border border-white/60 bg-white/65 px-3 py-2 dark:border-slate-600/45 dark:bg-slate-800/55">
              <Search size={15} className="text-slate-400" />
              <input
                value={filters.bookingId}
                onChange={(event) => updateFilter('bookingId', event.target.value)}
                className="w-full bg-transparent text-sm normal-case tracking-normal text-slate-800 outline-none dark:text-slate-100"
                placeholder="BK-20260531-003"
              />
            </div>
          </label>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Search Student
            <input
              value={filters.student}
              onChange={(event) => updateFilter('student', event.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/60 bg-white/65 px-3 py-2 text-sm normal-case tracking-normal text-slate-800 outline-none dark:border-slate-600/45 dark:bg-slate-800/55 dark:text-slate-100"
              placeholder="Student name"
            />
          </label>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Search Interviewer
            <input
              value={filters.interviewer}
              onChange={(event) => updateFilter('interviewer', event.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/60 bg-white/65 px-3 py-2 text-sm normal-case tracking-normal text-slate-800 outline-none dark:border-slate-600/45 dark:bg-slate-800/55 dark:text-slate-100"
              placeholder="Interviewer name"
            />
          </label>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Status Filter
            <select
              value={filters.status}
              onChange={(event) => updateFilter('status', event.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/60 bg-white/65 px-3 py-2 text-sm normal-case tracking-normal text-slate-800 outline-none dark:border-slate-600/45 dark:bg-slate-800/55 dark:text-slate-100"
            >
              {statusOptions.map(option => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
        </div>
      </section>

      {error && (
        <div className="mt-5 liquid-glass-panel border border-rose-200/80 bg-rose-50/70 p-4 text-sm text-rose-700 dark:border-rose-700/45 dark:bg-rose-900/20 dark:text-rose-300">
          {error}
        </div>
      )}

      <div className="mt-6 space-y-6">
        {loading ? (
          <div className="liquid-glass-panel p-8 text-center text-sm text-slate-500">
            Loading tracker data...
          </div>
        ) : records.map(record => (
          <section key={record.id} className="rounded-[28px] border border-white/65 bg-white/40 p-4 shadow-[0_18px_46px_rgba(14,116,144,0.10)] backdrop-blur-xl md:p-6">
            <div className="grid grid-cols-1 gap-3 rounded-[22px] border border-white/60 bg-white/70 p-4 text-sm shadow-[0_8px_24px_rgba(0,0,0,0.04)] md:grid-cols-3 lg:grid-cols-6">
              {[
                ['Booking ID', record.bookingId],
                ['Student', record.studentName],
                ['Interviewer', record.interviewerName],
                ['Topic', record.topic],
                ['Status', record.status],
                ['Created Date', record.createdDate]
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
                  <p className="mt-1 font-semibold text-slate-900">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-[30px] bg-[#f8fafc] p-3 shadow-inner md:p-6">
              <JourneyTrackerEngine groups={record.groups} />
            </div>
          </section>
        ))}

        {!loading && records.length === 0 && (
          <div className="liquid-glass-panel p-8 text-center text-sm text-slate-500">
            No tracker records match the current filters.
          </div>
        )}
      </div>
    </div>
  );
}
