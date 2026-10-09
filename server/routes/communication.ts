import { Router, Response } from 'express';
import { db, GroupMessage, Announcement, AnonymousEvaluation } from '../db/database.ts';
import { authMiddleware, AuthenticatedRequest, requireRole } from '../middleware/auth.ts';

const router = Router();
router.use(authMiddleware);

// GET /api/communication/messages/:subjectId
router.get('/messages/:subjectId', (req: AuthenticatedRequest, res: Response) => {
  const subjectId = req.params.subjectId;
  const raw = db.getRaw();

  const messages = raw.groupMessages
    .filter((m) => m.subjectId === subjectId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  return res.json({ messages });
});

// POST /api/communication/messages/:subjectId
router.post('/messages/:subjectId', (req: AuthenticatedRequest, res: Response) => {
  const subjectId = req.params.subjectId;
  const { content } = req.body;
  const user = req.user!;

  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'El mensaje no puede estar vacío.' });
  }

  const raw = db.getRaw();
  const newMessage: GroupMessage = {
    id: `msg-${Date.now()}`,
    subjectId,
    senderId: user.id,
    senderName: user.name,
    senderRole: user.role,
    content: content.trim(),
    createdAt: new Date().toISOString(),
  };

  raw.groupMessages.push(newMessage);
  db.save();

  return res.status(201).json({ success: true, message: newMessage });
});

// GET /api/communication/announcements
router.get('/announcements', (req: AuthenticatedRequest, res: Response) => {
  const raw = db.getRaw();
  const announcements = raw.announcements.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return res.json({ announcements });
});

// POST /api/communication/announcements
router.post('/announcements', requireRole(['teacher', 'admin']), (req: AuthenticatedRequest, res: Response) => {
  const { title, content, targetRole = 'all', isOfficial = false } = req.body;
  const user = req.user!;

  if (!title || !content) {
    return res.status(400).json({ error: 'Título y contenido del aviso son obligatorios.' });
  }

  const raw = db.getRaw();
  const newAnnouncement: Announcement = {
    id: `anc-${Date.now()}`,
    title: title.trim(),
    content: content.trim(),
    authorId: user.id,
    authorName: `${user.name} (${user.role === 'admin' ? 'Dirección' : 'Docente'})`,
    targetRole,
    isOfficial: Boolean(isOfficial),
    createdAt: new Date().toISOString(),
  };

  raw.announcements.unshift(newAnnouncement);

  // Broadcast notification to active users
  raw.users.forEach((u) => {
    raw.notifications.unshift({
      id: `notif-${Date.now()}-${u.id}`,
      userId: u.id,
      title: `Nuevo Aviso: ${newAnnouncement.title}`,
      message: newAnnouncement.content.slice(0, 100) + '...',
      type: 'info',
      read: false,
      createdAt: new Date().toISOString(),
    });
  });

  db.save();
  return res.status(201).json({ success: true, announcement: newAnnouncement });
});

// GET /api/communication/notifications
router.get('/notifications', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const raw = db.getRaw();
  const notifications = raw.notifications
    .filter((n) => n.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return res.json({ notifications });
});

// PUT /api/communication/notifications/:id/read
router.put('/notifications/:id/read', (req: AuthenticatedRequest, res: Response) => {
  const notifId = req.params.id;
  const raw = db.getRaw();
  const notif = raw.notifications.find((n) => n.id === notifId && n.userId === req.user!.id);

  if (notif) {
    notif.read = true;
    db.save();
  }

  return res.json({ success: true });
});

// POST /api/communication/evaluations (Anonymous Teacher Evaluation)
router.post('/evaluations', (req: AuthenticatedRequest, res: Response) => {
  const { subjectId, teacherId, clarity, organization, communication, treatment, comment } = req.body;

  if (!subjectId || !teacherId) {
    return res.status(400).json({ error: 'Materia y docente son obligatorios.' });
  }

  const c = Math.min(100, Math.max(0, Number(clarity) || 80));
  const o = Math.min(100, Math.max(0, Number(organization) || 80));
  const cm = Math.min(100, Math.max(0, Number(communication) || 80));
  const t = Math.min(100, Math.max(0, Number(treatment) || 80));
  const overall = Math.round((c + o + cm + t) / 4);

  // Notice: Strict anonymity - NO studentId or userId stored on evaluation record!
  const newEvaluation: AnonymousEvaluation = {
    id: `eval-${Date.now()}`,
    subjectId,
    teacherId,
    clarity: c,
    organization: o,
    communication: cm,
    treatment: t,
    overall,
    comment: comment ? comment.trim() : undefined,
    createdAt: new Date().toISOString(),
  };

  const raw = db.getRaw();
  raw.evaluations.push(newEvaluation);
  db.save();

  return res.status(201).json({
    success: true,
    message: 'Evaluación enviada con éxito de forma 100% anónima. ¡Gracias por tu retroalimentación constructiva!',
  });
});

export default router;
