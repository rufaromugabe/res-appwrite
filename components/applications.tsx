import { useState, useEffect, useMemo } from "react"
import { Mail, Phone, Search } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Button } from "./ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Input } from "./ui/input"
import { useAppwriteAuth } from "@/hooks/useAppwriteAuth"
import { fetchAllApplications, updateApplicationStatus } from "@/data/appwrite-data"
import { Separator } from "./ui/separator"
import { programmes } from "@/data/programmes"
import { toast } from "react-toastify"

const SkeletonLoader = ({ rows = 10, cols = 10 }) => {
  return (
    <div className="animate-pulse  max-w-5xl mx-auto ">
      {[...Array(rows)].map((_, rowIndex) => (
        <div key={rowIndex} className="grid grid-cols-10 gap-4 mb-4 items-center p-2">
          {[...Array(cols)].map((_, colIndex) => (
            <div key={colIndex} className="h-8 bg-gray-200 rounded-md col-span-1"></div>
          ))}
        </div>
      ))}
    </div>
  )
}

const Applications = () => {
  const { user } = useAppwriteAuth();
  const [selectedPart, setSelectedPart] = useState<string>("all")
  const [selectedGender, setSelectedGender] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [selectedProgramme, setSelectedProgramme] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [boyLimit, setBoyLimit] = useState<number>(0)
  const [girlLimit, setGirlLimit] = useState<number>(0)

  // Fetch application limits
  useEffect(() => {
    // TODO: Implement application limits with Appwrite settings
  const fetchLimits = async () => {
    try {
      // Temporarily set default limits until Appwrite settings are implemented
      setBoyLimit(100);
      setGirlLimit(100);
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  fetchLimits();
  }, [])

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const apps = await fetchAllApplications()
        setApplications(apps)
      } catch (error) {
        console.error("Error fetching applications:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchApplications()
  }, [])

  const handleStatusChange = async (regNumber: string, newStatus: "Accepted" | "Archived" | "Pending") => {
    try {
      const application = applications.find((app) => app.regNumber === regNumber)

      if (!application) return

      const oldStatus = application.status || "Unknown"

      // Enforce limits for boys and girls
      if (
        newStatus === "Accepted" &&
        ((application.gender === "Male" && acceptedBoys >= boyLimit) ||
          (application.gender === "Female" && acceptedGirls >= girlLimit))
      ) {
        toast.error(`Cannot accept more ${application.gender === "Male" ? "boys" : "girls"}. Limit reached.`)
        return
      }

      await updateApplicationStatus(regNumber, newStatus)
      setApplications((prevApps) =>
        prevApps.map((app) => (app.regNumber === regNumber ? { ...app, status: newStatus } : app)),
      )
      toast.success(`Application status changed successfully.`)
      
      // TODO: Implement activity logging with Appwrite
      console.log(`Status change: ${regNumber} from ${oldStatus} to ${newStatus} by ${user?.email || "Unknown Admin"}`)
    } catch (error) {
      console.error("Error updating application status:", error)
    }
  }

  // Count accepted applications by gender
  const acceptedBoys = useMemo(
    () => applications.filter(app => app.gender === "Male" && app.status === "Accepted").length,
    [applications]
  );
  
  const acceptedGirls = useMemo(
    () => applications.filter(app => app.gender === "Female" && app.status === "Accepted").length,
    [applications]
  );
  
  const filteredApplications = useMemo(() => {
    return applications
    .filter((application) => {
      const partMatch = selectedPart === "all" || application.part.toString() === selectedPart
      const genderMatch = selectedGender === "all" || application.gender === selectedGender
      const statusMatch = selectedStatus === "all" || application.status === selectedStatus
      const programmeMatch = selectedProgramme === "all" || application.programme === selectedProgramme
      const searchMatch =
        searchQuery === "" ||
        application.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        application.regNumber.toLowerCase().includes(searchQuery.toLowerCase())
      return partMatch && genderMatch && statusMatch && programmeMatch && searchMatch
    })
    .sort((a, b) => {
      const dateComparison = new Date(a.date).getTime() - new Date(b.date).getTime()
      if (dateComparison !== 0) return dateComparison

      // Sort by time if the dates are equal
      return new Date(`1970-01-01T${a.time}`).getTime() - new Date(`1970-01-01T${b.time}`).getTime()
    })

  }, [applications, selectedPart, selectedGender, selectedStatus, selectedProgramme, searchQuery]);
  
  return (
    <div className="max-w-5xl mx-auto bg-white p-8 rounded-lg shadow-sm">
      <h2 className="text-3xl font-bold mb-6 text-center">On-campus Accommodation Applications</h2>

      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold mb-4 text-center">
          Application Statistics
          <span className="ml-2 px-3 py-1 bg-white rounded-full text-sm">
            Total Applications: {applications.length}
          </span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium mb-2">
              Boys accepted: {acceptedBoys} / {boyLimit}
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full"
                style={{ width: `${(acceptedBoys / boyLimit) * 100}%` }}
              ></div>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium mb-2">
              Girls accepted: {acceptedGirls} / {girlLimit}
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-pink-600 h-2.5 rounded-full"
                style={{ width: `${(acceptedGirls / girlLimit) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="max-w-5xl mx-auto mb-6 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or registration number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>

        {/* Filters */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {/* Part Filter */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Part:</span>
            <Select value={selectedPart} onValueChange={setSelectedPart}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select part" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Parts</SelectItem>
                <SelectItem value="1">Part 1</SelectItem>
                <SelectItem value="2">Part 2</SelectItem>
                <SelectItem value="3">Part 3</SelectItem>
                <SelectItem value="4">Part 4</SelectItem>
                <SelectItem value="5">Part 5</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Gender Filter */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Gender:</span>
            <Select value={selectedGender} onValueChange={setSelectedGender}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Status:</span>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Accepted">Accepted</SelectItem>
                <SelectItem value="Archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Programme Filter */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Programme:</span>
            <Select value={selectedProgramme} onValueChange={setSelectedProgramme}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select programme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Programmes</SelectItem>
                {programmes.map((programme) => (
                  <SelectItem key={programme.value} value={programme.value}>
                    {programme.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {loading ? (
        <SkeletonLoader rows={5} cols={10} />
      ) : (
        <Table className="max-w-5xl mx-auto rounded-t-md">
          <TableHeader className="bg-gray-100">
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Reg Number</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Programme</TableHead>
              <TableHead>Part</TableHead>
              <TableHead>Preferred Hostel</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredApplications.map((application) => (
              <TableRow key={application.regNumber}>
                <TableCell className="font-medium min-w-[100px]">
                  <div>{application.date}</div> {/* Use pre-formatted date */}
                  <div className="text-xs text-gray-500">{application.time}</div> {/* Use pre-formatted time */}
                </TableCell>
                <TableCell className="max-w-[150px]">{application.name}</TableCell>
                <TableCell className="max-w-[50px]">{application.regNumber}</TableCell>
                <TableCell className="max-w-[80px]">{application.gender}</TableCell>
                <TableCell className="max-w-[200px] overflow-hidden">{application.programme}</TableCell>
                <TableCell className="max-w-[20px] overflow-hidden">{application.part}</TableCell>
                <TableCell className="max-w-[200px]">{application.preferredHostel}</TableCell>
                <TableCell className="space-y-2 min-w-[200px]">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-3 w-3" />
                    <p className="text-xs text-gray-800">{application.email}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-3 w-3" />
                    <p className="text-xs text-gray-800">{application.phone}</p>
                  </div>
                </TableCell>
                <TableCell className="text-right min-w-[150px]">
                  <div className="flex flex-col space-y-2">
                    <Select
                      value={application.status}
                      onValueChange={(status) =>
                        handleStatusChange(application.regNumber, status as "Accepted" | "Archived" | "Pending")
                      }
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Change Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Accepted">Accepted</SelectItem>
                        <SelectItem value="Archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

export default Applications

