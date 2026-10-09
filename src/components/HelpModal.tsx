import React, { useState } from 'react';
import { LifeBuoy, Brain, BookOpen, Sparkles, AlertOctagon, X, Phone, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { BreathingModal } from './BreathingModal';
import { api } from '../services/api';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestAssistance?: (type: 'orientacion_psicologica' | 'asesoria_academica') => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose, onRequestAssistance }) => {
  const [showBreathing, setShowBreathing] = useState(false);
  const [showEmergencyDetails, setShowEmergencyDetails] = useState(false);
  const [quickRequestSent, setQuickRequestSent] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleQuickRequest = async (type: 'orientacion_psicologica' | 'asesoria_academica') => {
    try {
      await api.createCounselingRequest({
        type,
        subjectId: type === 'asesoria_academica' ? 'subj-1' : undefined,
        teacherId: type === 'asesoria_academica' ? 'usr-teacher-1' : undefined,
        psychologistId: type === 'orientacion_psicologica' ? 'usr-psych-1' : undefined,
        subject: type === 'orientacion_psicologica' ? 'Orientación prioritaria de bienestar' : 'Asesoría prioritaria de matemáticas y ciencias',
        reason: 'Solicitud enviada mediante el botón rápido de ayuda institucional.',
        preferredDate: new Date().toISOString().slice(0, 10),
        preferredTime: '12:00',
        modality: 'presencial',
      });
      setQuickRequestSent(type);
      setTimeout(() => {
        setQuickRequestSent(null);
        if (onRequestAssistance) onRequestAssistance(type);
        onClose();
      }, 1800);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 border border-slate-100 overflow-hidden">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
              <LifeBuoy className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">Centro de Apoyo & Asistencia</h3>
              <p className="text-xs text-slate-500">¿Qué tipo de apoyo requieres en este momento?</p>
            </div>
          </div>

          {quickRequestSent ? (
            <div className="my-8 p-6 bg-teal-50 border border-teal-200 rounded-xl flex flex-col items-center text-center">
              <CheckCircle2 className="w-10 h-10 text-teal-600 mb-2" />
              <h4 className="font-bold text-teal-800">Solicitud Registrada</h4>
              <p className="text-xs text-teal-700 mt-1">
                El departamento de orientación escolar ha recibido tu aviso prioritario. Se pondrán en contacto contigo hoy mismo.
              </p>
            </div>
          ) : !showEmergencyDetails ? (
            <div className="grid grid-cols-1 gap-3 my-6">
              {/* Option 1: Orientación psicológica */}
              <button
                onClick={() => handleQuickRequest('orientacion_psicologica')}
                className="flex items-start gap-4 p-4 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 text-left transition-all group"
              >
                <div className="p-2.5 rounded-lg bg-indigo-100 text-indigo-700 group-hover:scale-105 transition-transform">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                    🧠 Necesito orientación psicológica
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Agendar una sesión confidencial con los psicólogos del plantel para hablar sobre estrés, ansiedad o temas personales.
                  </p>
                </div>
              </button>

              {/* Option 2: Ayuda académica */}
              <button
                onClick={() => handleQuickRequest('asesoria_academica')}
                className="flex items-start gap-4 p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-left transition-all group"
              >
                <div className="p-2.5 rounded-lg bg-blue-100 text-blue-700 group-hover:scale-105 transition-transform">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                    📚 Necesito ayuda académica
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Solicitar tutoría o asesoría con docentes para resolver dudas en materias, tareas o preparación de exámenes.
                  </p>
                </div>
              </button>

              {/* Option 3: Tranquilizarme */}
              <button
                onClick={() => setShowBreathing(true)}
                className="flex items-start gap-4 p-4 rounded-xl border border-slate-200 hover:border-teal-400 hover:bg-teal-50/50 text-left transition-all group"
              >
                <div className="p-2.5 rounded-lg bg-teal-100 text-teal-700 group-hover:scale-105 transition-transform">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                    🧘 Necesito tranquilizarme ahora
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Iniciar ejercicio guiado de respiración 4-7-8 con temporizador para regular el ritmo cardíaco y calmar la mente.
                  </p>
                </div>
              </button>

              {/* Option 4: Ayuda inmediata / SOS */}
              <button
                onClick={() => setShowEmergencyDetails(true)}
                className="flex items-start gap-4 p-4 rounded-xl border border-rose-300 bg-rose-50/60 hover:bg-rose-100/70 text-left transition-all group"
              >
                <div className="p-2.5 rounded-lg bg-rose-200 text-rose-800 group-hover:scale-105 transition-transform">
                  <AlertOctagon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-rose-800 text-sm flex items-center gap-1.5">
                    🆘 Necesito ayuda inmediata
                  </h4>
                  <p className="text-xs text-rose-700 mt-0.5">
                    Líneas de atención en crisis 24/7 y contactos institucionales de emergencia.
                  </p>
                </div>
              </button>
            </div>
          ) : (
            /* Emergency Contacts Section */
            <div className="my-6 space-y-4">
              <div className="p-3.5 bg-rose-100 text-rose-900 rounded-xl text-xs flex items-center gap-2 font-medium">
                <ShieldAlert className="w-5 h-5 shrink-0" />
                <span>
                  No estás solo. Si tú o alguien cercano está pasando por una crisis emocional o situación de riesgo, comunícate de inmediato:
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="p-3 bg-slate-50 border rounded-xl flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-800">Línea de la Vida (Nacional 24/7)</div>
                    <div className="text-slate-500">Atención psicológica gratuita y confidencial</div>
                  </div>
                  <a
                    href="tel:8009112000"
                    className="flex items-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold"
                  >
                    <Phone className="w-3.5 h-3.5" /> 800 911 2000
                  </a>
                </div>

                <div className="p-3 bg-slate-50 border rounded-xl flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-800">Número de Emergencias</div>
                    <div className="text-slate-500">Ambulancias, bomberos y policía</div>
                  </div>
                  <a
                    href="tel:911"
                    className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold"
                  >
                    <Phone className="w-3.5 h-3.5" /> 911
                  </a>
                </div>

                <div className="p-3 bg-slate-50 border rounded-xl flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-800">Módulo Escolar de Bienestar</div>
                    <div className="text-slate-500">Instituto Tecnológico Demo - Ext. 104</div>
                  </div>
                  <a
                    href="tel:+528009994357"
                    className="flex items-center gap-1 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold"
                  >
                    <Phone className="w-3.5 h-3.5" /> Ext. 104
                  </a>
                </div>
              </div>

              <button
                onClick={() => setShowEmergencyDetails(false)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                ← Volver a opciones de apoyo
              </button>
            </div>
          )}

          <div className="text-[11px] text-slate-400 text-center border-t pt-3">
            Mi Psicoloco es una plataforma de acompañamiento. En situaciones de riesgo médico o vital, recurre a servicios de urgencias.
          </div>
        </div>
      </div>

      <BreathingModal isOpen={showBreathing} onClose={() => setShowBreathing(false)} />
    </>
  );
};
