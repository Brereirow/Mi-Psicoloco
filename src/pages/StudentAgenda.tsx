import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Task, Subject } from '../types';
import {
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Sparkles,
  Filter,
  AlertCircle,
  Tag,
  Check,
  Edit2,
  Bell,
} from 'lucide-react';
import { StudyPlanModal } from '../components/StudyPlanModal';

export const StudentAgenda: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStudyPlanModal, setShowStudyPlanModal] = useState(false);
  const [selectedTaskForStudyPlan, setSelectedTaskForStudyPlan] = useState<Task | null>(null);

  // New task form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [type, setType] = useState<'task' | 'project' | 'exam' | 'personal'>('task');
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueTime, setDueTime] = useState('12:00');
  const [priority, setPriority] = useState<'alta' | 'media' | 'baja'>('media');
  const [hasReminder, setHasReminder] = useState(true);

  const loadData = async () => {
    try {
      const [tasksRes, subjectsRes] = await Promise.all([
        api.getStudentTasks(),
        api.getStudentSubjects(),
      ]);
      setTasks(tasksRes.tasks || []);
      setSubjects(subjectsRes.subjects || []);
      if (subjectsRes.subjects?.length > 0) {
        setSubjectId(subjectsRes.subjects[0].id);
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

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueDate) return;

    try {
      const res = await api.createStudentTask({
        title,
        description,
        subjectId,
        type,
        dueDate,
        dueTime,
        priority,
        hasReminder,
      });
      setShowCreateModal(false);
      setTitle('');
      setDescription('');
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleStatus = async (task: Task) => {
    const nextStatus = task.status === 'completada' ? 'pendiente' : 'completada';
    try {
      await api.updateStudentTask(task.id, { status: nextStatus });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta actividad?')) return;
    try {
      await api.deleteStudentTask(taskId);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (filterType !== 'all' && t.type !== filterType) return false;
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner and Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-teal-600" />
            <h1 className="text-xl font-bold text-slate-800">Mi Agenda Inteligente</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Organiza tus entregas, exámenes y sesiones de repaso con recordatorios preventivos.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Actividad</span>
        </button>
      </div>

      {/* Filter and Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-bold text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filtrar:
          </span>
          {['all', 'task', 'exam', 'project', 'personal'].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors capitalize ${
                filterType === t
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t === 'all' ? 'Todos los tipos' : t === 'task' ? 'Tareas' : t === 'exam' ? 'Exámenes' : t === 'project' ? 'Proyectos' : 'Personal'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-bold text-slate-500">Estado:</span>
          {['all', 'pendiente', 'completada'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors capitalize ${
                filterStatus === st
                  ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'all' ? 'Cualquiera' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Tasks Grid / Timeline */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs">Cargando actividades...</div>
      ) : filteredTasks.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-xs">
          <CalendarIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="font-bold text-slate-700 text-sm">No se encontraron actividades</h3>
          <p className="text-xs text-slate-400 mt-1">Crea tu primera tarea o examen haciendo clic en "Nueva Actividad".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map((task) => {
            const isCompleted = task.status === 'completada';
            return (
              <div
                key={task.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                  isCompleted
                    ? 'bg-slate-50/80 border-slate-200 opacity-75'
                    : task.priority === 'alta'
                    ? 'bg-white border-rose-200 shadow-xs ring-1 ring-rose-100'
                    : 'bg-white border-slate-200 shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md text-white"
                      style={{ backgroundColor: task.subjectColor || '#0D9488' }}
                    >
                      {task.subjectName || 'General'}
                    </span>

                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                        task.priority === 'alta'
                          ? 'bg-rose-100 text-rose-700'
                          : task.priority === 'media'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      Prioridad {task.priority}
                    </span>
                  </div>

                  <h3
                    className={`font-bold text-sm text-slate-800 ${
                      isCompleted ? 'line-through text-slate-400' : ''
                    }`}
                  >
                    {task.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{task.description}</p>

                  <div className="mt-4 flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {task.dueDate} a las {task.dueTime}
                    </span>
                    {task.hasReminder && (
                      <span className="flex items-center gap-1 text-[11px] text-teal-600 font-semibold" title="Recordatorio activo">
                        <Bell className="w-3 h-3" /> Recordatorio
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleToggleStatus(task)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                      isCompleted
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isCompleted ? 'Completada' : 'Marcar lista'}</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {task.type === 'exam' && !isCompleted && (
                      <button
                        onClick={() => {
                          setSelectedTaskForStudyPlan(task);
                          setShowStudyPlanModal(true);
                        }}
                        className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition-colors"
                        title="Crear Plan de Estudio"
                      >
                        <Sparkles className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Eliminar actividad"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Nueva Actividad */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Crear Nueva Actividad</h3>
            <p className="text-xs text-slate-500 mb-4">
              Agrega una tarea, examen o evento a tu agenda personal.
            </p>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Título de la actividad</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="Ej. Examen de Cálculo Parcial 2"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Descripción o instrucciones</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Temas, capítulos o material necesario..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Materia</label>
                  <select
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de actividad</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="task">Tarea</option>
                    <option value="exam">Examen</option>
                    <option value="project">Proyecto</option>
                    <option value="personal">Personal</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Fecha de entrega / examen</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hora límite</label>
                  <input
                    type="time"
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Prioridad</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="alta">Alta (Urgente)</option>
                    <option value="media">Media</option>
                    <option value="baja">Baja</option>
                  </select>
                </div>

                <div className="pt-5">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasReminder}
                      onChange={(e) => setHasReminder(e.target.checked)}
                      className="rounded-sm accent-teal-600"
                    />
                    <span>Activar recordatorio 48h antes</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs"
                >
                  Guardar en Agenda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <StudyPlanModal
        isOpen={showStudyPlanModal}
        onClose={() => setShowStudyPlanModal(false)}
        defaultTaskTitle={selectedTaskForStudyPlan?.title || 'Examen'}
        defaultExamDate={selectedTaskForStudyPlan?.dueDate || '2026-10-12'}
      />
    </div>
  );
};
