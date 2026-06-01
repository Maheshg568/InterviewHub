import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api, { getApiErrorMessage } from '../lib/apiClient';
import { markAuthenticated } from '../lib/authState';
import LiquidGlassPanel from '../components/LiquidGlassPanel';
import RippleButton from '../components/RippleButton';

export default function Register() {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') === 'interviewer' ? 'interviewer' : 'student';

  const [role, setRole] = useState(initialRole);
  const [step, setStep] = useState(1);
  const [registeredUser, setRegisteredUser] = useState(null);
  const [interviewerDetails, setInterviewerDetails] = useState({ yearsOfExperience: '', proofOfWork: null });
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', password: '',
    college: '', course: '', company: '', experience: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/api/auth/register', { role, ...formData });
      markAuthenticated();
      if (res.data.user.role === 'interviewer') {
        setRegisteredUser(res.data.user);
        setStep(2);
      } else {
        navigate('/student-dashboard');
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Registration failed'));
    }
  };

  const submitInterviewerDetails = async (e) => {
    e.preventDefault();
    setError('');

    const years = Number(interviewerDetails.yearsOfExperience);
    if (!Number.isFinite(years) || years < 0) {
      return setError('Years of experience must be a valid number.');
    }

    try {
      const data = new FormData();
      data.append('yearsOfExperience', String(years));
      if (interviewerDetails.proofOfWork) data.append('proofOfWork', interviewerDetails.proofOfWork);
      await api.post('/api/auth/interviewer-profile', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      markAuthenticated();
      navigate('/interviewer-dashboard');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to save interviewer details'));
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-transparent px-3 py-12 sm:px-4">
      <div className="mx-auto max-w-md min-w-0">
        <LiquidGlassPanel className="p-5 sm:p-8">
          {step === 1 ? (
            <>
              <h2 className="text-2xl font-bold text-center text-slate-900 mb-6">Create Account</h2>
              <div className="mb-6 flex flex-wrap justify-center gap-2">
                <button type="button" className={`px-4 py-2 rounded-xl ${role === 'student' ? 'bg-sky-600 text-white' : 'bg-white/70 text-slate-700'}`} onClick={() => setRole('student')}>Student</button>
                <button type="button" className={`px-4 py-2 rounded-xl ${role === 'interviewer' ? 'bg-sky-600 text-white' : 'bg-white/70 text-slate-700'}`} onClick={() => setRole('interviewer')}>Interviewer</button>
              </div>
              {error && <div className="bg-rose-50 text-rose-700 p-3 rounded mb-4 text-sm">{error}</div>}
              <form onSubmit={handleRegister} className="space-y-4">
                <input name="name" type="text" required onChange={handleChange} placeholder="Full Name" className="glass-input" />
                <input name="email" type="email" required onChange={handleChange} placeholder="Email" className="glass-input" />
                <input name="phone" type="tel" onChange={handleChange} placeholder="Phone" className="glass-input" />
                {role === 'student' ? (
                  <>
                    <input name="college" type="text" required onChange={handleChange} placeholder="College / University" className="glass-input" />
                    <input name="course" type="text" required onChange={handleChange} placeholder="Course / Major" className="glass-input" />
                  </>
                ) : (
                  <>
                    <input name="company" type="text" onChange={handleChange} placeholder="Company (Optional)" className="glass-input" />
                    <textarea name="experience" required onChange={handleChange} rows="3" placeholder="Experience Summary" className="glass-input" />
                  </>
                )}
                <input name="password" type="password" required onChange={handleChange} placeholder="Password" className="glass-input" />
                <RippleButton type="submit" className="w-full py-2 rounded-xl bg-sky-600 text-white">Sign Up</RippleButton>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Interviewer Details</h2>
              <p className="text-sm text-slate-600 mb-4">Welcome {registeredUser?.name}. Add required experience and optional proof of work.</p>
              {error && <div className="bg-rose-50 text-rose-700 p-3 rounded mb-4 text-sm">{error}</div>}
              <form onSubmit={submitInterviewerDetails} className="space-y-4">
                <div>
                  <label className="block text-sm mb-1">Years of experience (required)</label>
                  <input type="number" min="0" step="1" required value={interviewerDetails.yearsOfExperience} onChange={(e) => setInterviewerDetails({ ...interviewerDetails, yearsOfExperience: e.target.value })} className="glass-input" />
                </div>
                <div>
                  <label className="block text-sm mb-1">Proof of work (optional: PDF/JPG/PNG)</label>
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setInterviewerDetails({ ...interviewerDetails, proofOfWork: e.target.files?.[0] || null })} className="block w-full text-sm" />
                </div>
                <RippleButton type="submit" className="w-full py-2 rounded-xl bg-sky-600 text-white">Save & Continue</RippleButton>
              </form>
            </>
          )}
        </LiquidGlassPanel>
      </div>
    </div>
  );
}
