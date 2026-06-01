export default function NotificationItem({ notification, showState = false, compact = false }) {
  const unread = notification.read === false;

  return (
    <div className={`liquid-glass-panel ${compact ? 'p-3' : 'p-3'}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 text-sm text-slate-800 dark:text-slate-200">
          {showState && notification.title && <span className="font-semibold">{notification.title}: </span>}
          {notification.message}
        </p>
        {showState && (
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${unread ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/35 dark:text-sky-300' : 'bg-white/70 text-slate-500 dark:bg-slate-700/70 dark:text-slate-300'}`}>
            {unread ? 'Unread' : 'Read'}
          </span>
        )}
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{new Date(notification.createdAt).toLocaleString()}</p>
    </div>
  );
}
