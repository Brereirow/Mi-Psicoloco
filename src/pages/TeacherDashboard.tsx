import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  CheckSquare,
  Award,
  Plus,
  BookOpen,
  Calendar,
  Lock,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Edit2,
  Trash2,
  UserCheck,
  ChevronRight,
  AlertCircle,
  FileText,
  CalendarCheck,
  MapPin,
  Video,
  RotateCcw,
  X,
  ExternalLink,
  Send,
  AlertTriangle,
  RefreshCw,
  Mail,
  Phone,
} from 'lucide-react';

interface TeacherDashboardProps {
  currentTab?: string;
  onNavigate?: (tab: string) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ currentTab = 'teacher-dashboard', onNavigate }) => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<string>('overview');

  // Data states
  const [dashboardData, setDashboardData] = useState<any | null>(null);
  const [groups, setGroups] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [tutoringRequests, setTutoringRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Modals - Activity & Grade
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState<any | null>(null);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [editingGrade, setEditingGrade] = useState<any | null>(null);

  // Group detail view modal/sheet
  const [selectedGroupDetails, setSelectedGroupDetails] = useState<any | null>(null);

  // Tutoring action modals
  const [acceptModalRequest, setAcceptModalRequest] = useState<any | null>(null);
  const [acceptDate, setAcceptDate] = useState('');
  const [acceptTime, setAcceptTime] = useState('');
  const [acceptMeetingLink, setAcceptMeetingLink] = useState('');
  const [acceptNotes, setAcceptNotes] = useState('');

  const [rejectModalRequest, setRejectModalRequest] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const [rescheduleModalRequest, setRescheduleModalRequest] = useState<any | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleNotes, setRescheduleNotes] = useState('');

  const [completeModalRequest, setCompleteModalRequest] = useState<any | null>(null);
  const [completeNotes, setCompleteNotes] = useState('');

  const [cancelModalRequest, setCancelModalRequest] = useState<any | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const [detailsModalRequest, setDetailsModalRequest] = useState<any | null>(null);
  const [actionSubmitting, setActionSubmitting] = useState(false);

  // Filter states
  const [studentSearch, setStudentSearch] = useState('');
  const [studentGroupFilter, setStudentGroupFilter] = useState('all');
  const [activitySubjectFilter, setActivitySubjectFilter] = useState('all');
  const [activityTypeFilter, setActivityTypeFilter] = useState('all');
  const [selectedGradeSubjectId, setSelectedGradeSubjectId] = useState('subj-1');
  const [gradesData, setGradesData] = useState<any | null>(null);

  // Tutoring filter states
  const [tutoringSearch, setTutoringSearch] = useState('');
  const [tutoringStatusFilter, setTutoringStatusFilter] = useState('all');
  const [tutoringSubjectFilter, setTutoringSubjectFilter] = useState('all');
  const [tutoringDateFilter, setTutoringDateFilter] = useState('');

  // Form states - Activity
  const [activityTitle, setActivityTitle] = useState('');
  const [activityDescription, setActivityDescription] = useState('');
  const [activitySubjectId, setActivitySubjectId] = useState('subj-1');
  const [activityType, setActivityType] = useState<'task' | 'project' | 'exam'>('task');
  const [activityDueDate, setActivityDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [activityDueTime, setActivityDueTime] = useState('23:59');
  const [activityPriority, setActivityPriority] = useState<'alta' | 'media' | 'baja'>('media');

  // Form states - Grade
  const [gradeStudentId, setGradeStudentId] = useState('');
  const [gradeEvalName, setGradeEvalName] = useState('');
  const [gradeScore, setGradeScore] = useState(90);
  const [gradeMaxScore, setGradeMaxScore] = useState(100);
  const [gradeFeedback, setGradeFeedback] = useState('');

  // Sync with currentTab prop from Sidebar
  useEffect(() => {
    if (currentTab === 'teacher-groups') {
      setActiveSection('groups');
    } else if (currentTab === 'teacher-students') {
      setActiveSection('students');
    } else if (currentTab === 'teacher-activities') {
      setActiveSection('activities');
    } else if (currentTab === 'teacher-grades') {
      setActiveSection('grades');
    } else if (currentTab === 'teacher-tutoring') {
      setActiveSection('tutoring');
      loadTutoringRequests();
    } else {
      setActiveSection('overview');
    }
  }, [currentTab]);

  const loadTutoringRequests = async () => {
    try {
      const res = await api.getTeacherCounselingRequests();
      setTutoringRequests(res.requests || []);
    } catch (err: any) {
      console.error('Error loading tutoring requests:', err);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [dashRes, groupsRes, studentsRes, actRes, tutorRes] = await Promise.all([
        api.getTeacherDashboard(),
        api.getTeacherGroups(),
        api.getTeacherStudents(),
        api.getTeacherActivities(),
        api.getTeacherCounselingRequests().catch(() => ({ requests: [] })),
      ]);
      setDashboardData(dashRes);
      setGroups(groupsRes.groups || []);
      setStudents(studentsRes.students || []);
      setActivities(actRes.activities || []);
      setTutoringRequests(tutorRes.requests || []);

      if (dashRes.subjects && dashRes.subjects.length > 0) {
        setActivitySubjectId(dashRes.subjects[0].id);
        setSelectedGradeSubjectId(dashRes.subjects[0].id);
        await loadGrades(dashRes.subjects[0].id);
      }
      if (studentsRes.students && studentsRes.students.length > 0) {
        setGradeStudentId(studentsRes.students[0].userId);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error al cargar datos docentes');
    } finally {
      setLoading(false);
    }
  };

  const loadGrades = async (subjectId: string) => {
    try {
      const res = await api.getTeacherGrades(subjectId);
      setGradesData(res);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const showNotification = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(''), 3000);
  };

  // Activity Handlers
  const handleSaveActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityTitle.trim()) return;

    try {
      if (editingActivity) {
        await api.updateTeacherActivity(editingActivity.id, {
          title: activityTitle,
          description: activityDescription,
          subjectId: activitySubjectId,
          type: activityType,
          dueDate: activityDueDate,
          dueTime: activityDueTime,
          priority: activityPriority,
        });
        showNotification('Actividad actualizada correctamente.');
      } else {
        await api.createTeacherActivity({
          title: activityTitle,
          description: activityDescription,
          subjectId: activitySubjectId,
          type: activityType,
          dueDate: activityDueDate,
          dueTime: activityDueTime,
          priority: activityPriority,
        });
        showNotification('Nueva actividad publicada a los alumnos.');
      }
      setShowCreateModal(false);
      setEditingActivity(null);
      setActivityTitle('');
      setActivityDescription('');
      const actRes = await api.getTeacherActivities();
      setActivities(actRes.activities || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al guardar la actividad');
    }
  };

  const handleEditActivityClick = (act: any) => {
    setEditingActivity(act);
    setActivityTitle(act.title);
    setActivityDescription(act.description);
    setActivitySubjectId(act.subjectId);
    setActivityType(act.type);
    setActivityDueDate(act.dueDate);
    setActivityDueTime(act.dueTime);
    setActivityPriority(act.priority);
    setShowCreateModal(true);
  };

  const handleDeleteActivity = async (id: string) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta actividad?')) return;
    try {
      await api.deleteTeacherActivity(id);
      showNotification('Actividad eliminada.');
      const actRes = await api.getTeacherActivities();
      setActivities(actRes.activities || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al eliminar actividad');
    }
  };

  // Grade Handlers
  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradeEvalName.trim()) return;

    try {
      if (editingGrade) {
        await api.updateTeacherGrade(editingGrade.id, {
          evaluationName: gradeEvalName,
          score: gradeScore,
          maxScore: gradeMaxScore,
          feedback: gradeFeedback,
        });
        showNotification('Calificación actualizada.');
      } else {
        await api.submitTeacherGrade({
          subjectId: selectedGradeSubjectId,
          studentId: gradeStudentId,
          evaluationName: gradeEvalName,
          score: gradeScore,
          maxScore: gradeMaxScore,
          feedback: gradeFeedback,
        });
        showNotification('Calificación registrada y notificada al estudiante.');
      }
      setShowGradeModal(false);
      setEditingGrade(null);
      setGradeEvalName('');
      setGradeFeedback('');
      loadGrades(selectedGradeSubjectId);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al guardar calificación');
    }
  };

  const handleEditGradeClick = (grade: any, studentId: string) => {
    setEditingGrade(grade);
    setGradeStudentId(studentId);
    setGradeEvalName(grade.evaluationName);
    setGradeScore(grade.score);
    setGradeMaxScore(grade.maxScore);
    setGradeFeedback(grade.feedback || '');
    setShowGradeModal(true);
  };

  const handleDeleteGrade = async (gradeId: string) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta calificación?')) return;
    try {
      await api.deleteTeacherGrade(gradeId);
      showNotification('Calificación eliminada.');
      loadGrades(selectedGradeSubjectId);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al eliminar calificación');
    }
  };

  // Tutoring Action Handlers
  const handleOpenAcceptModal = (reqItem: any) => {
    setAcceptModalRequest(reqItem);
    setAcceptDate(reqItem.preferredDate || new Date().toISOString().slice(0, 10));
    setAcceptTime(reqItem.preferredTime || '12:00');
    setAcceptMeetingLink(reqItem.meetingLink || '');
    setAcceptNotes(reqItem.notes || 'Asesoría confirmada por el docente.');
  };

  const handleConfirmAccept = async () => {
    if (!acceptModalRequest) return;
    setActionSubmitting(true);
    try {
      await api.updateTeacherCounselingRequest(acceptModalRequest.id, {
        action: 'accept',
        scheduledDate: acceptDate,
        scheduledTime: acceptTime,
        meetingLink: acceptMeetingLink,
        notes: acceptNotes,
      });
      showNotification('Asesoría aceptada con éxito. El estudiante ha sido notificado.');
      setAcceptModalRequest(null);
      await loadTutoringRequests();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al aceptar asesoría');
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleOpenRejectModal = (reqItem: any) => {
    setRejectModalRequest(reqItem);
    setRejectReason('');
  };

  const handleConfirmReject = async () => {
    if (!rejectModalRequest) return;
    if (!rejectReason.trim()) {
      setErrorMsg('Debes especificar un motivo para rechazar la solicitud.');
      return;
    }
    setActionSubmitting(true);
    try {
      await api.updateTeacherCounselingRequest(rejectModalRequest.id, {
        action: 'reject',
        rejectionReason: rejectReason.trim(),
      });
      showNotification('Solicitud rechazada. Se notificó el motivo al estudiante.');
      setRejectModalRequest(null);
      setRejectReason('');
      await loadTutoringRequests();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al rechazar asesoría');
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleOpenRescheduleModal = (reqItem: any) => {
    setRescheduleModalRequest(reqItem);
    setRescheduleDate(reqItem.preferredDate || new Date().toISOString().slice(0, 10));
    setRescheduleTime(reqItem.preferredTime || '14:00');
    setRescheduleNotes('');
  };

  const handleConfirmReschedule = async () => {
    if (!rescheduleModalRequest) return;
    if (!rescheduleDate || !rescheduleTime) {
      setErrorMsg('Debes especificar la nueva fecha y hora propuesta.');
      return;
    }
    setActionSubmitting(true);
    try {
      await api.updateTeacherCounselingRequest(rescheduleModalRequest.id, {
        action: 'reschedule',
        proposedDate: rescheduleDate,
        proposedTime: rescheduleTime,
        notes: rescheduleNotes.trim() || 'El profesor propone una nueva fecha u hora para la asesoría.',
      });
      showNotification('Propuesta de nueva fecha enviada al estudiante.');
      setRescheduleModalRequest(null);
      await loadTutoringRequests();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al proponer nueva fecha');
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleOpenCompleteModal = (reqItem: any) => {
    setCompleteModalRequest(reqItem);
    setCompleteNotes(reqItem.notes || '');
  };

  const handleConfirmComplete = async () => {
    if (!completeModalRequest) return;
    setActionSubmitting(true);
    try {
      await api.updateTeacherCounselingRequest(completeModalRequest.id, {
        action: 'complete',
        notes: completeNotes.trim(),
      });
      showNotification('Asesoría marcada como completada con éxito.');
      setCompleteModalRequest(null);
      await loadTutoringRequests();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al completar asesoría');
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleOpenCancelModal = (reqItem: any) => {
    setCancelModalRequest(reqItem);
    setCancelReason('');
  };

  const handleConfirmCancel = async () => {
    if (!cancelModalRequest) return;
    if (!cancelReason.trim()) {
      setErrorMsg('Debes indicar el motivo de cancelación.');
      return;
    }
    setActionSubmitting(true);
    try {
      await api.updateTeacherCounselingRequest(cancelModalRequest.id, {
        action: 'cancel',
        cancellationReason: cancelReason.trim(),
      });
      showNotification('Asesoría cancelada. Se notificó al estudiante.');
      setCancelModalRequest(null);
      setCancelReason('');
      await loadTutoringRequests();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al cancelar asesoría');
    } finally {
      setActionSubmitting(false);
    }
  };

  // Filter students
  const filteredStudents = students.filter((s) => {
    if (studentGroupFilter !== 'all' && s.groupId !== studentGroupFilter) return false;
    if (studentSearch) {
      const q = studentSearch.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.studentIdNumber.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Filter activities
  const filteredActivities = activities.filter((act) => {
    if (activitySubjectFilter !== 'all' && act.subjectId !== activitySubjectFilter) return false;
    if (activityTypeFilter !== 'all' && act.type !== activityTypeFilter) return false;
    return true;
  });

  // Filter tutoring requests
  const filteredTutoringRequests = tutoringRequests.filter((r) => {
    if (tutoringStatusFilter !== 'all') {
      if (tutoringStatusFilter === 'aceptada') {
        if (r.status !== 'aceptada' && r.status !== 'confirmada') return false;
      } else if (r.status !== tutoringStatusFilter) {
        return false;
      }
    }
    if (tutoringSubjectFilter !== 'all') {
      if (r.subjectId !== tutoringSubjectFilter && r.subject !== tutoringSubjectFilter) {
        return false;
      }
    }
    if (tutoringDateFilter) {
      const targetDate = r.scheduledDate || r.preferredDate || '';
      if (!targetDate.startsWith(tutoringDateFilter)) {
        return false;
      }
    }
    if (tutoringSearch) {
      const q = tutoringSearch.toLowerCase();
      const matchName = (r.studentName || '').toLowerCase().includes(q);
      const matchEmail = (r.studentEmail || '').toLowerCase().includes(q);
      const matchMatricula = (r.studentMatricula || '').toLowerCase().includes(q);
      const matchGroup = (r.groupName || '').toLowerCase().includes(q);
      const matchSubject = (r.subjectName || r.subject || '').toLowerCase().includes(q);
      const matchReason = (r.reason || '').toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchMatricula && !matchGroup && !matchSubject && !matchReason) {
        return false;
      }
    }
    return true;
  });

  const pendingTutoringCount = tutoringRequests.filter((r) => r.status === 'pendiente').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-800 rounded-3xl p-6 sm:p-8 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 bg-white/20 rounded-md">
            Panel Docente • Ciclo 2026-2027
          </span>
          <h1 className="text-2xl font-extrabold mt-2">Profesor {user?.name}</h1>
          <p className="text-xs text-blue-100 mt-1 max-w-xl">
            Gestiona tus grupos, alumnos inscritos, asesorías solicitadas, diseño de tareas y calificaciones.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setActiveSection('tutoring');
              loadTutoringRequests();
              if (onNavigate) onNavigate('teacher-tutoring');
            }}
            className="px-4 py-2.5 bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Asesorías ({pendingTutoringCount} pendientes)</span>
          </button>

          <button
            onClick={() => {
              setEditingActivity(null);
              setActivityTitle('');
              setActivityDescription('');
              setShowCreateModal(true);
            }}
            className="px-4 py-2.5 bg-white text-blue-800 hover:bg-blue-50 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Actividad</span>
          </button>

          <button
            onClick={() => {
              setEditingGrade(null);
              setGradeEvalName('');
              setGradeFeedback('');
              setShowGradeModal(true);
            }}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl border border-blue-400 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Award className="w-4 h-4" />
            <span>Registrar Calificación</span>
          </button>
        </div>
      </div>

      {/* Notifications / Alerts */}
      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess('')} className="text-emerald-700 hover:text-emerald-900 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} className="text-rose-700 hover:text-rose-900 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Privacy Notice */}
      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-4 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-teal-600 shrink-0" />
          <span>
            <strong>Privacidad Estudiantil Protegida:</strong> Por políticas institucionales, los docentes tienen acceso a información académica y grupal. Los diarios emocionales privados de los alumnos permanecen confidenciales.
          </span>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md shrink-0">
          Activo
        </span>
      </div>

      {/* Internal Navigation Sub-tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        {[
          { id: 'overview', label: 'Dashboard General', icon: BookOpen },
          { id: 'groups', label: `Mis Grupos (${groups.length})`, icon: Users },
          { id: 'students', label: `Mis Alumnos (${students.length})`, icon: UserCheck },
          { id: 'activities', label: `Crear y Gestionar Actividades (${activities.length})`, icon: CheckSquare },
          { id: 'grades', label: 'Calificaciones y Evaluaciones', icon: Award },
          {
            id: 'tutoring',
            label: `Asesorías Solicitadas (${pendingTutoringCount > 0 ? `${pendingTutoringCount} pendientes` : tutoringRequests.length})`,
            icon: CalendarCheck,
            highlight: pendingTutoringCount > 0,
          },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveSection(tab.id);
                if (tab.id === 'tutoring') loadTutoringRequests();
                if (onNavigate) {
                  if (tab.id === 'groups') onNavigate('teacher-groups');
                  else if (tab.id === 'students') onNavigate('teacher-students');
                  else if (tab.id === 'activities') onNavigate('teacher-activities');
                  else if (tab.id === 'grades') onNavigate('teacher-grades');
                  else if (tab.id === 'tutoring') onNavigate('teacher-tutoring');
                  else onNavigate('teacher-dashboard');
                }
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer relative ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : tab.highlight
                  ? 'bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.highlight && !isActive && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              )}
            </button>
          );
        })}
      </div>

      {/* SECTION: OVERVIEW */}
      {activeSection === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-400 font-bold">Materias asignadas</span>
              <div className="text-2xl font-black text-slate-800 mt-1">{dashboardData?.stats?.totalSubjects || 2}</div>
              <div className="text-[11px] text-blue-600 font-medium mt-1">Cálculo & Física</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-400 font-bold">Grupos a cargo</span>
              <div className="text-2xl font-black text-slate-800 mt-1">{groups.length}</div>
              <div className="text-[11px] text-slate-500 mt-1">Ciclo 2026-2027</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-400 font-bold">Total de Alumnos</span>
              <div className="text-2xl font-black text-slate-800 mt-1">{students.length}</div>
              <div className="text-[11px] text-slate-500 mt-1">Matrícula vigente</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-400 font-bold">Actividades Activas</span>
              <div className="text-2xl font-black text-blue-700 mt-1">{activities.length}</div>
              <div className="text-[11px] text-slate-500 mt-1">Tareas y exámenes</div>
            </div>

            <div
              onClick={() => {
                setActiveSection('tutoring');
                loadTutoringRequests();
                if (onNavigate) onNavigate('teacher-tutoring');
              }}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs cursor-pointer hover:border-blue-400 hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-bold">Asesorías</span>
                {pendingTutoringCount > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 animate-pulse">
                    {pendingTutoringCount} pendientes
                  </span>
                )}
              </div>
              <div className="text-2xl font-black text-teal-700 mt-1">{tutoringRequests.length}</div>
              <div className="text-[11px] text-teal-600 font-medium mt-1">Ver solicitudes →</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span>Mis Materias y Horarios</span>
                </h3>
                <span className="text-xs text-slate-400">Semestre 2026-2027</span>
              </div>

              <div className="space-y-3">
                {dashboardData?.subjects?.map((s: any) => (
                  <div key={s.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs text-slate-800">{s.name}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{s.schedule} • {s.classroom}</div>
                    </div>
                    <span className="text-xs font-mono font-bold px-2 py-1 bg-white border border-slate-200 rounded-md">
                      {s.code}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-blue-600" />
                  <span>Actividades Recientes</span>
                </h3>
                <button
                  onClick={() => setActiveSection('activities')}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700"
                >
                  Ver todas →
                </button>
              </div>

              <div className="space-y-2.5">
                {activities.slice(0, 4).map((t: any) => (
                  <div key={t.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-800">{t.title}</div>
                      <div className="text-[11px] text-slate-500">Entrega: {t.dueDate} a las {t.dueTime}</div>
                    </div>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                      {t.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION: MIS GRUPOS */}
      {activeSection === 'groups' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h2 className="text-base font-bold text-slate-800">Grupos Asignados</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Consulta los grupos a tu cargo, turnos y cantidad de alumnos matriculados.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {groups.map((grp) => (
              <div key={grp.id} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md">
                      Turno: {grp.shift}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">Ciclo {grp.academicYear}</span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-800">{grp.name}</h3>

                  <div className="mt-4 p-4 bg-slate-50 rounded-xl space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Alumnos inscritos:</span>
                      <strong className="text-slate-800">{grp.studentsCount || grp.students?.length || 0} estudiantes</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tus materias en este grupo:</span>
                      <strong className="text-blue-700">{grp.subjects?.length || 1} materia(s)</strong>
                    </div>
                  </div>

                  {grp.subjects && grp.subjects.length > 0 && (
                    <div className="mt-4">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                        Materias impartidas en este grupo:
                      </span>
                      <div className="space-y-1.5">
                        {grp.subjects.map((s: any) => (
                          <div key={s.id} className="p-2 bg-blue-50/60 rounded-lg text-xs flex justify-between items-center text-blue-900">
                            <span className="font-bold">{s.name}</span>
                            <span className="text-[11px] text-blue-700">{s.schedule}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => setSelectedGroupDetails(grp)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <span>Ver lista de alumnos del grupo</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      setStudentGroupFilter(grp.id);
                      setActiveSection('students');
                    }}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors"
                  >
                    Ir a Alumnos
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION: MIS ALUMNOS */}
      {activeSection === 'students' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-800">Alumnos de mis Grupos</h2>
              <p className="text-xs text-slate-500">
                Lista de estudiantes con matrícula, grupo asignado y promedio en tus asignaturas.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-60">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Buscar por nombre o matrícula..."
                  className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <select
                value={studentGroupFilter}
                onChange={(e) => setStudentGroupFilter(e.target.value)}
                className="text-xs p-2 rounded-xl border border-slate-300 font-semibold"
              >
                <option value="all">Todos los grupos</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredStudents.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No se encontraron alumnos con los filtros seleccionados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider text-[10px] font-bold border-y">
                  <tr>
                    <th className="py-3 px-4">Estudiante</th>
                    <th className="py-3 px-4">Matrícula</th>
                    <th className="py-3 px-4">Grupo</th>
                    <th className="py-3 px-4">Semestre</th>
                    <th className="py-3 px-4">Promedio en tu materia</th>
                    <th className="py-3 px-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((std) => (
                    <tr key={std.userId} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">{std.name}</div>
                        <div className="text-[11px] text-slate-400">{std.email}</div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">{std.studentIdNumber}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                          {std.groupName}
                        </span>
                      </td>
                      <td className="py-3 px-4">{std.currentSemester}°</td>
                      <td className="py-3 px-4 font-bold text-blue-700">{std.average}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setGradeStudentId(std.userId);
                            setEditingGrade(null);
                            setGradeEvalName('');
                            setGradeFeedback('');
                            setShowGradeModal(true);
                          }}
                          className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] rounded-lg transition-colors"
                        >
                          Calificar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SECTION: CREAR ACTIVIDADES */}
      {activeSection === 'activities' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-800">Actividades, Tareas y Exámenes</h2>
              <p className="text-xs text-slate-500">
                Crea nuevas asignaciones, edita plazos de entrega o elimina actividades programadas.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={activitySubjectFilter}
                onChange={(e) => setActivitySubjectFilter(e.target.value)}
                className="text-xs p-2 rounded-xl border border-slate-300 font-semibold"
              >
                <option value="all">Todas las materias</option>
                {dashboardData?.subjects?.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>

              <select
                value={activityTypeFilter}
                onChange={(e) => setActivityTypeFilter(e.target.value)}
                className="text-xs p-2 rounded-xl border border-slate-300 font-semibold"
              >
                <option value="all">Todos los tipos</option>
                <option value="task">Tareas</option>
                <option value="exam">Exámenes</option>
                <option value="project">Proyectos</option>
              </select>

              <button
                onClick={() => {
                  setEditingActivity(null);
                  setActivityTitle('');
                  setActivityDescription('');
                  setShowCreateModal(true);
                }}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Nueva Actividad</span>
              </button>
            </div>
          </div>

          {filteredActivities.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No tienes actividades registradas en esta vista.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredActivities.map((act) => (
                <div key={act.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                        {act.type}
                      </span>
                      <span className="text-xs text-slate-400 font-semibold">{act.subjectName}</span>
                    </div>

                    <h4 className="font-bold text-sm text-slate-800">{act.title}</h4>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">{act.description}</p>

                    <div className="mt-3 pt-3 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Entrega: <strong>{act.dueDate}</strong> a las <strong>{act.dueTime}</strong>
                      </span>
                      <span className="capitalize font-semibold text-slate-700">Prioridad {act.priority}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleEditActivityClick(act)}
                      className="p-1.5 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>
                    <button
                      onClick={() => handleDeleteActivity(act.id)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION: CALIFICACIONES */}
      {activeSection === 'grades' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-800">Registro y Control de Calificaciones</h2>
              <p className="text-xs text-slate-500">
                Selecciona la materia para consultar y asentar evaluaciones de los estudiantes.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Materia:</span>
              <select
                value={selectedGradeSubjectId}
                onChange={(e) => {
                  setSelectedGradeSubjectId(e.target.value);
                  loadGrades(e.target.value);
                }}
                className="text-xs p-2 rounded-xl border border-slate-300 font-bold text-slate-800"
              >
                {dashboardData?.subjects?.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>

              <button
                onClick={() => {
                  setEditingGrade(null);
                  setGradeEvalName('');
                  setGradeFeedback('');
                  setShowGradeModal(true);
                }}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Nueva Nota</span>
              </button>
            </div>
          </div>

          {/* Grades Table */}
          {gradesData?.students?.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No hay estudiantes inscritos en esta materia.
            </div>
          ) : (
            <div className="space-y-4">
              {gradesData?.students?.map((stdItem: any) => (
                <div key={stdItem.userId} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-800">{stdItem.name}</span>
                      <span className="text-xs font-mono text-slate-500">({stdItem.studentIdNumber})</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400 mr-2">Promedio en materia:</span>
                      <strong className="text-sm font-black text-blue-700">{stdItem.average}</strong>
                    </div>
                  </div>

                  {stdItem.grades && stdItem.grades.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {stdItem.grades.map((grd: any) => (
                        <div key={grd.id} className="p-3 bg-white rounded-xl border border-slate-200 text-xs flex justify-between items-start">
                          <div>
                            <div className="font-bold text-slate-800">{grd.evaluationName}</div>
                            <div className="text-base font-black text-blue-700 mt-0.5">
                              {grd.score} <span className="text-slate-400 text-xs font-normal">/ {grd.maxScore}</span>
                            </div>
                            {grd.feedback && (
                              <p className="text-[11px] text-slate-500 mt-1 italic">"{grd.feedback}"</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleEditGradeClick(grd, stdItem.userId)}
                              className="p-1 text-slate-400 hover:text-blue-600 rounded-sm"
                              title="Editar nota"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteGrade(grd.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded-sm"
                              title="Eliminar nota"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 italic py-1">
                      Sin evaluaciones asentadas para este alumno.
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION: ASESORÍAS SOLICITADAS */}
      {activeSection === 'tutoring' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-teal-600" />
                <h2 className="text-lg font-bold text-slate-800">Asesorías Académicas Solicitadas</h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Consulta las solicitudes de asesoría enviadas por tus alumnos, confirma fechas, propón reprogramaciones o márcalas como completadas.
              </p>
            </div>

            <button
              onClick={() => {
                loadTutoringRequests();
                showNotification('Lista de asesorías actualizada.');
              }}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Actualizar</span>
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Recibidas</span>
              <div className="text-xl font-black text-slate-800 mt-1">{tutoringRequests.length}</div>
            </div>

            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Pendientes</span>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-xl font-black text-amber-900 mt-1">
                {tutoringRequests.filter((r) => r.status === 'pendiente').length}
              </div>
            </div>

            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Aceptadas</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-xl font-black text-emerald-900 mt-1">
                {tutoringRequests.filter((r) => r.status === 'aceptada' || r.status === 'confirmada').length}
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">Completadas</span>
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-xl font-black text-blue-900 mt-1">
                {tutoringRequests.filter((r) => r.status === 'completada').length}
              </div>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={tutoringSearch}
                  onChange={(e) => setTutoringSearch(e.target.value)}
                  placeholder="Buscar por alumno, matrícula o motivo..."
                  className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Status filter */}
              <div>
                <select
                  value={tutoringStatusFilter}
                  onChange={(e) => setTutoringStatusFilter(e.target.value)}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                >
                  <option value="all">Todos los estados</option>
                  <option value="pendiente">Pendientes de respuesta</option>
                  <option value="aceptada">Aceptadas / Programadas</option>
                  <option value="reprogramada">Reprogramación propuesta</option>
                  <option value="completada">Completadas</option>
                  <option value="rechazada">Rechazadas</option>
                  <option value="cancelada">Canceladas</option>
                </select>
              </div>

              {/* Subject filter */}
              <div>
                <select
                  value={tutoringSubjectFilter}
                  onChange={(e) => setTutoringSubjectFilter(e.target.value)}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                >
                  <option value="all">Todas las materias</option>
                  {dashboardData?.subjects?.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date filter */}
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={tutoringDateFilter}
                  onChange={(e) => setTutoringDateFilter(e.target.value)}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
                {tutoringDateFilter && (
                  <button
                    onClick={() => setTutoringDateFilter('')}
                    className="p-2 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-xl text-xs cursor-pointer"
                    title="Limpiar fecha"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {(tutoringSearch || tutoringStatusFilter !== 'all' || tutoringSubjectFilter !== 'all' || tutoringDateFilter) && (
              <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                <span>Filtros activos • Mostrando {filteredTutoringRequests.length} de {tutoringRequests.length} solicitudes</span>
                <button
                  onClick={() => {
                    setTutoringSearch('');
                    setTutoringStatusFilter('all');
                    setTutoringSubjectFilter('all');
                    setTutoringDateFilter('');
                  }}
                  className="text-teal-600 hover:text-teal-800 font-bold hover:underline cursor-pointer"
                >
                  Limpiar todos los filtros
                </button>
              </div>
            )}
          </div>

          {/* Tutoring Requests Cards List */}
          {filteredTutoringRequests.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-xs">
              <CalendarCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-700 text-sm">No se encontraron solicitudes de asesoría</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                {tutoringRequests.length === 0
                  ? 'Aún no has recibido solicitudes de asesoría de tus estudiantes. Cuando un alumno agende una cita para tus materias, se mostrará aquí.'
                  : 'Ninguna solicitud coincide con los filtros seleccionados.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTutoringRequests.map((r) => {
                const isPending = r.status === 'pendiente';
                const isAccepted = r.status === 'aceptada' || r.status === 'confirmada';
                const isRescheduled = r.status === 'reprogramada';
                const isCompleted = r.status === 'completada';
                const isRejected = r.status === 'rechazada';
                const isCancelled = r.status === 'cancelada';

                return (
                  <div
                    key={r.id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 hover:border-slate-300 transition-all space-y-4"
                  >
                    {/* Top Row: Student info and Status badge */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-800 font-extrabold flex items-center justify-center text-xs shrink-0">
                          {r.studentAvatar ? (
                            <img src={r.studentAvatar} alt={r.studentName} className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            (r.studentName || 'E').slice(0, 2).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-800">{r.studentName || 'Estudiante'}</span>
                            <span className="text-[11px] font-mono px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-semibold">
                              {r.studentMatricula || 'Matrícula'}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                            <span className="font-semibold text-teal-700">{r.groupName || 'Grupo 3°A'}</span>
                            {r.studentEmail && (
                              <>
                                <span>•</span>
                                <span>{r.studentEmail}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="flex items-center gap-2 self-start sm:self-center">
                        {isPending && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>Pendiente de Atención</span>
                          </span>
                        )}
                        {isAccepted && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Aceptada / Programada</span>
                          </span>
                        )}
                        {isRescheduled && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-indigo-100 text-indigo-900 border border-indigo-300">
                            <RotateCcw className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Reprogramación Propuesta</span>
                          </span>
                        )}
                        {isCompleted && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-blue-100 text-blue-900 border border-blue-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                            <span>Completada</span>
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-rose-100 text-rose-900 border border-rose-300">
                            <X className="w-3.5 h-3.5 text-rose-600" />
                            <span>Rechazada</span>
                          </span>
                        )}
                        {isCancelled && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-300">
                            <X className="w-3.5 h-3.5 text-slate-500" />
                            <span>Cancelada</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle Content: Subject and Reason */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Materia y modalidad */}
                      <div className="space-y-2">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                            Materia Asignada
                          </span>
                          <span className="font-bold text-xs text-slate-800 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 inline-block">
                            {r.subjectName || r.subject || 'Materia General'}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                            Modalidad
                          </span>
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                            {r.modality === 'virtual' ? (
                              <>
                                <Video className="w-3.5 h-3.5 text-teal-600" />
                                <span>Virtual (Videollamada en línea)</span>
                              </>
                            ) : (
                              <>
                                <MapPin className="w-3.5 h-3.5 text-teal-600" />
                                <span>Presencial (En plantel / Cubículo)</span>
                              </>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Motivo de la solicitud */}
                      <div className="md:col-span-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                          Motivo o dudas del estudiante:
                        </span>
                        <p className="text-xs text-slate-700 leading-relaxed font-normal">{r.reason}</p>
                      </div>
                    </div>

                    {/* Schedule and Date Info */}
                    <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            Fecha solicitud: <strong>{new Date(r.createdAt).toLocaleDateString()}</strong>
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            Fecha y hora propuesta:{' '}
                            <strong className="text-slate-800">
                              {r.scheduledDate || r.preferredDate} a las {r.scheduledTime || r.preferredTime}
                            </strong>
                          </span>
                        </div>
                      </div>

                      {/* Virtual meeting link if accepted */}
                      {isAccepted && r.modality === 'virtual' && r.meetingLink && (
                        <a
                          href={r.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 bg-teal-50 text-teal-800 hover:bg-teal-100 font-bold text-xs rounded-lg border border-teal-200 inline-flex items-center gap-1"
                        >
                          <Video className="w-3 h-3 text-teal-600" />
                          <span>Enlace de videollamada</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    {/* Teacher Notes / Reasons display */}
                    {isRescheduled && (
                      <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs space-y-1 text-indigo-900">
                        <p className="font-bold flex items-center gap-1.5">
                          <RotateCcw className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Propuesta enviada al alumno:</span>
                        </p>
                        <p>
                          Nueva fecha sugerida: <strong>{r.proposedDate}</strong> a las <strong>{r.proposedTime}</strong>
                        </p>
                        {r.notes && <p className="italic text-indigo-700">"{r.notes}"</p>}
                      </div>
                    )}

                    {isRejected && r.rejectionReason && (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                        <strong>Motivo de rechazo indicado:</strong> {r.rejectionReason}
                      </div>
                    )}

                    {isCancelled && r.cancellationReason && (
                      <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-700">
                        <strong>Motivo de cancelación:</strong> {r.cancellationReason}
                      </div>
                    )}

                    {!isRescheduled && !isRejected && !isCancelled && r.notes && (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700">
                        <strong>Notas del docente:</strong> {r.notes}
                      </div>
                    )}

                    {/* Action Buttons Row */}
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <button
                        onClick={() => setDetailsModalRequest(r)}
                        className="text-xs font-bold text-slate-600 hover:text-slate-800 hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Ver Detalles Completos</span>
                      </button>

                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Actions for PENDING */}
                        {isPending && (
                          <>
                            <button
                              onClick={() => handleOpenAcceptModal(r)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Aceptar Asesoría</span>
                            </button>

                            <button
                              onClick={() => handleOpenRescheduleModal(r)}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Proponer otra fecha</span>
                            </button>

                            <button
                              onClick={() => handleOpenRejectModal(r)}
                              className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Rechazar</span>
                            </button>
                          </>
                        )}

                        {/* Actions for ACCEPTED */}
                        {isAccepted && (
                          <>
                            <button
                              onClick={() => handleOpenCompleteModal(r)}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Marcar como Completada</span>
                            </button>

                            <button
                              onClick={() => handleOpenRescheduleModal(r)}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Reprogramar</span>
                            </button>

                            <button
                              onClick={() => handleOpenCancelModal(r)}
                              className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Cancelar</span>
                            </button>
                          </>
                        )}

                        {/* Actions for RESCHEDULED */}
                        {isRescheduled && (
                          <>
                            <span className="text-[11px] text-indigo-700 font-medium italic">
                              Esperando respuesta del alumno
                            </span>
                            <button
                              onClick={() => handleOpenRescheduleModal(r)}
                              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                            >
                              Modificar propuesta
                            </button>
                            <button
                              onClick={() => handleOpenCancelModal(r)}
                              className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 font-bold text-xs rounded-xl cursor-pointer"
                            >
                              Cancelar
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL: CREAR / EDITAR ACTIVIDAD */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-800 mb-1">
              {editingActivity ? 'Editar Actividad' : 'Publicar Nueva Actividad / Examen'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Esta actividad aparecerá de inmediato en la agenda de todos los estudiantes del grupo asignado.
            </p>

            <form onSubmit={handleSaveActivity} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Título de la actividad</label>
                <input
                  type="text"
                  value={activityTitle}
                  onChange={(e) => setActivityTitle(e.target.value)}
                  required
                  placeholder="Ej. Tarea 3: Teorema Fundamental del Cálculo"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Materia asignada</label>
                <select
                  value={activitySubjectId}
                  onChange={(e) => setActivitySubjectId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  {dashboardData?.subjects?.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tipo</label>
                  <select
                    value={activityType}
                    onChange={(e) => setActivityType(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="task">Tarea</option>
                    <option value="project">Proyecto</option>
                    <option value="exam">Examen Parcial</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Prioridad</label>
                  <select
                    value={activityPriority}
                    onChange={(e) => setActivityPriority(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="alta">Alta</option>
                    <option value="media">Media</option>
                    <option value="baja">Baja</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Fecha límite</label>
                  <input
                    type="date"
                    value={activityDueDate}
                    onChange={(e) => setActivityDueDate(e.target.value)}
                    required
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hora límite</label>
                  <input
                    type="time"
                    value={activityDueTime}
                    onChange={(e) => setActivityDueTime(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Instrucciones y criterios</label>
                <textarea
                  value={activityDescription}
                  onChange={(e) => setActivityDescription(e.target.value)}
                  rows={3}
                  placeholder="Detalles sobre formato de entrega, rúbrica o ejercicios a resolver..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingActivity(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
                >
                  {editingActivity ? 'Guardar Cambios' : 'Publicar Actividad'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR / EDITAR CALIFICACIÓN */}
      {showGradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-1">
              {editingGrade ? 'Editar Calificación' : 'Registrar Calificación'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Asienta la calificación correspondiente con retroalimentación para el alumno.
            </p>

            <form onSubmit={handleSaveGrade} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Alumno</label>
                <select
                  value={gradeStudentId}
                  onChange={(e) => setGradeStudentId(e.target.value)}
                  disabled={Boolean(editingGrade)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  {students.map((std) => (
                    <option key={std.userId} value={std.userId}>
                      {std.name} ({std.studentIdNumber}) - {std.groupName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre de la Evaluación</label>
                <input
                  type="text"
                  value={gradeEvalName}
                  onChange={(e) => setGradeEvalName(e.target.value)}
                  required
                  placeholder="Ej. Examen Parcial 2 / Tarea 3"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Calificación obtenida</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={gradeScore}
                    onChange={(e) => setGradeScore(Number(e.target.value))}
                    required
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Puntaje Máximo</label>
                  <input
                    type="number"
                    min="1"
                    value={gradeMaxScore}
                    onChange={(e) => setGradeMaxScore(Number(e.target.value))}
                    required
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Retroalimentación para el alumno</label>
                <textarea
                  value={gradeFeedback}
                  onChange={(e) => setGradeFeedback(e.target.value)}
                  rows={2}
                  placeholder="Comentarios constructivos sobre aspectos a mejorar o felicitar..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowGradeModal(false);
                    setEditingGrade(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
                >
                  {editingGrade ? 'Actualizar Nota' : 'Guardar Calificación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DETALLES DE GRUPO */}
      {selectedGroupDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 border border-slate-100 max-h-[85vh] flex flex-col">
            <h3 className="text-lg font-bold text-slate-800">{selectedGroupDetails.name}</h3>
            <p className="text-xs text-slate-500 mb-4">
              Turno {selectedGroupDetails.shift} • {selectedGroupDetails.students?.length || 0} alumnos matriculados
            </p>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {selectedGroupDetails.students?.map((std: any) => (
                <div key={std.userId} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-800">{std.name}</div>
                    <div className="text-[11px] text-slate-400">{std.email}</div>
                  </div>
                  <span className="font-mono font-bold text-slate-600">{std.studentIdNumber}</span>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t flex justify-end">
              <button
                onClick={() => setSelectedGroupDetails(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ACEPTAR ASESORÍA */}
      {acceptModalRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-bold text-slate-800">Aceptar y Confirmar Asesoría</h3>
              </div>
              <button onClick={() => setAcceptModalRequest(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Estudiante: <strong>{acceptModalRequest.studentName}</strong> • Materia:{' '}
              <strong>{acceptModalRequest.subjectName || acceptModalRequest.subject}</strong>
            </p>

            <div className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="font-bold text-slate-700 block mb-1">Motivo del estudiante:</span>
                <p className="text-slate-600 italic">"{acceptModalRequest.reason}"</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Fecha programada *</label>
                  <input
                    type="date"
                    value={acceptDate}
                    onChange={(e) => setAcceptDate(e.target.value)}
                    required
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hora programada *</label>
                  <input
                    type="time"
                    value={acceptTime}
                    onChange={(e) => setAcceptTime(e.target.value)}
                    required
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {acceptModalRequest.modality === 'virtual' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Enlace de videollamada (Google Meet / Zoom)
                  </label>
                  <input
                    type="url"
                    value={acceptMeetingLink}
                    onChange={(e) => setAcceptMeetingLink(e.target.value)}
                    placeholder="https://meet.google.com/abc-defg-hij"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Instrucciones o nota para el alumno (opcional)
                </label>
                <textarea
                  value={acceptNotes}
                  onChange={(e) => setAcceptNotes(e.target.value)}
                  rows={2}
                  placeholder="Ej. Lleva tu guía impresa y calculadora / Conéctate 5 minutos antes..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setAcceptModalRequest(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={actionSubmitting}
                  onClick={handleConfirmAccept}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{actionSubmitting ? 'Confirmando...' : 'Confirmar y Aceptar Asesoría'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RECHAZAR ASESORÍA */}
      {rejectModalRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-rose-600">
                <AlertCircle className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-800">Rechazar Solicitud de Asesoría</h3>
              </div>
              <button onClick={() => setRejectModalRequest(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-4">
              Indica al alumno <strong>{rejectModalRequest.studentName}</strong> el motivo por el cual no es posible atender la asesoría en el horario solicitado.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Motivo del rechazo (obligatorio) *
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  required
                  rows={3}
                  placeholder="Ej. Empalme con reunión departamental / Los temas ya fueron abordados en el laboratorio del miércoles..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setRejectModalRequest(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Regresar
                </button>
                <button
                  type="button"
                  disabled={actionSubmitting || !rejectReason.trim()}
                  onClick={handleConfirmReject}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {actionSubmitting ? 'Rechazando...' : 'Confirmar Rechazo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PROPONER OTRA FECHA (REPROGRAMACIÓN) */}
      {rescheduleModalRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 border border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-indigo-700">
                <RotateCcw className="w-5 h-5" />
                <h3 className="text-lg font-bold text-slate-800">Proponer Otra Fecha u Hora</h3>
              </div>
              <button onClick={() => setRescheduleModalRequest(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Propón una fecha u hora alternativa para el estudiante <strong>{rescheduleModalRequest.studentName}</strong>. El alumno podrá aceptarla o rechazarla desde su panel.
            </p>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nueva fecha propuesta *</label>
                  <input
                    type="date"
                    value={rescheduleDate}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    required
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nueva hora propuesta *</label>
                  <input
                    type="time"
                    value={rescheduleTime}
                    onChange={(e) => setRescheduleTime(e.target.value)}
                    required
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mensaje explicativo para el alumno
                </label>
                <textarea
                  value={rescheduleNotes}
                  onChange={(e) => setRescheduleNotes(e.target.value)}
                  rows={2}
                  placeholder="Ej. En el horario solicitado tengo clase con el grupo 3B, pero te puedo atender en este nuevo horario en mi cubículo..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setRescheduleModalRequest(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={actionSubmitting}
                  onClick={handleConfirmReschedule}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{actionSubmitting ? 'Enviando...' : 'Enviar Propuesta al Estudiante'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: MARCAR COMO COMPLETADA */}
      {completeModalRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-blue-600">
                <CheckCircle2 className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-800">Concluir Asesoría</h3>
              </div>
              <button onClick={() => setCompleteModalRequest(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-4">
              ¿Confirmas que la asesoría con <strong>{completeModalRequest.studentName}</strong> se llevó a cabo exitosamente?
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Notas de la sesión / Observaciones (opcional)
                </label>
                <textarea
                  value={completeNotes}
                  onChange={(e) => setCompleteNotes(e.target.value)}
                  rows={3}
                  placeholder="Ej. Se resolvieron dudas de óptica y refracción. El estudiante muestra buen entendimiento de las fórmulas..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setCompleteModalRequest(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Regresar
                </button>
                <button
                  type="button"
                  disabled={actionSubmitting}
                  onClick={handleConfirmComplete}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {actionSubmitting ? 'Guardando...' : 'Marcar como Completada'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CANCELAR ASESORÍA ACEPTADA */}
      {cancelModalRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-rose-600">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-800">Cancelar Asesoría</h3>
              </div>
              <button onClick={() => setCancelModalRequest(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-4">
              Cancelar la sesión programada con <strong>{cancelModalRequest.studentName}</strong> para la materia <strong>{cancelModalRequest.subjectName || cancelModalRequest.subject}</strong>.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Motivo de cancelación (obligatorio) *
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  required
                  rows={3}
                  placeholder="Ej. Causa de fuerza mayor / Convocatoria institucional imprevista..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setCancelModalRequest(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Regresar
                </button>
                <button
                  type="button"
                  disabled={actionSubmitting || !cancelReason.trim()}
                  onClick={handleConfirmCancel}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {actionSubmitting ? 'Cancelando...' : 'Confirmar Cancelación'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VER DETALLES COMPLETOS DE ASESORÍA */}
      {detailsModalRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">Expediente de Asesoría Académica</h3>
              <button onClick={() => setDetailsModalRequest(null)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Estudiante */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Datos del Estudiante
                </span>
                <p className="font-bold text-sm text-slate-800">{detailsModalRequest.studentName}</p>
                <p className="text-slate-600 mt-0.5">
                  Matrícula: <strong>{detailsModalRequest.studentMatricula || 'N/A'}</strong> • Grupo: <strong>{detailsModalRequest.groupName || 'Grupo 3°A'}</strong>
                </p>
                {detailsModalRequest.studentEmail && (
                  <p className="text-slate-500 mt-0.5">Correo: {detailsModalRequest.studentEmail}</p>
                )}
                {detailsModalRequest.studentPhone && (
                  <p className="text-slate-500">Teléfono: {detailsModalRequest.studentPhone}</p>
                )}
              </div>

              {/* Materia y estado */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Materia
                  </span>
                  <p className="font-bold text-slate-800">{detailsModalRequest.subjectName || detailsModalRequest.subject}</p>
                  {detailsModalRequest.subjectCode && (
                    <span className="text-[11px] font-mono text-slate-500">Código: {detailsModalRequest.subjectCode}</span>
                  )}
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Estado Actual
                  </span>
                  <p className="font-bold uppercase text-blue-700">{detailsModalRequest.status}</p>
                  <span className="text-[11px] text-slate-500">
                    Modalidad: {detailsModalRequest.modality === 'virtual' ? 'Virtual' : 'Presencial'}
                  </span>
                </div>
              </div>

              {/* Fechas */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <p>
                  Fecha de solicitud: <strong>{new Date(detailsModalRequest.createdAt).toLocaleString()}</strong>
                </p>
                <p>
                  Fecha preferida original: <strong>{detailsModalRequest.preferredDate}</strong> a las{' '}
                  <strong>{detailsModalRequest.preferredTime}</strong>
                </p>
                {detailsModalRequest.scheduledDate && (
                  <p className="text-emerald-700 font-semibold">
                    Fecha confirmada: {detailsModalRequest.scheduledDate} a las {detailsModalRequest.scheduledTime}
                  </p>
                )}
                {detailsModalRequest.proposedDate && (
                  <p className="text-indigo-700 font-semibold">
                    Propuesta alternativa: {detailsModalRequest.proposedDate} a las {detailsModalRequest.proposedTime}
                  </p>
                )}
              </div>

              {/* Motivo */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Motivo o dudas del estudiante
                </span>
                <p className="text-slate-800 leading-relaxed font-normal">{detailsModalRequest.reason}</p>
              </div>

              {/* Notas y enlaces */}
              {detailsModalRequest.meetingLink && (
                <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between">
                  <span className="font-semibold text-teal-900">Enlace de videollamada:</span>
                  <a
                    href={detailsModalRequest.meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg inline-flex items-center gap-1 text-[11px]"
                  >
                    <span>Abrir enlace</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {detailsModalRequest.rejectionReason && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800">
                  <strong>Motivo de rechazo:</strong> {detailsModalRequest.rejectionReason}
                </div>
              )}

              {detailsModalRequest.cancellationReason && (
                <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-700">
                  <strong>Motivo de cancelación:</strong> {detailsModalRequest.cancellationReason}
                </div>
              )}

              {detailsModalRequest.notes && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700">
                  <strong>Notas del profesor:</strong> {detailsModalRequest.notes}
                </div>
              )}
            </div>

            <div className="mt-5 pt-3 border-t flex justify-end">
              <button
                onClick={() => setDetailsModalRequest(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
