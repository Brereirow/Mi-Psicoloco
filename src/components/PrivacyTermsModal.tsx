import React from 'react';
import { X, ShieldCheck, Lock, FileText, CheckCircle } from 'lucide-react';

interface PrivacyTermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'privacy' | 'terms';
}

export const PrivacyTermsModal: React.FC<PrivacyTermsModalProps> = ({ isOpen, onClose, type }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-6 border border-slate-100 max-h-[85vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
            {type === 'privacy' ? <Lock className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              {type === 'privacy' ? 'Aviso de Privacidad Integral' : 'Términos y Condiciones del Servicio'}
            </h3>
            <p className="text-xs text-slate-500">Mi Psicoloco • Plataforma Institucional de Acompañamiento</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 text-xs text-slate-600 pr-2 leading-relaxed">
          {type === 'privacy' ? (
            <>
              <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl text-teal-900 font-medium">
                🛡️ En Mi Psicoloco, tus registros emocionales y notas de bienestar son estrictamente privadas. Los docentes NUNCA tienen acceso a tu estado de ánimo ni a conversaciones con el asistente.
              </div>

              <h4 className="font-bold text-slate-800 text-sm">1. Responsable del Tratamiento de Datos</h4>
              <p>
                El Instituto Tecnológico Demo y la plataforma tecnológica "Mi Psicoloco" son los responsables del resguardo confidencial de los datos personales, académicos y de bienestar emocional recabados voluntariamente en esta plataforma.
              </p>

              <h4 className="font-bold text-slate-800 text-sm">2. Finalidad del Tratamiento</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>Gestión de actividades académicas, tareas, exámenes, horarios y calificaciones.</li>
                <li>Monitoreo voluntario del bienestar escolar para brindar recursos de afrontamiento al estrés.</li>
                <li>Canalización ética y consentida hacia orientadores o psicólogos del plantel cuando el estudiante lo solicite.</li>
              </ul>

              <h4 className="font-bold text-slate-800 text-sm">3. No Diagnóstico Clínico</h4>
              <p>
                Los algoritmos de inteligencia artificial ("Mi Psicoloco IA") y los módulos de registro emocional NO emiten diagnósticos psiquiátricos ni psicológicos clínicos. Su función es exclusivamente de acompañamiento, psicoeducación y organización.
              </p>

              <h4 className="font-bold text-slate-800 text-sm">4. Evaluaciones Docentes Anónimas</h4>
              <p>
                Las valoraciones emitidas hacia docentes se procesan de forma agregada e irreversiblemente disociada de tu cuenta de usuario, garantizando plena confidencialidad.
              </p>
            </>
          ) : (
            <>
              <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl text-indigo-900 font-medium">
                📜 Al utilizar Mi Psicoloco, aceptas hacer un uso respetuoso y constructivo de las herramientas comunitarias, chats y servicios escolares.
              </div>

              <h4 className="font-bold text-slate-800 text-sm">1. Propósito de la Plataforma</h4>
              <p>
                "Mi Psicoloco" es una herramienta complementaria para estudiantes, educadores y orientadores con el fin de facilitar la transición educativa y el bienestar integral.
              </p>

              <h4 className="font-bold text-slate-800 text-sm">2. Servicios de Emergencia</h4>
              <p>
                La plataforma no sustituye los servicios de atención médica de urgencia. En caso de una emergencia de salud o riesgo físico inmediato, los usuarios deben acudir a los números de emergencia oficiales (911 / Línea de la Vida 800 911 2000).
              </p>

              <h4 className="font-bold text-slate-800 text-sm">3. Uso Aceptable</h4>
              <p>
                Queda prohibido el uso de la plataforma para acoso, publicación de contenido difamatorio o intentos de vulnerar los controles de acceso institucionales.
              </p>
            </>
          )}
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl transition-colors"
          >
            Entendido y Acepto
          </button>
        </div>
      </div>
    </div>
  );
};
