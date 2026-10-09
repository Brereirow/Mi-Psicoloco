import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'student' | 'teacher' | 'psychologist' | 'admin' | 'general';
  avatar?: string;
  institutionId: string;
  phone?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Institution {
  id: string;
  name: string;
  code: string;
  supportPhone: string;
  supportEmail: string;
  emergencyContact: string;
}

export interface StudentProfile {
  id: string;
  userId: string;
  studentIdNumber: string; // Matrícula
  currentSemester: number;
  groupId: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
}

export interface TeacherProfile {
  id: string;
  userId: string;
  department: string;
  cubicle?: string;
}

export interface PsychologistProfile {
  id: string;
  userId: string;
  licenseNumber: string;
  office: string;
}

export interface Group {
  id: string;
  name: string; // e.g. "3°A Bachillerato / Ing."
  shift: 'Matutino' | 'Vespertino';
  academicYear: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  groupId: string;
  teacherId: string;
  schedule: string;
  classroom: string;
  color: string;
}

export interface Task {
  id: string;
  subjectId: string;
  studentId?: string; // If personalized or teacher created for all
  title: string;
  description: string;
  type: 'task' | 'project' | 'exam' | 'personal';
  dueDate: string;
  dueTime: string;
  priority: 'alta' | 'media' | 'baja';
  status: 'pendiente' | 'en_proceso' | 'completada' | 'atrasada';
  hasReminder: boolean;
  studyPlan?: {
    sessions: { day: string; durationMinutes: number; focus: string }[];
  };
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Grade {
  id: string;
  subjectId: string;
  studentId: string;
  evaluationName: string;
  score: number;
  maxScore: number;
  percentage: number;
  feedback?: string;
  date: string;
}

export interface EmotionalRecord {
  id: string;
  studentId: string;
  mood: 'muy_bien' | 'bien' | 'normal' | 'preocupado' | 'estresado' | 'triste' | 'enojado';
  moodScore: number; // 1 to 7 for analytics
  reasonCategory?: string;
  note?: string;
  date: string; // YYYY-MM-DD
  createdAt: string;
}

export interface WellnessResource {
  id: string;
  title: string;
  category: 'Estrés' | 'Ansiedad' | 'Organización' | 'Concentración' | 'Respiración' | 'Relajación' | 'Exámenes' | 'Descanso' | 'Manejo del tiempo';
  durationMinutes: number;
  type: 'guia' | 'ejercicio' | 'audio' | 'tecnica';
  summary: string;
  content: string;
  steps: string[];
}

export interface CounselingRequest {
  id: string;
  studentId: string;
  teacherId?: string;
  psychologistId?: string;
  subjectId?: string;
  groupId?: string;
  type: 'orientacion_psicologica' | 'asesoria_academica';
  subject?: string;
  reason: string;
  preferredDate: string;
  preferredTime: string;
  modality: 'presencial' | 'virtual';
  status: 'pendiente' | 'aceptada' | 'rechazada' | 'reprogramada' | 'cancelada' | 'completada' | 'confirmada';
  scheduledDate?: string;
  scheduledTime?: string;
  proposedDate?: string;
  proposedTime?: string;
  rejectionReason?: string;
  cancellationReason?: string;
  notes?: string;
  meetingLink?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface GroupMessage {
  id: string;
  subjectId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  content: string;
  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  targetRole: 'all' | 'students' | 'teachers' | 'groups';
  groupId?: string;
  isOfficial: boolean;
  createdAt: string;
}

export interface AnonymousEvaluation {
  id: string;
  subjectId: string;
  teacherId: string;
  clarity: number; // 1-100
  organization: number;
  communication: number;
  treatment: number;
  overall: number;
  comment?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  role: string;
  action: string;
  details: string;
  ipAddress: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'urgent';
  read: boolean;
  createdAt: string;
}

export interface CrisisAlertAudit {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface CrisisAlert {
  id: string;
  studentId: string;
  studentName: string;
  studentMatricula?: string;
  studentAvatar?: string;
  studentEmail?: string;
  studentPhone?: string;
  groupId?: string;
  groupName?: string;
  assignedPsychologistId?: string;
  assignedPsychologistName?: string;
  assignedTeacherId?: string;
  assignedTeacherName?: string;
  alertType: 'crisis_emocional' | 'apoyo_urgente';
  status: 'nueva' | 'recibida' | 'en_atencion' | 'derivada' | 'atendida' | 'cerrada';
  studentNote?: string;
  professionalNotes?: string;
  operationalNotes?: string;
  contactAttempts: number;
  lastContactAttemptAt?: string;
  derivedToName?: string;
  auditTrail: CrisisAlertAudit[];
  createdAt: string;
  updatedAt: string;
}

export interface DatabaseSchema {
  institutions: Institution[];
  users: User[];
  students: StudentProfile[];
  teachers: TeacherProfile[];
  psychologists: PsychologistProfile[];
  groups: Group[];
  subjects: Subject[];
  tasks: Task[];
  grades: Grade[];
  emotionalRecords: EmotionalRecord[];
  wellnessResources: WellnessResource[];
  counselingRequests: CounselingRequest[];
  crisisAlerts: CrisisAlert[];
  groupMessages: GroupMessage[];
  announcements: Announcement[];
  evaluations: AnonymousEvaluation[];
  auditLogs: AuditLog[];
  notifications: NotificationItem[];
}

const DATA_DIR = path.resolve(process.cwd(), 'server', 'data');
const DB_FILE = path.resolve(DATA_DIR, 'db.json');

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'mipsicoloco_salt').digest('hex');
}

export class Database {
  private data: DatabaseSchema;

