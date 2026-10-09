import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Award, TrendingUp, CheckCircle, AlertCircle, BarChart2 } from 'lucide-react';

export const StudentGrades: React.FC = () => {
  const [gradesData, setGradesData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getStudentGrades()
      .then((res) => setGradesData(res))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-slate-400 text-xs">Cargando calificaciones...</div>;
  }

  const overallAvg = Number(gradesData?.overallAverage) || 89.5;

  return (
    <div className="space-y-6">
      {/* Top Banner & GPA Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-teal-600" />
              <h1 className="text-xl font-bold text-slate-800">Boleta y Calificaciones</h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Desglose detallado de tareas, prácticas y exámenes parciales por asignatura.
            </p>
          </div>

          <div className="mt-4 p-4 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-teal-800">Estatus Académico:</span>
              <div className="text-sm font-bold text-teal-900">Alumno Regular • Sin materias en riesgo</div>
            </div>
            <span className="px-3 py-1 bg-teal-600 text-white font-bold text-xs rounded-lg">
              Aprobado
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-teal-700 to-indigo-800 text-white p-6 rounded-2xl shadow-md flex flex-col items-center justify-center text-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-teal-200">Promedio Ponderado</span>
          <div className="text-5xl font-black mt-2 tracking-tight">{gradesData?.overallAverage || '90.0'}</div>
          <div className="text-xs text-teal-100 mt-2 flex items-center gap-1 font-medium">
            <TrendingUp className="w-4 h-4 text-emerald-300" /> Rendimiento Satisfactorio
          </div>
        </div>
      </div>

      {/* Subjects breakdown */}
      <div className="space-y-5">
        {gradesData?.subjects?.map((subj: any) => {
          const avgNum = Number(subj.average) || 0;
          return (
            <div key={subj.subjectId} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-3.5 h-3.5 rounded-full"
                    style={{ backgroundColor: subj.color || '#0D9488' }}
                  />
                  <h3 className="text-base font-bold text-slate-800">{subj.subjectName}</h3>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xs text-slate-400">Promedio de materia:</span>
                    <span className="ml-2 text-sm font-black text-teal-700">{subj.average}</span>
                  </div>

                  {/* Progress bar visual */}
                  <div className="w-24 bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-teal-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, avgNum))}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Evaluations list */}
              <div className="mt-4 space-y-2.5">
                {subj.evaluations && subj.evaluations.length > 0 ? (
                  subj.evaluations.map((evalItem: any) => (
                    <div
                      key={evalItem.id}
                      className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-800">{evalItem.evaluationName}</div>
                        {evalItem.feedback && (
                          <p className="text-[11px] text-teal-700 mt-0.5 font-medium italic">
                            💬 Retroalimentación del docente: "{evalItem.feedback}"
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <span className="text-slate-400 text-[11px]">{evalItem.date}</span>
                        <div className="px-3 py-1 bg-white border border-slate-200 rounded-lg font-mono font-bold text-slate-800">
                          {evalItem.score} <span className="text-slate-400 font-normal">/ {evalItem.maxScore}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 py-3 text-center">
                    Aún no se han asentado evaluaciones para esta materia en el sistema.
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
