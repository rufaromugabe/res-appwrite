"use client";
import React from "react";
import { AuthProvider } from "@/components/auth-provider";
import { StudentGuard } from "@/components/auth-guard";

const StudentDashboardPage = () => {
  return (
    <AuthProvider>
      <StudentGuard>
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-6">Student Dashboard</h1>
          <p>Welcome to your student dashboard!</p>
        </div>
      </StudentGuard>
    </AuthProvider>
  );
};

export default StudentDashboardPage;
