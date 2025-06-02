"use client";
import React from "react";
import { AuthProvider } from "@/components/auth-provider";
import { AdminGuard } from "@/components/auth-guard";
import Accepted from "@/components/accepted";

const AdminAcceptedPage = () => {
  return (
    <AuthProvider>
      <AdminGuard>
        <Accepted />
      </AdminGuard>
    </AuthProvider>
  );
};

export default AdminAcceptedPage;
