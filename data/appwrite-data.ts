import { databases, DATABASE_ID, COLLECTION_IDS, Query } from '@/lib/appwrite';
import { Models } from 'appwrite';

// Define the type for the application (matching your existing Firebase structure)
export type Applications = {
  $id?: string; // Appwrite document ID
  name: string;
  regNumber: string;
  gender: "Male" | "Female";
  programme: string;
  part: number;
  preferredHostel: string;
  email: string;
  phone: string;
  status: "Pending" | "Accepted" | "Archived";
  submittedAt: string;
  date: string; // Formatted date
  time: string; // Formatted time
  paymentStatus: string;
  reference: string;
  userId?: string; // Link to authenticated user
};

/**
 * Helper function to format the timestamp into date and time
 * @param timestamp - The timestamp to format
 * @returns An object with separate date and time strings
 */
const formatTimestamp = (timestamp: string | undefined) => {
  if (!timestamp) return { date: "", time: "" };
  const dateObj = new Date(timestamp);
  const date = dateObj.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const time = dateObj.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return { date, time };
};

/**
 * Fetches all student profiles and their application data from Appwrite
 * @returns A list of Applications for all registration numbers
 */
export const fetchAllApplications = async (): Promise<Applications[]> => {
  try {
    // Fetch all applications
    const applicationsResponse = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_IDS.APPLICATIONS,
      [
        Query.orderDesc('submittedAt'),
        Query.limit(1000) // Adjust based on your needs
      ]
    );

    // Fetch all students
    const studentsResponse = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_IDS.STUDENTS,
      [
        Query.limit(1000) // Adjust based on your needs
      ]
    );

    // Create a map of students by registration number
    const studentsMap = new Map<string, Models.Document>();
    studentsResponse.documents.forEach((studentDoc) => {
      studentsMap.set(studentDoc.regNumber, studentDoc);
    });

    // Merge application data with student data
    const applicationsList: Applications[] = [];
    applicationsResponse.documents.forEach((applicationDoc) => {
      const regNumber = applicationDoc.regNumber;
      const studentData = studentsMap.get(regNumber);

      if (!studentData) {
        console.warn(`Student data not found for ${regNumber}`);
        return;
      }

      const { date, time } = formatTimestamp(applicationDoc.submittedAt);

      applicationsList.push({
        $id: applicationDoc.$id,
        name: studentData.name,
        regNumber,
        gender: studentData.gender,
        programme: studentData.programme,
        part: studentData.part,
        preferredHostel: applicationDoc.preferredHostel || "",
        email: studentData.email,
        phone: studentData.phone || "",
        status: applicationDoc.status || "Pending",
        submittedAt: applicationDoc.submittedAt || "",
        paymentStatus: applicationDoc.paymentStatus || "Not Paid",
        reference: applicationDoc.reference || "",
        userId: applicationDoc.userId,
        date,
        time,
      });
    });

    return applicationsList;
  } catch (error) {
    console.error("Error fetching applications:", error);
    return [];
  }
};

/**
 * Updates the status of a specific application
 * @param regNumber - The registration number of the application
 * @param status - The new status ("Pending", "Accepted", or "Archived")
 */
export const updateApplicationStatus = async (
  regNumber: string,
  status: "Pending" | "Accepted" | "Archived"
) => {
  try {
    // Find the application document by regNumber
    const applicationsResponse = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_IDS.APPLICATIONS,
      [
        Query.equal('regNumber', regNumber),
        Query.limit(1)
      ]
    );

    if (applicationsResponse.documents.length === 0) {
      throw new Error(`Application not found for regNumber: ${regNumber}`);
    }

    const applicationDoc = applicationsResponse.documents[0];
    
    await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_IDS.APPLICATIONS,
      applicationDoc.$id,
      { status }
    );
    
    console.log(`Application ${regNumber} status updated to ${status}`);
  } catch (error) {
    console.error("Error updating application status:", error);
    throw error;
  }
};

/**
 * Updates payment information for an application
 * @param regNumber - The registration number of the student
 * @param paymentStatus - The payment status to update
 * @param reference - The payment reference
 */
export const updateApplicationPayment = async (
  regNumber: string,
  paymentStatus: string,
  reference: string
) => {
  try {
    // Find the application document by regNumber
    const applicationsResponse = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_IDS.APPLICATIONS,
      [
        Query.equal('regNumber', regNumber),
        Query.limit(1)
      ]
    );

    if (applicationsResponse.documents.length === 0) {
      throw new Error(`Application not found for regNumber: ${regNumber}`);
    }

    const applicationDoc = applicationsResponse.documents[0];

    // Update the application with new payment information
    await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_IDS.APPLICATIONS,
      applicationDoc.$id,
      { paymentStatus, reference }
    );
    
    console.log(`Application ${regNumber} payment info updated`);
  } catch (error) {
    console.error("Error updating application payment:", error);
    throw error;
  }
};

/**
 * Fetches applications by status
 * @param status - The status to filter by
 * @returns A list of Applications with the specified status
 */
