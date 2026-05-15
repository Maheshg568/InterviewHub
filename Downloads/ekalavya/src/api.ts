import axios from "axios";
import { Student, Assignment } from "./types";

const api = axios.create({
  baseURL: "/api",
});

export const getStudents = () => api.get<Student[]>("/students");
export const getStudent = (id: string) => api.get<Student>(`/student/${id}`);
export const getAssignments = () => api.get<Assignment[]>("/assignments");

export const simplifyText = (text: string) => 
  api.post("/simplify", { text });

export const askTutor = (student_id: string, message: string) => 
  api.post("/tutor", { student_id, message });

export const socraticChat = (student_id: string, topic: string, message: string) => 
  api.post("/socratic-chat", { student_id, topic, message });

export const tutorFlip = (student_id: string, topic: string, explanation: string) => 
  api.post("/tutor-flip", { student_id, topic, student_explanation: explanation });

export const getSample = () => api.get('/sample');
export const getSampleData = () => api.get('/sample-data');
export const microLesson = (topic: string, student_id?: string) => api.post('/micro-lesson', { topic, student_id });
export const generateQuiz = (student_id: string, topic: string, difficulty?: string) => api.post('/generate-quiz', { student_id, topic, difficulty });
export const submitQuiz = (payload: any) => api.post('/submit-quiz', payload);
export const sessionLog = (data: any) => api.post('/session-log', data);
export const generateFingerprint = (student_id: string) => api.post('/generate-fingerprint', { student_id });
export const getTeacherAlerts = () => api.get('/teacher/alerts');
export const getReport = (session_id: string) => api.get(`/report/${session_id}`);

export const getDNA = (student_id: string) => api.get(`/dna/${student_id}`);
export const getFingerprint = (student_id: string) => api.get(`/fingerprint/${student_id}`);

export const getTeacherDashboard = () => 
  api.get("/teacher/dashboard");

export default api;
