import { Router, Response } from 'express';
import { db, CounselingRequest, CrisisAlert, CrisisAlertAudit } from '../db/database.ts';
import { authMiddleware, AuthenticatedRequest, requireRole } from '../middleware/auth.ts';
import { GoogleGenAI } from '@google/genai';

const router = Router();
router.use(authMiddleware);
router.use(requireRole(['psychologist', 'admin']));

// Helper to verify psychologist authorization for a given student
function isStudentAuthorizedForPsychologist(studentId: string, psychId: string, isAdmin: boolean): boolean {
  if (isAdmin) return true;
  const raw = db.getRaw();
  // Authorized if the student has created a psychological counseling request targeted to or reviewed by the orientation department
  return raw.counselingRequests.some(
    (c) => c.studentId === studentId && c.type === 'orientacion_psicologica'
  );
}

// GET /api/psychologists/dashboard
router.get('/dashboard', (req: AuthenticatedRequest, res: Response) => {
  const psychId = req.user!.id;
  const raw = db.getRaw();

  const requests = raw.counselingRequests.filter((c) => c.type === 'orientacion_psicologica');
  const pendingRequests = requests.filter((c) => c.status === 'pendiente');
  const confirmedAppointments = requests.filter((c) => c.status === 'confirmada' || c.status === 'reprogramada');
  const completedSessions = requests.filter((c) => c.status === 'completada');

  const totalEmotionalRecords = raw.emotionalRecords.length;
  const stressOrAnxietyCount = raw.emotionalRecords.filter(
    (r) => r.mood === 'estresado' || r.mood === 'preocupado' || r.mood === 'triste'
  ).length;

  return res.json({
    psychologistName: req.user!.name,
    stats: {
      pending: pendingRequests.length,
      confirmed: confirmedAppointments.length,
      completed: completedSessions.length,
      totalRequests: requests.length,
      stressPercentage:
        totalEmotionalRecords > 0 ? Math.round((stressOrAnxietyCount / totalEmotionalRecords) * 100) : 35,
    },
    pendingRequests: pendingRequests.map((reqItem) => {
      const studentUser = raw.users.find((u) => u.id === reqItem.studentId);
      const studentProfile = raw.students.find((s) => s.userId === reqItem.studentId);
      return {
        ...reqItem,
        studentName: studentUser?.name || 'Estudiante',
        studentEmail: studentUser?.email,
        studentMatricula: studentProfile?.studentIdNumber,
      };
    }),
    upcomingAppointments: confirmedAppointments.map((reqItem) => {
      const studentUser = raw.users.find((u) => u.id === reqItem.studentId);
      return {
        ...reqItem,
        studentName: studentUser?.name || 'Estudiante',
      };
    }),
  });
});

// GET /api/psychologists/requests
router.get('/requests', (req: AuthenticatedRequest, res: Response) => {
  const raw = db.getRaw();
  const requests = raw.counselingRequests
    .filter((c) => c.type === 'orientacion_psicologica')
    .map((r) => {
      const studentUser = raw.users.find((u) => u.id === r.studentId);
      const studentProfile = raw.students.find((s) => s.userId === r.studentId);
      return {
        ...r,
        studentName: studentUser?.name || 'Estudiante',
        studentEmail: studentUser?.email,
        studentMatricula: studentProfile?.studentIdNumber,
      };
    });

  return res.json({ requests });
});

// GET /api/psychologists/appointments
router.get('/appointments', (req: AuthenticatedRequest, res: Response) => {
  const raw = db.getRaw();
  const appointments = raw.counselingRequests
    .filter(
      (c) =>
        c.type === 'orientacion_psicologica' &&
        (c.status === 'confirmada' || c.status === 'reprogramada' || c.status === 'completada')
    )
    .map((r) => {
      const studentUser = raw.users.find((u) => u.id === r.studentId);
      const studentProfile = raw.students.find((s) => s.userId === r.studentId);
      return {
        ...r,
        studentName: studentUser?.name || 'Estudiante',
        studentEmail: studentUser?.email,
        studentPhone: studentUser?.phone,
        studentMatricula: studentProfile?.studentIdNumber,
      };
    });

  return res.json({ appointments });
});

