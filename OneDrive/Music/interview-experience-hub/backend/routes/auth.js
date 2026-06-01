const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const User = require('../models/User');
const VerificationRequest = require('../models/VerificationRequest');
const PasswordResetRequest = require('../models/PasswordResetRequest');
const cloudinary = require('../config/cloudinary');

const interviewerProofUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 6 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Only PDF/JPG/PNG proof files are allowed.'));
    }
    cb(null, true);
  }
});

const interviewerQrUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Only JPG/PNG QR images are allowed.'));
    }
    cb(null, true);
  }
});

const profileImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Only JPG/PNG/WebP profile images are allowed.'));
    }
    cb(null, true);
  }
});

const interviewerVerificationUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 6 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Only PDF/JPG/PNG/WebP verification files are allowed.'));
    }
    cb(null, true);
  }
});

const canUseCloudinary = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

const normalizeText = (value) => String(value || '').trim().toLowerCase();
const isDisabledStatus = (status) => ['disabled', 'archived', 'inactive'].includes(status);
const appendPasswordResetEvent = (request, type, details = {}) => {
  if ((request.lifecycleEvents || []).some(event => event.type === type)) return;
  request.lifecycleEvents = [
    ...(request.lifecycleEvents || []),
    {
      type,
      at: details.at || new Date().toISOString(),
      actorType: details.actorType || 'System',
      actorName: details.actorName || '',
      status: details.status || 'Completed',
      notes: details.notes || '',
      metadata: details.metadata || {}
    }
  ];
};
const isPasswordValid = (password) => (
  typeof password === 'string' &&
  password.length >= 8 &&
  /[A-Za-z]/.test(password) &&
  /\d/.test(password)
);

const expirePasswordResetRequests = async (filter = {}) => {
  const now = new Date();
  const approved = await PasswordResetRequest.find({ ...filter, status: 'approved' });
  const expired = [];
  for (const request of approved) {
    if (request.expiresAt && new Date(request.expiresAt).getTime() <= now.getTime()) {
      request.status = 'expired';
      request.expiredAt = now.toISOString();
      appendPasswordResetEvent(request, 'password_reset_expired', {
        at: request.expiredAt,
        status: 'Failed',
        notes: 'Approved password reset request expired after 7 days.'
      });
      await request.save();
      expired.push(request);
    }
  }
  return expired;
};

const uploadProofToCloudinary = (file) => new Promise((resolve, reject) => {
  const resourceType = file.mimetype === 'application/pdf' ? 'raw' : 'image';
  const upload = cloudinary.uploader.upload_stream({
    folder: 'interview-experience-hub/interviewer-proofs',
    resource_type: resourceType,
    public_id: `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`
  }, (err, result) => {
    if (err) return reject(err);
    resolve(result);
  });
  upload.end(file.buffer);
});

const uploadQrToCloudinary = (file) => new Promise((resolve, reject) => {
  const upload = cloudinary.uploader.upload_stream({
    folder: 'interview-experience-hub/interviewer-payment-qr',
    resource_type: 'image',
    public_id: `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`
  }, (err, result) => {
    if (err) return reject(err);
    resolve(result);
  });
  upload.end(file.buffer);
});

const uploadProfileImageToCloudinary = (file) => new Promise((resolve, reject) => {
  const upload = cloudinary.uploader.upload_stream({
    folder: 'interview-experience-hub/profile-images',
    resource_type: 'image',
    public_id: `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`
  }, (err, result) => {
    if (err) return reject(err);
    resolve(result);
  });
  upload.end(file.buffer);
});

const uploadVerificationToCloudinary = (file) => new Promise((resolve, reject) => {
  const resourceType = file.mimetype === 'application/pdf' ? 'raw' : 'image';
  const upload = cloudinary.uploader.upload_stream({
    folder: 'interview-experience-hub/interviewer-verifications',
    resource_type: resourceType,
    public_id: `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`
  }, (err, result) => {
    if (err) return reject(err);
    resolve(result);
  });
  upload.end(file.buffer);
});

