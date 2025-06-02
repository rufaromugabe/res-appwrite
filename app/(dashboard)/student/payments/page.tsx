"use client";
import React from "react";
import { AuthProvider } from "@/components/auth-provider";
import { StudentGuard } from "@/components/auth-guard";
import StudentPaymentManagement from "@/components/student-payment-management";

const StudentPaymentsPage = () => {
  return (
    <AuthProvider>
      <StudentGuard>
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-6">My Payments</h1>
          <StudentPaymentManagement />
        </div>
      </StudentGuard>
    </AuthProvider>
  );
};

export default StudentPaymentsPage;
