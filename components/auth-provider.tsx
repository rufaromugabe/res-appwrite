'use client'

import React from 'react';
import { useAppwriteAuth } from '@/hooks/useAppwriteAuth';

export const AuthContext = React.createContext<ReturnType<typeof useAppwriteAuth> | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAppwriteAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}
