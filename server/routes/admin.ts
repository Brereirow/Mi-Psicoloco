import { Router, Response } from 'express';
import { db, User, Subject, Group, hashPassword } from '../db/database.ts';
import { authMiddleware, AuthenticatedRequest, requireRole } from '../middleware/auth.ts';

const router = Router();
router.use(authMiddleware);
router.use(requireRole(['admin']));

// GET /api/admin/dashboard
router.get('/dashboard', (req: AuthenticatedRequest, res: Response) => {
  const raw = db.getRaw();

  const totalUsers = raw.users.length;
  const studentsCount = raw.users.filter((u) => u.role === 'student').length;
  const teachersCount = raw.users.filter((u) => u.role === 'teacher').length;
  const psychologistsCount = raw.users.filter((u) => u.role === 'psychologist').length;
  const groupsCount = raw.groups.length;
  const subjectsCount = raw.subjects.length;
  const tasksCount = raw.tasks.length;
  const completedTasks = raw.tasks.filter((t) => t.status === 'completada').length;
  const counselingCount = raw.counselingRequests.length;

  return res.json({
    metrics: {
      totalUsers,
      studentsCount,
      teachersCount,
      psychologistsCount,
      groupsCount,
      subjectsCount,
      tasksCount,
      completedTasks,
      counselingCount,
      institutionsCount: raw.institutions.length,
    },
    institution: raw.institutions[0],
    recentAuditLogs: raw.auditLogs.slice(0, 10),
  });
});

// GET /api/admin/users
router.get('/users', (req: AuthenticatedRequest, res: Response) => {
  const raw = db.getRaw();
  const { role, search } = req.query;

  let list = raw.users.map((u) => {
    let extra = '';
    if (u.role === 'student') {
      const s = raw.students.find((st) => st.userId === u.id);
      extra = s?.studentIdNumber || '';
    } else if (u.role === 'teacher') {
      const t = raw.teachers.find((th) => th.userId === u.id);
      extra = t?.department || '';
    }
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      avatar: u.avatar,
      active: u.active,
      phone: u.phone,
      extra,
      createdAt: u.createdAt,
    };
  });

  if (role && typeof role === 'string' && role !== 'all') {
    list = list.filter((u) => u.role === role);
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    list = list.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }

  return res.json({ users: list });
});

// POST /api/admin/users
router.post('/users', (req: AuthenticatedRequest, res: Response) => {
  const { name, email, password, role = 'student', phone } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Nombre, correo y contraseña son obligatorios.' });
  }

  const raw = db.getRaw();
  if (raw.users.some((u) => u.email.toLowerCase() === email.toLowerCase().trim())) {
    return res.status(409).json({ error: 'El correo electrónico ya se encuentra registrado.' });
  }

  const newUser: User = {
    id: `usr-${Date.now()}`,
    name: name.trim(),
    email: email.toLowerCase().trim(),
    passwordHash: hashPassword(password),
    role,
    institutionId: 'inst-1',
    phone: phone || '',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  raw.users.push(newUser);

  if (role === 'student') {
    raw.students.push({
      id: `std-${Date.now()}`,
      userId: newUser.id,
      studentIdNumber: `MAT-${Math.floor(1000 + Math.random() * 9000)}`,
      currentSemester: 1,
      groupId: raw.groups[0]?.id || 'grp-3a',
      emergencyContactName: 'Familiar',
      emergencyContactPhone: '+52 55 1234 5678',
    });
  } else if (role === 'teacher') {
    raw.teachers.push({
      id: `tch-${Date.now()}`,
      userId: newUser.id,
      department: 'Departamento Académico',
      cubicle: 'Edificio Central',
    });
  } else if (role === 'psychologist') {
    raw.psychologists.push({
      id: `psy-${Date.now()}`,
      userId: newUser.id,
      licenseNumber: `CED-${Math.floor(100000 + Math.random() * 900000)}`,
      office: 'Módulo de Orientación',
    });
  }

  raw.auditLogs.unshift({
    id: `aud-${Date.now()}`,
    userId: req.user!.id,
    userName: req.user!.name,
    role: 'admin',
    action: 'CREACION_USUARIO',
    details: `Usuario ${newUser.name} (${newUser.role}) creado.`,
    ipAddress: req.ip || '127.0.0.1',
    createdAt: new Date().toISOString(),
  });

  db.save();
  return res.status(201).json({ success: true, user: newUser });
});