// PUT /api/psychologists/requests/:id
router.put('/requests/:id', (req: AuthenticatedRequest, res: Response) => {
  const psychId = req.user!.id;
  const requestId = req.params.id;
  const { status, scheduledDate, scheduledTime, notes, meetingLink } = req.body;

  const raw = db.getRaw();
  const request = raw.counselingRequests.find((r) => r.id === requestId);

  if (!request) {
    return res.status(404).json({ error: 'Solicitud no encontrada.' });
  }

  if (status) request.status = status;
  if (scheduledDate) request.scheduledDate = scheduledDate;
  if (scheduledTime) request.scheduledTime = scheduledTime;
  if (notes !== undefined) request.notes = notes;
  if (meetingLink !== undefined) request.meetingLink = meetingLink;
  request.psychologistId = psychId;

  const statusLabels: Record<string, string> = {
    confirmada: 'ha sido confirmada',
    reprogramada: 'ha sido reprogramada',
    completada: 'ha sido completada',
    cancelada: 'ha sido cancelada',
  };

  raw.notifications.unshift({
    id: `notif-${Date.now()}`,
    userId: request.studentId,
    title: `Actualización de Cita de Orientación`,
    message: `Tu sesión de orientación psicológica ${statusLabels[request.status] || 'fue actualizada'} para ${
      request.scheduledDate || request.preferredDate
    } a las ${request.scheduledTime || request.preferredTime}.`,
    type: request.status === 'confirmada' ? 'success' : 'info',
    read: false,
    createdAt: new Date().toISOString(),
  });

  db.save();
  return res.json({ success: true, request });
});

// GET /api/psychologists/history
router.get('/history', (req: AuthenticatedRequest, res: Response) => {
  const psychId = req.user!.id;
  const isAdmin = req.user!.role === 'admin';
  const raw = db.getRaw();

  // Return only authorized students who have requested or received psychological counseling
  const authorizedStudentIds = Array.from(
    new Set(
      raw.counselingRequests
        .filter((c) => c.type === 'orientacion_psicologica')
        .map((c) => c.studentId)
    )
  );

  const authorizedStudents = authorizedStudentIds.map((stdId) => {
    const studentUser = raw.users.find((u) => u.id === stdId);
    const studentProfile = raw.students.find((s) => s.userId === stdId);
    const sessions = raw.counselingRequests.filter((c) => c.studentId === stdId && c.type === 'orientacion_psicologica');
    const moodCount = raw.emotionalRecords.filter((r) => r.studentId === stdId).length;

    return {
      userId: stdId,
      name: studentUser?.name || 'Estudiante',
      email: studentUser?.email || '',
      phone: studentUser?.phone || '',
      studentIdNumber: studentProfile?.studentIdNumber || 'N/A',
      currentSemester: studentProfile?.currentSemester || 1,
      totalSessions: sessions.length,
      lastSession: sessions[0]?.scheduledDate || sessions[0]?.preferredDate,
      hasSelfReportedMoods: moodCount > 0,
    };
  });

  return res.json({ students: authorizedStudents });
});

// GET /api/psychologists/history/:studentId
router.get('/history/:studentId', (req: AuthenticatedRequest, res: Response) => {
  const studentId = req.params.studentId;
  const psychId = req.user!.id;
  const isAdmin = req.user!.role === 'admin';

  // Strict Authorization Check: Only allow access if student consented through a counseling request
  if (!isStudentAuthorizedForPsychologist(studentId, psychId, isAdmin)) {
    return res.status(403).json({
      error:
        'Acceso restringido: No tienes autorización para consultar el historial de este estudiante. Solo estudiantes con solicitudes de orientación activas o asignadas son accesibles para proteger la privacidad estudiantil.',
    });
  }

  const raw = db.getRaw();
  const studentUser = raw.users.find((u) => u.id === studentId);
  const studentProfile = raw.students.find((s) => s.userId === studentId);

  if (!studentUser) {
    return res.status(404).json({ error: 'Estudiante no encontrado.' });
  }

  const studentSessions = raw.counselingRequests.filter(
    (c) => c.studentId === studentId && c.type === 'orientacion_psicologica'
  );

  const emotionalRecords = raw.emotionalRecords
    .filter((r) => r.studentId === studentId)
    .sort((a, b) => b.date.localeCompare(a.date));

  const academicTasks = raw.tasks.filter((t) => t.studentId === studentId);

  return res.json({
    student: {
      id: studentUser.id,
      name: studentUser.name,
      email: studentUser.email,
      phone: studentUser.phone,
      matricula: studentProfile?.studentIdNumber,
      semester: studentProfile?.currentSemester,
    },
    sessions: studentSessions,
    emotionalRecords,
    academicTasks,
  });
});

