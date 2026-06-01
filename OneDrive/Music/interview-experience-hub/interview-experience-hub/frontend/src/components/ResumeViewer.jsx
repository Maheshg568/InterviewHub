import { useState } from 'react';
import api, { getApiErrorMessage } from '../lib/apiClient';
import StarRating from './StarRating';
import RippleButton from './RippleButton';

export default function ResumeViewer({ studentId, resumes, onRated }) {
  const [selectedResumeId, setSelectedResumeId] = useState(resumes?.[0]?.id || '');
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  const selectedResume = resumes.find(r => r.id === selectedResumeId);

  const submitRating = async () => {
    setError('');
    if (!selectedResume) {
      return setError('Select a resume before rating.');
    }
    if (!rating) {
      return setError('Choose a rating from 1 to 5 stars.');
    }

    try {
      await api.post(`/api/bookings/students/${studentId}/resumes/${selectedResume.id}/rate`, { rating, feedback });
      setRating(0);
      setFeedback('');
      onRated?.();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to save rating.'));
    }
  };

  return (
    <div className="liquid-glass-panel p-4 space-y-3">
      <h4 className="text-base font-semibold text-slate-800 dark:text-slate-200">Resume Viewer</h4>
      <select className="w-full rounded-xl border border-white/50 dark:border-slate-600/50 bg-white/80 dark:bg-slate-700/80 px-3 py-2" value={selectedResumeId} onChange={(e) => setSelectedResumeId(e.target.value)}>
        <option value="">Select resume</option>
        {resumes.map(r => (
          <option key={r.id} value={r.id}>{r.fileName} ({new Date(r.uploadedAt).toLocaleDateString()})</option>
        ))}
      </select>

      {selectedResume && (
        <div className="space-y-3">
          <div className="rounded-xl border border-white/50 dark:border-slate-600/50 bg-white/70 dark:bg-slate-700/60 p-3">
            <p className="text-sm text-slate-700 dark:text-slate-300">Preview: <a className="text-sky-700 dark:text-sky-400 underline" href={selectedResume.filePath} target="_blank" rel="noreferrer">Open {selectedResume.fileName}</a></p>
          </div>
          <StarRating value={rating} onChange={setRating} />
          <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={2} placeholder="Optional resume feedback" className="w-full rounded-xl border border-white/50 dark:border-slate-600/50 bg-white/80 dark:bg-slate-700/80 px-3 py-2" />
          {error && <p className="text-sm text-rose-700 dark:text-rose-400">{error}</p>}
          <RippleButton className="px-4 py-2 rounded-xl bg-sky-600 text-white" onClick={submitRating}>Submit Resume Rating</RippleButton>
        </div>
      )}
    </div>
  );
}
