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
  };const fetchUserProfile = async (userId: string): Promise<UserProfile> => {
    try {
      // Try to get user profile from users collection
      let userDoc;
      try {
        userDoc = await databases.getDocument(
          DATABASE_ID,
          COLLECTION_IDS.USERS,
          userId
        );
      } catch (err: any) {
        // If user profile doesn't exist (404), create a new one
        if (err.code === 404) {
          console.log('User profile not found, creating new profile...');
          const currentUser = await account.get();
          const newProfile = await createUserProfile(currentUser);
          return newProfile;
        } else {
          // Re-throw if it's not a 404 error
          throw err;
        }
      }
      
      // Initialize profile with base data
      const profile: UserProfile = {
        $id: userDoc.$id,
        displayName: userDoc.displayName,
        email: userDoc.email,
        role: userDoc.role as UserRole,
        createdAt: userDoc.createdAt,
        lastLoginAt: userDoc.lastLoginAt
      };

      // Check if user is in admin team
      try {
        // Since we can't directly list user memberships from client side,
        // we'll rely on the role stored in the database and manual team management
        // The admin team membership should be managed through Appwrite console
        // and the role should be updated manually or through server-side functions
        
        console.log('User role from database:', profile.role);
        
        // For now, we'll trust the role from the database
        // In a production environment, you might want to verify this server-side
        
      } catch (teamError) {
        console.error('Error checking team membership:', teamError);
        // Continue with the existing role from the database
      }
      
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
      
      return profile;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setRole(null);
      throw error;
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
  };  const handleOAuthCallback = async () => {
    try {
      setLoading(true);
      const currentUser = await account.get();
      setUser(currentUser);

      if (currentUser) {
        let userProfile: UserProfile;
        
        try {
          // Fetch user profile (will create if doesn't exist)
          userProfile = await fetchUserProfile(currentUser.$id);
          toast.success('Successfully logged in!');
        } catch (error) {
          console.error('Error getting user profile:', error);
          toast.error('Error setting up user profile');
          return;
        }

        // Redirect based on role from the actual profile data
        console.log('Redirecting user with role:', userProfile.role);
        
        // Clear the URL parameters first
        window.history.replaceState({}, '', '/login');
        
        // Then redirect based on role
        if (userProfile.role === 'admin') {
          router.replace('/admin');
        } else {
          router.replace('/student/profile');
        }
      }
    } catch (error) {
      console.error('Error handling OAuth callback:', error);
      toast.error('Error completing sign-in process');
      // Clear URL parameters even on error
      window.history.replaceState({}, '', '/login');
    } finally {
      setLoading(false);
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
    signIn: signInWithGoogle, // Alias for backward compatibility
    signInWithGoogle,
    handleOAuthCallback,
    signOut,
    updateUserRole,
    getAllUsers,
    checkCurrentUser
  };
}
