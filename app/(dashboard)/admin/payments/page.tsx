"use client";
import React from "react";
import { AuthProvider } from "@/components/auth-provider";
import { AdminGuard } from "@/components/auth-guard";
import AdminPaymentManagement from "@/components/admin-payment-management";

const AdminPaymentsPage = () => {
  return (
    <AuthProvider>
      <AdminGuard>
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-6">Payment Management</h1>
          <AdminPaymentManagement />
        </div>
      </AdminGuard>
    </AuthProvider>
  );
};

export default AdminPaymentsPage;
