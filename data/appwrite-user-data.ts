import { databases, DATABASE_ID, COLLECTION_IDS, Query, ID } from '@/lib/appwrite';

export interface UserData {
  $id?: string;
  userId: string; // Appwrite user ID
  displayName: string;
  email: string;
  role: "user" | "admin";
  createdAt: string;
  updatedAt?: string;
  isActive?: boolean; // Add active status field
}

/**
 * Creates or updates a user profile
 * @param userData - The user data to create/update
 * @returns The created/updated user document
 */
export const createOrUpdateUser = async (
  userData: Omit<UserData, '$id' | 'createdAt' | 'updatedAt'>
): Promise<UserData> => {
  try {
    // Check if user already exists
    const existingUser = await getUserByUserId(userData.userId);
    
    if (existingUser) {
      // Update existing user
      const updatedUser = await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_IDS.USERS,
        existingUser.$id!,
        {
          displayName: userData.displayName,
          email: userData.email,
          role: userData.role,
          updatedAt: new Date().toISOString()
        }
      );
      
      return {
        $id: updatedUser.$id,
        userId: updatedUser.userId,
        displayName: updatedUser.displayName,
        email: updatedUser.email,
        role: updatedUser.role,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt
      };
    } else {
      // Create new user
      const newUser = await databases.createDocument(
        DATABASE_ID,
        COLLECTION_IDS.USERS,
        ID.unique(),
        {
          userId: userData.userId,
          displayName: userData.displayName,
          email: userData.email,
          role: userData.role,
          createdAt: new Date().toISOString()
        }
      );
      
      return {
        $id: newUser.$id,
        userId: newUser.userId,
        displayName: newUser.displayName,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.createdAt
      };
    }
  } catch (error) {
    console.error('Error creating/updating user:', error);
    throw error;
  }
};

/**
 * Gets a user by Appwrite user ID
 * @param userId - The Appwrite user ID
 * @returns The user data or null if not found
 */
export const getUserByUserId = async (userId: string): Promise<UserData | null> => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_IDS.USERS,
      [
        Query.equal('userId', userId),
        Query.limit(1)
      ]
    );

    if (response.documents.length === 0) {
      return null;
    }

    const userDoc = response.documents[0];
    return {
      $id: userDoc.$id,
      userId: userDoc.userId,
      displayName: userDoc.displayName,
      email: userDoc.email,
      role: userDoc.role,
      createdAt: userDoc.createdAt,
      updatedAt: userDoc.updatedAt
    };
  } catch (error) {
    console.error('Error fetching user by userId:', error);
    return null;
  }
};

/**
 * Gets all users with pagination
 * @param limit - Number of users to fetch
 * @param offset - Number of users to skip
 * @returns Array of user data and pagination info
 */
export const getAllUsers = async (
  limit: number = 50,
  offset: number = 0
): Promise<{
  users: UserData[];
  total: number;
  hasMore: boolean;
}> => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_IDS.USERS,
      [
        Query.orderDesc('createdAt'),
        Query.limit(limit),
        Query.offset(offset)
      ]
    );

    const users = response.documents.map(doc => ({
      $id: doc.$id,
      userId: doc.userId,
      displayName: doc.displayName,
      email: doc.email,
      role: doc.role,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    }));

    return {
      users,
      total: response.total,
      hasMore: offset + limit < response.total
    };
  } catch (error) {
    console.error('Error fetching all users:', error);
    return {
      users: [],
      total: 0,
      hasMore: false
    };
  }
};

/**
 * Gets all users with pagination support using cursor-based pagination
 * @param lastDocId - Optional ID of the last document from previous page for pagination
 * @param pageSize - Number of users to fetch per page
 * @returns Array of users and pagination info
 */
export const getAllUsersWithCursorPagination = async (
  lastDocId?: string,
  pageSize: number = 10
): Promise<{
  users: UserData[];
  hasMore: boolean;
  lastDocId: string | null;
}> => {
  try {
    const queries = [
      Query.orderDesc('$createdAt'),
      Query.limit(pageSize)
    ];

    if (lastDocId) {
      queries.push(Query.cursorAfter(lastDocId));
    }

    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_IDS.USERS,
      queries
    );

    const users = response.documents.map(doc => ({
      $id: doc.$id,
      userId: doc.userId,
      displayName: doc.displayName,
      email: doc.email,
      role: doc.role as 'user' | 'admin',
      createdAt: doc.createdAt || doc.$createdAt,
      isActive: doc.isActive !== false // Default to true if not specified
    }));

    return {
      users,
      hasMore: response.documents.length === pageSize,
      lastDocId: response.documents.length > 0 ? response.documents[response.documents.length - 1].$id : null
    };
  } catch (error) {
    console.error('Error fetching users with cursor pagination:', error);
    return {
      users: [],
      hasMore: false,
      lastDocId: null
    };
  }
};

/**
 * Search users by display name or email
 * @param searchQuery - The search term
 * @returns Array of matching users
 */
export const searchUsersByQuery = async (searchQuery: string): Promise<UserData[]> => {
  try {
    if (!searchQuery.trim()) {
      const result = await getAllUsers();
      return result.users;
    }

    // Since Appwrite doesn't have built-in text search, we'll fetch all users and filter
    // For better performance in production, consider implementing a search service
    const allUsersResponse = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_IDS.USERS,
      [
        Query.orderDesc('createdAt'),
        Query.limit(1000) // Reasonable limit for search
      ]
    );

    const filteredUsers = allUsersResponse.documents
      .filter(doc => 
        doc.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.email?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .map(doc => ({
        $id: doc.$id,
        userId: doc.userId,
        displayName: doc.displayName,
        email: doc.email,
        role: doc.role as 'user' | 'admin',
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        isActive: doc.isActive !== false
      }));

    return filteredUsers;
  } catch (error) {
    console.error('Error searching users:', error);
    return [];
  }
};

/**
 * Alias for searchUsersByQuery for compatibility
 * @param searchQuery - The search term
 * @returns Array of matching users
 */
export const searchUsers = searchUsersByQuery;

/**
 * Updates a user's role
 * @param userDocId - The document ID of the user
 * @param newRole - The new role to assign
 * @returns The updated user data
 */
export const updateUserRole = async (
  userDocId: string,
  newRole: "user" | "admin"
): Promise<UserData> => {
  try {
    const updatedUser = await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_IDS.USERS,
      userDocId,
      {
        role: newRole,
        updatedAt: new Date().toISOString()
      }
    );

    return {
      $id: updatedUser.$id,
      userId: updatedUser.userId,
      displayName: updatedUser.displayName,
      email: updatedUser.email,
      role: updatedUser.role,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt
    };
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
};

/**
 * Toggle user active status
 * @param userId - The user ID to update
 * @param isActive - Whether the user should be active
 */
export const updateUserStatus = async (userId: string, isActive: boolean): Promise<void> => {
  try {
    await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_IDS.USERS,
      userId,
      { isActive }
    );
  } catch (error) {
    console.error('Error updating user status:', error);
    throw error;
  }
};

/**
 * Deletes a user
 * @param userDocId - The document ID of the user to delete
 */
export const deleteUser = async (userDocId: string): Promise<void> => {
  try {
    await databases.deleteDocument(
      DATABASE_ID,
      COLLECTION_IDS.USERS,
      userDocId
    );
    console.log(`User ${userDocId} deleted successfully`);
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};
