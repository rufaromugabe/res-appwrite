'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'react-toastify';
import { 
  Building, 
  Users, 
  Bed, 
  Wifi, 
  Shield, 
  Coffee,
  BookOpen,
  MapPin,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Hostel, Room } from '@/types/hostel';
import { fetchHostels, allocateRoom, fetchAllocationByStudent, fetchHostelSettings } from '@/data/appwrite-hostel-data';
import { getStudentByUserId } from '@/data/appwrite-student-data';
import { useAuthContext } from '@/hooks/useAuthContext';
import { StudentProfile } from './student-profile';
import StudentPaymentManagement from './student-payment-management';

interface RoomSelectionProps {
  onRoomSelected: (roomId: string, hostelId: string) => void;
  studentProfile: StudentProfile | null;
}

const RoomSelection: React.FC<RoomSelectionProps> = ({ onRoomSelected, studentProfile }) => {
  const { user } = useAuthContext();
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [selectedHostel, setSelectedHostel] = useState<string>('');
  const [selectedFloor, setSelectedFloor] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [priceFilter, setPriceFilter] = useState<string>('any');
  const [capacityFilter, setCapacityFilter] = useState<string>('any');
  const [loading, setLoading] = useState(true);  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isSelecting, setIsSelecting] = useState<boolean>(false);  const [existingAllocation, setExistingAllocation] = useState<any>(null);
  const [allocationRoomDetails, setAllocationRoomDetails] = useState<any>(null);
  const [allocationChecked, setAllocationChecked] = useState(false);
  const [hostelSettings, setHostelSettings] = useState<any>(null);
  useEffect(() => {
    loadHostels();
    loadHostelSettings();
  }, []);

  useEffect(() => {
    if (hostels.length > 0 && !allocationChecked) {
      setAllocationChecked(true);
      checkExistingAllocation();
    }
  }, [hostels, allocationChecked]);
  const loadHostels = async () => {
    try {
      const hostelData = await fetchHostels();
      setHostels(hostelData.filter(h => h.isActive));
    } catch (error) {
      toast.error('Failed to load hostels');
    } finally {
      setLoading(false);
    }
  };

  const loadHostelSettings = async () => {
    try {
      const settings = await fetchHostelSettings();
      setHostelSettings(settings);
    } catch (error) {
      console.error('Failed to load hostel settings:', error);
    }
  };  const checkExistingAllocation = async () => {
    if (!user) return;
    
    try {
      // Get student profile using Appwrite user ID
      const student = await getStudentByUserId(user.$id);
      
      if (!student) {
        console.log("Student profile not found");
        return;
      }

      const allocations = await fetchAllocationByStudent(student.regNumber);
      if (allocations) {
        setExistingAllocation(allocations);
        
        // Fetch room details for the allocation
        const hostel = hostels.find(h => h.id === allocations.hostelId);
        if (hostel) {
          let roomDetails = null;
          hostel.floors.forEach(floor => {
            floor.rooms.forEach(room => {
              if (room.id === allocations.roomId) {
                roomDetails = {
                  ...room,
                  hostelName: hostel.name,
                  floorName: floor.name
                };
              }
            });
          });
          setAllocationRoomDetails(roomDetails);
        }
      }
    } catch (error) {
      console.error("Error checking existing allocation:", error);
    }
  };

  const getFilteredRooms = () => {
    if (!selectedHostel) return [];
    
    const hostel = hostels.find(h => h.id === selectedHostel);
    if (!hostel) return [];

    let rooms: (Room & { hostelName: string; floorName: string; price: number })[] = [];
      hostel.floors.forEach(floor => {
      if (!selectedFloor || selectedFloor === 'all' || floor.id === selectedFloor) {
        floor.rooms.forEach(room => {
          // Filter by student gender compatibility
          const isGenderCompatible = !studentProfile?.gender || 
            room.gender === 'Mixed' || 
            room.gender === studentProfile.gender;
          
          if (isGenderCompatible && room.isAvailable && !room.isReserved) {
            rooms.push({
              ...room,
              hostelName: hostel.name,
              floorName: floor.name,
              price: hostel.pricePerSemester
            });
          }
        });
      }
    });

    // Apply filters
    if (searchTerm) {
      rooms = rooms.filter(room => 
        room.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.hostelName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.floorName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }    if (priceFilter && priceFilter !== 'any') {
      const [min, max] = priceFilter.split('-').map(Number);
      rooms = rooms.filter(room => room.price >= min && room.price <= max);
    }    if (capacityFilter && capacityFilter !== 'any') {
      rooms = rooms.filter(room => room.capacity.toString() === capacityFilter);
    }

    return rooms;
  };
  const handleRoomSelect = async (room: Room & { hostelName: string; floorName: string; price: number }) => {
    // Prevent double-clicks by checking if already selecting
    if (isSelecting) return;
    
    if (existingAllocation) {
      toast.error('You already have a room allocation. Please contact admin to change.');
      return;
    }

    setIsSelecting(true);
    setSelectedRoom(room);
    
    // Reset the selecting state after a short delay
    setTimeout(() => setIsSelecting(false), 1000);
  };  const confirmRoomSelection = async () => {
    if (!selectedRoom || !user || isSelecting) return;

    try {
      setIsSelecting(true);
      
      // Get student profile using Appwrite user ID
      const student = await getStudentByUserId(user.$id);
      
      if (!student) {
        toast.error("Profile not found. Please complete your profile first.");
        return;
      }
      
      // Fetch settings to get the grace period (deadline)
      const settings = await fetchHostelSettings();
      await allocateRoom(student.regNumber, selectedRoom.id, selectedHostel);
      
      const deadlineHours = settings.paymentGracePeriod;
      const deadlineDays = Math.round(deadlineHours / 24);
      toast.success(`Room ${selectedRoom.number} allocated successfully! Please pay within ${deadlineHours} hours (${deadlineDays} days) to confirm.`);
      onRoomSelected(selectedRoom.id, selectedHostel);      
      // Refresh data
      loadHostels();
      checkExistingAllocation();
      setSelectedRoom(null); // Close the modal
    } catch (error) {
      toast.error('Failed to allocate room. Please try again.');
    } finally {
      setIsSelecting(false);
    }
  };

  const getRoomStatusColor = (room: Room) => {
    if (!room.isAvailable) return 'bg-red-100 border-red-200';
    if (room.isReserved) return 'bg-yellow-100 border-yellow-200';
    if (room.occupants.length === 0) return 'bg-green-100 border-green-200';
    return 'bg-blue-100 border-blue-200';
  };

  const getRoomStatusIcon = (room: Room) => {
    if (!room.isAvailable) return <XCircle className="w-4 h-4 text-red-500" />;
    if (room.isReserved) return <Clock className="w-4 h-4 text-yellow-500" />;
    if (room.occupants.length === 0) return <CheckCircle className="w-4 h-4 text-green-500" />;
    return <Users className="w-4 h-4 text-blue-500" />;
  };

  const getRoomStatusText = (room: Room) => {
    if (!room.isAvailable) return 'Full';
    if (room.isReserved) return 'Reserved';
    if (room.occupants.length === 0) return 'Available';
    return `${room.occupants.length}/${room.capacity} occupied`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (existingAllocation) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Room Already Allocated
          </CardTitle>
          <CardDescription>
            You have been allocated a room. Check your payment status below.
          </CardDescription>
        </CardHeader>        <CardContent>
          <div className="space-y-4">
            {allocationRoomDetails && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-blue-800 mb-2">Room Details</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <p><strong>Hostel:</strong> {allocationRoomDetails.hostelName}</p>
                  <p><strong>Floor:</strong> {allocationRoomDetails.floorName}</p>
                  <p><strong>Room Number:</strong> {allocationRoomDetails.number}</p>
                  <p><strong>Capacity:</strong> {allocationRoomDetails.capacity} {allocationRoomDetails.capacity === 1 ? 'person' : 'people'}</p>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Room Number</p>
                <p className="text-lg font-semibold">{allocationRoomDetails ? allocationRoomDetails.number : existingAllocation.roomId}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Payment Status</p>
                <Badge variant={existingAllocation.paymentStatus === 'Paid' ? 'default' : 'destructive'}>
                  {existingAllocation.paymentStatus}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Payment Deadline</p>
                <p className="text-sm">{new Date(existingAllocation.paymentDeadline).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Allocated Date</p>
                <p className="text-sm">{new Date(existingAllocation.allocatedAt).toLocaleDateString()}</p>
              </div>
            </div>            {existingAllocation.paymentStatus !== 'Paid' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  <p className="text-sm font-medium text-yellow-800">Payment Required</p>
                </div>
                <p className="text-sm text-yellow-700 mt-1">
                  Please complete your payment by the deadline to secure your room allocation.
                </p>
              </div>
            )}
            
            {/* Payment Management Section */}
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-4">Payment Management</h4>
              <StudentPaymentManagement />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="text-center py-6 border-b bg-white">
        <h2 className="text-3xl font-bold text-gray-900">Select Your Room</h2>
        <p className="text-gray-600 mt-2">Choose from available accommodations that match your preferences</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6 space-y-6">

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Rooms</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Hostel</label>
              <Select value={selectedHostel} onValueChange={setSelectedHostel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select hostel" />
                </SelectTrigger>
                <SelectContent>
                  {hostels.map(hostel => (
                    <SelectItem key={hostel.id} value={hostel.id}>
                      {hostel.name} (${hostel.pricePerSemester})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedHostel && (
              <div>
                <label className="block text-sm font-medium mb-2">Floor</label>                  <Select value={selectedFloor} onValueChange={setSelectedFloor}>
                    <SelectTrigger>
                      <SelectValue placeholder="All floors" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All floors</SelectItem>
                      {hostels.find(h => h.id === selectedHostel)?.floors.map(floor => (
                        <SelectItem key={floor.id} value={floor.id}>
                          {floor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Price Range</label>              <Select value={priceFilter} onValueChange={setPriceFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Any price" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any price</SelectItem>
                  <SelectItem value="0-450">$0 - $450</SelectItem>
                  <SelectItem value="451-500">$451 - $500</SelectItem>
                  <SelectItem value="501-600">$501 - $600</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Search</label>
              <Input
                placeholder="Search room number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hostel Info */}
      {selectedHostel && (
        <Card>
          <CardContent className="pt-6">
            {(() => {
              const hostel = hostels.find(h => h.id === selectedHostel);
              if (!hostel) return null;
              
              return (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold">{hostel.name}</h3>
                      <p className="text-gray-600">{hostel.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-indigo-600">${hostel.pricePerSemester}</p>
                      <p className="text-sm text-gray-500">per semester</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {hostel.features.map((feature, index) => (
                      <Badge key={index} variant="secondary">{feature}</Badge>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-gray-500" />
                      <span>Capacity: {hostel.totalCapacity}</span>
                    </div>                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span>Occupied: {hostel.currentOccupancy}/{hostel.totalCapacity}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span>{hostel.floors.length} floors</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Bed className="w-4 h-4 text-gray-500" />
                      <span>{hostel.gender} accommodation</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* Rooms Grid */}
      {selectedHostel && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {getFilteredRooms().map((room) => (            <Card 
              key={room.id} 
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${getRoomStatusColor(room)} ${
                selectedRoom?.id === room.id ? 'ring-2 ring-indigo-500' : ''
              } ${isSelecting ? 'opacity-50' : ''}`}
              onClick={() => room.isAvailable && !room.isReserved && !isSelecting && handleRoomSelect(room)}
            >
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-lg">Room {room.number}</h4>
                    {getRoomStatusIcon(room)}
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3 h-3 text-gray-500" />
                      <span>{room.floorName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-3 h-3 text-gray-500" />
                      <span>Capacity: {room.capacity}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-3 h-3 text-gray-500" />
                      <span>${room.price}/semester</span>
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t">
                    <Badge variant={room.isAvailable && !room.isReserved ? 'default' : 'secondary'}>
                      {getRoomStatusText(room)}
                    </Badge>
                  </div>
                  
                  {room.features && room.features.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {room.features.map((feature, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {selectedHostel && getFilteredRooms().length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No rooms available</h3>
            <p className="text-gray-600">Try adjusting your filters or selecting a different hostel.</p>
          </CardContent>
        </Card>
      )}

      {/* Confirmation Modal */}
      {selectedRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>Confirm Room Selection</CardTitle>
              <CardDescription>
                Are you sure you want to select this room?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <h4 className="font-semibold">Room {selectedRoom.number}</h4>
                  <p className="text-sm text-gray-600">{selectedRoom.hostelName} - {selectedRoom.floorName}</p>
                  <p className="text-sm">Capacity: {selectedRoom.capacity} students</p>
                  <p className="text-lg font-semibold text-indigo-600">${selectedRoom.price}/semester</p>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    <p className="text-sm font-medium text-yellow-800">Payment Required</p>
                  </div>                  <p className="text-sm text-yellow-700 mt-1">
                    {hostelSettings 
                      ? `You must pay within ${hostelSettings.paymentGracePeriod} hours (${Math.round(hostelSettings.paymentGracePeriod / 24)} days) to confirm your room allocation.`
                      : 'You must pay within the specified time period to confirm your room allocation.'
                    }
                  </p>
                </div>
                
                <div className="flex gap-3">                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      setSelectedRoom(null);
                      setIsSelecting(false);
                    }}
                  >
                    Cancel
                  </Button>                  <Button 
                    className="flex-1"
                    onClick={confirmRoomSelection}
                    disabled={isSelecting}
                  >
                    {isSelecting ? 'Selecting...' : 'Confirm Selection'}
                  </Button>
                </div>
              </div>
            </CardContent>          </Card>
        </div>
      )}
      </div>
    </div>
  );
};

export default RoomSelection;
