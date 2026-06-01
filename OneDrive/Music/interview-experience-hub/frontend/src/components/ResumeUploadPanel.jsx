import { useState } from 'react';
import api, { getApiErrorMessage } from '../lib/apiClient';
import RippleButton from './RippleButton';

export default function ResumeUploadPanel({ onUploaded }) {
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!file) return setError('Select a JPG/PNG/PDF file.');

    setUploading(true);
    try {
      const data = new FormData();
      data.append('resume', file);
      await api.post('/api/bookings/resumes', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      setFile(null);
      if (onUploaded) onUploaded();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Resume upload failed.'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={submit} className="liquid-glass-panel p-4 space-y-3">
      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Resume Section</h3>
      <p className="text-sm text-slate-600 dark:text-slate-400">Upload your CV/Resume (JPG, PNG, PDF up to 8MB).</p>
      <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setFile(e.target.files?.[0] || null)} className="block w-full text-sm" />
      {error && <p className="text-sm text-rose-700 dark:text-rose-400">{error}</p>}
      <RippleButton type="submit" disabled={uploading} className="px-4 py-2 rounded-xl bg-sky-600 text-white disabled:opacity-50">
        {uploading ? 'Uploading...' : 'Upload Resume'}
      </RippleButton>
    </form>
  );
}