const calculateInterviewerCompletion = (user) => {
  const required = [
    Boolean(user.profileImage?.filePath),
    Boolean(String(user.name || '').trim()),
    Number(user.age) > 0,
    Boolean(String(user.phone || '').trim()),
    Number(user.yearsOfExperience) > 0,
    Boolean(String(user.company || '').trim()),
    Boolean(String(user.primaryExpertise || user.specialization || '').trim()),
    Boolean(String(user.city || '').trim()),
    Boolean(String(user.area || '').trim()),
    Boolean(String(user.bio || '').trim()),
    Array.isArray(user.interviewServices) && user.interviewServices.length > 0
  ];
  return Math.round((required.filter(Boolean).length / required.length) * 100);
};

const toPublicInterviewer = (user) => ({
  id: user.id,
  name: user.name,
  company: user.company || '',
  yearsOfExperience: user.yearsOfExperience || 0,
  specialization: user.specialization || '',
  age: user.age || null,
  city: user.city || '',
  area: user.area || '',
  primaryExpertise: user.primaryExpertise || user.specialization || '',
  skillTags: user.skillTags || [],
  interviewServices: user.interviewServices || [],
  availabilityPreference: user.availabilityPreference || [],
  college: user.college || '',
  course: user.course || '',
  bio: user.bio || '',
  profileImage: user.profileImage || null,
  verification: {
    status: user.verification?.status || 'required'
  },
  paymentQr: user.paymentQr || null
});

const toInterviewerProfileSnapshot = (user) => ({
  name: user.name || '',
  age: user.age || null,
  phone: user.phone || '',
  yearsOfExperience: user.yearsOfExperience || 0,
  company: user.company || '',
  primaryExpertise: user.primaryExpertise || user.specialization || '',
  city: user.city || '',
  area: user.area || '',
  college: user.college || '',
  course: user.course || '',
  bio: user.bio || '',
  skillTags: user.skillTags || [],
  interviewServices: user.interviewServices || [],
  availabilityPreference: user.availabilityPreference || []
});

const requireAuth = (req, res, next) => {
  if (!req.session?.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
};

router.post('/register', async (req, res) => {
  const { role, name, email, phone, password, ...otherData } = req.body;
  if (!role || !name || !email || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const existing = await User.findOne({ email }).lean();
  if (existing) {
    return res.status(400).json({ error: 'Email already exists' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      id: Date.now().toString(),
      role,
      name,
      email,
      phone: phone || '',
      password: hashedPassword,
      ...otherData,
      createdAt: new Date().toISOString()
    });

    const userWithoutPassword = newUser.toObject();
    delete userWithoutPassword.password;
    req.session.user = userWithoutPassword;

    res.status(201).json({ message: 'User registered successfully', user: userWithoutPassword });
  } catch {
    res.status(500).json({ error: 'Server error during registration' });
  }
});

router.post('/interviewer-profile', requireAuth, (req, res) => {
  interviewerProofUpload.single('proofOfWork')(req, res, async (uploadError) => {
    if (uploadError) {
      return res.status(400).json({ error: uploadError.message });
    }

    if (req.session.user.role !== 'interviewer') {
      return res.status(403).json({ error: 'Only interviewers can update this profile section.' });
    }

    const years = Number(req.body.yearsOfExperience);
    if (!Number.isFinite(years) || years < 0) {
      return res.status(400).json({ error: 'Years of experience must be a valid non-negative number.' });
    }

    const user = await User.findOne({ id: req.session.user.id });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    user.yearsOfExperience = years;
    if (req.file) {
      let filePath = null;
      if (canUseCloudinary) {
        const uploaded = await uploadProofToCloudinary(req.file);
        filePath = uploaded.secure_url;
      } else if (process.env.NODE_ENV !== 'production') {
        const uploadsDir = path.join(__dirname, '../uploads/');
        fs.mkdirSync(uploadsDir, { recursive: true });
        const safeName = `${Date.now()}-${req.file.originalname.replace(/\s+/g, '-')}`;
        const outputPath = path.join(uploadsDir, safeName);
        fs.writeFileSync(outputPath, req.file.buffer);
        filePath = `/uploads/${safeName}`;
      } else {
        return res.status(500).json({ error: 'Cloudinary is required for uploads in production.' });
      }

      user.proofOfWork = {
        fileName: req.file.originalname,
        filePath,
        mimeType: req.file.mimetype,
        uploadedAt: new Date().toISOString()
      };
    }

    await user.save();
    const updatedUser = user.toObject();
    delete updatedUser.password;
    req.session.user = updatedUser;

    res.json({ message: 'Interviewer profile details saved.', user: updatedUser });
  });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  if (user.role === 'student' && ['disabled', 'inactive', 'archived'].includes(user.status)) {
    return res.status(403).json({
      error: 'Account Disabled\nYour account has been disabled.\nPlease contact admin for assistance.'
    });
  }

  user.lastActive = new Date().toISOString();
  await User.updateOne({ _id: user._id }, { $set: { lastActive: user.lastActive } });

  const userWithoutPassword = user.toObject();
  delete userWithoutPassword.password;
  req.session.user = userWithoutPassword;

  res.json({ message: 'Logged in successfully', user: userWithoutPassword });
});

router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: 'Failed to logout' });
    res.clearCookie('connect.sid');
    return res.json({ message: 'Logged out successfully' });
  });
});

