'use client'; 
import React, { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'react-toastify';
import { fetchHostels, fetchAllocationByStudent } from "@/data/appwrite-hostel-data";
import { createApplication, getApplicationByRegNumber, deleteApplication } from "@/data/appwrite-data";
import { getStudentByUserId, StudentProfile } from "@/data/appwrite-student-data";
import { useAuthContext } from '@/hooks/useAuthContext';
import { Hostel, RoomAllocation } from "@/types/hostel";

// Define Zod schema for validation
const StudentApplicationSchema = z.object({
  preferredHostel: z
    .string()
    .min(1, "Preferred hostel is required")
});

type FormValues = z.infer<typeof StudentApplicationSchema>;

interface ApplicationData {
  preferredHostel: string;
  name: string;
  email: string;
  regNumber: string;
  submittedAt: string;
  status: "Pending" | "Accepted" | "Archived";
}

// Function to check if applications are restricted
const isApplicationRestricted = (regNumber: string): boolean => {
  const currentDate = new Date();
  const restrictionEndDate = new Date('2025-06-01T08:00:00'); // June 4, 2025 at 08:00
  
  // If current date is before restriction end date, only allow H250XXXX registration numbers
  if (currentDate < restrictionEndDate) {
    return !regNumber.startsWith('H250');
  }
  
  return false; // After June 4, 2025 08:00, all registrations are allowed
};

const StudentApplicationForm: React.FC = () => {
  const { user } = useAuthContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // State to manage loading
  const [application, setApplication] = useState<ApplicationData | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [roomAllocation, setRoomAllocation] = useState<RoomAllocation | null>(null);
  const [roomDetails, setRoomDetails] = useState<{roomNumber: string, hostelName: string, floorName: string, price: number} | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(StudentApplicationSchema),
    defaultValues: {
      preferredHostel: "",
    },
  });  // Fetch authenticated user's profile and application
  useEffect(() => {
    const fetchProfileAndApplication = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        // Get student profile using Appwrite user ID
        const student = await getStudentByUserId(user.$id);
        
        if (!student) {
          console.log("Student profile not found");
          setIsLoading(false);
          return;
        }

        setProfile(student);

        // Fetch application by registration number
        const applicationData = await getApplicationByRegNumber(student.regNumber);
        if (applicationData) {
          setApplication(applicationData);
        }

        // Fetch hostels
        const hostelData = await fetchHostels();
        setHostels(hostelData);

        // Check for room allocation
        const allocation = await fetchAllocationByStudent(student.regNumber);
        if (allocation) {
          setRoomAllocation(allocation);
          // Fetch room details from hostel data
          const hostel = hostelData.find(h => h.id === allocation.hostelId);
          if (hostel) {
            let roomDetails = null;
            hostel.floors.forEach(floor => {
              floor.rooms.forEach(room => {
                if (room.id === allocation.roomId) {
                  roomDetails = {
                    roomNumber: room.number,
                    hostelName: hostel.name,
                    floorName: floor.name,
                    price: hostel.pricePerSemester
                  };
                }
              });
            });
            if (roomDetails) {
              setRoomDetails(roomDetails);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false); // Loading is complete
      }
    };

    fetchProfileAndApplication();
  }, [user]);

  const onSubmit = async (data: FormValues) => {
    if (!profile) {
      toast.error("Profile data is missing. Please update your profile first.");
      return;
    }
  
    const { regNumber, name, email } = profile;
  
    setIsSubmitting(true);

    try {
      // Submit application using Appwrite
      const applicationData = {
        preferredHostel: data.preferredHostel,
        name,
        email,
        regNumber,
        submittedAt: new Date().toISOString(),
        status: "Pending" as const, // Applications start as pending
        gender: profile.gender, // Include gender for potential auto-accept logic
        programme: profile.programme,
        part: profile.part,
        phone: profile.phone || '',
        paymentStatus: 'Not Paid',
        reference: '',
        userId: user?.$id,
      };

      await createApplication(applicationData);

      setApplication(applicationData);

      toast.success(`Application submitted successfully! You can now proceed to room selection.`);
      
      // Redirect to room selection after successful application
      setTimeout(() => {
        window.location.href = '/student/room-selection';
      }, 2000);
    } catch (error) {
      console.error("Error submitting application:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to submit application."
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  
  

  const handleDeleteApplication = async () => {
    if (!profile) {
      toast.error("Profile data is missing. Please reload the page.");
      return;
    }

    const { regNumber } = profile;

    try {
      // First get the application by reg number to get the ID
      const existingApplication = await getApplicationByRegNumber(regNumber);
      if (!existingApplication || !existingApplication.$id) {
        toast.error("Application not found.");
        return;
      }

      // Delete the application using its ID
      await deleteApplication(existingApplication.$id);
      setApplication(null); // Clear application state
      toast.success("Application deleted successfully.");
    } catch (error) {
      console.error("Error deleting application:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete application."
      );
    }
  };

  // Skeleton Loading UI
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="max-w-5xl w-full mx-auto bg-white p-8 rounded-lg shadow-sm animate-pulse">
          <div className="h-6 bg-gray-300 rounded w-3/4 mx-auto mb-4"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2 mx-auto mb-8"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-300 rounded"></div>
            <div className="h-4 bg-gray-300 rounded w-5/6"></div>
            <div className="h-4 bg-gray-300 rounded"></div>
          </div>
          <div className="h-12 bg-gray-300 rounded mt-8"></div>
        </div>
      </div>
    );
  }  if (application) {
    return (
      <div className="flex items-center justify-center h-full overflow-auto">
        <div className="max-w-5xl w-full mx-auto bg-white p-8 rounded-lg shadow-sm">
          <h2 className="text-3xl font-bold mb-6 text-center">
            Your Application
          </h2>
          <p className="text-gray-600 mb-8 text-center">
            Below is your submitted application. You can delete it to submit a new one.
          </p><div className="bg-gray-100 p-6 rounded-lg">
          <p>
            <strong>Name:</strong> {application.name}
          </p>
          <p>
            <strong>Email:</strong> {application.email}
          </p>
          <p>
            <strong>Registration Number:</strong> {application.regNumber}
          </p>
          <p>
            <strong>Preferred Hostel:</strong> {application.preferredHostel}
          </p>
          <p>
            <strong>Submitted At:</strong> {new Date(application.submittedAt).toLocaleString()}
          </p>
          <p>
            <strong>Status:</strong> 
            <span className={`ml-2 px-2 py-1 rounded text-sm ${
              application.status === 'Accepted' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
              {application.status}
            </span>
          </p>          {roomAllocation && roomDetails && (
            <div className="mt-4 p-4 bg-blue-50 rounded border border-blue-200">
              <p className="font-semibold text-blue-800">Room Allocation:</p>
              <p><strong>Hostel:</strong> {roomDetails.hostelName}</p>
              <p><strong>Room:</strong> {roomDetails.roomNumber}</p>
              <p><strong>Floor:</strong> {roomDetails.floorName}</p>
              <p><strong>Price:</strong> ${roomDetails.price}/semester</p>
              <p><strong>Payment Status:</strong> {roomAllocation.paymentStatus}</p>
              <p><strong>Allocated At:</strong> {new Date(roomAllocation.allocatedAt).toLocaleString()}</p>
            </div>
          )}
        </div>

        {!roomAllocation && application.status === 'Accepted' && (
          <div className="mt-6 p-4 bg-green-50 rounded border border-green-200">
            <p className="text-green-800 font-medium">🎉 Your application has been accepted!</p>
            <p className="text-green-700 mt-2">You can now proceed to select your room.</p>
            <Button
              onClick={() => window.location.href = '/student/room-selection'}
              className="mt-3 bg-green-600 hover:bg-green-700"
            >
              Select Room
            </Button>
          </div>
        )}        <Button
          onClick={handleDeleteApplication}
          className="w-full mt-6 text-lg py-6"
          variant="destructive"
        >
          Delete Application
        </Button>
        </div>
      </div>
    );
  }
  // Check if profile data is missing (could happen for non-hit.ac.zw users)
  if (!profile) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="max-w-5xl w-full mx-auto bg-white p-8 rounded-lg shadow-sm">
          <h2 className="text-3xl font-bold mb-6 text-center text-red-600">
            Profile Required
          </h2>
          <p className="text-gray-600 mb-8 text-center">
            You need to complete your profile before submitting an application.
          </p>
          <div className="bg-yellow-50 p-4 rounded border border-yellow-200 mb-6">
            <p className="text-yellow-800">
              Please go to your profile page and complete all required information first.
            </p>
          </div>
          <Button
            onClick={() => window.location.href = '/student/profile'}
            className="w-full text-lg py-6 bg-blue-600 hover:bg-blue-700"
          >
            Go to Profile
          </Button>
        </div>
      </div>
    );
  }

  // Check if applications are restricted for this user
  if (isApplicationRestricted(profile.regNumber)) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="max-w-5xl w-full mx-auto bg-white p-8 rounded-lg shadow-sm">
          <h2 className="text-3xl font-bold mb-6 text-center text-orange-600">
            Applications Restricted
          </h2>
          <div className="bg-orange-50 p-6 rounded border border-orange-200 mb-6">
            <p className="text-orange-800 text-lg font-medium text-center">
              Only Part 1s can apply at the moment. Applications will open for everyone else on 4 June 2025 at 08:00. Thank you.
            </p>
          </div>
          <div className="text-center text-gray-600">
            <p>Your registration number: <strong>{profile.regNumber}</strong></p>
            <p className="mt-2">Please check back after the restriction period ends.</p>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center h-full overflow-auto">
      <div className="max-w-5xl w-full mx-auto bg-white p-8 rounded-lg shadow-sm">
        <h2 className="text-3xl font-bold mb-6 text-center">
          On-campus Res Application
        </h2>
        <p className="text-gray-600 mb-8 text-center">
          Note: We will use data in your profile. Please ensure it is correct.
        </p>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-8 max-w-4xl mx-auto"
        >          <FormField
            control={form.control}
            name="preferredHostel"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-lg font-medium">
                  Preferred Hostel
                </FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a hostel" />
                    </SelectTrigger>
                    <SelectContent>
                      {hostels.map((hostel) => (
                        <SelectItem key={hostel.id} value={hostel.name}>
                          {hostel.name} (${hostel.pricePerSemester}/semester)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            className="w-full text-lg py-6"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit Application"}
          </Button>        </form>
      </Form>
      </div>
    </div>
  );
};

export default StudentApplicationForm;
