import { Router, Response } from 'express';
import { db, CounselingRequest, CrisisAlert } from '../db/database.ts';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();
router.use(authMiddleware);

// GET /api/wellness/resources
router.get('/resources', (req: AuthenticatedRequest, res: Response) => {
  const { category } = req.query;
  const raw = db.getRaw();
  let list = raw.wellnessResources;

  if (category && typeof category === 'string' && category !== 'Todos') {
    list = list.filter((r) => r.category.toLowerCase() === category.toLowerCase());
  }

  return res.json({ resources: list });
});

// GET /api/wellness/resources/:id
router.get('/resources/:id', (req: AuthenticatedRequest, res: Response) => {
  const id = req.params.id;
  const raw = db.getRaw();
  const resource = raw.wellnessResources.find((r) => r.id === id);

  if (!resource) {
    return res.status(404).json({ error: 'Recurso no encontrado.' });
  }

  return res.json({ resource });
});

// GET /api/wellness/counseling-requests (User's own requests)
router.get('/counseling-requests', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const raw = db.getRaw();

  const requests = raw.counselingRequests
    .filter((c) => c.studentId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((c) => {
      const teacher = c.teacherId ? raw.users.find((u) => u.id === c.teacherId) : undefined;
      const psychologist = c.psychologistId ? raw.users.find((u) => u.id === c.psychologistId) : undefined;
      const subjectObj = c.subjectId ? raw.subjects.find((s) => s.id === c.subjectId) : undefined;
      const groupObj = c.groupId ? raw.groups.find((g) => g.id === c.groupId) : undefined;

      return {
        ...c,
        teacherName: teacher?.name || (subjectObj ? raw.users.find((u) => u.id === subjectObj.teacherId)?.name : undefined),
        teacherEmail: teacher?.email,
        psychologistName: psychologist?.name,
        subjectName: subjectObj?.name || c.subject,
        subjectCode: subjectObj?.code,
        groupName: groupObj?.name,
      };
    });

  return res.json({ requests });
});

// POST /api/wellness/counseling-requests
router.post('/counseling-requests', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const {
    type,
    subjectId,
    teacherId,
    psychologistId,
    subject,
    reason,
    preferredDate,
    preferredTime,
    modality,
  } = req.body;

  if (!type || !reason || !preferredDate || !preferredTime) {
    return res.status(400).json({ error: 'Todos los campos obligatorios deben ser proporcionados.' });
  }

  const raw = db.getRaw();
  const studentProfile = raw.students.find((s) => s.userId === userId);

  let finalTeacherId = teacherId;
  let finalSubjectId = subjectId;
  let finalSubjectName = subject || 'Asesoría Académica';
  let finalGroupId = studentProfile?.groupId;

  if (type === 'asesoria_academica') {
    if (subjectId) {
      const foundSubj = raw.subjects.find((s) => s.id === subjectId);
      if (foundSubj) {
        finalSubjectName = foundSubj.name;
        finalTeacherId = finalTeacherId || foundSubj.teacherId;
        finalGroupId = foundSubj.groupId || finalGroupId;
      }
    } else if (teacherId) {
      const teacherSubject = raw.subjects.find((s) => s.teacherId === teacherId);
      if (teacherSubject) {
        finalSubjectId = teacherSubject.id;
        finalSubjectName = teacherSubject.name;
      }
    }
  }

  const newRequest: CounselingRequest = {
    id: `csl-${Date.now()}`,
    studentId: userId,
    teacherId: finalTeacherId,
    psychologistId: type === 'orientacion_psicologica' ? (psychologistId || 'usr-psych-1') : undefined,
    subjectId: finalSubjectId,
    groupId: finalGroupId,
    type: type || 'orientacion_psicologica',
    subject: finalSubjectName,
    reason: reason.trim(),
    preferredDate,
    preferredTime,
    modality: modality || 'presencial',
    status: 'pendiente',
    createdAt: new Date().toISOString(),
  };

  raw.counselingRequests.unshift(newRequest);

  // Notify assigned teacher or psychologist
  if (type === 'asesoria_academica' && finalTeacherId) {
    raw.notifications.unshift({
      id: `notif-${Date.now()}-${finalTeacherId}`,
      userId: finalTeacherId,
      title: 'Nueva solicitud de asesoría',
      message: `${req.user!.name} solicitó asesoría para "${finalSubjectName}" (${preferredDate} a las ${preferredTime}).`,
      type: 'info',
      read: false,
      createdAt: new Date().toISOString(),
    });
  } else if (type === 'orientacion_psicologica') {
    const psychUsers = raw.users.filter((u) => u.role === 'psychologist');
    psychUsers.forEach((psych) => {
      raw.notifications.unshift({
        id: `notif-${Date.now()}-${psych.id}`,
        userId: psych.id,
        title: 'Nueva solicitud de orientación',
        message: `${req.user!.name} solicitó orientación psicológica para el ${preferredDate}.`,
        type: 'info',
        read: false,
        createdAt: new Date().toISOString(),
      });
    });
  } else {
    // Notify all teachers of this group or subject
    const teachers = raw.users.filter((u) => u.role === 'teacher');
    teachers.forEach((t) => {
      raw.notifications.unshift({
        id: `notif-${Date.now()}-${t.id}`,
        userId: t.id,
        title: 'Nueva solicitud de asesoría',
        message: `${req.user!.name} solicitó asesoría académica (${finalSubjectName}).`,
        type: 'info',
        read: false,
        createdAt: new Date().toISOString(),
      });
    });
  }

  db.save();
  return res.status(201).json({
    success: true,
    message: 'Solicitud registrada correctamente. El docente o área de apoyo revisará tu horario.',
    request: newRequest,
  });
});

