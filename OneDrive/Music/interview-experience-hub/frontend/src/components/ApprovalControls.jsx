import { useState } from 'react';
import RippleButton from './RippleButton';

export default function ApprovalControls({ booking, onSubmit, onRequestNewSlot }) {
  const [selectedSlot, setSelectedSlot] = useState(booking.selectedSlot || booking.preferredSlots?.[0] || null);
  const [message, setMessage] = useState(booking.interviewerMessage || '');
  const [slotError, setSlotError] = useState('');

  const actionableStatuses = ['pending', 'accepted', 'reschedule_slot_selected'];
  const isPaymentVerified = booking.paymentStatus === 'verified';

  const requireSelectedSlot = () => {
    if (!selectedSlot?.date || !selectedSlot?.time) {
      setSlotError('You must select one slot from the student\'s preferred slots.');
      return false;
    }
    setSlotError('');
    return true;
  };

  const handleAcceptRequest = () => {
    if (!requireSelectedSlot()) return;
    onSubmit('accepted', selectedSlot, '', message);
  };

  const handleConfirmBooking = () => {
    if (booking.status === 'reschedule_slot_selected') {
      onSubmit('accepted', booking.selectedSlot, '', message);
      return;
    }
    if (!requireSelectedSlot()) return;
    onSubmit('confirmed', selectedSlot, '', message);
  };

  if (!actionableStatuses.includes(booking.status)) return null;

  return (
    <div className="space-y-3 bg-white/60 dark:bg-slate-800/60 rounded-2xl p-3 border border-white/60 dark:border-slate-600/50">
      {booking.status === 'pending' && (
        <div>
          <p className="text-sm font-medium mb-2 text-slate-700 dark:text-slate-200">Student Preferred Slots - select ONE:</p>
          <div className="space-y-1">
            {booking.preferredSlots?.map((slot, idx) => (
              <label key={`slot-${booking.id}-${slot.date}-${slot.time}-${idx}`} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  name={`slot-${booking.id}`}
                  checked={selectedSlot?.date === slot.date && selectedSlot?.time === slot.time}
                  onChange={() => { setSelectedSlot(slot); setSlotError(''); }}
                  className="accent-sky-600"
                />
                <span>{slot.date} {slot.time}</span>
                {selectedSlot?.date === slot.date && selectedSlot?.time === slot.time && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium ml-1">Selected</span>
                )}
              </label>
            ))}
          </div>
          {slotError && <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">{slotError}</p>}
        </div>
      )}

      <textarea
        placeholder="Message to student (optional)"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={2}
        className="w-full rounded-xl border border-white/50 dark:border-slate-600/50 bg-white/80 dark:bg-slate-700/80 px-3 py-2 text-sm"
      />

      <div className="flex flex-wrap gap-2">
        {booking.status === 'pending' && (
          <>
            <RippleButton className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium" onClick={handleAcceptRequest}>
              Accept Request
            </RippleButton>
            <RippleButton className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium" onClick={onRequestNewSlot}>
              Request New Slot
            </RippleButton>
            <RippleButton className="px-4 py-2 rounded-xl bg-rose-600 text-white text-sm font-medium" onClick={() => onSubmit('cancelled', null, '', message)}>
              Cancel Booking
            </RippleButton>
          </>
        )}

        {booking.status === 'reschedule_slot_selected' && (
          <>
            <RippleButton
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium"
              onClick={handleConfirmBooking}
            >
              Confirm Booking
            </RippleButton>
            <RippleButton className="px-4 py-2 rounded-xl bg-rose-600 text-white text-sm font-medium" onClick={() => onSubmit('cancelled', null, '', message)}>
              Cancel Booking
            </RippleButton>
          </>
        )}

        {booking.status === 'accepted' && isPaymentVerified && (
          <>
            <RippleButton
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium disabled:opacity-60"
              onClick={handleConfirmBooking}
            >
              Confirm Booking
            </RippleButton>
            <RippleButton className="px-4 py-2 rounded-xl bg-rose-600 text-white text-sm font-medium" onClick={() => onSubmit('cancelled', null, '', message)}>
              Cancel Booking
            </RippleButton>
          </>
        )}

        {booking.status === 'accepted' && !isPaymentVerified && (
          <RippleButton className="px-4 py-2 rounded-xl bg-rose-600 text-white text-sm font-medium" onClick={() => onSubmit('cancelled', null, '', message)}>
            Cancel Booking
          </RippleButton>
        )}
      </div>

      {booking.status === 'accepted' && !isPaymentVerified && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-700/50 bg-amber-50/70 dark:bg-amber-900/20 px-3 py-2">
          <p className="text-xs text-amber-700 dark:text-amber-300">Awaiting payment verification before booking confirmation.</p>
        </div>
      )}
    </div>
  );
}
