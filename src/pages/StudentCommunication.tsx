import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { GroupMessage, Announcement } from '../types';
import { MessageSquare, Bell, Send, ShieldCheck, User, Sparkles } from 'lucide-react';
import { AnonymousEvaluationModal } from '../components/AnonymousEvaluationModal';

export const StudentCommunication: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'messages' | 'announcements'>('messages');
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [newMsgText, setNewMsgText] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('subj-1');
  const [showEvalModal, setShowEvalModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [msgRes, ancRes] = await Promise.all([
        api.getGroupMessages(selectedSubjectId),
        api.getAnnouncements(),
      ]);
      setMessages(msgRes.messages || []);
      setAnnouncements(ancRes.announcements || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedSubjectId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsgText.trim()) return;

    try {
      await api.sendGroupMessage(selectedSubjectId, newMsgText);
      setNewMsgText('');
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-teal-600" />
            <h1 className="text-xl font-bold text-slate-800">Comunicación & Avisos Escolares</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Espacio de diálogo para dudas de clase con tus profesores y avisos oficiales de la dirección.
          </p>
        </div>

        <button
          onClick={() => setShowEvalModal(true)}
          className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Evaluación Anónima de Docente</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('messages')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'messages'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Chat de Clase (Grupo 3°A)</span>
        </button>

        <button
          onClick={() => setActiveTab('announcements')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'announcements'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Tablón de Avisos Institucionales</span>
        </button>
      </div>

      {/* Tab 1: Group Messages */}
      {activeTab === 'messages' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col h-[550px] overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-slate-700">Materia:</span>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="text-xs p-1.5 rounded-lg border border-slate-300 font-semibold text-slate-800"
              >
                <option value="subj-1">Matemáticas III (Cálculo) - Prof. Roberto Silva</option>
                <option value="subj-2">Física General - Prof. Roberto Silva</option>
                <option value="subj-3">Historia Contemporánea</option>
              </select>
            </div>
            <span className="text-[11px] text-slate-400">Canal Académico Moderado</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
            {messages.length === 0 ? (
              <p className="text-xs text-slate-400 py-12 text-center">No hay mensajes en este canal aún.</p>
            ) : (
              messages.map((m) => {
                const isMe = m.senderId === user?.id;
                const isTeacher = m.senderRole === 'teacher';
                return (
                  <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-1.5 mb-1 px-1">
                      <span className="text-[11px] font-bold text-slate-700">{m.senderName}</span>
                      {isTeacher && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded-sm">
                          DOCENTE
                        </span>
                      )}
                    </div>
                    <div
                      className={`max-w-[80%] p-3 rounded-2xl text-xs ${
                        isMe
                          ? 'bg-teal-600 text-white rounded-tr-xs'
                          : isTeacher
                          ? 'bg-blue-50 text-slate-800 border border-blue-200 rounded-tl-xs'
                          : 'bg-white text-slate-800 border border-slate-200 rounded-tl-xs'
                      }`}
                    >
                      {m.content}
                    </div>
                    <span className="text-[9px] text-slate-400 mt-1 px-1">
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 bg-white flex gap-2">
            <input
              type="text"
              value={newMsgText}
              onChange={(e) => setNewMsgText(e.target.value)}
              placeholder="Escribe una pregunta para el docente o compañeros..."
              className="flex-1 text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
            />
            <button
              type="submit"
              disabled={!newMsgText.trim()}
              className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Enviar</span>
            </button>
          </form>
        </div>
      )}

      {/* Tab 2: Announcements */}
      {activeTab === 'announcements' && (
        <div className="space-y-4">
          {announcements.map((anc) => (
            <div key={anc.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200">
                  {anc.isOfficial ? 'COMUNICADO OFICIAL' : 'AVISO'}
                </span>
                <span className="text-xs text-slate-400">{new Date(anc.createdAt).toLocaleDateString()}</span>
              </div>
              <h3 className="text-base font-bold text-slate-800">{anc.title}</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">{anc.content}</p>
              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 font-semibold">
                Emitido por: {anc.authorName}
              </div>
            </div>
          ))}
        </div>
      )}

      <AnonymousEvaluationModal
        isOpen={showEvalModal}
        onClose={() => setShowEvalModal(false)}
        subjects={[
          { id: 'subj-1', name: 'Matemáticas III (Cálculo)', teacherId: 'usr-teacher-1', teacherName: 'Prof. Roberto Silva' },
          { id: 'subj-2', name: 'Física General', teacherId: 'usr-teacher-1', teacherName: 'Prof. Roberto Silva' },
        ]}
      />
    </div>
  );
};
