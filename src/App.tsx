import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { HelpModal } from './components/HelpModal';
import { LandingPage } from './pages/LandingPage';
import { StudentDashboard } from './pages/StudentDashboard';
import { StudentAgenda } from './pages/StudentAgenda';
import { StudentSubjects } from './pages/StudentSubjects';
import { StudentGrades } from './pages/StudentGrades';
import { StudentEmotional } from './pages/StudentEmotional';
import { StudentAIChat } from './pages/StudentAIChat';
import { StudentWellness } from './pages/StudentWellness';
import { StudentAppointments } from './pages/StudentAppointments';
import { StudentCommunication } from './pages/StudentCommunication';
import { TeacherDashboard } from './pages/TeacherDashboard';
import { PsychologistDashboard } from './pages/PsychologistDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { ProfileSettings } from './pages/ProfileSettings';
import { LifeBuoy } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('student-dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);

  // Set default tab according to user's role
  useEffect(() => {
    if (!user) return;
    switch (user.role) {
      case 'teacher':
        setCurrentTab('teacher-dashboard');
        break;
      case 'psychologist':
        setCurrentTab('psych-dashboard');
        break;
      case 'admin':
        setCurrentTab('admin-dashboard');
        break;
      default:
        setCurrentTab('student-dashboard');
        break;
    }
  }, [user?.role]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-indigo-600 flex items-center justify-center text-white shadow-lg animate-pulse mb-4">
          <span className="font-extrabold text-xl">MP</span>
        </div>
        <p className="text-xs font-semibold text-slate-500">Cargando Mi Psicoloco...</p>
      </div>
    );
  }

  // If not logged in, show landing page
  if (!user) {
    return <LandingPage onEnterApp={() => {}} />;
  }

  const renderMainContent = () => {
    switch (currentTab) {
      // Student views
      case 'student-dashboard':
        return <StudentDashboard onNavigate={(tab) => setCurrentTab(tab)} />;
      case 'agenda':
      case 'tasks':
        return <StudentAgenda />;
      case 'subjects':
        return <StudentSubjects />;
      case 'grades':
        return <StudentGrades />;
      case 'emotional':
        return (
          <StudentEmotional
            onNavigateToCounseling={() => setCurrentTab('counseling')}
            onNavigateToResources={() => setCurrentTab('resources')}
          />
        );
      case 'ai-chat':
        return (
          <StudentAIChat
            onNavigateToCounseling={() => setCurrentTab('counseling')}
            onNavigateToAgenda={() => setCurrentTab('agenda')}
            onNavigateToEmotional={() => setCurrentTab('emotional')}
          />
        );
      case 'resources':
        return <StudentWellness />;
      case 'counseling':
        return <StudentAppointments />;
      case 'communication':
        return <StudentCommunication />;

      // Teacher views
      case 'teacher-dashboard':
      case 'teacher-groups':
      case 'teacher-students':
      case 'teacher-activities':
      case 'teacher-grades':
      case 'teacher-tutoring':
        return <TeacherDashboard currentTab={currentTab} onNavigate={(tab) => setCurrentTab(tab)} />;

      // Psychologist views
      case 'psych-dashboard':
      case 'psych-requests':
      case 'psych-appointments':
      case 'psych-history':
      case 'psych-wellness-summary':
        return <PsychologistDashboard currentTab={currentTab} onNavigate={(tab) => setCurrentTab(tab)} />;

      // Admin views
      case 'admin-dashboard':
      case 'admin-users':
      case 'admin-groups':
      case 'admin-subjects':
      case 'admin-stats':
      case 'admin-audit':
        return <AdminDashboard currentTab={currentTab} onNavigate={(tab) => setCurrentTab(tab)} />;

      // Shared
      case 'profile':
        return <ProfileSettings />;

      default:
        return <StudentDashboard onNavigate={(tab) => setCurrentTab(tab)} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col font-sans">
      <Header
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onOpenHelp={() => setHelpModalOpen(true)}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => setCurrentTab(tab)}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {renderMainContent()}
        </main>
      </div>

      {/* Floating SOS / Help Action Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setHelpModalOpen(true)}
          className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-bold text-xs rounded-full shadow-lg hover:shadow-xl transition-all scale-100 hover:scale-105 active:scale-95"
        >
          <LifeBuoy className="w-5 h-5 animate-spin-slow" />
          <span>Botón de Ayuda & SOS</span>
        </button>
      </div>

      <HelpModal
        isOpen={helpModalOpen}
        onClose={() => setHelpModalOpen(false)}
        onRequestAssistance={(type) => {
          if (type === 'orientacion_psicologica' || type === 'asesoria_academica') {
            setCurrentTab('counseling');
          }
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
