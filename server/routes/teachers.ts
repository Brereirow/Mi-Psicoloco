import { Router, Response } from 'express';
import { db, Task, Grade } from '../db/database.ts';
import { authMiddleware, AuthenticatedRequest, requireRole } from '../middleware/auth.ts';

const router = Router();
router.use(authMiddleware);
router.use(requireRole(['teacher', 'admin']));

// GET /api/teachers/dashboard
router.get('/dashboard', (req: AuthenticatedRequest, res: Response) => {
  const teacherId = req.user!.id;
  const raw = db.getRaw();

  const subjects = raw.subjects.filter((s) => s.teacherId === teacherId);
  const subjectIds = subjects.map((s) => s.id);
  const groupIds = Array.from(new Set(subjects.map((s) => s.groupId)));

  const groups = raw.groups.filter((g) => groupIds.includes(g.id));
  const students = raw.students.filter((std) => groupIds.includes(std.groupId));
  const tasks = raw.tasks.filter((t) => subjectIds.includes(t.subjectId));

  const academicCounselings = raw.counselingRequests.filter(
    (c) =>
      c.type === 'asesoria_academica' &&
      (c.teacherId === teacherId ||
        (!c.teacherId && subjectIds.includes(c.subjectId || '')) ||
        (!c.teacherId && !c.subjectId))
  );

  return res.json({
    teacherName: req.user!.name,
    stats: {
      totalSubjects: subjects.length,
      totalGroups: groups.length,
      totalStudents: students.length,
      activeTasks: tasks.filter((t) => t.status !== 'completada').length,
      pendingTutoring: academicCounselings.filter((c) => c.status === 'pendiente').length,
    },
    subjects,
    groups,
    recentTasks: tasks.slice(0, 5),
    academicCounselings,
  });
});

// GET /api/teachers/groups
router.get('/groups', (req: AuthenticatedRequest, res: Response) => {
  const teacherId = req.user!.id;
  const raw = db.getRaw();

  const teacherSubjects = raw.subjects.filter((s) => s.teacherId === teacherId);
  const groupIds = Array.from(new Set(teacherSubjects.map((s) => s.groupId)));

  const groupsWithDetails = raw.groups
    .filter((g) => groupIds.includes(g.id))
    .map((g) => {
      const groupStudents = raw.students
        .filter((std) => std.groupId === g.id)
        .map((std) => {
          const user = raw.users.find((u) => u.id === std.userId);
          return {
            studentProfileId: std.id,
            userId: std.userId,
            name: user?.name || 'Estudiante',
            email: user?.email || '',
            studentIdNumber: std.studentIdNumber,
            avatar: user?.avatar,
          };
        });

      const groupSubjects = teacherSubjects.filter((s) => s.groupId === g.id);

      return {
        ...g,
        studentsCount: groupStudents.length,
        students: groupStudents,
        subjects: groupSubjects,
      };
    });

  return res.json({ groups: groupsWithDetails });
});

// GET /api/teachers/students
router.get('/students', (req: AuthenticatedRequest, res: Response) => {
  const teacherId = req.user!.id;
  const raw = db.getRaw();

  const teacherSubjects = raw.subjects.filter((s) => s.teacherId === teacherId);
  const groupIds = Array.from(new Set(teacherSubjects.map((s) => s.groupId)));

  const studentsList = raw.students
    .filter((std) => groupIds.includes(std.groupId))
    .map((std) => {
      const user = raw.users.find((u) => u.id === std.userId);
      const group = raw.groups.find((g) => g.id === std.groupId);

      // Calculate student average for this teacher's subjects
      const teacherSubjectIds = teacherSubjects.map((s) => s.id);
      const studentGrades = raw.grades.filter(
        (g) => g.studentId === std.userId && teacherSubjectIds.includes(g.subjectId)
      );
      const avg =
        studentGrades.length > 0
          ? (studentGrades.reduce((sum, g) => sum + g.score, 0) / studentGrades.length).toFixed(1)
          : 'Sin notas';

      return {
        studentProfileId: std.id,
        userId: std.userId,
        name: user?.name || 'Estudiante',
        email: user?.email || '',
        phone: user?.phone || '',
        studentIdNumber: std.studentIdNumber,
        currentSemester: std.currentSemester,
        groupId: std.groupId,
        groupName: group?.name || 'Grupo Desconocido',
        average: avg,
        gradesCount: studentGrades.length,
        active: user?.active ?? true,
      };
    });

  return res.json({ students: studentsList });
});