router.post('/password-reset-request', async (req, res) => {
  const { role, name, email, phone, college, company, reason } = req.body;
  if (!['student', 'interviewer'].includes(role)) {
    return res.status(400).json({ error: 'Select student or interviewer.' });
  }

  const organization = role === 'student' ? college : company;
  if (!name || !email || !phone || !organization) {
    return res.status(400).json({ error: 'All required fields must be completed.' });
  }

  const user = await User.findOne({ role, email });
  if (!user) {
    return res.status(404).json({ error: 'Unable to verify account information.\nPlease check your details.' });
  }

  if (isDisabledStatus(user.status)) {
    return res.status(403).json({ error: 'Account Disabled\nPlease contact admin for assistance.' });
  }

  const expectedOrganization = role === 'student' ? user.college : user.company;
  const matches = (
    normalizeText(user.name) === normalizeText(name) &&
    normalizeText(user.email) === normalizeText(email) &&
    normalizeText(user.phone) === normalizeText(phone) &&
    normalizeText(expectedOrganization) === normalizeText(organization)
  );
  if (!matches) {
    return res.status(400).json({ error: 'Unable to verify account information.\nPlease check your details.' });
  }

  await expirePasswordResetRequests({ userId: user.id });
  const activeRequest = await PasswordResetRequest.findOne({
    userId: user.id,
    status: { $in: ['pending', 'approved'] }
  }).sort({ createdAt: -1 });

  if (activeRequest?.status === 'pending') {
    return res.status(409).json({ error: 'Password reset request already submitted.\nPlease wait for admin review.' });
  }
  if (activeRequest?.status === 'approved') {
    return res.status(409).json({ error: 'You already have an approved password reset request.\nPlease complete the password reset process.' });
  }

  const createdAt = new Date().toISOString();
  const request = await PasswordResetRequest.create({
    id: `password-reset-${Date.now()}-${user.id}`,
    userId: user.id,
    userRole: role,
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    organization: expectedOrganization || '',
    organizationType: role === 'student' ? 'college' : 'company',
    reason: String(reason || '').trim(),
    status: 'pending',
    accountCreatedAt: user.createdAt || '',
    lastLoginAt: user.lastActive || '',
    createdAt
  });
  appendPasswordResetEvent(request, 'password_reset_requested', {
    at: createdAt,
    actorType: role,
    actorName: user.name,
    metadata: {
      userId: user.id,
      role,
      email: user.email,
      phone: user.phone || ''
    }
  });
  await request.save();

  res.status(201).json({
    message: 'Password reset request submitted. Please wait for admin review.',
    request: {
      id: request.id,
      status: request.status,
      createdAt: request.createdAt
    }
  });
});

router.get('/password-reset-status', async (req, res) => {
  const { role, email } = req.query;
  if (!['student', 'interviewer'].includes(role) || !email) {
    return res.json({ status: 'none' });
  }

  const user = await User.findOne({ role, email }).lean();
  if (!user) return res.json({ status: 'none' });

  await expirePasswordResetRequests({ userId: user.id });
  const request = await PasswordResetRequest.findOne({ userId: user.id }).sort({ createdAt: -1 });
  if (!request) return res.json({ status: 'none' });

  if (request.status === 'approved') {
    if (!request.openedAt) {
      request.openedAt = new Date().toISOString();
      appendPasswordResetEvent(request, 'reset_link_opened', {
        at: request.openedAt,
        actorType: user.role,
        actorName: user.name
      });
      await request.save();
    }
    return res.json({
      status: 'approved',
      expiresAt: request.expiresAt,
      approvedAt: request.approvedAt
    });
  }
  if (request.status === 'declined') {
    return res.json({
      status: 'declined',
      declinedAt: request.declinedAt
    });
  }

  res.json({ status: request.status || 'none' });
});

