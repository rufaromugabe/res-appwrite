"use client";
import React from "react";
import { AuthProvider } from "@/components/auth-provider";
import { AdminGuard } from "@/components/auth-guard";
import Logs from "@/components/activity-logs";

const AdminLogsPage = () => {
  return (
    <AuthProvider>
      <AdminGuard>
        <Logs />
      </AdminGuard>
    </AuthProvider>
  );
};

export default AdminLogsPage;