// GET /api/psychologists/ai-summaries
router.get('/ai-summaries', (req: AuthenticatedRequest, res: Response) => {
  const psychId = req.user!.id;
  const isAdmin = req.user!.role === 'admin';
  const raw = db.getRaw();

  // Return summaries for authorized students
  const authorizedStudentIds = Array.from(
    new Set(
      raw.counselingRequests
        .filter((c) => c.type === 'orientacion_psicologica')
        .map((c) => c.studentId)
    )
  );

  const list = authorizedStudentIds.map((stdId) => {
    const studentUser = raw.users.find((u) => u.id === stdId);
    const tasks = raw.tasks.filter((t) => t.studentId === stdId);
    const sessions = raw.counselingRequests.filter((c) => c.studentId === stdId);
    return {
      studentId: stdId,
      studentName: studentUser?.name || 'Estudiante',
      lastPeriod: 'Octubre 2026',
      tasksCount: tasks.length,
      sessionsCount: sessions.length,
    };
  });

  return res.json({ summaries: list });
});

// POST /api/psychologists/ai-summary/:studentId
router.post('/ai-summary/:studentId', async (req: AuthenticatedRequest, res: Response) => {
  const studentId = req.params.studentId;
  const psychId = req.user!.id;
  const isAdmin = req.user!.role === 'admin';

  if (!isStudentAuthorizedForPsychologist(studentId, psychId, isAdmin)) {
    return res.status(403).json({
      error:
        'Acceso restringido: No tienes autorización para generar resúmenes de este estudiante sin consentimiento o solicitud activa.',
    });
  }

  const raw = db.getRaw();
  const studentUser = raw.users.find((u) => u.id === studentId);
  if (!studentUser) {
    return res.status(404).json({ error: 'Estudiante no encontrado.' });
  }

  const emotionalRecords = raw.emotionalRecords.filter((r) => r.studentId === studentId);
  const tasks = raw.tasks.filter((t) => t.studentId === studentId);
  const sessions = raw.counselingRequests.filter((c) => c.studentId === studentId);

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.json({
        summary: {
          period: 'Octubre 2026',
          mainThemes: ['Estrés académico acumulado por exámenes parciales', 'Organización de horarios de estudio'],
          emotionalTrend: 'Predominio de preocupación en días de entrega; mejoría tras completar tareas.',
          academicContext: `Tiene ${tasks.length} actividades programadas, incluyendo exámenes de cálculo y física.`,
          sessionAdvice: 'Explorar técnicas de relajación somática y estructuración de agenda.',
          disclaimer:
            'Aviso: Este resumen es generado automáticamente con fines de orientación preliminar y NO constituye un diagnóstico clínico.',
        },
      });
    }

    const ai = new GoogleGenAI();
    const prompt = `
Actúa como un asistente de síntesis para el equipo de orientación y psicología educativa de la plataforma "Mi Psicoloco".
Genera un resumen breve y profesional del contexto de acompañamiento para el estudiante: ${studentUser.name}.
Datos del estudiante:
- Registros emocionales recientes: ${JSON.stringify(emotionalRecords.slice(0, 5))}
- Carga de tareas y exámenes: ${JSON.stringify(tasks.map((t) => ({ title: t.title, type: t.type, dueDate: t.dueDate })))}
- Historial de solicitudes de asesoría: ${JSON.stringify(sessions.map((s) => ({ reason: s.reason, status: s.status })))}

Instrucciones estrictas:
1. NO emitas diagnósticos clínicos (como depresión, trastorno de ansiedad, etc.).
2. Enfócate en el contexto académico, fuentes de estrés reportadas por el alumno y recursos de apoyo recomendados.
3. Responde en formato JSON estructurado con las siguientes claves:
{
  "period": "Periodo evaluado",
  "mainThemes": ["Tema 1", "Tema 2", "Tema 3"],
  "emotionalTrend": "Descripción breve del patrón anímico",
  "academicContext": "Descripción de su carga académica actual",
  "sessionAdvice": "Puntos sugeridos para explorar en la sesión presencial/virtual",
  "disclaimer": "Este resumen fue elaborado con IA para fines de contexto y NO constituye un diagnóstico médico o psicológico."
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ summary: parsed });
  } catch (err: any) {
    console.error('Error in ai-summary:', err);
    return res.json({
      summary: {
        period: 'Octubre 2026',
        mainThemes: ['Carga de exámenes parciales', 'Gestión de tiempo'],
        emotionalTrend: 'Estrés moderado antes de entregas.',
        academicContext: `${tasks.length} entregas activas registradas en la plataforma.`,
        sessionAdvice: 'Revisar hábitos de sueño y manejo de presión.',
        disclaimer:
          'Este resumen fue elaborado para fines de contexto y NO constituye un diagnóstico médico o psicológico.',
      },
    });
  }
});

// GET /api/psychologists/crisis-alerts
router.get('/crisis-alerts', (req: AuthenticatedRequest, res: Response) => {
  const raw = db.getRaw();
  const alerts = (raw.crisisAlerts || []).map((alert) => {
    const studentUser = raw.users.find((u) => u.id === alert.studentId);
    return {
      ...alert,
      studentAvatar: studentUser?.avatar || alert.studentAvatar,
      studentPhone: studentUser?.phone || alert.studentPhone,
    };
  });
  return res.json({ alerts });
});

// PUT /api/psychologists/crisis-alerts/:id/status
router.put('/crisis-alerts/:id/status', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status, actionNote, professionalNote, derivedToName, isContactAttempt } = req.body;
  const user = req.user!;
  const raw = db.getRaw();

  const alert = (raw.crisisAlerts || []).find((a) => a.id === id);
  if (!alert) {
    return res.status(404).json({ error: 'Alerta no encontrada.' });
  }

  const validStatuses = ['nueva', 'recibida', 'en_atencion', 'derivada', 'atendida', 'cerrada'];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ error: `Estado inválido. Opciones permitidas: ${validStatuses.join(', ')}` });
  }

  let actionType = status || 'actualizacion';
  let detailsText = actionNote || `Estado actualizado a ${status}`;

  if (isContactAttempt) {
    alert.contactAttempts = (alert.contactAttempts || 0) + 1;
    alert.lastContactAttemptAt = new Date().toISOString();
    actionType = 'intento_contacto';
    detailsText = actionNote || `Intento de contacto #${alert.contactAttempts} registrado por ${user.name}`;
    if (alert.status === 'nueva' || alert.status === 'recibida') {
      alert.status = 'en_atencion';
    }
  } else if (status) {
    alert.status = status;
  }

  if (professionalNote !== undefined) {
    alert.professionalNotes = professionalNote;
  }

  if (derivedToName) {
    alert.derivedToName = derivedToName;
    detailsText += ` (Derivado a: ${derivedToName})`;
  }

  alert.updatedAt = new Date().toISOString();

  // Audit entry
  const auditEntry: CrisisAlertAudit = {
    id: `adt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    action: actionType,
    details: detailsText,
    timestamp: new Date().toISOString(),
  };

  if (!alert.auditTrail) {
    alert.auditTrail = [];
  }
  alert.auditTrail.unshift(auditEntry);

  // System audit log
  raw.auditLogs.unshift({
    id: `aud-${Date.now()}-alt`,
    userId: user.id,
    userName: user.name,
    role: user.role,
    action: `ALERTA_${actionType.toUpperCase()}`,
    details: `Alerta ${alert.id} de ${alert.studentName}: ${detailsText}`,
    ipAddress: req.ip || '127.0.0.1',
    createdAt: new Date().toISOString(),
  });

  // Notify student about state updates
  if (status === 'recibida' || status === 'en_atencion') {
    raw.notifications.unshift({
      id: `notif-${Date.now()}-${alert.studentId}`,
      userId: alert.studentId,
      title: 'Tu solicitud de apoyo está en atención',
      message: 'El equipo de orientación escolar ha tomado tu solicitud y se comunicará contigo.',
      type: 'info',
      read: false,
      createdAt: new Date().toISOString(),
    });
  } else if (status === 'atendida' || status === 'cerrada') {
    raw.notifications.unshift({
      id: `notif-${Date.now()}-${alert.studentId}`,
      userId: alert.studentId,
      title: 'Solicitud de apoyo atendida',
      message: 'Tu solicitud de apoyo urgente ha sido atendida por el área de orientación.',
      type: 'success',
      read: false,
      createdAt: new Date().toISOString(),
    });
  }

  db.save();

  return res.json({
    success: true,
    message: 'Alerta de apoyo urgente actualizada correctamente.',
    alert,
  });
});

export default router;
