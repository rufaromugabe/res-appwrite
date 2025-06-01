import { useState, useEffect } from 'react';
import { Models, OAuthProvider } from 'appwrite';
import { account, databases, DATABASE_ID, COLLECTION_IDS, Query } from '@/lib/appwrite';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

type UserRole = 'user' | 'admin' | null;

interface UserProfile {
  $id: string;
  displayName: string;
  email: string;
  role: UserRole;
  createdAt: string;
  lastLoginAt?: string;
}

export function useAppwriteAuth() {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UserRole>(null);
  const router = useRouter();

  // Check current session on mount
  useEffect(() => {
    checkCurrentUser();
  }, []);

  const checkCurrentUser = async () => {
    try {
      setLoading(true);
      const currentUser = await account.get();
      setUser(currentUser);
      
      if (currentUser) {
        await fetchUserProfile(currentUser.$id);
      }
    } catch (error) {
      // No active session
      setUser(null);
      setUserProfile(null);
      setRole(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async (userId: string) => {
    try {
      // Try to get user profile from users collection
      const userDoc = await databases.getDocument(
        DATABASE_ID,
        COLLECTION_IDS.USERS,
        userId
      );
      
      const profile: UserProfile = {
        $id: userDoc.$id,
        displayName: userDoc.displayName,
        email: userDoc.email,
        role: userDoc.role as UserRole,
        createdAt: userDoc.createdAt,
        lastLoginAt: userDoc.lastLoginAt
      };
      
      setUserProfile(profile);
      setRole(profile.role);
      
      // Update last login time
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_IDS.USERS,
        userId,
        {
          lastLoginAt: new Date().toISOString()
        }
      );
      
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setRole(null);
    }
  };

  const createUserProfile = async (user: Models.User<Models.Preferences>) => {
    try {
      const newProfile = {
        displayName: user.name || user.email.split('@')[0],
        email: user.email,
        role: 'user' as UserRole,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      };

      const userDoc = await databases.createDocument(
        DATABASE_ID,
        COLLECTION_IDS.USERS,
        user.$id, // Use user ID as document ID
        newProfile
      );

      const profile: UserProfile = {
        $id: userDoc.$id,
        displayName: userDoc.displayName,
        email: userDoc.email,
        role: userDoc.role as UserRole,
        createdAt: userDoc.createdAt,
        lastLoginAt: userDoc.lastLoginAt
      };

      setUserProfile(profile);
      setRole('user');
      toast.success('Welcome to your new account!');
      
      return profile;
    } catch (error) {
      console.error('Error creating user profile:', error);
      toast.error('Error setting up user account');
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      // Create OAuth2 session with Google
      await account.createOAuth2Session(
        OAuthProvider.Google,
        `${process.env.NEXT_PUBLIC_BASE_URL}/login?success=true`,
        `${process.env.NEXT_PUBLIC_BASE_URL}/login?error=true`
      );
    } catch (error) {
      console.error('Error initiating Google sign-in:', error);
      toast.error('Failed to initiate Google sign-in');
    }
  };

  const handleOAuthCallback = async () => {
    try {
      const currentUser = await account.get();
      setUser(currentUser);

      if (currentUser) {
        try {
          // Try to get existing profile
          await fetchUserProfile(currentUser.$id);
          toast.success('Successfully logged in!');
        } catch (error) {
          // Profile doesn't exist, create new one
          await createUserProfile(currentUser);
        }

        // Redirect based on role
        setTimeout(() => {
          if (role === 'admin') {
            router.push('/admin');
          } else {
            router.push('/student/profile');
          }
        }, 1000);
      }
    } catch (error) {
      console.error('Error handling OAuth callback:', error);
      toast.error('Error completing sign-in process');
    }
  };

  const signOut = async () => {
    try {
      await account.deleteSession('current');
      setUser(null);
      setUserProfile(null);
      setRole(null);
      router.push('/');
      toast.success('Successfully signed out');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Error signing out');
    }
  };

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_IDS.USERS,
        userId,
        {
          role: newRole
        }
      );
      
      if (userId === user?.$id) {
        setRole(newRole);
        setUserProfile(prev => prev ? { ...prev, role: newRole } : null);
      }
      
      toast.success(`User role updated to ${newRole}`);
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Error updating user role');
      throw error;
    }
  };

  const getAllUsers = async (): Promise<UserProfile[]> => {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_IDS.USERS,
        [
          Query.orderDesc('createdAt'),
          Query.limit(100)
        ]
      );
      
      return response.documents.map(doc => ({
        $id: doc.$id,
        displayName: doc.displayName,
        email: doc.email,
        role: doc.role as UserRole,
        createdAt: doc.createdAt,
        lastLoginAt: doc.lastLoginAt
      }));
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  };

  return {
    user,
    userProfile,
    loading,
    role,
    signInWithGoogle,
    handleOAuthCallback,
    signOut,
    updateUserRole,
    getAllUsers,
    checkCurrentUser
  };
}
