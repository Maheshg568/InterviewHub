import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Camera, Check, Pencil, Save, ShieldCheck, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api, { getApiErrorMessage } from '../lib/apiClient';
import { resolveMediaUrl } from '../lib/mediaUrl';

const EMPTY_PROFILE = {
  name: '',
  age: '',
  phone: '',
  yearsOfExperience: '',
  company: '',
  primaryExpertise: '',
  city: '',
  area: '',
  college: '',
  course: '',
  bio: '',
  skillTags: [],
  interviewServices: [],
  availabilityPreference: []
};

const SERVICE_OPTIONS = ['Technical Interview', 'HR Interview', 'Resume Review', 'Career Guidance', 'Mock Interview'];
const AVAILABILITY_OPTIONS = ['Morning', 'Afternoon', 'Evening'];
const DOCUMENT_TYPES = ['College ID', 'Employee ID', 'Internship ID', 'Professional Certificate', 'Government ID'];

function EditableField({ id, label, value, editing, type = 'text', multiline = false, maxLength, optional = false, onEdit, onChange }) {
  const Input = multiline ? 'textarea' : 'input';

  return (
    <div className="rounded-2xl border border-white/60 bg-white/50 p-4 shadow-[0_12px_26px_rgba(14,116,144,0.09)] backdrop-blur-xl dark:border-slate-600/45 dark:bg-slate-800/50">
      <div className="mb-2 flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {label}
        </label>
        {optional && !editing && !value && (
          <span className="mr-auto text-xs font-medium text-slate-400 dark:text-slate-500">Optional</span>
        )}
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
        type={multiline ? undefined : type}
        min={type === 'number' ? '0' : undefined}
        value={value}
        readOnly={!editing}
        maxLength={maxLength}
        rows={multiline ? 4 : undefined}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100 ${multiline ? 'min-h-[104px] resize-none leading-6' : 'h-8'}`}
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

export default function InterviewerProfile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const verificationInputRef = useRef(null);
  const [form, setForm] = useState(EMPTY_PROFILE);
  const [editing, setEditing] = useState({});
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [focus, setFocus] = useState({ x: 50, y: 50 });
  const [verification, setVerification] = useState({ status: 'required' });
  const [documentType, setDocumentType] = useState(DOCUMENT_TYPES[0]);
  const [verificationFile, setVerificationFile] = useState(null);
  const [skillDraft, setSkillDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const completion = useMemo(() => {
    const required = [
      Boolean(profileImageUrl),
      Boolean(form.name.trim()),
      Number(form.age) > 0,
      Boolean(form.phone.trim()),
      Number(form.yearsOfExperience) > 0,
      Boolean(form.company.trim()),
      Boolean(form.primaryExpertise.trim()),
      Boolean(form.city.trim()),
      Boolean(form.area.trim()),
      Boolean(form.bio.trim()),
      form.interviewServices.length > 0
    ];
    return Math.round((required.filter(Boolean).length / required.length) * 100);
  }, [form, profileImageUrl]);

  useEffect(() => {
    let active = true;

    api.get('/api/auth/me')
      .then((res) => {
        if (!active) return;
        const user = res.data?.user || {};
        setForm({
          name: user.name || '',
          age: user.age ? String(user.age) : '',
          phone: user.phone || '',
          yearsOfExperience: user.yearsOfExperience ? String(user.yearsOfExperience) : '',
          company: user.company || '',
          primaryExpertise: user.primaryExpertise || user.specialization || '',
          city: user.city || '',
          area: user.area || '',
          college: user.college || '',
          course: user.course || '',
          bio: user.bio || '',
          skillTags: user.skillTags || [],
          interviewServices: user.interviewServices || [],
          availabilityPreference: user.availabilityPreference || []
        });
        setProfileImageUrl(resolveMediaUrl(user.profileImage?.filePath));
        setFocus({ x: user.profileImage?.focusX || 50, y: user.profileImage?.focusY || 50 });
        setVerification(user.verification || { status: 'required' });
      })
      .catch((err) => setError(getApiErrorMessage(err, 'Could not load profile.')))
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!loading && window.location.hash === '#verification') {
      document.getElementById('verification')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [loading]);

  const updateField = (field, value) => {
    setMessage('');
    setError('');
    setForm(prev => ({ ...prev, [field]: field === 'bio' ? value.slice(0, 300) : value }));
  };

  const toggleArrayValue = (field, value, limit) => {
    setForm(prev => {
      const current = prev[field] || [];
      const next = current.includes(value) ? current.filter(item => item !== value) : [...current, value].slice(0, limit);
      return { ...prev, [field]: next };
    });
  };

  const addSkillTag = () => {
    const tag = skillDraft.trim();
    if (!tag || form.skillTags.includes(tag) || form.skillTags.length >= 8) return;
    setForm(prev => ({ ...prev, skillTags: [...prev.skillTags, tag] }));
    setSkillDraft('');
  };

  const removeSkillTag = (tag) => {
    setForm(prev => ({ ...prev, skillTags: prev.skillTags.filter(item => item !== tag) }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setProfileImageFile(file);
    setProfileImageUrl(URL.createObjectURL(file));
    setMessage('');
    setError('');
  };

  const saveProfile = async () => {
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const data = new FormData();
      Object.entries({
        name: form.name,
        age: form.age,
        phone: form.phone,
        yearsOfExperience: form.yearsOfExperience,
        company: form.company,
        primaryExpertise: form.primaryExpertise,
        city: form.city,
        area: form.area,
        college: form.college,
        course: form.course,
        bio: form.bio,
        about: form.bio,
        focusX: String(focus.x),
        focusY: String(focus.y)
      }).forEach(([key, value]) => data.append(key, value));
      data.append('skillTags', JSON.stringify(form.skillTags));
      data.append('interviewServices', JSON.stringify(form.interviewServices));
      data.append('availabilityPreference', JSON.stringify(form.availabilityPreference));
      if (profileImageFile) data.append('profileImage', profileImageFile);

      const res = await api.put('/api/auth/interviewer-profile', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      const user = res.data?.user || {};
      setForm(prev => ({
        ...prev,
        name: user.name || '',
        age: user.age ? String(user.age) : '',
        phone: user.phone || '',
        yearsOfExperience: user.yearsOfExperience ? String(user.yearsOfExperience) : '',
        company: user.company || '',
        primaryExpertise: user.primaryExpertise || user.specialization || '',
        city: user.city || '',
        area: user.area || '',
        college: user.college || '',
        course: user.course || '',
        bio: user.bio || '',
        skillTags: user.skillTags || [],
        interviewServices: user.interviewServices || [],
        availabilityPreference: user.availabilityPreference || []
      }));
      setProfileImageFile(null);
      setProfileImageUrl(resolveMediaUrl(user.profileImage?.filePath));
      setFocus({ x: user.profileImage?.focusX || 50, y: user.profileImage?.focusY || 50 });
      setVerification(user.verification || { status: 'required' });
      setEditing({});
      setMessage('Profile changes saved.');
      window.dispatchEvent(new CustomEvent('ieh:auth-changed'));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not save profile.'));
    } finally {
      setSaving(false);
    }
  };

  const submitVerification = async () => {
    if (!verificationFile) return;
    setVerifying(true);
    setMessage('');
    setError('');

    try {
      const data = new FormData();
      data.append('documentType', documentType);
      data.append('verificationDocument', verificationFile);
      const res = await api.post('/api/auth/interviewer-verification', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      setVerification(res.data?.user?.verification || { status: 'pending' });
      setVerificationFile(null);
      setMessage('Verification submitted for admin review.');
      window.dispatchEvent(new CustomEvent('ieh:auth-changed'));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not submit verification.'));
    } finally {
      setVerifying(false);
    }
  };

  const verificationLabel = verification.status === 'verified'
    ? 'Verified Interviewer'
    : verification.status === 'pending'
      ? 'Verification Pending'
      : verification.status === 'under_review'
        ? 'Verification Under Review'
        : verification.status === 'declined' || verification.status === 'rejected'
          ? 'Verification Declined'
          : 'Verification Required';

  return (
    <div className="px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-5 transition-all duration-300 ease-out">
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
              <p className="text-sm font-medium text-sky-700 dark:text-sky-300">Interviewer Profile</p>
              <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">Professional Identity</h1>
            </div>
          </div>

          <div className="mb-5 rounded-2xl border border-white/60 bg-white/45 p-4 backdrop-blur-xl dark:border-slate-600/45 dark:bg-slate-800/45">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Profile Completion</p>
              <p className="text-sm font-semibold text-sky-700 dark:text-sky-300">{completion}%</p>
            </div>
            <div className="mt-3 h-2 rounded-full bg-white/65 dark:bg-slate-700/65">
              <div className="h-full rounded-full bg-sky-600 transition-all duration-300" style={{ width: `${completion}%` }} />
            </div>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-white/60 bg-white/50 p-5 text-sm text-slate-600 dark:border-slate-600/45 dark:bg-slate-800/50 dark:text-slate-300">
              Loading profile...
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-[260px_1fr] lg:grid-cols-[300px_1fr]">
              <div className="rounded-3xl border border-white/60 bg-white/48 p-5 text-center shadow-[0_16px_34px_rgba(14,116,144,0.1)] backdrop-blur-xl dark:border-slate-600/45 dark:bg-slate-800/48">
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mx-auto flex h-[118px] w-[118px] items-center justify-center overflow-hidden rounded-full border border-white/70 bg-white/50 text-sky-700 shadow-[inset_0_2px_18px_rgba(255,255,255,0.58),0_16px_30px_rgba(14,116,144,0.14)] transition-colors hover:text-sky-900 active:scale-[0.99] sm:h-[132px] sm:w-[132px] md:h-[148px] md:w-[148px] dark:border-slate-600/55 dark:bg-slate-800/52 dark:text-sky-300 dark:hover:text-sky-200"
                  aria-label="Upload profile image"
                >
                  {profileImageUrl ? (
                    <img src={profileImageUrl} alt="" className="h-full w-full object-cover" style={{ objectPosition: `${focus.x}% ${focus.y}%` }} />
                  ) : (
                    <div className="relative flex h-full w-full items-center justify-center">
                      <span className="absolute inset-5 rounded-full bg-sky-200/20 blur-lg dark:bg-sky-400/10" />
                      <Camera className="relative h-8 w-8" strokeWidth={1.9} />
                    </div>
                  )}
                </button>
                <p className="mt-4 text-sm font-semibold text-slate-900 dark:text-slate-100">{form.name || 'Interviewer Name'}</p>
                <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">Interviewer</p>
                {verification.status === 'verified' && (
                  <span className="mt-3 inline-flex rounded-full border border-emerald-200/80 bg-emerald-100/75 px-3 py-1 text-xs font-medium text-emerald-800 dark:border-emerald-700/45 dark:bg-emerald-900/25 dark:text-emerald-300">
                    Verified
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-5 inline-flex h-10 items-center justify-center rounded-2xl border border-white/60 bg-white/50 px-4 text-sm font-medium text-slate-700 transition-colors hover:text-sky-700 active:bg-white/65 dark:border-slate-600/45 dark:bg-slate-700/45 dark:text-slate-200 dark:hover:text-sky-300"
                >
                  Change Image
                </button>
                {profileImageUrl && (
                  <div className="mt-4 space-y-3 text-left">
                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Horizontal Position</label>
                    <input type="range" min="0" max="100" value={focus.x} onChange={(e) => setFocus(prev => ({ ...prev, x: Number(e.target.value) }))} className="w-full" />
                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Vertical Position</label>
                    <input type="range" min="0" max="100" value={focus.y} onChange={(e) => setFocus(prev => ({ ...prev, y: Number(e.target.value) }))} className="w-full" />
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <EditableField id="interviewer-name" label="Full Name" value={form.name} editing={editing.name} onEdit={() => setEditing(prev => ({ ...prev, name: !prev.name }))} onChange={(value) => updateField('name', value)} />
                  <EditableField id="interviewer-age" label="Age" value={form.age} editing={editing.age} type="number" onEdit={() => setEditing(prev => ({ ...prev, age: !prev.age }))} onChange={(value) => updateField('age', value)} />
                  <EditableField id="interviewer-phone" label="Mobile Number" value={form.phone} editing={editing.phone} onEdit={() => setEditing(prev => ({ ...prev, phone: !prev.phone }))} onChange={(value) => updateField('phone', value)} />
                  <EditableField id="interviewer-experience" label="Experience" value={form.yearsOfExperience} editing={editing.yearsOfExperience} type="number" onEdit={() => setEditing(prev => ({ ...prev, yearsOfExperience: !prev.yearsOfExperience }))} onChange={(value) => updateField('yearsOfExperience', value)} />
                  <EditableField id="interviewer-company" label="Company / Organization" value={form.company} editing={editing.company} onEdit={() => setEditing(prev => ({ ...prev, company: !prev.company }))} onChange={(value) => updateField('company', value)} />
                  <EditableField id="interviewer-expertise" label="Primary Expertise" value={form.primaryExpertise} editing={editing.primaryExpertise} onEdit={() => setEditing(prev => ({ ...prev, primaryExpertise: !prev.primaryExpertise }))} onChange={(value) => updateField('primaryExpertise', value)} />
                  <EditableField id="interviewer-city" label="City" value={form.city} editing={editing.city} onEdit={() => setEditing(prev => ({ ...prev, city: !prev.city }))} onChange={(value) => updateField('city', value)} />
                  <EditableField id="interviewer-area" label="Area / Locality" value={form.area} editing={editing.area} onEdit={() => setEditing(prev => ({ ...prev, area: !prev.area }))} onChange={(value) => updateField('area', value)} />
                  <EditableField id="interviewer-college" label="College / University" value={form.college} editing={editing.college} optional onEdit={() => setEditing(prev => ({ ...prev, college: !prev.college }))} onChange={(value) => updateField('college', value)} />
                  <EditableField id="interviewer-course" label="Course" value={form.course} editing={editing.course} optional onEdit={() => setEditing(prev => ({ ...prev, course: !prev.course }))} onChange={(value) => updateField('course', value)} />
                </div>

                <div className="rounded-2xl border border-white/60 bg-white/50 p-4 shadow-[0_12px_26px_rgba(14,116,144,0.09)] backdrop-blur-xl dark:border-slate-600/45 dark:bg-slate-800/50">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Optional Skill Tags</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {form.skillTags.map(tag => (
                      <button key={tag} type="button" onClick={() => removeSkillTag(tag)} className="rounded-full border border-sky-200/70 bg-white/65 px-3 py-1 text-xs font-medium text-sky-800 dark:border-sky-500/40 dark:bg-slate-700/55 dark:text-sky-200">
                        {tag} x
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <input value={skillDraft} onChange={(e) => setSkillDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkillTag(); } }} placeholder="Add skill tag" className="glass-input text-sm" />
                    <button type="button" onClick={addSkillTag} disabled={form.skillTags.length >= 8} className="rounded-xl bg-white/80 px-3 text-sm font-medium text-sky-700 disabled:opacity-50 dark:bg-slate-700/80 dark:text-sky-300">Add</button>
                  </div>
                </div>

                <div className="rounded-2xl border border-sky-100/80 bg-sky-50/55 p-4 shadow-[0_12px_26px_rgba(14,116,144,0.1)] backdrop-blur-xl dark:border-sky-500/25 dark:bg-slate-800/55">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Interview Services Offered</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {SERVICE_OPTIONS.map(service => (
                      <button key={service} type="button" onClick={() => toggleArrayValue('interviewServices', service, 5)} className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${form.interviewServices.includes(service) ? 'border-sky-300 bg-white/85 text-sky-800 dark:border-sky-500/50 dark:bg-slate-700/80 dark:text-sky-200' : 'border-white/65 bg-white/45 text-slate-700 dark:border-slate-600/45 dark:bg-slate-700/35 dark:text-slate-300'}`}>
                        {service}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/60 bg-white/50 p-4 shadow-[0_12px_26px_rgba(14,116,144,0.09)] backdrop-blur-xl dark:border-slate-600/45 dark:bg-slate-800/50">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Availability Preference</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {AVAILABILITY_OPTIONS.map(option => (
                      <button key={option} type="button" onClick={() => toggleArrayValue('availabilityPreference', option, 3)} className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${form.availabilityPreference.includes(option) ? 'border-sky-300 bg-white/85 text-sky-800 dark:border-sky-500/50 dark:bg-slate-700/80 dark:text-sky-200' : 'border-white/65 bg-white/45 text-slate-700 dark:border-slate-600/45 dark:bg-slate-700/35 dark:text-slate-300'}`}>
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                <EditableField id="interviewer-about" label="About" value={form.bio} editing={editing.bio} multiline maxLength={300} onEdit={() => setEditing(prev => ({ ...prev, bio: !prev.bio }))} onChange={(value) => updateField('bio', value)} />

                {(message || error) && (
                  <div className={`rounded-2xl border p-3 text-sm ${error ? 'border-rose-200/70 bg-rose-50/70 text-rose-700 dark:border-rose-800/45 dark:bg-rose-900/20 dark:text-rose-300' : 'border-emerald-200/70 bg-emerald-50/70 text-emerald-700 dark:border-emerald-800/45 dark:bg-emerald-900/20 dark:text-emerald-300'}`}>
                    {error || message}
                  </div>
                )}

                <div className="flex justify-end">
                  <button type="button" onClick={saveProfile} disabled={saving} className="inline-flex h-11 w-full max-w-[156px] items-center justify-center gap-2 rounded-2xl bg-sky-600 text-sm font-semibold text-white shadow-[0_14px_26px_rgba(14,116,144,0.18)] transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60 sm:max-w-[148px] md:max-w-[156px]">
                    <Save size={17} strokeWidth={2} />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div id="verification" className="liquid-glass-panel scroll-mt-24 p-5 sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
                <ShieldCheck size={20} strokeWidth={2} />
                {verificationLabel}
              </p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                {completion < 100 ? 'Complete all required profile fields before verification.' : 'Upload one document for admin approval.'}
              </p>
              {(verification.status === 'declined' || verification.status === 'rejected') && (
                <p className="mt-2 text-sm text-rose-700 dark:text-rose-300">Reason: {verification.rejectionReason || 'Document not clear.'}</p>
              )}
            </div>
            {verification.filePath && (
              <a href={resolveMediaUrl(verification.filePath)} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-sky-700 hover:underline dark:text-sky-300">
                View uploaded document
              </a>
            )}
          </div>

          {!['verified', 'pending', 'under_review'].includes(verification.status) && (
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[180px_1fr_auto] sm:items-center">
              <select value={documentType} onChange={(e) => setDocumentType(e.target.value)} disabled={completion < 100} className="glass-input text-sm disabled:opacity-60">
                {DOCUMENT_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
              <input ref={verificationInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={(e) => setVerificationFile(e.target.files?.[0] || null)} disabled={completion < 100} className="block w-full text-sm disabled:opacity-60" />
              <button type="button" onClick={submitVerification} disabled={completion < 100 || !verificationFile || verifying} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-sky-600 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
                <Upload size={16} strokeWidth={2} />
                {verification.status === 'declined' || verification.status === 'rejected' ? 'Upload New Verification' : verifying ? 'Uploading...' : 'Submit'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
