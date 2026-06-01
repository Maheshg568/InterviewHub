const UPCOMING_STATUSES = ['accepted', 'confirmed', 'meeting_link_uploaded'];

export const getBookingDisplayId = (booking) => booking?.bookingId || booking?.id || 'N/A';

export const getInterviewStartMs = (booking) => {
  const date = booking?.selectedDate;
  const startTime = booking?.slotStartTime;
  const timezone = booking?.timezone;
  if (!date || !startTime || timezone !== 'Asia/Kolkata') return null;
  return new Date(`${date}T${startTime}+05:30`).getTime();
};

export const getInterviewDateLabel = (booking) => {
  const date = booking?.selectedDate;
  if (!date) return 'N/A';
  return new Date(`${date}T00:00:00+05:30`).toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    timeZone: 'Asia/Kolkata'
  });
};

export const getInterviewTimeLabel = (booking) => booking?.slotLabel || 'N/A';

export const getNearestUpcomingBooking = (bookings, nowMs = Date.now()) => {
  const candidates = (bookings || [])
    .filter(booking => UPCOMING_STATUSES.includes(booking.status))
    .filter(booking => booking.approvalStatus === 'approved')
    .map(booking => ({ booking, startsAt: getInterviewStartMs(booking) }))
    .filter(item => item.startsAt && item.startsAt > nowMs - 30000)
    .sort((a, b) => a.startsAt - b.startsAt);
  return candidates[0]?.booking || null;
};

export const getCountdownParts = (targetMs, nowMs = Date.now()) => {
  const diff = Math.max(0, targetMs - nowMs);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return { diff, days, hours, minutes, seconds };
};

export const getTimerEmphasis = (diff) => {
  if (diff <= 15 * 60 * 1000) return 'critical';
  if (diff <= 60 * 60 * 1000) return 'urgent';
  if (diff <= 24 * 60 * 60 * 1000) return 'soon';
  return 'normal';
};

export const isWithinReminderWindow = (booking, nowMs = Date.now()) => {
  const startsAt = getInterviewStartMs(booking);
  if (!startsAt) return false;
  const diff = startsAt - nowMs;
  return diff > 0 && diff <= 10 * 60 * 1000;
};

export const hasInterviewStarted = (booking, nowMs = Date.now()) => {
  const startsAt = getInterviewStartMs(booking);
  return Boolean(startsAt && nowMs >= startsAt);
};
