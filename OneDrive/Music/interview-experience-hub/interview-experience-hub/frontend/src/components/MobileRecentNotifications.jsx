import { Link } from 'react-router-dom';
import NotificationItem from './NotificationItem';
import { sortNotificationsNewestFirst } from '../lib/notifications';

export default function MobileRecentNotifications({ notifications = [], loading = false }) {
  const recentNotifications = sortNotificationsNewestFirst(notifications).slice(0, 3);

  return (
    <div className="space-y-3 md:hidden">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Recent Notifications</h2>
        <Link to="/notifications" className="shrink-0 text-sm font-semibold text-sky-700 dark:text-sky-300">
          View All Notifications &rarr;
        </Link>
      </div>
      <div className="space-y-2">
        {recentNotifications.map(notification => (
          <NotificationItem key={notification.id} notification={notification} showState compact />
        ))}
        {!loading && recentNotifications.length === 0 && (
          <div className="liquid-glass-panel p-3 text-sm text-slate-500 dark:text-slate-400">
            No notifications yet.
          </div>
        )}
      </div>
    </div>
  );
}