// PUT /api/admin/users/:id
router.put('/users/:id', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.params.id;
  const raw = db.getRaw();
  const user = raw.users.find((u) => u.id === userId);

  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado.' });
  }

  const { name, email, role, active, phone, password } = req.body;
  if (name) user.name = name.trim();
  if (email) user.email = email.toLowerCase().trim();
  if (role) user.role = role;
  if (active !== undefined) user.active = active;
  if (phone !== undefined) user.phone = phone;
  if (password) user.passwordHash = hashPassword(password);
  user.updatedAt = new Date().toISOString();

  raw.auditLogs.unshift({
    id: `aud-${Date.now()}`,
    userId: req.user!.id,
    userName: req.user!.name,
    role: 'admin',
    action: 'MODIFICACION_USUARIO',
    details: `Usuario ${user.name} actualizado por administración.`,
    ipAddress: req.ip || '127.0.0.1',
    createdAt: new Date().toISOString(),
  });

  db.save();
  return res.json({ success: true, user });
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.params.id;
  const raw = db.getRaw();

  if (userId === req.user!.id) {
    return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta de administrador.' });
  }

  const index = raw.users.findIndex((u) => u.id === userId);
  if (index === -1) {
    return res.status(404).json({ error: 'Usuario no encontrado.' });
  }

  const deleted = raw.users.splice(index, 1)[0];

  raw.auditLogs.unshift({
    id: `aud-${Date.now()}`,
    userId: req.user!.id,
    userName: req.user!.name,
    role: 'admin',
    action: 'ELIMINACION_USUARIO',
    details: `Usuario ${deleted.name} (${deleted.email}) eliminado.`,
    ipAddress: req.ip || '127.0.0.1',
    createdAt: new Date().toISOString(),
  });

  db.save();
  return res.json({ success: true, message: 'Usuario eliminado del sistema.' });
});

// ================= GRUPOS =================
// GET /api/admin/groups
router.get('/groups', (req: AuthenticatedRequest, res: Response) => {
  const raw = db.getRaw();
  const list = raw.groups.map((g) => {
    const studentsInGroup = raw.students.filter((s) => s.groupId === g.id);
    const subjectsInGroup = raw.subjects.filter((s) => s.groupId === g.id);
    return {
      ...g,
      studentsCount: studentsInGroup.length,
      subjectsCount: subjectsInGroup.length,
    };
  });
  return res.json({ groups: list });
});

// POST /api/admin/groups
router.post('/groups', (req: AuthenticatedRequest, res: Response) => {
  const { name, shift = 'Matutino', academicYear = '2026-2027' } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'El nombre del grupo es obligatorio.' });
  }

  const raw = db.getRaw();
  const newGroup: Group = {
    id: `grp-${Date.now()}`,
    name: name.trim(),
    shift: shift === 'Vespertino' ? 'Vespertino' : 'Matutino',
    academicYear: academicYear.trim(),
  };

  raw.groups.push(newGroup);

  raw.auditLogs.unshift({
    id: `aud-${Date.now()}`,
    userId: req.user!.id,
    userName: req.user!.name,
    role: 'admin',
    action: 'CREACION_GRUPO',
    details: `Grupo ${newGroup.name} creado.`,
    ipAddress: req.ip || '127.0.0.1',
    createdAt: new Date().toISOString(),
  });

  db.save();
  return res.status(201).json({ success: true, group: newGroup });
});

