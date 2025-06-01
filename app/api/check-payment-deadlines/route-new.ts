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
        console.log(`Revoked allocation for student ${allocation.studentRegNumber} in room ${allocation.roomId}`);
        return { success: true, allocation };
      } catch (error) {
        console.error(`Failed to revoke allocation for student ${allocation.studentRegNumber}:`, error);
        return { success: false, allocation, error };
      }
    });

    const results = await Promise.allSettled(revokePromises);
    const successfulRevocations = results.filter(result => 
      result.status === 'fulfilled' && result.value.success
    ).length;

    console.log(`Successfully revoked ${successfulRevocations} out of ${expiredAllocations.length} expired allocations`);

    return NextResponse.json({
      message: "Payment deadline check completed",
      totalExpired: expiredAllocations.length,
      revokedCount: successfulRevocations,
      timestamp: now.toISOString()
    }, { status: 200 });

  } catch (error) {
    console.error('Error checking payment deadlines:', error);
    return NextResponse.json({ 
      message: "Internal server error", 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * GET endpoint for manual checking of payment deadlines (for admin use)
 */
export async function GET() {
  try {
    const settings = await getHostelSettings();
    const allAllocations = await fetchAllRoomAllocations();
    const unpaidAllocations = allAllocations.filter(allocation => 
      allocation.paymentStatus === "Pending" || allocation.paymentStatus === "Overdue"
    );

    const now = new Date();
    const expiredAllocations = unpaidAllocations.filter(allocation => {
      const deadlineDate = new Date(allocation.paymentDeadline);
      deadlineDate.setHours(deadlineDate.getHours() + settings.paymentGracePeriod);
      return now > deadlineDate;
    });

    return NextResponse.json({
      message: "Payment deadline status",
      totalUnpaidAllocations: unpaidAllocations.length,
      expiredAllocations: expiredAllocations.length,
      autoRevokeEnabled: settings.autoRevokeUnpaidAllocations,
      gracePeriodHours: settings.paymentGracePeriod,
      timestamp: now.toISOString()
    }, { status: 200 });

  } catch (error) {
    console.error('Error checking payment deadline status:', error);
    return NextResponse.json({ 
      message: "Internal server error", 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
