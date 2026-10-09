import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { MoodType, Task } from '../types';
import {
  Sparkles,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Heart,
  Bot,
  Brain,
  Award,
  ArrowRight,
  TrendingUp,
  Smile,
  Meh,
  Frown,
  Flame,
} from 'lucide-react';
import { BreathingModal } from '../components/BreathingModal';
import { StudyPlanModal } from '../components/StudyPlanModal';

interface StudentDashboardProps {
  onNavigate: (tab: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [moodReason, setMoodReason] = useState('');
  const [moodSaved, setMoodSaved] = useState(false);
  const [showBreathing, setShowBreathing] = useState(false);
  const [showStudyPlan, setShowStudyPlan] = useState(false);
  const [studyPlanTarget, setStudyPlanTarget] = useState<Task | null>(null);

  const fetchDashboard = async () => {
    try {
      const data = await api.getStudentDashboard();
      setDashboardData(data);
      if (data.todayEmotionalRecord) {
        setSelectedMood(data.todayEmotionalRecord.mood);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleSelectMood = async (mood: MoodType) => {
    setSelectedMood(mood);
    try {
      await api.saveEmotionalRecord({
        mood,
        reasonCategory: moodReason || 'Registro diario',
      });
      setMoodSaved(true);
      fetchDashboard();
      setTimeout(() => setMoodSaved(false), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  const moods: { type: MoodType; emoji: string; label: string; color: string }[] = [
    { type: 'muy_bien', emoji: '😊', label: 'Muy bien', color: 'hover:bg-emerald-50 text-emerald-700 border-emerald-200' },
    { type: 'bien', emoji: '🙂', label: 'Bien', color: 'hover:bg-teal-50 text-teal-700 border-teal-200' },
    { type: 'normal', emoji: '😐', label: 'Normal', color: 'hover:bg-slate-50 text-slate-700 border-slate-200' },
    { type: 'preocupado', emoji: '😟', label: 'Preocupado', color: 'hover:bg-amber-50 text-amber-700 border-amber-200' },
    { type: 'estresado', emoji: '😣', label: 'Estresado', color: 'hover:bg-orange-50 text-orange-700 border-orange-200' },
    { type: 'triste', emoji: '😔', label: 'Triste', color: 'hover:bg-blue-50 text-blue-700 border-blue-200' },
    { type: 'enojado', emoji: '😡', label: 'Enojado', color: 'hover:bg-rose-50 text-rose-700 border-rose-200' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  const upcomingExam = dashboardData?.upcomingExams?.[0];

  return (
    <div className="space-y-6">
      {/* Personalized Welcome Header */}
      <div className="bg-gradient-to-r from-teal-700 via-teal-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Semestre Activo 2026-2027</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Hola, {user?.name?.split(' ')[0] || 'Carlos'} 👋
          </h1>
          <p className="text-sm text-teal-100 mt-1 leading-relaxed">
            Tu espacio personal para organizar tus materias, dar seguimiento a tus metas y cuidar tu bienestar emocional día a día.
          </p>
        </div>

        {/* Floating background ornament */}
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Mood Tracker Widget: "¿Cómo te sientes hoy?" */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500" />
            <h2 className="text-base font-bold text-slate-800">¿Cómo te sientes hoy?</h2>
          </div>
          {dashboardData?.todayEmotionalRecord ? (
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-teal-50 text-teal-700 border border-teal-200 rounded-full">
              ✓ Registrado hoy
            </span>
          ) : (
            <span className="text-[11px] text-slate-400">Tu registro es 100% privado</span>
          )}
        </div>

        <p className="text-xs text-slate-500 mb-4">
          Monitorear tus emociones te ayuda a detectar sobrecarga a tiempo. Solo tú tienes acceso a estos registros.
        </p>

        {/* Emotion Selector Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
          {moods.map((m) => {
            const isSelected = selectedMood === m.type;
            return (
              <button
                key={m.type}
                onClick={() => handleSelectMood(m.type)}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${
                  isSelected
                    ? 'bg-teal-50 border-teal-500 text-teal-800 ring-2 ring-teal-500/30 scale-102 shadow-xs'
                    : `bg-slate-50/70 ${m.color} border-slate-200/80`
                }`}
              >
                <span className="text-2xl mb-1">{m.emoji}</span>
                <span className="text-xs font-bold leading-tight">{m.label}</span>
              </button>
            );
          })}
        </div>

        {moodSaved && (
          <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>¡Registro guardado confidencialmente! Recuerda tomar descansos regulares.</span>
          </div>
        )}
      </div>

      {/* Intelligent Upcoming Exam & Study Plan Alert */}
      {upcomingExam && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800">Próxima Evaluación</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 bg-amber-200 text-amber-900 rounded-md">
                  Fecha: {upcomingExam.dueDate}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-800 mt-1">{upcomingExam.title}</h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Dividir tu estudio en sesiones espaciadas reduce la fatiga mental y mejora la retención un 35%.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setStudyPlanTarget(upcomingExam);
              setShowStudyPlan(true);
            }}
            className="w-full md:w-auto px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>¿Quieres crear un plan de estudio?</span>
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold">Promedio General</div>
          <div className="text-2xl font-extrabold text-teal-700 mt-1">{dashboardData?.avgGrade || '90.0'}</div>
          <div className="text-[11px] text-teal-600 font-medium flex items-center gap-1 mt-1">
            <TrendingUp className="w-3.5 h-3.5" /> Buen rendimiento
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold">Tareas Pendientes</div>
          <div className="text-2xl font-extrabold text-slate-800 mt-1">{dashboardData?.counts?.pending || 0}</div>
          <div className="text-[11px] text-slate-500 mt-1">Por entregar esta semana</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold">Actividades Completadas</div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">{dashboardData?.counts?.completed || 0}</div>
          <div className="text-[11px] text-emerald-700 mt-1">Buen progreso acumulado</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold">Citas y Asesorías</div>
          <div className="text-2xl font-extrabold text-indigo-600 mt-1">{dashboardData?.appointments?.length || 0}</div>
          <div className="text-[11px] text-indigo-700 mt-1">Agendadas con el plantel</div>
        </div>
      </div>

      {/* Split Section: Upcoming Activities & Wellness/AI Quick Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 cols: Próximas Entregas y Exámenes */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-slate-800 text-sm">Próximamente en tu agenda</h3>
              </div>
              <button
                onClick={() => onNavigate('agenda')}
                className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1"
              >
                <span>Ver calendario completo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {dashboardData?.nextTasks?.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No tienes tareas pendientes urgentes.</p>
              ) : (
                dashboardData?.nextTasks?.map((task: Task) => (
                  <div
                    key={task.id}
                    className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                          task.priority === 'alta'
                            ? 'bg-rose-500'
                            : task.priority === 'media'
                            ? 'bg-amber-500'
                            : 'bg-blue-500'
                        }`}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-800">{task.title}</span>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.2 rounded-md bg-slate-200 text-slate-700">
                            {task.type}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{task.description}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-slate-700">{task.dueDate}</div>
                      <div className="text-[10px] text-slate-400">{task.dueTime}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right 1 col: Quick Access Cards (IA, Breathing, Counseling) */}
        <div className="space-y-4">
          {/* Card 1: Mi Psicoloco IA */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="p-2 bg-indigo-600 text-white rounded-xl">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-800">Mi Psicoloco IA</h4>
                <p className="text-[11px] text-slate-500">Asistente personal 24/7</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              ¿Te sientes abrumado con tus materias? Pide ayuda para ordenar tus prioridades o crear un plan de estudio.
            </p>
            <button
              onClick={() => onNavigate('ai-chat')}
              className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <span>Abrir conversación</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 2: Pausa Rápida Respiración */}
          <div className="bg-teal-50/70 border border-teal-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="p-2 bg-teal-600 text-white rounded-xl">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-800">Pausa de Respiración 4-7-8</h4>
                <p className="text-[11px] text-teal-700">3 minutos guiados</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              Regula tu nivel de cortisol antes de estudiar o presentar un examen.
            </p>
            <button
              onClick={() => setShowBreathing(true)}
              className="w-full py-2 px-3 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Comenzar ahora</span>
            </button>
          </div>
        </div>
      </div>

      <BreathingModal isOpen={showBreathing} onClose={() => setShowBreathing(false)} />
      <StudyPlanModal
        isOpen={showStudyPlan}
        onClose={() => setShowStudyPlan(false)}
        defaultTaskTitle={studyPlanTarget?.title || 'Examen de Matemáticas'}
        defaultExamDate={studyPlanTarget?.dueDate || '2026-10-12'}
      />
    </div>
  );
};
