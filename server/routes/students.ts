import { Router, Response } from 'express';
import { db, Task, EmotionalRecord } from '../db/database.ts';
import { authMiddleware, AuthenticatedRequest, requireRole } from '../middleware/auth.ts';

const router = Router();

// Ensure student role or admin
router.use(authMiddleware);

// GET /api/students/dashboard
router.get('/dashboard', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const raw = db.getRaw();

  // Find student profile
  const student = raw.students.find((s) => s.userId === userId);
  const groupId = student?.groupId || 'grp-3a';

  // Get student subjects
  const subjects = raw.subjects.filter((s) => s.groupId === groupId);
  const subjectIds = subjects.map((s) => s.id);

  // Get tasks for student
  const studentTasks = raw.tasks.filter((t) => t.studentId === userId || (!t.studentId && subjectIds.includes(t.subjectId)));

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  // Check overdue
  studentTasks.forEach((t) => {
    if (t.status !== 'completada' && t.dueDate < todayStr) {
      t.status = 'atrasada';
    }
  });

  // Today's emotional record
  const todayEmotionalRecord = raw.emotionalRecords.find((r) => r.studentId === userId && r.date === todayStr);

  // Upcoming exams
  const upcomingExams = studentTasks
    .filter((t) => t.type === 'exam' && t.status !== 'completada')
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  // Upcoming projects
  const upcomingProjects = studentTasks
    .filter((t) => t.type === 'project' && t.status !== 'completada')
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  // Next tasks
  const nextTasks = studentTasks
    .filter((t) => t.type === 'task' && t.status !== 'completada')
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  // Appointments
  const appointments = raw.counselingRequests
    .filter(
      (c) =>
        c.studentId === userId &&
        (c.status === 'confirmada' ||
          c.status === 'aceptada' ||
          c.status === 'pendiente' ||
          c.status === 'reprogramada')
    )
    .sort((a, b) => (a.scheduledDate || a.preferredDate).localeCompare(b.scheduledDate || b.preferredDate));

  // Grades summary
  const studentGrades = raw.grades.filter((g) => g.studentId === userId);
  const avgGrade =
    studentGrades.length > 0
      ? (studentGrades.reduce((sum, g) => sum + g.score, 0) / studentGrades.length).toFixed(1)
      : '90.0';

  // Notifications
  const notifications = raw.notifications.filter((n) => n.userId === userId && !n.read).slice(0, 5);

  return res.json({
    studentName: req.user!.name,
    todayEmotionalRecord,
    upcomingExams,
    upcomingProjects,
    nextTasks,
    appointments,
    avgGrade,
    notifications,
    counts: {
      pending: studentTasks.filter((t) => t.status === 'pendiente').length,
      inProgress: studentTasks.filter((t) => t.status === 'en_proceso').length,
      completed: studentTasks.filter((t) => t.status === 'completada').length,
      overdue: studentTasks.filter((t) => t.status === 'atrasada').length,
    },
  });
});

// GET /api/students/tasks
router.get('/tasks', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const raw = db.getRaw();
  const student = raw.students.find((s) => s.userId === userId);
  const groupId = student?.groupId || 'grp-3a';
  const subjectIds = raw.subjects.filter((s) => s.groupId === groupId).map((s) => s.id);

  const tasks = raw.tasks
    .filter((t) => t.studentId === userId || (!t.studentId && subjectIds.includes(t.subjectId)))
    .map((t) => {
      const subject = raw.subjects.find((s) => s.id === t.subjectId);
      return {
        ...t,
        subjectName: subject?.name || 'General',
        subjectColor: subject?.color || '#6B7280',
      };
    });

  return res.json({ tasks });
});

// POST /api/students/tasks
router.post('/tasks', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { title, description, subjectId, type, dueDate, dueTime, priority, hasReminder } = req.body;

  if (!title || !dueDate) {
    return res.status(400).json({ error: 'Título y fecha de entrega son obligatorios.' });
  }

  const newTask: Task = {
    id: `tsk-${Date.now()}`,
    subjectId: subjectId || 'subj-1',
    studentId: userId,
    title: title.trim(),
    description: (description || '').trim(),
    type: type || 'task',
    dueDate,
    dueTime: dueTime || '12:00',
    priority: priority || 'media',
    status: 'pendiente',
    hasReminder: Boolean(hasReminder),
    createdBy: userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.getRaw().tasks.unshift(newTask);
  db.save();

  return res.status(201).json({ success: true, task: newTask });
});

// PUT /api/students/tasks/:id
router.put('/tasks/:id', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const taskId = req.params.id;
  const raw = db.getRaw();
  const task = raw.tasks.find((t) => t.id === taskId);

  if (!task) {
    return res.status(404).json({ error: 'Actividad no encontrada.' });
  }

  // Check ownership
  if (task.studentId && task.studentId !== userId && req.user!.role !== 'admin' && req.user!.role !== 'teacher') {
    return res.status(403).json({ error: 'No tienes permiso para modificar esta actividad.' });
  }

  const { status, title, description, dueDate, dueTime, priority, studyPlan, hasReminder } = req.body;
  if (status) task.status = status;
  if (title) task.title = title;
  if (description !== undefined) task.description = description;
  if (dueDate) task.dueDate = dueDate;
  if (dueTime) task.dueTime = dueTime;
  if (priority) task.priority = priority;
  if (studyPlan) task.studyPlan = studyPlan;
  if (hasReminder !== undefined) task.hasReminder = hasReminder;
  task.updatedAt = new Date().toISOString();

  db.save();
  return res.json({ success: true, task });
});

