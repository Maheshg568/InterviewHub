const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '.env') });
const bcrypt = require('bcrypt');
const connectDB = require('./config/db');
const User = require('./models/User');
const Booking = require('./models/Booking');

async function seed() {
  await connectDB();

  const passwordHash = await bcrypt.hash('password123', 10);

  const demoUsers = [
    {
      id: 'student-1', role: 'student', name: 'Alice Student', email: 'student@demo.com', phone: '555-0101',
      password: passwordHash, college: 'Tech University', course: 'BCA', resumes: []
    },
    {
      id: 'interviewer-1', role: 'interviewer', name: 'Bob Interviewer', email: 'interviewer@demo.com', phone: '555-0202',
      password: passwordHash, company: 'Google', experience: 'Senior Engineer focused on backend and AI interview loops.', yearsOfExperience: 6
    },
    {
      id: 'interviewer-2', role: 'interviewer', name: 'Carol Recruiter', email: 'carol@demo.com', phone: '555-0303',
      password: passwordHash, company: 'Amazon', experience: 'Technical recruiter specializing in behavioral and system design interviews.', yearsOfExperience: 8
    },
    {
      id: 'admin-1', role: 'admin', name: 'Admin User', email: 'admin@demo.com', phone: '8095846864',
      password: passwordHash, createdAt: new Date().toISOString()
    }
  ];

  const now = Date.now();
  const demoBookings = [
    {
      id: 'booking-1',
      studentId: 'student-1',
      studentName: 'Alice Student',
      interviewerId: 'interviewer-1',
      interviewerName: 'Bob Interviewer',
      domain: 'Data Structures & Algorithms',
      preferredSlots: [{ date: '2026-03-20', time: '10:00-12:00', label: '2026-03-20 10:00-12:00' }],
      selectedSlot: { date: '2026-03-20', time: '10:00-12:00', label: '2026-03-20 10:00-12:00' },
      date: '2026-03-20',
      slot: '10:00-12:00',
      status: 'completed',
      paymentProof: null,
      paymentProofName: '',
      paymentStatus: 'not_uploaded',
      paymentVerifiedAt: null,
      paymentVerifiedBy: null,
      meetingLink: null,
      createdAt: new Date(now - 10 * 60 * 60 * 1000).toISOString(),
      approvalDeadlineAt: new Date(now - 4 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
      notifications: [],
      feedback: {
        communication: 8,
        technical: 7,
        behaviour: 9,
        confidence: 8,
        resumeScore: 8,
        comments: 'Good understanding of basic data structures. Need to practice dynamic programming.',
        submittedAt: new Date(now - 2 * 60 * 60 * 1000).toISOString()
      }
    }
  ];

  await User.deleteMany({});
  await Booking.deleteMany({});
  await User.insertMany(demoUsers);
  await Booking.insertMany(demoBookings);

  console.log('Database seeded successfully!');
  console.log('Demo Accounts:');
  console.log('Student: student@demo.com / password123');
  console.log('Interviewer: interviewer@demo.com / password123');
  process.exit(0);
}

seed().catch((error) => {
  console.error('Seed failed', error.message);
  process.exit(1);
});
