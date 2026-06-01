import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getApiErrorMessage } from '../lib/apiClient';
import NotificationItem from '../components/NotificationItem';
import { sortNotificationsNewestFirst } from '../lib/notifications';

export default function Notifications() {
  const [role, setRole] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadNotifications = async () => {
    try {
      const [meResult, bookingsResult] = await Promise.all([
        api.get('/api/auth/me'),
        api.get('/api/bookings/my-bookings')
      ]);
      const currentRole = meResult.data?.user?.role || '';
      setRole(currentRole);
      const bookingNotifications = (bookingsResult.data?.bookings || [])
        .flatMap(booking => (booking.notifications || [])
          .filter(notification => notification.recipientRole === currentRole)
          .map(notification => ({
            ...notification,
            bookingId: booking.bookingId || booking.id
          })));
      setNotifications(sortNotificationsNewestFirst(bookingNotifications));
      setError('');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load notifications.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = window.setInterval(loadNotifications, 15000);
    return () => window.clearInterval(interval);
  }, []);

  const dashboardPath = role === 'interviewer' ? '/interviewer-dashboard' : '/student-dashboard';

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Notifications</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Newest first</p>
        </div>
        <Link to={dashboardPath} className="rounded-xl bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 shadow-[0_8px_18px_rgba(14,116,144,0.08)] dark:bg-slate-700/80 dark:text-slate-100">
          Back to Dashboard
        </Link>
      </div>

      {loading && <div className="liquid-glass-panel p-4 text-sm text-slate-600 dark:text-slate-400">Loading notifications...</div>}
      {error && <div className="liquid-glass-panel p-4 text-sm text-rose-700 dark:text-rose-400">{error}</div>}

      <div className="space-y-3">
        {!loading && notifications.map(notification => (
          <div key={`${notification.bookingId}-${notification.id}`} className="space-y-1">
            <NotificationItem notification={notification} showState />
            {notification.bookingId && (
              <p className="px-3 text-xs font-semibold text-sky-700 dark:text-sky-300">
                Booking ID: {notification.bookingId}
              </p>
            )}
          </div>
        ))}
        {!loading && notifications.length === 0 && (
          <div className="liquid-glass-panel p-5 text-center text-sm text-slate-500 dark:text-slate-400">
            No notifications yet.
          </div>
        )}
      </div>
    </div>
  );
}
