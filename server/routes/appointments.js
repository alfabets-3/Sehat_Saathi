import { Router } from 'express';
import db from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/slots/:doctorId', (req, res) => {
  const { date } = req.query;
  const d = db.findOne('doctors', d => d.doctor_id === parseInt(req.params.doctorId));
  if (!d) return res.status(404).json({ error: 'Doctor not found' });
  const dt = date || new Date().toISOString().split('T')[0];
  const booked = db.findAll('appointments', a => a.doctor_id === parseInt(req.params.doctorId) && a.date === dt && a.status === 'booked').map(a => a.time_slot);
  const all = ['09:00','09:30','10:00','10:30','11:00','11:30','12:00','14:00','14:30','15:00','15:30','16:00','16:30'];
  res.json({ doctor:{ name:d.name, specialisation:d.specialisation, phc:d.phc_name }, date:dt, available:all.filter(s => !booked.includes(s)), booked });
});

router.post('/book', authMiddleware, (req, res) => {
  const { doctorId, date, timeSlot, notes } = req.body;
  const pid = req.user.refId;
  const existing = db.findOne('appointments', a => a.doctor_id === doctorId && a.date === date && a.time_slot === timeSlot && a.status === 'booked');
  if (existing) return res.status(409).json({ error: 'Slot already booked' });
  const r = db.insert('appointments', { patient_id:pid, doctor_id:doctorId, date, time_slot:timeSlot, notes:notes||'', status:'booked' });
  res.json({ appointmentId: r.lastInsertRowid, status: 'booked', message: 'Appointment booked!' });
});

router.get('/my', authMiddleware, (req, res) => {
  const apps = db.findAll('appointments', a => a.patient_id === req.user.refId).sort((a,b) => new Date(b.date)-new Date(a.date));
  apps.forEach(a => { const d = db.findOne('doctors', d => d.doctor_id === a.doctor_id); a.doctor_name = d?.name; a.specialisation = d?.specialisation; a.phc_name = d?.phc_name; });
  res.json({ appointments: apps });
});

router.post('/cancel/:id', authMiddleware, (req, res) => {
  db.update('appointments', a => a.appointment_id === parseInt(req.params.id), { status: 'cancelled' });
  res.json({ success: true });
});

export default router;
