import { databases, DATABASE_ID, COLLECTION_IDS, Query, ID } from '@/lib/appwrite';
import { Models } from 'appwrite';

export interface StudentProfile {
  $id?: string;
  regNumber: string;
  name: string;
  gender: 'Male' | 'Female';
  programme: string;
  part: number;
  email: string;
  phone?: string;
  userId?: string; // Link to authenticated user
  createdAt?: string;
}

/**
 * Creates or updates a student profile
 * @param studentData - The student profile data
 * @returns The created/updated student document
 */
export const createOrUpdateStudentProfile = async (
  studentData: StudentProfile
): Promise<StudentProfile> => {
  try {
    // Check if student already exists
    const existingStudent = await getStudentByRegNumber(studentData.regNumber);
    
    if (existingStudent) {
      // Update existing student
      const updatedStudent = await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_IDS.STUDENTS,
        existingStudent.$id!,
        {
          name: studentData.name,
          gender: studentData.gender,
          programme: studentData.programme,
          part: studentData.part,
          email: studentData.email,
          phone: studentData.phone,
          userId: studentData.userId
        }
      );
      
      return {
        $id: updatedStudent.$id,
        regNumber: updatedStudent.regNumber,
        name: updatedStudent.name,
        gender: updatedStudent.gender,
        programme: updatedStudent.programme,
        part: updatedStudent.part,
        email: updatedStudent.email,
        phone: updatedStudent.phone,
        userId: updatedStudent.userId,
        createdAt: updatedStudent.createdAt
      };
    } else {
      // Create new student
      const newStudent = await databases.createDocument(
        DATABASE_ID,
        COLLECTION_IDS.STUDENTS,
        ID.unique(),
        {
          regNumber: studentData.regNumber,
          name: studentData.name,
          gender: studentData.gender,
          programme: studentData.programme,
          part: studentData.part,
          email: studentData.email,
          phone: studentData.phone || '',
          userId: studentData.userId,
          createdAt: new Date().toISOString()
        }
      );
      
      return {
        $id: newStudent.$id,
        regNumber: newStudent.regNumber,
        name: newStudent.name,
        gender: newStudent.gender,
        programme: newStudent.programme,
        part: newStudent.part,
        email: newStudent.email,
        phone: newStudent.phone,
        userId: newStudent.userId,
        createdAt: newStudent.createdAt
      };
    }
  } catch (error) {
    console.error('Error creating/updating student profile:', error);
    throw error;
  }
};

/**
 * Gets a student profile by registration number
 * @param regNumber - The registration number to search for
 * @returns The student profile or null if not found
 */
export const getStudentByRegNumber = async (
  regNumber: string
): Promise<StudentProfile | null> => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_IDS.STUDENTS,
      [
        Query.equal('regNumber', regNumber),
        Query.limit(1)
      ]
    );

    if (response.documents.length === 0) {
      return null;
    }

    const studentDoc = response.documents[0];
    return {
      $id: studentDoc.$id,
      regNumber: studentDoc.regNumber,
      name: studentDoc.name,
      gender: studentDoc.gender,
      programme: studentDoc.programme,
      part: studentDoc.part,
      email: studentDoc.email,
      phone: studentDoc.phone,
      userId: studentDoc.userId,
      createdAt: studentDoc.createdAt
    };
  } catch (error) {
    console.error('Error fetching student by regNumber:', error);
    return null;
  }
};

/**
 * Gets a student profile by user ID
 * @param userId - The user ID to search for
 * @returns The student profile or null if not found
 */
export const getStudentByUserId = async (
  userId: string
): Promise<StudentProfile | null> => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_IDS.STUDENTS,
      [
        Query.equal('userId', userId),
        Query.limit(1)
      ]
    );

    if (response.documents.length === 0) {
      return null;
    }

    const studentDoc = response.documents[0];
    return {
      $id: studentDoc.$id,
      regNumber: studentDoc.regNumber,
      name: studentDoc.name,
      gender: studentDoc.gender,
      programme: studentDoc.programme,
      part: studentDoc.part,
      email: studentDoc.email,
      phone: studentDoc.phone,
      userId: studentDoc.userId,
      createdAt: studentDoc.createdAt
    };
  } catch (error) {
    console.error('Error fetching student by userId:', error);
    return null;
  }
};

/**
 * Gets all student profiles
 * @returns Array of all student profiles
 */
