'use client';

import { createContext, useContext } from 'react';
import type { Me } from '@/lib/types';

type AuthContextValue = {
  me: Me;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  me,
  children,
}: {
  me: Me;
  children: React.ReactNode;
}) {
  return <AuthContext.Provider value={{ me }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
