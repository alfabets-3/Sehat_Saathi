/**
 * @fileoverview Development server entry point.
 * Imports the shared Express app from app.js, adds Socket.IO, and starts listening.
 * NOT used in Vercel production — only for local `npm run dev`.
 */

import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import express from 'express';

import app from './app.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

/* ---------- HTTP + Socket.IO ---------- */
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});
app.set('io', io);

/* ---------- Serve Frontend (Production build) ---------- */
const distPath = join(__dirname, '..', 'dist');
if (existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(join(distPath, 'index.html'));
    }
  });
  console.log(`📦 Serving frontend from ${distPath}`);
}

/* ---------- Socket.IO Events ---------- */
io.on('connection', (socket) => {
  if (NODE_ENV === 'development') {
    console.log(`🔌 Client connected: ${socket.id}`);
  }
  socket.on('join-queue', (doctorId) => {
    if (typeof doctorId === 'number') socket.join(`queue-${doctorId}`);
  });
  socket.on('join-patient', (patientId) => {
    if (typeof patientId === 'number') socket.join(`patient-${patientId}`);
  });
  socket.on('disconnect', () => {
    if (NODE_ENV === 'development') {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    }
  });
});

/* ---------- Start ---------- */
httpServer.listen(PORT, () => {
  console.log(`🚀 Sehat Saathi API running on http://localhost:${PORT}`);
  console.log(`📋 Environment: ${NODE_ENV}`);
});
