const fallbackOptions = [
  { label: '07:00 AM – 09:00 AM' },
  { label: '09:00 AM – 11:00 AM' },
  { label: '11:00 AM – 01:00 PM' },
  { label: '01:00 PM – 03:00 PM' },
  { label: '03:00 PM – 05:00 PM' },
  { label: '05:00 PM – 07:00 PM' },
  { label: '07:00 PM – 09:00 PM' }
];

const reasonLabels = {
  past_date: 'Past dates cannot be selected.',
  lead_time: 'Bookings require at least 60 minutes preparation time.',
  interviewer_conflict: 'This interviewer already has a confirmed booking at this time.',
  student_conflict: 'You already have an interview scheduled at this time.'
};

export default function SlotSelector({ selectedSlots, onChange, minDate = '', slotOptions = [], availabilityByDate = {}, error = '' }) {
  const options = slotOptions.length
    ? slotOptions.map(option => (typeof option === 'string' ? { label: option } : option))
    : fallbackOptions;

  const updateSlot = (index, field, value) => {
    const next = [...selectedSlots];
    next[index] = { ...next[index], [field]: value };
    onChange(next);
  };

  const addSlot = () => onChange([...selectedSlots, { date: '', time: '' }]);
  const removeSlot = (index) => onChange(selectedSlots.filter((_, i) => i !== index));

  const isDuplicateChoice = (slot, optionLabel, currentIndex) => selectedSlots.some((other, otherIndex) => (
    otherIndex !== currentIndex &&
    other.date &&
    other.time &&
    other.date === slot.date &&
    other.time === optionLabel
  ));

  const getAvailability = (date, label) => availabilityByDate?.[date]?.[label] || null;

  const getSlotWarning = (slot) => {
    if (slot.date && minDate && slot.date < minDate) return 'Past dates cannot be selected.';
    const availability = slot.date && slot.time ? getAvailability(slot.date, slot.time) : null;
    if (availability && availability.available === false) {
      return reasonLabels[availability.reason] || 'This slot is unavailable.';
    }
    return '';
  };

  return (
    <div className="space-y-3">
      {selectedSlots.map((slot, index) => (
        <div key={`slot-${index}`} className="space-y-1">
          <div className="grid grid-cols-12 gap-2 items-end">
            <div className="col-span-5">
              <label className="block text-xs mb-1 text-slate-700 dark:text-slate-300">Date</label>
              <input
                type="date"
                required
                min={minDate || undefined}
                value={slot.date}
                onChange={(e) => updateSlot(index, 'date', e.target.value)}
                className="w-full rounded-xl border border-white/50 dark:border-slate-600/50 bg-white/70 dark:bg-slate-700/70 px-3 py-2"
              />
            </div>
            <div className="col-span-5">
              <label className="block text-xs mb-1 text-slate-700 dark:text-slate-300">Time Slot</label>
              <select
                required
                value={slot.time}
                onChange={(e) => updateSlot(index, 'time', e.target.value)}
                className="w-full rounded-xl border border-white/50 dark:border-slate-600/50 bg-white/70 dark:bg-slate-700/70 px-3 py-2"
              >
                <option value="">Select</option>
                {options
                  .filter(option => option.label === slot.time || !isDuplicateChoice(slot, option.label, index))
                  .map((option) => {
                    const availability = slot.date ? getAvailability(slot.date, option.label) : null;
                    const disabled = Boolean(availability && availability.available === false);
                    return (
                      <option value={option.label} key={option.label} disabled={disabled}>
                        {option.label}{disabled ? ` (${reasonLabels[availability.reason] || 'Unavailable'})` : ''}
                      </option>
                    );
                  })}
              </select>
            </div>
            <div className="col-span-2">
              <button type="button" onClick={() => removeSlot(index)} className="w-full rounded-xl border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 py-2 text-sm">
                Remove
              </button>
            </div>
          </div>
          {getSlotWarning(slot) && <p className="text-xs text-rose-700 dark:text-rose-400">{getSlotWarning(slot)}</p>}
        </div>
      ))}
      {error && <p className="text-xs text-rose-700 dark:text-rose-400">{error}</p>}
      <button type="button" onClick={addSlot} className="rounded-xl border border-sky-200 dark:border-sky-700 text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/20 px-3 py-2 text-sm">
        + Add another slot
      </button>
    </div>
  );
}
