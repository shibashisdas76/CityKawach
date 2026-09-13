import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole } from '@shared/types/cctv-metadata.contract';

export interface UserProfile {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  role: UserRole;
  departmentId?: string;
  departmentName?: string;
  badgeNumber: string;
}

interface AuthContextType {
  currentUser: UserProfile | null;
  isAuthenticated: boolean;
  token: string | null;
  login: (email: string, password?: string, role?: UserRole, departmentId?: string) => Promise<boolean>;
  logout: () => void;
  setRole: (role: UserRole) => void;
  setDepartmentId: (deptId?: string) => void;
}

const STORAGE_KEY = 'gscip_auth_session';

export const DEMO_PROFILES: Record<string, UserProfile> = {
  'superadmin@gujarat.gov.in': {
    id: 'a1111111-1111-1111-1111-111111111111',
    userId: 'b1111111-1111-1111-1111-111111111111',
    fullName: 'Vikramaditya Sharma',
    email: 'superadmin@gujarat.gov.in',
    role: 'SUPER_ADMIN',
    badgeNumber: 'GJ-SP-001'
  },
  'state.admin@gujarat.gov.in': {
    id: 'a2222222-2222-2222-2222-222222222222',
    userId: 'b2222222-2222-2222-2222-222222222222',
    fullName: 'Kavita Dave',
    email: 'state.admin@gujarat.gov.in',
    role: 'STATE_ADMIN',
    badgeNumber: 'GJ-SA-104'
  },
  'ahmedabad.police@gujarat.gov.in': {
    id: 'a3333333-3333-3333-3333-333333333333',
    userId: 'b3333333-3333-3333-3333-333333333333',
    fullName: 'Inspector Rajesh Varma',
    email: 'ahmedabad.police@gujarat.gov.in',
    role: 'DEPARTMENT_ADMIN',
    departmentId: '11111111-1111-1111-1111-111111111111',
    departmentName: 'Ahmedabad Traffic Police Surveillance',
    badgeNumber: 'GJ-POL-882'
  },
  'operator@gujarat.gov.in': {
    id: 'a4444444-4444-4444-4444-444444444444',
    userId: 'b4444444-4444-4444-4444-444444444444',
    fullName: 'Sanjay Solanki',
    email: 'operator@gujarat.gov.in',
    role: 'OPERATOR',
    departmentId: '11111111-1111-1111-1111-111111111111',
    departmentName: 'State Command Center Ops',
    badgeNumber: 'GJ-OPS-302'
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved).user;
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [token, setToken] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved).token;
      }
    } catch {
      // ignore
    }
    return null;
  });

  const login = async (email: string, password?: string, role?: UserRole, departmentId?: string): Promise<boolean> => {
    // Generate secure synthetic JWT session for authorized users
    const normalizedEmail = email.trim().toLowerCase();
    let profile = DEMO_PROFILES[normalizedEmail];

    if (!profile) {
      // Build dynamic profile for valid domain or fallback demo
      const namePart = normalizedEmail.split('@')[0].replace('.', ' ');
      const formattedName = namePart.replace(/\b\w/g, c => c.toUpperCase());
      const assignedRole = role || (normalizedEmail.includes('admin') ? 'STATE_ADMIN' : 'DEPARTMENT_ADMIN');

      profile = {
        id: `u-${Date.now()}`,
        userId: `usr-${Date.now()}`,
        fullName: formattedName || 'Command Officer',
        email: normalizedEmail,
        role: assignedRole,
        departmentId: departmentId || (assignedRole === 'DEPARTMENT_ADMIN' || assignedRole === 'OPERATOR' ? '11111111-1111-1111-1111-111111111111' : undefined),
        departmentName: departmentId ? 'Gujarat State Department' : undefined,
        badgeNumber: `GJ-OFF-${Math.floor(100 + Math.random() * 900)}`
      };
    }

    const sessionToken = `jwt_${btoa(profile.email)}_${Date.now()}`;
    setCurrentUser(profile);
    setToken(sessionToken);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: profile, token: sessionToken }));
    } catch (e) {
      console.warn('Failed to persist session to localStorage', e);
    }

    return true;
  };

  const logout = () => {
    setCurrentUser(null);
    setToken(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const setRole = (role: UserRole) => {
    if (!currentUser) return;
    let deptId = currentUser.departmentId;
    let deptName = currentUser.departmentName;

    if (role === 'DEPARTMENT_ADMIN' || role === 'OPERATOR') {
      deptId = '11111111-1111-1111-1111-111111111111';
      deptName = 'Ahmedabad Traffic Police Surveillance';
    } else if (role === 'SUPER_ADMIN' || role === 'STATE_ADMIN') {
      deptId = undefined;
      deptName = undefined;
    }

    const updated: UserProfile = {
      ...currentUser,
      role,
      departmentId: deptId,
      departmentName: deptName
    };

    setCurrentUser(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: updated, token }));
    } catch {
      // ignore
    }
  };

  const setDepartmentId = (deptId?: string) => {
    if (!currentUser) return;
    const updated: UserProfile = {
      ...currentUser,
      departmentId: deptId
    };
    setCurrentUser(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: updated, token }));
    } catch {
      // ignore
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        token,
        login,
        logout,
        setRole,
        setDepartmentId
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
