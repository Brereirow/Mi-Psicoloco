import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import authRoutes from './server/routes/auth.ts';
import studentRoutes from './server/routes/students.ts';
import teacherRoutes from './server/routes/teachers.ts';
import psychologistRoutes from './server/routes/psychologists.ts';
import adminRoutes from './server/routes/admin.ts';
import aiRoutes from './server/routes/ai.ts';
import wellnessRoutes from './server/routes/wellness.ts';
import communicationRoutes from './server/routes/communication.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads/avatars directory exists
const uploadsDir = path.join(__dirname, 'server', 'data', 'uploads', 'avatars');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files securely
app.use('/api/uploads', express.static(path.join(__dirname, 'server', 'data', 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/psychologists', psychologistRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/wellness', wellnessRoutes);
app.use('/api/communication', communicationRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Mi Psicoloco API',
    subtitle: 'Tu asistente académico y de bienestar',
    timestamp: new Date().toISOString(),
  });
});

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Mi Psicoloco] Servidor iniciado en http://0.0.0.0:${PORT}`);
  });
}

startServer();
