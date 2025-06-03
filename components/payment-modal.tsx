import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { toast } from "react-toastify";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchAllocationByStudent } from "@/data/appwrite-hostel-data";
import { addAdminPayment } from "@/data/appwrite-payment-data";
import { updateApplicationPayment } from "@/data/appwrite-data";
import { useAuthContext } from '@/hooks/useAuthContext';
import { Payment } from "@/types/hostel";

interface PaymentStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: any;
  onUpdate: (updatedStudent: any) => void;
}

const PAYMENT_STATUSES = [
  "Not Paid",
  "Pending",
  "Paid",
  "Overdue"
];

const PaymentStatusModal = ({ isOpen, onClose, student, onUpdate }: PaymentStatusModalProps) => {
  const { user } = useAuthContext();
  const [paymentStatus, setPaymentStatus] = useState("Not Paid");
  const [reference, setReference] = useState("");
  const [showAddPayment, setShowAddPayment] = useState(false);
  
  // Payment form state
  const [paymentForm, setPaymentForm] = useState({
    receiptNumber: '',
    amount: '',
    paymentMethod: 'Bank Transfer' as Payment['paymentMethod'],
    notes: ''
  });

  // Update state when the modal opens with new student data
  useEffect(() => {
    if (isOpen && student) {
      setPaymentStatus(student.paymentStatus || "Not Paid");
      setReference(student.reference || "");
      setShowAddPayment(false);
      setPaymentForm({
        receiptNumber: '',
        amount: '',
        paymentMethod: 'Bank Transfer',
        notes: ''
      });
    }
  }, [isOpen, student]);
  const handleSubmit = async () => {
    if (!paymentStatus || !reference) {
      toast.error("Please fill in all fields");
      return;
    }
  
    try {
      await updateApplicationPayment(student.regNumber, paymentStatus, reference);
  
      toast.success("Payment status updated successfully!");
  
      // Update the parent component's state
      onUpdate({ ...student, paymentStatus, reference });
  
      onClose();
    } catch (error) {
      console.error("Error updating payment status:", error);
      toast.error("Failed to update payment status. Please try again.");
    }
  };

  const handleAddPayment = async () => {
    if (!paymentForm.receiptNumber || !paymentForm.amount) {
      toast.error("Please fill in receipt number and amount");
      return;
    }

    try {
      // Find student's allocation
      const allocation = await fetchAllocationByStudent(student.regNumber);
      
      if (!allocation || allocation.paymentStatus === 'Paid') {
        toast.error('No unpaid allocation found for this student');
        return;
      }

      const adminEmail = user?.email || '';
      
      await addAdminPayment({
        studentRegNumber: student.regNumber,
        allocationId: allocation.id,
        receiptNumber: paymentForm.receiptNumber,
        amount: parseFloat(paymentForm.amount),
        paymentMethod: paymentForm.paymentMethod,
        notes: paymentForm.notes
      }, adminEmail);

      // Update student payment status to Paid
      await updateApplicationPayment(student.regNumber, "Paid", paymentForm.receiptNumber);

      toast.success('Payment added and approved successfully!');
      onUpdate({ ...student, paymentStatus: "Paid", reference: paymentForm.receiptNumber });
      onClose();
    } catch (error) {
      console.error("Error adding payment:", error);
      toast.error('Failed to add payment');
    }
  };
    if (!isOpen) return null;

  return (    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">
          {showAddPayment ? "Add Payment for Student" : "Update Payment Status"}
        </h2>
        
        {!showAddPayment ? (
          <>
            <div className="mb-4">
              <Label htmlFor="paymentStatus">Payment Status</Label>
              <Select
                value={paymentStatus}
                onValueChange={setPaymentStatus}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select payment status" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="mb-4">
              <Label htmlFor="reference">Reference</Label>
              <Input
                id="reference"
                placeholder="Payment reference/receipt number"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>
            
            <div className="flex justify-between gap-2 mb-4">
              <Button 
                onClick={() => setShowAddPayment(true)} 
                variant="outline"
                className="flex-1"
              >
                Add Payment
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-4 mb-4">
              <div>
                <Label htmlFor="receiptNumber">Receipt Number *</Label>
                <Input
                  id="receiptNumber"
                  value={paymentForm.receiptNumber}
                  onChange={(e) => setPaymentForm({...paymentForm, receiptNumber: e.target.value})}
                  placeholder="Enter receipt number"
                />
              </div>
              <div>
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                  placeholder="Enter payment amount"
                />
              </div>              <div>
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select
                  value={paymentForm.paymentMethod}
                  onValueChange={(value) => setPaymentForm({...paymentForm, paymentMethod: value as Payment['paymentMethod']})}
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
                </Select>              </div>
              
              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})}
                  placeholder="Any additional notes"
                />
              </div>
            </div>
          </>
        )}
        
        <div className="flex justify-end gap-2">
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>
          {showAddPayment ? (
            <>
              <Button onClick={() => setShowAddPayment(false)} variant="outline">
                Back
              </Button>
              <Button onClick={handleAddPayment}>
                Add Payment
              </Button>
            </>
          ) : (
            <Button onClick={handleSubmit}>Save Status</Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentStatusModal;