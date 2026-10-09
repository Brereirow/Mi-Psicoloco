import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Shield,
  Users,
  BarChart3,
  ShieldAlert,
  Search,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  XCircle,
  Lock,
  Building,
  BookOpen,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface AdminDashboardProps {
  currentTab?: string;
  onNavigate?: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentTab = 'admin-dashboard', onNavigate }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'groups' | 'subjects' | 'stats' | 'security'>('overview');

  // Data states
  const [data, setData] = useState<any | null>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [groupsList, setGroupsList] = useState<any[]>([]);
  const [subjectsList, setSubjectsList] = useState<any[]>([]);
  const [stats, setStats] = useState<any | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Modals
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<any | null>(null);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<any | null>(null);

  // Form states - User
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('demo1234');
  const [userRole, setUserRole] = useState<'student' | 'teacher' | 'psychologist' | 'admin'>('student');
  const [userPhone, setUserPhone] = useState('');

  // Form states - Group
  const [groupName, setGroupName] = useState('');
  const [groupShift, setGroupShift] = useState<'Matutino' | 'Vespertino'>('Matutino');
  const [groupAcademicYear, setGroupAcademicYear] = useState('2026-2027');

  // Form states - Subject
  const [subjectName, setSubjectName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [subjectGroupId, setSubjectGroupId] = useState('');
  const [subjectTeacherId, setSubjectTeacherId] = useState('');
  const [subjectSchedule, setSubjectSchedule] = useState('');
  const [subjectClassroom, setSubjectClassroom] = useState('');
  const [subjectColor, setSubjectColor] = useState('#3B82F6');

  // Sync tab with Sidebar
  useEffect(() => {
    if (currentTab === 'admin-users') {
      setActiveTab('users');
    } else if (currentTab === 'admin-groups') {
      setActiveTab('groups');
    } else if (currentTab === 'admin-subjects') {
      setActiveTab('subjects');
    } else if (currentTab === 'admin-stats') {
      setActiveTab('stats');
    } else if (currentTab === 'admin-audit') {
      setActiveTab('security');
    } else {
      setActiveTab('overview');
    }
  }, [currentTab]);

  const loadAllData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [dashRes, usersRes, groupsRes, subjectsRes, statsRes, auditRes] = await Promise.all([
        api.getAdminDashboard(),
        api.getAdminUsers(),
        api.getAdminGroups(),
        api.getAdminSubjects(),
        api.getAdminStats(),
        api.getAdminAuditLogs(),
      ]);
      setData(dashRes);
      setUsersList(usersRes.users || []);
      setGroupsList(groupsRes.groups || []);
      setSubjectsList(subjectsRes.subjects || []);
      setStats(statsRes);
      setAuditLogs(auditRes.auditLogs || []);

      if (groupsRes.groups && groupsRes.groups.length > 0) {
        setSubjectGroupId(groupsRes.groups[0].id);
      }
      const teachers = usersRes.users?.filter((u: any) => u.role === 'teacher');
      if (teachers && teachers.length > 0) {
        setSubjectTeacherId(teachers[0].id);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error al cargar datos administrativos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const notify = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(''), 3000);
  };

  // User Handlers
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !userEmail.trim()) return;

    try {
      if (editingUser) {
        await api.updateAdminUser(editingUser.id, {
          name: userName,
          email: userEmail,
          role: userRole,
          phone: userPhone,
          password: userPassword !== 'demo1234' ? userPassword : undefined,
        });
        notify('Usuario actualizado con éxito.');
      } else {
        await api.createAdminUser({
          name: userName,
          email: userEmail,
          password: userPassword,
          role: userRole,
          phone: userPhone,
        });
        notify('Nuevo usuario creado exitosamente.');
      }
      setShowUserModal(false);
      setEditingUser(null);
      setUserName('');
      setUserEmail('');
      const uRes = await api.getAdminUsers();
      setUsersList(uRes.users || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al guardar usuario');
    }
  };

  const handleEditUserClick = (u: any) => {
    setEditingUser(u);
    setUserName(u.name);
    setUserEmail(u.email);
    setUserRole(u.role);
    setUserPhone(u.phone || '');
    setUserPassword('demo1234');
    setShowUserModal(true);
  };

  const handleToggleActive = async (targetUser: any) => {
    try {
      await api.updateAdminUser(targetUser.id, { active: !targetUser.active });
      notify(`Usuario ${targetUser.active ? 'desactivado' : 'activado'}.`);
      const uRes = await api.getAdminUsers();
      setUsersList(uRes.users || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al cambiar estado');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('¿Confirmas la eliminación permanente de este usuario?')) return;
    try {
      await api.deleteAdminUser(userId);
      notify('Usuario eliminado.');
      const uRes = await api.getAdminUsers();
      setUsersList(uRes.users || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al eliminar usuario');
    }
  };

  // Group Handlers
  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    try {
      if (editingGroup) {
        await api.updateAdminGroup(editingGroup.id, {
          name: groupName,
          shift: groupShift,
          academicYear: groupAcademicYear,
        });
        notify('Grupo actualizado con éxito.');
      } else {
        await api.createAdminGroup({
          name: groupName,
          shift: groupShift,
          academicYear: groupAcademicYear,
        });
        notify('Grupo creado exitosamente.');
      }
      setShowGroupModal(false);
      setEditingGroup(null);
      setGroupName('');
      const gRes = await api.getAdminGroups();
      setGroupsList(gRes.groups || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al guardar grupo');
    }
  };

  const handleEditGroupClick = (g: any) => {
    setEditingGroup(g);
    setGroupName(g.name);
    setGroupShift(g.shift);
    setGroupAcademicYear(g.academicYear);
    setShowGroupModal(true);
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!window.confirm('¿Confirmas la eliminación de este grupo?')) return;
    try {
      await api.deleteAdminGroup(groupId);
      notify('Grupo eliminado.');
      const gRes = await api.getAdminGroups();
      setGroupsList(gRes.groups || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al eliminar grupo');
    }
  };

  // Subject Handlers
  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectName.trim() || !subjectCode.trim()) return;

    try {
      if (editingSubject) {
        await api.updateAdminSubject(editingSubject.id, {
          name: subjectName,
          code: subjectCode,
          groupId: subjectGroupId,
          teacherId: subjectTeacherId,
          schedule: subjectSchedule,
          classroom: subjectClassroom,
          color: subjectColor,
        });
        notify('Materia actualizada con éxito.');
      } else {
        await api.createAdminSubject({
          name: subjectName,
          code: subjectCode,
          groupId: subjectGroupId,
          teacherId: subjectTeacherId,
          schedule: subjectSchedule,
          classroom: subjectClassroom,
          color: subjectColor,
        });
        notify('Materia creada y vinculada.');
      }
      setShowSubjectModal(false);
      setEditingSubject(null);
      setSubjectName('');
      setSubjectCode('');
      setSubjectSchedule('');
      setSubjectClassroom('');
      const sRes = await api.getAdminSubjects();
      setSubjectsList(sRes.subjects || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al guardar materia');
    }
  };

  const handleEditSubjectClick = (s: any) => {
    setEditingSubject(s);
    setSubjectName(s.name);
    setSubjectCode(s.code);
    setSubjectGroupId(s.groupId);
    setSubjectTeacherId(s.teacherId);
    setSubjectSchedule(s.schedule || '');
    setSubjectClassroom(s.classroom || '');
    setSubjectColor(s.color || '#3B82F6');
    setShowSubjectModal(true);
  };

  const handleDeleteSubject = async (subjectId: string) => {
    if (!window.confirm('¿Confirmas la eliminación de esta materia?')) return;
    try {
      await api.deleteAdminSubject(subjectId);
      notify('Materia eliminada.');
      const sRes = await api.getAdminSubjects();
      setSubjectsList(sRes.subjects || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al eliminar materia');
    }
  };

  const filteredUsers = usersList.filter((u) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-800 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 bg-white/20 rounded-md">
            Consola de Administración y Gobierno Escolar
          </span>
          <h1 className="text-2xl font-extrabold mt-2">Instituto Tecnológico Demo</h1>
          <p className="text-xs text-indigo-200 mt-1 max-w-xl">
            Control integral de usuarios, estructura académica de grupos y materias, métricas agregadas y auditoría.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setEditingUser(null);
              setUserName('');
              setUserEmail('');
              setUserPhone('');
              setShowUserModal(true);
            }}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Usuario</span>
          </button>

          <button
            onClick={() => {
              setEditingGroup(null);
              setGroupName('');
              setShowGroupModal(true);
            }}
            className="px-4 py-2 bg-white text-purple-900 hover:bg-slate-100 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Grupo</span>
          </button>
        </div>
      </div>

      {/* Alerts */}
      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        {[
          { id: 'overview', label: 'Dashboard General', icon: Building },
          { id: 'users', label: `Usuarios (${usersList.length})`, icon: Users },
          { id: 'groups', label: `Grupos (${groupsList.length})`, icon: Users },
          { id: 'subjects', label: `Materias (${subjectsList.length})`, icon: BookOpen },
          { id: 'stats', label: 'Estadísticas Escolares', icon: BarChart3 },
          { id: 'security', label: `Auditoría y Seguridad (${auditLogs.length})`, icon: ShieldAlert },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                if (onNavigate) {
                  if (tab.id === 'users') onNavigate('admin-users');
                  else if (tab.id === 'groups') onNavigate('admin-groups');
                  else if (tab.id === 'subjects') onNavigate('admin-subjects');
                  else if (tab.id === 'stats') onNavigate('admin-stats');
                  else if (tab.id === 'security') onNavigate('admin-audit');
                  else onNavigate('admin-dashboard');
                }
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                isActive ? 'bg-purple-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-400 font-bold">Total Usuarios</span>
              <div className="text-3xl font-black text-slate-800 mt-1">{usersList.length}</div>
              <div className="text-[11px] text-purple-700 font-semibold mt-1">Cuentas activas en sistema</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-400 font-bold">Grupos Registrados</span>
              <div className="text-3xl font-black text-slate-800 mt-1">{groupsList.length}</div>
              <div className="text-[11px] text-slate-500 mt-1">Matutino y Vespertino</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-400 font-bold">Materias Ofertadas</span>
              <div className="text-3xl font-black text-slate-800 mt-1">{subjectsList.length}</div>
              <div className="text-[11px] text-slate-500 mt-1">Con docente asignado</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-400 font-bold">Solicitudes de Bienestar</span>
              <div className="text-3xl font-black text-purple-700 mt-1">{data?.metrics?.counselingCount || 0}</div>
              <div className="text-[11px] text-slate-500 mt-1">Atendidas por orientación</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="font-bold text-sm text-slate-800">Acceso Rápido a Usuarios</h3>
              <p className="text-xs text-slate-500">Crea credenciales institucionales para estudiantes, docentes y psicólogos.</p>
              <button
                onClick={() => setActiveTab('users')}
                className="w-full py-2 bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold text-xs rounded-xl"
              >
                Ir a Gestión de Usuarios →
              </button>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="font-bold text-sm text-slate-800">Estructura de Grupos</h3>
              <p className="text-xs text-slate-500">Administra los grupos académicos del semestre y consulta sus alumnos.</p>
              <button
                onClick={() => setActiveTab('groups')}
                className="w-full py-2 bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold text-xs rounded-xl"
              >
                Ir a Gestión de Grupos →
              </button>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="font-bold text-sm text-slate-800">Catálogo de Materias</h3>
              <p className="text-xs text-slate-500">Asigna horarios, aulas y vincula los docentes correspondientes.</p>
              <button
                onClick={() => setActiveTab('subjects')}
                className="w-full py-2 bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold text-xs rounded-xl"
              >
                Ir a Gestión de Materias →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB: USERS */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre o correo..."
                className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="text-xs p-2 rounded-xl border border-slate-300 font-semibold"
              >
                <option value="all">Todos los roles</option>
                <option value="student">Estudiante</option>
                <option value="teacher">Docente</option>
                <option value="psychologist">Psicólogo</option>
                <option value="admin">Administrador</option>
              </select>

              <button
                onClick={() => {
                  setEditingUser(null);
                  setUserName('');
                  setUserEmail('');
                  setUserPhone('');
                  setShowUserModal(true);
                }}
                className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Crear Usuario</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider text-[10px] font-bold border-y">
                <tr>
                  <th className="py-3 px-4">Usuario</th>
                  <th className="py-3 px-4">Rol</th>
                  <th className="py-3 px-4">Detalle / Matrícula</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800">{u.name}</div>
                      <div className="text-[11px] text-slate-400">{u.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md font-bold uppercase text-[10px] bg-purple-50 text-purple-800">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono">{u.extra || '—'}</td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleActive(u)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                          u.active
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                        }`}
                      >
                        {u.active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        <span>{u.active ? 'Activo' : 'Inactivo'}</span>
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEditUserClick(u)}
                          className="p-1.5 text-slate-500 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Editar usuario"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {u.id !== user?.id && (
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Eliminar usuario"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: GROUPS */}
      {activeTab === 'groups' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-800">Gestión de Grupos Académicos</h2>
              <p className="text-xs text-slate-500">Crea y administra los grupos, turnos y ciclos escolares.</p>
            </div>

            <button
              onClick={() => {
                setEditingGroup(null);
                setGroupName('');
                setShowGroupModal(true);
              }}
              className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Grupo</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groupsList.map((grp) => (
              <div key={grp.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-800">
                      {grp.shift}
                    </span>
                    <span className="text-xs text-slate-400">{grp.academicYear}</span>
                  </div>
                  <h3 className="font-bold text-base text-slate-800">{grp.name}</h3>
                  <div className="mt-3 text-xs text-slate-600 space-y-1">
                    <div>Alumnos matriculados: <strong>{grp.studentsCount || 0}</strong></div>
                    <div>Materias asignadas: <strong>{grp.subjectsCount || 0}</strong></div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleEditGroupClick(grp)}
                    className="p-1.5 text-purple-700 hover:bg-purple-100 rounded-lg text-xs font-bold flex items-center gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>
                  <button
                    onClick={() => handleDeleteGroup(grp.id)}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: SUBJECTS */}
      {activeTab === 'subjects' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-800">Gestión de Materias y Asignaturas</h2>
              <p className="text-xs text-slate-500">
                Vincula materias con docentes, asigna grupos, horarios de clase y aulas.
              </p>
            </div>

            <button
              onClick={() => {
                setEditingSubject(null);
                setSubjectName('');
                setSubjectCode('');
                setSubjectSchedule('');
                setSubjectClassroom('');
                setShowSubjectModal(true);
              }}
              className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Materia</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subjectsList.map((subj) => (
              <div key={subj.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                      {subj.code}
                    </span>
                    <span className="text-xs font-bold text-purple-700">{subj.groupName}</span>
                  </div>

                  <h3 className="font-bold text-base text-slate-800">{subj.name}</h3>

                  <div className="mt-3 text-xs text-slate-600 space-y-1.5">
                    <div>
                      Docente a cargo: <strong>{subj.teacherName}</strong>
                    </div>
                    <div>
                      Horario: <strong>{subj.schedule}</strong>
                    </div>
                    <div>
                      Aula / Laboratorio: <strong>{subj.classroom}</strong>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleEditSubjectClick(subj)}
                    className="p-1.5 text-purple-700 hover:bg-purple-100 rounded-lg text-xs font-bold flex items-center gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>
                  <button
                    onClick={() => handleDeleteSubject(subj.id)}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: STATS */}
      {activeTab === 'stats' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Tasa de Cumplimiento Académico
              </span>
              <div className="text-4xl font-black text-teal-700 mt-2">{stats.completionRate}%</div>
              <p className="text-xs text-slate-500 mt-1">Actividades y tareas completadas por alumnos</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Solicitudes de Orientación
              </span>
              <div className="text-4xl font-black text-indigo-700 mt-2">{stats.totalCounselingRequests}</div>
              <p className="text-xs text-slate-500 mt-1">Atendidas por el departamento de psicología</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Alumnos Activos
              </span>
              <div className="text-4xl font-black text-slate-800 mt-2">{stats.activeStudents}</div>
              <p className="text-xs text-slate-500 mt-1">Matrícula vigente en la plataforma</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-800">
                  Resultados Agregados de Evaluación Docente Anónima
                </h3>
                <p className="text-xs text-slate-500">
                  Protección total de identidad estudiantil • Promedios agregados
                </p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg">
                Satisfacción Global: {stats.teacherAverages?.overall}%
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-500 font-semibold">Claridad</span>
                <div className="text-2xl font-bold text-teal-700 mt-1">{stats.teacherAverages?.clarity}%</div>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-500 font-semibold">Organización</span>
                <div className="text-2xl font-bold text-teal-700 mt-1">{stats.teacherAverages?.organization}%</div>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-500 font-semibold">Comunicación</span>
                <div className="text-2xl font-bold text-teal-700 mt-1">{stats.teacherAverages?.communication}%</div>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-500 font-semibold">Trato y Ambiente</span>
                <div className="text-2xl font-bold text-teal-700 mt-1">{stats.teacherAverages?.treatment}%</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: AUDIT */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b">
            <div>
              <h3 className="font-bold text-sm text-slate-800">Registro de Auditoría & Trazabilidad (Audit Logs)</h3>
              <p className="text-xs text-slate-500">Registro inmutable de accesos, altas y modificaciones de base de datos</p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-md">
              Cifrado SHA-256
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider text-[10px] font-bold border-y">
                <tr>
                  <th className="py-2.5 px-4">Fecha y Hora</th>
                  <th className="py-2.5 px-4">Usuario</th>
                  <th className="py-2.5 px-4">Acción</th>
                  <th className="py-2.5 px-4">Detalles</th>
                  <th className="py-2.5 px-4">IP Origen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 text-slate-500">{new Date(log.createdAt).toLocaleString()}</td>
                    <td className="py-2.5 px-4 font-sans font-bold text-slate-800">{log.userName}</td>
                    <td className="py-2.5 px-4 font-bold text-purple-700">{log.action}</td>
                    <td className="py-2.5 px-4 font-sans text-slate-600">{log.details}</td>
                    <td className="py-2.5 px-4 text-slate-400">{log.ipAddress}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: USUARIO */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-800 mb-1">
              {editingUser ? 'Editar Usuario' : 'Registrar Nuevo Usuario'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">Credenciales y permisos institucionales.</p>

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre completo</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  required
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    required
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {editingUser ? 'Nueva Contraseña (Opcional)' : 'Contraseña Inicial'}
                  </label>
                  <input
                    type="text"
                    value={userPassword}
                    onChange={(e) => setUserPassword(e.target.value)}
                    required={!editingUser}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Rol</label>
                  <select
                    value={userRole}
                    onChange={(e) => setUserRole(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="student">Estudiante</option>
                    <option value="teacher">Docente</option>
                    <option value="psychologist">Psicólogo / Orientador</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={userPhone}
                    onChange={(e) => setUserPhone(e.target.value)}
                    placeholder="+52 55..."
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs"
                >
                  {editingUser ? 'Actualizar Usuario' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: GRUPO */}
      {showGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-1">
              {editingGroup ? 'Editar Grupo' : 'Crear Nuevo Grupo'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">Asigna turno y periodo escolar.</p>

            <form onSubmit={handleSaveGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre del Grupo</label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  required
                  placeholder="Ej. 3° Semestre - Grupo C"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Turno</label>
                  <select
                    value={groupShift}
                    onChange={(e) => setGroupShift(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="Matutino">Matutino</option>
                    <option value="Vespertino">Vespertino</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ciclo Escolar</label>
                  <input
                    type="text"
                    value={groupAcademicYear}
                    onChange={(e) => setGroupAcademicYear(e.target.value)}
                    required
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowGroupModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs"
                >
                  {editingGroup ? 'Guardar Cambios' : 'Crear Grupo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MATERIA */}
      {showSubjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-800 mb-1">
              {editingSubject ? 'Editar Materia' : 'Crear Nueva Materia'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">Vincula la materia con un docente y grupo correspondiente.</p>

            <form onSubmit={handleSaveSubject} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nombre de la Materia</label>
                  <input
                    type="text"
                    value={subjectName}
                    onChange={(e) => setSubjectName(e.target.value)}
                    required
                    placeholder="Ej. Álgebra Lineal"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Código de Materia</label>
                  <input
                    type="text"
                    value={subjectCode}
                    onChange={(e) => setSubjectCode(e.target.value)}
                    required
                    placeholder="ALG-101"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Grupo Asignado</label>
                  <select
                    value={subjectGroupId}
                    onChange={(e) => setSubjectGroupId(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                  >
                    {groupsList.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Docente Asignado</label>
                  <select
                    value={subjectTeacherId}
                    onChange={(e) => setSubjectTeacherId(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                  >
                    {usersList
                      .filter((u) => u.role === 'teacher')
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Horario</label>
                  <input
                    type="text"
                    value={subjectSchedule}
                    onChange={(e) => setSubjectSchedule(e.target.value)}
                    placeholder="Lun y Mié 10:00 - 12:00"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Aula / Laboratorio</label>
                  <input
                    type="text"
                    value={subjectClassroom}
                    onChange={(e) => setSubjectClassroom(e.target.value)}
                    placeholder="Aula 204"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowSubjectModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs"
                >
                  {editingSubject ? 'Guardar Cambios' : 'Crear Materia'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
