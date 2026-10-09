import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Calendar,
  CheckSquare,
  BookOpen,
  Award,
  Heart,
  Bot,
  Compass,
  CalendarCheck,
  MessageSquare,
  Users,
  ShieldAlert,
  BarChart3,
  Settings,
  X,
  FileText,
  UserCheck,
  Clock,
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: any;
  highlight?: boolean;
}

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab, isOpen, onClose }) => {
  const { user } = useAuth();
  const role = user?.role || 'student';

  const getNavItems = (): NavItem[] => {
    switch (role) {
      case 'teacher':
        return [
          { id: 'teacher-dashboard', label: 'Dashboard Docente', icon: LayoutDashboard },
          { id: 'teacher-groups', label: 'Mis Grupos', icon: Users },
          { id: 'teacher-students', label: 'Mis Alumnos', icon: UserCheck },
          { id: 'teacher-activities', label: 'Crear Actividades', icon: CheckSquare },
          { id: 'teacher-grades', label: 'Calificaciones', icon: Award },
          { id: 'teacher-tutoring', label: 'Asesorías Solicitadas', icon: CalendarCheck, highlight: true },
          { id: 'communication', label: 'Comunicación y Avisos', icon: MessageSquare },
          { id: 'profile', label: 'Mi Perfil', icon: Settings },
        ];
      case 'psychologist':
        return [
          { id: 'psych-dashboard', label: 'Dashboard Orientación', icon: LayoutDashboard },
          { id: 'psych-requests', label: 'Solicitudes', icon: CalendarCheck },
          { id: 'psych-appointments', label: 'Citas Asignadas', icon: Clock },
          { id: 'psych-history', label: 'Historial de Acompañamiento', icon: FileText },
          { id: 'psych-wellness-summary', label: 'Resúmenes IA de Sesión', icon: Bot },
          { id: 'resources', label: 'Biblioteca de Bienestar', icon: Compass },
          { id: 'profile', label: 'Mi Perfil', icon: Settings },
        ];
      case 'admin':
        return [
          { id: 'admin-dashboard', label: 'Dashboard Administrativo', icon: LayoutDashboard },
          { id: 'admin-users', label: 'Gestión de Usuarios', icon: UserCheck },
          { id: 'admin-groups', label: 'Gestión de Grupos', icon: Users },
          { id: 'admin-subjects', label: 'Gestión de Materias', icon: BookOpen },
          { id: 'admin-stats', label: 'Estadísticas Escolares', icon: BarChart3 },
          { id: 'admin-audit', label: 'Seguridad y Auditoría', icon: ShieldAlert },
          { id: 'profile', label: 'Configuración', icon: Settings },
        ];
      default: // student
        return [
          { id: 'student-dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'agenda', label: 'Mi Agenda y Calendario', icon: Calendar },
          { id: 'tasks', label: 'Tareas y Exámenes', icon: CheckSquare },
          { id: 'subjects', label: 'Mis Materias', icon: BookOpen },
          { id: 'grades', label: 'Calificaciones', icon: Award },
          { id: 'emotional', label: '¿Cómo me siento?', icon: Heart, highlight: true },
          { id: 'ai-chat', label: 'Mi Psicoloco IA', icon: Bot, highlight: true },
          { id: 'resources', label: 'Recursos de Bienestar', icon: Compass },
          { id: 'counseling', label: 'Asesorías y Citas', icon: CalendarCheck },
          { id: 'communication', label: 'Comunicación y Avisos', icon: MessageSquare },
          { id: 'profile', label: 'Mi Perfil', icon: Settings },
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-100 lg:hidden">
          <span className="font-bold text-xs uppercase tracking-wider text-slate-400">Navegación</span>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card in Sidebar */}
        <div className="p-4 mx-3 my-3 bg-slate-50 border border-slate-200/80 rounded-2xl">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-teal-700">
            {role === 'student'
              ? 'Área Estudiantil'
              : role === 'teacher'
              ? 'Área Docente'
              : role === 'psychologist'
              ? 'Área Psicológica'
              : 'Área Administrativa'}
          </div>
          <div className="text-xs font-bold text-slate-800 mt-0.5 truncate">{user?.name}</div>
          <div className="text-[11px] text-slate-500 truncate">Instituto Tecnológico Demo</div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-xs font-bold'
                    : item.highlight
                    ? 'text-teal-800 bg-teal-50/70 hover:bg-teal-100/70 border border-teal-200/50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-white' : item.highlight ? 'text-teal-600' : 'text-slate-500'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Institutional commitment badge */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/60">
          <div className="text-[10px] text-slate-400 leading-tight">
            Mi Psicoloco • Acompañamiento seguro, sin diagnósticos clínicos automáticos. Privacidad garantizada.
          </div>
        </div>
      </aside>
    </>
  );
};
