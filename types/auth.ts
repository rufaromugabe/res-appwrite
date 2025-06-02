import { Models } from 'appwrite';

export type UserRole = 'user' | 'admin' | null;

export interface UserProfile {
  $id: string;
  displayName: string;
  email: string;
  role: UserRole;
  createdAt: string;
  lastLoginAt?: string;
}

export interface AuthState {
  user: Models.User<Models.Preferences> | null;
  userProfile: UserProfile | null;
  role: UserRole;
  loading: boolean;
  isAuthenticated: boolean;
}

export interface AuthContextType extends AuthState {
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  updateUserRole: (userId: string, newRole: UserRole) => Promise<void>;
  getAllUsers: () => Promise<UserProfile[]>;
  refreshAuth: () => Promise<void>;
  handleOAuthCallback: () => Promise<void>;
}
