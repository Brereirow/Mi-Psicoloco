import React, { useState, useEffect } from 'react';
import { X, Play, RotateCcw, Heart, CheckCircle2 } from 'lucide-react';

interface BreathingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BreathingModal: React.FC<BreathingModalProps> = ({ isOpen, onClose }) => {
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale' | 'ready'>('ready');
  const [secondsLeft, setSecondsLeft] = useState<number>(4);
  const [cycle, setCycle] = useState<number>(1);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) {
      setIsRunning(false);
      setPhase('ready');
      setCycle(1);
      return;
    }
  }, [isOpen]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRunning) {
      timer = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            if (phase === 'ready' || phase === 'exhale') {
              setPhase('inhale');
              return 4;
            } else if (phase === 'inhale') {
              setPhase('hold');
              return 7;
            } else if (phase === 'hold') {
              setPhase('exhale');
              return 8;
            }
            return 4;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRunning, phase]);

  // Handle cycle count
  useEffect(() => {
    if (phase === 'exhale' && secondsLeft === 1) {
      setCycle((c) => Math.min(4, c + 1));
    }
  }, [phase, secondsLeft]);

  if (!isOpen) return null;

  const getInstructions = () => {
    switch (phase) {
      case 'inhale':
        return { title: 'Inhala suavemente', desc: 'Por la nariz, llenando el abdomen...', color: 'text-teal-600 bg-teal-50 border-teal-200' };
      case 'hold':
        return { title: 'Retén el aire', desc: 'Siente calma y estabilidad...', color: 'text-indigo-600 bg-indigo-50 border-indigo-200' };
      case 'exhale':
        return { title: 'Exhala despacio', desc: 'Por la boca, soltando toda la tensión...', color: 'text-blue-600 bg-blue-50 border-blue-200' };
      default:
        return { title: 'Preparado para respirar', desc: 'Presiona Iniciar para comenzar la técnica 4-7-8', color: 'text-slate-700 bg-slate-50 border-slate-200' };
    }
  };

  const info = getInstructions();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-slate-100 flex flex-col items-center text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <Heart className="w-5 h-5 text-teal-600" />
          <h3 className="text-lg font-bold text-slate-800">Técnica de Respiración 4-7-8</h3>
        </div>
        <p className="text-xs text-slate-500 mb-6">
          Reduce la frecuencia cardíaca, oxigena tu mente y disminuye la respuesta de estrés en 3 minutos.
        </p>

        {/* Circular breathing visualization */}
        <div className="relative w-56 h-56 flex items-center justify-center my-4">
          <div
            className={`absolute inset-0 rounded-full transition-all duration-1000 ease-in-out ${
              phase === 'inhale'
                ? 'scale-110 bg-teal-100 border-4 border-teal-400 opacity-90'
                : phase === 'hold'
                ? 'scale-110 bg-indigo-100 border-4 border-indigo-400 opacity-90 animate-pulse'
                : phase === 'exhale'
                ? 'scale-75 bg-blue-100 border-4 border-blue-400 opacity-70'
                : 'scale-90 bg-slate-100 border-2 border-dashed border-slate-300'
            }`}
          />

          <div className="relative z-10 flex flex-col items-center justify-center">
            {phase === 'ready' ? (
              <span className="text-3xl font-bold text-slate-700">4-7-8</span>
            ) : (
              <>
                <span className="text-5xl font-extrabold text-slate-800 font-mono">{secondsLeft}</span>
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500 mt-1">segundos</span>
              </>
            )}
          </div>
        </div>

        {/* Dynamic Instruction Pill */}
        <div className={`w-full py-3 px-4 rounded-xl border mb-6 transition-colors ${info.color}`}>
          <div className="font-semibold text-sm">{info.title}</div>
          <div className="text-xs mt-0.5 opacity-90">{info.desc}</div>
        </div>

        {/* Cycle indicator */}
        <div className="flex items-center gap-2 mb-6 text-xs text-slate-500">
          <span>Ciclo {cycle} de 4</span>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`w-2.5 h-2.5 rounded-full ${
                  i <= cycle ? 'bg-teal-600' : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3 w-full">
          {!isRunning ? (
            <button
              onClick={() => {
                setIsRunning(true);
                setPhase('inhale');
                setSecondsLeft(4);
              }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl shadow-xs transition-colors"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{phase === 'ready' ? 'Iniciar ejercicio' : 'Reanudar'}</span>
            </button>
          ) : (
            <button
              onClick={() => setIsRunning(false)}
              className="flex-1 py-2.5 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium rounded-xl transition-colors"
            >
              Pausar
            </button>
          )}

          <button
            onClick={() => {
              setIsRunning(false);
              setPhase('ready');
              setSecondsLeft(4);
              setCycle(1);
            }}
            title="Reiniciar"
            className="p-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
