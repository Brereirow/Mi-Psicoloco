import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Subject } from '../types';
import { BookOpen, User, Clock, MapPin, CheckSquare, Award, AlertCircle } from 'lucide-react';
import { AnonymousEvaluationModal } from '../components/AnonymousEvaluationModal';

export const StudentSubjects: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEvalModal, setShowEvalModal] = useState(false);

  useEffect(() => {
    api
      .getStudentSubjects()
      .then((res) => setSubjects(res.subjects || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-teal-600" />
            <h1 className="text-xl font-bold text-slate-800">Mis Materias</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Consulta los profesores asignados, horarios de clase, actividades en curso y evaluaciones.
          </p>
        </div>

        <button
          onClick={() => setShowEvalModal(true)}
          className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2"
        >
          <span>⭐ Evaluar a mis Docentes (Anónimo)</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs">Cargando materias...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {subjects.map((subj) => (
            <div
              key={subj.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3.5 h-3.5 rounded-full"
                      style={{ backgroundColor: subj.color || '#0D9488' }}
                    />
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{subj.code}</span>
                  </div>
                  <span className="text-xs font-extrabold px-2.5 py-1 bg-teal-50 text-teal-800 border border-teal-200 rounded-lg">
                    Promedio: {subj.averageGrade}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-800">{subj.name}</h3>

                <div className="mt-4 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="font-semibold text-slate-800">{subj.teacherName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{subj.schedule}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{subj.classroom}</span>
                  </div>
                </div>

                {/* Subj activities preview */}
                <div className="mt-5 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
                    <span>Actividades asignadas</span>
                    <span className="text-teal-600 font-semibold">{subj.tasksCount} registradas</span>
                  </div>

                  {subj.grades && subj.grades.length > 0 ? (
                    <div className="space-y-1.5 mt-2">
                      {subj.grades.slice(0, 2).map((g) => (
                        <div key={g.id} className="p-2 bg-slate-50 rounded-lg flex items-center justify-between text-xs">
                          <span className="text-slate-600 truncate">{g.evaluationName}</span>
                          <span className="font-bold text-teal-700">{g.score}/{g.maxScore}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">Sin calificaciones recientes en este corte.</p>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Grupo 3°A • Semestre 3</span>
                <span className="text-[11px] font-bold text-teal-600">Instituto Tecnológico</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <AnonymousEvaluationModal
        isOpen={showEvalModal}
        onClose={() => setShowEvalModal(false)}
        subjects={subjects}
      />
    </div>
  );
};
