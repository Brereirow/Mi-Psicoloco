import React, { useState } from 'react';
import { X, ShieldCheck, Star, Send, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

interface AnonymousEvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: Array<{ id: string; name: string; teacherId: string; teacherName?: string }>;
}

export const AnonymousEvaluationModal: React.FC<AnonymousEvaluationModalProps> = ({
  isOpen,
  onClose,
  subjects,
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState(subjects[0]?.id || 'subj-1');
  const [clarity, setClarity] = useState(85);
  const [organization, setOrganization] = useState(85);
  const [communication, setCommunication] = useState(85);
  const [treatment, setTreatment] = useState(90);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const currentSubject = subjects.find((s) => s.id === selectedSubjectId) || subjects[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.submitAnonymousEvaluation({
        subjectId: currentSubject.id,
        teacherId: currentSubject.teacherId || 'usr-teacher-1',
        clarity,
        organization,
        communication,
        treatment,
        comment,
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 border border-slate-100 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-2">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Evaluación Docente Anónima</h3>
            <p className="text-xs text-slate-500">
              Tu identidad está 100% protegida. Solo se envían promedios agregados.
            </p>
          </div>
        </div>

        {submitted ? (
          <div className="my-8 p-6 bg-teal-50 border border-teal-200 rounded-xl flex flex-col items-center text-center">
            <CheckCircle2 className="w-10 h-10 text-teal-600 mb-2" />
            <h4 className="font-bold text-teal-800">Evaluación Anónima Enviada</h4>
            <p className="text-xs text-teal-700 mt-1">
              Gracias por contribuir a la mejora continua y calidad académica de nuestra institución.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Selecciona la Materia / Docente</label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — {s.teacherName || 'Docente'}
                  </option>
                ))}
              </select>
            </div>

            {/* Sliders */}
            <div className="space-y-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Claridad en explicaciones</span>
                  <span className="font-bold text-teal-600">{clarity}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={clarity}
                  onChange={(e) => setClarity(Number(e.target.value))}
                  className="w-full accent-teal-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Organización y puntualidad</span>
                  <span className="font-bold text-teal-600">{organization}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={organization}
                  onChange={(e) => setOrganization(Number(e.target.value))}
                  className="w-full accent-teal-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Comunicación y resolución de dudas</span>
                  <span className="font-bold text-teal-600">{communication}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={communication}
                  onChange={(e) => setCommunication(Number(e.target.value))}
                  className="w-full accent-teal-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Trato respetuoso y ambiente de aula</span>
                  <span className="font-bold text-teal-600">{treatment}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={treatment}
                  onChange={(e) => setTreatment(Number(e.target.value))}
                  className="w-full accent-teal-600 cursor-pointer"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Comentario constructivo (Opcional)</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder="Comparte sugerencias respetuosas sobre métodos de enseñanza o dinámicas de clase..."
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>{loading ? 'Enviando confidencialmente...' : 'Enviar Evaluación Anónima'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
