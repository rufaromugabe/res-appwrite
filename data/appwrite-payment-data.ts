import { databases, DATABASE_ID, COLLECTION_IDS, Query, ID } from '@/lib/appwrite';
import { Payment, RoomAllocation } from '@/types/hostel';
import { updateRoomAllocation } from './appwrite-hostel-data';

/**
 * Submit a new payment by student
 */
export const submitPayment = async (
  payment: Omit<Payment, 'id' | 'submittedAt' | 'status'>,
  userId?: string
): Promise<string> => {
  try {
    const paymentData = {
      studentRegNumber: payment.studentRegNumber,
      allocationId: payment.allocationId,
      receiptNumber: payment.receiptNumber,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      attachments: JSON.stringify(payment.attachments || []),
      notes: payment.notes || '',
      submittedAt: new Date().toISOString(),
      status: 'Pending' as const,
      userId: userId || null
    };

    const newPayment = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_IDS.PAYMENTS,
      ID.unique(),
      paymentData
    );
    
    return newPayment.$id;
  } catch (error) {
    console.error("Error submitting payment:", error);
    throw error;
  }
};

/**
 * Update payment by student (for editing receipt number or details)
 */
export const updateStudentPayment = async (
  paymentId: string, 
  updates: Partial<Pick<Payment, 'receiptNumber' | 'paymentMethod' | 'notes' | 'attachments'>>
): Promise<void> => {
  try {
    const updateData: Record<string, any> = {};
    
    if (updates.receiptNumber !== undefined) updateData.receiptNumber = updates.receiptNumber;
    if (updates.paymentMethod !== undefined) updateData.paymentMethod = updates.paymentMethod;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.attachments !== undefined) updateData.attachments = JSON.stringify(updates.attachments);

    await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_IDS.PAYMENTS,
      paymentId,
      updateData
    );
  } catch (error) {
    console.error("Error updating payment:", error);
    throw error;
  }
};

/**
 * Fetch payments for a specific student
 */
export const fetchStudentPayments = async (studentRegNumber: string): Promise<Payment[]> => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_IDS.PAYMENTS,
      [
        Query.equal('studentRegNumber', studentRegNumber),
        Query.orderDesc('submittedAt'),
        Query.limit(100)
      ]
    );
    
    return response.documents.map(doc => ({
      id: doc.$id,
      studentRegNumber: doc.studentRegNumber,
      allocationId: doc.allocationId,
      receiptNumber: doc.receiptNumber,
      amount: doc.amount,
      paymentMethod: doc.paymentMethod,
      submittedAt: doc.submittedAt,
      status: doc.status,
      approvedBy: doc.approvedBy,
      approvedAt: doc.approvedAt,
      rejectionReason: doc.rejectionReason,
      attachments: JSON.parse(doc.attachments || '[]'),
      notes: doc.notes
    }));
  } catch (error) {
    console.error("Error fetching student payments:", error);
    return [];
  }
};

/**
 * Fetch all payments (admin function)
 */
export const fetchAllPayments = async (): Promise<Payment[]> => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_IDS.PAYMENTS,
      [
        Query.orderDesc('submittedAt'),
        Query.limit(1000)
      ]
    );
    
    return response.documents.map(doc => ({
      id: doc.$id,
      studentRegNumber: doc.studentRegNumber,
      allocationId: doc.allocationId,
      receiptNumber: doc.receiptNumber,
      amount: doc.amount,
      paymentMethod: doc.paymentMethod,
      submittedAt: doc.submittedAt,
      status: doc.status,
      approvedBy: doc.approvedBy,
      approvedAt: doc.approvedAt,
      rejectionReason: doc.rejectionReason,
      attachments: JSON.parse(doc.attachments || '[]'),
      notes: doc.notes
    }));
  } catch (error) {
    console.error("Error fetching all payments:", error);
    return [];
  }
};

/**
 * Fetch pending payments (admin function)
 */
