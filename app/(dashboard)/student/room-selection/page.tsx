'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import RoomSelection from '@/components/room-selection';
import { StudentProfile } from '@/components/student-profile';
import { useAuthContext } from '@/hooks/useAuthContext';
import { getStudentByRegNumber, getStudentByUserId } from '@/data/appwrite-student-data';
import { getApplicationByRegNumber } from '@/data/appwrite-data';
import { toast } from 'react-toastify';
import { LoadingSpinner } from '@/components/loading-spinner';
import { AuthProvider } from "@/components/auth-provider";
import { StudentGuard } from "@/components/auth-guard";

function RoomSelectionContent() {
  const { user } = useAuthContext();
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState<any>(null);
  const [fetchAttempted, setFetchAttempted] = useState(false);

  useEffect(() => {
    if (!fetchAttempted && user) {
      setFetchAttempted(true);
      fetchStudentProfile();
    }
  }, [fetchAttempted, user]);

  const fetchStudentProfile = async () => {
    try {
      if (!user || !user.email) {
        setLoading(false);
        return;
      }

      let regNumber = '';
      let studentData = null;
      
      // First try to get student by user ID
      studentData = await getStudentByUserId(user.$id);
      
      if (studentData) {
        regNumber = studentData.regNumber;
      } else {
        // Fall back to email-based logic for backwards compatibility
        const emailDomain = user.email.split('@')[1];
        
        if (emailDomain === 'hit.ac.zw') {
          // For hit.ac.zw emails, use email prefix as registration number
          regNumber = user.email.split('@')[0];
          studentData = await getStudentByRegNumber(regNumber);
        } else {
          // For other emails, we already tried userId lookup above
          console.log('User not found in database');
          setLoading(false);
          return;
        }
      }

      if (studentData) {
        // Transform data to match component interface
        const transformedData = {
          ...studentData,
          id: studentData.$id || '',
          part: studentData.part?.toString() as "1" | "2" | "3" | "4" | "5" | undefined
        };
        setStudentProfile(transformedData);
        
        // Fetch application data
        const applicationData = await getApplicationByRegNumber(regNumber);
        if (applicationData) {
          setApplication(applicationData);
        }
      }
    } catch (error) {
      console.error('Error fetching student profile:', error);
      toast.error('Failed to load student data');
    } finally {
      setLoading(false);
    }
  };

  const handleRoomSelected = (roomId: string, hostelId: string) => {
    toast.success('Room allocation successful! Check your application status for payment details.');
  };

  if (loading) {
    return <LoadingSpinner />;
  }  if (!studentProfile) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="max-w-2xl w-full mx-auto p-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Required</CardTitle>
              <CardDescription>
                Please complete your student profile before selecting a room.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-600">
                  Go to your profile page and fill in all required information, then return here to select your accommodation.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> If you're using a non-HIT email address, make sure to complete the profile setup process first.
                  </p>
                </div>
                <a 
                  href="/student/profile" 
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Complete Profile
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  if (!application) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="max-w-2xl w-full mx-auto p-6">
          <Card>
            <CardHeader>
              <CardTitle>Application Required</CardTitle>
              <CardDescription>
                Please submit your accommodation application before selecting a room.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                You need to submit an accommodation application first. Once your application is approved, you can proceed with room selection.
              </p>
              <a 
                href="/student/application" 
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Submit Application
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (application.status !== 'Accepted') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="max-w-2xl w-full mx-auto p-6">
          <Card>
            <CardHeader>
              <CardTitle>Application Pending</CardTitle>
              <CardDescription>
                Your accommodation application is currently being reviewed.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Your application status: <span className={`px-2 py-1 rounded text-sm ${
                  application.status === 'Accepted' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {application.status}
                </span>
              </p>
              <p className="text-gray-600 mt-2">
                You will be able to select a room once your application is approved.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <RoomSelection 
        onRoomSelected={handleRoomSelected}
        studentProfile={studentProfile}
      />
    </div>  );
}

function RoomSelectionPage() {
  return (
    <AuthProvider>
      <StudentGuard>
        <RoomSelectionContent />
      </StudentGuard>
    </AuthProvider>
  );
}

export default RoomSelectionPage;
