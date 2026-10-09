import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Brain,
  CalendarCheck,
  FileText,
  Bot,
  CheckCircle,
  Clock,
  Sparkles,
  AlertTriangle,
  User,
  Heart,
  Send,
  Calendar,
  Lock,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Video,
  MapPin,
  RefreshCw,
} from 'lucide-react';

interface PsychologistDashboardProps {
  currentTab?: string;
  onNavigate?: (tab: string) => void;
}

export const PsychologistDashboard: React.FC<PsychologistDashboardProps> = ({
  currentTab = 'psych-dashboard',
  onNavigate,
}) => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<string>('overview');

  // Data states
  const [dashboardData, setDashboardData] = useState<any | null>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [authorizedStudents, setAuthorizedStudents] = useState<any[]>([]);
  const [selectedStudentHistory, setSelectedStudentHistory] = useState<any | null>(null);
  const [aiSummariesList, setAiSummariesList] = useState<any[]>([]);
  const [aiSummary, setAiSummary] = useState<any | null>(null);

  // Loading & notification states
  const [loading, setLoading] = useState(true);
  const [loadingAiSummary, setLoadingAiSummary] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modals & action states
  const [selectedRequestDetails, setSelectedRequestDetails] = useState<any | null>(null);
  const [rescheduleModalData, setRescheduleModalData] = useState<any | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');

  // Sync tab with sidebar currentTab
  useEffect(() => {
    if (currentTab === 'psych-requests') {
      setActiveSection('requests');
    } else if (currentTab === 'psych-appointments') {
      setActiveSection('appointments');
    } else if (currentTab === 'psych-history') {
      setActiveSection('history');
    } else if (currentTab === 'psych-wellness-summary') {
      setActiveSection('summaries');
    } else {
      setActiveSection('overview');
    }
  }, [currentTab]);

  const loadAllData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [dashRes, reqRes, appRes, histRes, summRes] = await Promise.all([
        api.getPsychologistDashboard(),
        api.getPsychologistRequests(),
        api.getPsychologistAppointments(),
        api.getPsychologistHistoryList(),
        api.getPsychologistAISummaries(),
      ]);
      setDashboardData(dashRes);
      setRequests(reqRes.requests || []);
      setAppointments(appRes.appointments || []);
      setAuthorizedStudents(histRes.students || []);
      setAiSummariesList(summRes.summaries || []);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error al cargar datos de orientación');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const notify = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const handleUpdateStatus = async (
    requestId: string,
    status: 'confirmada' | 'completada' | 'cancelada' | 'reprogramada',
    extraNotes?: string
  ) => {
    try {
      await api.updatePsychologistRequest(requestId, {
        status,
        notes: extraNotes,
      });
      notify(`Solicitud actualizada: ${status}`);
      loadAllData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al actualizar solicitud');
    }
  };

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleModalData || !rescheduleDate || !rescheduleTime) return;

    try {
      await api.updatePsychologistRequest(rescheduleModalData.id, {
        status: 'reprogramada',
        scheduledDate: rescheduleDate,
        scheduledTime: rescheduleTime,
        notes: sessionNotes || 'Cita reprogramada por el orientador.',
      });
      notify('Cita reprogramada exitosamente.');
      setRescheduleModalData(null);
      loadAllData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al reprogramar la cita');
    }
  };

  const handleViewHistory = async (studentId: string) => {
    try {
      const historyRes = await api.getPsychologistHistory(studentId);
      setSelectedStudentHistory(historyRes);
      setAiSummary(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'No tienes autorización para consultar este expediente.');
    }
  };

  const handleGenerateSummary = async (studentId: string) => {
    setLoadingAiSummary(true);
    setErrorMsg(null);
    try {
      const res = await api.getPsychologistAISummary(studentId);
      setAiSummary(res.summary);
      notify('Resumen IA generado correctamente.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al generar resumen IA');
    } finally {
      setLoadingAiSummary(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-purple-800 rounded-3xl p-6 sm:p-8 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 bg-white/20 rounded-md">
            Módulo de Orientación y Bienestar Psicológico
          </span>
          <h1 className="text-2xl font-extrabold mt-2">Lic. {user?.name}</h1>
          <p className="text-xs text-indigo-100 mt-1 max-w-xl">
            Acompañamiento escolar, atención de solicitudes, agenda de citas y síntesis con IA autorizadas.
          </p>
        </div>

        <div className="px-4 py-2.5 bg-indigo-900/60 border border-indigo-400/40 rounded-2xl text-xs">
          <div className="font-bold">Licencia Institucional</div>
          <div className="text-indigo-200 text-[11px]">CED-PSI-994821 • Cubículo 3</div>
        </div>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Strict Privacy & Ethics Banner */}
      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-4 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>
            <strong>Control Ético y Privacidad:</strong> Solo puedes acceder a información de estudiantes que hayan solicitado orientación explícita o tengan citas asignadas contigo. La privacidad estudiantil está blindada en la base de datos.
          </span>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-md shrink-0">
          Consentimiento Requerido
        </span>
      </div>

      {/* Internal Navigation Sub-tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        {[
          { id: 'overview', label: 'Dashboard General', icon: Brain },
          { id: 'requests', label: `Solicitudes de Orientación (${requests.length})`, icon: CalendarCheck },
          { id: 'appointments', label: `Citas Asignadas (${appointments.length})`, icon: Clock },
          { id: 'history', label: `Historial de Acompañamiento (${authorizedStudents.length})`, icon: FileText },
          { id: 'summaries', label: 'Resúmenes IA de Sesión', icon: Bot },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveSection(tab.id);
                if (onNavigate) {
                  if (tab.id === 'requests') onNavigate('psych-requests');
                  else if (tab.id === 'appointments') onNavigate('psych-appointments');
                  else if (tab.id === 'history') onNavigate('psych-history');
                  else if (tab.id === 'summaries') onNavigate('psych-wellness-summary');
                  else onNavigate('psych-dashboard');
                }
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                isActive ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SECTION: OVERVIEW */}
      {activeSection === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-400 font-bold">Solicitudes Pendientes</span>
              <div className="text-2xl font-black text-amber-600 mt-1">{dashboardData?.stats?.pending || 0}</div>
              <div className="text-[11px] text-amber-700 font-medium mt-1">Por confirmar</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-400 font-bold">Citas de la Semana</span>
              <div className="text-2xl font-black text-indigo-600 mt-1">{dashboardData?.stats?.confirmed || 0}</div>
              <div className="text-[11px] text-indigo-700 font-medium mt-1">En agenda</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-400 font-bold">Sesiones Realizadas</span>
              <div className="text-2xl font-black text-emerald-600 mt-1">{dashboardData?.stats?.completed || 0}</div>
              <div className="text-[11px] text-emerald-700 font-medium mt-1">Seguimiento completado</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-400 font-bold">Estrés Escolar Global</span>
              <div className="text-2xl font-black text-slate-800 mt-1">{dashboardData?.stats?.stressPercentage || 35}%</div>
              <div className="text-[11px] text-slate-500 font-medium mt-1">Tendencia preventiva</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4 text-indigo-600" />
                  <span>Próximas Sesiones Programadas</span>
                </h3>
                <button onClick={() => setActiveSection('appointments')} className="text-xs font-bold text-indigo-600">
                  Ver agenda →
                </button>
              </div>

              <div className="space-y-3">
                {appointments.slice(0, 3).map((app) => (
                  <div key={app.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs flex justify-between items-center">
                    <div>
                      <div className="font-bold text-slate-800">{app.studentName}</div>
                      <div className="text-[11px] text-slate-500">
                        {app.scheduledDate || app.preferredDate} a las {app.scheduledTime || app.preferredTime} • {app.modality}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 text-indigo-800">
                      {app.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span>Alumnos en Acompañamiento</span>
                </h3>
                <button onClick={() => setActiveSection('history')} className="text-xs font-bold text-indigo-600">
                  Ver expedientes →
                </button>
              </div>

              <div className="space-y-2.5">
                {authorizedStudents.slice(0, 3).map((std) => (
                  <div key={std.userId} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs flex justify-between items-center">
                    <div>
                      <div className="font-bold text-slate-800">{std.name}</div>
                      <div className="text-[11px] text-slate-400">Matrícula: {std.studentIdNumber} • {std.totalSessions} sesión(es)</div>
                    </div>
                    <button
                      onClick={() => {
                        handleViewHistory(std.userId);
                        setActiveSection('history');
                      }}
                      className="px-2.5 py-1 bg-white border border-slate-200 text-indigo-700 font-bold text-[11px] rounded-lg"
                    >
                      Expediente
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION: SOLICITUDES */}
      {activeSection === 'requests' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-800">Solicitudes de Orientación Psicológica</h2>
              <p className="text-xs text-slate-500">
                Revisa los motivos de consulta enviados voluntariamente por los alumnos y gestiona su aceptación.
              </p>
            </div>
          </div>

          {requests.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No hay solicitudes de orientación pendientes.
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((r) => {
                const isPending = r.status === 'pendiente';
                return (
                  <div key={r.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-800">{r.studentName}</span>
                        <span className="text-xs font-mono font-bold text-slate-500">({r.studentMatricula})</span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800">
                          {r.modality}
                        </span>
                      </div>
                      <span className="text-xs font-bold capitalize px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700">
                        Estado: {r.status}
                      </span>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-700">
                      <span className="font-bold text-slate-800">Motivo manifestado por el alumno: </span>
                      "{r.reason}"
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 pt-2 border-t border-slate-200">
                      <div>
                        Fecha solicitada: <strong>{r.preferredDate}</strong> a las <strong>{r.preferredTime}</strong>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedRequestDetails(r)}
                          className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-xl"
                        >
                          Ver Detalles
                        </button>

                        {isPending && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(r.id, 'confirmada', 'Aceptada por el orientador')}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs"
                            >
                              Aceptar Cita
                            </button>
                            <button
                              onClick={() => {
                                setRescheduleModalData(r);
                                setRescheduleDate(r.preferredDate);
                                setRescheduleTime(r.preferredTime);
                              }}
                              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold rounded-xl"
                            >
                              Reprogramar
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(r.id, 'cancelada', 'Rechazada por disponibilidad')}
                              className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl"
                            >
                              Rechazar
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

      {/* SECTION: CITAS */}
      {activeSection === 'appointments' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-800">Citas Asignadas y Agenda Activa</h2>
              <p className="text-xs text-slate-500">
                Gestiona las sesiones confirmadas, cambia horarios si surge un imprevisto o marca sesiones concluidas.
              </p>
            </div>
          </div>

          {appointments.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No tienes citas asignadas en este momento.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {appointments.map((app) => (
                <div key={app.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-md">
                        {app.status}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        {app.modality === 'virtual' ? <Video className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
                        {app.modality === 'virtual' ? 'En línea' : 'Presencial'}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-slate-800">{app.studentName}</h4>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">Motivo: "{app.reason}"</p>

                    <div className="mt-3 p-2.5 bg-white rounded-xl border border-slate-200 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-slate-700">
                        <Clock className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Fecha: {app.scheduledDate || app.preferredDate} a las {app.scheduledTime || app.preferredTime}</span>
                      </div>
                      {app.notes && (
                        <div className="text-[11px] text-indigo-700 italic">Notas: {app.notes}</div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                    {app.status !== 'completada' && (
                      <>
                        <button
                          onClick={() => {
                            setRescheduleModalData(app);
                            setRescheduleDate(app.scheduledDate || app.preferredDate);
                            setRescheduleTime(app.scheduledTime || app.preferredTime);
                          }}
                          className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs rounded-xl border border-amber-200"
                        >
                          Reprogramar
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(app.id, 'completada', 'Sesión completada con éxito')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs"
                        >
                          Marcar Concluida
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION: HISTORIAL DE ACOMPAÑAMIENTO */}
      {activeSection === 'history' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
            <h2 className="text-base font-bold text-slate-800">Historial de Acompañamiento de Alumnos</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Acceso a expedientes de estudiantes que han solicitado orientación y autorizado seguimiento.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
              {authorizedStudents.map((std) => (
                <div key={std.userId} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-800">{std.name}</h3>
                    <div className="text-xs text-slate-500 font-mono mt-0.5">Matrícula: {std.studentIdNumber}</div>
                    <div className="text-xs text-slate-600 mt-2">
                      Total sesiones: <strong>{std.totalSessions}</strong>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                    <button
                      onClick={() => handleViewHistory(std.userId)}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Consultar Expediente</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed dossier if selected */}
          {selectedStudentHistory && (
            <div className="bg-white rounded-2xl border border-indigo-200 shadow-md p-6 space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-md">
                    Expediente Activo
                  </span>
                  <h3 className="text-lg font-bold text-slate-800 mt-1">
                    {selectedStudentHistory.student?.name} ({selectedStudentHistory.student?.matricula})
                  </h3>
                  <div className="text-xs text-slate-500">
                    Correo: {selectedStudentHistory.student?.email} • Teléfono: {selectedStudentHistory.student?.phone || 'No registrado'}
                  </div>
                </div>

                <button
                  onClick={() => handleGenerateSummary(selectedStudentHistory.student?.id)}
                  disabled={loadingAiSummary}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:brightness-110 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{loadingAiSummary ? 'Generando...' : 'Generar Resumen de Sesión IA'}</span>
                </button>
              </div>

              {/* Sessions list */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Sesiones Registradas ({selectedStudentHistory.sessions?.length || 0})
                </h4>
                <div className="space-y-2">
                  {selectedStudentHistory.sessions?.map((sess: any) => (
                    <div key={sess.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs flex justify-between items-center">
                      <div>
                        <strong>{sess.scheduledDate || sess.preferredDate}</strong> ({sess.scheduledTime || sess.preferredTime}) — {sess.modality}
                        <p className="text-slate-500 mt-0.5">Motivo: "{sess.reason}"</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white border border-slate-200">
                        {sess.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Self reported mood logs if student shared */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 text-rose-500" />
                  <span>Registros Anímicos Voluntarios Recientes</span>
                </h4>
                <div className="space-y-1.5">
                  {selectedStudentHistory.emotionalRecords?.slice(0, 3).map((er: any) => (
                    <div key={er.id} className="p-2.5 bg-slate-50 rounded-lg text-xs flex justify-between">
                      <span>
                        Estado: <strong>{er.mood}</strong> {er.note && `— "${er.note}"`}
                      </span>
                      <span className="text-slate-400 text-[11px]">{er.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION: RESÚMENES IA DE SESIÓN */}
      {activeSection === 'summaries' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-800">Resúmenes de Acompañamiento con IA</h2>
                <p className="text-xs text-slate-500">
                  Síntesis objetiva de contexto académico y temas recurrentes para preparar las entrevistas orientativas.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {aiSummariesList.map((item) => (
                <div key={item.studentId} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-800">{item.studentName}</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Carga: {item.tasksCount} tareas • {item.sessionsCount} sesiones previas
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200">
                    <button
                      onClick={() => handleGenerateSummary(item.studentId)}
                      disabled={loadingAiSummary}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Ver / Regenerar Resumen IA</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Briefing Display */}
          {aiSummary && (
            <div className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-3xl space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="w-6 h-6 text-indigo-600" />
                  <h4 className="font-bold text-base text-indigo-950">Resumen de Contexto Generado por IA</h4>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 bg-indigo-200 text-indigo-900 rounded-lg">
                  {aiSummary.period || 'Periodo Actual'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 bg-white/90 rounded-2xl border border-indigo-100">
                  <span className="font-bold text-indigo-900 block mb-1">Temas Recurrentes:</span>
                  <ul className="list-disc pl-4 space-y-1 text-slate-700">
                    {aiSummary.mainThemes?.map((t: string, i: number) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3.5 bg-white/90 rounded-2xl border border-indigo-100">
                  <span className="font-bold text-indigo-900 block mb-1">Tendencia Anímica Reportada:</span>
                  <p className="text-slate-700 leading-relaxed">{aiSummary.emotionalTrend}</p>
                </div>
              </div>

              <div className="p-4 bg-white/90 rounded-2xl border border-indigo-100 text-xs text-slate-800">
                <strong className="text-indigo-900">Orientación Sugerida para la Sesión: </strong>
                {aiSummary.sessionAdvice}
              </div>

              <div className="text-[11px] text-slate-500 italic border-t border-indigo-200 pt-3">
                ⚖️ {aiSummary.disclaimer}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL: REPROGRAMAR CITA */}
      {rescheduleModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Reprogramar Cita</h3>
            <p className="text-xs text-slate-500 mb-4">
              Alumno: {rescheduleModalData.studentName}
            </p>

            <form onSubmit={handleRescheduleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nueva Fecha</label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  required
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nueva Hora</label>
                <input
                  type="time"
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  required
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nota o motivo del cambio</label>
                <textarea
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  rows={2}
                  placeholder="Ej. Cambio solicitado por ajuste de agenda del cubículo..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setRescheduleModalData(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
                >
                  Confirmar Reprogramación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DETALLES DE SOLICITUD */}
      {selectedRequestDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Detalles de Solicitud</h3>
            <div className="text-xs text-slate-500 mb-4">
              Estudiante: {selectedRequestDetails.studentName} ({selectedRequestDetails.studentMatricula})
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2 mb-4">
              <div>
                <strong className="text-slate-800">Modalidad:</strong> {selectedRequestDetails.modality}
              </div>
              <div>
                <strong className="text-slate-800">Fecha propuesta:</strong> {selectedRequestDetails.preferredDate} a las {selectedRequestDetails.preferredTime}
              </div>
              <div>
                <strong className="text-slate-800">Motivo:</strong>
                <p className="mt-1 text-slate-700 italic">"{selectedRequestDetails.reason}"</p>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedRequestDetails(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
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