router.post('/password-reset-complete', async (req, res) => {
  const { role, email, newPassword, confirmPassword } = req.body;
  if (!['student', 'interviewer'].includes(role) || !email) {
    return res.status(400).json({ error: 'Account details are required.' });
  }
  if (!isPasswordValid(newPassword)) {
    return res.status(400).json({ error: 'Password must be at least 8 characters and include at least one letter and one number.' });
  }
  if (newPassword !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match.' });
  }

  const user = await User.findOne({ role, email });
  if (!user) {
    return res.status(404).json({ error: 'Password reset request not found.' });
  }

  await expirePasswordResetRequests({ userId: user.id });
  const request = await PasswordResetRequest.findOne({
    userId: user.id,
    status: 'approved'
  }).sort({ approvedAt: -1 });

  if (!request) {
    return res.status(403).json({ error: 'No approved password reset request is available.' });
  }
  if (!request.expiresAt || new Date(request.expiresAt).getTime() <= Date.now()) {
    request.status = 'expired';
    request.expiredAt = new Date().toISOString();
    appendPasswordResetEvent(request, 'password_reset_expired', {
      at: request.expiredAt,
      status: 'Failed',
      notes: 'Approved password reset request expired before completion.'
    });
    await request.save();
    return res.status(403).json({ error: 'Password reset approval has expired. Please submit a new request.' });
  }

  const changedAt = new Date().toISOString();
  user.password = await bcrypt.hash(newPassword, 10);
  user.passwordChangedAt = changedAt;
  await user.save();

  request.status = 'completed';
  request.completedAt = changedAt;
  request.passwordChangedAt = changedAt;
  appendPasswordResetEvent(request, 'password_updated', {
    at: changedAt,
    actorType: user.role,
    actorName: user.name,
    metadata: { passwordHashUpdated: true }
  });
  appendPasswordResetEvent(request, 'password_reset_completed', {
    at: changedAt,
    actorType: 'System',
    actorName: 'System',
    metadata: { oldPasswordInvalidated: true }
  });
  await request.save();

  res.json({
    message: 'Password Changed Successfully',
    completedAt: changedAt,
    status: 'completed'
  });
});

