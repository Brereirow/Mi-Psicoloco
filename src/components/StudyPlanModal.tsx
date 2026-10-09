import React, { useState } from 'react';
import { X, Calendar, Clock, BookOpen, Sparkles, Check, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

interface StudyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTaskTitle?: string;
  defaultExamDate?: string;
  onPlanGenerated?: (plan: any) => void;
}

export const StudyPlanModal: React.FC<StudyPlanModalProps> = ({
  isOpen,
  onClose,
  defaultTaskTitle = 'Examen de Matemáticas III',
  defaultExamDate = '2026-10-12',
  onPlanGenerated,
}) => {
  const [taskTitle, setTaskTitle] = useState(defaultTaskTitle);
  const [examDate, setExamDate] = useState(defaultExamDate);
  const [availableHours, setAvailableHours] = useState(2);
  const [focusTopics, setFocusTopics] = useState('Derivadas, razones de cambio e integrales');
  const [loading, setLoading] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<any | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.generateStudyPlan({
        taskTitle,
        examDate,
        availableHoursPerDay: availableHours,
        focusTopics,
      });
      setGeneratedPlan(res.studyPlan);
      if (onPlanGenerated) {
        onPlanGenerated(res.studyPlan);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl p-6 border border-slate-100 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-2">
          <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Generador de Plan de Estudio Inteligente</h3>
            <p className="text-xs text-slate-500">Distribuye tus sesiones sin saturarte y con pausas activas</p>
          </div>
        </div>

        {!generatedPlan ? (
          <form onSubmit={handleGenerate} className="space-y-4 mt-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Actividad o Examen a preparar</label>
              <input
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                required
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                placeholder="Ej. Examen de Cálculo, Proyecto de Física..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Fecha de la evaluación</label>
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  required
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Horas disponibles por día</label>
                <select
                  value={availableHours}
                  onChange={(e) => setAvailableHours(Number(e.target.value))}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                >
                  <option value={1}>1 hora diaria (repaso ligero)</option>
                  <option value={2}>2 horas diarias (recomendado)</option>
                  <option value={3}>3 horas diarias (intensivo)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Temas prioritarios o dudas</label>
              <textarea
                value={focusTopics}
                onChange={(e) => setFocusTopics(e.target.value)}
                rows={2}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                placeholder="Ej. Derivadas, leyes de Newton, fórmulas clave..."
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span>Generando plan con IA...</span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Crear Plan de Estudio Equilibrado</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-teal-800 uppercase tracking-wider">Plan Estructurado</span>
                <span className="text-xs font-semibold px-2 py-0.5 bg-teal-200 text-teal-900 rounded-md">
                  {generatedPlan.totalDays} sesiones programadas
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-800 mt-1">{generatedPlan.title}</h4>
            </div>

            <div className="space-y-2.5">
              {generatedPlan.sessions?.map((session: any, idx: number) => (
                <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-800">{session.day}</span>
                    <span className="text-[11px] font-bold text-teal-700 bg-teal-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {session.durationMinutes} minutos
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{session.focus}</p>
                </div>
              ))}
            </div>

            {generatedPlan.wellnessTip && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                <span className="text-base">💡</span>
                <div>
                  <span className="font-bold">Consejo de bienestar: </span>
                  {generatedPlan.wellnessTip}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setGeneratedPlan(null)}
                className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Ajustar parámetros
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Aplicar a mi agenda</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