export const fetchPendingPayments = async (): Promise<Payment[]> => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_IDS.PAYMENTS,
      [
        Query.equal('status', 'Pending'),
        Query.orderAsc('submittedAt'),
        Query.limit(1000)
      ]
    );
    
    return response.documents.map(doc => ({
      id: doc.$id,
      studentRegNumber: doc.studentRegNumber,
      allocationId: doc.allocationId,
      receiptNumber: doc.receiptNumber,
      amount: doc.amount,
      paymentMethod: doc.paymentMethod,
      submittedAt: doc.submittedAt,
      status: doc.status,
      approvedBy: doc.approvedBy,
      approvedAt: doc.approvedAt,
      rejectionReason: doc.rejectionReason,
      attachments: JSON.parse(doc.attachments || '[]'),
      notes: doc.notes
    }));
  } catch (error) {
    console.error("Error fetching pending payments:", error);
    return [];
  }
};

/**
 * Fetch payments by status
 */
export const fetchPaymentsByStatus = async (
  status: 'Pending' | 'Approved' | 'Rejected'
): Promise<Payment[]> => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_IDS.PAYMENTS,
      [
        Query.equal('status', status),
        Query.orderDesc('submittedAt'),
        Query.limit(1000)
      ]
    );
    
    return response.documents.map(doc => ({
      id: doc.$id,
      studentRegNumber: doc.studentRegNumber,
      allocationId: doc.allocationId,
      receiptNumber: doc.receiptNumber,
      amount: doc.amount,
      paymentMethod: doc.paymentMethod,
      submittedAt: doc.submittedAt,
      status: doc.status,
      approvedBy: doc.approvedBy,
      approvedAt: doc.approvedAt,
      rejectionReason: doc.rejectionReason,
      attachments: JSON.parse(doc.attachments || '[]'),
      notes: doc.notes
    }));
  } catch (error) {
    console.error(`Error fetching ${status} payments:`, error);
    return [];
  }
};

/**
 * Approve payment (admin function)
 */
export const approvePayment = async (
  paymentId: string, 
  adminEmail: string
): Promise<void> => {
  try {
    // Get payment details first
    const paymentDoc = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_IDS.PAYMENTS,
      paymentId
    );
    
    if (!paymentDoc) {
      throw new Error("Payment not found");
    }
    
    // Update payment status
    await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_IDS.PAYMENTS,
      paymentId,
      {
        status: 'Approved',
        approvedBy: adminEmail,
        approvedAt: new Date().toISOString()
      }
    );
    
    // Update room allocation payment status
    await updateRoomAllocation(paymentDoc.allocationId, { 
      paymentStatus: 'Paid',
      paymentId: paymentId
    });
    
  } catch (error) {
    console.error("Error approving payment:", error);
    throw error;
  }
};

/**
 * Reject payment (admin function)
 */
export const rejectPayment = async (
  paymentId: string, 
  adminEmail: string, 
  rejectionReason: string
): Promise<void> => {
  try {
    await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_IDS.PAYMENTS,
      paymentId,
      {
        status: 'Rejected',
        approvedBy: adminEmail,
        approvedAt: new Date().toISOString(),
        rejectionReason
      }
    );
  } catch (error) {
    console.error("Error rejecting payment:", error);
    throw error;
  }
};

/**
 * Get payment details by ID
 */
export const fetchPaymentById = async (paymentId: string): Promise<Payment | null> => {
  try {
    const doc = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_IDS.PAYMENTS,
      paymentId
    );
    
    return {
      id: doc.$id,
      studentRegNumber: doc.studentRegNumber,
      allocationId: doc.allocationId,
      receiptNumber: doc.receiptNumber,
      amount: doc.amount,
      paymentMethod: doc.paymentMethod,
      submittedAt: doc.submittedAt,
      status: doc.status,
      approvedBy: doc.approvedBy,
      approvedAt: doc.approvedAt,
      rejectionReason: doc.rejectionReason,
      attachments: JSON.parse(doc.attachments || '[]'),
      notes: doc.notes
    };
  } catch (error) {
    console.error("Error fetching payment:", error);
    return null;
  }
};

/**
 * Add admin payment (admin function to add payment on behalf of student)
 */
