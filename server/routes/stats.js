import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  res.json({
    patients: db.count('patients'),
    doctors: db.count('doctors'),
    queueWaiting: db.count('queue_entries', e => e.status === 'waiting'),
    consultationsToday: db.count('consultations'),
    rxPending: db.count('prescriptions', rx => rx.status === 'pending'),
    rxDispensed: db.count('prescriptions', rx => rx.status === 'dispensed'),
    redAlerts: db.count('heatmap_data', h => h.severity_level === 'RED'),
  });
});

export default router;
