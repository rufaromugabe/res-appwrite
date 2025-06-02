"use client";
import React from "react";
import { AuthProvider } from "@/components/auth-provider";
import { AdminGuard } from "@/components/auth-guard";
import Applications from "@/components/applications";

const AdminPage = () => {
  return (
    <AuthProvider>
      <AdminGuard>
        <Applications />
      </AdminGuard>
    </AuthProvider>
  );
};

export default AdminPage;
