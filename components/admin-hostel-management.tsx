'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from 'react-toastify';
import {
  Building,
  Plus,
  Edit,
  Trash2,
  Users,
  Bed,
  MapPin,
  DollarSign,
  Settings,
  Lock,
  Unlock,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Database
} from 'lucide-react';
import { Hostel, Room, RoomAllocation, HostelSettings } from '@/types/hostel';
import {
  fetchHostels,
  createHostel,
  updateHostel,
  deleteHostel,
  reserveRoom,
  unreserveRoom,
  fetchHostelSettings,
  updateHostelSettings,
  revokeRoomAllocation,
  addRoomsInRange,
  addFloorToHostel,
  removeRoom,
  removeFloor,
  removeOccupantFromRoom
} from '@/data/appwrite-hostel-data';
import { forceInitializeHostelData } from '@/utils/initialize-hostels';
import { useAppwriteAuth } from '@/hooks/useAppwriteAuth';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

const AdminHostelManagement: React.FC = () => {
  const { user } = useAppwriteAuth();
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHostel, setSelectedHostel] = useState<Hostel | null>(null);
    // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    description: '',
    onConfirm: () => {},
    loading: false
  });
  // Track which occupant is being removed for individual loading states
  const [removingOccupant, setRemovingOccupant] = useState<string | null>(null);

  // Bulk actions state
  const [selectedOccupants, setSelectedOccupants] = useState<Set<string>>(new Set());
  const [bulkActionMode, setBulkActionMode] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [isAddRoomsDialogOpen, setIsAddRoomsDialogOpen] = useState(false);
  const [isAddFloorDialogOpen, setIsAddFloorDialogOpen] = useState(false);
  const [settings, setSettings] = useState<HostelSettings>({
    paymentGracePeriod: 7,
    autoRevokeUnpaidAllocations: true,
    maxRoomCapacity: 4,
    allowMixedGender: false
  });
  const [newHostel, setNewHostel] = useState({
    name: '',
    description: '',
    pricePerSemester: 0,
    gender: 'Mixed' as 'Male' | 'Female' | 'Mixed',
    features: ''
  });

  const [newRoomsForm, setNewRoomsForm] = useState({
    hostelId: '',
    floorId: '',
    startNumber: 1,
    endNumber: 10,
    prefix: '',
    suffix: '',
    capacity: 2,
    gender: 'Mixed' as 'Male' | 'Female' | 'Mixed',
    features: ''
  });
  const [newFloorForm, setNewFloorForm] = useState({
    hostelId: '',
    floorNumber: '',
    floorName: ''
  });
  
  // Initialization state
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);
  const loadData = async () => {
    try {
      const [hostelData, settingsData] = await Promise.all([
        fetchHostels(),
        fetchHostelSettings()
      ]);
        // Calculate current occupancy and total capacity for each hostel
      const hostelsWithOccupancy = hostelData.map(hostel => ({
        ...hostel,
        totalCapacity: hostel.floors.reduce((total, floor) => 
          total + floor.rooms.reduce((floorTotal, room) => floorTotal + room.capacity, 0), 0
        ),
        currentOccupancy: hostel.floors.reduce((total, floor) => 
          total + floor.rooms.reduce((floorTotal, room) => floorTotal + room.occupants.length, 0), 0
        )
      }));
      
      setHostels(hostelsWithOccupancy);
      setSettings(settingsData);
    } catch (error) {
      toast.error('Failed to load data');    } finally {
      setLoading(false);
    }
  };

  const handleManualInitialization = async () => {
    setIsInitializing(true);
    try {
      const result = await forceInitializeHostelData();
      if (result) {
        toast.success('Hostel data initialized successfully!');
        await loadData(); // Reload the data to show the new hostels
      } else {
        toast.error('Failed to initialize hostel data');
      }
    } catch (error) {
      console.error('Initialization error:', error);
      toast.error('Failed to initialize hostel data');
    } finally {
      setIsInitializing(false);
    }
  };

  const handleCreateHostel = async () => {
    try {
      const hostelData: Omit<Hostel, 'id'> = {
        ...newHostel,
        totalCapacity: 0,
        currentOccupancy: 0,
        isActive: true,
        floors: [],
        features: newHostel.features.split(',').map(f => f.trim()).filter(Boolean)
      };

      await createHostel(hostelData);
      toast.success('Hostel created successfully');
      
      setNewHostel({
        name: '',
        description: '',
        pricePerSemester: 0,
        gender: 'Mixed',
        features: ''
      });
      setIsCreateDialogOpen(false);
      loadData();
    } catch (error) {
      toast.error('Failed to create hostel');
    }
  };
  const handleDeleteHostel = async (hostelId: string) => {
    if (window.confirm('Are you sure you want to delete this hostel? This will also remove all related room allocations and cannot be undone.')) {
      try {
        await deleteHostel(hostelId);
        toast.success('Hostel and all related allocations deleted successfully');
        loadData();
      } catch (error) {
        toast.error('Failed to delete hostel');
      }
    }
  };

  const handleToggleHostelStatus = async (hostel: Hostel) => {
    try {
      await updateHostel(hostel.id, { isActive: !hostel.isActive });
      toast.success(`Hostel ${hostel.isActive ? 'deactivated' : 'activated'} successfully`);
      loadData();
    } catch (error) {
      toast.error('Failed to update hostel status');
    }
  };  const handleReserveRoom = async (roomId: string, hostelId: string) => {
    // Find room details for better user feedback
    let roomNumber = '';
    if (selectedHostel) {
      selectedHostel.floors.forEach(floor => {
        floor.rooms.forEach(room => {
          if (room.id === roomId) {
            roomNumber = room.number;
          }
        });
      });
    }

    const days = window.prompt(`Reserve room ${roomNumber} for how many days?`, '30');
    if (days && !isNaN(Number(days))) {
      try {
        const adminEmail = user?.email || 'Unknown Admin';
        
        await reserveRoom(roomId, hostelId, adminEmail, Number(days));
        toast.success(`Room ${roomNumber} reserved successfully for ${days} days`);
        
        // Update selectedHostel state immediately
        if (selectedHostel) {
          const updatedHostel = { ...selectedHostel };
          updatedHostel.floors.forEach(floor => {
            floor.rooms.forEach(room => {
              if (room.id === roomId) {
                room.isReserved = true;
                room.reservedBy = adminEmail;
                room.reservedUntil = new Date(Date.now() + Number(days) * 24 * 60 * 60 * 1000).toISOString();
              }
            });
          });
          setSelectedHostel(updatedHostel);
        }
        
        loadData();
      } catch (error) {
        console.error('Error reserving room:', error);
        toast.error('Failed to reserve room. Please try again.');
      }
    }
  };const handleUnreserveRoom = async (roomId: string, hostelId: string) => {
    // Find room details for better user feedback
    let roomNumber = '';
    if (selectedHostel) {
      selectedHostel.floors.forEach(floor => {
        floor.rooms.forEach(room => {
          if (room.id === roomId) {
            roomNumber = room.number;
          }
        });
      });
    }

    if (window.confirm(`Are you sure you want to unreserve room ${roomNumber}? This will make it available for allocation.`)) {
      try {
        await unreserveRoom(roomId, hostelId);
        toast.success(`Room ${roomNumber} unreserved successfully`);
          // Update selectedHostel state immediately
        if (selectedHostel) {
          const updatedHostel = { ...selectedHostel };
          updatedHostel.floors.forEach(floor => {
            floor.rooms.forEach(room => {
              if (room.id === roomId) {
                room.isReserved = false;
                // Remove the reservation fields entirely instead of setting to undefined
                delete room.reservedBy;
                delete room.reservedUntil;
              }
            });
          });
          setSelectedHostel(updatedHostel);
        }
        
        loadData();
      } catch (error) {
        console.error('Error unreserving room:', error);
        toast.error('Failed to unreserve room. Please try again.');
      }
    }
  };
  const handleUpdateRoomCapacity = async (hostel: Hostel, roomId: string, newCapacity: string) => {
    const capacity = Number(newCapacity);
    if (isNaN(capacity) || capacity < 1 || capacity > settings.maxRoomCapacity) {
      toast.error(`Capacity must be between 1 and ${settings.maxRoomCapacity}`);
      return;
    }

    try {
      const updatedHostel = { ...hostel };
      updatedHostel.floors.forEach(floor => {
        floor.rooms.forEach(room => {
          if (room.id === roomId) {
            room.capacity = capacity;
            // Check if room should be marked as unavailable due to occupancy
            if (room.occupants.length >= capacity) {
              room.isAvailable = false;
            } else {
              room.isAvailable = true;
            }
          }
        });
      });

      await updateHostel(hostel.id, updatedHostel);
      toast.success('Room capacity updated successfully');
      
      // Update selectedHostel state immediately
      if (selectedHostel && selectedHostel.id === hostel.id) {
        setSelectedHostel(updatedHostel);
      }
      
      loadData();
    } catch (error) {
      toast.error('Failed to update room capacity');
    }
  };
  const handleUpdateSettings = async () => {
    try {
      await updateHostelSettings(settings);
      toast.success('Settings updated successfully');
      setIsSettingsDialogOpen(false);
    } catch (error) {
      toast.error('Failed to update settings');
    }
  };

  const handleCheckPaymentDeadlines = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/check-payment-deadlines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_PAYMENT_CHECK_TOKEN || 'default-secure-token'}`
        }
      });
      
      const result = await response.json();
      
      if (response.ok) {
        if (result.revokedCount > 0) {
          toast.success(`Successfully revoked ${result.revokedCount} expired allocations`);
        } else {
          toast.info('No expired allocations found to revoke');
        }
        loadData(); // Refresh hostel data
      } else {
        toast.error(`Failed to check payment deadlines: ${result.message}`);
      }
    } catch (error) {
      toast.error('Failed to check payment deadlines');
    } finally {
      setLoading(false);
    }
  };
  const handleAddRoomsInRange = async () => {
    try {
      if (!newRoomsForm.hostelId || !newRoomsForm.floorId) {
        toast.error('Please select hostel and floor');
        return;
      }

      if (newRoomsForm.startNumber > newRoomsForm.endNumber) {
        toast.error('Start number must be less than or equal to end number');
        return;
      }

      const features = newRoomsForm.features.split(',').map(f => f.trim()).filter(Boolean);

      await addRoomsInRange(
        newRoomsForm.hostelId,
        newRoomsForm.floorId,
        newRoomsForm.startNumber,
        newRoomsForm.endNumber,
        newRoomsForm.prefix,
        newRoomsForm.suffix,
        newRoomsForm.capacity,
        newRoomsForm.gender,
        features
      );

      toast.success(`Rooms ${newRoomsForm.prefix}${newRoomsForm.startNumber}${newRoomsForm.suffix} to ${newRoomsForm.prefix}${newRoomsForm.endNumber}${newRoomsForm.suffix} added successfully`);
      
      // Update selectedHostel state immediately
      if (selectedHostel && selectedHostel.id === newRoomsForm.hostelId) {
        const updatedHostel = { ...selectedHostel };
        const floor = updatedHostel.floors.find(f => f.id === newRoomsForm.floorId);
        if (floor) {
          // Create new rooms to add to the floor
          const newRooms = [];
          let totalCapacityAdded = 0;
          
          for (let i = newRoomsForm.startNumber; i <= newRoomsForm.endNumber; i++) {
            const roomNumber = `${newRoomsForm.prefix}${i}${newRoomsForm.suffix}`;
            const roomId = `${newRoomsForm.hostelId}_${newRoomsForm.floorId}_${roomNumber}`;
            
            // Check if room already exists
            const existingRoom = floor.rooms.find(r => r.number === roomNumber);
            if (!existingRoom) {
              const newRoom = {
                id: roomId,
                number: roomNumber,
                floor: floor.name,
                floorName: floor.name,
                hostelName: updatedHostel.name,
                price: updatedHostel.pricePerSemester,
                capacity: newRoomsForm.capacity,
                occupants: [],
                gender: newRoomsForm.gender,
                isReserved: false,
                isAvailable: true,
                features
              };
              
              newRooms.push(newRoom);
              totalCapacityAdded += newRoomsForm.capacity;
            }
          }
          
          // Add new rooms to the floor
          floor.rooms.push(...newRooms);
          
          // Update total capacity
          updatedHostel.totalCapacity += totalCapacityAdded;
          
          setSelectedHostel(updatedHostel);
        }
      }
      
      setNewRoomsForm({
        hostelId: '',
        floorId: '',
        startNumber: 1,
        endNumber: 10,
        prefix: '',
        suffix: '',
        capacity: 2,
        gender: 'Mixed',
        features: ''
      });
      setIsAddRoomsDialogOpen(false);
      loadData();
    } catch (error) {
      toast.error('Failed to add rooms');
    }
  };

  const handleAddFloor = async () => {
    try {
      if (!newFloorForm.hostelId || !newFloorForm.floorNumber || !newFloorForm.floorName) {
        toast.error('Please fill in all floor details');
        return;
      }

      await addFloorToHostel(
        newFloorForm.hostelId,
        newFloorForm.floorNumber,
        newFloorForm.floorName
      );

      toast.success(`Floor ${newFloorForm.floorName} added successfully`);
      
      setNewFloorForm({
        hostelId: '',
        floorNumber: '',
        floorName: ''
      });
      setIsAddFloorDialogOpen(false);
      loadData();
    } catch (error) {
      toast.error('Failed to add floor');
    }
  };  const handleRemoveRoom = async (hostelId: string, roomId: string, roomNumber: string) => {
    if (window.confirm(`Are you sure you want to remove room ${roomNumber}? This will also remove all related room allocations and cannot be undone.`)) {
      try {
        await removeRoom(hostelId, roomId);
        toast.success(`Room ${roomNumber} and all related allocations removed successfully`);
        
        // Update selectedHostel state immediately
        if (selectedHostel && selectedHostel.id === hostelId) {
          const updatedHostel = { ...selectedHostel };
          updatedHostel.floors.forEach(floor => {
            const roomIndex = floor.rooms.findIndex(r => r.id === roomId);
            if (roomIndex !== -1) {
              floor.rooms.splice(roomIndex, 1);
            }
          });
          setSelectedHostel(updatedHostel);
        }
        
        loadData();
      } catch (error) {
        toast.error('Failed to remove room');
      }
    }
  };

  const handleRemoveFloor = async (hostelId: string, floorId: string, floorName: string) => {
    if (window.confirm(`Are you sure you want to remove floor "${floorName}"? This will remove all rooms in this floor and their related allocations. This action cannot be undone.`)) {
      try {
        await removeFloor(hostelId, floorId);
        toast.success(`Floor "${floorName}" and all related rooms and allocations removed successfully`);
        
        // Update selectedHostel state immediately
        if (selectedHostel && selectedHostel.id === hostelId) {
          const updatedHostel = { ...selectedHostel };
          const floorIndex = updatedHostel.floors.findIndex(f => f.id === floorId);
          if (floorIndex !== -1) {
            updatedHostel.floors.splice(floorIndex, 1);
          }
          setSelectedHostel(updatedHostel);
        }
        
        loadData();
      } catch (error) {
        toast.error('Failed to remove floor');
      }
    }
  };const handleRemoveOccupant = (hostel: Hostel, roomId: string, occupantRegNumber: string) => {
    // Find the room to get more details for the confirmation dialog
    let roomNumber = '';
    hostel.floors.forEach(floor => {
      floor.rooms.forEach(room => {
        if (room.id === roomId) {
          roomNumber = room.number;
        }
      });
    });

    setConfirmDialog({
      open: true,
      title: 'Remove Occupant',
      description: `Are you sure you want to remove ${occupantRegNumber} from room ${roomNumber}? This will also remove their room allocation record and cannot be undone.`,
      loading: false,
      onConfirm: async () => {
        const occupantKey = `${roomId}-${occupantRegNumber}`;
        setRemovingOccupant(occupantKey);
        setConfirmDialog(prev => ({ ...prev, loading: true }));        try {
          await removeOccupantFromRoom(hostel.id, roomId, occupantRegNumber);
          
          // Update selectedHostel state immediately
          if (selectedHostel) {
            const updatedHostel = {
              ...selectedHostel,
              floors: selectedHostel.floors.map(floor => ({
                ...floor,
                rooms: floor.rooms.map(room => {
                  if (room.id === roomId) {
                    return {
                      ...room,
                      occupants: room.occupants.filter(regNumber => regNumber !== occupantRegNumber)
                    };
                  }
                  return room;
                })
              }))
            };
            setSelectedHostel(updatedHostel);
          }
          
          toast.success(`${occupantRegNumber} removed from room ${roomNumber} successfully`);
          loadData();
        } catch (error) {
          console.error('Error removing occupant:', error);
          toast.error('Failed to remove occupant. Please try again.');
        } finally {
          setRemovingOccupant(null);
          setConfirmDialog(prev => ({ ...prev, loading: false }));
        }
      }
    });
  };

  const handleBulkRemoveOccupants = () => {
    const occupantList = Array.from(selectedOccupants);
    if (occupantList.length === 0) return;

    setConfirmDialog({
      open: true,
      title: 'Remove Multiple Occupants',
      description: `Are you sure you want to remove ${occupantList.length} occupant${occupantList.length > 1 ? 's' : ''} from their rooms? This will also remove their room allocation records and cannot be undone.`,
      loading: false,
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, loading: true }));
          try {
          const removePromises = occupantList.map(async (occupantKey) => {
            const [roomId, regNumber] = occupantKey.split('-');
            const hostel = selectedHostel;
            if (hostel) {
              await removeOccupantFromRoom(hostel.id, roomId, regNumber);
            }
          });

          await Promise.all(removePromises);
          
          // Update selectedHostel state immediately
          if (selectedHostel) {
            const updatedHostel = { ...selectedHostel };
            updatedHostel.floors.forEach(floor => {
              floor.rooms.forEach(room => {
                occupantList.forEach(occupantKey => {
                  const [roomId, regNumber] = occupantKey.split('-');
                  if (room.id === roomId) {
                    room.occupants = room.occupants.filter(occ => occ !== regNumber);
                  }
                });
              });
            });
            setSelectedHostel(updatedHostel);
          }
          
          toast.success(`${occupantList.length} occupant${occupantList.length > 1 ? 's' : ''} removed successfully`);
          setSelectedOccupants(new Set());
          setBulkActionMode(false);
          loadData();
        } catch (error) {
          console.error('Error removing occupants:', error);
          toast.error('Failed to remove some occupants. Please try again.');
        } finally {
          setConfirmDialog(prev => ({ ...prev, loading: false }));
        }
      }
    });
  };

  const toggleOccupantSelection = (roomId: string, regNumber: string) => {
    const occupantKey = `${roomId}-${regNumber}`;
    const newSelected = new Set(selectedOccupants);
    
    if (newSelected.has(occupantKey)) {
      newSelected.delete(occupantKey);
    } else {
      newSelected.add(occupantKey);
    }
    
    setSelectedOccupants(newSelected);
  };

  const selectAllOccupantsInRoom = (roomId: string, occupants: string[]) => {
    const newSelected = new Set(selectedOccupants);
    occupants.forEach(regNumber => {
      newSelected.add(`${roomId}-${regNumber}`);
    });
    setSelectedOccupants(newSelected);
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
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="p-2 sm:p-4 lg:px-6 lg:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Hostel Management</h1>
              <p className="text-sm sm:text-base text-gray-600">Manage hostels, rooms, and allocations</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
          <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </DialogTrigger>            <DialogContent className="w-[90vw] max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Hostel Settings</DialogTitle>
                <DialogDescription>
                  Configure global hostel management settings
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                <div>
                  <Label htmlFor="gracePeriod">Payment Grace Period (hours)</Label>
                  <Input
                    id="gracePeriod"
                    type="number"
                    value={settings.paymentGracePeriod}
                    onChange={(e) => setSettings({
                      ...settings,
                      paymentGracePeriod: Number(e.target.value)
                    })}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Grace period in hours after payment deadline. Total time = deadline + grace period.
                  </p>
                </div>
                <div>
                  <Label htmlFor="maxCapacity">Maximum Room Capacity</Label>
                  <Input
                    id="maxCapacity"
                    type="number"
                    value={settings.maxRoomCapacity}
                    onChange={(e) => setSettings({
                      ...settings,
                      maxRoomCapacity: Number(e.target.value)
                    })}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="autoRevoke"
                    checked={settings.autoRevokeUnpaidAllocations}
                    onChange={(e) => setSettings({
                      ...settings,
                      autoRevokeUnpaidAllocations: e.target.checked
                    })}
                  />
                  <Label htmlFor="autoRevoke">Auto-revoke unpaid allocations</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="mixedGender"
                    checked={settings.allowMixedGender}
                    onChange={(e) => setSettings({
                      ...settings,
                      allowMixedGender: e.target.checked
                    })}
                  />
                  <Label htmlFor="mixedGender">Allow mixed gender rooms</Label>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button onClick={handleUpdateSettings} className="flex-1">
                    Update Settings
                  </Button>
                  <Button 
                    onClick={handleCheckPaymentDeadlines} 
                    variant="outline" 
                    className="flex-1"
                    disabled={loading}
                  >
                    {loading ? 'Checking...' : 'Check Payment Deadlines Now'}
                  </Button>
                </div>              </div>
            </DialogContent>
          </Dialog>

          <Button 
            variant="outline" 
            onClick={handleManualInitialization}
            disabled={isInitializing}
          >
            <Database className="w-4 h-4 mr-2" />
            {isInitializing ? 'Initializing...' : 'Initialize Data'}
          </Button>

          <Dialog open={isAddRoomsDialogOpen} onOpenChange={setIsAddRoomsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Bed className="w-4 h-4 mr-2" />
                Add Rooms
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[90vw] max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Rooms in Range</DialogTitle>
                <DialogDescription>
                  Add multiple rooms at once with sequential numbering
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                <div>
                  <Label htmlFor="hostelSelect">Select Hostel</Label>
                  <Select value={newRoomsForm.hostelId} onValueChange={(value) => setNewRoomsForm({ ...newRoomsForm, hostelId: value, floorId: '' })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select hostel" />
                    </SelectTrigger>
                    <SelectContent>
                      {hostels.map((hostel) => (
                        <SelectItem key={hostel.id} value={hostel.id}>
                          {hostel.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="floorSelect">Select Floor</Label>
                  <Select value={newRoomsForm.floorId} onValueChange={(value) => setNewRoomsForm({ ...newRoomsForm, floorId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select floor" />
                    </SelectTrigger>
                    <SelectContent>
                      {newRoomsForm.hostelId && hostels.find(h => h.id === newRoomsForm.hostelId)?.floors.map((floor) => (
                        <SelectItem key={floor.id} value={floor.id}>
                          {floor.name}
                        </SelectItem>
                      ))}

                      {/* Add option to create new floor */}
                      <SelectItem value="add-floor" disabled>
                        + Add New Floor
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startNumber">Start Number</Label>
                    <Input
                      id="startNumber"
                      type="number"
                      value={newRoomsForm.startNumber}
                      onChange={(e) => setNewRoomsForm({ ...newRoomsForm, startNumber: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endNumber">End Number</Label>
                    <Input
                      id="endNumber"
                      type="number"
                      value={newRoomsForm.endNumber}
                      onChange={(e) => setNewRoomsForm({ ...newRoomsForm, endNumber: Number(e.target.value) })}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="prefix">Prefix (optional)</Label>
                    <Input
                      id="prefix"
                      value={newRoomsForm.prefix}
                      onChange={(e) => setNewRoomsForm({ ...newRoomsForm, prefix: e.target.value })}
                      placeholder="e.g., A"
                    />
                  </div>
                  <div>
                    <Label htmlFor="suffix">Suffix (optional)</Label>
                    <Input
                      id="suffix"
                      value={newRoomsForm.suffix}
                      onChange={(e) => setNewRoomsForm({ ...newRoomsForm, suffix: e.target.value })}
                      placeholder="e.g., B"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="roomCapacity">Room Capacity</Label>
                  <Input
                    id="roomCapacity"
                    type="number"
                    value={newRoomsForm.capacity}
                    onChange={(e) => setNewRoomsForm({ ...newRoomsForm, capacity: Number(e.target.value) })}
                    min="1"
                    max={settings.maxRoomCapacity}
                  />
                </div>
                
                <div>
                  <Label htmlFor="roomGender">Gender</Label>
                  <Select value={newRoomsForm.gender} onValueChange={(value: 'Male' | 'Female' | 'Mixed') => setNewRoomsForm({ ...newRoomsForm, gender: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mixed">Mixed</SelectItem>
                      <SelectItem value="Male">Male Only</SelectItem>
                      <SelectItem value="Female">Female Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="roomFeatures">Features (comma separated)</Label>
                  <Input
                    id="roomFeatures"
                    value={newRoomsForm.features}
                    onChange={(e) => setNewRoomsForm({ ...newRoomsForm, features: e.target.value })}
                    placeholder="Private bathroom, Balcony"
                  />
                </div>
                
                <div className="text-sm text-gray-600">
                  Preview: {newRoomsForm.prefix}{newRoomsForm.startNumber}{newRoomsForm.suffix} to {newRoomsForm.prefix}{newRoomsForm.endNumber}{newRoomsForm.suffix}
                </div>
                
                <Button onClick={handleAddRoomsInRange} className="w-full">
                  Add {newRoomsForm.endNumber - newRoomsForm.startNumber + 1} Rooms
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddFloorDialogOpen} onOpenChange={setIsAddFloorDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Building className="w-4 h-4 mr-2" />
                Add Floor
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[90vw] max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Floor</DialogTitle>
                <DialogDescription>
                  Add a new floor to an existing hostel
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                <div>
                  <Label htmlFor="floorHostelSelect">Select Hostel</Label>
                  <Select value={newFloorForm.hostelId} onValueChange={(value) => setNewFloorForm({ ...newFloorForm, hostelId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select hostel" />
                    </SelectTrigger>
                    <SelectContent>
                      {hostels.map((hostel) => (
                        <SelectItem key={hostel.id} value={hostel.id}>
                          {hostel.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="floorNumber">Floor Number</Label>
                  <Input
                    id="floorNumber"
                    value={newFloorForm.floorNumber}
                    onChange={(e) => setNewFloorForm({ ...newFloorForm, floorNumber: e.target.value })}
                    placeholder="e.g., 1, G, B1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="floorName">Floor Name</Label>
                  <Input
                    id="floorName"
                    value={newFloorForm.floorName}
                    onChange={(e) => setNewFloorForm({ ...newFloorForm, floorName: e.target.value })}
                    placeholder="e.g., Ground Floor, First Floor"
                  />
                </div>
                
                <Button onClick={handleAddFloor} className="w-full">
                  Add Floor
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Hostel
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[90vw] max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Hostel</DialogTitle>
                <DialogDescription>
                  Add a new hostel to the system
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                <div>
                  <Label htmlFor="name">Hostel Name</Label>
                  <Input
                    id="name"
                    value={newHostel.name}
                    onChange={(e) => setNewHostel({ ...newHostel, name: e.target.value })}
                    placeholder="Enter hostel name"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newHostel.description}
                    onChange={(e) => setNewHostel({ ...newHostel, description: e.target.value })}
                    placeholder="Enter description"
                  />
                </div>
                <div>
                  <Label htmlFor="price">Price per Semester ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={newHostel.pricePerSemester}
                    onChange={(e) => setNewHostel({ ...newHostel, pricePerSemester: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={newHostel.gender} onValueChange={(value: 'Male' | 'Female' | 'Mixed') => setNewHostel({ ...newHostel, gender: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mixed">Mixed</SelectItem>
                      <SelectItem value="Male">Male Only</SelectItem>
                      <SelectItem value="Female">Female Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="features">Features (comma separated)</Label>
                  <Input
                    id="features"
                    value={newHostel.features}
                    onChange={(e) => setNewHostel({ ...newHostel, features: e.target.value })}
                    placeholder="WiFi, Security, Laundry"
                  />
                </div>
                <Button onClick={handleCreateHostel} className="w-full">
                  Create Hostel                </Button>
              </div>
            </DialogContent>
          </Dialog>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-2 sm:p-4 lg:p-6">
        {/* Hostels Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {hostels.map((hostel) => (
          <Card key={hostel.id} className={hostel.isActive ? '' : 'opacity-60'}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base sm:text-lg">{hostel.name}</CardTitle>
                <Badge variant={hostel.isActive ? 'default' : 'secondary'}>
                  {hostel.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <CardDescription className="text-sm">{hostel.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Building className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                    <span>Capacity: {hostel.totalCapacity}</span>
                  </div>                  <div className="flex items-center gap-1 sm:gap-2">
                    <Users className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                    <span>Occupied: {hostel.currentOccupancy}/{hostel.totalCapacity}</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                    <span>${hostel.pricePerSemester}</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                    <span>{hostel.floors.length} floors</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {hostel.features.map((feature, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedHostel(hostel)}
                    className="flex-1"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View Rooms
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleHostelStatus(hostel)}
                      className="flex-1"
                    >
                      {hostel.isActive ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteHostel(hostel.id)}
                      className="flex-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* No hostels message */}
        {hostels.length === 0 && (
          <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-10">
            <p className="text-gray-500">No hostels found. Please add a new hostel.</p>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(true)}
              className="mt-4"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Hostel
            </Button>
          </div>
        )}
      </div>

      {/* Room Management Modal */}
      {selectedHostel && (
        <Dialog open={!!selectedHostel} onOpenChange={() => setSelectedHostel(null)}>          <DialogContent className="w-[95vw] max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader className="flex-shrink-0 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <DialogTitle className="text-lg sm:text-xl">{selectedHostel.name} - Room Management</DialogTitle>
                  <DialogDescription className="text-sm">
                    Manage individual rooms, capacity, and reservations
                  </DialogDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  {bulkActionMode && selectedOccupants.size > 0 && (
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={handleBulkRemoveOccupants}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      <span className="hidden sm:inline">Remove {selectedOccupants.size} Selected</span>
                      <span className="sm:hidden">Remove ({selectedOccupants.size})</span>
                    </Button>
                  )}
                  <Button 
                    variant={bulkActionMode ? "default" : "outline"} 
                    size="sm"
                    onClick={() => {
                      setBulkActionMode(!bulkActionMode);
                      setSelectedOccupants(new Set());
                    }}
                  >
                    <Users className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">{bulkActionMode ? 'Exit Bulk Mode' : 'Bulk Actions'}</span>
                    <span className="sm:hidden">{bulkActionMode ? 'Exit' : 'Bulk'}</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setNewRoomsForm({ ...newRoomsForm, hostelId: selectedHostel.id });
                      setIsAddRoomsDialogOpen(true);
                    }}
                  >
                    <Bed className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">Add Rooms</span>
                    <span className="sm:hidden">Rooms</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setNewFloorForm({ ...newFloorForm, hostelId: selectedHostel.id });
                      setIsAddFloorDialogOpen(true);
                    }}
                  >
                    <Building className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">Add Floor</span>
                    <span className="sm:hidden">Floor</span>
                  </Button>
                </div>
              </div>
            </DialogHeader>
              <div className="space-y-4 sm:space-y-6 flex-1 overflow-y-auto px-1 sm:pr-2">
              {selectedHostel.floors.map((floor) => (
                <div key={floor.id} className="space-y-3 sm:space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-2">
                    <h3 className="text-base sm:text-lg font-semibold">{floor.name}</h3>                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRemoveFloor(selectedHostel.id, floor.id, floor.name)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 w-full sm:w-fit text-xs sm:text-sm"
                      disabled={floor.rooms.some(room => room.occupants.length > 0)}
                      title={floor.rooms.some(room => room.occupants.length > 0) ? "Cannot remove floor with occupied rooms" : `Remove floor "${floor.name}"`}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      <span className="hidden sm:inline">Remove Floor</span>
                      <span className="sm:hidden">Remove</span>
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                    {floor.rooms.map((room) => (
                      <Card key={room.id} className={getRoomStatusColor(room)}>                        <CardContent className="p-2 sm:p-3">
                          <div className="space-y-2 sm:space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold text-sm sm:text-base">Room {room.number}</h4>
                              {getRoomStatusIcon(room)}
                            </div>
                            
                            <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                              <div className="flex items-center justify-between">
                                <span>Capacity:</span>                                <Input
                                  type="number"
                                  value={room.capacity}
                                  onChange={(e) => handleUpdateRoomCapacity(selectedHostel, room.id, e.target.value)}
                                  className="w-10 sm:w-12 h-5 sm:h-6 text-xs"
                                  min="1"
                                  max={settings.maxRoomCapacity}
                                />
                              </div>
                              <div className="flex items-center justify-between">
                                <span>Occupants:</span>
                                <span>{room.occupants.length}</span>
                              </div>
                              {room.isReserved && (
                                <div className="text-yellow-600 text-xs">
                                  <p>Reserved by: {room.reservedBy}</p>
                                  <p>Until: {room.reservedUntil ? new Date(room.reservedUntil).toLocaleDateString() : 'N/A'}</p>
                                </div>
                              )}
                            </div>
                              <div className="flex flex-col gap-1">
                              <div className="flex gap-1">
                                {room.isReserved ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleUnreserveRoom(room.id, selectedHostel.id)}
                                    className="flex-1 text-xs h-7"
                                  >
                                    <Unlock className="w-3 h-3 mr-1" />
                                    <span className="hidden sm:inline">Unreserve</span>
                                    <span className="sm:hidden">Unres.</span>
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleReserveRoom(room.id, selectedHostel.id)}
                                    className="flex-1 text-xs h-7"
                                  >
                                    <Lock className="w-3 h-3 mr-1" />
                                    <span className="hidden sm:inline">Reserve</span>
                                    <span className="sm:hidden">Res.</span>
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRemoveRoom(selectedHostel.id, room.id, room.number)}
                                  className="px-2 h-7"
                                  disabled={room.occupants.length > 0}
                                  title={room.occupants.length > 0 ? "Cannot remove occupied room" : "Remove room"}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>

                            {room.occupants.length > 0 && (                              <div className="pt-2 sm:pt-3 border-t border-gray-200">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                                  <p className="text-xs font-semibold text-gray-700">Occupants ({room.occupants.length}/{room.capacity})</p>
                                  <div className="flex items-center gap-1 sm:gap-2">
                                    {bulkActionMode && room.occupants.length > 0 && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => selectAllOccupantsInRoom(room.id, room.occupants)}
                                        className="h-5 sm:h-6 text-xs px-1 sm:px-2"
                                      >
                                        <span className="hidden sm:inline">Select All</span>
                                        <span className="sm:hidden">All</span>
                                      </Button>
                                    )}
                                    <Badge variant="outline" className="text-xs px-1 py-0">
                                      {room.capacity - room.occupants.length} left
                                    </Badge>
                                  </div>
                                </div>                                <div className="space-y-1 sm:space-y-2">
                                  {room.occupants.map((regNumber, index) => {
                                    const occupantKey = `${room.id}-${regNumber}`;
                                    const isRemoving = removingOccupant === occupantKey;
                                    const isSelected = selectedOccupants.has(occupantKey);
                                    
                                    return (
                                      <div 
                                        key={index} 
                                        className={`flex items-center justify-between p-1.5 sm:p-2 rounded-md border transition-colors ${
                                          isSelected 
                                            ? 'bg-blue-50 border-blue-200' 
                                            : 'bg-gray-50 border-gray-200'
                                        } ${bulkActionMode ? 'cursor-pointer hover:bg-blue-50' : ''}`}
                                        onClick={bulkActionMode ? () => toggleOccupantSelection(room.id, regNumber) : undefined}
                                      >
                                        <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
                                          {bulkActionMode && (
                                            <input
                                              type="checkbox"
                                              checked={isSelected}
                                              onChange={() => toggleOccupantSelection(room.id, regNumber)}
                                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"
                                              onClick={(e) => e.stopPropagation()}
                                            />
                                          )}
                                          <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full flex-shrink-0 ${isRemoving ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}></div>
                                          <span className="text-xs font-medium text-gray-900 truncate">{regNumber}</span>
                                          {isRemoving && (
                                            <span className="text-xs text-yellow-600 italic hidden sm:inline">Removing...</span>
                                          )}
                                        </div>                                        {!bulkActionMode && (
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleRemoveOccupant(selectedHostel, room.id, regNumber)}
                                            className="h-5 w-5 sm:h-6 sm:w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                                            title={`Remove ${regNumber} from room`}
                                            disabled={isRemoving}
                                          >
                                            {isRemoving ? (
                                              <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-red-300 border-t-red-500 rounded-full animate-spin"></div>
                                            ) : (
                                              <XCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                                            )}
                                          </Button>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
        loading={confirmDialog.loading}
        variant="destructive"
        confirmText="Remove"
        cancelText="Cancel"
      />
      </div>
    </div>
  );
};

export default AdminHostelManagement;
