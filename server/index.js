import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import db from './db.js';
import authRoutes from './routes/auth.js';
import triageRoutes from './routes/triage.js';
import queueRoutes from './routes/queue.js';
import recordsRoutes from './routes/records.js';
import pharmacyRoutes from './routes/pharmacy.js';
import consultationRoutes from './routes/consultation.js';
import heatmapRoutes from './routes/heatmap.js';
import statsRoutes from './routes/stats.js';
import appointmentRoutes from './routes/appointments.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(cors());
app.use(express.json());

// Make io accessible in routes
app.set('io', io);
app.set('db', db);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/triage', triageRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/records', recordsRoutes);
app.use('/api/pharmacy', pharmacyRoutes);
app.use('/api/consultation', consultationRoutes);
app.use('/api/heatmap', heatmapRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/appointments', appointmentRoutes);

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);

  socket.on('join-queue', (doctorId) => {
    socket.join(`queue-${doctorId}`);
  });

  socket.on('join-patient', (patientId) => {
    socket.join(`patient-${patientId}`);
  });

  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🚀 Sehat Saathi API running on http://localhost:${PORT}`);
});
