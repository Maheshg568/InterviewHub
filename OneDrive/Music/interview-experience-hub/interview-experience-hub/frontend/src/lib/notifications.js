export const sortNotificationsNewestFirst = (notifications = []) => (
  [...notifications].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
);

export const getUnreadNotificationCount = (notifications = []) => (
  notifications.filter(notification => notification.read === false).length
);
