"use client";
import React from "react";
import { AuthProvider } from "@/components/auth-provider";
import { AdminGuard } from "@/components/auth-guard";
import Settings from "@/components/settings";

const AdminSettingsPage = () => {
  return (
    <AuthProvider>
      <AdminGuard>
        <Settings />
      </AdminGuard>
    </AuthProvider>
  );
};

export default AdminSettingsPage;
