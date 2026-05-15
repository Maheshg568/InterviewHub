import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import StudentDashboard from "./pages/StudentDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import LessonPage from "./pages/LessonPage";
import AITutorPage from "./pages/AITutorPage";
import LearningDNAProfile from "./pages/LearningDNAProfile";
import SocraticSession from "./pages/SocraticSession";
import TutorFlip from "./pages/TutorFlip";
import QuizPage from "./pages/QuizPage";
import CognitiveFingerprint from "./pages/CognitiveFingerprint";
import SessionReport from "./pages/SessionReport";

// Redirect component to handle default student
function AuthGuard({ children }: { children: React.ReactNode }) {
  // Simulating simplified login session
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          
          {/* Student Routes */}
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/lessons" element={<LessonPage />} />
          <Route path="/student/tutor" element={<AITutorPage />} />
          <Route path="/student/socratic" element={<SocraticSession />} />
          <Route path="/student/flip" element={<TutorFlip />} />
          <Route path="/student/dna" element={<LearningDNAProfile />} />
          <Route path="/student/quiz" element={<QuizPage />} />
          <Route path="/student/fingerprint" element={<CognitiveFingerprint />} />
          <Route path="/student/report" element={<SessionReport />} />

          {/* Teacher Routes */}
          <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
          <Route path="/teacher/report" element={<SessionReport />} />
          <Route path="/teacher/dna" element={<LearningDNAProfile />} />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
