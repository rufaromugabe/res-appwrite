"use client";
import type React from "react";
import { useEffect, useState } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { toast } from "react-toastify";
import { useAuthContext } from '@/hooks/useAuthContext';
import { getStudentByUserId, updateStudentProfile, createOrUpdateStudentProfile } from "@/data/appwrite-student-data";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import {
  User,
  Phone,
  BookOpen,
  Mail,
  GraduationCap,
  Users,
  CheckCircle,  Search,
  ArrowRight,
  Edit,
  Save,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Combobox } from "./ui/combobox";
import { programmes } from "@/data/programmes";
import { studentDatabase, findStudentByRegNumber, type StudentData } from "@/data/student-data";
import { useRouter } from "next/navigation";

// Updated Student interface to match StudentData structure
interface Student {
  email?: string; // Optional, will use sign-in email
  gender: "Male" | "Female";
  name: string; // Full name (first name + surname concatenated)
  part: "1" | "2" | "3" | "4" | "5";
  phone?: string; // Optional, students will update this
  programme: string;
  regNumber: string;
}

export interface StudentProfile {
  id: string;
  name: string; // Full name (first name + surname concatenated)
  email: string;
  phone?: string;
  regNumber: string;
  gender?: "Male" | "Female";
  part?: "1" | "2" | "3" | "4" | "5";
  programme?: string;
}

const StudentProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
  regNumber: z.string().min(1, "Registration number is required"),
  gender: z.enum(["Male", "Female"], { required_error: "Gender is required" }),
  part: z.enum(["1", "2", "3", "4", "5"], {
    required_error: "Part is required",
  }),
  programme: z.string().min(1, "Programme is required"),
});

type FormValues = z.infer<typeof StudentProfileSchema>;

// Onboarding functionality moved inline to main component

