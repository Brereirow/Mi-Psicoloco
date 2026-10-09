import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Role, NotificationItem } from '../types';
import {
  Sparkles,
  Bell,
  Menu,
  X,
  UserCheck,
  GraduationCap,
  Briefcase,
  Brain,
  Shield,
  LogOut,
  ChevronDown,
  Check,
} from 'lucide-react';
import { api } from '../services/api';

interface HeaderProps {
  onToggleSidebar: () => void;
  onOpenHelp: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, onOpenHelp }) => {
  const { user, switchRole, logout } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    if (user) {
      api.getNotifications().then((res) => setNotifications(res.notifications || [])).catch(() => {});
    }
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch (e) {}
  };

  const rolesList: { role: Role; label: string; icon: any; color: string }[] = [
    { role: 'student', label: 'Estudiante', icon: GraduationCap, color: 'bg-teal-500 text-white' },
    { role: 'teacher', label: 'Docente', icon: Briefcase, color: 'bg-blue-600 text-white' },
    { role: 'psychologist', label: 'Psicólogo', icon: Brain, color: 'bg-indigo-600 text-white' },
    { role: 'admin', label: 'Administrador', icon: Shield, color: 'bg-purple-600 text-white' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger & Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-hidden"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg text-slate-800 tracking-tight">MI PSICOLOCO</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-sm bg-teal-50 text-teal-700 border border-teal-200">
                  PROTOTIPO
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Tu asistente académico y de bienestar
              </p>
            </div>
          </div>
        </div>

        {/* Center: Quick Role Switcher for seamless test */}
        <div className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <span className="text-[11px] text-slate-400 font-semibold px-2">Rol demo:</span>
          {rolesList.map((r) => {
            const Icon = r.icon;
            const isActive = user?.role === r.role;
            return (
              <button
                key={r.role}
                onClick={() => switchRole(r.role)}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                  isActive
                    ? `${r.color} shadow-xs scale-102`
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{r.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right side: Help button, notifications, user profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onOpenHelp}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
          >
            <span className="text-sm">🆘</span>
            <span>Ayuda SOS</span>
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
              title="Notificaciones"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-teal-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 p-3 z-50">
                <div className="flex items-center justify-between border-b pb-2 mb-2">
                  <span className="font-bold text-xs text-slate-700">Centro de Notificaciones</span>
                  <span className="text-[11px] text-teal-600 font-semibold">{unreadCount} pendientes</span>
                </div>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-slate-400 py-3 text-center">No hay notificaciones</p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleMarkRead(n.id)}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                          n.read ? 'bg-slate-50 border-slate-100 text-slate-500' : 'bg-teal-50/50 border-teal-200 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs">{n.title}</span>
                          {!n.read && <span className="w-2 h-2 rounded-full bg-teal-600"></span>}
                        </div>
                        <p className="text-[11px] mt-0.5 text-slate-600">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User profile avatar */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1 pl-2 rounded-xl hover:bg-slate-100 transition-colors"
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user?.name}
                  className="w-8 h-8 rounded-full object-cover border border-slate-300"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-teal-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center border border-teal-700 shadow-xs">
                  {(user?.name || 'U').slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="hidden md:block text-left">
                <div className="text-xs font-bold text-slate-800 leading-tight">{user?.name}</div>
                <div className="text-[10px] text-slate-500 capitalize">{user?.role}</div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50">
                <div className="p-2 border-b border-slate-100">
                  <div className="text-xs font-bold text-slate-800">{user?.name}</div>
                  <div className="text-[11px] text-slate-500 truncate">{user?.email}</div>
                  <div className="mt-1 inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                    Rol: {user?.role}
                  </div>
                </div>

                <div className="md:hidden p-2 border-b border-slate-100">
                  <div className="text-[11px] font-bold text-slate-500 mb-1">Cambiar rol:</div>
                  <div className="grid grid-cols-2 gap-1">
                    {rolesList.map((r) => (
                      <button
                        key={r.role}
                        onClick={() => {
                          switchRole(r.role);
                          setShowUserMenu(false);
                        }}
                        className={`text-[11px] font-semibold p-1 rounded-sm text-left ${
                          user?.role === r.role ? 'bg-teal-50 text-teal-700 font-bold' : 'text-slate-600'
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => {
                    logout();
                    setShowUserMenu(false);
                  }}
                  className="w-full mt-1 flex items-center gap-2 p-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Cerrar sesión</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
