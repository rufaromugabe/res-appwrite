import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppwriteAuth } from '@/hooks/useAppwriteAuth';
import { toast } from 'react-toastify';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Plus, 
  Eye, 
  DollarSign, 
  AlertTriangle,
  FileText,
  Filter
} from 'lucide-react';
import { 
  fetchAllPayments, 
  fetchPendingPayments, 
  approvePayment, 
  rejectPayment,
  addAdminPayment,
  deletePayment
} from '@/data/appwrite-payment-data';
import { fetchAllocationByStudent, getRoomDetailsFromAllocation } from '@/data/appwrite-hostel-data';
import { Payment, RoomAllocation } from '@/types/hostel';
import BankingDetails from '@/components/banking-details';

const AdminPaymentManagement: React.FC = () => {
  const { user } = useAppwriteAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pendingPayments, setPendingPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dialog states
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [addPaymentDialogOpen, setAddPaymentDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
    // Form states
  const [rejectionReason, setRejectionReason] = useState('');
  const [addPaymentForm, setAddPaymentForm] = useState({
    studentRegNumber: '',
    allocationId: '',
    receiptNumber: '',
    amount: '',
    paymentMethod: 'Bank Transfer' as Payment['paymentMethod'],
    notes: ''
  });  const [isLoadingAmount, setIsLoadingAmount] = useState(false);
  const [allowAmountEdit, setAllowAmountEdit] = useState(false);
  const [roomInfo, setRoomInfo] = useState<{hostelName: string, roomNumber: string, floorName: string} | null>(null);

  const adminEmail = user?.email || '';

  useEffect(() => {
    loadData();
  }, []);
  const loadData = async () => {
    try {
      setLoading(true);
      const [allPayments, pendingPayments] = await Promise.all([
        fetchAllPayments(),
        fetchPendingPayments()
      ]);
      
      setPayments(allPayments);
      setPendingPayments(pendingPayments);
    } catch (error) {
      toast.error('Failed to load payment data');
    } finally {
      setLoading(false);
    }
  };
  const fetchPaymentAmount = async (studentRegNumber: string) => {
    if (!studentRegNumber.trim()) {
      setAddPaymentForm(prev => ({ ...prev, amount: '' }));
      setRoomInfo(null);
      return;
    }

    try {
      setIsLoadingAmount(true);
      const allocation = await fetchAllocationByStudent(studentRegNumber);
      
      if (allocation && allocation.paymentStatus !== 'Paid') {
        const roomDetails = await getRoomDetailsFromAllocation(allocation);
        if (roomDetails) {
          setAddPaymentForm(prev => ({ 
            ...prev, 
            amount: roomDetails.price.toString(),
            allocationId: allocation.id 
          }));
          setRoomInfo({
            hostelName: roomDetails.hostel.name,
            roomNumber: roomDetails.room.number,
            floorName: roomDetails.room.floorName
          });
        } else {
          setRoomInfo(null);
          toast.error('Could not fetch room details for this allocation');
        }
      } else {
        setAddPaymentForm(prev => ({ ...prev, amount: '' }));
        setRoomInfo(null);
        toast.error('No unpaid allocation found for this student');
      }
    } catch (error) {
      console.error('Error fetching payment amount:', error);
      setRoomInfo(null);
      toast.error('Failed to fetch payment amount');
    } finally {
      setIsLoadingAmount(false);
    }
  };

  const handleApprovePayment = async () => {
    if (!selectedPayment) return;

    try {
      await approvePayment(selectedPayment.id, adminEmail);
      toast.success('Payment approved successfully!');
      setApproveDialogOpen(false);
      setSelectedPayment(null);
      loadData();
    } catch (error) {
      toast.error('Failed to approve payment');
    }
  };

  const handleRejectPayment = async () => {
    if (!selectedPayment || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      await rejectPayment(selectedPayment.id, adminEmail, rejectionReason);
      toast.success('Payment rejected');
      setRejectDialogOpen(false);
      setSelectedPayment(null);
      setRejectionReason('');
      loadData();
    } catch (error) {
      toast.error('Failed to reject payment');
    }
  };
  const handleAddPayment = async () => {
    if (!addPaymentForm.studentRegNumber || !addPaymentForm.receiptNumber || !addPaymentForm.amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!addPaymentForm.allocationId) {
      toast.error('No allocation found for this student. Please verify the registration number.');
      return;
    }

    try {
      await addAdminPayment({
        studentRegNumber: addPaymentForm.studentRegNumber,
        allocationId: addPaymentForm.allocationId,
        receiptNumber: addPaymentForm.receiptNumber,
        amount: parseFloat(addPaymentForm.amount),
        paymentMethod: addPaymentForm.paymentMethod,
        notes: addPaymentForm.notes
      }, adminEmail);

      toast.success('Payment added and approved successfully!');
      setAddPaymentDialogOpen(false);
      resetAddPaymentForm();
      loadData();
    } catch (error) {
      toast.error('Failed to add payment');
    }
  };  const resetAddPaymentForm = () => {
    setAddPaymentForm({
      studentRegNumber: '',
      allocationId: '',
      receiptNumber: '',
      amount: '',
      paymentMethod: 'Bank Transfer',
      notes: ''
    });
    setAllowAmountEdit(false);
    setIsLoadingAmount(false);
    setRoomInfo(null);
  };

  const openApproveDialog = (payment: Payment) => {
    setSelectedPayment(payment);
    setApproveDialogOpen(true);
  };

  const openRejectDialog = (payment: Payment) => {
    setSelectedPayment(payment);
    setRejectDialogOpen(true);
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
      'Pending': 'secondary',
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

  const filteredPayments = payments.filter(payment => {
    const statusMatch = filterStatus === 'all' || payment.status === filterStatus;
    const searchMatch = searchQuery === '' || 
      payment.studentRegNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase());
    return statusMatch && searchMatch;
  });

  const stats = {
    total: payments.length,
    pending: payments.filter(p => p.status === 'Pending').length,
    approved: payments.filter(p => p.status === 'Approved').length,
    rejected: payments.filter(p => p.status === 'Rejected').length,
    totalAmount: payments.filter(p => p.status === 'Approved').reduce((sum, p) => sum + p.amount, 0)
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  return (
    <div className="space-y-4 p-2 sm:p-4 lg:p-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Payments</p>
                <p className="text-lg sm:text-2xl font-bold">{stats.total}</p>
              </div>
              <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Pending</p>
                <p className="text-lg sm:text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Approved</p>
                <p className="text-lg sm:text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-lg sm:text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <XCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-2 md:col-span-1">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Amount</p>
                <p className="text-lg sm:text-2xl font-bold text-green-600">${stats.totalAmount}</p>
              </div>
              <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>      <Tabs defaultValue="all" className="w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="all" className="flex-1 sm:flex-none">All Payments</TabsTrigger>
            <TabsTrigger value="pending" className="flex-1 sm:flex-none">
              Pending ({stats.pending})
            </TabsTrigger>
          </TabsList>
          <Dialog open={addPaymentDialogOpen} onOpenChange={setAddPaymentDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Add Payment
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>        <TabsContent value="all" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by student reg number or receipt number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Payments Table - Desktop */}
          <Card className="hidden lg:block">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Receipt Number</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.studentRegNumber}</TableCell>
                      <TableCell>{payment.receiptNumber}</TableCell>
                      <TableCell>${payment.amount}</TableCell>
                      <TableCell>{payment.paymentMethod}</TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      <TableCell>{new Date(payment.submittedAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {payment.status === 'Pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openApproveDialog(payment)}
                                className="text-green-600 hover:text-green-700"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openRejectDialog(payment)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Payments Cards - Mobile */}
          <div className="lg:hidden space-y-4">
            {filteredPayments.map((payment) => (
              <Card key={payment.id}>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{payment.studentRegNumber}</p>
                        <p className="text-sm text-gray-600">Receipt: {payment.receiptNumber}</p>
                      </div>
                      {getStatusBadge(payment.status)}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Amount</p>
                        <p className="font-medium">${payment.amount}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Method</p>
                        <p className="font-medium">{payment.paymentMethod}</p>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      Submitted: {new Date(payment.submittedAt).toLocaleDateString()}
                    </div>
                    
                    {payment.status === 'Pending' && (
                      <div className="flex gap-2 pt-2 border-t">
                        <Button
                          size="sm"
                          onClick={() => openApproveDialog(payment)}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => openRejectDialog(payment)}
                          className="flex-1"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>        <TabsContent value="pending" className="space-y-4">
          {pendingPayments.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No pending payments</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingPayments.map((payment) => (
                <Card key={payment.id} className="border-yellow-200">
                  <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <span className="font-medium">Student: {payment.studentRegNumber}</span>
                          {getStatusBadge(payment.status)}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                          <p>Receipt: {payment.receiptNumber}</p>
                          <p>Amount: ${payment.amount}</p>
                          <p>Method: {payment.paymentMethod}</p>
                          <p>Submitted: {new Date(payment.submittedAt).toLocaleDateString()}</p>
                        </div>
                        {payment.notes && (
                          <p className="text-sm text-gray-600">Notes: {payment.notes}</p>
                        )}
                      </div>
                      <div className="flex flex-row lg:flex-col xl:flex-row gap-2 w-full sm:w-auto">
                        <Button
                          size="sm"
                          onClick={() => openApproveDialog(payment)}
                          className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => openRejectDialog(payment)}
                          className="flex-1 sm:flex-none"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>      {/* Approve Payment Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent className="max-w-md w-[90vw] max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Approve Payment</DialogTitle>
            <DialogDescription>
              Confirm approval of this payment receipt
            </DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4 flex-1 overflow-y-auto">
              <div className="bg-gray-50 p-4 rounded space-y-2">
                <p><strong>Student:</strong> {selectedPayment.studentRegNumber}</p>
                <p><strong>Receipt Number:</strong> {selectedPayment.receiptNumber}</p>
                <p><strong>Amount:</strong> ${selectedPayment.amount}</p>
                <p><strong>Payment Method:</strong> {selectedPayment.paymentMethod}</p>
                {selectedPayment.notes && (
                  <p><strong>Notes:</strong> {selectedPayment.notes}</p>
                )}
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t flex-shrink-0">
                <Button variant="outline" onClick={() => setApproveDialogOpen(false)} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button onClick={handleApprovePayment} className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">
                  Approve Payment
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Payment Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="max-w-md w-[90vw] max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Reject Payment</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this payment
            </DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4 flex-1 overflow-y-auto">
              <div className="bg-gray-50 p-4 rounded space-y-2">
                <p><strong>Student:</strong> {selectedPayment.studentRegNumber}</p>
                <p><strong>Receipt Number:</strong> {selectedPayment.receiptNumber}</p>
                <p><strong>Amount:</strong> ${selectedPayment.amount}</p>
              </div>
              <div>
                <Label htmlFor="rejectionReason">Rejection Reason *</Label>
                <Textarea
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why this payment is being rejected..."
                  className="min-h-[100px]"
                />
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t flex-shrink-0">
                <Button variant="outline" onClick={() => setRejectDialogOpen(false)} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleRejectPayment}
                  disabled={!rejectionReason.trim()}
                  className="w-full sm:w-auto"
                >
                  Reject Payment
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Payment Dialog */}
      <Dialog open={addPaymentDialogOpen} onOpenChange={setAddPaymentDialogOpen}>
        <DialogContent className="max-w-md w-[90vw] max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Add Payment</DialogTitle>
            <DialogDescription>
              Add a payment on behalf of a student
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 flex-1 overflow-y-auto pr-2"><div>
              <Label htmlFor="studentRegNumber">Student Registration Number *</Label>
              <Input
                id="studentRegNumber"
                value={addPaymentForm.studentRegNumber}
                onChange={(e) => {
                  const value = e.target.value;
                  setAddPaymentForm({...addPaymentForm, studentRegNumber: value});
                  // Auto-fetch payment amount when student reg number changes
                  if (value.length > 3) { // Only fetch after some reasonable input
                    fetchPaymentAmount(value);
                  }
                }}
                onBlur={() => {
                  if (addPaymentForm.studentRegNumber) {
                    fetchPaymentAmount(addPaymentForm.studentRegNumber);
                  }
                }}
                placeholder="Enter student reg number"
              />
            </div>
            
            {roomInfo && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <h4 className="font-medium text-blue-800 mb-2">Room Allocation Details</h4>
                <div className="text-sm text-blue-700 space-y-1">
                  <p><strong>Hostel:</strong> {roomInfo.hostelName}</p>
                  <p><strong>Room:</strong> {roomInfo.roomNumber} ({roomInfo.floorName})</p>
                  <p><strong>Amount:</strong> ${addPaymentForm.amount}</p>
                </div>
              </div>
            )}
            <div>
              <Label htmlFor="receiptNumber">Receipt Number *</Label>
              <Input
                id="receiptNumber"
                value={addPaymentForm.receiptNumber}
                onChange={(e) => setAddPaymentForm({...addPaymentForm, receiptNumber: e.target.value})}
                placeholder="Enter receipt number"
              />
            </div>            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="amount">Amount (Auto-calculated) *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAllowAmountEdit(!allowAmountEdit)}
                  className="text-xs"
                >
                  {allowAmountEdit ? 'Lock Amount' : 'Edit Amount'}
                </Button>
              </div>
              <div className="relative">
                <Input
                  id="amount"
                  type="number"
                  value={addPaymentForm.amount}
                  onChange={(e) => {
                    if (allowAmountEdit) {
                      setAddPaymentForm({...addPaymentForm, amount: e.target.value});
                    }
                  }}
                  readOnly={!allowAmountEdit}
                  className={!allowAmountEdit ? "bg-gray-50" : ""}
                  placeholder={isLoadingAmount ? "Calculating..." : "Amount will be auto-calculated"}
                />
                {isLoadingAmount && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {allowAmountEdit 
                  ? "Manual amount editing is enabled. Use with caution."
                  : "Amount is automatically calculated based on the student's room allocation"
                }
              </p>
            </div>            <div>
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select
                value={addPaymentForm.paymentMethod}
                onValueChange={(value) => setAddPaymentForm({...addPaymentForm, paymentMethod: value as Payment['paymentMethod']})}
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
            {addPaymentForm.paymentMethod === 'Bank Transfer' && (
              <BankingDetails variant="alert" className="my-4" />
            )}
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={addPaymentForm.notes}
                onChange={(e) => setAddPaymentForm({...addPaymentForm, notes: e.target.value})}
                placeholder="Any additional notes"
              />            </div>
            <div className="flex justify-end gap-2 pt-4 border-t flex-shrink-0">
              <Button variant="outline" onClick={() => setAddPaymentDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddPayment}>
                Add Payment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPaymentManagement;
