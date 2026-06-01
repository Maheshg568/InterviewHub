import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Register from './pages/Register';
import Login from './pages/Login';
import DashboardStudent from './pages/DashboardStudent';
import StudentProfile from './pages/StudentProfile';
import InterviewerProfile from './pages/InterviewerProfile';
import DashboardInterviewer from './pages/DashboardInterviewer';
import AdminDashboard from './pages/AdminDashboard';
import AdminJourneyTracker from './pages/AdminJourneyTracker';
import AdminVerificationRequest from './pages/AdminVerificationRequest';
import Notifications from './pages/Notifications';
import Booking from './pages/Booking';
import AIPractice from './pages/AIPractice';
import Help from './pages/Help';
import Header from './components/Header';
import Footer from './components/Footer';
import JellyScroll from './components/JellyScroll';
import api from './lib/apiClient';
import { useState, useEffect } from 'react';

const getRoleHome = (role) => {
  if (role === 'student') return '/student-dashboard';
  if (role === 'interviewer') return '/interviewer-dashboard';
  if (role === 'admin') return '/admin';
  return '/login';
};

function ProtectedRoute({ children, allowedRoles }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    api.get('/api/auth/me').then(res => {
      const u = res.data?.user;
      setUser(u);
      setLoading(false);
    }).catch(() => {
      setUser(null);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-500">Checking access...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to={getRoleHome(user.role)} replace />;
  return children;
}

function App() {
  return (
    <Router>
      <svg width="0" height="0" className="absolute">
        <filter id="gooey-ripple">
          <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
          <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo" />
          <feBlend in="SourceGraphic" in2="goo" />
        </filter>
      </svg>
      <div className="app-shell flex flex-col min-h-screen">
        <Header />
        <JellyScroll>
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <StudentProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student-dashboard"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <DashboardStudent />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/interviewer-dashboard"
                element={
                  <ProtectedRoute allowedRoles={['interviewer']}>
                    <DashboardInterviewer />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute allowedRoles={['student', 'interviewer']}>
                    <Notifications />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/interviewer-profile"
                element={
                  <ProtectedRoute allowedRoles={['interviewer']}>
                    <InterviewerProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/book/:interviewerId"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <Booking />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/practice"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <AIPractice />
                  </ProtectedRoute>
                }
              />
              <Route path="/help" element={<Help />} />
              <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/interview-journey-tracker" element={<ProtectedRoute allowedRoles={['admin']}><AdminJourneyTracker /></ProtectedRoute>} />
              <Route path="/admin/verification-requests/:requestId" element={<ProtectedRoute allowedRoles={['admin']}><AdminVerificationRequest /></ProtectedRoute>} />
            </Routes>
          </main>
        </JellyScroll>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
