import { Link } from 'react-router-dom';
import SpringMotion from '../components/SpringMotion';

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-5rem)] px-3 py-10 sm:px-4 flex items-center justify-center">
      <SpringMotion className="w-full max-w-4xl">
        <div className="liquid-glass-panel p-5 text-center sm:p-10">
          <h1 className="text-[1.9rem] min-[360px]:text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight mb-5">Interview Experience Hub</h1>
          <p className="text-lg sm:text-xl text-slate-700 mb-8">Gain real interview experience, receive structured feedback, and track resume growth.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/register?role=student" className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-3 rounded-xl font-semibold sm:px-8">Register as Student</Link>
            <Link to="/register?role=interviewer" className="bg-white/85 hover:bg-white text-slate-900 px-4 py-3 rounded-xl font-semibold sm:px-8">Register as Interviewer</Link>
          </div>
        </div>
      </SpringMotion>
    </div>
  );
}
