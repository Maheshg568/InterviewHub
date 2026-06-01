import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { getUnreadNotificationCount } from '../lib/notifications';

export default function MobileNotificationBell({ notifications = [] }) {
  const unreadCount = getUnreadNotificationCount(notifications);
  const displayCount = unreadCount > 99 ? '99+' : unreadCount;

  return (
    <Link
      to="/notifications"
      className="fixed right-4 top-20 z-40 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/65 bg-white/75 text-sky-700 shadow-[0_14px_28px_rgba(14,116,144,0.18)] backdrop-blur-xl transition active:scale-95 dark:border-slate-600/45 dark:bg-slate-800/80 dark:text-sky-300 md:hidden"
      aria-label={`Open notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
    >
      <Bell size={21} strokeWidth={2} />
      {unreadCount > 0 && (
        <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-rose-600 px-1.5 py-0.5 text-center text-[11px] font-bold leading-none text-white shadow-[0_6px_14px_rgba(225,29,72,0.26)]">
          {displayCount}
        </span>
      )}
    </Link>
  );
}
