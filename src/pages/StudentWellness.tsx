import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { WellnessResource } from '../types';
import {
  Compass,
  Clock,
  BookOpen,
  Sparkles,
  Filter,
  CheckCircle,
  X,
  Play,
  Heart,
} from 'lucide-react';
import { BreathingModal } from '../components/BreathingModal';

export const StudentWellness: React.FC = () => {
  const [resources, setResources] = useState<WellnessResource[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [selectedResource, setSelectedResource] = useState<WellnessResource | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBreathing, setShowBreathing] = useState(false);

  const categories = [
    'Todos',
    'Estrés',
    'Ansiedad',
    'Organización',
    'Concentración',
    'Respiración',
    'Relajación',
    'Exámenes',
    'Descanso',
    'Manejo del tiempo',
  ];

  const fetchResources = async (cat: string) => {
    setLoading(true);
    try {
      const res = await api.getWellnessResources(cat === 'Todos' ? undefined : cat);
      setResources(res.resources || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources(selectedCategory);
  }, [selectedCategory]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-teal-600" />
            <h1 className="text-xl font-bold text-slate-800">Recursos de Bienestar & Guías Prácticas</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Herramientas psicoeducativas, técnicas de concentración y métodos de manejo del tiempo comprobados.
          </p>
        </div>

        <button
          onClick={() => setShowBreathing(true)}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Respiración 4-7-8 Guiada</span>
        </button>
      </div>

      {/* Category Filter Chips */}
      <div className="flex flex-wrap gap-1.5 p-2 bg-white rounded-2xl border border-slate-200">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              selectedCategory === cat
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Resource Cards Grid */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs">Cargando biblioteca de bienestar...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {resources.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-teal-400 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200">
                    {item.category}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {item.durationMinutes} min
                  </span>
                </div>

                <h3 className="font-bold text-sm text-slate-800 mt-1">{item.title}</h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed line-clamp-3">{item.summary}</p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setSelectedResource(item)}
                  className="w-full py-2 bg-slate-50 hover:bg-teal-50 text-teal-800 font-bold text-xs rounded-xl border border-slate-200 hover:border-teal-300 transition-colors flex items-center justify-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Abrir guía completa</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Resource Step-by-Step Reader Modal */}
      {selectedResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl p-6 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedResource(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-teal-100 text-teal-800">
                {selectedResource.category}
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Lectura: {selectedResource.durationMinutes} minutos
              </span>
            </div>

            <h3 className="text-xl font-bold text-slate-800">{selectedResource.title}</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">{selectedResource.content}</p>

            {/* Steps */}
            <div className="mt-5 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                Pasos a seguir:
              </h4>
              <div className="space-y-2.5">
                {selectedResource.steps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <span className="w-5 h-5 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">
                      {idx + 1}
                    </span>
                    <span className="text-slate-700 leading-relaxed">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedResource(null)}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      <BreathingModal isOpen={showBreathing} onClose={() => setShowBreathing(false)} />
    </div>
  );
};