// PUT /api/wellness/counseling-requests/:id/cancel (Student cancels their request)
router.put('/counseling-requests/:id/cancel', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const requestId = req.params.id;
  const { reason } = req.body;
  const raw = db.getRaw();

  const request = raw.counselingRequests.find((c) => c.id === requestId && c.studentId === userId);
  if (!request) {
    return res.status(404).json({ error: 'Solicitud no encontrada o no autorizada.' });
  }

  if (request.status === 'completada') {
    return res.status(400).json({ error: 'No es posible cancelar una sesión que ya ha sido completada.' });
  }

  request.status = 'cancelada';
  request.cancellationReason = reason ? reason.trim() : 'Cancelada voluntariamente por el estudiante.';
  request.updatedAt = new Date().toISOString();

  // Notify teacher or psychologist
  const notifyTargetId = request.teacherId || request.psychologistId;
  if (notifyTargetId) {
    raw.notifications.unshift({
      id: `notif-${Date.now()}-${notifyTargetId}`,
      userId: notifyTargetId,
      title: 'Asesoría cancelada por estudiante',
      message: `${req.user!.name} canceló la solicitud para ${request.subject || 'asesoría'}. Motivo: ${request.cancellationReason}`,
      type: 'warning',
      read: false,
      createdAt: new Date().toISOString(),
    });
  }

  db.save();
  return res.json({
    success: true,
    message: 'La solicitud de asesoría ha sido cancelada correctamente.',
    request,
  });
});

// PUT /api/wellness/counseling-requests/:id/respond-proposal (Student responds to reschedule proposal)
router.put('/counseling-requests/:id/respond-proposal', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const requestId = req.params.id;
  const { action, notes } = req.body; // action: 'accept' | 'reject'
  const raw = db.getRaw();

  const request = raw.counselingRequests.find((c) => c.id === requestId && c.studentId === userId);
  if (!request) {
    return res.status(404).json({ error: 'Solicitud no encontrada o no autorizada.' });
  }

  if (action === 'accept') {
    request.status = 'aceptada';
    if (request.proposedDate) request.scheduledDate = request.proposedDate;
    if (request.proposedTime) request.scheduledTime = request.proposedTime;
    request.notes = (request.notes ? request.notes + '\n' : '') + 'El estudiante aceptó la propuesta de horario.';
    request.updatedAt = new Date().toISOString();

    if (request.teacherId) {
      raw.notifications.unshift({
        id: `notif-${Date.now()}-${request.teacherId}`,
        userId: request.teacherId,
        title: 'Horario aceptado por estudiante',
        message: `${req.user!.name} aceptó la fecha propuesta para la asesoría de ${request.subject}: ${request.scheduledDate} a las ${request.scheduledTime}.`,
        type: 'success',
        read: false,
        createdAt: new Date().toISOString(),
      });
    }
  } else {
    request.status = 'cancelada';
    request.cancellationReason = notes || 'El estudiante no pudo en el nuevo horario propuesto.';
    request.updatedAt = new Date().toISOString();

    if (request.teacherId) {
      raw.notifications.unshift({
        id: `notif-${Date.now()}-${request.teacherId}`,
        userId: request.teacherId,
        title: 'Propuesta de horario rechazada',
        message: `${req.user!.name} no pudo en el horario propuesto para ${request.subject}.`,
        type: 'warning',
        read: false,
        createdAt: new Date().toISOString(),
      });
    }
  }

  db.save();
  return res.json({
    success: true,
    message: action === 'accept' ? 'Has confirmado el nuevo horario de tu asesoría.' : 'Has rechazado la propuesta de horario.',
    request,
  });
});