export const fetchApplicationsByStatus = async (
  status: "Pending" | "Accepted" | "Archived"
): Promise<Applications[]> => {
  try {
    const applicationsResponse = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_IDS.APPLICATIONS,
      [
        Query.equal('status', status),
        Query.orderDesc('submittedAt'),
        Query.limit(1000)
      ]
    );

    // Get all unique regNumbers from applications
    const regNumbers = applicationsResponse.documents.map(doc => doc.regNumber);
    
    if (regNumbers.length === 0) {
      return [];
    }

    // Fetch corresponding student data
    const studentsResponse = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_IDS.STUDENTS,
      [
        Query.equal('regNumber', regNumbers),
        Query.limit(1000)
      ]
    );

    // Create a map of students by registration number
    const studentsMap = new Map<string, Models.Document>();
    studentsResponse.documents.forEach((studentDoc) => {
      studentsMap.set(studentDoc.regNumber, studentDoc);
    });

    // Merge application data with student data
    const applicationsList: Applications[] = [];
    applicationsResponse.documents.forEach((applicationDoc) => {
      const regNumber = applicationDoc.regNumber;
      const studentData = studentsMap.get(regNumber);

      if (!studentData) {
        console.warn(`Student data not found for ${regNumber}`);
        return;
      }

      const { date, time } = formatTimestamp(applicationDoc.submittedAt);

      applicationsList.push({
        $id: applicationDoc.$id,
        name: studentData.name,
        regNumber,
        gender: studentData.gender,
        programme: studentData.programme,
        part: studentData.part,
        preferredHostel: applicationDoc.preferredHostel || "",
        email: studentData.email,
        phone: studentData.phone || "",
        status: applicationDoc.status || "Pending",
        submittedAt: applicationDoc.submittedAt || "",
        paymentStatus: applicationDoc.paymentStatus || "Not Paid",
        reference: applicationDoc.reference || "",
        userId: applicationDoc.userId,
        date,
        time,
      });
    });

    return applicationsList;
  } catch (error) {
    console.error(`Error fetching applications with status ${status}:`, error);
    return [];
  }
};

/**
 * Creates a new application
 * @param applicationData - The application data to create
 * @returns The created application document
 */
export const createApplication = async (
  applicationData: Omit<Applications, '$id' | 'date' | 'time'>
): Promise<Applications> => {
  try {
    const newApplication = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_IDS.APPLICATIONS,
      'unique()', // Let Appwrite generate a unique ID
      {
        regNumber: applicationData.regNumber,
        preferredHostel: applicationData.preferredHostel,
        status: applicationData.status || 'Pending',
        paymentStatus: applicationData.paymentStatus || 'Not Paid',
        reference: applicationData.reference || '',
        submittedAt: applicationData.submittedAt || new Date().toISOString(),
        userId: applicationData.userId
      }
    );

    const { date, time } = formatTimestamp(newApplication.submittedAt);

    return {
      $id: newApplication.$id,
      ...applicationData,
      date,
      time
    };
  } catch (error) {
    console.error("Error creating application:", error);
    throw error;
  }
};

/**
 * Deletes an application
 * @param applicationId - The ID of the application to delete
 */
export const deleteApplication = async (applicationId: string) => {
  try {
    await databases.deleteDocument(
      DATABASE_ID,
      COLLECTION_IDS.APPLICATIONS,
      applicationId
    );
    console.log(`Application ${applicationId} deleted successfully`);
  } catch (error) {
    console.error("Error deleting application:", error);
    throw error;
  }
};

/**
 * Gets an application by registration number
 * @param regNumber - The registration number to search for
 * @returns The application data or null if not found
 */
export const getApplicationByRegNumber = async (
  regNumber: string
): Promise<Applications | null> => {
  try {
    const applicationsResponse = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_IDS.APPLICATIONS,
      [
        Query.equal('regNumber', regNumber),
        Query.limit(1)
      ]
    );

    if (applicationsResponse.documents.length === 0) {
      return null;
    }

    const applicationDoc = applicationsResponse.documents[0];

    // Get student data
    const studentsResponse = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_IDS.STUDENTS,
      [
        Query.equal('regNumber', regNumber),
        Query.limit(1)
      ]
    );

    if (studentsResponse.documents.length === 0) {
      console.warn(`Student data not found for ${regNumber}`);
      return null;
    }

    const studentData = studentsResponse.documents[0];
    const { date, time } = formatTimestamp(applicationDoc.submittedAt);

    return {
      $id: applicationDoc.$id,
      name: studentData.name,
      regNumber,
      gender: studentData.gender,
      programme: studentData.programme,
      part: studentData.part,
      preferredHostel: applicationDoc.preferredHostel || "",
      email: studentData.email,
      phone: studentData.phone || "",
      status: applicationDoc.status || "Pending",
      submittedAt: applicationDoc.submittedAt || "",
      paymentStatus: applicationDoc.paymentStatus || "Not Paid",
      reference: applicationDoc.reference || "",
      userId: applicationDoc.userId,
      date,
      time,
    };
  } catch (error) {
    console.error("Error fetching application by regNumber:", error);
    return null;
  }
};
