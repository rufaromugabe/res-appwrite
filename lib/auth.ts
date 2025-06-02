import { account, databases, DATABASE_ID, COLLECTION_IDS, Query } from '@/lib/appwrite';
import { Models, OAuthProvider } from 'appwrite';
import { UserProfile, UserRole } from '@/types/auth';
import { toast } from 'react-toastify';

class AuthService {
  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<Models.User<Models.Preferences> | null> {
    try {
      return await account.get();
    } catch (error) {
      return null;
    }
  }

  /**
   * Get user profile from database
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const userDoc = await databases.getDocument(
        DATABASE_ID,
        COLLECTION_IDS.USERS,
        userId
      );

      return {
        $id: userDoc.$id,
        displayName: userDoc.displayName,
        email: userDoc.email,
        role: userDoc.role as UserRole,
        createdAt: userDoc.createdAt,
        lastLoginAt: userDoc.lastLoginAt
      };
    } catch (error: any) {
      if (error.code === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Create user profile in database
   */
  async createUserProfile(user: Models.User<Models.Preferences>): Promise<UserProfile> {
    const profileData = {
      displayName: user.name || user.email.split('@')[0],
      email: user.email,
      role: 'user' as UserRole,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    };

    const userDoc = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_IDS.USERS,
      user.$id,
      profileData
    );

    return {
      $id: userDoc.$id,
      displayName: userDoc.displayName,
      email: userDoc.email,
      role: userDoc.role as UserRole,
      createdAt: userDoc.createdAt,
      lastLoginAt: userDoc.lastLoginAt
    };
  }

  /**
   * Update last login time
   */
  async updateLastLogin(userId: string): Promise<void> {
    await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_IDS.USERS,
      userId,
      { lastLoginAt: new Date().toISOString() }
    );
  }

  /**
   * Sign in with Google OAuth
   */
  async signInWithGoogle(): Promise<void> {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
    
    await account.createOAuth2Session(
      OAuthProvider.Google,
      `${baseUrl}/login?success=true`,
      `${baseUrl}/login?error=true`
    );
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    await account.deleteSession('current');
  }

  /**
   * Update user role (admin only)
   */
  async updateUserRole(userId: string, newRole: UserRole): Promise<void> {
    await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_IDS.USERS,
      userId,
      { role: newRole }
    );
  }

  /**
   * Get all users (admin only)
   */
  async getAllUsers(): Promise<UserProfile[]> {
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
  }

  /**
   * Check if user has admin role
   */
  isAdmin(role: UserRole | null): boolean {
    return role === 'admin';
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(user: Models.User<Models.Preferences> | null): boolean {
    return user !== null;
  }
}

export const authService = new AuthService();
