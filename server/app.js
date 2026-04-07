/**
 * @fileoverview Express app factory — shared between dev server and Vercel serverless.
 * Exports the configured Express app WITHOUT calling listen().
 */

import express from 'express';
import cors from 'cors';

import db from './db.js';
import { errorHandler } from './middleware/utils.js';
import authRoutes from './routes/auth.js';
import triageRoutes from './routes/triage.js';
import queueRoutes from './routes/queue.js';
import recordsRoutes from './routes/records.js';
import pharmacyRoutes from './routes/pharmacy.js';
import consultationRoutes from './routes/consultation.js';
import heatmapRoutes from './routes/heatmap.js';
import statsRoutes from './routes/stats.js';
import appointmentRoutes from './routes/appointments.js';

const app = express();

/* ---------- Global Middleware ---------- */
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));

// Security headers
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

/* ---------- Dependency Injection ---------- */
app.set('db', db);

/* ---------- API Routes ---------- */
app.use('/api/auth', authRoutes);
app.use('/api/triage', triageRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/records', recordsRoutes);
app.use('/api/pharmacy', pharmacyRoutes);
app.use('/api/consultation', consultationRoutes);
app.use('/api/heatmap', heatmapRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/appointments', appointmentRoutes);

/* ---------- Health Check ---------- */
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'sehat-saathi-api',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

/* ---------- Error Handling ---------- */
app.use(errorHandler);

export default app;
