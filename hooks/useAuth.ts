'use client';

import { useState, useEffect, useCallback } from 'react';
import { Models } from 'appwrite';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { authService } from '@/lib/auth';
import { AuthState, AuthContextType, UserProfile, UserRole } from '@/types/auth';

export function useAuth(): AuthContextType {
  const [state, setState] = useState<AuthState>({
    user: null,
    userProfile: null,
    role: null,
    loading: true,
    isAuthenticated: false,
  });
  
  const router = useRouter();

  /**
   * Update auth state
   */
  const updateState = useCallback((updates: Partial<AuthState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * Check current authentication status
   */
  const checkAuth = useCallback(async (): Promise<void> => {
    try {
      updateState({ loading: true });
      
      const user = await authService.getCurrentUser();
      
      if (!user) {
        updateState({
          user: null,
          userProfile: null,
          role: null,
          isAuthenticated: false,
          loading: false,
        });
        return;
      }

      // Get or create user profile
      let userProfile = await authService.getUserProfile(user.$id);
      
      if (!userProfile) {
        userProfile = await authService.createUserProfile(user);
        toast.success('Welcome to your new account!');
      } else {
        // Update last login
        await authService.updateLastLogin(user.$id);
      }

      updateState({
        user,
        userProfile,
        role: userProfile.role,
        isAuthenticated: true,
        loading: false,
      });

    } catch (error) {
      console.error('Auth check failed:', error);
      updateState({
        user: null,
        userProfile: null,
        role: null,
        isAuthenticated: false,
        loading: false,
      });
    }
  }, [updateState]);

  /**
   * Sign in with Google
   */
  const signIn = useCallback(async (): Promise<void> => {
    try {
      await authService.signInWithGoogle();
    } catch (error) {
      console.error('Sign in failed:', error);
      toast.error('Failed to initiate sign in');
      throw error;
    }
  }, []);

  /**
   * Handle OAuth callback after successful authentication
   */
  const handleOAuthCallback = useCallback(async (): Promise<void> => {
    try {
      updateState({ loading: true });
      
      // Clear URL parameters to prevent re-triggering
      window.history.replaceState({}, '', '/login');
      
      const user = await authService.getCurrentUser();
      
      if (!user) {
        throw new Error('No authenticated user found');
      }

      // Get or create user profile
      let userProfile = await authService.getUserProfile(user.$id);
      
      if (!userProfile) {
        userProfile = await authService.createUserProfile(user);
        toast.success('Welcome to your new account!');
      } else {
        await authService.updateLastLogin(user.$id);
        toast.success('Successfully logged in!');
      }

      updateState({
        user,
        userProfile,
        role: userProfile.role,
        isAuthenticated: true,
        loading: false,
      });

      // Redirect based on role
      if (userProfile.role === 'admin') {
        router.replace('/admin');
      } else {
        router.replace('/student/profile');
      }

    } catch (error) {
      console.error('OAuth callback failed:', error);
      toast.error('Authentication failed');
      window.history.replaceState({}, '', '/login');
      updateState({ loading: false });
    }
  }, [router, updateState]);

  /**
   * Sign out
   */
  const signOut = useCallback(async (): Promise<void> => {
    try {
      await authService.signOut();
      
      updateState({
        user: null,
        userProfile: null,
        role: null,
        isAuthenticated: false,
        loading: false,
      });
      
      router.push('/');
      toast.success('Successfully signed out');
    } catch (error) {
      console.error('Sign out failed:', error);
      toast.error('Failed to sign out');
    }
  }, [router, updateState]);

  /**
   * Update user role (admin only)
   */
  const updateUserRole = useCallback(async (userId: string, newRole: UserRole): Promise<void> => {
    try {
      if (!authService.isAdmin(state.role)) {
        throw new Error('Unauthorized: Admin access required');
      }

      await authService.updateUserRole(userId, newRole);
      
      // Update local state if updating current user
      if (userId === state.user?.$id) {
        updateState({
          role: newRole,
          userProfile: state.userProfile ? { ...state.userProfile, role: newRole } : null,
        });
      }
      
      toast.success(`User role updated to ${newRole}`);
    } catch (error) {
      console.error('Update user role failed:', error);
      toast.error('Failed to update user role');
      throw error;
    }
  }, [state.role, state.user?.$id, state.userProfile, updateState]);

  /**
   * Get all users (admin only)
   */
  const getAllUsers = useCallback(async (): Promise<UserProfile[]> => {
    try {
      if (!authService.isAdmin(state.role)) {
        throw new Error('Unauthorized: Admin access required');
      }

      return await authService.getAllUsers();
    } catch (error) {
      console.error('Get all users failed:', error);
      throw error;
    }
  }, [state.role]);

  /**
   * Refresh authentication state
   */
  const refreshAuth = useCallback(async (): Promise<void> => {
    await checkAuth();
  }, [checkAuth]);

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return {
    ...state,
    signIn,
    signOut,
    updateUserRole,
    getAllUsers,
    refreshAuth,
    handleOAuthCallback,
  };
}