// DELETE /api/students/tasks/:id
router.delete('/tasks/:id', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const taskId = req.params.id;
  const raw = db.getRaw();
  const index = raw.tasks.findIndex((t) => t.id === taskId);

  if (index === -1) {
    return res.status(404).json({ error: 'Actividad no encontrada.' });
  }

  const task = raw.tasks[index];
  if (task.studentId && task.studentId !== userId && req.user!.role !== 'admin' && req.user!.role !== 'teacher') {
    return res.status(403).json({ error: 'No tienes permiso para eliminar esta actividad.' });
  }

  raw.tasks.splice(index, 1);
  db.save();

  return res.json({ success: true, message: 'Actividad eliminada con éxito.' });
});

// GET /api/students/subjects
router.get('/subjects', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const raw = db.getRaw();
  const student = raw.students.find((s) => s.userId === userId);
  const groupId = student?.groupId || 'grp-3a';

  const subjects = raw.subjects
    .filter((s) => s.groupId === groupId)
    .map((s) => {
      const teacherUser = raw.users.find((u) => u.id === s.teacherId);
      const subjectTasks = raw.tasks.filter((t) => t.subjectId === s.id);
      const subjectGrades = raw.grades.filter((g) => g.subjectId === s.id && g.studentId === userId);
      const avg =
        subjectGrades.length > 0
          ? (subjectGrades.reduce((acc, curr) => acc + curr.score, 0) / subjectGrades.length).toFixed(1)
          : 'N/A';

      return {
        ...s,
        teacherName: teacherUser?.name || 'Docente Asignado',
        tasksCount: subjectTasks.length,
        averageGrade: avg,
        grades: subjectGrades,
        upcomingActivities: subjectTasks.filter((t) => t.status !== 'completada'),
      };
    });

  return res.json({ subjects });
});

// GET /api/students/teachers
router.get('/teachers', (req: AuthenticatedRequest, res: Response) => {
  const raw = db.getRaw();
  const teachers = raw.users
    .filter((u) => u.role === 'teacher' && u.active !== false)
    .map((u) => {
      const teacherProfile = raw.teachers.find((t) => t.userId === u.id);
      const teacherSubjects = raw.subjects.filter((s) => s.teacherId === u.id);
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        department: teacherProfile?.department || 'Departamento Académico',
        cubicle: teacherProfile?.cubicle || 'Cubículo Docente',
        subjects: teacherSubjects.map((s) => ({ id: s.id, name: s.name, code: s.code })),
      };
    });
  return res.json({ teachers });
});

// GET /api/students/grades
router.get('/grades', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const raw = db.getRaw();
  const student = raw.students.find((s) => s.userId === userId);
  const groupId = student?.groupId || 'grp-3a';

  const subjects = raw.subjects.filter((s) => s.groupId === groupId);
  const gradesBySubject = subjects.map((subj) => {
    const list = raw.grades.filter((g) => g.subjectId === subj.id && g.studentId === userId);
    const avg =
      list.length > 0 ? (list.reduce((sum, g) => sum + g.score, 0) / list.length).toFixed(1) : 'Sin notas';
    return {
      subjectId: subj.id,
      subjectName: subj.name,
      color: subj.color,
      average: avg,
      evaluations: list,
    };
  });

  const allGrades = raw.grades.filter((g) => g.studentId === userId);
  const overallAverage =
    allGrades.length > 0 ? (allGrades.reduce((sum, g) => sum + g.score, 0) / allGrades.length).toFixed(1) : '90.0';

  return res.json({
    overallAverage,
    subjects: gradesBySubject,
  });
});

// GET /api/students/emotional-records
router.get('/emotional-records', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const raw = db.getRaw();
  const records = raw.emotionalRecords
    .filter((r) => r.studentId === userId)
    .sort((a, b) => b.date.localeCompare(a.date));

  // Calculate mood counts for statistics
  const moodCounts: Record<string, number> = {};
  records.forEach((r) => {
    moodCounts[r.mood] = (moodCounts[r.mood] || 0) + 1;
  });

  return res.json({ records, moodCounts });
});

// POST /api/students/emotional-records
router.post('/emotional-records', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { mood, reasonCategory, note } = req.body;

  if (!mood) {
    return res.status(400).json({ error: 'Debes seleccionar un estado de ánimo.' });
  }

  const moodScoreMap: Record<string, number> = {
    muy_bien: 7,
    bien: 6,
    normal: 5,
    preocupado: 4,
    estresado: 3,
    triste: 2,
    enojado: 1,
  };

  const todayStr = new Date().toISOString().slice(0, 10);
  const raw = db.getRaw();

  // Find if already recorded today, update or create
  let record = raw.emotionalRecords.find((r) => r.studentId === userId && r.date === todayStr);
  if (record) {
    record.mood = mood;
    record.moodScore = moodScoreMap[mood] || 5;
    record.reasonCategory = reasonCategory || '';
    record.note = note || '';
  } else {
    record = {
      id: `emo-${Date.now()}`,
      studentId: userId,
      mood,
      moodScore: moodScoreMap[mood] || 5,
      reasonCategory: reasonCategory || '',
      note: note || '',
      date: todayStr,
      createdAt: new Date().toISOString(),
    };
    raw.emotionalRecords.unshift(record);
  }

  db.save();
  return res.json({
    success: true,
    message: 'Registro emocional guardado con éxito de forma confidencial.',
    record,
  });
});

export default router;
