export type Role = 'student' | 'teacher' | 'psychologist' | 'admin' | 'general';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  institutionId: string;
  phone?: string;
  active?: boolean;
  createdAt?: string;
}

export interface Task {
  id: string;
  subjectId: string;
  subjectName?: string;
  subjectColor?: string;
  studentId?: string;
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
  createdBy?: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  groupId: string;
  teacherId: string;
  teacherName?: string;
  schedule: string;
  classroom: string;
  color: string;
  tasksCount?: number;
  averageGrade?: string;
  grades?: Grade[];
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

export type MoodType = 'muy_bien' | 'bien' | 'normal' | 'preocupado' | 'estresado' | 'triste' | 'enojado';

export interface EmotionalRecord {
  id: string;
  studentId: string;
  mood: MoodType;
  moodScore: number;
  reasonCategory?: string;
  note?: string;
  date: string;
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
  studentName?: string;
  studentEmail?: string;
  studentPhone?: string;
  studentMatricula?: string;
  studentAvatar?: string;
  studentGroupName?: string;
  groupName?: string;
  teacherId?: string;
  teacherName?: string;
  teacherEmail?: string;
  psychologistId?: string;
  psychologistName?: string;
  subjectId?: string;
  subjectName?: string;
  subjectCode?: string;
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
  targetRole: string;
  isOfficial: boolean;
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
