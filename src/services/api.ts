const BASE_URL = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('psicoloco_token');
}

export function setAuthToken(token: string): void {
  localStorage.setItem('psicoloco_token', token);
}

export function removeAuthToken(): void {
  localStorage.removeItem('psicoloco_token');
}

export async function apiRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Error ${response.status}: Ha ocurrido un problema`);
  }

  return data;
}

export const api = {
  // Auth
  login: (credentials: { email: string; password: string }) =>
    apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (payload: any) =>
    apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  getMe: () => apiRequest('/auth/me'),
  switchDemo: (role: string) =>
    apiRequest('/auth/switch-demo', { method: 'POST', body: JSON.stringify({ role }) }),
  updateProfile: (profile: any) =>
    apiRequest('/auth/profile', { method: 'PUT', body: JSON.stringify(profile) }),
  uploadAvatar: (imageBase64: string) =>
    apiRequest('/auth/avatar', { method: 'POST', body: JSON.stringify({ imageBase64 }) }),
  deleteAvatar: () =>
    apiRequest('/auth/avatar', { method: 'DELETE' }),

  // Student
  getStudentDashboard: () => apiRequest('/students/dashboard'),
  getStudentTasks: () => apiRequest('/students/tasks'),
  createStudentTask: (task: any) =>
    apiRequest('/students/tasks', { method: 'POST', body: JSON.stringify(task) }),
  updateStudentTask: (id: string, updates: any) =>
    apiRequest(`/students/tasks/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),
  deleteStudentTask: (id: string) =>
    apiRequest(`/students/tasks/${id}`, { method: 'DELETE' }),
  getStudentSubjects: () => apiRequest('/students/subjects'),
  getStudentGrades: () => apiRequest('/students/grades'),
  getAvailableTeachers: () => apiRequest('/students/teachers'),
  getEmotionalRecords: () => apiRequest('/students/emotional-records'),
  saveEmotionalRecord: (record: any) =>
    apiRequest('/students/emotional-records', { method: 'POST', body: JSON.stringify(record) }),

  // AI Assistant
  askAI: (message: string, history?: any[]) =>
    apiRequest('/ai/chat', { method: 'POST', body: JSON.stringify({ message, history }) }),
  generateStudyPlan: (payload: any) =>
    apiRequest('/ai/study-plan', { method: 'POST', body: JSON.stringify(payload) }),

  // Wellness
  getWellnessResources: (category?: string) =>
    apiRequest(`/wellness/resources${category ? `?category=${encodeURIComponent(category)}` : ''}`),
  getCounselingRequests: () => apiRequest('/wellness/counseling-requests'),
  createCounselingRequest: (request: any) =>
    apiRequest('/wellness/counseling-requests', { method: 'POST', body: JSON.stringify(request) }),
  cancelCounselingRequest: (id: string, reason?: string) =>
    apiRequest(`/wellness/counseling-requests/${id}/cancel`, { method: 'PUT', body: JSON.stringify({ reason }) }),
  respondCounselingProposal: (id: string, action: 'accept' | 'reject', notes?: string) =>
    apiRequest(`/wellness/counseling-requests/${id}/respond-proposal`, {
      method: 'PUT',
      body: JSON.stringify({ action, notes }),
    }),
  createCrisisAlert: (data?: { note?: string }) =>
    apiRequest('/wellness/crisis-alerts', { method: 'POST', body: JSON.stringify(data || {}) }),
  getMyCrisisAlerts: () => apiRequest('/wellness/crisis-alerts'),

  // Teacher
  getTeacherDashboard: () => apiRequest('/teachers/dashboard'),
  getTeacherGroups: () => apiRequest('/teachers/groups'),
  getTeacherStudents: () => apiRequest('/teachers/students'),
  getTeacherActivities: () => apiRequest('/teachers/activities'),
  createTeacherActivity: (act: any) =>
    apiRequest('/teachers/activities', { method: 'POST', body: JSON.stringify(act) }),
  updateTeacherActivity: (id: string, updates: any) =>
    apiRequest(`/teachers/activities/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),
  deleteTeacherActivity: (id: string) =>
    apiRequest(`/teachers/activities/${id}`, { method: 'DELETE' }),
  getTeacherGrades: (subjectId: string) => apiRequest(`/teachers/grades/${subjectId}`),
  submitTeacherGrade: (grade: any) =>
    apiRequest('/teachers/grades', { method: 'POST', body: JSON.stringify(grade) }),
  updateTeacherGrade: (id: string, updates: any) =>
    apiRequest(`/teachers/grades/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),
  deleteTeacherGrade: (id: string) =>
    apiRequest(`/teachers/grades/${id}`, { method: 'DELETE' }),
  getTeacherCounselingRequests: () => apiRequest('/teachers/counseling-requests'),
  updateTeacherCounselingRequest: (id: string, data: any) =>
    apiRequest(`/teachers/counseling-requests/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getTeacherCrisisAlerts: () => apiRequest('/teachers/crisis-alerts'),

  // Psychologist
  getPsychologistDashboard: () => apiRequest('/psychologists/dashboard'),
  getPsychologistRequests: () => apiRequest('/psychologists/requests'),
  getPsychologistAppointments: () => apiRequest('/psychologists/appointments'),
  updatePsychologistRequest: (id: string, updates: any) =>
    apiRequest(`/psychologists/requests/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),
  getPsychologistHistoryList: () => apiRequest('/psychologists/history'),
  getPsychologistHistory: (studentId: string) => apiRequest(`/psychologists/history/${studentId}`),
  getPsychologistAISummaries: () => apiRequest('/psychologists/ai-summaries'),
  getPsychologistAISummary: (studentId: string) =>
    apiRequest(`/psychologists/ai-summary/${studentId}`, { method: 'POST' }),
  getPsychologistCrisisAlerts: () => apiRequest('/psychologists/crisis-alerts'),
  updatePsychologistCrisisAlertStatus: (id: string, data: any) =>
    apiRequest(`/psychologists/crisis-alerts/${id}/status`, { method: 'PUT', body: JSON.stringify(data) }),

  // Admin
  getAdminDashboard: () => apiRequest('/admin/dashboard'),
  getAdminUsers: (params?: { role?: string; search?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return apiRequest(`/admin/users${q ? `?${q}` : ''}`);
  },
  createAdminUser: (user: any) =>
    apiRequest('/admin/users', { method: 'POST', body: JSON.stringify(user) }),
  updateAdminUser: (id: string, updates: any) =>
    apiRequest(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),
  deleteAdminUser: (id: string) =>
    apiRequest(`/admin/users/${id}`, { method: 'DELETE' }),
  getAdminGroups: () => apiRequest('/admin/groups'),
  createAdminGroup: (group: any) =>
    apiRequest('/admin/groups', { method: 'POST', body: JSON.stringify(group) }),
  updateAdminGroup: (id: string, updates: any) =>
    apiRequest(`/admin/groups/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),
  deleteAdminGroup: (id: string) =>
    apiRequest(`/admin/groups/${id}`, { method: 'DELETE' }),
  getAdminSubjects: () => apiRequest('/admin/subjects'),
  createAdminSubject: (subject: any) =>
    apiRequest('/admin/subjects', { method: 'POST', body: JSON.stringify(subject) }),
  updateAdminSubject: (id: string, updates: any) =>
    apiRequest(`/admin/subjects/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),
  deleteAdminSubject: (id: string) =>
    apiRequest(`/admin/subjects/${id}`, { method: 'DELETE' }),
  getAdminStats: () => apiRequest('/admin/stats'),
  getAdminAuditLogs: () => apiRequest('/admin/audit-logs'),

  // Communication
  getGroupMessages: (subjectId: string) => apiRequest(`/communication/messages/${subjectId}`),
  sendGroupMessage: (subjectId: string, content: string) =>
    apiRequest(`/communication/messages/${subjectId}`, { method: 'POST', body: JSON.stringify({ content }) }),
  getAnnouncements: () => apiRequest('/communication/announcements'),
  createAnnouncement: (announcement: any) =>
    apiRequest('/communication/announcements', { method: 'POST', body: JSON.stringify(announcement) }),
  getNotifications: () => apiRequest('/communication/notifications'),
  markNotificationRead: (id: string) =>
    apiRequest(`/communication/notifications/${id}/read`, { method: 'PUT' }),
  submitAnonymousEvaluation: (evaluation: any) =>
    apiRequest('/communication/evaluations', { method: 'POST', body: JSON.stringify(evaluation) }),
};