// POST /api/wellness/crisis-alerts (Student triggers urgent crisis support from Help SOS)
router.post('/crisis-alerts', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  if (user.role !== 'student') {
    return res.status(403).json({ error: 'Solo los estudiantes pueden solicitar alertas de apoyo de crisis estudiantil.' });
  }

  const raw = db.getRaw();
  if (!raw.crisisAlerts) {
    raw.crisisAlerts = [];
  }

  // Rate-limiting / anti-duplicate check: if student already sent an alert in the last 2 minutes that is still 'nueva', avoid duplicate
  const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
  const recentAlert = raw.crisisAlerts.find(
    (a) => a.studentId === user.id && a.status === 'nueva' && a.createdAt > twoMinutesAgo
  );
  if (recentAlert) {
    return res.json({
      success: true,
      alert: {
        id: recentAlert.id,
        status: recentAlert.status,
        createdAt: recentAlert.createdAt,
        assignedPsychologistName: recentAlert.assignedPsychologistName,
      },
      message: 'Tu solicitud ya ha sido registrada previamente y el personal ha sido notificado.',
    });
  }

  const studentProfile = raw.students.find((s) => s.userId === user.id);
  const group = studentProfile?.groupId ? raw.groups.find((g) => g.id === studentProfile.groupId) : undefined;

  // Find assigned psychologist (prefer active psychologist in institution)
  const psychologist =
    raw.users.find((u) => u.role === 'psychologist' && u.active !== false) ||
    raw.users.find((u) => u.role === 'psychologist');

  // Find group tutor teacher if configured
  let assignedTeacher: any = undefined;
  if (studentProfile?.groupId) {
    const groupSubject = raw.subjects.find((s) => s.groupId === studentProfile.groupId && s.teacherId);
    if (groupSubject?.teacherId) {
      assignedTeacher = raw.users.find((u) => u.id === groupSubject.teacherId && u.active !== false);
    }
  }

  const { note } = req.body;

  const newAlert: CrisisAlert = {
    id: `alt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    studentId: user.id,
    studentName: user.name,
    studentMatricula: studentProfile?.studentIdNumber,
    studentAvatar: user.avatar,
    studentEmail: user.email,
    studentPhone: user.phone || studentProfile?.emergencyContactPhone,
    groupId: studentProfile?.groupId,
    groupName: group?.name || 'Grupo 3°A',
    assignedPsychologistId: psychologist?.id,
    assignedPsychologistName: psychologist?.name || 'Módulo Institucional de Orientación',
    assignedTeacherId: assignedTeacher?.id,
    assignedTeacherName: assignedTeacher?.name,
    alertType: 'crisis_emocional',
    status: 'nueva',
    studentNote: note && typeof note === 'string' ? note.trim().slice(0, 500) : undefined,
    contactAttempts: 0,
    auditTrail: [
      {
        id: `adt-${Date.now()}-1`,
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: 'creada',
        details: 'Alerta de crisis emocional enviada desde el botón Ayuda SOS por el estudiante.',
        timestamp: new Date().toISOString(),
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  raw.crisisAlerts.unshift(newAlert);

  // Notifications
  // 1. To psychologist
  if (psychologist) {
    raw.notifications.unshift({
      id: `notif-${Date.now()}-psy`,
      userId: psychologist.id,
      title: 'Alerta de Apoyo Urgente',
      message: 'Hay una nueva solicitud de apoyo urgente que requiere revisión.',
      type: 'urgent',
      read: false,
      createdAt: new Date().toISOString(),
    });
  }

  // 2. To group teacher (if authorized)
  if (assignedTeacher) {
    raw.notifications.unshift({
      id: `notif-${Date.now()}-tch`,
      userId: assignedTeacher.id,
      title: 'Aviso de Apoyo Estudiantil',
      message: 'Hay una nueva solicitud de apoyo urgente que requiere atención coordinada.',
      type: 'urgent',
      read: false,
      createdAt: new Date().toISOString(),
    });
  }

  // Audit log
  raw.auditLogs.unshift({
    id: `aud-${Date.now()}-alt`,
    userId: user.id,
    userName: user.name,
    role: user.role,
    action: 'ALERTA_CRISIS_EMITIDA',
    details: `Solicitud de apoyo urgente registrada para ${user.name} (${group?.name || 'Sin grupo'})`,
    ipAddress: req.ip || '127.0.0.1',
    createdAt: new Date().toISOString(),
  });

  db.save();

  return res.status(201).json({
    success: true,
    message: 'Tu solicitud de apoyo urgente ha sido registrada y el personal de orientación ha sido notificado.',
    alert: {
      id: newAlert.id,
      status: newAlert.status,
      createdAt: newAlert.createdAt,
      assignedPsychologistName: newAlert.assignedPsychologistName,
    },
  });
});

// GET /api/wellness/crisis-alerts (Student's own alerts)
router.get('/crisis-alerts', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const raw = db.getRaw();
  const alerts = (raw.crisisAlerts || [])
    .filter((a) => a.studentId === user.id)
    .map((a) => ({
      id: a.id,
      status: a.status,
      alertType: a.alertType,
      assignedPsychologistName: a.assignedPsychologistName,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
      studentNote: a.studentNote,
    }));

  return res.json({ alerts });
});

export default router;
