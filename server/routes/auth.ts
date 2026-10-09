import { Router, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { db, hashPassword, User, AuditLog } from '../db/database.ts';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();

function logAudit(userId: string, userName: string, role: string, action: string, details: string, ip: string) {
  const audit: AuditLog = {
    id: `aud-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    userId,
    userName,
    role,
    action,
    details,
    ipAddress: ip || '127.0.0.1',
    createdAt: new Date().toISOString(),
  };
  db.getRaw().auditLogs.unshift(audit);
  if (db.getRaw().auditLogs.length > 500) {
    db.getRaw().auditLogs.pop();
  }
}

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Debes ingresar correo y contraseña.' });
  }

  const hashedPassword = hashPassword(password);
  const user = db.getRaw().users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());

  if (!user || user.passwordHash !== hashedPassword) {
    return res.status(401).json({ error: 'Credenciales inválidas. Verifica tu correo o contraseña.' });
  }

  if (!user.active) {
    return res.status(403).json({ error: 'Tu cuenta ha sido desactivada. Consulta a la administración escolar.' });
  }

  logAudit(user.id, user.name, user.role, 'INICIO_SESION', 'Inicio de sesión con contraseña', req.ip || '127.0.0.1');
  db.save();

  const token = `${user.id}:${Date.now()}`;
  return res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      institutionId: user.institutionId,
      phone: user.phone,
    },
  });
});

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { name, email, password, role = 'student', studentIdNumber } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Todos los campos obligatorios deben ser completados.' });
  }

  const existing = db.getRaw().users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
  if (existing) {
    return res.status(409).json({ error: 'Ya existe una cuenta registrada con este correo electrónico.' });
  }

  const newUser: User = {
    id: `usr-${Date.now()}`,
    name: name.trim(),
    email: email.toLowerCase().trim(),
    passwordHash: hashPassword(password),
    role: role === 'teacher' || role === 'psychologist' || role === 'admin' ? role : 'student',
    institutionId: 'inst-1',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.getRaw().users.push(newUser);

  if (newUser.role === 'student') {
    db.getRaw().students.push({
      id: `std-${Date.now()}`,
      userId: newUser.id,
      studentIdNumber: studentIdNumber || `MAT-${Math.floor(1000 + Math.random() * 9000)}`,
      currentSemester: 1,
      groupId: 'grp-3a',
      emergencyContactName: 'Contacto Familiar',
      emergencyContactPhone: '+52 55 0000 0000',
    });
  }

  logAudit(newUser.id, newUser.name, newUser.role, 'REGISTRO_USUARIO', 'Nuevo usuario registrado', req.ip || '127.0.0.1');
  db.save();

  const token = `${newUser.id}:${Date.now()}`;
  return res.status(201).json({
    token,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      avatar: newUser.avatar,
      institutionId: newUser.institutionId,
    },
  });
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  let profileData: any = {};

  if (user.role === 'student') {
    profileData = db.getRaw().students.find((s) => s.userId === user.id);
  } else if (user.role === 'teacher') {
    profileData = db.getRaw().teachers.find((t) => t.userId === user.id);
  } else if (user.role === 'psychologist') {
    profileData = db.getRaw().psychologists.find((p) => p.userId === user.id);
  }

  const institution = db.getRaw().institutions.find((i) => i.id === user.institutionId);

  return res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      institutionId: user.institutionId,
      phone: user.phone,
      createdAt: user.createdAt,
    },
    profile: profileData,
    institution,
  });
});

// POST /api/auth/switch-demo (For immediate prototype verification of roles)
router.post('/switch-demo', (req, res) => {
  const { role } = req.body;
  const user = db.getRaw().users.find((u) => u.role === role);
  if (!user) {
    return res.status(404).json({ error: `No se encontró usuario de prueba con el rol ${role}.` });
  }

  logAudit(user.id, user.name, user.role, 'CAMBIO_DEMO_ROL', `Cambio interactivo a rol ${role}`, req.ip || '127.0.0.1');
  db.save();

  const token = `${user.id}:${Date.now()}`;
  return res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      institutionId: user.institutionId,
      phone: user.phone,
    },
  });
});

// PUT /api/auth/profile
router.put('/profile', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { name, phone, emergencyContactName, emergencyContactPhone } = req.body;

  if (name) user.name = name.trim();
  if (phone) user.phone = phone.trim();
  user.updatedAt = new Date().toISOString();

  if (user.role === 'student') {
    const student = db.getRaw().students.find((s) => s.userId === user.id);
    if (student) {
      if (emergencyContactName) student.emergencyContactName = emergencyContactName.trim();
      if (emergencyContactPhone) student.emergencyContactPhone = emergencyContactPhone.trim();
    }
  }

  db.save();
  return res.json({ success: true, message: 'Perfil actualizado exitosamente.', user });
});

// POST /api/auth/avatar
router.post('/avatar', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { imageBase64 } = req.body;

  if (!imageBase64 || typeof imageBase64 !== 'string') {
    return res.status(400).json({ error: 'Debes proporcionar una imagen válida en base64.' });
  }

  // Check prefix and format (jpeg, jpg, png, webp)
  const matches = imageBase64.match(/^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/i);
  if (!matches) {
    return res.status(400).json({
      error: 'Formato de imagen inválido. Solo se admiten archivos JPEG, PNG o WebP.',
    });
  }

  const rawExt = matches[1].toLowerCase();
  const format = rawExt === 'jpeg' ? 'jpg' : rawExt;
  const base64Data = matches[2];
  const buffer = Buffer.from(base64Data, 'base64');

  // Check maximum size: 5 MB
  const MAX_SIZE = 5 * 1024 * 1024;
  if (buffer.length > MAX_SIZE) {
    return res.status(400).json({
      error: `La imagen excede el límite máximo permitido de 5 MB (tamaño actual: ${(buffer.length / (1024 * 1024)).toFixed(1)} MB).`,
    });
  }

  // Ensure upload directory exists
  const uploadsDir = path.resolve(process.cwd(), 'server', 'data', 'uploads', 'avatars');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Remove previous custom uploaded avatar file for this user if exists
  if (user.avatar && user.avatar.startsWith('/api/uploads/avatars/')) {
    const oldFileName = path.basename(user.avatar);
    const oldFilePath = path.join(uploadsDir, oldFileName);
    if (fs.existsSync(oldFilePath)) {
      try {
        fs.unlinkSync(oldFilePath);
      } catch (err) {
        console.error('Error deleting previous avatar file:', err);
      }
    }
  }

  // Create unique filename
  const fileName = `avatar-${user.id}-${Date.now()}.${format}`;
  const filePath = path.join(uploadsDir, fileName);

  fs.writeFileSync(filePath, buffer);

  // Save relative URL in user profile
  user.avatar = `/api/uploads/avatars/${fileName}`;
  user.updatedAt = new Date().toISOString();

  logAudit(
    user.id,
    user.name,
    user.role,
    'ACTUALIZAR_FOTO_PERFIL',
    `Fotografía de perfil actualizada (${(buffer.length / 1024).toFixed(0)} KB)`,
    req.ip || '127.0.0.1'
  );

  db.save();

  return res.json({
    success: true,
    message: 'Fotografía de perfil actualizada correctamente.',
    avatarUrl: user.avatar,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      institutionId: user.institutionId,
      phone: user.phone,
    },
  });
});

// DELETE /api/auth/avatar
router.delete('/avatar', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;

  if (user.avatar && user.avatar.startsWith('/api/uploads/avatars/')) {
    const uploadsDir = path.resolve(process.cwd(), 'server', 'data', 'uploads', 'avatars');
    const oldFileName = path.basename(user.avatar);
    const oldFilePath = path.join(uploadsDir, oldFileName);
    if (fs.existsSync(oldFilePath)) {
      try {
        fs.unlinkSync(oldFilePath);
      } catch (err) {
        console.error('Error deleting avatar file:', err);
      }
    }
  }

  user.avatar = undefined;
  user.updatedAt = new Date().toISOString();

  logAudit(
    user.id,
    user.name,
    user.role,
    'ELIMINAR_FOTO_PERFIL',
    'Fotografía de perfil eliminada',
    req.ip || '127.0.0.1'
  );

  db.save();

  return res.json({
    success: true,
    message: 'Fotografía de perfil eliminada correctamente.',
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      institutionId: user.institutionId,
      phone: user.phone,
    },
  });
});

export default router;
