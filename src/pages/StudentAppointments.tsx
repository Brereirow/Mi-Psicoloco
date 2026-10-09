import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { CounselingRequest, Subject } from '../types';
import {
  CalendarCheck,
  Plus,
  Clock,
  MapPin,
  Video,
  CheckCircle2,
  AlertCircle,
  Brain,
  BookOpen,
  User,
  Filter,
  X,
  ExternalLink,
  RotateCcw,
  AlertTriangle,
  Send,
  Calendar,
} from 'lucide-react';

export const StudentAppointments: React.FC = () => {
  const [requests, setRequests] = useState<CounselingRequest[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'activas' | 'historial' | 'todas'>('activas');

  // Success message alert
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Cancel modal state
  const [cancelingRequest, setCancelingRequest] = useState<CounselingRequest | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Form state
  const [type, setType] = useState<'orientacion_psicologica' | 'asesoria_academica'>('asesoria_academica');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [customSubjectTitle, setCustomSubjectTitle] = useState('');
  const [reason, setReason] = useState('');
  const [preferredDate, setPreferredDate] = useState(new Date().toISOString().slice(0, 10));
  const [preferredTime, setPreferredTime] = useState('11:00');
  const [modality, setModality] = useState<'presencial' | 'virtual'>('presencial');
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');

  const loadData = async () => {
    try {
      const [reqRes, subjRes, teachRes] = await Promise.all([
        api.getCounselingRequests(),
        api.getStudentSubjects().catch(() => ({ subjects: [] })),
        api.getAvailableTeachers().catch(() => ({ teachers: [] })),
      ]);
      setRequests(reqRes.requests || []);
      const subjs: Subject[] = subjRes.subjects || [];
      const tchs: any[] = teachRes.teachers || [];
      setSubjects(subjs);
      setTeachers(tchs);

      if (subjs.length > 0 && !selectedSubjectId) {
        setSelectedSubjectId(subjs[0].id);
        const matchedTeacher = subjs[0].teacherId || (tchs.length > 0 ? tchs[0].id : '');
        setSelectedTeacherId(matchedTeacher);
      } else if (tchs.length > 0 && !selectedTeacherId) {
        setSelectedTeacherId(tchs[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedSubjectObj = subjects.find((s) => s.id === selectedSubjectId);
  const selectedTeacherObj = teachers.find((t) => t.id === selectedTeacherId);

  const handleSubjectChange = (newSubjId: string) => {
    setSelectedSubjectId(newSubjId);
    const foundSubj = subjects.find((s) => s.id === newSubjId);
    if (foundSubj?.teacherId) {
      setSelectedTeacherId(foundSubj.teacherId);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (type === 'asesoria_academica') {
      if (!selectedSubjectId && !customSubjectTitle.trim()) {
        setValidationError('Por favor selecciona la materia en la que necesitas ayuda.');
        return;
      }
      if (!selectedTeacherId && !selectedSubjectObj?.teacherId) {
        setValidationError('Por favor selecciona al docente correspondiente a la materia.');
        return;
      }
    }

    if (!reason.trim()) {
      setValidationError('Por favor escribe el motivo o temas con dudas para la asesoría.');
      return;
    }

    if (!preferredDate) {
      setValidationError('Por favor selecciona una fecha disponible.');
      return;
    }

    if (!preferredTime) {
      setValidationError('Por favor selecciona una hora disponible.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');
    try {
      const payload: any = {
        type,
        reason: reason.trim(),
        preferredDate,
        preferredTime,
        modality,
      };

      if (type === 'asesoria_academica') {
        payload.subjectId = selectedSubjectId || undefined;
        payload.subject = selectedSubjectObj ? selectedSubjectObj.name : customSubjectTitle.trim();
        payload.teacherId = selectedTeacherId || selectedSubjectObj?.teacherId;
        payload.teacherName =
          selectedTeacherObj?.name || selectedSubjectObj?.teacherName || 'Docente Asignado';
      } else {
        payload.subject = 'Orientación y Bienestar Emocional';
      }

      const res = await api.createCounselingRequest(payload);
      if (res.success || res.request) {
        setSuccessMessage(
          '¡Solicitud enviada con éxito! Tu profesor ha recibido la notificación y responderá con la confirmación de horario.'
        );
        setShowModal(false);
        setReason('');
        setCustomSubjectTitle('');
        await loadData();
      } else {
        setErrorMessage(res.error || 'Ocurrió un error al enviar la solicitud.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'No fue posible registrar la solicitud.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelingRequest) return;
    setActionLoading(true);
    try {
      await api.cancelCounselingRequest(cancelingRequest.id, cancelReason);
      setSuccessMessage('La solicitud ha sido cancelada correctamente.');
      setCancelingRequest(null);
      setCancelReason('');
      await loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al cancelar la solicitud.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRespondProposal = async (requestId: string, action: 'accept' | 'reject') => {
    setActionLoading(true);
    try {
      await api.respondCounselingProposal(requestId, action);
      setSuccessMessage(
        action === 'accept'
          ? 'Has confirmado y aceptado el nuevo horario propuesto por tu docente.'
          : 'Has rechazado la propuesta de horario del docente.'
      );
      await loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al responder a la propuesta.');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredRequests = requests.filter((r) => {
    const isCompletedOrCanceled =
      r.status === 'completada' || r.status === 'cancelada' || r.status === 'rechazada';
    if (activeTab === 'activas') {
      return !isCompletedOrCanceled;
    }
    if (activeTab === 'historial') {
      return isCompletedOrCanceled;
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aceptada':
      case 'confirmada':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Aceptada
          </span>
        );
      case 'reprogramada':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800">
            <RotateCcw className="w-3 h-3 text-indigo-600" />
            Reprogramación propuesta
          </span>
        );
      case 'rechazada':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-rose-100 text-rose-800">
            <AlertCircle className="w-3 h-3 text-rose-600" />
            Rechazada
          </span>
        );
      case 'cancelada':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-200 text-slate-700">
            <X className="w-3 h-3 text-slate-500" />
            Cancelada
          </span>
        );
      case 'completada':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">
            <CheckCircle2 className="w-3 h-3 text-blue-600" />
            Completada
          </span>
        );
      case 'pendiente':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
            <Clock className="w-3 h-3 text-amber-600" />
            Pendiente
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-teal-600" />
            <h1 className="text-xl font-bold text-slate-800">Asesorías Académicas & Orientación</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Solicita asesorías personalizadas con tus profesores por materia o agenda citas de apoyo emocional con el orientador.
          </p>
        </div>

        <button
          onClick={() => {
            setValidationError('');
            setShowModal(true);
          }}
          className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Solicitar Nueva Asesoría</span>
        </button>
      </div>

      {/* Success Notification Alert */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-start justify-between gap-3 animate-fadeIn">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-emerald-900">Operación exitosa</p>
              <p className="mt-0.5">{successMessage}</p>
            </div>
          </div>
          <button
            onClick={() => setSuccessMessage('')}
            className="text-emerald-600 hover:text-emerald-800 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-rose-900">Atención</p>
              <p className="mt-0.5">{errorMessage}</p>
            </div>
          </div>
          <button
            onClick={() => setErrorMessage('')}
            className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('activas')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'activas'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Activas y Pendientes (
            {requests.filter((r) => r.status !== 'completada' && r.status !== 'cancelada' && r.status !== 'rechazada').length}
            )
          </button>
          <button
            onClick={() => setActiveTab('historial')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'historial'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Historial de Asesorías (
            {requests.filter((r) => r.status === 'completada' || r.status === 'cancelada' || r.status === 'rechazada').length}
            )
          </button>
          <button
            onClick={() => setActiveTab('todas')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'todas'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Todas ({requests.length})
          </button>
        </div>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs">Cargando tus solicitudes y asesorías...</div>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-xs">
          <CalendarCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-700 text-sm">
            {activeTab === 'historial' ? 'No tienes asesorías en tu historial' : 'No tienes solicitudes activas'}
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            {activeTab === 'historial'
              ? 'Las asesorías completadas o canceladas aparecerán registradas aquí.'
              : 'Cuando tengas dudas en alguna materia o necesites apoyo de tu profesor, agenda una asesoría académica personalizada.'}
          </p>
          {activeTab !== 'historial' && (
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Solicitar Asesoría Ahora</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredRequests.map((r) => {
            const isPending = r.status === 'pendiente';
            const isAccepted = r.status === 'aceptada' || r.status === 'confirmada';
            const isRescheduled = r.status === 'reprogramada';
            const isRejected = r.status === 'rechazada';
            const isCancelled = r.status === 'cancelada';

            return (
              <div
                key={r.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between hover:shadow-md transition-shadow relative"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md flex items-center gap-1.5 ${
                        r.type === 'orientacion_psicologica'
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-teal-100 text-teal-800'
                      }`}
                    >
                      {r.type === 'orientacion_psicologica' ? (
                        <Brain className="w-3.5 h-3.5" />
                      ) : (
                        <BookOpen className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {r.type === 'orientacion_psicologica'
                          ? 'Orientación Psicológica'
                          : 'Asesoría Académica'}
                      </span>
                    </span>

                    {getStatusBadge(r.status)}
                  </div>

                  {/* Subject and Teacher Title */}
                  <h3 className="font-bold text-base text-slate-800 leading-snug">
                    {r.subjectName || r.subject || 'Asesoría Académica'}
                  </h3>

                  {(r.teacherName || r.psychologistName) && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold mt-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {r.type === 'asesoria_academica'
                          ? `Docente: ${r.teacherName || 'Prof. Roberto Silva'}`
                          : `Orientador: ${r.psychologistName || 'Lic. Sofia Valenzuela'}`}
                      </span>
                    </div>
                  )}

                  {/* Student Reason */}
                  <div className="mt-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Motivo de la solicitud:
                    </p>
                    <p className="text-xs text-slate-700 leading-relaxed">{r.reason}</p>
                  </div>

                  {/* Details metadata */}
                  <div className="mt-3.5 space-y-2 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        Fecha:{' '}
                        <strong>
                          {r.scheduledDate || r.preferredDate}
                        </strong>{' '}
                        a las{' '}
                        <strong>
                          {r.scheduledTime || r.preferredTime}
                        </strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {r.modality === 'virtual' ? (
                        <Video className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      ) : (
                        <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      )}
                      <span>
                        Modalidad:{' '}
                        <strong>
                          {r.modality === 'virtual' ? 'Virtual (Videollamada en línea)' : 'Presencial (En plantel / Cubículo)'}
                        </strong>
                      </span>
                    </div>

                    {/* Meeting Link for virtual accepted */}
                    {isAccepted && r.modality === 'virtual' && r.meetingLink && (
                      <div className="p-2.5 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between text-xs text-teal-900 mt-2">
                        <span className="font-semibold">Enlace de videollamada:</span>
                        <a
                          href={r.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white font-bold text-[11px] rounded-lg inline-flex items-center gap-1"
                        >
                          <span>Entrar a la sesión</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Special Banner for Reschedule Proposal from Teacher */}
                  {isRescheduled && (
                    <div className="mt-4 p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl text-xs space-y-2">
                      <div className="flex items-center gap-1.5 font-bold text-indigo-900">
                        <RotateCcw className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span>El docente propone un nuevo horario:</span>
                      </div>
                      <p className="text-indigo-800">
                        Nueva fecha propuesta:{' '}
                        <strong>{r.proposedDate || r.scheduledDate}</strong> a las{' '}
                        <strong>{r.proposedTime || r.scheduledTime}</strong>
                      </p>
                      {r.notes && (
                        <p className="text-slate-600 text-[11px] italic bg-white/70 p-2 rounded-lg border border-indigo-100">
                          "{r.notes}"
                        </p>
                      )}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          disabled={actionLoading}
                          onClick={() => handleRespondProposal(r.id, 'accept')}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Aceptar Nuevo Horario</span>
                        </button>
                        <button
                          disabled={actionLoading}
                          onClick={() => handleRespondProposal(r.id, 'reject')}
                          className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                        >
                          Rechazar
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Rejection / Cancellation note */}
                  {isRejected && r.rejectionReason && (
                    <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                      <strong>Motivo del docente:</strong> {r.rejectionReason}
                    </div>
                  )}

                  {isCancelled && r.cancellationReason && (
                    <div className="mt-3 p-3 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-700">
                      <strong>Motivo de cancelación:</strong> {r.cancellationReason}
                    </div>
                  )}

                  {/* General teacher notes */}
                  {!isRescheduled && !isRejected && !isCancelled && r.notes && (
                    <div className="mt-3 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700">
                      <strong>Nota del profesor:</strong> {r.notes}
                    </div>
                  )}
                </div>

                {/* Footer with actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Solicitado: {new Date(r.createdAt).toLocaleDateString()}</span>

                  {isPending && (
                    <button
                      onClick={() => setCancelingRequest(r)}
                      className="text-xs text-rose-600 hover:text-rose-700 font-bold hover:underline cursor-pointer"
                    >
                      Cancelar Solicitud
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal to Request New Tutoring/Counseling */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-slate-800">Solicitar Asesoría u Orientación</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Completa el formulario para coordinar una sesión personalizada. La solicitud llegará directamente al panel del docente.
            </p>

            {validationError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de atención</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setType('asesoria_academica')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      type === 'asesoria_academica'
                        ? 'border-teal-500 bg-teal-50 text-teal-800 ring-2 ring-teal-500/20'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Asesoría Académica</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setType('orientacion_psicologica')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      type === 'orientacion_psicologica'
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-800 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Brain className="w-4 h-4" />
                    <span>Orientación Psicológica</span>
                  </button>
                </div>
              </div>

              {/* Subject & Teacher selection (for academic tutoring) */}
              {type === 'asesoria_academica' && (
                <div className="space-y-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Materia en la que necesitas ayuda *
                    </label>
                    <select
                      value={selectedSubjectId}
                      onChange={(e) => handleSubjectChange(e.target.value)}
                      className="w-full text-xs p-2.5 bg-white rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 font-medium"
                    >
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.code || 'Materia'}) — {s.teacherName || 'Docente'}
                        </option>
                      ))}
                      <option value="">Otra materia / Tema específico</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Docente correspondiente a la materia *
                    </label>
                    <select
                      value={selectedTeacherId}
                      onChange={(e) => setSelectedTeacherId(e.target.value)}
                      className="w-full text-xs p-2.5 bg-white rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 font-medium"
                    >
                      {teachers.length > 0 ? (
                        teachers.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} • {t.department || 'Docente'} ({t.cubicle || 'Plantel'})
                          </option>
                        ))
                      ) : (
                        <option value={selectedSubjectObj?.teacherId || ''}>
                          {selectedSubjectObj?.teacherName || 'Docente titular'}
                        </option>
                      )}
                    </select>
                  </div>

                  {/* Teacher info display */}
                  {(selectedTeacherObj || selectedSubjectObj) && (
                    <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-teal-600" />
                        <div>
                          <p className="font-bold text-slate-800">
                            {selectedTeacherObj?.name || selectedSubjectObj?.teacherName || 'Prof. Roberto Silva'}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {selectedTeacherObj?.department || 'Departamento Académico'} • {selectedTeacherObj?.cubicle || 'Plantel'}
                          </p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 bg-teal-100 text-teal-800 font-bold text-[10px] rounded-md">
                        Docente Asignado
                      </span>
                    </div>
                  )}

                  {!selectedSubjectId && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nombre de la materia o tema *
                      </label>
                      <input
                        type="text"
                        value={customSubjectTitle}
                        onChange={(e) => setCustomSubjectTitle(e.target.value)}
                        placeholder="Ej. Física II / Ecuaciones diferenciales"
                        className="w-full text-xs p-2.5 bg-white rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Reason */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Motivo detallado de la asesoría *
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                  rows={3}
                  placeholder={
                    type === 'asesoria_academica'
                      ? 'Describe los temas específicos o problemas donde tienes dudas (ej. dudas con la guía de laboratorio o preparación para el examen)...'
                      : 'Explica brevemente qué te gustaría abordar en la sesión de bienestar o manejo de estrés...'
                  }
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Modality, Date, Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Modalidad *</label>
                  <select
                    value={modality}
                    onChange={(e) => setModality(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="presencial">Presencial (En cubículo escolar)</option>
                    <option value="virtual">Virtual (Videollamada en línea)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hora disponible *</label>
                  <input
                    type="time"
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    required
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Fecha disponible *</label>
                <input
                  type="date"
                  value={preferredDate}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  required
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{submitting ? 'Enviando solicitud...' : 'Enviar Solicitud'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Request Confirmation Modal */}
      {cancelingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-slate-100">
            <div className="flex items-center gap-3 text-rose-600 mb-2">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold text-slate-800">Cancelar Solicitud de Asesoría</h3>
            </div>
            <p className="text-xs text-slate-600 mb-4">
              ¿Estás seguro de que deseas cancelar la solicitud para{' '}
              <strong>{cancelingRequest.subject || 'asesoría'}</strong>?
            </p>

            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Motivo de cancelación (opcional)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={2}
                placeholder="Ej. Ya resolví la duda con mis apuntes / Choque de horario..."
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setCancelingRequest(null);
                  setCancelReason('');
                }}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Regresar
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmCancel}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? 'Cancelando...' : 'Confirmar Cancelación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
