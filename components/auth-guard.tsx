'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/hooks/useAuthContext';
import { LoadingSpinner } from '@/components/loading-spinner';
import { UserRole } from '@/types/auth';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  fallbackPath?: string;
}

export function AuthGuard({ 
  children, 
  requiredRole, 
  fallbackPath = '/login' 
}: AuthGuardProps) {
  const { user, role, loading, isAuthenticated } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // Redirect to login if not authenticated
    if (!isAuthenticated || !user) {
      router.push(fallbackPath);
      return;
    }

    // Check role-based access
    if (requiredRole && role !== requiredRole) {
      router.push('/unauthorized');
      return;
    }
  }, [user, role, loading, isAuthenticated, requiredRole, router, fallbackPath]);

  // Show loading spinner while checking auth
  if (loading) {
    return <LoadingSpinner />;
  }

  // Don't render children if not authenticated or wrong role
  if (!isAuthenticated || !user) {
    return null;
  }

  if (requiredRole && role !== requiredRole) {
    return null;
  }

  return <>{children}</>;
}

// Convenience components for specific roles
export function AdminGuard({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requiredRole="admin">
      {children}
    </AuthGuard>
  );
}

export function StudentGuard({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requiredRole="user">
      {children}
    </AuthGuard>
  );
}

// Public route guard (redirects authenticated users)
export function PublicGuard({ 
  children, 
  redirectPath = '/student/profile' 
}: { 
  children: React.ReactNode;
  redirectPath?: string;
}) {
  const { user, role, loading, isAuthenticated } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (isAuthenticated && user) {
      // Redirect based on role
      const defaultPath = role === 'admin' ? '/admin' : '/student/profile';
      router.push(redirectPath === '/student/profile' ? defaultPath : redirectPath);
    }
  }, [user, role, loading, isAuthenticated, router, redirectPath]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (isAuthenticated && user) {
    return null;
  }

  return <>{children}</>;
}
