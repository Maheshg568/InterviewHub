import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { getApiErrorMessage } from '../lib/apiClient';
import SlotSelector from '../components/SlotSelector';
import LiquidGlassPanel from '../components/LiquidGlassPanel';
import RippleButton from '../components/RippleButton';

export default function Booking() {
  const { interviewerId } = useParams();
  const navigate = useNavigate();
  const [interviewer, setInterviewer] = useState(null);
  const [formData, setFormData] = useState({ domain: '', slots: [{ date: '', time: '' }] });
  const [bookingRules, setBookingRules] = useState({ istToday: '', slots: [] });
  const [availabilityByDate, setAvailabilityByDate] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [slotError, setSlotError] = useState('');

  useEffect(() => {
    api.get('/api/auth/interviewers').then(res => {
      const found = res.data.interviewers.find(i => i.id === interviewerId);
      setInterviewer(found);
    });
  }, [interviewerId]);

  useEffect(() => {
    api.get('/api/bookings/rules')
      .then(res => setBookingRules({
        istToday: res.data.istToday || '',
        slots: res.data.slots || []
      }))
      .catch(err => setError(getApiErrorMessage(err, 'Could not load booking rules.')));
  }, []);

  useEffect(() => {
    const dates = [...new Set(formData.slots.map(slot => slot.date).filter(Boolean))];
    if (!interviewerId || dates.length === 0) {
      setAvailabilityByDate({});
      return;
    }

    let active = true;
    Promise.all(dates.map(date => (
      api.get('/api/bookings/availability', { params: { interviewerId, date } })
        .then(res => [date, res.data.slots || []])
        .catch(() => [date, []])
    ))).then(results => {
      if (!active) return;
      const nextAvailability = {};
      results.forEach(([date, slots]) => {
        nextAvailability[date] = slots.reduce((map, slot) => ({
          ...map,
          [slot.label]: slot
        }), {});
      });
      setAvailabilityByDate(nextAvailability);
    });

    return () => {
      active = false;
    };
  }, [formData.slots, interviewerId]);

  const validateSlots = () => {
    if (formData.slots.some(slot => !slot.date || !slot.time)) {
      return 'All selected slots must have date and time.';
    }

    const seen = new Set();
    for (const slot of formData.slots) {
      if (bookingRules.istToday && slot.date < bookingRules.istToday) {
        return 'Invalid Booking Date\nPast dates cannot be selected.\nPlease choose today or a future date.';
      }

      const key = `${slot.date}|${slot.time}`;
      if (seen.has(key)) {
        return 'Duplicate Slot Selected\nThis time slot has already been selected.\nPlease choose a different slot.';
      }
      seen.add(key);

      const availability = availabilityByDate?.[slot.date]?.[slot.time];
      if (availability && availability.available === false) {
        if (availability.reason === 'lead_time') {
          return 'Invalid Booking Time\nBookings require at least 60 minutes preparation time.';
        }
        if (availability.reason === 'interviewer_conflict') {
          return 'This Interviewer Is Unavailable\nThe selected interviewer already has a confirmed booking for this date and time.\nPlease choose another available slot.';
        }
        if (availability.reason === 'student_conflict') {
          return 'Booking Conflict\nYou already have an interview scheduled for this date and time.\nPlease select another available slot.';
        }
        return 'This slot is unavailable.';
      }
    }

    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSlotError('');

    const validationError = validateSlots();
    if (validationError) {
      setSlotError(validationError);
      return setError(validationError);
    }

    try {
      setSubmitting(true);
      await api.post('/api/bookings', { interviewerId, domain: formData.domain, slots: formData.slots });
      navigate('/student-dashboard');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Booking failed'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!interviewer) return <div className="p-8 text-center">Loading interviewer details...</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <LiquidGlassPanel className="p-8">
        <h1 className="text-2xl font-bold mb-6">Book Interview</h1>
        <div className="mb-6 flex items-center bg-white/60 p-4 rounded-2xl border border-white/70">
          <div className="w-12 h-12 bg-sky-600 rounded-full flex items-center justify-center text-white font-bold text-xl mr-4 uppercase">{interviewer.name.charAt(0)}</div>
          <div>
            <h2 className="text-lg font-bold">{interviewer.name}</h2>
            <p className="text-sm text-slate-600">{interviewer.company || 'Independent'}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm mb-1">Select Domain/Topic</label>
            <select required className="glass-input" onChange={e => setFormData({ ...formData, domain: e.target.value })}>
              <option value="">Choose topic...</option>
              <option value="General/HR">General / HR / Behavioral</option>
              <option value="Frontend Development">Frontend Development (React, JS)</option>
              <option value="Backend Development">Backend Development (Node, DB)</option>
              <option value="Data Structures & Algorithms">Data Structures & Algorithms</option>
            </select>
          </div>

          <div>
            <label className="block text-sm mb-2">Preferred Slots (pick one or more)</label>
            <SlotSelector
              selectedSlots={formData.slots}
              onChange={(slots) => {
                setSlotError('');
                setFormData({ ...formData, slots });
              }}
              minDate={bookingRules.istToday}
              slotOptions={bookingRules.slots}
              availabilityByDate={availabilityByDate}
              error={slotError}
            />
          </div>

          {error && <p className="text-rose-700 text-sm">{error}</p>}

          <RippleButton
            type="submit"
            disabled={submitting}
            className="w-full bg-sky-600 text-white font-bold py-3 px-4 rounded-xl disabled:opacity-60"
          >
            {submitting ? 'Sending...' : 'Send Interview Request'}
          </RippleButton>
        </form>
      </LiquidGlassPanel>
    </div>
  );
}
