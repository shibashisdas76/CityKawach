import React, { createContext, useContext, useState } from 'react';
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
  currentUser: UserProfile;
  setRole: (role: UserRole) => void;
  setDepartmentId: (deptId?: string) => void;
}

const DEFAULT_USER: UserProfile = {
  id: 'a1111111-1111-1111-1111-111111111111',
  userId: 'b1111111-1111-1111-1111-111111111111',
  fullName: 'Vikramaditya Sharma',
  email: 'superadmin@gujarat.gov.in',
  role: 'SUPER_ADMIN',
  badgeNumber: 'GJ-SP-001'
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile>(DEFAULT_USER);

  const setRole = (role: UserRole) => {
    let deptId = currentUser.departmentId;
    let deptName = currentUser.departmentName;

    if (role === 'DEPARTMENT_ADMIN' || role === 'OPERATOR') {
      deptId = '11111111-1111-1111-1111-111111111111';
      deptName = 'Ahmedabad Traffic Police Surveillance';
    } else if (role === 'SUPER_ADMIN' || role === 'STATE_ADMIN') {
      deptId = undefined;
      deptName = undefined;
    }

    setCurrentUser(prev => ({
      ...prev,
      role,
      departmentId: deptId,
      departmentName: deptName
    }));
  };

  const setDepartmentId = (deptId?: string) => {
    setCurrentUser(prev => ({
      ...prev,
      departmentId: deptId
    }));
  };

  return (
    <AuthContext.Provider value={{ currentUser, setRole, setDepartmentId }}>
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
