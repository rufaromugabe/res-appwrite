'use client'

import { useContext } from 'react';
import { AuthContext } from '@/components/auth-provider';

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