// PUT /api/admin/groups/:id
router.put('/groups/:id', (req: AuthenticatedRequest, res: Response) => {
  const groupId = req.params.id;
  const { name, shift, academicYear } = req.body;
  const raw = db.getRaw();

  const group = raw.groups.find((g) => g.id === groupId);
  if (!group) {
    return res.status(404).json({ error: 'Grupo no encontrado.' });
  }

  if (name) group.name = name.trim();
  if (shift) group.shift = shift;
  if (academicYear) group.academicYear = academicYear.trim();

  raw.auditLogs.unshift({
    id: `aud-${Date.now()}`,
    userId: req.user!.id,
    userName: req.user!.name,
    role: 'admin',
    action: 'MODIFICACION_GRUPO',
    details: `Grupo ${group.name} actualizado.`,
    ipAddress: req.ip || '127.0.0.1',
    createdAt: new Date().toISOString(),
  });

  db.save();
  return res.json({ success: true, group });
});

// DELETE /api/admin/groups/:id
router.delete('/groups/:id', (req: AuthenticatedRequest, res: Response) => {
  const groupId = req.params.id;
  const raw = db.getRaw();

  const index = raw.groups.findIndex((g) => g.id === groupId);
  if (index === -1) {
    return res.status(404).json({ error: 'Grupo no encontrado.' });
  }

  const group = raw.groups[index];
  raw.groups.splice(index, 1);

  raw.auditLogs.unshift({
    id: `aud-${Date.now()}`,
    userId: req.user!.id,
    userName: req.user!.name,
    role: 'admin',
    action: 'ELIMINACION_GRUPO',
    details: `Grupo ${group.name} eliminado.`,
    ipAddress: req.ip || '127.0.0.1',
    createdAt: new Date().toISOString(),
  });

  db.save();
  return res.json({ success: true, message: 'Grupo eliminado con éxito.' });
});

// ================= MATERIAS =================
// GET /api/admin/subjects
router.get('/subjects', (req: AuthenticatedRequest, res: Response) => {
  const raw = db.getRaw();
  const list = raw.subjects.map((s) => {
    const teacher = raw.users.find((u) => u.id === s.teacherId);
    const group = raw.groups.find((g) => g.id === s.groupId);
    return {
      ...s,
      teacherName: teacher?.name || 'Sin docente asignado',
      teacherEmail: teacher?.email || '',
      groupName: group?.name || 'Sin grupo asignado',
    };
  });
  return res.json({ subjects: list });
});

// POST /api/admin/subjects
router.post('/subjects', (req: AuthenticatedRequest, res: Response) => {
  const { name, code, groupId, teacherId, schedule, classroom, color = '#3B82F6' } = req.body;
  if (!name || !code || !groupId || !teacherId) {
    return res.status(400).json({ error: 'Nombre, código, grupo y docente son obligatorios.' });
  }

  const raw = db.getRaw();
  const newSubject: Subject = {
    id: `subj-${Date.now()}`,
    name: name.trim(),
    code: code.trim().toUpperCase(),
    groupId,
    teacherId,
    schedule: schedule ? schedule.trim() : 'Por definir',
    classroom: classroom ? classroom.trim() : 'Aula General',
    color: color || '#3B82F6',
  };

  raw.subjects.push(newSubject);

  raw.auditLogs.unshift({
    id: `aud-${Date.now()}`,
    userId: req.user!.id,
    userName: req.user!.name,
    role: 'admin',
    action: 'CREACION_MATERIA',
    details: `Materia ${newSubject.name} (${newSubject.code}) creada.`,
    ipAddress: req.ip || '127.0.0.1',
    createdAt: new Date().toISOString(),
  });

  db.save();
  return res.status(201).json({ success: true, subject: newSubject });
});

