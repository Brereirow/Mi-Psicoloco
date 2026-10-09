import React, { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Bot,
  Send,
  Sparkles,
  Heart,
  Brain,
  Calendar,
  LifeBuoy,
  ShieldAlert,
  AlertCircle,
  HelpCircle,
  RefreshCw,
} from 'lucide-react';
import { BreathingModal } from '../components/BreathingModal';
import { StudyPlanModal } from '../components/StudyPlanModal';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  quickActions?: string[];
  isCrisis?: boolean;
  timestamp: string;
}

interface StudentAIChatProps {
  onNavigateToCounseling?: () => void;
  onNavigateToAgenda?: () => void;
  onNavigateToEmotional?: () => void;
}

export const StudentAIChat: React.FC<StudentAIChatProps> = ({
  onNavigateToCounseling,
  onNavigateToAgenda,
  onNavigateToEmotional,
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `¡Hola ${user?.name?.split(' ')[0] || ''}! Soy Mi Psicoloco IA, tu asistente de bienestar y organización académica. ¿Cómo estuvo tu día? ¿Te gustaría que organicemos tus tareas pendientes o necesitas un momento para relajarte?`,
      quickActions: [
        'Organizar mis exámenes',
        'Ejercicio de respiración',
        'Hablar sobre cómo me siento',
        'Solicitar orientación',
      ],
      timestamp: 'Ahora',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [showBreathing, setShowBreathing] = useState(false);
  const [showStudyPlan, setShowStudyPlan] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || loading) return;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const history = messages.map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        text: m.text,
      }));

      const res = await api.askAI(text, history);

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: res.reply,
        quickActions: res.quickActions,
        isCrisis: res.isCrisis,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: 'Comprendo lo que me dices. Estoy aquí para escucharte y ayudarte a organizar tus pendientes académicos. ¿Te gustaría intentar una respiración guiada de 3 minutos?',
          quickActions: ['Ejercicio de respiración', 'Organizar mis exámenes', 'Solicitar orientación'],
          timestamp: 'Ahora',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (action: string) => {
    if (action.includes('respiración') || action === 'Ejercicio de respiración') {
      setShowBreathing(true);
    } else if (action.includes('exámenes') || action.includes('estudio') || action === 'Organizar mis exámenes') {
      setShowStudyPlan(true);
    } else if (action.includes('orientación') || action === 'Solicitar orientación') {
      if (onNavigateToCounseling) {
        onNavigateToCounseling();
      }
    } else if (action.includes('cómo me siento') || action === 'Hablar sobre cómo me siento') {
      handleSendMessage('Me gustaría hablar sobre cómo me siento con respecto a mis clases y la presión escolar.');
    } else {
      handleSendMessage(action);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] max-w-4xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Chat Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-slate-800 text-sm">Mi Psicoloco IA</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-teal-100 text-teal-800 rounded-full">
                Asistente Activo
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Bienestar emocional y organización de estudio</p>
          </div>
        </div>

        {/* Clear Disclaimer */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 rounded-lg text-[10px] text-amber-800 font-medium">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>Acompañamiento escolar • No es un psicólogo clínico ni emite diagnósticos</span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/40">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-teal-600 text-white rounded-tr-xs shadow-xs'
                  : 'bg-white text-slate-800 border border-slate-200 rounded-tl-xs shadow-xs'
              }`}
            >
              {m.text}

              {/* Crisis banner if triggered */}
              {m.isCrisis && (
                <div className="mt-3 p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-800">
                  <div className="font-bold mb-1 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>Estamos aquí contigo</span>
                  </div>
                  <p className="text-[11px] text-rose-700">
                    Por favor no estás solo. Puedes marcar en este instante a la Línea de la Vida (800 911 2000) o solicitar apoyo presencial con el personal del instituto.
                  </p>
                  {onNavigateToCounseling && (
                    <button
                      onClick={onNavigateToCounseling}
                      className="mt-2 w-full py-1.5 bg-rose-600 text-white font-bold rounded-lg text-xs"
                    >
                      Pedir apoyo humano inmediato
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Quick Action Interactive Buttons */}
            {m.quickActions && m.quickActions.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2 max-w-[85%]">
                {m.quickActions.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuickAction(action)}
                    className="text-xs font-semibold px-3 py-1.5 bg-white hover:bg-teal-50 text-teal-800 border border-teal-200 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <span>{action}</span>
                  </button>
                ))}
              </div>
            )}

            <span className="text-[10px] text-slate-400 mt-1 px-1">{m.timestamp}</span>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-2xl text-xs text-slate-500 w-fit">
            <Sparkles className="w-4 h-4 text-teal-600 animate-spin" />
            <span>Mi Psicoloco IA está pensando...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="p-3 sm:p-4 bg-white border-t border-slate-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Escribe lo que sientes o pide organizar tus materias..."
            className="flex-1 text-xs sm:text-sm p-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || loading}
            className="p-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl shadow-xs transition-colors flex items-center justify-center shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        <div className="text-[10px] text-slate-400 text-center mt-2">
          Mi Psicoloco IA promueve la organización y el autocuidado. En caso de crisis consulta la opción de ayuda inmediata.
        </div>
      </div>

      <BreathingModal isOpen={showBreathing} onClose={() => setShowBreathing(false)} />
      <StudyPlanModal
        isOpen={showStudyPlan}
        onClose={() => setShowStudyPlan(false)}
        defaultTaskTitle="Examen próximo"
      />
    </div>
  );
};
