import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { api, setAuthToken, removeAuthToken, getAuthToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  profile: any;
  institution: any;
  loading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  switchRole: (role: Role) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [institution, setInstitution] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    try {
      const data = await api.getMe();
      setUser(data.user);
      setProfile(data.profile);
      setInstitution(data.institution);
    } catch (err) {
      removeAuthToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      fetchCurrentUser();
    } else {
      // Default to student demo user for immediate prototype experience
      api
        .switchDemo('student')
        .then((data) => {
          setAuthToken(data.token);
          fetchCurrentUser();
        })
        .catch(() => {
          setLoading(false);
        });
    }
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    setLoading(true);
    try {
      const data = await api.login(credentials);
      setAuthToken(data.token);
      await fetchCurrentUser();
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: any) => {
    setLoading(true);
    try {
      const res = await api.register(data);
      setAuthToken(res.token);
      await fetchCurrentUser();
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    removeAuthToken();
    setUser(null);
    setProfile(null);
  };

  const switchRole = async (targetRole: Role) => {
    setLoading(true);
    try {
      const data = await api.switchDemo(targetRole);
      setAuthToken(data.token);
      await fetchCurrentUser();
    } catch (err) {
      console.error('Error switching role:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        institution,
        loading,
        login,
        register,
        logout,
        switchRole,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
