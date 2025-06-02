"use client";
import React from "react";
import { AuthProvider } from "@/components/auth-provider";
import { AdminGuard } from "@/components/auth-guard";
import Applications from "@/components/applications";
import { QueryClient, QueryClientProvider } from 'react-query';

// Initialize QueryClient
const queryClient = new QueryClient();

const AdminApplicationsPage = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AdminGuard>
          <Applications />
        </AdminGuard>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default AdminApplicationsPage;