import { NextResponse } from "next/server";
import { fetchAllRoomAllocations, revokeRoomAllocation } from '@/data/appwrite-hostel-data';
import { getHostelSettings } from '@/data/appwrite-settings-data';
import { RoomAllocation } from '@/types/hostel';

/**
 * API route to check and revoke expired room allocations
 * This should be called periodically (daily) to automatically manage unpaid allocations
 */
export async function POST(req: Request) {
  try {
    // Basic security check for automated calls
    const authHeader = req.headers.get('authorization');
    const expectedToken = process.env.PAYMENT_CHECK_TOKEN || 'default-secure-token';
    
    if (authHeader !== `Bearer ${expectedToken}`) {
      console.warn('Unauthorized payment deadline check attempt');
      return NextResponse.json({ 
        message: "Unauthorized",
        error: 'Invalid or missing authorization token'
      }, { status: 401 });
    }

    // Fetch hostel settings to check if auto-revoke is enabled
    const settings = await getHostelSettings();
    
    if (!settings.autoRevokeUnpaidAllocations) {
      return NextResponse.json({ 
        message: "Auto-revoke is disabled",
        revokedCount: 0 
      }, { status: 200 });
    }

    // Get current date
    const now = new Date();
    
    // Fetch all allocations with unpaid status
    const allAllocations = await fetchAllRoomAllocations();
    const unpaidAllocations = allAllocations.filter(allocation => 
      allocation.paymentStatus === "Pending" || allocation.paymentStatus === "Overdue"
    );
    
    const expiredAllocations: RoomAllocation[] = [];
    
    // Check which allocations have expired deadlines
    unpaidAllocations.forEach(allocation => {
      const deadlineDate = new Date(allocation.paymentDeadline);
      
      // Add grace period in hours (deadline is set to grace period value, so total time = deadline + grace period = 2x grace period)
      deadlineDate.setHours(deadlineDate.getHours() + settings.paymentGracePeriod);
      
      if (now > deadlineDate) {
        expiredAllocations.push(allocation);
      }
    });

    console.log(`Found ${expiredAllocations.length} expired allocations to revoke`);
    
    // Revoke expired allocations
    const revokePromises = expiredAllocations.map(async (allocation) => {
      try {
        await revokeRoomAllocation(allocation.id);
        console.log(`Revoked allocation ${allocation.id} for student ${allocation.studentRegNumber}`);
        return {
          allocationId: allocation.id,
          studentRegNumber: allocation.studentRegNumber,
          success: true
        };
      } catch (error) {
        console.error(`Failed to revoke allocation ${allocation.id}:`, error);
        return {
          allocationId: allocation.id,
          studentRegNumber: allocation.studentRegNumber,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });
    
    const results = await Promise.all(revokePromises);
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    
    return NextResponse.json({
      message: `Payment deadline check completed`,
      totalExpired: expiredAllocations.length,
      revokedCount: successCount,
      failureCount: failureCount,
      results: results
    }, { status: 200 });
    
  } catch (error) {
    console.error("Error checking payment deadlines:", error);
    return NextResponse.json({ 
      message: "Failed to check payment deadlines",
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * GET route to check status without revoking (for testing/monitoring)
 */
export async function GET() {
  try {
    const settings = await fetchHostelSettings();
    const now = new Date();
    
    // Fetch all allocations with unpaid status
    const allocationsCollection = collection(db, "roomAllocations");
    const unpaidQuery = query(
      allocationsCollection,
      where("paymentStatus", "in", ["Pending", "Overdue"])
    );
    
    const unpaidAllocationsSnap = await getDocs(unpaidQuery);    const expiredAllocations: Array<{
      id: string;
      studentRegNumber: string;
      paymentDeadline: string;
      hoursOverdue: number;
    }> = [];
      // Check which allocations have expired deadlines
    unpaidAllocationsSnap.docs.forEach(doc => {
      const allocation = { id: doc.id, ...doc.data() } as RoomAllocation;
      const deadlineDate = new Date(allocation.paymentDeadline);
      const gracePeriodEnd = new Date(deadlineDate);
      gracePeriodEnd.setHours(gracePeriodEnd.getHours() + settings.paymentGracePeriod);
      
      if (now > gracePeriodEnd) {
        const hoursOverdue = Math.floor((now.getTime() - gracePeriodEnd.getTime()) / (1000 * 60 * 60));
        expiredAllocations.push({
          id: allocation.id,
          studentRegNumber: allocation.studentRegNumber,
          paymentDeadline: allocation.paymentDeadline,
          hoursOverdue: hoursOverdue
        });
      }
    });
    
    return NextResponse.json({
      autoRevokeEnabled: settings.autoRevokeUnpaidAllocations,
      paymentGracePeriod: settings.paymentGracePeriod,
      totalUnpaidAllocations: unpaidAllocationsSnap.docs.length,
      expiredAllocations: expiredAllocations.length,
      expiredDetails: expiredAllocations
    }, { status: 200 });
    
  } catch (error) {
    console.error("Error checking payment deadline status:", error);
    return NextResponse.json({ 
      message: "Failed to check payment deadline status",
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
