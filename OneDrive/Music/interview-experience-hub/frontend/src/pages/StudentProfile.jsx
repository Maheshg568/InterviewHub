import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Camera, Check, Pencil, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api, { getApiErrorMessage } from '../lib/apiClient';
import { resolveMediaUrl } from '../lib/mediaUrl';

const EMPTY_PROFILE = {
  name: '',
  college: '',
  course: '',
  phone: '',
  bio: '',
  refundUpiId: ''
};

function EditableField({ id, label, value, editing, multiline = false, maxLength, onEdit, onChange }) {
  const Input = multiline ? 'textarea' : 'input';

  return (
    <div className="rounded-2xl border border-white/60 bg-white/50 p-4 shadow-[0_12px_26px_rgba(14,116,144,0.09)] backdrop-blur-xl dark:border-slate-600/45 dark:bg-slate-800/50">
      <div className="mb-2 flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {label}
        </label>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/60 bg-white/50 text-sky-700 transition-colors hover:text-sky-900 active:bg-white/65 dark:border-slate-600/45 dark:bg-slate-700/45 dark:text-sky-300 dark:hover:text-sky-200"
          aria-label={`Edit ${label}`}
        >
          {editing ? <Check size={16} strokeWidth={2} /> : <Pencil size={15} strokeWidth={2} />}
        </button>
      </div>
      <Input
        id={id}
        value={value}
        readOnly={!editing}
        maxLength={maxLength}
        rows={multiline ? 4 : undefined}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100 ${multiline ? 'min-h-[92px] resize-none leading-6' : 'h-8'}`}
        placeholder={multiline ? 'Add a short professional introduction.' : 'Not added yet'}
      />
      {multiline && (
        <p className="mt-2 text-right text-xs text-slate-400 dark:text-slate-500">
          {value.length}/{maxLength}
        </p>
      )}
    </div>
  );
}

export default function StudentProfile() {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_PROFILE);
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [refundQrUrl, setRefundQrUrl] = useState('');
  const [refundQrFile, setRefundQrFile] = useState(null);
  const [refundHistory, setRefundHistory] = useState([]);
  const [editing, setEditing] = useState({});
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const refundQrInputRef = useRef(null);

  useEffect(() => {
    setIsVisible(true);
    let active = true;

    api.get('/api/auth/me')
      .then((res) => {
        if (!active) return;
        const user = res.data?.user || {};
        setForm({
          name: user.name || '',
          college: user.college || '',
          course: user.course || '',
          phone: user.phone || '',
          bio: user.bio || '',
          refundUpiId: user.refundInfo?.upiId || ''
        });
        setProfileImageUrl(resolveMediaUrl(user.profileImage?.filePath));
        setRefundQrUrl(resolveMediaUrl(user.refundInfo?.qrCode?.filePath));
      })
      .catch((err) => {
        if (!active) return;
        setError(getApiErrorMessage(err, 'Could not load profile.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    api.get('/api/bookings/refund-history')
      .then((res) => {
        if (active) setRefundHistory(res.data.history || []);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  const updateField = (field, value) => {
    setMessage('');
    setError('');
    setForm(prev => ({ ...prev, [field]: field === 'bio' ? value.slice(0, 220) : value }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setMessage('');
    setError('');
    setProfileImageFile(file);
    setProfileImageUrl(URL.createObjectURL(file));
  };

  const handleRefundQrChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setMessage('');
    setError('');
    setRefundQrFile(file);
    setRefundQrUrl(URL.createObjectURL(file));
  };

  const saveProfile = async () => {
    setSaving(true);
    setMessage('');
    setError('');

    try {
      if (!form.refundUpiId.trim() && !refundQrFile && !refundQrUrl) {
        throw new Error('Add a refund UPI ID or refund QR code before saving.');
      }
      const refundUpiId = form.refundUpiId.trim();
      if (refundUpiId && (refundUpiId.length < 5 || refundUpiId.length > 100)) {
        throw new Error('UPI ID must be between 5 and 100 characters.');
      }
      const data = new FormData();
      data.append('name', form.name);
      data.append('college', form.college);
      data.append('course', form.course);
      data.append('phone', form.phone);
      data.append('bio', form.bio);
      data.append('refundUpiId', refundUpiId);
      data.append('focusX', '50');
      data.append('focusY', '50');
      if (profileImageFile) data.append('profileImage', profileImageFile);
      if (refundQrFile) data.append('refundQr', refundQrFile);

      const res = await api.put('/api/auth/profile', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      const updatedUser = res.data?.user || {};
      setForm({
        name: updatedUser.name || '',
        college: updatedUser.college || '',
        course: updatedUser.course || '',
        phone: updatedUser.phone || '',
        bio: updatedUser.bio || '',
        refundUpiId: updatedUser.refundInfo?.upiId || ''
      });
      setProfileImageFile(null);
      setRefundQrFile(null);
      setProfileImageUrl(resolveMediaUrl(updatedUser.profileImage?.filePath));
      setRefundQrUrl(resolveMediaUrl(updatedUser.refundInfo?.qrCode?.filePath));
      setEditing({});
      setMessage('Profile changes saved.');
      window.dispatchEvent(new CustomEvent('ieh:auth-changed'));
    } catch (err) {
      setError(err?.response ? getApiErrorMessage(err, 'Could not save profile.') : (err.message || 'Could not save profile.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-4 py-8">
      <div
        className={`mx-auto max-w-5xl transition-all duration-300 ease-out ${isVisible ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-2 scale-[0.98] opacity-0'}`}
      >
        <div className="liquid-glass-panel p-5 sm:p-6 lg:p-7">
          <div className="mb-5 flex items-start gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/60 bg-white/50 text-slate-700 shadow-[0_10px_22px_rgba(14,116,144,0.09)] transition-all duration-200 hover:-translate-x-0.5 hover:text-sky-700 active:scale-[0.98] dark:border-slate-600/45 dark:bg-slate-800/50 dark:text-slate-200 dark:hover:text-sky-300"
              aria-label="Go back"
            >
              <ArrowLeft size={18} strokeWidth={2} />
            </button>
            <div>
              <p className="text-sm font-medium text-sky-700 dark:text-sky-300">Student Profile</p>
              <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">Profile Identity</h1>
            </div>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-white/60 bg-white/50 p-5 text-sm text-slate-600 dark:border-slate-600/45 dark:bg-slate-800/50 dark:text-slate-300">
              Loading profile...
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-[260px_1fr] lg:grid-cols-[300px_1fr]">
              <div className="rounded-3xl border border-white/60 bg-white/48 p-5 text-center shadow-[0_16px_34px_rgba(14,116,144,0.1)] backdrop-blur-xl dark:border-slate-600/45 dark:bg-slate-800/48">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mx-auto flex h-[118px] w-[118px] items-center justify-center overflow-hidden rounded-full border border-white/70 bg-white/50 text-sky-700 shadow-[inset_0_2px_18px_rgba(255,255,255,0.58),0_16px_30px_rgba(14,116,144,0.14)] transition-colors hover:text-sky-900 active:scale-[0.99] sm:h-[132px] sm:w-[132px] md:h-[148px] md:w-[148px] dark:border-slate-600/55 dark:bg-slate-800/52 dark:text-sky-300 dark:hover:text-sky-200"
                  aria-label="Upload profile image"
                >
                  {profileImageUrl ? (
                    <img src={profileImageUrl} alt="" className="h-full w-full object-cover object-center" />
                  ) : (
                    <div className="relative flex h-full w-full items-center justify-center">
                      <span className="absolute inset-5 rounded-full bg-sky-200/20 blur-lg dark:bg-sky-400/10" />
                      <Camera className="relative h-8 w-8" strokeWidth={1.9} />
                    </div>
                  )}
                </button>
                <p className="mt-4 text-sm font-semibold text-slate-900 dark:text-slate-100">{form.name || 'Student Name'}</p>
                <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">Student</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-5 inline-flex h-10 items-center justify-center rounded-2xl border border-white/60 bg-white/50 px-4 text-sm font-medium text-slate-700 transition-colors hover:text-sky-700 active:bg-white/65 dark:border-slate-600/45 dark:bg-slate-700/45 dark:text-slate-200 dark:hover:text-sky-300"
                >
                  Change Image
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <EditableField id="profile-name" label="Full Name" value={form.name} editing={editing.name} onEdit={() => setEditing(prev => ({ ...prev, name: !prev.name }))} onChange={(value) => updateField('name', value)} />
                  <EditableField id="profile-college" label="College / University" value={form.college} editing={editing.college} onEdit={() => setEditing(prev => ({ ...prev, college: !prev.college }))} onChange={(value) => updateField('college', value)} />
                  <EditableField id="profile-course" label="Course" value={form.course} editing={editing.course} onEdit={() => setEditing(prev => ({ ...prev, course: !prev.course }))} onChange={(value) => updateField('course', value)} />
                  <EditableField id="profile-phone" label="Mobile Number" value={form.phone} editing={editing.phone} onEdit={() => setEditing(prev => ({ ...prev, phone: !prev.phone }))} onChange={(value) => updateField('phone', value)} />
                </div>

                <EditableField id="profile-bio" label="Bio / About" value={form.bio} editing={editing.bio} multiline maxLength={220} onEdit={() => setEditing(prev => ({ ...prev, bio: !prev.bio }))} onChange={(value) => updateField('bio', value)} />

                <div className="rounded-2xl border border-white/60 bg-white/50 p-4 shadow-[0_12px_26px_rgba(14,116,144,0.09)] backdrop-blur-xl dark:border-slate-600/45 dark:bg-slate-800/50">
                  <div className="mb-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Refund Information</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Add at least one refund method. This is used only if a refund is required.</p>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_180px]">
                    <div>
                      <label htmlFor="refund-upi" className="text-xs font-medium text-slate-600 dark:text-slate-300">UPI ID</label>
                      <input
                        id="refund-upi"
                        value={form.refundUpiId}
                        onChange={(event) => updateField('refundUpiId', event.target.value)}
                        placeholder="name@upi"
                        className="mt-2 w-full rounded-xl border border-white/60 bg-white/65 px-3 py-2 text-sm text-slate-900 outline-none dark:border-slate-600/45 dark:bg-slate-700/55 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <input ref={refundQrInputRef} type="file" accept="image/*" className="hidden" onChange={handleRefundQrChange} />
                      <button
                        type="button"
                        onClick={() => refundQrInputRef.current?.click()}
                        className="flex h-36 w-full items-center justify-center overflow-hidden rounded-2xl border border-white/65 bg-white/55 text-sm font-medium text-sky-700 dark:border-slate-600/45 dark:bg-slate-700/45 dark:text-sky-300"
                      >
                        {refundQrUrl ? (
                          <img src={refundQrUrl} alt="Refund QR" className="h-full w-full object-contain bg-white p-2" />
                        ) : (
                          'Upload Refund QR'
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="mt-5 border-t border-white/60 pt-4 dark:border-slate-600/45">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Recent Refund Activity</p>
                    <div className="mt-3 space-y-2">
                      {refundHistory.map(item => (
                        <div key={`refund-${item.id}`} className="rounded-xl border border-white/60 bg-white/55 p-3 text-xs text-slate-600 dark:border-slate-600/45 dark:bg-slate-700/35 dark:text-slate-300">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-slate-100">Booking ID: {item.bookingId}</p>
                              <p>Interviewer: {item.interviewerName}</p>
                              <p>Refund Amount: ₹{item.refundAmount}</p>
                            </div>
                            <span className="rounded-full border border-white/70 bg-white/70 px-2.5 py-1 font-medium dark:border-slate-600/45 dark:bg-slate-800/55">
                              {item.refundStatus || 'refund'}
                            </span>
                          </div>
                          <div className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-3">
                            <p>UTR: {item.utr || 'Not submitted'}</p>
                            <p>Refund Date: {item.refundSubmittedAt ? new Date(item.refundSubmittedAt).toLocaleDateString() : 'N/A'}</p>
                            <p>Refund Time: {item.refundSubmittedAt ? new Date(item.refundSubmittedAt).toLocaleTimeString() : 'N/A'}</p>
                          </div>
                        </div>
                      ))}
                      {refundHistory.length === 0 && <p className="text-xs text-slate-500 dark:text-slate-400">No refund activity yet.</p>}
                    </div>
                  </div>
                </div>

                {(message || error) && (
                  <div className={`rounded-2xl border p-3 text-sm ${error ? 'border-rose-200/70 bg-rose-50/70 text-rose-700 dark:border-rose-800/45 dark:bg-rose-900/20 dark:text-rose-300' : 'border-emerald-200/70 bg-emerald-50/70 text-emerald-700 dark:border-emerald-800/45 dark:bg-emerald-900/20 dark:text-emerald-300'}`}>
                    {error || message}
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={saveProfile}
                    disabled={saving}
                    className="inline-flex h-11 w-full max-w-[156px] items-center justify-center gap-2 rounded-2xl bg-sky-600 text-sm font-semibold text-white shadow-[0_14px_26px_rgba(14,116,144,0.18)] transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60 sm:max-w-[148px] md:max-w-[156px]"
                  >
                    <Save size={17} strokeWidth={2} />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