// PUT /api/admin/subjects/:id
router.put('/subjects/:id', (req: AuthenticatedRequest, res: Response) => {
  const subjectId = req.params.id;
  const { name, code, groupId, teacherId, schedule, classroom, color } = req.body;
  const raw = db.getRaw();

  const subject = raw.subjects.find((s) => s.id === subjectId);
  if (!subject) {
    return res.status(404).json({ error: 'Materia no encontrada.' });
  }

  if (name) subject.name = name.trim();
  if (code) subject.code = code.trim().toUpperCase();
  if (groupId) subject.groupId = groupId;
  if (teacherId) subject.teacherId = teacherId;
  if (schedule !== undefined) subject.schedule = schedule.trim();
  if (classroom !== undefined) subject.classroom = classroom.trim();
  if (color) subject.color = color;

  raw.auditLogs.unshift({
    id: `aud-${Date.now()}`,
    userId: req.user!.id,
    userName: req.user!.name,
    role: 'admin',
    action: 'MODIFICACION_MATERIA',
    details: `Materia ${subject.name} actualizada.`,
    ipAddress: req.ip || '127.0.0.1',
    createdAt: new Date().toISOString(),
  });

  db.save();
  return res.json({ success: true, subject });
});

// DELETE /api/admin/subjects/:id
router.delete('/subjects/:id', (req: AuthenticatedRequest, res: Response) => {
  const subjectId = req.params.id;
  const raw = db.getRaw();

  const index = raw.subjects.findIndex((s) => s.id === subjectId);
  if (index === -1) {
    return res.status(404).json({ error: 'Materia no encontrada.' });
  }

  const subject = raw.subjects[index];
  raw.subjects.splice(index, 1);

  raw.auditLogs.unshift({
    id: `aud-${Date.now()}`,
    userId: req.user!.id,
    userName: req.user!.name,
    role: 'admin',
    action: 'ELIMINACION_MATERIA',
    details: `Materia ${subject.name} eliminada.`,
    ipAddress: req.ip || '127.0.0.1',
    createdAt: new Date().toISOString(),
  });

  db.save();
  return res.json({ success: true, message: 'Materia eliminada con éxito.' });
});

// GET /api/admin/stats
router.get('/stats', (req: AuthenticatedRequest, res: Response) => {
  const raw = db.getRaw();

  const moodDistribution: Record<string, number> = {
    muy_bien: 0,
    bien: 0,
    normal: 0,
    preocupado: 0,
    estresado: 0,
    triste: 0,
    enojado: 0,
  };
  raw.emotionalRecords.forEach((r) => {
    if (moodDistribution[r.mood] !== undefined) {
      moodDistribution[r.mood]++;
    }
  });

  let clarityTotal = 0;
  let orgTotal = 0;
  let commTotal = 0;
  let treatTotal = 0;
  let overallTotal = 0;
  const count = raw.evaluations.length;

  raw.evaluations.forEach((e) => {
    clarityTotal += e.clarity;
    orgTotal += e.organization;
    commTotal += e.communication;
    treatTotal += e.treatment;
    overallTotal += e.overall;
  });

  const teacherAverages =
    count > 0
      ? {
          clarity: Math.round(clarityTotal / count),
          organization: Math.round(orgTotal / count),
          communication: Math.round(commTotal / count),
          treatment: Math.round(treatTotal / count),
          overall: Math.round(overallTotal / count),
          totalEvaluations: count,
        }
      : { clarity: 85, organization: 80, communication: 88, treatment: 90, overall: 86, totalEvaluations: 0 };

  const totalTasks = raw.tasks.length;
  const completedTasks = raw.tasks.filter((t) => t.status === 'completada').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return res.json({
    moodDistribution,
    teacherAverages,
    completionRate,
    totalCounselingRequests: raw.counselingRequests.length,
    activeStudents: raw.users.filter((u) => u.role === 'student' && u.active).length,
  });
});

// GET /api/admin/audit-logs
router.get('/audit-logs', (req: AuthenticatedRequest, res: Response) => {
  const raw = db.getRaw();
  return res.json({ auditLogs: raw.auditLogs });
});

export default router;
