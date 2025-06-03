"use client";
import React from "react";
import { AuthProvider } from "@/components/auth-provider";
import { StudentGuard } from "@/components/auth-guard";
import StudentApplicationForm from "@/components/student-application";

const StudentApplicationPage = () => {
  return (
    <AuthProvider>
      <StudentGuard>
        <StudentApplicationForm />
      </StudentGuard>
    </AuthProvider>
  );
};

export default StudentApplicationPage;