router.get('/me', async (req, res) => {
  if (!req.session?.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const latest = await User.findOne({ id: req.session.user.id });
  if (!latest) {
    return res.status(401).json({ error: 'Session user no longer exists' });
  }
  if (latest.role === 'student' && ['disabled', 'inactive', 'archived'].includes(latest.status)) {
    req.session.destroy(() => {});
    return res.status(403).json({
      error: 'Account Disabled\nYour account has been disabled.\nPlease contact admin for assistance.'
    });
  }

  const userWithoutPassword = latest.toObject();
  delete userWithoutPassword.password;
  req.session.user = userWithoutPassword;
  res.json({ user: userWithoutPassword });
});

router.put('/profile', requireAuth, (req, res) => {
  profileImageUpload.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'refundQr', maxCount: 1 }
  ])(req, res, async (uploadError) => {
    if (uploadError) {
      return res.status(400).json({ error: uploadError.message });
    }

    if (req.session.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can update this profile.' });
    }

    const user = await User.findOne({ id: req.session.user.id });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const cleanText = (value, maxLength = 120) => String(value || '').trim().slice(0, maxLength);
    user.name = cleanText(req.body.name, 100) || user.name;
    user.college = cleanText(req.body.college, 140);
    user.course = cleanText(req.body.course, 120);
    user.phone = cleanText(req.body.phone, 32);
    user.bio = cleanText(req.body.bio, 220);
    const refundUpiId = cleanText(req.body.refundUpiId, 100);
    const profileFile = req.files?.profileImage?.[0] || null;
    const refundQrFile = req.files?.refundQr?.[0] || null;

    if (refundUpiId && (refundUpiId.length < 5 || refundUpiId.length > 100)) {
      return res.status(400).json({ error: 'UPI ID must be between 5 and 100 characters.' });
    }

    if (!refundUpiId && !refundQrFile && !user.refundInfo?.qrCode?.filePath) {
      return res.status(400).json({ error: 'Add a refund UPI ID or refund QR code before saving.' });
    }

    if (profileFile) {
      let filePath = null;
      if (canUseCloudinary) {
        const uploaded = await uploadProfileImageToCloudinary(profileFile);
        filePath = uploaded.secure_url;
      } else if (process.env.NODE_ENV !== 'production') {
        const uploadsDir = path.join(__dirname, '../uploads/profile-images/');
        fs.mkdirSync(uploadsDir, { recursive: true });
        const safeName = `${Date.now()}-${profileFile.originalname.replace(/\s+/g, '-')}`;
        const outputPath = path.join(uploadsDir, safeName);
        fs.writeFileSync(outputPath, profileFile.buffer);
        filePath = `/uploads/profile-images/${safeName}`;
      } else {
        return res.status(500).json({ error: 'Cloudinary is required for uploads in production.' });
      }

      user.profileImage = {
        fileName: profileFile.originalname,
        filePath,
        mimeType: profileFile.mimetype,
        uploadedAt: new Date().toISOString(),
        focusX: Number(req.body.focusX) || 50,
        focusY: Number(req.body.focusY) || 50
      };
    }

    user.refundInfo = {
      ...(user.refundInfo || {}),
      upiId: refundUpiId
    };

    if (refundQrFile) {
      let filePath = null;
      if (canUseCloudinary) {
        const uploaded = await uploadProfileImageToCloudinary(refundQrFile);
        filePath = uploaded.secure_url;
      } else if (process.env.NODE_ENV !== 'production') {
        const uploadsDir = path.join(__dirname, '../uploads/refund-qr/');
        fs.mkdirSync(uploadsDir, { recursive: true });
        const safeName = `${Date.now()}-${refundQrFile.originalname.replace(/\s+/g, '-')}`;
        const outputPath = path.join(uploadsDir, safeName);
        fs.writeFileSync(outputPath, refundQrFile.buffer);
        filePath = `/uploads/refund-qr/${safeName}`;
      } else {
        return res.status(500).json({ error: 'Cloudinary is required for uploads in production.' });
      }

      user.refundInfo.qrCode = {
        fileName: refundQrFile.originalname,
        filePath,
        mimeType: refundQrFile.mimetype,
        uploadedAt: new Date().toISOString()
      };
    }

    await user.save();
    const updatedUser = user.toObject();
    delete updatedUser.password;
    req.session.user = updatedUser;

    return res.json({ message: 'Profile updated successfully.', user: updatedUser });
  });
});