  constructor() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        if (!this.data.crisisAlerts) {
          this.data.crisisAlerts = [];
        }
      } catch (err) {
        console.error('Error reading db.json, re-seeding:', err);
        this.data = this.getSeedData();
        this.save();
      }
    } else {
      this.data = this.getSeedData();
      this.save();
    }
  }

  public getRaw(): DatabaseSchema {
    return this.data;
  }

  public save(): void {
    fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
  }

  public getSeedData(): DatabaseSchema {
    const institutionId = 'inst-1';
    const groupId = 'grp-3a';

    const users: User[] = [
      {
        id: 'usr-student-1',
        name: 'Carlos Mendoza',
        email: 'carlos.mendoza@estudiante.edu',
        passwordHash: hashPassword('estudiante123'),
        role: 'student',
        institutionId,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        phone: '+52 55 1234 5678',
        active: true,
        createdAt: '2026-09-01T08:00:00.000Z',
        updatedAt: '2026-09-01T08:00:00.000Z',
      },
      {
        id: 'usr-teacher-1',
        name: 'Prof. Roberto Silva',
        email: 'roberto.silva@docente.edu',
        passwordHash: hashPassword('docente123'),
        role: 'teacher',
        institutionId,
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        phone: '+52 55 8765 4321',
        active: true,
        createdAt: '2026-09-01T08:00:00.000Z',
        updatedAt: '2026-09-01T08:00:00.000Z',
      },
      {
        id: 'usr-psych-1',
        name: 'Lic. Mariana Gómez',
        email: 'mariana.gomez@bienestar.edu',
        passwordHash: hashPassword('psicologo123'),
        role: 'psychologist',
        institutionId,
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
        phone: '+52 55 4567 8901',
        active: true,
        createdAt: '2026-09-01T08:00:00.000Z',
        updatedAt: '2026-09-01T08:00:00.000Z',
      },
      {
        id: 'usr-admin-1',
        name: 'Dra. Elena Ramos',
        email: 'elena.ramos@instituto.edu',
        passwordHash: hashPassword('admin123'),
        role: 'admin',
        institutionId,
        avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
        phone: '+52 55 9999 8888',
        active: true,
        createdAt: '2026-09-01T08:00:00.000Z',
        updatedAt: '2026-09-01T08:00:00.000Z',
      },
    ];

    const students: StudentProfile[] = [
      {
        id: 'std-1',
        userId: 'usr-student-1',
        studentIdNumber: 'MAT-2026-894',
        currentSemester: 3,
        groupId,
        emergencyContactName: 'Laura Mendoza (Madre)',
        emergencyContactPhone: '+52 55 9876 5432',
      },
    ];

    const teachers: TeacherProfile[] = [
      {
        id: 'tch-1',
        userId: 'usr-teacher-1',
        department: 'Ciencias Exactas e Ingeniería',
        cubicle: 'Edificio B - 204',
      },
    ];

    const psychologists: PsychologistProfile[] = [
      {
        id: 'psy-1',
        userId: 'usr-psych-1',
        licenseNumber: 'CED-PSI-994821',
        office: 'Módulo de Orientación y Bienestar - Cubículo 3',
      },
    ];

    const groups: Group[] = [
      {
        id: groupId,
        name: '3° Semestre - Grupo A',
        shift: 'Matutino',
        academicYear: '2026-2027',
      },
      {
        id: 'grp-3b',
        name: '3° Semestre - Grupo B',
        shift: 'Vespertino',
        academicYear: '2026-2027',
      },
    ];

    const subjects: Subject[] = [
      {
        id: 'subj-1',
        name: 'Matemáticas III (Cálculo)',
        code: 'MAT-301',
        groupId,
        teacherId: 'usr-teacher-1',
        schedule: 'Lun y Mié 08:00 - 10:00',
        classroom: 'Aula Magna 102',
        color: '#3B82F6',
      },
      {
        id: 'subj-2',
        name: 'Física General',
        code: 'FIS-201',
        groupId,
        teacherId: 'usr-teacher-1',
        schedule: 'Mar y Jue 10:00 - 12:00',
        classroom: 'Laboratorio de Física 1',
        color: '#10B981',
      },
      {
        id: 'subj-3',
        name: 'Historia Contemporánea',
        code: 'HIS-103',
        groupId,
        teacherId: 'usr-teacher-1',
        schedule: 'Vie 08:00 - 11:00',
        classroom: 'Aula 205',
        color: '#F59E0B',
      },
      {
        id: 'subj-4',
        name: 'Química Orgánica',
        code: 'QUI-202',
        groupId,
        teacherId: 'usr-teacher-1',
        schedule: 'Lun y Mié 11:00 - 13:00',
        classroom: 'Laboratorio Central',
        color: '#8B5CF6',
      },
    ];

    const tasks: Task[] = [
      {
        id: 'tsk-1',
        subjectId: 'subj-1',
        studentId: 'usr-student-1',
        title: 'Examen de Matemáticas (Derivadas e Integrales)',
        description: 'Evaluación parcial sobre aplicaciones de razón de cambio y cálculo integral.',
        type: 'exam',
        dueDate: '2026-10-12',
        dueTime: '08:00',
        priority: 'alta',
        status: 'pendiente',
        hasReminder: true,
        studyPlan: {
          sessions: [
            { day: 'Día 1', durationMinutes: 30, focus: 'Repaso conceptual y formulario de derivadas' },
            { day: 'Día 2', durationMinutes: 45, focus: 'Resolución de problemas prácticos y ejercicios tipo examen' },
            { day: 'Día 3', durationMinutes: 20, focus: 'Simulacro cronometrado y dudas específicas' },
          ],
        },
        createdBy: 'usr-teacher-1',
        createdAt: '2026-10-01T10:00:00.000Z',
        updatedAt: '2026-10-01T10:00:00.000Z',
      },
      {
        id: 'tsk-2',
        subjectId: 'subj-3',
        studentId: 'usr-student-1',
        title: 'Proyecto de Historia - Ensayo Siglo XX',
        description: 'Entrega en PDF con bibliografía en formato APA sobre los movimientos sociales.',
        type: 'project',
        dueDate: '2026-10-15',
        dueTime: '23:59',
        priority: 'media',
        status: 'en_proceso',
        hasReminder: true,
        createdBy: 'usr-teacher-1',
        createdAt: '2026-10-02T12:00:00.000Z',
        updatedAt: '2026-10-02T12:00:00.000Z',
      },
      {
        id: 'tsk-3',
        subjectId: 'subj-2',
        studentId: 'usr-student-1',
        title: 'Tarea de Física - Leyes de Newton y Termodinámica',
        description: 'Problemas del capítulo 4, ejercicios 1 al 12 en cuaderno de trabajo.',
        type: 'task',
        dueDate: '2026-10-10',
        dueTime: '10:00',
        priority: 'alta',
        status: 'pendiente',
        hasReminder: true,
        createdBy: 'usr-teacher-1',
        createdAt: '2026-10-04T09:00:00.000Z',
        updatedAt: '2026-10-04T09:00:00.000Z',
      },
      {
        id: 'tsk-4',
        subjectId: 'subj-4',
        studentId: 'usr-student-1',
        title: 'Reporte de Práctica de Laboratorio 3',
        description: 'Síntesis y destilación de compuestos aromáticos.',
        type: 'task',
        dueDate: '2026-10-08',
        dueTime: '13:00',
        priority: 'media',
        status: 'completada',
        hasReminder: false,
        createdBy: 'usr-teacher-1',
        createdAt: '2026-09-28T09:00:00.000Z',
        updatedAt: '2026-10-07T16:30:00.000Z',
      },
    ];

    const grades: Grade[] = [
      {
        id: 'grd-1',
        subjectId: 'subj-1',
        studentId: 'usr-student-1',
        evaluationName: 'Tarea 1: Límites algebraicos',
        score: 92,
        maxScore: 100,
        percentage: 15,
        feedback: 'Excelente desarrollo analítico.',
        date: '2026-09-15',
      },
      {
        id: 'grd-2',
        subjectId: 'subj-1',
        studentId: 'usr-student-1',
        evaluationName: 'Tarea 2: Continuidad y asíntotas',
        score: 88,
        maxScore: 100,
        percentage: 15,
        feedback: 'Cuidado con los signos al factorizar en el paso 3.',
        date: '2026-09-22',
      },
      {
        id: 'grd-3',
        subjectId: 'subj-1',
        studentId: 'usr-student-1',
        evaluationName: 'Primer Examen Parcial',
        score: 85,
        maxScore: 100,
        percentage: 30,
        feedback: 'Buen desempeño general.',
        date: '2026-09-29',
      },
      {
        id: 'grd-4',
        subjectId: 'subj-2',
        studentId: 'usr-student-1',
        evaluationName: 'Práctica de Cinemática',
        score: 95,
        maxScore: 100,
        percentage: 20,
        feedback: 'Gráficas experimentales muy claras.',
        date: '2026-09-18',
      },
      {
        id: 'grd-5',
        subjectId: 'subj-3',
        studentId: 'usr-student-1',
        evaluationName: 'Control de Lectura 1',
        score: 90,
        maxScore: 100,
        percentage: 20,
        feedback: 'Buen pensamiento crítico y argumentación.',
        date: '2026-09-20',
      },
    ];

    const emotionalRecords: EmotionalRecord[] = [
      {
        id: 'emo-1',
        studentId: 'usr-student-1',
        mood: 'estresado',
        moodScore: 2,
        reasonCategory: 'Exámenes y carga académica',
        note: 'Tengo tres entregas esta semana y siento que el tiempo no me rinde.',
        date: '2026-10-06',
        createdAt: '2026-10-06T18:30:00.000Z',
      },
      {
        id: 'emo-2',
        studentId: 'usr-student-1',
        mood: 'preocupado',
        moodScore: 3,
        reasonCategory: 'Física y Matemáticas',
        note: 'Estudié cálculo pero todavía dudo en las derivadas implícitas.',
        date: '2026-10-07',
        createdAt: '2026-10-07T20:15:00.000Z',
      },
      {
        id: 'emo-3',
        studentId: 'usr-student-1',
        mood: 'bien',
        moodScore: 6,
        reasonCategory: 'Avance de proyectos',
        note: 'Pude terminar el reporte de química a tiempo y me siento más aliviado.',
        date: '2026-10-08',
        createdAt: '2026-10-08T19:40:00.000Z',
      },
    ];

    const wellnessResources: WellnessResource[] = [
      {
        id: 'res-1',
        title: 'Técnica de Respiración 4-7-8',
        category: 'Respiración',
        durationMinutes: 3,
        type: 'ejercicio',
        summary: 'Una técnica comprobada para calmar el sistema nervioso en momentos de ansiedad o tensión.',
        content: 'La respiración 4-7-8 actúa como un sedante natural para el sistema nervioso simpático. Practícala sentado con la espalda recta.',
        steps: [
          'Inhala silenciosamente por la nariz durante 4 segundos.',
          'Retén el aire en los pulmones con calma durante 7 segundos.',
          'Exhala por la boca haciendo un suave sonido durante 8 segundos.',
          'Repite el ciclo 4 veces consecutivas.',
        ],
      },
      {
        id: 'res-2',
        title: 'Método Pomodoro para Tareas Grandes',
        category: 'Organización',
        durationMinutes: 5,
        type: 'tecnica',
        summary: 'Divide actividades abrumadoras en bloques manejables de 25 minutos con descansos intencionales.',
        content: 'La procrastinación suele surgir cuando una tarea se percibe como gigantesca. Al enfocarte en 25 minutos sin distracciones, tu cerebro reduce la resistencia.',
        steps: [
          'Elige una sola tarea prioritaria.',
          'Pon un temporizador de 25 minutos y silencia notificaciones.',
          'Trabaja enfocado hasta que suene el temporizador.',
          'Tómate un descanso absoluto de 5 minutos (estírate, bebe agua).',
          'Cada 4 bloques, realiza un descanso mayor de 20 minutos.',
        ],
      },
      {
        id: 'res-3',
        title: 'Qué hacer 24 horas antes de un examen',
        category: 'Exámenes',
        durationMinutes: 7,
        type: 'guia',
        summary: 'Estrategias para consolidar conocimiento sin desgastarte ni pasar noches sin dormir.',
        content: 'Estudiar toda la madrugada previa a un examen disminuye tu rendimiento cognitivo hasta un 40%. La memoria se consolida durante el sueño REM.',
        steps: [
          'Detén el estudio pesado al menos 3 horas antes de acostarte.',
          'Prepara con anticipación tus materiales, identificación y calculadora.',
          'Realiza un repaso ligero de conceptos clave o fichas mnemotécnicas.',
          'Duerme un mínimo de 7 horas consecutivas.',
          'Desayuna alimentos balanceados con bajo índice glucémico.',
        ],
      },
      {
        id: 'res-4',
        title: 'Anclaje Sensorial 5-4-3-2-1 para Ansiedad',
        category: 'Ansiedad',
        durationMinutes: 4,
        type: 'ejercicio',
        summary: 'Regresa al momento presente cuando los pensamientos catastróficos tomen el control.',
        content: 'El anclaje sensorial redirige la atención de la corteza prefrontal hacia los estímulos físicos inmediatos.',
        steps: [
          'Nombra 5 cosas que puedas VER a tu alrededor.',
          'Identifica 4 cosas que puedas TOCAR o sentir en tu cuerpo.',
          'Detecta 3 sonidos que puedas OÍR en el entorno.',
          'Identifica 2 olores que puedas PERCIBIR.',
          'Identifica 1 sabor o sensación en tu boca.',
        ],
      },
      {
        id: 'res-5',
        title: 'Higiene del Sueño para Rendimiento Académico',
        category: 'Descanso',
        durationMinutes: 6,
        type: 'guia',
        summary: 'Cómo programar tus hábitos nocturnos para despertar despejado y retener mejor.',
        content: 'La luz azul de pantallas inhibe la melatonina. Aprende a desconectar para dormir profundamente.',
        steps: [
          'Evita cafeína después de las 4:00 PM.',
          'Activa el filtro de luz cálida en dispositivos móviles.',
          'Deja el teléfono lejos de la cabecera 30 minutos antes de dormir.',
          'Mantén una temperatura fresca en tu habitación.',
        ],
      },
      {
        id: 'res-6',
        title: 'Manejo del Tiempo: Matriz Eisenhower',
        category: 'Manejo del tiempo',
        durationMinutes: 8,
        type: 'tecnica',
        summary: 'Aprende a diferenciar lo urgente de lo verdaderamente importante.',
        content: 'No todo lo que grita en tu agenda requiere tu energía inmediata. Clasifica tus entregas.',
        steps: [
          'Urgente e Importante: Hazlo de inmediato (exámenes cercanos, entregas de hoy).',
          'Importante pero No Urgente: Agenda bloques con anticipación (proyectos a largo plazo).',
          'Urgente pero No Importante: Simplifica o automatiza.',
          'Ni Urgente ni Importante: Elimina o reduce (redes sociales excesivas).',
        ],
      },
    ];

    const counselingRequests: CounselingRequest[] = [
      {
        id: 'csl-1',
        studentId: 'usr-student-1',
        psychologistId: 'usr-psych-1',
        type: 'orientacion_psicologica',
        subject: 'Manejo de ansiedad ante exámenes de cálculo',
        reason: 'Siento bloqueos mentales cuando inicio los exámenes parciales a pesar de haber estudiado.',
        preferredDate: '2026-10-14',
        preferredTime: '11:00',
        modality: 'presencial',
        status: 'confirmada',
        scheduledDate: '2026-10-14',
        scheduledTime: '11:00',
        notes: 'Confirmada cita presencial en Cubículo de Orientación 3.',
        createdAt: '2026-10-05T11:20:00.000Z',
      },
      {
        id: 'csl-2',
        studentId: 'usr-student-1',
        teacherId: 'usr-teacher-1',
        subjectId: 'subj-2',
        groupId: 'grp-3a',
        type: 'asesoria_academica',
        subject: 'Física General',
        reason: 'Necesito apoyo en la resolución de problemas para la práctica de laboratorio.',
        preferredDate: '2026-10-16',
        preferredTime: '14:00',
        modality: 'virtual',
        status: 'pendiente',
        createdAt: '2026-10-08T15:00:00.000Z',
      },
    ];

    const groupMessages: GroupMessage[] = [
      {
        id: 'msg-1',
        subjectId: 'subj-1',
        senderId: 'usr-teacher-1',
        senderName: 'Prof. Roberto Silva',
        senderRole: 'teacher',
        content: 'Jóvenes, recuerden que la guía de ejercicios para el examen ya está disponible en biblioteca y se resolverán dudas en la clase del miércoles.',
        createdAt: '2026-10-07T09:15:00.000Z',
      },
      {
        id: 'msg-2',
        subjectId: 'subj-1',
        senderId: 'usr-student-1',
        senderName: 'Carlos Mendoza',
        senderRole: 'student',
        content: 'Profesor, ¿podríamos llevar formulario impreso propio o se proporcionará en el examen?',
        createdAt: '2026-10-07T09:40:00.000Z',
      },
      {
        id: 'msg-3',
        subjectId: 'subj-1',
        senderId: 'usr-teacher-1',
        senderName: 'Prof. Roberto Silva',
        senderRole: 'teacher',
        content: 'Se proporcionará el formulario oficial institucional en la primera hoja del examen.',
        createdAt: '2026-10-07T10:05:00.000Z',
      },
    ];

    const announcements: Announcement[] = [
      {
        id: 'anc-1',
        title: 'Semana de Bienestar Estudiantil y Talleres Anti-Estrés',
        content: 'Del 20 al 24 de octubre tendremos charlas de gestión emocional, meditación guiada y asesorías académicas abiertas en el auditorio central.',
        authorId: 'usr-admin-1',
        authorName: 'Dra. Elena Ramos (Dirección)',
        targetRole: 'all',
        isOfficial: true,
        createdAt: '2026-10-02T08:00:00.000Z',
      },
      {
        id: 'anc-2',
        title: 'Aviso Importante: Fecha límite de entrega de proyectos parciales',
        content: 'Se recuerda a todos los docentes y alumnos que el cierre de calificaciones del primer corte es el 25 de octubre.',
        authorId: 'usr-admin-1',
        authorName: 'Dra. Elena Ramos',
        targetRole: 'all',
        isOfficial: true,
        createdAt: '2026-10-05T09:30:00.000Z',
      },
    ];

    const evaluations: AnonymousEvaluation[] = [
      {
        id: 'eval-1',
        subjectId: 'subj-1',
        teacherId: 'usr-teacher-1',
        clarity: 88,
        organization: 90,
        communication: 86,
        treatment: 92,
        overall: 89,
        comment: 'Explica con mucha paciencia los pasos del cálculo diferencial y resuelve dudas de forma respetuosa.',
        createdAt: '2026-09-30T14:00:00.000Z',
      },
      {
        id: 'eval-2',
        subjectId: 'subj-2',
        teacherId: 'usr-teacher-1',
        clarity: 82,
        organization: 84,
        communication: 85,
        treatment: 88,
        overall: 85,
        comment: 'Las prácticas de laboratorio ayudan mucho a entender los conceptos.',
        createdAt: '2026-09-29T11:20:00.000Z',
      },
    ];

    const notifications: NotificationItem[] = [
      {
        id: 'notif-1',
        userId: 'usr-student-1',
        title: 'Examen próximo',
        message: 'Tu examen de Matemáticas III es en 3 días (12 de octubre). ¿Deseas activar tu plan de estudio?',
        type: 'warning',
        read: false,
        createdAt: '2026-10-09T06:00:00.000Z',
      },
      {
        id: 'notif-2',
        userId: 'usr-student-1',
        title: 'Cita de Orientación Confirmada',
        message: 'La Lic. Mariana Gómez confirmó tu cita para el 14 de octubre a las 11:00 AM.',
        type: 'success',
        read: false,
        createdAt: '2026-10-05T12:00:00.000Z',
      },
      {
        id: 'notif-3',
        userId: 'usr-student-1',
        title: 'Nuevo Aviso Institucional',
        message: 'Se publicó: Semana de Bienestar Estudiantil y Talleres Anti-Estrés.',
        type: 'info',
        read: true,
        createdAt: '2026-10-02T08:05:00.000Z',
      },
    ];

    const auditLogs: AuditLog[] = [
      {
        id: 'aud-1',
        userId: 'usr-admin-1',
        userName: 'Dra. Elena Ramos',
        role: 'admin',
        action: 'INICIO_SESION',
        details: 'Inicio de sesión exitoso en panel administrativo.',
        ipAddress: '192.168.1.10',
        createdAt: '2026-10-09T05:30:00.000Z',
      },
      {
        id: 'aud-2',
        userId: 'usr-teacher-1',
        userName: 'Prof. Roberto Silva',
        role: 'teacher',
        action: 'PUBLICACION_CALIFICACION',
        details: 'Registro de calificaciones para Materia MAT-301.',
        ipAddress: '192.168.1.25',
        createdAt: '2026-10-07T12:10:00.000Z',
      },
    ];

    return {
      institutions: [
        {
          id: institutionId,
          name: 'Instituto Tecnológico Demo',
          code: 'ITD-MEX-2026',
          supportPhone: '+52 800 999 4357',
          supportEmail: 'bienestar@institutodemo.edu',
          emergencyContact: 'Servicio Médico y Orientación Psicológica Ext. 104 / 911',
        },
      ],
      users,
      students,
      teachers,
      psychologists,
      groups,
      subjects,
      tasks,
      grades,
      emotionalRecords,
      wellnessResources,
      counselingRequests,
      crisisAlerts: [],
      groupMessages,
      announcements,
      evaluations,
      auditLogs,
      notifications,
    };
  }
}

export const db = new Database();
export { hashPassword };
