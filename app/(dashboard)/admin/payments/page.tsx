"use client";
import React from "react";
import { useAuthContext } from '@/hooks/useAuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LoadingSpinner } from '@/components/loading-spinner';
import { AuthProvider } from "@/components/auth-provider";
import AdminPaymentManagement from "@/components/admin-payment-management";

const PaymentsPage = () => {
  const { user, loading, role } = useAuthContext();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (role !== 'admin') {
        router.push('/unauthorized');
      } else {
        setIsAuthorized(true);
      }
    }
  }, [user, loading, role, router]);

  if (loading || !isAuthorized) {
    return <LoadingSpinner />;
  }

  return (
    <AuthProvider>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Payment Management</h1>
        <AdminPaymentManagement />
      </div>
    </AuthProvider>
  );
};

export default PaymentsPage;