router.put('/interviewer-profile', requireAuth, (req, res) => {
  profileImageUpload.single('profileImage')(req, res, async (uploadError) => {
    if (uploadError) {
      return res.status(400).json({ error: uploadError.message });
    }

    if (req.session.user.role !== 'interviewer') {
      return res.status(403).json({ error: 'Only interviewers can update this profile.' });
    }

    const user = await User.findOne({ id: req.session.user.id });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const cleanText = (value, maxLength = 120) => String(value || '').trim().slice(0, maxLength);
    const cleanArray = (value, maxItems, maxLength = 40) => {
      let parsed = value;
      if (typeof value === 'string') {
        try {
          parsed = JSON.parse(value);
        } catch {
          parsed = value.split(',');
        }
      }
      if (!Array.isArray(parsed)) return [];
      return parsed.map(item => cleanText(item, maxLength)).filter(Boolean).slice(0, maxItems);
    };

    const age = Number(req.body.age);
    const years = Number(req.body.yearsOfExperience);
    user.name = cleanText(req.body.name, 100) || user.name;
    user.age = Number.isFinite(age) && age > 0 ? age : null;
    user.phone = cleanText(req.body.phone, 32);
    user.yearsOfExperience = Number.isFinite(years) && years >= 0 ? years : 0;
    user.experience = user.yearsOfExperience ? `${user.yearsOfExperience} Years` : '';
    user.company = cleanText(req.body.company, 140);
    user.primaryExpertise = cleanText(req.body.primaryExpertise, 100);
    user.specialization = user.primaryExpertise;
    user.city = cleanText(req.body.city, 80);
    user.area = cleanText(req.body.area, 100);
    user.about = cleanText(req.body.about, 300);
    user.bio = cleanText(req.body.bio || req.body.about, 300);
    user.college = cleanText(req.body.college, 140);
    user.course = cleanText(req.body.course, 120);
    user.skillTags = cleanArray(req.body.skillTags, 8, 32);
    user.interviewServices = cleanArray(req.body.interviewServices, 5, 60);
    user.availabilityPreference = cleanArray(req.body.availabilityPreference, 3, 32);

    if (req.file) {
      let filePath = null;
      if (canUseCloudinary) {
        const uploaded = await uploadProfileImageToCloudinary(req.file);
        filePath = uploaded.secure_url;
      } else if (process.env.NODE_ENV !== 'production') {
        const uploadsDir = path.join(__dirname, '../uploads/profile-images/');
        fs.mkdirSync(uploadsDir, { recursive: true });
        const safeName = `${Date.now()}-${req.file.originalname.replace(/\s+/g, '-')}`;
        const outputPath = path.join(uploadsDir, safeName);
        fs.writeFileSync(outputPath, req.file.buffer);
        filePath = `/uploads/profile-images/${safeName}`;
      } else {
        return res.status(500).json({ error: 'Cloudinary is required for uploads in production.' });
      }

      user.profileImage = {
        fileName: req.file.originalname,
        filePath,
        mimeType: req.file.mimetype,
        uploadedAt: new Date().toISOString(),
        focusX: Number(req.body.focusX) || 50,
        focusY: Number(req.body.focusY) || 50
      };
    } else if (user.profileImage?.filePath) {
      user.profileImage.focusX = Number(req.body.focusX) || user.profileImage.focusX || 50;
      user.profileImage.focusY = Number(req.body.focusY) || user.profileImage.focusY || 50;
    }

    if (user.verification?.status === 'verified') {
      user.lastProfileEditedAt = new Date().toISOString();
      user.lastProfileEditSummary = ['Profile information'];
    }

    await user.save();
    const updatedUser = user.toObject();
    delete updatedUser.password;
    updatedUser.profileCompletion = calculateInterviewerCompletion(updatedUser);
    req.session.user = updatedUser;

    return res.json({ message: 'Interviewer profile updated successfully.', user: updatedUser });
  });
});

