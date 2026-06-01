import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api, { getApiErrorMessage } from '../lib/apiClient';
import { resolveMediaUrl } from '../lib/mediaUrl';

const STATUS_LABELS = {
  pending: 'Pending Approval',
  update_pending: 'Verification Update Pending',
  under_review: 'Under Review',
  verified: 'Verified',
  declined: 'Declined'
};

export default function AdminVerificationRequest() {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState('');

  const fetchRequest = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/api/admin/verification-requests/${requestId}`);
      setRequest(res.data?.request || null);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load verification request.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequest();
  }, [requestId]);

  const updateStatus = async (status) => {
    setActionLoading(status);
    setError('');
    try {
      await api.put(`/api/admin/verification-requests/${requestId}/status`, { status });
      await fetchRequest();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not update verification request.'));
    } finally {
      setActionLoading('');
    }
  };

  const profile = request?.profile || {};
  const documentUrl = resolveMediaUrl(request?.document?.filePath);
  const oldDocumentUrl = resolveMediaUrl(request?.oldDocument?.filePath);
  const isImageDocument = /\.(png|jpe?g|webp)$/i.test(request?.document?.filePath || request?.document?.fileName || '');
  const isOldImageDocument = /\.(png|jpe?g|webp)$/i.test(request?.oldDocument?.filePath || request?.oldDocument?.fileName || '');

  if (loading) {
    return <div className="max-w-5xl mx-auto px-4 py-8"><div className="liquid-glass-panel p-6 text-sm text-slate-600">Loading verification request...</div></div>;
  }

  if (error && !request) {
    return <div className="max-w-5xl mx-auto px-4 py-8"><div className="liquid-glass-panel p-6 text-sm text-rose-700">{error}</div></div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-5">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => navigate('/admin')} className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/80 text-slate-700">
          <ArrowLeft size={18} />
        </button>
        <div>
          <p className="text-sm text-sky-700">Verification Request</p>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{profile.name || 'Interviewer'}</h1>
        </div>
      </div>

      {error && <div className="liquid-glass-panel p-4 text-sm text-rose-700 dark:text-rose-300">{error}</div>}

      <div className="liquid-glass-panel p-5">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="h-28 w-28 overflow-hidden rounded-full border border-white/70 bg-white/65">
            {resolveMediaUrl(request?.profileImage?.filePath) ? (
              <img src={resolveMediaUrl(request.profileImage.filePath)} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">No Image</div>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{profile.name || 'Interviewer'}</h2>
              <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-700/80 dark:text-slate-200">
                {STATUS_LABELS[request.status] || request.status}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{profile.primaryExpertise || 'Primary expertise not added'}</p>
            <p className="text-sm text-slate-600 dark:text-slate-300">{profile.company || 'Company not added'}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            ['Age', profile.age || 'Not added'],
            ['Mobile Number', profile.phone || 'Not added'],
            ['Experience', profile.yearsOfExperience ? `${profile.yearsOfExperience} Years` : 'Not added'],
            ['Company / Organization', profile.company || 'Not added'],
            ['Primary Expertise', profile.primaryExpertise || 'Not added'],
            ['City', profile.city || 'Not added'],
            ['Area / Locality', profile.area || 'Not added'],
            ['College / University', profile.college || 'Not provided'],
            ['Course', profile.course || 'Not provided']
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-white/60 bg-white/60 p-3 dark:border-slate-600/50 dark:bg-slate-800/55">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
              <p className="mt-1 text-sm text-slate-900 dark:text-slate-100">{value}</p>
            </div>
          ))}
          <div className="rounded-xl border border-white/60 bg-white/60 p-3 dark:border-slate-600/50 dark:bg-slate-800/55 sm:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Interview Services Offered</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(profile.interviewServices || []).map(item => <span key={item} className="rounded-full bg-white/80 px-3 py-1 text-xs text-slate-700 dark:bg-slate-700/80 dark:text-slate-200">{item}</span>)}
            </div>
          </div>
          <div className="rounded-xl border border-white/60 bg-white/60 p-3 dark:border-slate-600/50 dark:bg-slate-800/55 sm:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Availability Preferences</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(profile.availabilityPreference || []).map(item => <span key={item} className="rounded-full bg-white/80 px-3 py-1 text-xs text-slate-700 dark:bg-slate-700/80 dark:text-slate-200">{item}</span>)}
            </div>
          </div>
          <div className="rounded-xl border border-white/60 bg-white/60 p-3 dark:border-slate-600/50 dark:bg-slate-800/55 sm:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">About</p>
            <p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-800 dark:text-slate-200">{profile.bio || 'Not added'}</p>
          </div>
        </div>
      </div>

      <div className="liquid-glass-panel p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Verification Document</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">{request.document?.documentType || 'Document'} · {request.document?.fileName || 'Uploaded file'}</p>
          </div>
          {documentUrl && <a href={documentUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-sky-700 hover:underline">Open document</a>}
        </div>
        {request.requestType === 'update' && (
          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">OLD DOCUMENT</p>
              {oldDocumentUrl && <a href={oldDocumentUrl} target="_blank" rel="noopener noreferrer" className="mb-2 inline-block text-sm text-sky-700 hover:underline">View</a>}
              {oldDocumentUrl && isOldImageDocument && <img src={oldDocumentUrl} alt="Old verification document" className="max-h-[360px] w-full rounded-xl border border-white/60 bg-white object-contain" />}
              {oldDocumentUrl && !isOldImageDocument && <iframe src={oldDocumentUrl} title="Old verification document" className="h-[360px] w-full rounded-xl border border-white/60 bg-white" />}
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">NEW DOCUMENT</p>
              {documentUrl && <a href={documentUrl} target="_blank" rel="noopener noreferrer" className="mb-2 inline-block text-sm text-sky-700 hover:underline">View</a>}
              {documentUrl && isImageDocument && <img src={documentUrl} alt="New verification document" className="max-h-[360px] w-full rounded-xl border border-white/60 bg-white object-contain" />}
              {documentUrl && !isImageDocument && <iframe src={documentUrl} title="New verification document" className="h-[360px] w-full rounded-xl border border-white/60 bg-white" />}
            </div>
          </div>
        )}
        {request.requestType !== 'update' && documentUrl && isImageDocument && <img src={documentUrl} alt="Verification document" className="max-h-[520px] w-full rounded-xl border border-white/60 bg-white object-contain" />}
        {request.requestType !== 'update' && documentUrl && !isImageDocument && <iframe src={documentUrl} title="Verification document" className="h-[520px] w-full rounded-xl border border-white/60 bg-white" />}
      </div>

      <div className="liquid-glass-panel p-5">
        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" disabled={Boolean(actionLoading)} onClick={() => updateStatus('verified')} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
            {actionLoading === 'verified' ? 'Approving...' : 'Approve'}
          </button>
          <button type="button" disabled={Boolean(actionLoading)} onClick={() => updateStatus('under_review')} className="rounded-xl bg-amber-100 px-4 py-2 text-sm font-medium text-amber-800 disabled:opacity-60">
            {actionLoading === 'under_review' ? 'Holding...' : 'Hold'}
          </button>
          <button type="button" disabled={Boolean(actionLoading)} onClick={() => updateStatus('declined')} className="rounded-xl bg-rose-100 px-4 py-2 text-sm font-medium text-rose-800 disabled:opacity-60">
            {actionLoading === 'declined' ? 'Declining...' : 'Decline'}
          </button>
        </div>
        <div className="mt-4">
          <Link to="/admin" className="text-sm text-sky-700 hover:underline">Back to admin dashboard</Link>
        </div>
      </div>
    </div>
  );
}