export const addAdminPayment = async (
  payment: Omit<Payment, 'id' | 'submittedAt' | 'status' | 'approvedBy' | 'approvedAt'>,
  adminEmail: string,
  userId?: string
): Promise<string> => {
  try {
    const paymentData = {
      studentRegNumber: payment.studentRegNumber,
      allocationId: payment.allocationId,
      receiptNumber: payment.receiptNumber,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      attachments: JSON.stringify(payment.attachments || []),
      notes: payment.notes || '',
      submittedAt: new Date().toISOString(),
      status: 'Approved' as const,
      approvedBy: adminEmail,
      approvedAt: new Date().toISOString(),
      userId: userId || null
    };

    const newPayment = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_IDS.PAYMENTS,
      ID.unique(),
      paymentData
    );
    
    // Update room allocation payment status
    await updateRoomAllocation(payment.allocationId, { 
      paymentStatus: 'Paid',
      paymentId: newPayment.$id
    });
    
    return newPayment.$id;
  } catch (error) {
    console.error("Error adding admin payment:", error);
    throw error;
  }
};

/**
 * Get payment for allocation
 */
export const fetchPaymentForAllocation = async (allocationId: string): Promise<Payment | null> => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_IDS.PAYMENTS,
      [
        Query.equal('allocationId', allocationId),
        Query.equal('status', 'Approved'),
        Query.limit(1)
      ]
    );
    
    if (response.documents.length > 0) {
      const doc = response.documents[0];
      return {
        id: doc.$id,
        studentRegNumber: doc.studentRegNumber,
        allocationId: doc.allocationId,
        receiptNumber: doc.receiptNumber,
        amount: doc.amount,
        paymentMethod: doc.paymentMethod,
        submittedAt: doc.submittedAt,
        status: doc.status,
        approvedBy: doc.approvedBy,
        approvedAt: doc.approvedAt,
        rejectionReason: doc.rejectionReason,
        attachments: JSON.parse(doc.attachments || '[]'),
        notes: doc.notes
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching payment for allocation:", error);
    return null;
  }
};

/**
 * Get pending payment for allocation (student has submitted but not approved)
 */
export const fetchPendingPaymentForAllocation = async (allocationId: string): Promise<Payment | null> => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_IDS.PAYMENTS,
      [
        Query.equal('allocationId', allocationId),
        Query.equal('status', 'Pending'),
        Query.limit(1)
      ]
    );
    
    if (response.documents.length > 0) {
      const doc = response.documents[0];
      return {
        id: doc.$id,
        studentRegNumber: doc.studentRegNumber,
        allocationId: doc.allocationId,
        receiptNumber: doc.receiptNumber,
        amount: doc.amount,
        paymentMethod: doc.paymentMethod,
        submittedAt: doc.submittedAt,
        status: doc.status,
        approvedBy: doc.approvedBy,
        approvedAt: doc.approvedAt,
        rejectionReason: doc.rejectionReason,
        attachments: JSON.parse(doc.attachments || '[]'),
        notes: doc.notes
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching pending payment for allocation:", error);
    return null;
  }
};

/**
 * Delete payment (admin function)
 */
export const deletePayment = async (paymentId: string): Promise<void> => {
  try {
    await databases.deleteDocument(
      DATABASE_ID,
      COLLECTION_IDS.PAYMENTS,
      paymentId
    );
  } catch (error) {
    console.error("Error deleting payment:", error);
    throw error;
  }
};

/**
 * Get payment statistics
 */
export const getPaymentStatistics = async (): Promise<{
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  totalAmount: number;
}> => {
  try {
    const allPayments = await fetchAllPayments();
    
    const stats = {
      total: allPayments.length,
      pending: allPayments.filter(p => p.status === 'Pending').length,
      approved: allPayments.filter(p => p.status === 'Approved').length,
      rejected: allPayments.filter(p => p.status === 'Rejected').length,
      totalAmount: allPayments
        .filter(p => p.status === 'Approved')
        .reduce((sum, p) => sum + p.amount, 0)
    };
    
    return stats;
  } catch (error) {
    console.error("Error fetching payment statistics:", error);
    return {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      totalAmount: 0
    };
  }
};