// GET /api/teachers/activities
router.get('/activities', (req: AuthenticatedRequest, res: Response) => {
  const teacherId = req.user!.id;
  const raw = db.getRaw();

  const teacherSubjects = raw.subjects.filter((s) => s.teacherId === teacherId);
  const teacherSubjectIds = teacherSubjects.map((s) => s.id);

  const activities = raw.tasks
    .filter((t) => teacherSubjectIds.includes(t.subjectId))
    .map((t) => {
      const subject = raw.subjects.find((s) => s.id === t.subjectId);
      const group = raw.groups.find((g) => g.id === subject?.groupId);
      return {
        ...t,
        subjectName: subject?.name || 'Materia',
        groupName: group?.name || 'Grupo',
      };
    });

  return res.json({ activities });
});

// POST /api/teachers/activities
router.post('/activities', (req: AuthenticatedRequest, res: Response) => {
  const teacherId = req.user!.id;
  const { title, description, subjectId, type, dueDate, dueTime, priority } = req.body;

  if (!title || !subjectId || !dueDate) {
    return res.status(400).json({ error: 'Título, materia y fecha son obligatorios.' });
  }

  const raw = db.getRaw();
  const subject = raw.subjects.find((s) => s.id === subjectId);
  if (!subject) {
    return res.status(404).json({ error: 'Materia no encontrada.' });
  }

  const newTask: Task = {
    id: `tsk-${Date.now()}`,
    subjectId,
    title: title.trim(),
    description: (description || '').trim(),
    type: type || 'task',
    dueDate,
    dueTime: dueTime || '12:00',
    priority: priority || 'media',
    status: 'pendiente',
    hasReminder: true,
    createdBy: teacherId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  raw.tasks.unshift(newTask);

  // Notify students in group
  const studentsInGroup = raw.students.filter((s) => s.groupId === subject.groupId);
  studentsInGroup.forEach((std) => {
    raw.notifications.unshift({
      id: `notif-${Date.now()}-${std.id}`,
      userId: std.userId,
      title: `Nueva actividad: ${newTask.title}`,
      message: `El profesor publicó una nueva actividad para ${subject.name}. Entrega: ${newTask.dueDate}`,
      type: 'info',
      read: false,
      createdAt: new Date().toISOString(),
    });
  });

  db.save();
  return res.status(201).json({ success: true, task: newTask });
});

// PUT /api/teachers/activities/:id
router.put('/activities/:id', (req: AuthenticatedRequest, res: Response) => {
  const activityId = req.params.id;
  const { title, description, subjectId, type, dueDate, dueTime, priority, status } = req.body;
  const raw = db.getRaw();

  const task = raw.tasks.find((t) => t.id === activityId);
  if (!task) {
    return res.status(404).json({ error: 'Actividad no encontrada.' });
  }

  if (title) task.title = title.trim();
  if (description !== undefined) task.description = description.trim();
  if (subjectId) task.subjectId = subjectId;
  if (type) task.type = type;
  if (dueDate) task.dueDate = dueDate;
  if (dueTime) task.dueTime = dueTime;
  if (priority) task.priority = priority;
  if (status) task.status = status;
  task.updatedAt = new Date().toISOString();

  db.save();
  return res.json({ success: true, task });
});

// DELETE /api/teachers/activities/:id
router.delete('/activities/:id', (req: AuthenticatedRequest, res: Response) => {
  const activityId = req.params.id;
  const raw = db.getRaw();

  const index = raw.tasks.findIndex((t) => t.id === activityId);
  if (index === -1) {
    return res.status(404).json({ error: 'Actividad no encontrada.' });
  }

  raw.tasks.splice(index, 1);
  db.save();
  return res.json({ success: true, message: 'Actividad eliminada con éxito.' });
});

// GET /api/teachers/grades/:subjectId
router.get('/grades/:subjectId', (req: AuthenticatedRequest, res: Response) => {
  const subjectId = req.params.subjectId;
  const raw = db.getRaw();
  const subject = raw.subjects.find((s) => s.id === subjectId);

  if (!subject) {
    return res.status(404).json({ error: 'Materia no encontrada.' });
  }

  const students = raw.students
    .filter((std) => std.groupId === subject.groupId)
    .map((std) => {
      const user = raw.users.find((u) => u.id === std.userId);
      const studentGrades = raw.grades.filter((g) => g.subjectId === subjectId && g.studentId === std.userId);
      const avg =
        studentGrades.length > 0
          ? (studentGrades.reduce((sum, g) => sum + g.score, 0) / studentGrades.length).toFixed(1)
          : 'N/A';

      return {
        userId: std.userId,
        name: user?.name || 'Estudiante',
        studentIdNumber: std.studentIdNumber,
        average: avg,
        grades: studentGrades,
      };
    });

  return res.json({ subject, students });
});

// POST /api/teachers/grades
router.post('/grades', (req: AuthenticatedRequest, res: Response) => {
  const { subjectId, studentId, evaluationName, score, maxScore = 100, feedback } = req.body;

  if (!subjectId || !studentId || !evaluationName || score === undefined) {
    return res.status(400).json({ error: 'Todos los campos de calificación son requeridos.' });
  }

  const raw = db.getRaw();
  const newGrade: Grade = {
    id: `grd-${Date.now()}`,
    subjectId,
    studentId,
    evaluationName: evaluationName.trim(),
    score: Number(score),
    maxScore: Number(maxScore),
    percentage: Math.round((Number(score) / Number(maxScore)) * 100),
    feedback: feedback || '',
    date: new Date().toISOString().slice(0, 10),
  };

  raw.grades.push(newGrade);

  // Notify student
  raw.notifications.unshift({
    id: `notif-${Date.now()}`,
    userId: studentId,
    title: 'Nueva calificación registrada',
    message: `Has obtenido ${newGrade.score}/${newGrade.maxScore} en ${newGrade.evaluationName}.`,
    type: 'success',
    read: false,
    createdAt: new Date().toISOString(),
  });

  db.save();
  return res.status(201).json({ success: true, grade: newGrade });
});

// PUT /api/teachers/grades/:id
router.put('/grades/:id', (req: AuthenticatedRequest, res: Response) => {
  const gradeId = req.params.id;
  const { evaluationName, score, maxScore = 100, feedback } = req.body;
  const raw = db.getRaw();

  const grade = raw.grades.find((g) => g.id === gradeId);
  if (!grade) {
    return res.status(404).json({ error: 'Calificación no encontrada.' });
  }

  if (evaluationName) grade.evaluationName = evaluationName.trim();
  if (score !== undefined) {
    grade.score = Number(score);
    grade.percentage = Math.round((Number(score) / Number(maxScore || grade.maxScore)) * 100);
  }
  if (maxScore !== undefined) grade.maxScore = Number(maxScore);
  if (feedback !== undefined) grade.feedback = feedback.trim();

  db.save();
  return res.json({ success: true, grade });
});

// DELETE /api/teachers/grades/:id
router.delete('/grades/:id', (req: AuthenticatedRequest, res: Response) => {
  const gradeId = req.params.id;
  const raw = db.getRaw();

  const index = raw.grades.findIndex((g) => g.id === gradeId);
  if (index === -1) {
    return res.status(404).json({ error: 'Calificación no encontrada.' });
  }

  raw.grades.splice(index, 1);
  db.save();
  return res.json({ success: true, message: 'Calificación eliminada con éxito.' });
});

// GET /api/teachers/counseling-requests
router.get('/counseling-requests', (req: AuthenticatedRequest, res: Response) => {
  const teacherId = req.user!.id;
  const raw = db.getRaw();

  const teacherSubjects = raw.subjects.filter((s) => s.teacherId === teacherId);
  const teacherSubjectIds = teacherSubjects.map((s) => s.id);

  const requests = raw.counselingRequests
    .filter(
      (c) =>
        c.type === 'asesoria_academica' &&
        (c.teacherId === teacherId ||
          (!c.teacherId && teacherSubjectIds.includes(c.subjectId || '')) ||
          (!c.teacherId && !c.subjectId))
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((c) => {
      const studentUser = raw.users.find((u) => u.id === c.studentId);
      const studentProfile = raw.students.find((s) => s.userId === c.studentId);
      const groupObj = raw.groups.find((g) => g.id === (c.groupId || studentProfile?.groupId));
      const subjectObj = c.subjectId
        ? raw.subjects.find((s) => s.id === c.subjectId)
        : raw.subjects.find((s) => s.name.toLowerCase() === (c.subject || '').toLowerCase() && s.teacherId === teacherId);

      return {
        ...c,
        studentName: studentUser?.name || 'Estudiante',
        studentEmail: studentUser?.email || '',
        studentPhone: studentUser?.phone || '',
        studentMatricula: studentProfile?.studentIdNumber || 'N/A',
        studentAvatar: studentUser?.avatar,
        groupName: groupObj?.name || 'Grupo sin asignar',
        subjectName: subjectObj?.name || c.subject || 'Asesoría Académica',
        subjectCode: subjectObj?.code,
      };
    });

  return res.json({ requests });
});

// PUT /api/teachers/counseling-requests/:id
router.put('/counseling-requests/:id', (req: AuthenticatedRequest, res: Response) => {
  const teacherId = req.user!.id;
  const requestId = req.params.id;
  const {
    action,
    status,
    notes,
    rejectionReason,
    cancellationReason,
    proposedDate,
    proposedTime,
    scheduledDate,
    scheduledTime,
    meetingLink,
  } = req.body;

  const raw = db.getRaw();
  const request = raw.counselingRequests.find((c) => c.id === requestId);
  if (!request) {
    return res.status(404).json({ error: 'Solicitud no encontrada.' });
  }

  // Ensure request is assigned to this teacher if unassigned
  if (!request.teacherId) {
    request.teacherId = teacherId;
  }

  let finalStatus = status || request.status;
  if (action === 'accept') {
    finalStatus = 'aceptada';
    request.scheduledDate = scheduledDate || proposedDate || request.preferredDate;
    request.scheduledTime = scheduledTime || proposedTime || request.preferredTime;
    if (meetingLink) request.meetingLink = meetingLink.trim();
    if (notes) request.notes = notes.trim();
  } else if (action === 'reject') {
    finalStatus = 'rechazada';
    request.rejectionReason = rejectionReason || notes || 'Horario no disponible';
  } else if (action === 'reschedule') {
    finalStatus = 'reprogramada';
    request.proposedDate = proposedDate;
    request.proposedTime = proposedTime;
    request.notes = notes ? notes.trim() : 'El docente propuso una nueva fecha u hora.';
  } else if (action === 'complete') {
    finalStatus = 'completada';
    if (notes) request.notes = notes.trim();
  } else if (action === 'cancel') {
    finalStatus = 'cancelada';
    request.cancellationReason = cancellationReason || notes || 'Cancelada por el docente';
  }

  request.status = finalStatus;
  request.updatedAt = new Date().toISOString();

  // Create notification for student
  const subjectName = request.subject || 'Asesoría';
  let notifTitle = 'Actualización en tu asesoría';
  let notifMsg = `El docente actualizó tu solicitud de asesoría en ${subjectName}.`;

  if (finalStatus === 'aceptada') {
    notifTitle = '¡Asesoría aceptada!';
    notifMsg = `Tu asesoría de ${subjectName} ha sido aceptada para el ${request.scheduledDate || request.preferredDate} a las ${request.scheduledTime || request.preferredTime}.`;
  } else if (finalStatus === 'rechazada') {
    notifTitle = 'Asesoría no aceptada';
    notifMsg = `Tu solicitud de ${subjectName} fue rechazada. Motivo: ${request.rejectionReason || 'No especificado'}.`;
  } else if (finalStatus === 'reprogramada') {
    notifTitle = 'Nueva fecha propuesta para asesoría';
    notifMsg = `El docente propone realizar la asesoría de ${subjectName} el ${request.proposedDate} a las ${request.proposedTime}. Revisa tu panel para responder.`;
  } else if (finalStatus === 'completada') {
    notifTitle = 'Asesoría completada';
    notifMsg = `Tu asesoría de ${subjectName} ha sido marcada como completada.`;
  } else if (finalStatus === 'cancelada') {
    notifTitle = 'Asesoría cancelada';
    notifMsg = `La asesoría de ${subjectName} ha sido cancelada. Motivo: ${request.cancellationReason || 'No especificado'}.`;
  }

  raw.notifications.unshift({
    id: `notif-${Date.now()}-${request.studentId}`,
    userId: request.studentId,
    title: notifTitle,
    message: notifMsg,
    type: finalStatus === 'aceptada' ? 'success' : finalStatus === 'rechazada' || finalStatus === 'cancelada' ? 'warning' : 'info',
    read: false,
    createdAt: new Date().toISOString(),
  });

  db.save();
  return res.json({ success: true, message: 'Solicitud actualizada con éxito.', request });
});

// GET /api/teachers/crisis-alerts (Authorized operational view only for teacher's groups, excluding clinical notes)
router.get('/crisis-alerts', (req: AuthenticatedRequest, res: Response) => {
  const teacherId = req.user!.id;
  const raw = db.getRaw();

  const teacherSubjectGroupIds = raw.subjects
    .filter((s) => s.teacherId === teacherId)
    .map((s) => s.groupId);

  const teacherAlerts = (raw.crisisAlerts || [])
    .filter((a) => a.assignedTeacherId === teacherId || (a.groupId && teacherSubjectGroupIds.includes(a.groupId)))
    .map((a) => {
      const studentUser = raw.users.find((u) => u.id === a.studentId);
      return {
        id: a.id,
        studentName: a.studentName,
        studentMatricula: a.studentMatricula,
        studentAvatar: studentUser?.avatar || a.studentAvatar,
        groupName: a.groupName,
        alertType: a.alertType,
        status: a.status,
        contactAttempts: a.contactAttempts,
        lastContactAttemptAt: a.lastContactAttemptAt,
        operationalNotes: a.operationalNotes,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
      };
    });

  return res.json({ alerts: teacherAlerts });
});

export default router;
