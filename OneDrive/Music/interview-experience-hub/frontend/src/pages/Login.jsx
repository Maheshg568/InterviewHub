import { useEffect, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import api, { getApiErrorMessage } from '../lib/apiClient';
import { markAuthenticated } from '../lib/authState';
import LiquidGlassPanel from '../components/LiquidGlassPanel';
import RippleButton from '../components/RippleButton';

const getRoleHome = (role) => {
  if (role === 'student') return '/student-dashboard';
  if (role === 'interviewer') return '/interviewer-dashboard';
  if (role === 'admin') return '/admin';
  return '/';
};

const emptyResetForm = {
  name: '',
  email: '',
  phone: '',
  organization: '',
  reason: ''
};

const isValidPassword = (value) => (
  value.length >= 8 &&
  /[A-Za-z]/.test(value) &&
  /\d/.test(value)
);

export default function Login() {
  const [searchParams] = useSearchParams();
  const initialResetRole = searchParams.get('role') === 'interviewer' ? 'interviewer' : 'student';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [mode, setMode] = useState('login');
  const [resetRole, setResetRole] = useState(initialResetRole);
  const [resetForm, setResetForm] = useState(emptyResetForm);
  const [resetError, setResetError] = useState('');
  const [resetNotice, setResetNotice] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [completedAt, setCompletedAt] = useState('');
  const navigate = useNavigate();

  const checkApprovedReset = async (targetEmail, targetRole) => {
    if (!targetEmail || !targetRole) return;
    try {
      const res = await api.get('/api/auth/password-reset-status', {
        params: { email: targetEmail, role: targetRole }
      });
      if (res.data.status === 'approved') {
        setEmail(targetEmail);
        setResetRole(targetRole);
        setMode('approved');
        setError('');
      } else if (res.data.status === 'declined') {
        setError('Password Reset Request Declined\nPlease contact admin for assistance.');
      }
    } catch {
      // Login should remain usable even if the passive reset-status check fails.
    }
  };

  useEffect(() => {
    const storedEmail = sessionStorage.getItem('passwordResetEmail');
    const storedRole = sessionStorage.getItem('passwordResetRole');
    if (storedEmail && storedRole) {
      checkApprovedReset(storedEmail, storedRole);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    try {
      const res = await api.post('/api/auth/login', { email, password });
      const user = res.data.user;
      markAuthenticated();
      navigate(getRoleHome(user.role));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Login failed'));
    }
  };

  const openForgotPassword = () => {
    setMode('request');
    setResetError('');
    setResetNotice('');
    setResetForm({ ...emptyResetForm, email });
  };

  const handleResetRequest = async (e) => {
    e.preventDefault();
    setResetError('');
    setResetNotice('');
    const requiredValues = [resetForm.name, resetForm.email, resetForm.phone, resetForm.organization];
    if (requiredValues.some(value => !String(value || '').trim())) {
      setResetError('All required fields must be completed.');
      return;
    }

    try {
      await api.post('/api/auth/password-reset-request', {
        role: resetRole,
        name: resetForm.name,
        email: resetForm.email,
        phone: resetForm.phone,
        college: resetRole === 'student' ? resetForm.organization : '',
        company: resetRole === 'interviewer' ? resetForm.organization : '',
        reason: resetForm.reason
      });
      sessionStorage.setItem('passwordResetEmail', resetForm.email);
      sessionStorage.setItem('passwordResetRole', resetRole);
      setNotice('Password reset request submitted. Please wait for admin review.');
      setMode('login');
    } catch (err) {
      const message = getApiErrorMessage(err, 'Unable to submit password reset request');
      setResetError(message);
      if (message.includes('approved password reset request')) {
        sessionStorage.setItem('passwordResetEmail', resetForm.email);
        sessionStorage.setItem('passwordResetRole', resetRole);
        checkApprovedReset(resetForm.email, resetRole);
      }
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setResetError('');
    if (!isValidPassword(newPassword)) {
      setResetError('Password must be at least 8 characters and include at least one letter and one number.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError('Passwords do not match.');
      return;
    }

    try {
      const res = await api.post('/api/auth/password-reset-complete', {
        role: resetRole,
        email,
        newPassword,
        confirmPassword
      });
      setCompletedAt(res.data.completedAt || new Date().toISOString());
      setNewPassword('');
      setConfirmPassword('');
      sessionStorage.removeItem('passwordResetEmail');
      sessionStorage.removeItem('passwordResetRole');
      setMode('completed');
    } catch (err) {
      setResetError(getApiErrorMessage(err, 'Unable to change password'));
    }
  };

  const organizationLabel = resetRole === 'student' ? 'College' : 'Company';

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-3 sm:px-4">
      <div className="max-w-md min-w-0 w-full">
        <LiquidGlassPanel className="p-5 sm:p-8">
          {mode === 'login' && (
            <>
              <h2 className="text-2xl font-bold text-center text-slate-900 mb-6">Welcome Back</h2>
              {notice && <div className="bg-emerald-50 text-emerald-700 p-3 rounded mb-4 text-sm">{notice}</div>}
              {error && <div className="bg-rose-50 text-rose-700 p-3 rounded mb-4 text-sm whitespace-pre-line">{error}</div>}
              <form onSubmit={handleLogin} className="space-y-4">
                <input
                  type="email"
                  required
                  className="glass-input"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onBlur={() => checkApprovedReset(email, resetRole)}
                  placeholder="Email"
                />
                <input type="password" required className="glass-input" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" />
                <RippleButton type="submit" className="w-full py-2 rounded-xl bg-sky-600 text-white">Sign In</RippleButton>
              </form>
              <button type="button" onClick={openForgotPassword} className="mt-3 w-full text-center text-sm text-sky-700 hover:underline">
                Forgot Password?
              </button>
              <p className="mt-4 text-center text-sm text-slate-700">
                Don't have an account? <Link to="/register" className="text-sky-700">Register</Link>
              </p>
            </>
          )}

          {mode === 'request' && (
            <>
              <h2 className="text-2xl font-bold text-center text-slate-900 mb-2">Forgot Password</h2>
              <p className="mb-5 text-center text-sm text-slate-600">Submit account details for admin review.</p>
              <div className="mb-4 flex justify-center gap-2">
                <button type="button" onClick={() => setResetRole('student')} className={`px-4 py-2 rounded-xl text-sm ${resetRole === 'student' ? 'bg-sky-600 text-white' : 'bg-white/70 text-slate-700'}`}>Student</button>
                <button type="button" onClick={() => setResetRole('interviewer')} className={`px-4 py-2 rounded-xl text-sm ${resetRole === 'interviewer' ? 'bg-sky-600 text-white' : 'bg-white/70 text-slate-700'}`}>Interviewer</button>
              </div>
              {resetError && <div className="bg-rose-50 text-rose-700 p-3 rounded mb-4 text-sm whitespace-pre-line">{resetError}</div>}
              {resetNotice && <div className="bg-emerald-50 text-emerald-700 p-3 rounded mb-4 text-sm">{resetNotice}</div>}
              <form onSubmit={handleResetRequest} className="space-y-4">
                <input required className="glass-input" value={resetForm.name} onChange={e => setResetForm({ ...resetForm, name: e.target.value })} placeholder="Full Name" />
                <input required type="email" className="glass-input" value={resetForm.email} onChange={e => setResetForm({ ...resetForm, email: e.target.value })} placeholder="Email" />
                <input required type="tel" className="glass-input" value={resetForm.phone} onChange={e => setResetForm({ ...resetForm, phone: e.target.value })} placeholder="Mobile Number" />
                <input required className="glass-input" value={resetForm.organization} onChange={e => setResetForm({ ...resetForm, organization: e.target.value })} placeholder={organizationLabel} />
                <textarea className="glass-input" rows="3" value={resetForm.reason} onChange={e => setResetForm({ ...resetForm, reason: e.target.value })} placeholder="Reason (Optional)" />
                <RippleButton type="submit" className="w-full py-2 rounded-xl bg-sky-600 text-white">Submit Request</RippleButton>
              </form>
              <button type="button" onClick={() => setMode('login')} className="mt-4 w-full text-center text-sm text-slate-600 hover:text-sky-700">
                Back to Login
              </button>
            </>
          )}

          {mode === 'approved' && (
            <>
              <h2 className="text-2xl font-bold text-center text-slate-900 mb-3">Password Reset Approved</h2>
              <p className="mb-6 text-center text-sm text-slate-600">Your password reset request has been approved.</p>
              <RippleButton type="button" onClick={() => setMode('reset')} className="w-full py-2 rounded-xl bg-sky-600 text-white">Create New Password</RippleButton>
              <button type="button" onClick={() => setMode('login')} className="mt-4 w-full text-center text-sm text-slate-600 hover:text-sky-700">
                Back to Login
              </button>
            </>
          )}

          {mode === 'reset' && (
            <>
              <h2 className="text-2xl font-bold text-center text-slate-900 mb-6">Create New Password</h2>
              {resetError && <div className="bg-rose-50 text-rose-700 p-3 rounded mb-4 text-sm whitespace-pre-line">{resetError}</div>}
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <input type="password" required className="glass-input" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New Password" />
                <input type="password" required className="glass-input" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm Password" />
                <RippleButton type="submit" className="w-full py-2 rounded-xl bg-sky-600 text-white">Save New Password</RippleButton>
              </form>
            </>
          )}

          {mode === 'completed' && (
            <>
              <h2 className="text-2xl font-bold text-center text-slate-900 mb-3">Password Changed Successfully</h2>
              <div className="mb-6 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">
                <p>Date: {completedAt ? new Date(completedAt).toLocaleDateString() : 'N/A'}</p>
                <p>Time: {completedAt ? new Date(completedAt).toLocaleTimeString() : 'N/A'}</p>
                <p>Status: Completed</p>
              </div>
              <RippleButton type="button" onClick={() => setMode('login')} className="w-full py-2 rounded-xl bg-sky-600 text-white">Go To Login</RippleButton>
            </>
          )}
        </LiquidGlassPanel>
      </div>
    </div>
  );
}
