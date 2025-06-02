"use client";
import React from "react";
import { AuthProvider } from "@/components/auth-provider";
import { AdminGuard } from "@/components/auth-guard";
import AdminAccountManagement from "@/components/accounts-management";

const AdminAccountsPage = () => {
  return (
    <AuthProvider>
      <AdminGuard>
        <AdminAccountManagement />
      </AdminGuard>
    </AuthProvider>
  );
};

export default AdminAccountsPage;
