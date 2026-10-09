import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { MoodType, EmotionalRecord } from '../types';
import { Heart, Lock, TrendingUp, Sparkles, MessageCircle, Calendar, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { BreathingModal } from '../components/BreathingModal';

interface StudentEmotionalProps {
  onNavigateToCounseling?: () => void;
  onNavigateToResources?: () => void;
}

export const StudentEmotional: React.FC<StudentEmotionalProps> = ({
  onNavigateToCounseling,
  onNavigateToResources,
}) => {
  const [records, setRecords] = useState<EmotionalRecord[]>([]);
  const [moodCounts, setMoodCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // Form
  const [selectedMood, setSelectedMood] = useState<MoodType>('normal');
  const [reasonCategory, setReasonCategory] = useState('Carga de estudio y exámenes');
  const [note, setNote] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showBreathing, setShowBreathing] = useState(false);

  const loadRecords = async () => {
    try {
      const data = await api.getEmotionalRecords();
      setRecords(data.records || []);
      setMoodCounts(data.moodCounts || {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.saveEmotionalRecord({
        mood: selectedMood,
        reasonCategory,
        note,
      });
      setSavedSuccess(true);
      setNote('');
      loadRecords();
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const moodsList: { type: MoodType; emoji: string; label: string; score: number }[] = [
    { type: 'muy_bien', emoji: '😊', label: 'Muy bien', score: 7 },
    { type: 'bien', emoji: '🙂', label: 'Bien', score: 6 },
    { type: 'normal', emoji: '😐', label: 'Normal', score: 5 },
    { type: 'preocupado', emoji: '😟', label: 'Preocupado', score: 4 },
    { type: 'estresado', emoji: '😣', label: 'Estresado', score: 3 },
    { type: 'triste', emoji: '😔', label: 'Triste', score: 2 },
    { type: 'enojado', emoji: '😡', label: 'Enojado', score: 1 },
  ];

  // Frequency analysis with respectful, non-clinical supportive wording
  const stressCount = (moodCounts['estresado'] || 0) + (moodCounts['preocupado'] || 0);
  const frequentStress = stressCount >= 2;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500" />
            <h1 className="text-xl font-bold text-slate-800">¿Cómo me siento?</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tu diario confidencial de bienestar emocional. Solo tú tienes acceso a estos registros.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600">
          <Lock className="w-4 h-4 text-teal-600" />
          <span>Privacidad Cifrada • No visible para docentes</span>
        </div>
      </div>

      {/* Supportive recommendation alert (Non-clinical wording) */}
      {frequentStress && (
        <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🌱</span>
            <div>
              <h4 className="text-xs font-bold text-teal-900 uppercase tracking-wider">Acompañamiento Preventivo</h4>
              <p className="text-xs text-teal-800 mt-0.5">
                Has registrado momentos de estrés frecuentemente en los últimos días. Recuerda que no tienes que sobrellevarlo todo solo; puedes consultar nuestros recursos de bienestar o solicitar orientación con el equipo de psicólogos escolares.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowBreathing(true)}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              Pausa de respiración
            </button>
            {onNavigateToCounseling && (
              <button
                onClick={onNavigateToCounseling}
                className="px-3 py-1.5 bg-white border border-teal-300 text-teal-800 hover:bg-teal-100 font-bold text-xs rounded-xl transition-colors"
              >
                Solicitar orientación
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Grid: Form on Left, Evolution Visual on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <h2 className="text-sm font-bold text-slate-800 mb-1">Registrar mi estado actual</h2>
          <p className="text-xs text-slate-500 mb-4">¿Cómo transcurre tu jornada académica hoy?</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Mood selector buttons */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Selecciona tu emoción</label>
              <div className="grid grid-cols-2 gap-2">
                {moodsList.map((m) => (
                  <button
                    key={m.type}
                    type="button"
                    onClick={() => setSelectedMood(m.type)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs transition-all ${
                      selectedMood === m.type
                        ? 'bg-teal-50 border-teal-500 font-bold text-teal-800 ring-2 ring-teal-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-xl">{m.emoji}</span>
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Motivo principal (Opcional)</label>
              <select
                value={reasonCategory}
                onChange={(e) => setReasonCategory(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              >
                <option value="Carga de estudio y exámenes">Carga de estudio y exámenes</option>
                <option value="Organización del tiempo">Organización del tiempo y entregas</option>
                <option value="Comprensión de temas difíciles">Comprensión de temas difíciles</option>
                <option value="Relaciones o trabajo en equipo">Relaciones o trabajo en equipo</option>
                <option value="Cansancio físico y sueño">Cansancio físico y sueño</option>
                <option value="Motivos personales">Motivos personales</option>
                <option value="¡Todo fluye muy bien!">¡Todo fluye muy bien!</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nota personal o desahogo (Privado)</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Escribe lo que sientes, por ejemplo: 'Hoy me siento estresado porque tengo tres exámenes y no sé por dónde empezar...'"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Guardar registro confidencial</span>
            </button>

            {savedSuccess && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-semibold text-center">
                ¡Tu estado anímico ha sido registrado con éxito!
              </div>
            )}
          </form>
        </div>

        {/* Evolution Chart & History List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Visual Evolution Bars */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Evolución de tu Estado Emocional</h3>
                <p className="text-xs text-slate-500">Historial reciente de bienestar</p>
              </div>
              <span className="text-[11px] font-bold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-lg">
                Confidencial
              </span>
            </div>

            {/* Custom Bar Graph */}
            <div className="h-44 flex items-end justify-between gap-2 pt-6 px-2 border-b border-slate-200">
              {records.slice(0, 7).reverse().map((rec, i) => {
                const heightPercent = Math.max(15, (rec.moodScore / 7) * 100);
                const moodObj = moodsList.find((m) => m.type === rec.mood);
                return (
                  <div key={rec.id} className="flex-1 flex flex-col items-center gap-2 group">
                    <span className="text-lg group-hover:scale-125 transition-transform">{moodObj?.emoji || '😐'}</span>
                    <div
                      className="w-full max-w-[36px] bg-gradient-to-t from-teal-600 to-teal-400 rounded-t-lg transition-all duration-300 group-hover:brightness-110"
                      style={{ height: `${heightPercent}%` }}
                    />
                    <span className="text-[10px] font-semibold text-slate-400 truncate">{rec.date.slice(5)}</span>
                  </div>
                );
              })}
            </div>
            <div className="text-[11px] text-slate-400 mt-2 text-center">
              Eje vertical: Nivel de bienestar percibido (1 a 7) • Eje horizontal: Fecha de registro
            </div>
          </div>

          {/* Historical Logs List */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="text-sm font-bold text-slate-800 mb-3">Tus notas anteriores</h3>
            <div className="space-y-3">
              {records.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">Aún no tienes registros guardados.</p>
              ) : (
                records.map((r) => {
                  const m = moodsList.find((item) => item.type === r.mood);
                  return (
                    <div key={r.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{m?.emoji}</span>
                          <span className="font-bold text-slate-800">{m?.label}</span>
                          {r.reasonCategory && (
                            <span className="text-[11px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md font-medium">
                              {r.reasonCategory}
                            </span>
                          )}
                        </div>
                        <span className="text-slate-400 text-[11px] font-semibold">{r.date}</span>
                      </div>
                      {r.note && <p className="text-slate-600 mt-1 pl-7 italic">"{r.note}"</p>}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      <BreathingModal isOpen={showBreathing} onClose={() => setShowBreathing(false)} />
    </div>
  );
};
