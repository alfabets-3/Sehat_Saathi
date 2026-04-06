import { Router } from 'express';
import db from '../db.js';
import { generateToken, authMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/send-otp', (req, res) => {
  const { phone } = req.body;
  if (!phone || phone.length < 10) return res.status(400).json({ error: 'Valid phone required' });
  const user = db.findOne('users', u => u.phone === phone);
  if (!user) return res.status(404).json({ error: 'User not found. Please register first.' });
  db.update('users', u => u.phone === phone, { otp: '123456', otp_expires: new Date(Date.now()+300000).toISOString() });
  res.json({ success: true, message: 'OTP sent successfully', demo_otp: '123456' });
});

router.post('/verify-otp', (req, res) => {
  const { phone, otp } = req.body;
  const user = db.findOne('users', u => u.phone === phone);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (otp !== '123456' && otp !== user.otp) return res.status(400).json({ error: 'Invalid OTP' });

  let profile = null;
  if (user.role === 'patient') profile = db.findOne('patients', p => p.patient_id === user.ref_id);
  else if (user.role === 'doctor') profile = db.findOne('doctors', d => d.doctor_id === user.ref_id);
  else if (user.role === 'pharmacist') profile = db.findOne('pharmacies', p => p.pharmacy_id === user.ref_id);

  const token = generateToken({ userId: user.user_id, phone: user.phone, role: user.role, refId: user.ref_id });
  db.update('users', u => u.user_id === user.user_id, { token, otp: null });
  res.json({ success: true, token, user: { userId: user.user_id, phone: user.phone, role: user.role, refId: user.ref_id, profile } });
});

router.post('/demo-login', (req, res) => {
  const { role } = req.body;
  const user = db.findOne('users', u => u.role === role);
  if (!user) return res.status(404).json({ error: 'No demo user for role: ' + role });

  let profile = null;
  if (user.role === 'patient') profile = db.findOne('patients', p => p.patient_id === user.ref_id);
  else if (user.role === 'doctor') profile = db.findOne('doctors', d => d.doctor_id === user.ref_id);
  else if (user.role === 'pharmacist') profile = db.findOne('pharmacies', p => p.pharmacy_id === user.ref_id);

  const token = generateToken({ userId: user.user_id, phone: user.phone, role: user.role, refId: user.ref_id });
  db.update('users', u => u.user_id === user.user_id, { token });
  res.json({ success: true, token, user: { userId: user.user_id, phone: user.phone, role: user.role, refId: user.ref_id, profile } });
});

router.get('/me', authMiddleware, (req, res) => {
  const user = db.findOne('users', u => u.user_id === req.user.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  let profile = null;
  if (user.role === 'patient') profile = db.findOne('patients', p => p.patient_id === user.ref_id);
  else if (user.role === 'doctor') profile = db.findOne('doctors', d => d.doctor_id === user.ref_id);
  else if (user.role === 'pharmacist') profile = db.findOne('pharmacies', p => p.pharmacy_id === user.ref_id);
  res.json({ userId: user.user_id, phone: user.phone, role: user.role, refId: user.ref_id, profile });
});

export default router;
