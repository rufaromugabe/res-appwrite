import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuthContext } from '@/hooks/useAuthContext';
import { toast } from 'react-toastify';
import { Plus, Edit, Eye, AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { 
  fetchStudentPayments, 
  submitPayment, 
  updateStudentPayment, 
  fetchPaymentForAllocation 
} from '@/data/appwrite-payment-data';
import { fetchAllocationByStudent, getRoomDetailsFromAllocation, fetchAllocationById } from '@/data/appwrite-hostel-data';
import { getStudentByUserId } from '@/data/appwrite-student-data';
import { Payment, RoomAllocation } from '@/types/hostel';
import BankingDetails from '@/components/banking-details';

interface StudentPaymentManagementProps {
  studentRegNumber?: string;
}

const StudentPaymentManagement: React.FC<StudentPaymentManagementProps> = ({ studentRegNumber }) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [allocations, setAllocations] = useState<RoomAllocation[]>([]);
  const [allocationDetails, setAllocationDetails] = useState<{[key: string]: {roomNumber: string, hostelName: string, price: number}}>({});
  const [loading, setLoading] = useState(true);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [selectedAllocation, setSelectedAllocation] = useState<RoomAllocation | null>(null);
  const [regNumber, setRegNumber] = useState<string>('');

  // Form states
  const [formData, setFormData] = useState({
    receiptNumber: '',
    amount: '',
    paymentMethod: 'Bank Transfer' as Payment['paymentMethod'],
    notes: ''
  });

  const { user } = useAuthContext();

  // Function to determine registration number based on email domain
  const determineRegNumber = async (): Promise<string> => {
    if (studentRegNumber) {
      return studentRegNumber;
    }

    if (!user || !user.email) {
      return '';
    }

    const emailDomain = user.email.split("@")[1] || "";

    if (emailDomain === "hit.ac.zw") {
      // For hit.ac.zw domain users
      return user.email.split("@")[0] || "";
    } else if (emailDomain === "gmail.com") {
      // For gmail.com users, find them by user ID first
      try {
        const studentData = await getStudentByUserId(user.$id);
        if (studentData) {
          return studentData.regNumber || "";
        } else {
          console.log("User not found in database");
          return "";
        }
      } catch (error) {
        console.error("Error finding user by ID:", error);
        return "";
      }
    } else {
      // Unsupported email domain
      console.log("Unsupported email domain");
      return "";
    }
  };

  useEffect(() => {
    const initializeRegNumber = async () => {
      const determinedRegNumber = await determineRegNumber();
      setRegNumber(determinedRegNumber);
    };

    initializeRegNumber();
  }, [studentRegNumber, user]);

  useEffect(() => {
    if (regNumber) {
      loadData();
    }
  }, [regNumber]);  const loadData = async () => {
    try {
      setLoading(true);
      const [paymentsData, allocationData] = await Promise.all([
        fetchStudentPayments(regNumber),
        fetchAllocationByStudent(regNumber)
      ]);
      
      setPayments(paymentsData);
      // Convert single allocation to array for compatibility
      const allocationsArray = allocationData ? [allocationData] : [];
      setAllocations(allocationsArray);
      
      // Load room details for each allocation and for payments that might reference older allocations
      const details: {[key: string]: {roomNumber: string, hostelName: string, price: number}} = {};
      
      // Get unique allocation IDs from both current allocations and payment records
      const allAllocationIds = new Set([
        ...allocationsArray.map(a => a.id),
        ...paymentsData.map(p => p.allocationId)
      ]);
      for (const allocationId of Array.from(allAllocationIds)) {
        // First try to find in current allocations
        let allocation = allocationsArray.find(a => a.id === allocationId);
        
        // If not found in current allocations, try to fetch it (might be an old allocation)
        if (!allocation) {
          try {
            const fetchedAllocation = await fetchAllocationById(allocationId);
            if (!fetchedAllocation) {
              console.warn(`Allocation ${allocationId} not found`);
              continue;
            }
            allocation = fetchedAllocation;
          } catch (error) {
            console.error(`Failed to fetch allocation ${allocationId}:`, error);
            continue;
          }
        }
        
        if (allocation) {
          const roomDetails = await getRoomDetailsFromAllocation(allocation);
          if (roomDetails) {
            details[allocation.id] = {
              roomNumber: roomDetails.room.number,
              hostelName: roomDetails.hostel.name,
              price: roomDetails.price
            };
          }
        }
      }
      
      setAllocationDetails(details);
    } catch (error) {
      toast.error('Failed to load payment data');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      receiptNumber: '',
      amount: '',
      paymentMethod: 'Bank Transfer',
      notes: ''
    });
  };

  const handleSubmitPayment = async () => {
    if (!selectedAllocation || !formData.receiptNumber || !formData.amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await submitPayment({
        studentRegNumber: regNumber,
        allocationId: selectedAllocation.id,
        receiptNumber: formData.receiptNumber,
        amount: parseFloat(formData.amount),
        paymentMethod: formData.paymentMethod,
        notes: formData.notes
      });

      toast.success('Payment submitted successfully! Awaiting admin approval.');
      resetForm();
      setSubmitDialogOpen(false);
      loadData();
    } catch (error) {
      toast.error('Failed to submit payment');
    }
  };

  const handleUpdatePayment = async () => {
    if (!selectedPayment || !formData.receiptNumber) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      await updateStudentPayment(selectedPayment.id, {
        receiptNumber: formData.receiptNumber,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes
      });

      toast.success('Payment updated successfully!');
      resetForm();
      setEditDialogOpen(false);
      setSelectedPayment(null);
      loadData();
    } catch (error) {
      toast.error('Failed to update payment');
    }
  };

  const openEditDialog = (payment: Payment) => {
    setSelectedPayment(payment);
    setFormData({
      receiptNumber: payment.receiptNumber,
      amount: payment.amount.toString(),
      paymentMethod: payment.paymentMethod,
      notes: payment.notes || ''
    });
    setEditDialogOpen(true);
  };
  const openSubmitDialog = (allocation: RoomAllocation) => {
    setSelectedAllocation(allocation);
    const price = allocationDetails[allocation.id]?.price || 0;
    setFormData({
      receiptNumber: '',
      amount: price.toString(),
      paymentMethod: 'Bank Transfer',
      notes: ''
    });
    setSubmitDialogOpen(true);
  };

  const getStatusIcon = (status: Payment['status']) => {
    switch (status) {
      case 'Pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'Approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'Rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: Payment['status']) => {
    const variants = {
      'Pending': 'default',
      'Approved': 'default',
      'Rejected': 'destructive'
    } as const;

    return (
      <Badge variant={variants[status]} className="flex items-center gap-1">
        {getStatusIcon(status)}
        {status}
      </Badge>
    );
  };

  const unPaidAllocations = allocations.filter(allocation => 
    allocation.paymentStatus !== 'Paid' && 
    !payments.find(p => p.allocationId === allocation.id && p.status === 'Pending')
  );
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Check if regNumber is available
  if (!regNumber) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Profile Required</CardTitle>
          <CardDescription>
            You need to complete your profile before accessing payment management.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Please go to your profile page and complete all required information first.
            </AlertDescription>
          </Alert>
          <Button
            onClick={() => window.location.href = '/student/profile'}
            className="mt-4 bg-blue-600 hover:bg-blue-700"
          >
            Go to Profile
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Payment Management
            {unPaidAllocations.length > 0 && (
              <Badge variant="destructive">
                {unPaidAllocations.length} Unpaid
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Manage your room payment receipts and track approval status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Unpaid Allocations Alert */}
          {unPaidAllocations.length > 0 && (
            <Alert className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You have {unPaidAllocations.length} room allocation(s) requiring payment. 
                Submit your payment receipts to secure your room.
              </AlertDescription>
            </Alert>
          )}

          {/* Unpaid Allocations */}
          {unPaidAllocations.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Pending Payments</h3>
              <div className="space-y-3">
                {unPaidAllocations.map((allocation) => (
                  <Card key={allocation.id} className="border-orange-200">
                    <CardContent className="p-4">                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">
                            Room {allocationDetails[allocation.id]?.roomNumber || allocation.roomId}
                          </p>
                          <p className="text-sm text-gray-600">
                            {allocationDetails[allocation.id]?.hostelName || 'Loading...'}
                          </p>
                          <p className="text-sm text-gray-600">
                            Payment Due: {new Date(allocation.paymentDeadline).toLocaleDateString()}
                          </p>
                          <p className="text-sm font-medium text-green-600">
                            Amount: ${allocationDetails[allocation.id]?.price || 0}
                          </p>
                          <Badge variant={allocation.paymentStatus === 'Overdue' ? 'destructive' : 'secondary'}>
                            {allocation.paymentStatus}
                          </Badge>
                        </div>
                        <Button onClick={() => openSubmitDialog(allocation)}>
                          <Plus className="w-4 h-4 mr-2" />
                          Submit Payment
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}          {/* Payment History */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Payment History</h3>
            {payments.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No payments submitted yet</p>
            ) : (
              <div className="space-y-3">
                {payments.map((payment) => {
                  const allocation = allocations.find(a => a.id === payment.allocationId);
                  const roomDetails = allocationDetails[payment.allocationId];
                  
                  return (
                    <Card key={payment.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Receipt: {payment.receiptNumber}</span>
                              {getStatusBadge(payment.status)}
                            </div>
                            {roomDetails && (
                              <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                                <p className="font-medium">
                                  Room {roomDetails.roomNumber} - {roomDetails.hostelName}
                                </p>
                                <p className="text-xs text-gray-600">
                                  Room Price: ${roomDetails.price}
                                </p>
                              </div>
                            )}
                            <p className="text-sm text-gray-600">
                              Amount Paid: ${payment.amount} | Method: {payment.paymentMethod}
                            </p>
                            <p className="text-sm text-gray-600">
                              Submitted: {new Date(payment.submittedAt).toLocaleDateString()}
                            </p>
                            {payment.status === 'Approved' && payment.approvedAt && (
                              <p className="text-sm text-green-600">
                                Approved: {new Date(payment.approvedAt).toLocaleDateString()}
                                {payment.approvedBy && ` by ${payment.approvedBy}`}
                              </p>
                            )}
                            {payment.status === 'Rejected' && payment.rejectionReason && (
                              <p className="text-sm text-red-600">
                                Rejected: {payment.rejectionReason}
                              </p>
                            )}
                            {payment.notes && (
                              <p className="text-sm text-gray-600">Notes: {payment.notes}</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {payment.status === 'Pending' && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => openEditDialog(payment)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Submit Payment Dialog */}
      <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Payment Receipt</DialogTitle>
            <DialogDescription>
              Submit your payment receipt for room allocation approval
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="receiptNumber">Receipt Number *</Label>
              <Input
                id="receiptNumber"
                value={formData.receiptNumber}
                onChange={(e) => setFormData({...formData, receiptNumber: e.target.value})}
                placeholder="Enter receipt number"
              />
            </div>            <div>
              <Label htmlFor="amount">Amount (Auto-calculated) *</Label>
              <Input
                id="amount"
                type="number"
                value={formData.amount}
                readOnly
                className="bg-gray-50 cursor-not-allowed"
                placeholder="Amount is set based on room price"
              />
              <p className="text-xs text-gray-500 mt-1">
                Amount is automatically set based on your room allocation
              </p>
            </div>            <div>
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select
                value={formData.paymentMethod}
                onValueChange={(value) => setFormData({...formData, paymentMethod: value as Payment['paymentMethod']})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Mobile Money">Mobile Money</SelectItem>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Card">Card</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Show banking details when Bank Transfer is selected */}
            {formData.paymentMethod === 'Bank Transfer' && (
              <BankingDetails variant="alert" className="my-4" />
            )}
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Any additional notes about the payment"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSubmitDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmitPayment}>
                Submit Payment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Payment Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Payment Details</DialogTitle>
            <DialogDescription>
              Update your payment information (only allowed for pending payments)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editReceiptNumber">Receipt Number *</Label>
              <Input
                id="editReceiptNumber"
                value={formData.receiptNumber}
                onChange={(e) => setFormData({...formData, receiptNumber: e.target.value})}
                placeholder="Enter receipt number"
              />
            </div>            <div>
              <Label htmlFor="editPaymentMethod">Payment Method</Label>
              <Select
                value={formData.paymentMethod}
                onValueChange={(value) => setFormData({...formData, paymentMethod: value as Payment['paymentMethod']})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Mobile Money">Mobile Money</SelectItem>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Card">Card</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Show banking details when Bank Transfer is selected */}
            {formData.paymentMethod === 'Bank Transfer' && (
              <BankingDetails variant="alert" className="my-4" />
            )}
            <div>
              <Label htmlFor="editNotes">Notes (Optional)</Label>
              <Textarea
                id="editNotes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Any additional notes about the payment"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdatePayment}>
                Update Payment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentPaymentManagement;
