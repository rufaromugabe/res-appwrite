"use client";
import React from "react";
import { AuthProvider } from "@/components/auth-provider";
import { AdminGuard } from "@/components/auth-guard";
import Archived from "@/components/archived";

const AdminArchivedPage = () => {
  return (
    <AuthProvider>
      <AdminGuard>
        <Archived />
      </AdminGuard>
    </AuthProvider>
  );
};

export default AdminArchivedPage;
