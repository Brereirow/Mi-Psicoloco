import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';
import {
  Sparkles,
  GraduationCap,
  Briefcase,
  Brain,
  Shield,
  ArrowRight,
  Lock,
  Heart,
  Calendar,
  CheckCircle2,
  Smartphone,
  Server,
  BookOpen,
} from 'lucide-react';
import { PrivacyTermsModal } from '../components/PrivacyTermsModal';

interface LandingPageProps {
  onEnterApp: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp }) => {
  const { login, register, switchRole } = useAuth();
  const [modalMode, setModalMode] = useState<'login' | 'register' | 'recover' | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('student');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [privacyModalType, setPrivacyModalType] = useState<'privacy' | 'terms' | null>(null);

  const handleDemoAccess = async (targetRole: Role) => {
    try {
      await switchRole(targetRole);
      onEnterApp();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (modalMode === 'login') {
        await login({ email, password });
        setModalMode(null);
        onEnterApp();
      } else if (modalMode === 'register') {
        await register({ name, email, password, role });
        setModalMode(null);
        onEnterApp();
      } else if (modalMode === 'recover') {
        alert('Se ha enviado un enlace de recuperación seguro a tu correo institucional.');
        setModalMode(null);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error en las credenciales');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg text-slate-800 tracking-tight">MI PSICOLOCO</span>
              <p className="text-[11px] text-slate-500 hidden sm:block">Tu asistente académico y de bienestar</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                setErrorMsg('');
                setModalMode('login');
              }}
              className="px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => {
                setErrorMsg('');
                setModalMode('register');
              }}
              className="px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs transition-colors"
            >
              Crear Cuenta
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 text-teal-800 border border-teal-200 rounded-full text-xs font-bold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Prototipo Funcional • Preparado para Web y Aplicación Móvil</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Acompañamiento académico y{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-indigo-600">
              bienestar emocional real
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 mt-4 leading-relaxed">
            Mi Psicoloco ayuda a las personas a sobrellevar las exigencias de subir de nivel académico. Combina agenda inteligente, materias, calificaciones, registro emocional privado, citas con psicólogos y un asistente de inteligencia artificial ético y preventivo.
          </p>
        </div>

        {/* 4 Interactive Role Launchers (Instant Demo Testing) */}
        <div className="mt-12 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold text-slate-800">Prueba Inmediata con Roles Diferenciados</h2>
            <p className="text-xs text-slate-500 mt-1">
              Selecciona cualquier rol para ingresar al prototipo con permisos, datos y dashboards reales:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Student */}
            <button
              onClick={() => handleDemoAccess('student')}
              className="p-5 rounded-2xl border border-teal-200 bg-teal-50/50 hover:bg-teal-100/60 text-left transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="p-2.5 rounded-xl bg-teal-600 text-white w-fit group-hover:scale-105 transition-transform mb-3">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-slate-800">Rol Estudiante</h3>
                <div className="text-xs text-teal-800 font-semibold mt-0.5">Carlos Mendoza</div>
                <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                  Agenda, tareas, "¿Cómo me siento?", Mi Psicoloco IA, citas y calificaciones.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-teal-200 flex items-center justify-between text-xs font-bold text-teal-700">
                <span>Ingresar como alumno</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* Teacher */}
            <button
              onClick={() => handleDemoAccess('teacher')}
              className="p-5 rounded-2xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100/60 text-left transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="p-2.5 rounded-xl bg-blue-600 text-white w-fit group-hover:scale-105 transition-transform mb-3">
                  <Briefcase className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-slate-800">Rol Docente</h3>
                <div className="text-xs text-blue-800 font-semibold mt-0.5">Prof. Roberto Silva</div>
                <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                  Grupos, asignación de tareas, captura de calificaciones y comunicación.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-blue-200 flex items-center justify-between text-xs font-bold text-blue-700">
                <span>Ingresar como docente</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* Psychologist */}
            <button
              onClick={() => handleDemoAccess('psychologist')}
              className="p-5 rounded-2xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100/60 text-left transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="p-2.5 rounded-xl bg-indigo-600 text-white w-fit group-hover:scale-105 transition-transform mb-3">
                  <Brain className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-slate-800">Rol Psicólogo / Orientador</h3>
                <div className="text-xs text-indigo-800 font-semibold mt-0.5">Lic. Mariana Gómez</div>
                <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                  Solicitudes, citas, expediente de acompañamiento y resúmenes con IA.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-indigo-200 flex items-center justify-between text-xs font-bold text-indigo-700">
                <span>Ingresar como orientador</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* Administrator */}
            <button
              onClick={() => handleDemoAccess('admin')}
              className="p-5 rounded-2xl border border-purple-200 bg-purple-50/50 hover:bg-purple-100/60 text-left transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="p-2.5 rounded-xl bg-purple-600 text-white w-fit group-hover:scale-105 transition-transform mb-3">
                  <Shield className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-slate-800">Rol Administrador</h3>
                <div className="text-xs text-purple-800 font-semibold mt-0.5">Dra. Elena Ramos</div>
                <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                  Gestión integral de usuarios, estadísticas escolares y logs de auditoría.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-purple-200 flex items-center justify-between text-xs font-bold text-purple-700">
                <span>Ingresar como directivo</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="p-2.5 bg-teal-50 text-teal-600 rounded-xl w-fit mb-3">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-800">Organización y Agenda Escolar</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Tareas, exámenes, proyectos y generador de plan de estudio con técnicas Pomodoro para evitar sobrecargas de última hora.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="p-2.5 bg-rose-50 text-rose-500 rounded-xl w-fit mb-3">
              <Heart className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-800">Bienestar Emocional Ético</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Registro confidencial diario "¿Cómo me siento?". Sin diagnósticos clínicos automáticos; con canalización oportuna a profesionales humanos.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl w-fit mb-3">
              <Smartphone className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-800">Arquitectura Preparada para Móvil</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              API RESTful desacoplada en backend Express, lista para ser consumida de inmediato por aplicaciones móviles (iOS / Android / Flutter / React Native).
            </p>
          </div>
        </div>
      </main>

      {/* Footer with Privacy & Terms */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <strong>MI PSICOLOCO</strong> • Tu asistente académico y de bienestar © 2026 Instituto Tecnológico Demo.
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setPrivacyModalType('privacy')}
              className="hover:text-teal-600 underline font-medium"
            >
              Aviso de Privacidad
            </button>
            <button
              onClick={() => setPrivacyModalType('terms')}
              className="hover:text-teal-600 underline font-medium"
            >
              Términos y Condiciones
            </button>
          </div>
        </div>
      </footer>

      {/* Login / Register Modal */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-1">
              {modalMode === 'login'
                ? 'Iniciar Sesión en Mi Psicoloco'
                : modalMode === 'register'
                ? 'Crear Cuenta Institucional'
                : 'Recuperar Contraseña'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {modalMode === 'login'
                ? 'Ingresa tus credenciales registradas.'
                : modalMode === 'register'
                ? 'Registra tu perfil en la plataforma.'
                : 'Te enviaremos un enlace de restablecimiento seguro.'}
            </p>

            {errorMsg && (
              <div className="p-2.5 mb-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-3.5">
              {modalMode === 'register' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nombre completo</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="Ej. Carlos Mendoza"
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Rol</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as Role)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-semibold"
                    >
                      <option value="student">Estudiante</option>
                      <option value="teacher">Docente</option>
                      <option value="psychologist">Psicólogo / Orientador</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="usuario@instituto.edu"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {modalMode !== 'recover' && (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-slate-700">Contraseña</label>
                    {modalMode === 'login' && (
                      <button
                        type="button"
                        onClick={() => setModalMode('recover')}
                        className="text-[11px] text-teal-600 hover:underline"
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    )}
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              )}

              <div className="pt-2 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs transition-colors"
                >
                  {loading
                    ? 'Procesando...'
                    : modalMode === 'login'
                    ? 'Iniciar Sesión'
                    : modalMode === 'register'
                    ? 'Registrarme'
                    : 'Enviar Enlace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {privacyModalType && (
        <PrivacyTermsModal
          isOpen={Boolean(privacyModalType)}
          onClose={() => setPrivacyModalType(null)}
          type={privacyModalType}
        />
      )}
    </div>
  );
};