router.post('/interviewer-verification', requireAuth, (req, res) => {
  interviewerVerificationUpload.single('verificationDocument')(req, res, async (uploadError) => {
    if (uploadError) {
      return res.status(400).json({ error: uploadError.message });
    }

    if (req.session.user.role !== 'interviewer') {
      return res.status(403).json({ error: 'Only interviewers can submit verification.' });
    }

    const allowedTypes = ['College ID', 'Employee ID', 'Internship ID', 'Professional Certificate', 'Government ID'];
    if (!allowedTypes.includes(req.body.documentType)) {
      return res.status(400).json({ error: 'Select a valid verification document type.' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Verification document is required.' });
    }

    const user = await User.findOne({ id: req.session.user.id });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    if (calculateInterviewerCompletion(user) < 100) {
      return res.status(409).json({ error: 'Complete all required profile fields before verification.' });
    }

    let filePath = null;
    if (canUseCloudinary) {
      const uploaded = await uploadVerificationToCloudinary(req.file);
      filePath = uploaded.secure_url;
    } else if (process.env.NODE_ENV !== 'production') {
      const uploadsDir = path.join(__dirname, '../uploads/interviewer-verifications/');
      fs.mkdirSync(uploadsDir, { recursive: true });
      const safeName = `${Date.now()}-${req.file.originalname.replace(/\s+/g, '-')}`;
      const outputPath = path.join(uploadsDir, safeName);
      fs.writeFileSync(outputPath, req.file.buffer);
      filePath = `/uploads/interviewer-verifications/${safeName}`;
    } else {
      return res.status(500).json({ error: 'Cloudinary is required for uploads in production.' });
    }

    const uploadedAt = new Date().toISOString();
    const isUpdateRequest = user.verification?.status === 'verified' && Boolean(user.verification?.filePath);
    const request = await VerificationRequest.create({
      id: `verification-${Date.now()}-${user.id}`,
      interviewerId: user.id,
      requestType: isUpdateRequest ? 'update' : 'new',
      status: isUpdateRequest ? 'update_pending' : 'pending',
      profile: toInterviewerProfileSnapshot(user),
      profileImage: user.profileImage || null,
      oldDocument: isUpdateRequest ? {
        documentType: user.verification?.documentType || '',
        fileName: user.verification?.fileName || '',
        filePath: user.verification?.filePath || '',
        mimeType: user.verification?.mimeType || '',
        uploadedAt: user.verification?.uploadedAt || ''
      } : null,
      document: {
        documentType: req.body.documentType,
        fileName: req.file.originalname,
        filePath,
        mimeType: req.file.mimetype,
        uploadedAt
      },
      createdAt: uploadedAt,
      updatedAt: uploadedAt
    });

    const nextVerification = {
      ...(user.verification || {}),
      status: isUpdateRequest ? 'update_pending' : 'pending',
      requestId: request.id,
      requestType: isUpdateRequest ? 'update' : 'new',
      reviewedAt: '',
      reviewedBy: '',
      rejectionReason: ''
    };
    if (!isUpdateRequest) {
      Object.assign(nextVerification, {
        documentType: req.body.documentType,
        fileName: req.file.originalname,
        filePath,
        mimeType: req.file.mimetype,
        uploadedAt
      });
    }
    user.verification = nextVerification;
    user.verificationSuccessDismissedAt = null;

    await user.save();
    const updatedUser = user.toObject();
    delete updatedUser.password;
    updatedUser.profileCompletion = calculateInterviewerCompletion(updatedUser);
    req.session.user = updatedUser;

    return res.json({ message: 'Verification submitted for admin review.', user: updatedUser });
  });
});

router.post('/interviewer-verification-success-dismiss', requireAuth, async (req, res) => {
  if (req.session.user.role !== 'interviewer') {
    return res.status(403).json({ error: 'Only interviewers can dismiss this message.' });
  }

  const user = await User.findOne({ id: req.session.user.id });
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  user.verificationSuccessDismissedAt = new Date().toISOString();
  await user.save();
  const updatedUser = user.toObject();
  delete updatedUser.password;
  req.session.user = updatedUser;

  return res.json({ message: 'Verification success message dismissed.', user: updatedUser });
});

router.get('/interviewers', async (req, res) => {
  const users = await User.find({
    role: 'interviewer',
    status: 'active',
    'verification.status': 'verified'
  }).lean();
  const interviewers = users.map(toPublicInterviewer);
  res.json({ interviewers });
});

router.post('/interviewer-payment-qr', requireAuth, (req, res) => {
  interviewerQrUpload.single('paymentQr')(req, res, async (uploadError) => {
    if (uploadError) {
      return res.status(400).json({ error: uploadError.message });
    }

    if (req.session.user.role !== 'interviewer') {
      return res.status(403).json({ error: 'Only interviewers can manage payment QR.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'QR image is required.' });
    }

    const user = await User.findOne({ id: req.session.user.id });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    let filePath = null;
    if (canUseCloudinary) {
      const uploaded = await uploadQrToCloudinary(req.file);
      filePath = uploaded.secure_url;
    } else if (process.env.NODE_ENV !== 'production') {
      const uploadsDir = path.join(__dirname, '../uploads/');
      fs.mkdirSync(uploadsDir, { recursive: true });
      const safeName = `${Date.now()}-${req.file.originalname.replace(/\s+/g, '-')}`;
      const outputPath = path.join(uploadsDir, safeName);
      fs.writeFileSync(outputPath, req.file.buffer);
      filePath = `/uploads/${safeName}`;
    } else {
      return res.status(500).json({ error: 'Cloudinary is required for uploads in production.' });
    }

    user.paymentQr = {
      fileName: req.file.originalname,
      filePath,
      mimeType: req.file.mimetype,
      uploadedAt: new Date().toISOString()
    };

    await user.save();
    const updatedUser = user.toObject();
    delete updatedUser.password;
    req.session.user = updatedUser;

    return res.json({ message: 'Payment QR saved successfully.', paymentQr: user.paymentQr, user: updatedUser });
  });
});

module.exports = router;
