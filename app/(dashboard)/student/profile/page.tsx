"use client";
import React from "react";
import { AuthProvider } from "@/components/auth-provider";
import { StudentGuard } from "@/components/auth-guard";
import StudentProfileForm from "@/components/student-profile";

const StudentProfilePage: React.FC = () => {
  return (
    <AuthProvider>
      <StudentGuard>
        <div className="container mx-auto py-8">
          <StudentProfileForm />
        </div>
      </StudentGuard>
    </AuthProvider>
  );
};

export default StudentProfilePage;