const StudentProfileForm: React.FC<{}> = () => {
  const { user } = useAuthContext();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [inputRegNumber, setInputRegNumber] = useState("");
  const [onboardingError, setOnboardingError] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [authDetails, setAuthDetails] = useState({
    userName: "",
    userEmail: "",
    regNumber: "",
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(StudentProfileSchema),
    defaultValues: {
      name: "",
      phone: "",
      regNumber: "",
      gender: "Male",
      part: "1",
      programme: "",
    },
  });

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        if (user) {
          const emailDomain = user.email?.split("@")[1] || "";
          let regNumber = "";

          setAuthDetails({
            userName: user.name || "",
            userEmail: user.email || "",
            regNumber,
          });

          if (emailDomain === "hit.ac.zw") {
            // For hit.ac.zw domain users
            regNumber = user.email?.split("@")[0] || "";
            setAuthDetails((prev) => ({ ...prev, regNumber }));

            // Try to get student profile by user ID
            const studentProfile = await getStudentByUserId(user.$id);

            if (studentProfile) {
              form.reset({
                name: studentProfile.name || user.name || "",
                phone: studentProfile.phone || "",
                regNumber: studentProfile.regNumber || regNumber,
                gender: studentProfile.gender,
                part: studentProfile.part?.toString() as "1" | "2" | "3" | "4" | "5",
                programme: studentProfile.programme || "",
              });
            } else {
              // No profile exists, enable edit mode and prefill available data
              form.reset({
                name: user.name || "",
                phone: "",
                regNumber: regNumber,
                gender: "Male",
                part: "1",
                programme: "",
              });
              setIsEditing(true);
            }
          } else if (emailDomain === "gmail.com" && user.email) {
            // For gmail.com users, try to get existing student profile
            const studentProfile = await getStudentByUserId(user.$id);

            if (studentProfile) {
              // User exists in database, populate form with their data
              form.reset({
                name: studentProfile.name || user.name || "",
                phone: studentProfile.phone || "",
                regNumber: studentProfile.regNumber || "",
                gender: studentProfile.gender,
                part: studentProfile.part?.toString() as "1" | "2" | "3" | "4" | "5",
                programme: studentProfile.programme || "",
              });

              setAuthDetails((prev) => ({
                ...prev,
                userName: studentProfile.name || user.name || "",
                regNumber: studentProfile.regNumber || "",
              }));
            } else {
              // User doesn't exist, show onboarding inline
              setNeedsOnboarding(true);
            }
          }
        }
      } catch (error) {
        toast.error("Error fetching profile");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [form, user]);
  const handleRegNumberSubmit = async () => {
    setIsSearching(true);
    setOnboardingError("");

    // Simulate search delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const studentData = findStudentByRegNumber(inputRegNumber);
    if (studentData) {
      // Convert StudentData to Student format for compatibility
      const student: Student = {
        email: studentData.email || authDetails.userEmail, // Use sign-in email if not provided
        gender: studentData.gender,
        name: `${studentData.name} ${studentData.surname}`, // Concatenate first name and surname
        part: studentData.part,
        phone: studentData.phone || "", // Will be updated by student
        programme: studentData.programme,
        regNumber: studentData.regNumber,
      };
        // Directly prefill form and show profile page
      handleOnboardingComplete(student);
    } else {
      setOnboardingError("Registration number not found. Please try again.");
    }
    setIsSearching(false);  };
  const handleOnboardingComplete = (studentData: Student) => {
    // Just prefill the form with the student data, don't save to Firebase yet
    form.reset({
      name: studentData.name,
      phone: studentData.phone,
      regNumber: studentData.regNumber,
      gender: studentData.gender,
      part: studentData.part,
      programme: studentData.programme,
    });

    // Update auth details with the registration number
    setAuthDetails((prev) => ({
      ...prev,
      userName: studentData.name,
      regNumber: studentData.regNumber,
    }));

    setNeedsOnboarding(false);
    setIsEditing(true);
    toast.success(
      "Profile details found and filled! Please review and save your information."
    );
  };

  const onSubmit = async (data: FormValues) => {
    try {
      if (!user) {
        toast.error("User not authenticated");
        return;
      }

      // Check if student profile exists
      const existingProfile = await getStudentByUserId(user.$id);
      
      const profileData = {
        ...data,
        part: parseInt(data.part), // Convert string to number for Appwrite
        email: authDetails.userEmail,
        userId: user.$id,
      };

      if (existingProfile && existingProfile.$id) {
        // Update existing profile
        await updateStudentProfile(existingProfile.$id, profileData);
      } else {
        // Create new profile using createOrUpdateStudentProfile
        await createOrUpdateStudentProfile(profileData);
      }

      // Update authDetails with the saved name
      setAuthDetails((prev) => ({
        ...prev,
        userName: data.name,
        regNumber: data.regNumber,
      }));

      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } catch (error) {
      toast.error("Failed to update profile");
    }
  };

  const handleEditClick = () => {
    if (isEditing) {
      form.handleSubmit(onSubmit)();
    } else {
      setIsEditing(true);    }  };

  if (isLoading) {
    return (
      <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <div className="text-center">
              <Skeleton height={32} width={200} className="mx-auto mb-2" />
              <Skeleton height={20} width={300} className="mx-auto" />
            </div>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton height={20} width="40%" />
                  <Skeleton height={40} />
                </div>
              ))}
            </div>
            <Skeleton height={50} />
          </CardContent>
        </Card>
      </div>
    );
  }
  return (
    <>
      <div className="w-full max-w-6xl mx-auto p-6 space-y-6">        {needsOnboarding ? (
          <Card>
            <CardHeader>
              <div className="text-center">
                <CardTitle className="text-xl font-bold">Welcome!</CardTitle>
                <CardDescription className="mt-1">
                  Let's set up your profile to get started
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Enter Your Registration Number
                  </h3>
                  <p className="text-sm text-gray-600">
                    We'll search for your details in our system and set up your profile
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label
                      htmlFor="regNumber"
                      className="text-sm font-medium text-gray-700"
                    >
                      Registration Number
                    </Label>
                    <Input
                      id="regNumber"
                      value={inputRegNumber}
                      onChange={(e) => setInputRegNumber(e.target.value)}
                      placeholder="Enter your registration number"
                      className="mt-1"
                    />
                  </div>

                  {onboardingError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200"
                    >
                      {onboardingError}
                    </motion.div>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    onClick={handleRegNumberSubmit}
                    disabled={!inputRegNumber || isSearching}
                    className="w-full"
                  >
                    {isSearching ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "linear",
                          }}
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                        />
                        Setting up your profile...
                      </>
                    ) : (
                      <>
                        Set Up Profile <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>            {/* Welcome Header */}
            <div className="text-center space-y-2">
              <h1 className="text-2xl md:text-4xl font-bold text-gray-900">
                Welcome, {authDetails.userName || "Student"}!
              </h1>
              <p className="text-base md:text-lg text-gray-600">
                This is your personal dashboard. Keep your information up to date for
                the best experience.
              </p>
            </div>

        {/* Profile Information Card */}
        <Card>          <CardHeader>
            <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
              <div>
                <CardTitle className="text-xl md:text-2xl flex items-center">
                  <User className="w-5 h-5 md:w-6 md:h-6 mr-2 text-blue-600" />
                  Profile Information
                </CardTitle>
                <CardDescription className="text-sm md:text-base">
                  {isEditing
                    ? "Update your personal information below"
                    : "View your personal information and make changes when needed"}
                </CardDescription>
              </div>
              <div className="flex flex-col space-y-2 md:flex-row md:items-center md:space-y-0 md:gap-3">
                {!isEditing && (
                  <Badge variant="secondary" className="flex items-center justify-center md:justify-start">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Profile Complete
                  </Badge>
                )}
                <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:gap-2">
                  {isEditing && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                      className="w-full md:w-auto"
                    >
                      <X className="w-4 h-4 mr-2" />
                      <span className="md:inline">Cancel</span>
                    </Button>
                  )}
                  <Button
                    type="button"
                    onClick={handleEditClick}
                    className="w-full md:w-auto"
                  >
                    {isEditing ? (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        <span className="md:inline">Save Changes</span>
                      </>
                    ) : (
                      <>
                        <Edit className="w-4 h-4 mr-2" />
                        <span className="md:inline">Edit Profile</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Full Name */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium flex items-center">
                          <User className="w-4 h-4 mr-2 text-gray-500" />
                          Full Name
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || authDetails.userName}
                            onChange={(e) => {
                              field.onChange(e);
                              setAuthDetails((prev) => ({
                                ...prev,
                                userName: e.target.value,
                              }));
                            }}
                            disabled={!isEditing}
                            className={!isEditing ? "bg-gray-50" : ""}
                            placeholder="Enter your full name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Email */}
                  <div className="space-y-2">
                    <Label className="text-base font-medium flex items-center">
                      <Mail className="w-4 h-4 mr-2 text-gray-500" />
                      Email Address
                    </Label>
                    <Input
                      value={authDetails.userEmail}
                      disabled
                      className="bg-gray-50"
                    />
                    <p className="text-xs text-gray-500">
                      Email cannot be changed
                    </p>
                  </div>

                  {/* Registration Number */}
                  <FormField
                    control={form.control}
                    name="regNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium flex items-center">
                          <BookOpen className="w-4 h-4 mr-2 text-gray-500" />
                          Registration Number
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || authDetails.regNumber}
                            disabled={!isEditing}
                            className={!isEditing ? "bg-gray-50" : ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Phone */}
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium flex items-center">
                          <Phone className="w-4 h-4 mr-2 text-gray-500" />
                          Phone Number
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter your phone number"
                            {...field}
                            disabled={!isEditing}
                            className={!isEditing ? "bg-gray-50" : ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Gender */}
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium flex items-center">
                          <Users className="w-4 h-4 mr-2 text-gray-500" />
                          Gender
                        </FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="flex flex-row space-x-6"
                            disabled={!isEditing}
                          >
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <RadioGroupItem value="Male" />
                              </FormControl>
                              <FormLabel className="font-normal">Male</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <RadioGroupItem value="Female" />
                              </FormControl>
                              <FormLabel className="font-normal">Female</FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Part */}
                  <FormField
                    control={form.control}
                    name="part"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium flex items-center">
                          <GraduationCap className="w-4 h-4 mr-2 text-gray-500" />
                          Academic Year (Part)
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={!isEditing}
                        >
                          <FormControl>
                            <SelectTrigger className={!isEditing ? "bg-gray-50" : ""}>
                              <SelectValue placeholder="Select your part" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {["1", "2", "3", "4", "5"].map((part) => (
                              <SelectItem key={part} value={part}>
                                Part {part}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Programme - Full Width */}
                  <FormField
                    control={form.control}
                    name="programme"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium flex items-center">
                          <BookOpen className="w-4 h-4 mr-2 text-gray-500" />
                          Programme of Study
                        </FormLabel>
                        <FormControl>
                          <Combobox
                            value={field.value}
                            onChange={field.onChange}
                            options={programmes}
                            placeholder="Select your programme"
                            disabled={!isEditing}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />                </div>
              </form>
            </Form>
          </CardContent>
        </Card>        {/* Quick Actions Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Quick Actions</CardTitle>
            <CardDescription className="text-sm md:text-base">
              Access the most common features from here
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="h-16 md:h-20 flex flex-col space-y-1 md:space-y-2"
                onClick={() => router.push("/student/room-selection")}
              >
                <BookOpen className="w-5 h-5 md:w-6 md:h-6" />
                <span className="text-xs md:text-sm">Room Selection</span>
              </Button>
              <Button
                variant="outline"
                className="h-16 md:h-20 flex flex-col space-y-1 md:space-y-2"
                onClick={() => router.push("/student/payments")}
              >
                <GraduationCap className="w-5 h-5 md:w-6 md:h-6" />
                <span className="text-xs md:text-sm">View Payments</span>
              </Button>
              <Button
                variant="outline"
                className="h-16 md:h-20 flex flex-col space-y-1 md:space-y-2 sm:col-span-2 lg:col-span-1"
                onClick={() => router.push("/student/application")}
              >
                <User className="w-5 h-5 md:w-6 md:h-6" />
                <span className="text-xs md:text-sm">Application Status</span>
              </Button>            </div>
          </CardContent>
        </Card>
          </>
        )}
      </div>
    </>
  );
};

export default StudentProfileForm;
