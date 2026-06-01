import { useState } from 'react';
import api, { getApiErrorMessage } from '../lib/apiClient';
import LiquidGlassPanel from '../components/LiquidGlassPanel';
import RippleButton from '../components/RippleButton';

export default function AIPractice() {
  const [topic, setTopic] = useState('');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [error, setError] = useState('');

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!topic) return;
    setLoading(true);
    setError('');
    setCurrentQ(0);
    setQuestions([]);

    try {
      const res = await api.post('/api/ai/practice', { role: 'student', topic });
      setQuestions(res.data.questions || []);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to generate practice questions.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <LiquidGlassPanel className="p-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-3 text-center">AI Interview Practice</h1>
        <p className="text-slate-600 text-center mb-8">Select a topic to generate 5 practice questions.</p>

        <form onSubmit={handleGenerate} className="flex flex-col sm:flex-row justify-center mb-10 gap-3">
          <select value={topic} onChange={e => setTopic(e.target.value)} className="glass-input sm:w-72" required>
            <option value="">Select Topic</option>
            <option value="General HR">General HR</option>
            <option value="BCA Technical">BCA Technical</option>
            <option value="Data Structures & Algorithms">Algorithms</option>
            <option value="React Frontend">React Frontend</option>
          </select>
          <RippleButton type="submit" disabled={loading || !topic} className="px-6 py-3 rounded-xl text-white bg-sky-600 disabled:opacity-50">
            {loading ? 'Generating...' : 'Start Practice'}
          </RippleButton>
        </form>

        {error && <div className="bg-rose-50 text-rose-700 p-4 rounded mb-6 text-center">{error}</div>}

        {questions.length > 0 && (
          <div className="bg-white/60 border border-white/70 rounded-2xl p-8">
            <div className="flex justify-between items-center mb-6">
              <span className="text-sm font-bold text-sky-800 uppercase">Question {currentQ + 1} of {questions.length}</span>
            </div>
            <h2 className="text-2xl font-medium text-slate-900 mb-8">{questions[currentQ]}</h2>
            <div className="flex justify-between mt-8 border-t border-white/70 pt-6">
              <button onClick={() => setCurrentQ(Math.max(0, currentQ - 1))} disabled={currentQ === 0} className="px-4 py-2 rounded text-sky-700 disabled:text-slate-400">Previous</button>
              <button onClick={() => setCurrentQ(Math.min(questions.length - 1, currentQ + 1))} disabled={currentQ === questions.length - 1} className="px-6 py-2 rounded-xl bg-sky-600 text-white disabled:opacity-50">Next</button>
            </div>
          </div>
        )}
      </LiquidGlassPanel>
    </div>
  );
}