export const getAllStudents = async (): Promise<StudentProfile[]> => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_IDS.STUDENTS,
      [
        Query.orderAsc('name'),
        Query.limit(1000) // Adjust based on your needs
      ]
    );

    return response.documents.map(doc => ({
      $id: doc.$id,
      regNumber: doc.regNumber,
      name: doc.name,
      gender: doc.gender,
      programme: doc.programme,
      part: doc.part,
      email: doc.email,
      phone: doc.phone,
      userId: doc.userId,
      createdAt: doc.createdAt
    }));
  } catch (error) {
    console.error('Error fetching all students:', error);
    return [];
  }
};

/**
 * Gets students by gender
 * @param gender - The gender to filter by
 * @returns Array of student profiles matching the gender
 */
export const getStudentsByGender = async (
  gender: 'Male' | 'Female'
): Promise<StudentProfile[]> => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_IDS.STUDENTS,
      [
        Query.equal('gender', gender),
        Query.orderAsc('name'),
        Query.limit(1000)
      ]
    );

    return response.documents.map(doc => ({
      $id: doc.$id,
      regNumber: doc.regNumber,
      name: doc.name,
      gender: doc.gender,
      programme: doc.programme,
      part: doc.part,
      email: doc.email,
      phone: doc.phone,
      userId: doc.userId,
      createdAt: doc.createdAt
    }));
  } catch (error) {
    console.error('Error fetching students by gender:', error);
    return [];
  }
};

/**
 * Gets students by programme
 * @param programme - The programme to filter by
 * @returns Array of student profiles matching the programme
 */
export const getStudentsByProgramme = async (
  programme: string
): Promise<StudentProfile[]> => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_IDS.STUDENTS,
      [
        Query.equal('programme', programme),
        Query.orderAsc('name'),
        Query.limit(1000)
      ]
    );

    return response.documents.map(doc => ({
      $id: doc.$id,
      regNumber: doc.regNumber,
      name: doc.name,
      gender: doc.gender,
      programme: doc.programme,
      part: doc.part,
      email: doc.email,
      phone: doc.phone,
      userId: doc.userId,
      createdAt: doc.createdAt
    }));
  } catch (error) {
    console.error('Error fetching students by programme:', error);
    return [];
  }
};

/**
 * Updates a student profile
 * @param studentId - The ID of the student to update
 * @param updateData - The data to update
 * @returns The updated student profile
 */
export const updateStudentProfile = async (
  studentId: string,
  updateData: Partial<Omit<StudentProfile, '$id' | 'createdAt'>>
): Promise<StudentProfile> => {
  try {
    const updatedStudent = await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_IDS.STUDENTS,
      studentId,
      updateData
    );

    return {
      $id: updatedStudent.$id,
      regNumber: updatedStudent.regNumber,
      name: updatedStudent.name,
      gender: updatedStudent.gender,
      programme: updatedStudent.programme,
      part: updatedStudent.part,
      email: updatedStudent.email,
      phone: updatedStudent.phone,
      userId: updatedStudent.userId,
      createdAt: updatedStudent.createdAt
    };
  } catch (error) {
    console.error('Error updating student profile:', error);
    throw error;
  }
};

/**
 * Deletes a student profile
 * @param studentId - The ID of the student to delete
 */
export const deleteStudentProfile = async (studentId: string): Promise<void> => {
  try {
    await databases.deleteDocument(
      DATABASE_ID,
      COLLECTION_IDS.STUDENTS,
      studentId
    );
    console.log(`Student ${studentId} deleted successfully`);
  } catch (error) {
    console.error('Error deleting student profile:', error);
    throw error;
  }
};

/**
 * Searches students by name (partial match)
 * @param searchTerm - The search term to match against names
 * @returns Array of student profiles matching the search term
 */
export const searchStudentsByName = async (
  searchTerm: string
): Promise<StudentProfile[]> => {
  try {
    // Appwrite doesn't have built-in text search, so we'll fetch all and filter
    // For better performance, consider implementing full-text search with a separate service
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_IDS.STUDENTS,
      [
        Query.orderAsc('name'),
        Query.limit(1000)
      ]
    );

    const filteredStudents = response.documents.filter(doc => 
      doc.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return filteredStudents.map(doc => ({
      $id: doc.$id,
      regNumber: doc.regNumber,
      name: doc.name,
      gender: doc.gender,
      programme: doc.programme,
      part: doc.part,
      email: doc.email,
      phone: doc.phone,
      userId: doc.userId,
      createdAt: doc.createdAt
    }));
  } catch (error) {
    console.error('Error searching students by name:', error);
    return [];
  }
};
