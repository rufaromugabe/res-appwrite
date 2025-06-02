"use client";
import React from "react";
import { useAuthContext } from '@/hooks/useAuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AuthProvider } from "@/components/auth-provider";
import Applications from "@/components/applications";
import Logs from "@/components/activity-logs";

const page = () => {
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

  
  
  return<AuthProvider>
  <Logs />
  </AuthProvider>;
};

export default page;
